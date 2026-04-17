# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""catalog_and_ai_chats

Добавляет таблицы для админ-управляемых папок каталога и AI-чатов:
- catalog_folder, catalog_folder_item
- ai_chat_folder, ai_chat_session, ai_chat_message

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-17 10:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql
from sqlalchemy_utils import UUIDType

from superset.migrations.shared.utils import (
    create_fks_for_table,
    create_table,
    drop_table,
)

# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"


CATALOG_OBJECT_TYPE_VALUES = (
    "dashboard",
    "chart",
    "dataset",
    "saved_query",
    "ai_document",
    "ai_spreadsheet",
)

AI_CHAT_MESSAGE_ROLE_VALUES = ("user", "bot", "thinking", "system")


def upgrade():
    # ═══ CATALOG FOLDERS ═══
    create_table(
        "catalog_folder",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("uuid", UUIDType(binary=True), nullable=True),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("color", sa.String(length=7), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_on", sa.DateTime(), nullable=True),
        sa.Column("changed_on", sa.DateTime(), nullable=True),
        sa.Column("created_by_fk", sa.Integer(), nullable=True),
        sa.Column("changed_by_fk", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint(
            "parent_id", "name", name="uq_catalog_folder_parent_name"
        ),
    )

    create_fks_for_table(
        "fk_catalog_folder_parent_id",
        "catalog_folder",
        "catalog_folder",
        ["parent_id"],
        ["id"],
        ondelete="SET NULL",
    )
    create_fks_for_table(
        "fk_catalog_folder_created_by_fk_ab_user",
        "catalog_folder",
        "ab_user",
        ["created_by_fk"],
        ["id"],
    )
    create_fks_for_table(
        "fk_catalog_folder_changed_by_fk_ab_user",
        "catalog_folder",
        "ab_user",
        ["changed_by_fk"],
        ["id"],
    )

    create_table(
        "catalog_folder_item",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("folder_id", sa.Integer(), nullable=False),
        sa.Column(
            "object_type",
            sa.Enum(
                *CATALOG_OBJECT_TYPE_VALUES, name="catalog_object_type"
            ),
            nullable=False,
        ),
        sa.Column("object_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_on", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "folder_id",
            "object_type",
            "object_id",
            name="uq_catalog_folder_item_folder_object",
        ),
    )

    create_fks_for_table(
        "fk_catalog_folder_item_folder_id",
        "catalog_folder_item",
        "catalog_folder",
        ["folder_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # ═══ AI CHATS ═══
    create_table(
        "ai_chat_folder",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_on", sa.DateTime(), nullable=True),
        sa.Column("changed_on", sa.DateTime(), nullable=True),
        sa.Column("created_by_fk", sa.Integer(), nullable=True),
        sa.Column("changed_by_fk", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "parent_id",
            "name",
            "created_by_fk",
            name="uq_ai_chat_folder_parent_name_user",
        ),
    )

    create_fks_for_table(
        "fk_ai_chat_folder_parent_id",
        "ai_chat_folder",
        "ai_chat_folder",
        ["parent_id"],
        ["id"],
        ondelete="SET NULL",
    )
    create_fks_for_table(
        "fk_ai_chat_folder_created_by_fk_ab_user",
        "ai_chat_folder",
        "ab_user",
        ["created_by_fk"],
        ["id"],
    )
    create_fks_for_table(
        "fk_ai_chat_folder_changed_by_fk_ab_user",
        "ai_chat_folder",
        "ab_user",
        ["changed_by_fk"],
        ["id"],
    )

    create_table(
        "ai_chat_session",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("uuid", UUIDType(binary=True), nullable=True),
        sa.Column("folder_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_on", sa.DateTime(), nullable=True),
        sa.Column("changed_on", sa.DateTime(), nullable=True),
        sa.Column("created_by_fk", sa.Integer(), nullable=True),
        sa.Column("changed_by_fk", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )

    create_fks_for_table(
        "fk_ai_chat_session_folder_id",
        "ai_chat_session",
        "ai_chat_folder",
        ["folder_id"],
        ["id"],
        ondelete="SET NULL",
    )
    create_fks_for_table(
        "fk_ai_chat_session_created_by_fk_ab_user",
        "ai_chat_session",
        "ab_user",
        ["created_by_fk"],
        ["id"],
    )
    create_fks_for_table(
        "fk_ai_chat_session_changed_by_fk_ab_user",
        "ai_chat_session",
        "ab_user",
        ["changed_by_fk"],
        ["id"],
    )

    create_table(
        "ai_chat_message",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                *AI_CHAT_MESSAGE_ROLE_VALUES, name="ai_chat_message_role"
            ),
            nullable=False,
        ),
        sa.Column(
            "content_json",
            sa.Text().with_variant(mysql.MEDIUMTEXT(), "mysql"),
            nullable=False,
        ),
        sa.Column(
            "meta_json",
            sa.Text().with_variant(mysql.MEDIUMTEXT(), "mysql"),
            nullable=True,
        ),
        sa.Column("created_on", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    create_fks_for_table(
        "fk_ai_chat_message_session_id",
        "ai_chat_message",
        "ai_chat_session",
        ["session_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Индексы для частых запросов (отдельно от UniqueConstraint).
    op.create_index(
        "ix_catalog_folder_parent_id", "catalog_folder", ["parent_id"]
    )
    op.create_index(
        "ix_catalog_folder_item_object",
        "catalog_folder_item",
        ["object_type", "object_id"],
    )
    op.create_index(
        "ix_ai_chat_folder_user", "ai_chat_folder", ["created_by_fk"]
    )
    op.create_index(
        "ix_ai_chat_session_folder", "ai_chat_session", ["folder_id"]
    )
    op.create_index(
        "ix_ai_chat_session_user_changed",
        "ai_chat_session",
        ["created_by_fk", "changed_on"],
    )
    op.create_index(
        "ix_ai_chat_message_session", "ai_chat_message", ["session_id"]
    )


def downgrade():
    op.drop_index("ix_ai_chat_message_session", table_name="ai_chat_message")
    op.drop_index(
        "ix_ai_chat_session_user_changed", table_name="ai_chat_session"
    )
    op.drop_index("ix_ai_chat_session_folder", table_name="ai_chat_session")
    op.drop_index("ix_ai_chat_folder_user", table_name="ai_chat_folder")
    op.drop_index(
        "ix_catalog_folder_item_object", table_name="catalog_folder_item"
    )
    op.drop_index("ix_catalog_folder_parent_id", table_name="catalog_folder")

    drop_table("ai_chat_message")
    drop_table("ai_chat_session")
    drop_table("ai_chat_folder")
    drop_table("catalog_folder_item")
    drop_table("catalog_folder")
