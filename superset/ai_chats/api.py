# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""REST API для AI-чатов.

Три ресурса: folders, sessions, messages. Все выборки изолированы
по текущему пользователю.
"""
from __future__ import annotations

import logging

from flask import request, Response
from flask_appbuilder.api import expose, permission_name, protect, safe
from marshmallow import ValidationError

from superset import db
from superset.ai_chats.dao import (
    AiChatFolderDAO,
    AiChatMessageDAO,
    AiChatSessionDAO,
)
from superset.ai_chats.exceptions import (
    AiChatAccessDeniedError,
    AiChatCyclicError,
    AiChatNotFoundError,
)
from superset.ai_chats.schemas import (
    AiChatFolderPostSchema,
    AiChatFolderPutSchema,
    AiChatMessagePostSchema,
    AiChatSessionPostSchema,
    AiChatSessionPutSchema,
)
from superset.extensions import event_logger
from superset.utils.core import get_user_id
from superset.views.base_api import BaseSupersetApi, statsd_metrics

logger = logging.getLogger(__name__)


def _require_user_id() -> int | None:
    uid = get_user_id()
    if uid is None:
        logger.warning("AI chat API called without authenticated user")
    return uid


def _folder_to_dict(f) -> dict:
    return {
        "id": f.id,
        "parent_id": f.parent_id,
        "name": f.name,
        "position": f.position,
    }


def _session_to_dict(s) -> dict:
    return {
        "id": s.id,
        "uuid": str(s.uuid) if s.uuid else None,
        "folder_id": s.folder_id,
        "title": s.title,
        "position": s.position,
        "created_on": s.created_on.isoformat() if s.created_on else None,
        "changed_on": s.changed_on.isoformat() if s.changed_on else None,
    }


def _message_to_dict(m) -> dict:
    return {
        "id": m.id,
        "session_id": m.session_id,
        "role": m.role.value,
        "content_json": m.content_json,
        "meta_json": m.meta_json,
        "created_on": m.created_on.isoformat() if m.created_on else None,
    }


class AiChatFolderRestApi(BaseSupersetApi):
    """CRUD папок чатов текущего пользователя."""

    resource_name = "ai_chat_folder"
    allow_browser_login = True
    class_permission_name = "AiChatFolder"

    openapi_spec_tag = "AI Chat Folders"

    @expose("/", methods=("GET",))
    @protect()
    @safe
    @statsd_metrics
    def get_list(self) -> Response:
        uid = _require_user_id()
        if uid is None:
            return self.response_401()
        items = AiChatFolderDAO.list_for_user(uid)
        return self.response(200, result=[_folder_to_dict(i) for i in items])

    @expose("/", methods=("POST",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *a, **kw: f"{self.__class__.__name__}.post",
        log_to_statsd=False,
    )
    def post(self) -> Response:
        uid = _require_user_id()
        if uid is None:
            return self.response_401()
        if not request.is_json:
            return self.response_400(message="Ожидается JSON")
        try:
            payload = AiChatFolderPostSchema().load(request.json)
        except ValidationError as err:
            return self.response_400(message=err.messages)
        try:
            folder = AiChatFolderDAO.create(payload, uid)
            db.session.commit()
        except (AiChatNotFoundError, AiChatAccessDeniedError) as ex:
            db.session.rollback()
            return self.response_400(message=str(ex))
        return self.response(201, id=folder.id)

    @expose("/<int:pk>", methods=("PUT",))
    @protect()
    @safe
    @statsd_metrics
    def put(self, pk: int) -> Response:
        uid = _require_user_id()
        if uid is None:
            return self.response_401()
        if not request.is_json:
            return self.response_400(message="Ожидается JSON")
        try:
            payload = AiChatFolderPutSchema().load(request.json)
        except ValidationError as err:
            return self.response_400(message=err.messages)
        try:
            folder = AiChatFolderDAO.update(pk, payload, uid)
            db.session.commit()
        except AiChatNotFoundError:
            db.session.rollback()
            return self.response_404()
        except AiChatAccessDeniedError:
            db.session.rollback()
            return self.response_403()
        except AiChatCyclicError as ex:
            db.session.rollback()
            return self.response_400(message=str(ex))
        return self.response(200, id=folder.id)

    @expose("/<int:pk>", methods=("DELETE",))
    @protect()
    @safe
    @statsd_metrics
    def delete(self, pk: int) -> Response:
        uid = _require_user_id()
        if uid is None:
            return self.response_401()
        try:
            AiChatFolderDAO.delete(pk, uid)
            db.session.commit()
        except AiChatNotFoundError:
            db.session.rollback()
            return self.response_404()
        except AiChatAccessDeniedError:
            db.session.rollback()
            return self.response_403()
        return self.response(200, message="OK")


class AiChatSessionRestApi(BaseSupersetApi):
    """CRUD сессий чатов + вложенные сообщения."""

    resource_name = "ai_chat_session"
    allow_browser_login = True
    class_permission_name = "AiChatSession"

    openapi_spec_tag = "AI Chat Sessions"

    @expose("/", methods=("GET",))
    @protect()
    @safe
    @statsd_metrics
    def get_list(self) -> Response:
        uid = _require_user_id()
        if uid is None:
            return self.response_401()
        folder_id = request.args.get("folder_id", type=int)
        items = AiChatSessionDAO.list_for_user(uid, folder_id)
        return self.response(200, result=[_session_to_dict(i) for i in items])

    @expose("/", methods=("POST",))
    @protect()
    @safe
    @statsd_metrics
    def post(self) -> Response:
        uid = _require_user_id()
        if uid is None:
            return self.response_401()
        if not request.is_json:
            return self.response_400(message="Ожидается JSON")
        try:
            payload = AiChatSessionPostSchema().load(request.json)
        except ValidationError as err:
            return self.response_400(message=err.messages)
        try:
            session_obj = AiChatSessionDAO.create(payload, uid)
            db.session.commit()
        except (AiChatNotFoundError, AiChatAccessDeniedError) as ex:
            db.session.rollback()
            return self.response_400(message=str(ex))
        return self.response(201, **_session_to_dict(session_obj))

    @expose("/<int:pk>", methods=("PUT",))
    @protect()
    @safe
    @statsd_metrics
    def put(self, pk: int) -> Response:
        uid = _require_user_id()
        if uid is None:
            return self.response_401()
        if not request.is_json:
            return self.response_400(message="Ожидается JSON")
        try:
            payload = AiChatSessionPutSchema().load(request.json)
        except ValidationError as err:
            return self.response_400(message=err.messages)
        try:
            session_obj = AiChatSessionDAO.update(pk, payload, uid)
            db.session.commit()
        except AiChatNotFoundError:
            db.session.rollback()
            return self.response_404()
        except AiChatAccessDeniedError:
            db.session.rollback()
            return self.response_403()
        return self.response(200, **_session_to_dict(session_obj))

    @expose("/<int:pk>", methods=("DELETE",))
    @protect()
    @safe
    @statsd_metrics
    def delete(self, pk: int) -> Response:
        uid = _require_user_id()
        if uid is None:
            return self.response_401()
        try:
            AiChatSessionDAO.delete(pk, uid)
            db.session.commit()
        except AiChatNotFoundError:
            db.session.rollback()
            return self.response_404()
        except AiChatAccessDeniedError:
            db.session.rollback()
            return self.response_403()
        return self.response(200, message="OK")

    @expose("/<int:pk>/messages", methods=("GET",))
    @protect()
    @safe
    @statsd_metrics
    def list_messages(self, pk: int) -> Response:
        uid = _require_user_id()
        if uid is None:
            return self.response_401()
        try:
            msgs = AiChatMessageDAO.list_for_session(pk, uid)
        except AiChatNotFoundError:
            return self.response_404()
        except AiChatAccessDeniedError:
            return self.response_403()
        return self.response(200, result=[_message_to_dict(m) for m in msgs])

    @expose("/<int:pk>/messages", methods=("POST",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *a, **kw: f"{self.__class__.__name__}.post_message",
        log_to_statsd=False,
    )
    def post_message(self, pk: int) -> Response:
        uid = _require_user_id()
        if uid is None:
            return self.response_401()
        if not request.is_json:
            return self.response_400(message="Ожидается JSON")
        try:
            payload = AiChatMessagePostSchema().load(request.json)
        except ValidationError as err:
            return self.response_400(message=err.messages)
        try:
            msg = AiChatMessageDAO.create(pk, payload, uid)
            db.session.commit()
        except AiChatNotFoundError:
            db.session.rollback()
            return self.response_404()
        except AiChatAccessDeniedError:
            db.session.rollback()
            return self.response_403()
        return self.response(201, **_message_to_dict(msg))
