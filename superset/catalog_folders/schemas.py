# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""Marshmallow схемы для API папок каталога."""
from __future__ import annotations

from marshmallow import fields, Schema, validate

from superset.catalog_folders.models import CatalogObjectType

CATALOG_OBJECT_TYPE_VALUES = [m.value for m in CatalogObjectType]

HEX_COLOR = validate.Regexp(
    r"^#[0-9A-Fa-f]{6}$",
    error="color должен быть в формате #RRGGBB",
)

# Допустимые значения scope. NULL (None) — shared, разрешён явно как
# `allow_none=True` в полях ниже. Список держим здесь, чтобы переиспользовать
# в POST/PUT/GET (?scope=...).
CATALOG_SCOPE_VALUES = ["dashboard", "chart"]
SCOPE_FIELD = validate.OneOf(CATALOG_SCOPE_VALUES)

openapi_spec_methods_override = {
    "get": {"get": {"summary": "Получить папку каталога"}},
    "get_list": {
        "get": {
            "summary": "Список папок каталога",
            "description": "Возвращает плоский список с parent_id — "
            "фронтенд строит дерево. Используйте /tree для удобства.",
        }
    },
    "post": {"post": {"summary": "Создать папку каталога"}},
    "put": {"put": {"summary": "Обновить папку каталога"}},
    "delete": {"delete": {"summary": "Удалить папку каталога"}},
    "info": {"get": {"summary": "Метаданные этого API-ресурса"}},
}


class CatalogFolderPostSchema(Schema):
    name = fields.String(
        required=True, validate=validate.Length(min=1, max=255)
    )
    parent_id = fields.Integer(allow_none=True, load_default=None)
    description = fields.String(allow_none=True, load_default=None)
    color = fields.String(allow_none=True, validate=HEX_COLOR, load_default=None)
    position = fields.Integer(load_default=0)
    # Scope папки. Новые папки, создаваемые UI, всегда имеют scope — клиент
    # передаёт текущий dashboard/chart-режим. NULL остаётся только за
    # дефолтной папкой и legacy-записями.
    scope = fields.String(
        allow_none=True, validate=SCOPE_FIELD, load_default=None
    )


class CatalogFolderPutSchema(Schema):
    name = fields.String(
        required=False, validate=validate.Length(min=1, max=255)
    )
    parent_id = fields.Integer(required=False, allow_none=True)
    description = fields.String(required=False, allow_none=True)
    color = fields.String(required=False, allow_none=True, validate=HEX_COLOR)
    position = fields.Integer(required=False)
    scope = fields.String(required=False, allow_none=True, validate=SCOPE_FIELD)


class CatalogFolderTreeNodeSchema(Schema):
    id = fields.Integer()
    parent_id = fields.Integer(allow_none=True)
    name = fields.String()
    description = fields.String(allow_none=True)
    color = fields.String(allow_none=True)
    position = fields.Integer()
    scope = fields.String(
        allow_none=True,
        metadata={
            "description": (
                "dashboard|chart|null. NULL — shared (дефолтная папка и "
                "унаследованные записи)."
            )
        },
    )
    is_default = fields.Boolean(
        metadata={
            "description": (
                "True для системной дефолтной папки «Без департамента». "
                "Удаление запрещено; клиент должен скрыть кнопку Delete."
            )
        }
    )
    item_count = fields.Integer(
        metadata={"description": "Количество элементов именно в этой папке"}
    )
    item_counts_by_type = fields.Dict(
        keys=fields.String(),
        values=fields.Integer(),
        metadata={
            "description": (
                "Счётчик элементов с разбивкой по типу объекта: "
                "{'dashboard': N, 'chart': N, 'dataset': N, ...}. "
                "Используется UI для показа breakdown «1 дашборд · 7 чартов»."
            )
        },
    )


class CatalogFolderItemSchema(Schema):
    object_type = fields.String(
        required=True, validate=validate.OneOf(CATALOG_OBJECT_TYPE_VALUES)
    )
    object_id = fields.Integer(required=True)
    position = fields.Integer(load_default=0)


class CatalogFolderItemsBulkSchema(Schema):
    items = fields.List(
        fields.Nested(CatalogFolderItemSchema),
        required=True,
        validate=validate.Length(min=1, max=500),
    )


class CatalogFolderMoveSchema(Schema):
    parent_id = fields.Integer(
        required=False, allow_none=True, load_default=None
    )
    position = fields.Integer(required=False)
