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
"""Модели для ИИ-чатов.

Каждый пользователь видит и изменяет только свои чаты и папки.
Админ может видеть все (для модерации), но это контролируется правами FAB.
"""
from __future__ import annotations

import enum
from typing import Any

from flask_appbuilder import Model
from sqlalchemy import (
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
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import relationship

from superset.models.helpers import AuditMixinNullable, UUIDMixin


class AiChatMessageRole(str, enum.Enum):
    """Роль сообщения в чате. Строковый enum для стабильного JSON."""

    USER = "user"
    BOT = "bot"
    THINKING = "thinking"
    SYSTEM = "system"


class AiChatFolder(Model, AuditMixinNullable):
    """Папка чатов. Произвольная вложенность через parent_id.

    Изоляция по пользователю: уникальность (parent_id, name, created_by_fk).
    """

    __tablename__ = "ai_chat_folder"
    __table_args__ = (
        UniqueConstraint(
            "parent_id",
            "name",
            "created_by_fk",
            name="uq_ai_chat_folder_parent_name_user",
        ),
        Index("ix_ai_chat_folder_user", "created_by_fk"),
    )

    id = Column(Integer, primary_key=True)
    parent_id = Column(
        Integer,
        ForeignKey("ai_chat_folder.id", ondelete="SET NULL"),
        nullable=True,
    )
    name = Column(String(255), nullable=False)
    position = Column(Integer, nullable=False, default=0)

    parent = relationship(
        "AiChatFolder",
        remote_side="AiChatFolder.id",
        backref="children",
    )

    def __repr__(self) -> str:
        return f"<AiChatFolder id={self.id} name={self.name!r}>"


class AiChatSession(Model, AuditMixinNullable, UUIDMixin):
    """Сессия чата (одна «переписка» с ИИ).

    Если folder_id = NULL — сессия в «Без папки».
    """

    __tablename__ = "ai_chat_session"
    __table_args__ = (
        Index("ix_ai_chat_session_folder", "folder_id"),
        Index("ix_ai_chat_session_user_changed", "created_by_fk", "changed_on"),
    )

    id = Column(Integer, primary_key=True)
    folder_id = Column(
        Integer,
        ForeignKey("ai_chat_folder.id", ondelete="SET NULL"),
        nullable=True,
    )
    title = Column(String(512), nullable=False)
    position = Column(Integer, nullable=False, default=0)

    folder = relationship("AiChatFolder")
    messages = relationship(
        "AiChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="AiChatMessage.created_on",
    )

    def __repr__(self) -> str:
        return f"<AiChatSession id={self.id} title={self.title!r}>"


class AiChatMessage(Model):
    """Одно сообщение в чате.

    content_json хранит либо простой текст ({"text": "..."}), либо
    структурированный ответ от ai-analytics
    ({"title": "...", "kpi": [...], "chart": {...}, "actions": [...], ...}).
    Используем MEDIUMTEXT на MySQL, т.к. чарты могут содержать SVG/точки данных.
    """

    __tablename__ = "ai_chat_message"
    __table_args__ = (
        Index("ix_ai_chat_message_session", "session_id"),
    )

    id = Column(Integer, primary_key=True)
    session_id = Column(
        Integer,
        ForeignKey("ai_chat_session.id", ondelete="CASCADE"),
        nullable=False,
    )
    role = Column(
        Enum(
            AiChatMessageRole,
            name="ai_chat_message_role",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    content_json = Column(
        Text().with_variant(mysql.MEDIUMTEXT(), "mysql"),
        nullable=False,
    )
    # Стоимость/метрики запроса для биллинга и аналитики (JSON).
    meta_json = Column(
        Text().with_variant(mysql.MEDIUMTEXT(), "mysql"),
        nullable=True,
    )
    created_on = Column(DateTime, nullable=True)

    session = relationship("AiChatSession", back_populates="messages")

    def __repr__(self) -> str:
        return f"<AiChatMessage id={self.id} role={self.role.value}>"
