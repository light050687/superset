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


class CatalogFolderPutSchema(Schema):
    name = fields.String(
        required=False, validate=validate.Length(min=1, max=255)
    )
    parent_id = fields.Integer(required=False, allow_none=True)
    description = fields.String(required=False, allow_none=True)
    color = fields.String(required=False, allow_none=True, validate=HEX_COLOR)
    position = fields.Integer(required=False)


class CatalogFolderTreeNodeSchema(Schema):
    id = fields.Integer()
    parent_id = fields.Integer(allow_none=True)
    name = fields.String()
    description = fields.String(allow_none=True)
    color = fields.String(allow_none=True)
    position = fields.Integer()
    item_count = fields.Integer(
        metadata={"description": "Количество элементов именно в этой папке"}
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
