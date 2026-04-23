# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""SQLAlchemy event listeners для авто-назначения новых объектов в дефолтную
папку каталога.

Когда пользователь создаёт Dashboard/Slice/SqlaTable через любой путь
(REST API, импорт, FAB-view, прямая ORM-операция в тестах) — объект
автоматически попадает в папку «Без департамента», если его явно не
добавили в другую папку в той же транзакции.

Регистрируется один раз при старте приложения (см. `register_listeners`).
"""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import event
from sqlalchemy.orm import Session

from superset.catalog_folders.models import CatalogObjectType

logger = logging.getLogger(__name__)

# Флаг, чтобы не регистрировать слушатели повторно в тестах / reload'ах.
_LISTENERS_REGISTERED = False


def _enqueue_auto_assign(
    session: Session, obj_type: CatalogObjectType, obj_id: int
) -> None:
    """Помечает объект к добавлению в дефолтную папку на after_flush."""
    queue: list[tuple[CatalogObjectType, int]] = session.info.setdefault(
        "_catalog_default_queue", []
    )
    queue.append((obj_type, obj_id))


def _on_after_insert_dashboard(mapper: Any, connection: Any, target: Any) -> None:
    """Ставит Dashboard в очередь на автоматическую привязку к дефолтной папке."""
    from superset import db  # импорт здесь — избегаем циклических импортов

    _enqueue_auto_assign(
        db.session, CatalogObjectType.DASHBOARD, int(target.id)
    )


def _on_after_insert_slice(mapper: Any, connection: Any, target: Any) -> None:
    """Ставит Chart (Slice) в очередь на автоматическую привязку."""
    from superset import db

    _enqueue_auto_assign(db.session, CatalogObjectType.CHART, int(target.id))


def _on_after_insert_dataset(mapper: Any, connection: Any, target: Any) -> None:
    """Ставит Dataset (SqlaTable) в очередь на автоматическую привязку."""
    from superset import db

    _enqueue_auto_assign(
        db.session, CatalogObjectType.DATASET, int(target.id)
    )


def _enqueue_cascade_delete(
    session: Session, obj_type: CatalogObjectType, obj_id: int
) -> None:
    """Помечает объект к удалению из catalog_folder_item на after_flush.

    catalog_folder_item.object_id не имеет FK на dashboards/slices/tables —
    связь универсальная, под разные бэкенды объектов (в т.ч. AI-документы
    из Univer). Поэтому удаление объекта не каскадит в каталог сам по себе,
    и без этого хука в default folder накапливаются мёртвые ссылки.
    """
    queue: list[tuple[CatalogObjectType, int]] = session.info.setdefault(
        "_catalog_delete_queue", []
    )
    queue.append((obj_type, obj_id))


def _on_after_delete_dashboard(mapper: Any, connection: Any, target: Any) -> None:
    """Удаляет запись(и) в catalog_folder_item при удалении дашборда."""
    from superset import db

    _enqueue_cascade_delete(
        db.session, CatalogObjectType.DASHBOARD, int(target.id)
    )


def _on_after_delete_slice(mapper: Any, connection: Any, target: Any) -> None:
    """Удаляет запись(и) в catalog_folder_item при удалении чарта."""
    from superset import db

    _enqueue_cascade_delete(
        db.session, CatalogObjectType.CHART, int(target.id)
    )


def _on_after_delete_dataset(mapper: Any, connection: Any, target: Any) -> None:
    """Удаляет запись(и) в catalog_folder_item при удалении датасета."""
    from superset import db

    _enqueue_cascade_delete(
        db.session, CatalogObjectType.DATASET, int(target.id)
    )


def _process_queue_after_flush(session: Session, flush_context: Any) -> None:
    """После flush обрабатываем очереди: авто-assign и cascade-delete.

    Используем after_flush (а не after_insert/after_delete), чтобы target.id
    уже был заполнен и чтобы мы сами могли безопасно сделать flush() для
    новых CatalogFolderItem в той же сессии. Внутри after_insert flush запрещён.
    """
    from superset.catalog_folders.dao import CatalogFolderDAO
    from superset.catalog_folders.models import CatalogFolderItem

    # ─── insert queue: auto-assign в дефолтную папку ───
    insert_queue: list[tuple[CatalogObjectType, int]] = session.info.get(
        "_catalog_default_queue", []
    )
    if insert_queue:
        session.info["_catalog_default_queue"] = []
        for obj_type, obj_id in insert_queue:
            try:
                CatalogFolderDAO.ensure_in_default_folder(obj_type, obj_id)
            except Exception:  # noqa: BLE001 — не ронять транзакцию из-за хука
                logger.exception(
                    "catalog_folders: ensure_in_default_folder failed for %s:%s",
                    obj_type.value,
                    obj_id,
                )

    # ─── delete queue: каскадное удаление из catalog_folder_item ───
    delete_queue: list[tuple[CatalogObjectType, int]] = session.info.get(
        "_catalog_delete_queue", []
    )
    if delete_queue:
        session.info["_catalog_delete_queue"] = []
        for obj_type, obj_id in delete_queue:
            try:
                session.query(CatalogFolderItem).filter(
                    CatalogFolderItem.object_type == obj_type,
                    CatalogFolderItem.object_id == obj_id,
                ).delete(synchronize_session=False)
            except Exception:  # noqa: BLE001
                logger.exception(
                    "catalog_folders: cascade-delete failed for %s:%s",
                    obj_type.value,
                    obj_id,
                )


def register_listeners() -> None:
    """Регистрирует SQLAlchemy-события для авто-назначения в дефолтную папку.

    Идемпотентна — повторный вызов ничего не ломает (флаг модуля).
    """
    global _LISTENERS_REGISTERED  # noqa: PLW0603
    if _LISTENERS_REGISTERED:
        return

    # Импорт моделей здесь — чтобы listeners-модуль можно было импортировать
    # в момент, когда Superset ORM ещё не готов.
    from superset import db
    from superset.connectors.sqla.models import SqlaTable
    from superset.models.dashboard import Dashboard
    from superset.models.slice import Slice

    event.listen(Dashboard, "after_insert", _on_after_insert_dashboard)
    event.listen(Slice, "after_insert", _on_after_insert_slice)
    event.listen(SqlaTable, "after_insert", _on_after_insert_dataset)
    event.listen(Dashboard, "after_delete", _on_after_delete_dashboard)
    event.listen(Slice, "after_delete", _on_after_delete_slice)
    event.listen(SqlaTable, "after_delete", _on_after_delete_dataset)
    event.listen(db.session, "after_flush", _process_queue_after_flush)

    _LISTENERS_REGISTERED = True
    logger.info(
        "catalog_folders: auto-assign + cascade-delete listeners registered"
    )
