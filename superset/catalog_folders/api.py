# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""REST API для папок каталога.

Стандартный CRUD + три кастомных endpoint:
- GET  /tree                      — дерево папок (плоский массив с parent_id)
- POST /{id}/items                — bulk-назначить объекты в папку
- DELETE /{id}/items              — bulk-удалить объекты из папки
- POST /{id}/move                 — переместить папку (D&D reparent)
"""
from __future__ import annotations

import logging
from typing import Any

from flask import request, Response
from flask_appbuilder.api import expose, protect, safe
from flask_appbuilder.models.sqla.interface import SQLAInterface
from marshmallow import ValidationError

from superset import db
from superset.catalog_folders.dao import CatalogFolderDAO
from superset.catalog_folders.exceptions import (
    CatalogFolderCannotDeleteDefaultError,
    CatalogFolderCyclicError,
    CatalogFolderDefaultAlreadyExistsError,
    CatalogFolderInvalidParentError,
    CatalogFolderItemInvalidObjectError,
    CatalogFolderNotFoundError,
)
from superset.catalog_folders.models import CatalogFolder
from superset.catalog_folders.schemas import (
    CATALOG_SCOPE_VALUES,
    CatalogFolderItemsBulkSchema,
    CatalogFolderMoveSchema,
    CatalogFolderPostSchema,
    CatalogFolderPutSchema,
    CatalogFolderTreeNodeSchema,
    openapi_spec_methods_override,
)
from superset.constants import MODEL_API_RW_METHOD_PERMISSION_MAP, RouteMethod
from superset.extensions import event_logger
from superset.views.base_api import BaseSupersetModelRestApi, statsd_metrics

logger = logging.getLogger(__name__)


class CatalogFolderRestApi(BaseSupersetModelRestApi):
    datamodel = SQLAInterface(CatalogFolder)

    include_route_methods = RouteMethod.REST_MODEL_VIEW_CRUD_SET | {
        "tree",
        "bulk_assign",
        "bulk_unassign",
        "move",
        "list_items",
    }

    resource_name = "catalog_folder"
    allow_browser_login = True

    class_permission_name = "CatalogFolder"
    # Расширяем стандартную мапу разрешений кастомными методами CatalogFolder:
    # - tree/list_items — чтение (может любой с can_read CatalogFolder)
    # - bulk_assign/bulk_unassign/move — запись (требует can_write)
    method_permission_name = {
        **MODEL_API_RW_METHOD_PERMISSION_MAP,
        "tree": "read",
        "list_items": "read",
        "bulk_assign": "write",
        "bulk_unassign": "write",
        "move": "write",
    }

    list_columns = [
        "id",
        "uuid",
        "parent_id",
        "name",
        "description",
        "color",
        "position",
        "scope",
        "created_on",
        "changed_on",
    ]
    show_columns = list_columns
    add_columns = [
        "name",
        "parent_id",
        "description",
        "color",
        "position",
        "scope",
    ]
    edit_columns = add_columns
    order_columns = ["name", "position", "created_on", "changed_on"]

    add_model_schema = CatalogFolderPostSchema()
    edit_model_schema = CatalogFolderPutSchema()

    openapi_spec_tag = "Catalog Folders"
    openapi_spec_methods = openapi_spec_methods_override
    openapi_spec_component_schemas = (
        CatalogFolderTreeNodeSchema,
        CatalogFolderItemsBulkSchema,
        CatalogFolderMoveSchema,
    )

    # ───────── CRUD overrides для использования DAO ─────────

    @expose("/", methods=("POST",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.post",
        log_to_statsd=False,
    )
    def post(self) -> Response:
        """Создать папку каталога."""
        if not request.is_json:
            return self.response_400(message="Ожидается JSON-тело запроса")
        try:
            item = self.add_model_schema.load(request.json)
        except ValidationError as err:
            return self.response_400(message=err.messages)
        try:
            folder = CatalogFolderDAO.create(item)
            db.session.commit()
        except (
            CatalogFolderInvalidParentError,
            CatalogFolderDefaultAlreadyExistsError,
        ) as ex:
            db.session.rollback()
            return self.response_400(message=str(ex))
        return self.response(201, id=folder.id, uuid=str(folder.uuid))

    @expose("/<int:pk>", methods=("PUT",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.put",
        log_to_statsd=False,
    )
    def put(self, pk: int) -> Response:
        """Обновить папку каталога."""
        if not request.is_json:
            return self.response_400(message="Ожидается JSON-тело запроса")
        try:
            item = self.edit_model_schema.load(request.json)
        except ValidationError as err:
            return self.response_400(message=err.messages)
        try:
            folder = CatalogFolderDAO.update(pk, item)
            db.session.commit()
        except CatalogFolderNotFoundError:
            db.session.rollback()
            return self.response_404()
        except (CatalogFolderInvalidParentError, CatalogFolderCyclicError) as ex:
            db.session.rollback()
            return self.response_400(message=str(ex))
        return self.response(200, id=folder.id)

    @expose("/<int:pk>", methods=("DELETE",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.delete",
        log_to_statsd=False,
    )
    def delete(self, pk: int) -> Response:  # type: ignore[override]
        """Удалить папку каталога.

        Query params:
            cascade (bool, default=false): если true — рекурсивно удаляет
                все подпапки; items из них переезжают плоским списком в
                обёртку (см. wrapper_name). Если false — сохраняет
                структуру: подпапки перевешиваются на обёртку.
            wrapper_name (str, optional): имя папки-обёртки на том же
                уровне иерархии, в которую переедут items и подпапки
                (например, «Без департамента», «Без подраздела»,
                «Без папки»). Для root-папки это имя применяется к
                is_default-папке (она автоматически переименуется, если
                клиент сменил label колонки). Для не-root — sibling с
                этим именем будет создан или переиспользован.

        Объекты (дашборды/чарты/датасеты) не удаляются никогда.
        """
        cascade_raw = request.args.get("cascade", "false").lower()
        cascade = cascade_raw in ("1", "true", "yes")
        # Обрезаем пустую строку — фронтенд может прислать wrapper_name=""
        # при удалении пустой папки, обёртка там не нужна.
        wrapper_name = (request.args.get("wrapper_name") or "").strip() or None
        try:
            CatalogFolderDAO.delete(pk, cascade=cascade, wrapper_name=wrapper_name)
            db.session.commit()
        except CatalogFolderNotFoundError:
            db.session.rollback()
            return self.response_404()
        except CatalogFolderCannotDeleteDefaultError as ex:
            db.session.rollback()
            return self.response_400(message=str(ex))
        return self.response(200, message="OK")

    # ───────── кастомные ручки ─────────

    @expose("/tree", methods=("GET",))
    @protect()
    @safe
    @statsd_metrics
    def tree(self) -> Response:
        """Возвращает плоское дерево папок с item_count на каждую папку.

        Query params:
            scope: фильтр 'dashboard'|'chart'. Если задан — отдаём только
                папки этого scope + shared (NULL-scope). Без параметра
                отдаём все (админ-режим).
        """
        scope = request.args.get("scope")
        if scope is not None and scope not in CATALOG_SCOPE_VALUES:
            return self.response_400(
                message=f"scope должен быть одним из {CATALOG_SCOPE_VALUES}"
            )
        return self.response(
            200, result=CatalogFolderDAO.get_tree(scope=scope)
        )

    @expose("/<int:pk>/items", methods=("GET",))
    @protect()
    @safe
    @statsd_metrics
    def list_items(self, pk: int) -> Response:
        """Список элементов конкретной папки."""
        try:
            items = CatalogFolderDAO.list_items(pk)
        except CatalogFolderNotFoundError:
            return self.response_404()
        return self.response(
            200,
            result=[i.to_dict() for i in items],
        )

    @expose("/<int:pk>/items", methods=("POST",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.bulk_assign",
        log_to_statsd=False,
    )
    def bulk_assign(self, pk: int) -> Response:
        """Добавить объекты в папку (D&D drop)."""
        if not request.is_json:
            return self.response_400(message="Ожидается JSON-тело запроса")
        try:
            payload = CatalogFolderItemsBulkSchema().load(request.json)
        except ValidationError as err:
            return self.response_400(message=err.messages)
        try:
            created = CatalogFolderDAO.bulk_assign(pk, payload["items"])
            db.session.commit()
        except CatalogFolderNotFoundError:
            db.session.rollback()
            return self.response_404()
        except CatalogFolderItemInvalidObjectError as ex:
            db.session.rollback()
            return self.response_400(message=str(ex))
        return self.response(
            201,
            result=[i.to_dict() for i in created],
            created_count=len(created),
        )

    @expose("/<int:pk>/items", methods=("DELETE",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.bulk_unassign",
        log_to_statsd=False,
    )
    def bulk_unassign(self, pk: int) -> Response:
        """Удалить объекты из папки."""
        if not request.is_json:
            return self.response_400(message="Ожидается JSON-тело запроса")
        try:
            payload = CatalogFolderItemsBulkSchema().load(request.json)
        except ValidationError as err:
            return self.response_400(message=err.messages)
        deleted = CatalogFolderDAO.bulk_unassign(pk, payload["items"])
        db.session.commit()
        return self.response(200, deleted_count=deleted)

    @expose("/<int:pk>/move", methods=("POST",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.move",
        log_to_statsd=False,
    )
    def move(self, pk: int) -> Response:
        """Переместить папку в нового родителя и/или изменить position (D&D)."""
        if not request.is_json:
            return self.response_400(message="Ожидается JSON-тело запроса")
        try:
            payload = CatalogFolderMoveSchema().load(request.json)
        except ValidationError as err:
            return self.response_400(message=err.messages)
        try:
            folder = CatalogFolderDAO.move(
                pk, payload.get("parent_id"), payload.get("position")
            )
            db.session.commit()
        except CatalogFolderNotFoundError:
            db.session.rollback()
            return self.response_404()
        except (CatalogFolderInvalidParentError, CatalogFolderCyclicError) as ex:
            db.session.rollback()
            return self.response_400(message=str(ex))
        return self.response(
            200, id=folder.id, parent_id=folder.parent_id, position=folder.position
        )
