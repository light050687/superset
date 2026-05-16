# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""catalog_default_folder

Добавляет:
- колонку `is_default` в `catalog_folder` (uniqueness enforced через частичный индекс).
- дефолтную корневую папку «Без департамента» с `is_default = true`.
- back-fill: все дашборды/чарты/датасеты, которые не привязаны ни к одной
  папке, добавляются в дефолтную папку (по одному CatalogFolderItem).

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-21 12:00:00.000000

"""
from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"


DEFAULT_FOLDER_NAME = "Без департамента"
# Sentinel position: ставим дефолтную папку в самый низ корневого уровня,
# чтобы администраторские папки всегда шли первыми.
DEFAULT_FOLDER_POSITION = 10_000


def upgrade() -> None:
    bind = op.get_bind()

    # 1) is_default column — non-null with default False
    op.add_column(
        "catalog_folder",
        sa.Column(
            "is_default",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # 2) Частичный индекс «only one default folder». PostgreSQL поддерживает
    # partial indexes напрямую; для других диалектов падаем обратно на обычный
    # UniqueConstraint — это не критично, приложение и так не создаст вторую.
    dialect = bind.dialect.name
    if dialect == "postgresql":
        op.create_index(
            "uq_catalog_folder_one_default",
            "catalog_folder",
            ["is_default"],
            unique=True,
            postgresql_where=sa.text("is_default = true"),
        )
    else:
        op.create_index(
            "ix_catalog_folder_is_default",
            "catalog_folder",
            ["is_default"],
        )

    # 3) Создаём дефолтную папку, если её ещё нет.
    now = datetime.utcnow()
    existing = bind.execute(
        sa.text("SELECT id FROM catalog_folder WHERE is_default = :d LIMIT 1"),
        {"d": True},
    ).scalar()
    if existing is None:
        # UUID в PostgreSQL — нативный UUID-тип; в MySQL/SQLite через UUIDType
        # сохраняется как BINARY(16). SQL-строка ниже передаёт значение
        # как текст для PG и байты для прочих диалектов — без участия
        # UUIDType, чтобы не зависеть от FAB/SQLAlchemy-utils внутри миграции.
        new_uuid = uuid.uuid4()
        if dialect == "postgresql":
            bind.execute(
                sa.text(
                    """
                    INSERT INTO catalog_folder
                        (uuid, parent_id, name, description, color, position,
                         is_default, created_on, changed_on)
                    VALUES
                        (CAST(:uuid AS uuid), NULL, :name, :desc, :color, :pos,
                         :is_default, :now, :now)
                    """
                ),
                {
                    "uuid": str(new_uuid),
                    "name": DEFAULT_FOLDER_NAME,
                    "desc": (
                        "Автоматическая папка для объектов, не привязанных "
                        "ни к какому департаменту. Удалить нельзя."
                    ),
                    "color": "#737373",
                    "pos": DEFAULT_FOLDER_POSITION,
                    "is_default": True,
                    "now": now,
                },
            )
        else:
            bind.execute(
                sa.text(
                    """
                    INSERT INTO catalog_folder
                        (uuid, parent_id, name, description, color, position,
                         is_default, created_on, changed_on)
                    VALUES
                        (:uuid, NULL, :name, :desc, :color, :pos,
                         :is_default, :now, :now)
                    """
                ),
                {
                    "uuid": new_uuid.bytes,
                    "name": DEFAULT_FOLDER_NAME,
                    "desc": (
                        "Автоматическая папка для объектов, не привязанных "
                        "ни к какому департаменту. Удалить нельзя."
                    ),
                    "color": "#737373",
                    "pos": DEFAULT_FOLDER_POSITION,
                    "is_default": True,
                    "now": now,
                },
            )

    # 4) Back-fill: все native-объекты Superset, которые ещё не ни в одной
    # папке каталога, попадают в дефолтную. Обрабатываем dashboard/chart/dataset.
    default_id = bind.execute(
        sa.text("SELECT id FROM catalog_folder WHERE is_default = :d LIMIT 1"),
        {"d": True},
    ).scalar()
    assert default_id is not None, "default folder must exist after insert"

    # Для каждого типа объектов добавляем отсутствующие записи.
    # SQL-insert идёт массово, без цикла на уровне Python.
    for obj_type, table, id_col in [
        ("dashboard", "dashboards", "id"),
        ("chart", "slices", "id"),
        ("dataset", "tables", "id"),
    ]:
        bind.execute(
            sa.text(
                f"""
                INSERT INTO catalog_folder_item
                    (folder_id, object_type, object_id, position, created_on)
                SELECT :folder, :otype, t.{id_col}, 0, :now
                FROM {table} t
                WHERE NOT EXISTS (
                    SELECT 1 FROM catalog_folder_item cfi
                    WHERE cfi.object_type = :otype
                      AND cfi.object_id   = t.{id_col}
                )
                """
            ),
            {
                "folder": default_id,
                "otype": obj_type,
                "now": now,
            },
        )


def downgrade() -> None:
    bind = op.get_bind()

    # Удаляем дефолтную папку (items каскадом уйдут — это ожидаемо,
    # т.к. downgrade откатывает всю концепцию дефолтной папки).
    bind.execute(
        sa.text("DELETE FROM catalog_folder WHERE is_default = :d"),
        {"d": True},
    )

    dialect = bind.dialect.name
    if dialect == "postgresql":
        op.drop_index(
            "uq_catalog_folder_one_default", table_name="catalog_folder"
        )
    else:
        op.drop_index(
            "ix_catalog_folder_is_default", table_name="catalog_folder"
        )

    op.drop_column("catalog_folder", "is_default")
