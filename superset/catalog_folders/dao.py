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
    CatalogFolderCyclicError,
    CatalogFolderInvalidParentError,
    CatalogFolderItemInvalidObjectError,
    CatalogFolderNotFoundError,
)
from superset.catalog_folders.models import (
    CatalogFolder,
    CatalogFolderItem,
    CatalogObjectType,
)

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
    def get_tree() -> list[dict[str, Any]]:
        """Возвращает плоский список всех папок + count элементов."""
        folders = (
            db.session.query(CatalogFolder)
            .order_by(CatalogFolder.parent_id, CatalogFolder.position, CatalogFolder.id)
            .all()
        )
        counts = dict(
            db.session.query(
                CatalogFolderItem.folder_id, func.count(CatalogFolderItem.id)
            )
            .group_by(CatalogFolderItem.folder_id)
            .all()
        )
        return [
            {
                "id": f.id,
                "parent_id": f.parent_id,
                "name": f.name,
                "description": f.description,
                "color": f.color,
                "position": f.position,
                "item_count": int(counts.get(f.id, 0)),
            }
            for f in folders
        ]

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
        cls._validate_parent(None, payload.get("parent_id"))
        folder = CatalogFolder(
            name=payload["name"],
            parent_id=payload.get("parent_id"),
            description=payload.get("description"),
            color=payload.get("color"),
            position=int(payload.get("position", 0)),
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
        for field in ("name", "description", "color", "position"):
            if field in payload:
                setattr(folder, field, payload[field])
        db.session.flush()
        return folder

    @staticmethod
    def delete(folder_id: int) -> None:
        folder = db.session.get(CatalogFolder, folder_id)
        if folder is None:
            raise CatalogFolderNotFoundError()
        # Благодаря ON DELETE SET NULL на parent_id подпапки становятся корневыми.
        # Элементы папки удаляются каскадом (CASCADE).
        db.session.delete(folder)
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
