# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""catalog_folder_scope

Добавляет колонку `scope` в `catalog_folder`. Scope разделяет иерархии
каталога: папка с scope='dashboard' видна только в режиме «Дашборды»,
scope='chart' — только в «Чартах». NULL = shared (дефолтная папка
«Без департамента» и унаследованные от старых миграций записи).

Scope нужен, чтобы админ мог построить отдельные деревья департаментов
для дашбордов и чартов — бизнес-домены и ответственные у них разные
(дашборды собирают продакты, чарты — аналитики/BI-разработчики).

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-04-22 23:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"


def upgrade() -> None:
    # Nullable-колонка: существующие записи (default folder + старые
    # департаменты) остаются с NULL → shared scope, видны в обоих режимах.
    op.add_column(
        "catalog_folder",
        sa.Column("scope", sa.String(length=16), nullable=True),
    )
    # Индекс для быстрой выборки по scope: GET /tree?scope=chart
    # фильтрует десятки-сотни папок, без индекса — seq scan.
    op.create_index(
        "ix_catalog_folder_scope",
        "catalog_folder",
        ["scope"],
    )


def downgrade() -> None:
    op.drop_index("ix_catalog_folder_scope", table_name="catalog_folder")
    op.drop_column("catalog_folder", "scope")
