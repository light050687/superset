# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
# pylint: disable=too-few-public-methods
"""SQLAlchemy модели для папок каталога.

Дерево: CatalogFolder.parent_id -> CatalogFolder.id (self-reference, ON DELETE SET NULL,
чтобы удаление родителя не уничтожало содержимое — подпапки остаются,
но становятся корневыми; элементы родителя остаются в своих папках).

Связь с объектами: CatalogFolderItem (folder_id, object_type, object_id).
Мы НЕ используем FK на dashboards/slices/и т.д. — это универсальный
указатель, работающий и с native-объектами Superset, и с AI-документами,
которые живут в другой системе (Univer).
"""
from __future__ import annotations

import enum
from datetime import datetime
from typing import Any

from flask_appbuilder import Model
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import false as sql_false

from superset.models.helpers import AuditMixinNullable, UUIDMixin


class CatalogObjectType(str, enum.Enum):
    """Тип объекта, привязанного к папке каталога.

    Используется строковый enum, чтобы значения были стабильны в JSON-API
    и понятны в SQL-запросах вручную.
    """

    DASHBOARD = "dashboard"
    CHART = "chart"
    DATASET = "dataset"
    SAVED_QUERY = "saved_query"
    AI_DOCUMENT = "ai_document"
    AI_SPREADSHEET = "ai_spreadsheet"


class CatalogFolder(Model, AuditMixinNullable, UUIDMixin):
    """Папка каталога с произвольной вложенностью.

    Администратор создаёт дерево вручную (например, департаменты и их
    подразделения). Любой пользователь может видеть все папки, но
    модифицировать — только с правом `can_manage_catalog`.
    """

    __tablename__ = "catalog_folder"
    __table_args__ = (
        UniqueConstraint(
            "parent_id", "name", name="uq_catalog_folder_parent_name"
        ),
        Index("ix_catalog_folder_parent_id", "parent_id"),
    )

    id = Column(Integer, primary_key=True)
    parent_id = Column(
        Integer,
        ForeignKey("catalog_folder.id", ondelete="SET NULL"),
        nullable=True,
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    # 7-символьный HEX (#RRGGBB) для цветовой точки в UI; nullable — наследует DS 2.0 палитру.
    color = Column(String(7), nullable=True)
    # Порядок среди сестёр внутри одного parent_id. Ставится фронтендом при D&D.
    position = Column(Integer, nullable=False, default=0)
    # Флаг «дефолтной» папки. Может быть только одна на всю систему (enforced
    # через partial unique index в PostgreSQL). Дефолтная папка:
    # - создаётся миграцией c3d4e5f6a7b8 («Без департамента»)
    # - не может быть удалена через API
    # - принимает все новые дашборды/чарты/датасеты, не привязанные явно к
    #   другой папке, и все осиротевшие элементы при удалении родительской папки
    is_default = Column(
        Boolean, nullable=False, default=False, server_default=sql_false()
    )
    # Scope — разделение иерархий по типу объекта (dashboard/chart).
    # Введено миграцией d4e5f6a7b8c9. Семантика:
    #   - 'dashboard': папка видна только в режиме «Дашборды» (UI scope=dashboard)
    #   - 'chart':     видна только в «Чартах»
    #   - NULL:        shared — видна в обоих режимах (дефолтная папка
    #                  «Без департамента» и унаследованные до миграции записи)
    # Валидация enum-значений — на уровне API-схемы (marshmallow), чтобы не
    # городить DB-enum с миграциями (проще расширяться в будущем).
    scope = Column(String(16), nullable=True, index=True)

    parent = relationship(
        "CatalogFolder",
        remote_side="CatalogFolder.id",
        backref="children",
    )
    items = relationship(
        "CatalogFolderItem",
        back_populates="folder",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<CatalogFolder id={self.id} name={self.name!r}>"

    @property
    def depth(self) -> int:
        """Глубина папки в дереве (корень = 0). Защита от цикла через счётчик."""
        depth = 0
        node = self.parent
        visited: set[int] = set()
        while node is not None:
            if node.id in visited:
                break
            visited.add(node.id)
            depth += 1
            node = node.parent
        return depth


class CatalogFolderItem(Model):
    """Элемент папки каталога — привязка (folder, object_type, object_id).

    НЕ использует FK на dashboards/slices, т.к. object_type может указывать
    и на AI-документы (Univer), которые живут вне Superset. Ссылочная
    целостность проверяется на уровне DAO при создании.
    """

    __tablename__ = "catalog_folder_item"
    __table_args__ = (
        UniqueConstraint(
            "folder_id",
            "object_type",
            "object_id",
            name="uq_catalog_folder_item_folder_object",
        ),
        Index(
            "ix_catalog_folder_item_object",
            "object_type",
            "object_id",
        ),
    )

    id = Column(Integer, primary_key=True)
    folder_id = Column(
        Integer,
        ForeignKey("catalog_folder.id", ondelete="CASCADE"),
        nullable=False,
    )
    object_type = Column(
        Enum(
            CatalogObjectType,
            name="catalog_object_type",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    object_id = Column(Integer, nullable=False)
    # Порядок внутри конкретной папки (для D&D в bento). 0 = первый.
    position = Column(Integer, nullable=False, default=0)

    # Простой аудит без FK на изменившего — элемент либо существует, либо нет.
    created_on = Column(DateTime, default=datetime.utcnow, nullable=True)

    folder = relationship("CatalogFolder", back_populates="items")

    def __repr__(self) -> str:
        return (
            f"<CatalogFolderItem folder_id={self.folder_id} "
            f"object={self.object_type.value}:{self.object_id}>"
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "folder_id": self.folder_id,
            "object_type": self.object_type.value,
            "object_id": self.object_id,
            "position": self.position,
        }
