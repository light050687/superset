# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""DAO для операций над папками каталога и их элементами."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from sqlalchemy import func, select

from superset import db
from superset.catalog_folders.exceptions import (
    CatalogFolderCannotDeleteDefaultError,
    CatalogFolderCyclicError,
    CatalogFolderDefaultAlreadyExistsError,
    CatalogFolderInvalidParentError,
    CatalogFolderItemInvalidObjectError,
    CatalogFolderNotFoundError,
)
from superset.catalog_folders.models import (
    CatalogFolder,
    CatalogFolderItem,
    CatalogObjectType,
)

# Имя дефолтной папки, создаётся в миграции c3d4e5f6a7b8.
# Используется как fallback, если is_default-папка по какой-то причине отсутствует
# (например, в свежесозданной БД без миграции — не должно случаться в проде).
DEFAULT_FOLDER_NAME = "Без департамента"
DEFAULT_FOLDER_COLOR = "#737373"

logger = logging.getLogger(__name__)


# Сопоставление типа объекта с таблицей Superset для валидации existence.
# AI-документы/таблицы живут вне Superset, поэтому не валидируются здесь
# (создаются и связываются Univer-адаптером).
_VALIDATED_OBJECT_TABLES: dict[CatalogObjectType, str] = {
    CatalogObjectType.DASHBOARD: "dashboards",
    CatalogObjectType.CHART: "slices",
    CatalogObjectType.DATASET: "tables",
    CatalogObjectType.SAVED_QUERY: "saved_query",
}


class CatalogFolderDAO:
    """Набор операций над деревом папок каталога.

    Все мутирующие операции требуют вызова `db.session.commit()` извне
    (FAB API делает это в command-слое).
    """

    # ───────── дерево ─────────

    @staticmethod
    def get_tree(scope: str | None = None) -> list[dict[str, Any]]:
        """Возвращает плоский список всех папок + суммарный count + per-type.

        Args:
            scope: если задан ('dashboard'|'chart'), отдаём только папки
                с таким scope плюс все shared (`scope IS NULL`) — чтобы
                дефолтная папка «Без департамента» была видна в обоих
                режимах. Если None — возвращаем все (для админ-интерфейса
                или тестов).

        Per-type-разбивка нужна фронтенду, чтобы показать «1 дашборд · 7
        чартов · 26 датасетов» вместо непрозрачного «34 объекта» — без
        breakdown юзер не понимает, почему в списке дашбордов 1 шт, а в
        папке «38 объектов».
        """
        query = db.session.query(CatalogFolder)
        if scope is not None:
            # Видим папки своего scope + shared (NULL).
            query = query.filter(
                (CatalogFolder.scope == scope) | (CatalogFolder.scope.is_(None))
            )
        folders = query.order_by(
            CatalogFolder.parent_id, CatalogFolder.position, CatalogFolder.id
        ).all()
        # Общий счётчик
        totals = dict(
            db.session.query(
                CatalogFolderItem.folder_id, func.count(CatalogFolderItem.id)
            )
            .group_by(CatalogFolderItem.folder_id)
            .all()
        )
        # Per-type: (folder_id, object_type) -> count
        per_type_rows = (
            db.session.query(
                CatalogFolderItem.folder_id,
                CatalogFolderItem.object_type,
                func.count(CatalogFolderItem.id),
            )
            .group_by(CatalogFolderItem.folder_id, CatalogFolderItem.object_type)
            .all()
        )
        per_type: dict[int, dict[str, int]] = {}
        for folder_id, obj_type, cnt in per_type_rows:
            per_type.setdefault(folder_id, {})[obj_type.value] = int(cnt)

        return [
            {
                "id": f.id,
                "parent_id": f.parent_id,
                "name": f.name,
                "description": f.description,
                "color": f.color,
                "position": f.position,
                "scope": f.scope,
                "is_default": bool(f.is_default),
                "item_count": int(totals.get(f.id, 0)),
                "item_counts_by_type": per_type.get(f.id, {}),
            }
            for f in folders
        ]

    # ───────── дефолтная папка ─────────

    @staticmethod
    def get_default() -> CatalogFolder | None:
        """Возвращает дефолтную папку «Без департамента», если она существует.

        В проде папка создаётся миграцией c3d4e5f6a7b8. Если функция возвращает
        None — миграция не прогонялась или папку ошибочно удалили через БД.
        """
        return (
            db.session.query(CatalogFolder)
            .filter(CatalogFolder.is_default.is_(True))
            .one_or_none()
        )

    @classmethod
    def ensure_default(cls) -> CatalogFolder:
        """Возвращает дефолтную папку, создавая её при необходимости.

        Используется для self-healing: если папка пропала (например, удалена
        через прямой SQL или миграция не запустилась), функция воссоздаёт её.
        """
        folder = cls.get_default()
        if folder is not None:
            return folder
        folder = CatalogFolder(
            name=DEFAULT_FOLDER_NAME,
            parent_id=None,
            color=DEFAULT_FOLDER_COLOR,
            position=10_000,
            is_default=True,
            description=(
                "Автоматическая папка для объектов, не привязанных ни к какому "
                "департаменту. Удалить нельзя."
            ),
        )
        db.session.add(folder)
        db.session.flush()
        return folder

    # ───────── валидация дерева ─────────

    @staticmethod
    def _get_descendant_ids(folder_id: int) -> set[int]:
        """Множество id всех потомков — используется для проверки циклов."""
        result: set[int] = set()
        frontier = {folder_id}
        while frontier:
            rows = (
                db.session.query(CatalogFolder.id)
                .filter(CatalogFolder.parent_id.in_(frontier))
                .all()
            )
            next_layer = {row[0] for row in rows} - result
            if not next_layer:
                break
            result |= next_layer
            frontier = next_layer
        return result

    @classmethod
    def _validate_parent(
        cls, folder_id: int | None, new_parent_id: int | None
    ) -> None:
        """Защита от циклов и от parent = self."""
        if new_parent_id is None:
            return
        if folder_id is not None and new_parent_id == folder_id:
            raise CatalogFolderInvalidParentError()
        parent = db.session.get(CatalogFolder, new_parent_id)
        if parent is None:
            raise CatalogFolderInvalidParentError()
        if folder_id is not None:
            descendants = cls._get_descendant_ids(folder_id)
            if new_parent_id in descendants:
                raise CatalogFolderCyclicError()

    # ───────── CRUD ─────────

    @classmethod
    def create(cls, payload: dict[str, Any]) -> CatalogFolder:
        # Запрещаем создавать вторую is_default папку через API —
        # флаг управляется только миграцией и ensure_default().
        if payload.get("is_default") and cls.get_default() is not None:
            raise CatalogFolderDefaultAlreadyExistsError()
        cls._validate_parent(None, payload.get("parent_id"))
        # scope у дочерних папок наследуется от родителя, если явно не задан —
        # так юзер не может случайно создать dashboard-папку внутри
        # chart-дерева (и наоборот). Scope root-папок задаёт клиент явно.
        parent_id = payload.get("parent_id")
        scope = payload.get("scope")
        if scope is None and parent_id is not None:
            parent = db.session.get(CatalogFolder, parent_id)
            if parent is not None and parent.scope is not None:
                scope = parent.scope
        folder = CatalogFolder(
            name=payload["name"],
            parent_id=parent_id,
            description=payload.get("description"),
            color=payload.get("color"),
            position=int(payload.get("position", 0)),
            scope=scope,
        )
        db.session.add(folder)
        db.session.flush()
        return folder

    @classmethod
    def update(cls, folder_id: int, payload: dict[str, Any]) -> CatalogFolder:
        folder = db.session.get(CatalogFolder, folder_id)
        if folder is None:
            raise CatalogFolderNotFoundError()
        if "parent_id" in payload:
            cls._validate_parent(folder_id, payload["parent_id"])
            folder.parent_id = payload["parent_id"]
        for field in ("name", "description", "color", "position", "scope"):
            if field in payload:
                setattr(folder, field, payload[field])
        db.session.flush()
        return folder

    @classmethod
    def delete(
        cls,
        folder_id: int,
        cascade: bool = False,
        wrapper_name: str | None = None,
    ) -> None:
        """Удалить папку каталога, сохранив объекты каталога как данность.

        Объекты (дашборды/чарты/датасеты) НЕ удаляются никогда — каталог
        это только организационная структура поверх существующих сущностей
        Superset.

        Модель «обёртки» (wrapper) в соответствии с мокапом
        analytics-floating-dock.html → deleteDept/deleteSub/deleteFolderCat:

        При удалении папки с содержимым мы создаём/переиспользуем ПАПКУ-
        ОБЁРТКУ на ТОМ ЖЕ уровне иерархии, что и удаляемая (sibling), а её
        содержимое — подпапки и items — переезжает внутрь обёртки:

        - Для root-папки (parent_id=None) обёртка — это is_default-папка
          «Без департамента». Одна на всю систему (enforced миграцией).
        - Для не-root папок обёртка — sibling с именем `wrapper_name`
          (например «Без подраздела», «Без папки»). Если такой sibling уже
          есть — переиспользуем. Иначе создаём.

        Режимы:
        - cascade=False («Сохранить структуру»): прямые подпапки
          удаляемой папки перевешиваются на обёртку; items тоже едут
          внутрь обёртки. Внутренняя иерархия подпапок не трогается.
        - cascade=True («Оставить только объекты»): все потомки (рекурсивно)
          удаляются; items из папки и всех её потомков плоским списком
          переезжают в обёртку.

        Args:
            folder_id: id папки, которую удаляем.
            cascade: если True — рекурсивно удаляем подпапки.
            wrapper_name: имя обёртки-папки. Для root используется для
                синхронизации имени is_default (если оно отличается).
                Для не-root — имя sibling-обёртки. Если None и папка не
                пустая, fallback на «Без <parent.name>» или просто на
                родительскую папку (legacy-поведение).
        """
        folder = db.session.get(CatalogFolder, folder_id)
        if folder is None:
            raise CatalogFolderNotFoundError()
        if folder.is_default:
            # Дефолтная папка — системная, её удаление сломало бы back-fill
            # для осиротевших объектов. API возвращает 400.
            raise CatalogFolderCannotDeleteDefaultError()

        # Считаем содержимое: прямые подпапки + любые items внутри
        # (прямые + во всей подиерархии).
        direct_children = (
            db.session.query(CatalogFolder)
            .filter(CatalogFolder.parent_id == folder_id)
            .all()
        )
        descendant_ids = cls._get_descendant_ids(folder_id)
        all_folder_ids_in_subtree = list(descendant_ids) + [folder_id]
        any_item_in_subtree = (
            db.session.query(CatalogFolderItem.id)
            .filter(CatalogFolderItem.folder_id.in_(all_folder_ids_in_subtree))
            .first()
            is not None
        )
        has_content = bool(direct_children) or any_item_in_subtree

        if not has_content:
            # Пустая папка — просто удаляем без создания обёртки.
            db.session.delete(folder)
            db.session.flush()
            return

        # Находим/создаём папку-обёртку на ТОМ ЖЕ уровне.
        wrapper = cls._resolve_wrapper(folder, wrapper_name)

        if cascade:
            # «Оставить только объекты»: все items из подиерархии → wrapper,
            # все подпапки удаляем. Сама папка удалится ниже.
            if wrapper.id not in all_folder_ids_in_subtree:
                cls._move_items_to_folder(
                    all_folder_ids_in_subtree, wrapper.id
                )
            for desc_id in sorted(descendant_ids, reverse=True):
                desc = db.session.get(CatalogFolder, desc_id)
                if desc is not None:
                    db.session.delete(desc)
        else:
            # «Сохранить структуру»: прямые подпапки перевешиваем на
            # wrapper, прямые items тоже → wrapper.
            if wrapper.id != folder_id:
                cls._move_items_to_folder([folder_id], wrapper.id)
            for child in direct_children:
                child.parent_id = wrapper.id
            # Flush ДО delete(folder): иначе SQLAlchemy может эмитировать
            # DELETE catalog_folder WHERE id=folder_id раньше UPDATE
            # children SET parent_id=wrapper.id, и FK ON DELETE SET NULL
            # перезатрёт новый parent_id на NULL (см. memory:
            # feedback_sqlalchemy_reparent_before_delete).
            if direct_children:
                db.session.flush()

        db.session.delete(folder)
        db.session.flush()

    @classmethod
    def _resolve_wrapper(
        cls, folder: CatalogFolder, wrapper_name: str | None
    ) -> CatalogFolder:
        """Находит или создаёт папку-обёртку на том же уровне, что и
        удаляемая папка.

        Для root-папки (parent_id=None) — это is_default-папка «Без
        департамента». Если клиент прислал wrapper_name и он отличается
        от текущего — обновляем имя is_default, чтобы оно соответствовало
        текущему label колонки (при переименовании «Департаменты» →
        «Организации» дефолтная папка автоматически становится «Без
        организаций» без отдельного запроса от клиента).

        Для не-root папки — sibling с таким же parent_id и именем
        wrapper_name. Создаём, если не нашли. Если wrapper_name не
        передан — в качестве fallback используем родителя (поведение
        до 22 апр 2026).
        """
        if folder.parent_id is None:
            wrapper = cls.ensure_default()
            if wrapper_name and wrapper.name != wrapper_name:
                wrapper.name = wrapper_name
                db.session.flush()
            return wrapper

        if wrapper_name is None:
            parent = db.session.get(CatalogFolder, folder.parent_id)
            if parent is None:
                # Родитель исчез посреди удаления — fallback на is_default,
                # чтобы точно не потерять items.
                return cls.ensure_default()
            return parent

        # Ищем sibling с таким именем (regardless of is_default — обычная
        # папка на том же уровне считается обёрткой).
        sibling = (
            db.session.query(CatalogFolder)
            .filter(
                CatalogFolder.parent_id == folder.parent_id,
                CatalogFolder.name == wrapper_name,
                CatalogFolder.id != folder.id,
            )
            .one_or_none()
        )
        if sibling is not None:
            return sibling

        # Создаём новую sibling-обёртку. Scope и color наследуем от
        # удаляемой папки — обёртка визуально и по scope «заменяет» её.
        wrapper = CatalogFolder(
            name=wrapper_name,
            parent_id=folder.parent_id,
            description=None,
            color=folder.color,
            position=int((folder.position or 0) + 1),
            scope=folder.scope,
        )
        db.session.add(wrapper)
        db.session.flush()
        return wrapper

    @staticmethod
    def _move_items_to_folder(
        source_folder_ids: list[int], target_folder_id: int
    ) -> None:
        """Переносит элементы из source-папок в target, обходя UniqueConstraint.

        Если объект уже есть в target (дубликат по object_type/object_id) —
        запись в source удаляется, чтобы не нарушить
        `uq_catalog_folder_item_folder_object`. Сам объект не трогаем.
        """
        if not source_folder_ids:
            return
        items = (
            db.session.query(CatalogFolderItem)
            .filter(CatalogFolderItem.folder_id.in_(source_folder_ids))
            .all()
        )
        if not items:
            return

        existing_pairs = {
            (row.object_type, row.object_id)
            for row in db.session.query(
                CatalogFolderItem.object_type, CatalogFolderItem.object_id
            )
            .filter(CatalogFolderItem.folder_id == target_folder_id)
            .all()
        }
        for item in items:
            key = (item.object_type, item.object_id)
            if key in existing_pairs:
                db.session.delete(item)
            else:
                item.folder_id = target_folder_id
                existing_pairs.add(key)
        db.session.flush()

    @classmethod
    def move(
        cls,
        folder_id: int,
        new_parent_id: int | None,
        position: int | None,
    ) -> CatalogFolder:
        folder = db.session.get(CatalogFolder, folder_id)
        if folder is None:
            raise CatalogFolderNotFoundError()
        cls._validate_parent(folder_id, new_parent_id)
        folder.parent_id = new_parent_id
        if position is not None:
            folder.position = int(position)
        db.session.flush()
        return folder

    # ───────── элементы ─────────

    @staticmethod
    def _validate_object_exists(obj_type: CatalogObjectType, obj_id: int) -> None:
        """Проверяет наличие объекта в соответствующей таблице Superset.

        Для AI-документов не валидирует (Univer живёт вне Superset).
        """
        table = _VALIDATED_OBJECT_TABLES.get(obj_type)
        if table is None:
            return
        # Безопасный параметризованный запрос; table — только из enum-маппинга.
        stmt = select(func.count()).select_from(
            db.Model.metadata.tables[table]
        ).where(db.Model.metadata.tables[table].c.id == obj_id)
        count = db.session.execute(stmt).scalar() or 0
        if count == 0:
            raise CatalogFolderItemInvalidObjectError()

    @classmethod
    def bulk_assign(
        cls, folder_id: int, items: list[dict[str, Any]]
    ) -> list[CatalogFolderItem]:
        """Добавить несколько элементов в папку. Идемпотентно —
        дубли просто игнорируются (UniqueConstraint срабатывает
        и запись пропускается).
        """
        folder = db.session.get(CatalogFolder, folder_id)
        if folder is None:
            raise CatalogFolderNotFoundError()

        created: list[CatalogFolderItem] = []
        for item in items:
            obj_type = CatalogObjectType(item["object_type"])
            obj_id = int(item["object_id"])
            cls._validate_object_exists(obj_type, obj_id)
            existing = (
                db.session.query(CatalogFolderItem)
                .filter_by(
                    folder_id=folder_id,
                    object_type=obj_type,
                    object_id=obj_id,
                )
                .one_or_none()
            )
            if existing is not None:
                if "position" in item:
                    existing.position = int(item["position"])
                continue
            row = CatalogFolderItem(
                folder_id=folder_id,
                object_type=obj_type,
                object_id=obj_id,
                position=int(item.get("position", 0)),
                created_on=datetime.utcnow(),
            )
            db.session.add(row)
            created.append(row)
        db.session.flush()
        return created

    @staticmethod
    def bulk_unassign(folder_id: int, items: list[dict[str, Any]]) -> int:
        """Удалить элементы из папки (без удаления самих объектов)."""
        q = db.session.query(CatalogFolderItem).filter_by(folder_id=folder_id)
        deleted = 0
        for item in items:
            obj_type = CatalogObjectType(item["object_type"])
            obj_id = int(item["object_id"])
            deleted += q.filter_by(object_type=obj_type, object_id=obj_id).delete(
                synchronize_session=False
            )
        db.session.flush()
        return deleted

    @staticmethod
    def list_items(folder_id: int) -> list[CatalogFolderItem]:
        folder = db.session.get(CatalogFolder, folder_id)
        if folder is None:
            raise CatalogFolderNotFoundError()
        return (
            db.session.query(CatalogFolderItem)
            .filter_by(folder_id=folder_id)
            .order_by(CatalogFolderItem.position, CatalogFolderItem.id)
            .all()
        )

    # ───────── auto-assign новых объектов ─────────

    @staticmethod
    def _object_has_creator(obj_type: CatalogObjectType, obj_id: int) -> bool:
        """True, если у объекта проставлен created_by_fk.

        Используется для фильтрации seed/example-данных (`load_examples`
        создаёт объекты без owner'а — `created_by_fk IS NULL`). Такие
        объекты остаются в БД и доступны через стандартные списки
        `/dashboard/list/`, `/chart/list/`, `/tablemodelview/list/`, но
        в каталог «Без департамента» не попадают, чтобы не засорять UX
        администратору, у которого в каталоге должны быть только «свои».

        Для saved_query и AI-документов — возвращаем True (seed-данных
        для них не бывает, валидация лишняя).
        """
        table_name = _VALIDATED_OBJECT_TABLES.get(obj_type)
        if table_name is None:
            return True
        table = db.Model.metadata.tables[table_name]
        if "created_by_fk" not in table.c:
            return True
        stmt = select(table.c.created_by_fk).where(table.c.id == obj_id)
        value = db.session.execute(stmt).scalar()
        return value is not None

    @classmethod
    def ensure_in_default_folder(
        cls, obj_type: CatalogObjectType, obj_id: int
    ) -> None:
        """Идемпотентно добавляет объект в дефолтную папку.

        Используется SQLAlchemy-листенерами на `after_insert` моделей
        Dashboard/Slice/SqlaTable: если объект создан через ORM и ещё не
        попал ни в какую папку каталога, мы его добавляем в дефолтную.

        Seed-данные (objects without creator) в каталог не заносим —
        см. `_object_has_creator` для обоснования.
        """
        # Пропускаем seed-объекты (created_by_fk IS NULL).
        if not cls._object_has_creator(obj_type, obj_id):
            return
        # Если объект уже в любой папке — ничего не делаем.
        already = (
            db.session.query(CatalogFolderItem.id)
            .filter(
                CatalogFolderItem.object_type == obj_type,
                CatalogFolderItem.object_id == obj_id,
            )
            .first()
        )
        if already is not None:
            return
        default = cls.ensure_default()
        row = CatalogFolderItem(
            folder_id=default.id,
            object_type=obj_type,
            object_id=obj_id,
            position=0,
            created_on=datetime.utcnow(),
        )
        db.session.add(row)
        db.session.flush()
