# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""DAO для AI-чатов. Все выборки изолированы по `created_by_fk = current_user`,
кроме случаев когда вызов делает админ (проверка на уровне API).
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from superset import db
from superset.ai_chats.exceptions import (
    AiChatAccessDeniedError,
    AiChatCyclicError,
    AiChatNotFoundError,
)
from superset.ai_chats.models import (
    AiChatFolder,
    AiChatMessage,
    AiChatMessageRole,
    AiChatSession,
)

logger = logging.getLogger(__name__)


def _get_session() -> Session:
    return db.session


def _owned_folder(folder_id: int, user_id: int) -> AiChatFolder:
    folder = _get_session().get(AiChatFolder, folder_id)
    if folder is None:
        raise AiChatNotFoundError()
    if folder.created_by_fk != user_id:
        raise AiChatAccessDeniedError()
    return folder


def _owned_session(session_id: int, user_id: int) -> AiChatSession:
    session_obj = _get_session().get(AiChatSession, session_id)
    if session_obj is None:
        raise AiChatNotFoundError()
    if session_obj.created_by_fk != user_id:
        raise AiChatAccessDeniedError()
    return session_obj


class AiChatFolderDAO:
    @staticmethod
    def list_for_user(user_id: int) -> list[AiChatFolder]:
        return (
            _get_session()
            .query(AiChatFolder)
            .filter_by(created_by_fk=user_id)
            .order_by(AiChatFolder.parent_id, AiChatFolder.position, AiChatFolder.id)
            .all()
        )

    @staticmethod
    def _descendants(folder_id: int, user_id: int) -> set[int]:
        result: set[int] = set()
        frontier = {folder_id}
        while frontier:
            rows = (
                _get_session()
                .query(AiChatFolder.id)
                .filter(
                    AiChatFolder.parent_id.in_(frontier),
                    AiChatFolder.created_by_fk == user_id,
                )
                .all()
            )
            next_layer = {r[0] for r in rows} - result
            if not next_layer:
                break
            result |= next_layer
            frontier = next_layer
        return result

    @classmethod
    def create(cls, payload: dict[str, Any], user_id: int) -> AiChatFolder:
        parent_id = payload.get("parent_id")
        if parent_id is not None:
            _owned_folder(parent_id, user_id)  # validates ownership
        folder = AiChatFolder(
            name=payload["name"],
            parent_id=parent_id,
            position=int(payload.get("position", 0)),
        )
        _get_session().add(folder)
        _get_session().flush()
        return folder

    @classmethod
    def update(
        cls, folder_id: int, payload: dict[str, Any], user_id: int
    ) -> AiChatFolder:
        folder = _owned_folder(folder_id, user_id)
        if "parent_id" in payload:
            new_parent = payload["parent_id"]
            if new_parent is not None:
                if new_parent == folder_id:
                    raise AiChatCyclicError()
                _owned_folder(new_parent, user_id)
                if new_parent in cls._descendants(folder_id, user_id):
                    raise AiChatCyclicError()
            folder.parent_id = new_parent
        for f in ("name", "position"):
            if f in payload:
                setattr(folder, f, payload[f])
        _get_session().flush()
        return folder

    @staticmethod
    def delete(folder_id: int, user_id: int) -> None:
        folder = _owned_folder(folder_id, user_id)
        # ON DELETE SET NULL — дочерние папки/сессии остаются, parent_id становится NULL.
        _get_session().delete(folder)
        _get_session().flush()


class AiChatSessionDAO:
    @staticmethod
    def list_for_user(user_id: int, folder_id: int | None = None) -> list[AiChatSession]:
        q = (
            _get_session()
            .query(AiChatSession)
            .filter_by(created_by_fk=user_id)
        )
        if folder_id is not None:
            q = q.filter_by(folder_id=folder_id)
        return q.order_by(
            AiChatSession.changed_on.desc().nullslast(),
            AiChatSession.id.desc(),
        ).all()

    @staticmethod
    def create(payload: dict[str, Any], user_id: int) -> AiChatSession:
        folder_id = payload.get("folder_id")
        if folder_id is not None:
            _owned_folder(folder_id, user_id)
        session_obj = AiChatSession(
            title=payload["title"],
            folder_id=folder_id,
            position=int(payload.get("position", 0)),
        )
        _get_session().add(session_obj)
        _get_session().flush()
        return session_obj

    @staticmethod
    def update(session_id: int, payload: dict[str, Any], user_id: int) -> AiChatSession:
        session_obj = _owned_session(session_id, user_id)
        if "folder_id" in payload:
            new_folder = payload["folder_id"]
            if new_folder is not None:
                _owned_folder(new_folder, user_id)
            session_obj.folder_id = new_folder
        for f in ("title", "position"):
            if f in payload:
                setattr(session_obj, f, payload[f])
        _get_session().flush()
        return session_obj

    @staticmethod
    def delete(session_id: int, user_id: int) -> None:
        session_obj = _owned_session(session_id, user_id)
        # Сообщения удаляются каскадом.
        _get_session().delete(session_obj)
        _get_session().flush()


class AiChatMessageDAO:
    @staticmethod
    def list_for_session(session_id: int, user_id: int) -> list[AiChatMessage]:
        _owned_session(session_id, user_id)
        return (
            _get_session()
            .query(AiChatMessage)
            .filter_by(session_id=session_id)
            .order_by(AiChatMessage.created_on, AiChatMessage.id)
            .all()
        )

    @staticmethod
    def create(
        session_id: int, payload: dict[str, Any], user_id: int
    ) -> AiChatMessage:
        session_obj = _owned_session(session_id, user_id)
        msg = AiChatMessage(
            session_id=session_obj.id,
            role=AiChatMessageRole(payload["role"]),
            content_json=payload["content_json"],
            meta_json=payload.get("meta_json"),
            created_on=datetime.utcnow(),
        )
        _get_session().add(msg)
        # Обновляем changed_on сессии для сортировки по последней активности.
        session_obj.changed_on = msg.created_on
        _get_session().flush()
        return msg
