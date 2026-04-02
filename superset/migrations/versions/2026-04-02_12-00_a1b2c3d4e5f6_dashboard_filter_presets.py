# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
"""dashboard_filter_presets

Revision ID: a1b2c3d4e5f6
Revises: c233f5365c9e
Create Date: 2026-04-02 12:00:00.000000

"""

import sqlalchemy as sa
from sqlalchemy.dialects import mysql
from sqlalchemy_utils import UUIDType

from superset.migrations.shared.utils import (
    create_fks_for_table,
    create_table,
    drop_table,
)

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "c233f5365c9e"


def upgrade():
    # Main presets table
    create_table(
        "dashboard_filter_preset",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("uuid", UUIDType(), nullable=True),
        sa.Column("dashboard_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=256), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "filter_data",
            sa.Text().with_variant(mysql.MEDIUMTEXT(), "mysql"),
            nullable=False,
        ),
        sa.Column(
            "included_filters",
            sa.Text().with_variant(mysql.MEDIUMTEXT(), "mysql"),
            nullable=True,
        ),
        sa.Column(
            "is_admin_preset", sa.Boolean(), default=False, nullable=False
        ),
        sa.Column("is_shared", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_on", sa.DateTime(), nullable=True),
        sa.Column("changed_on", sa.DateTime(), nullable=True),
        sa.Column("created_by_fk", sa.Integer(), nullable=True),
        sa.Column("changed_by_fk", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
        sa.UniqueConstraint(
            "dashboard_id", "created_by_fk", "name",
            name="uq_dashboard_filter_preset_dashboard_user_name",
        ),
    )

    create_fks_for_table(
        "fk_dashboard_filter_preset_dashboard_id_dashboards",
        "dashboard_filter_preset",
        "dashboards",
        ["dashboard_id"],
        ["id"],
        ondelete="CASCADE",
    )

    create_fks_for_table(
        "fk_dashboard_filter_preset_created_by_fk_ab_user",
        "dashboard_filter_preset",
        "ab_user",
        ["created_by_fk"],
        ["id"],
    )

    create_fks_for_table(
        "fk_dashboard_filter_preset_changed_by_fk_ab_user",
        "dashboard_filter_preset",
        "ab_user",
        ["changed_by_fk"],
        ["id"],
    )

    # User default preset per dashboard
    create_table(
        "user_default_preset",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("dashboard_id", sa.Integer(), nullable=False),
        sa.Column("preset_id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id", "dashboard_id",
            name="uq_user_default_preset_user_dashboard",
        ),
    )

    create_fks_for_table(
        "fk_user_default_preset_user_id_ab_user",
        "user_default_preset",
        "ab_user",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    create_fks_for_table(
        "fk_user_default_preset_dashboard_id_dashboards",
        "user_default_preset",
        "dashboards",
        ["dashboard_id"],
        ["id"],
        ondelete="CASCADE",
    )

    create_fks_for_table(
        "fk_user_default_preset_preset_id_dashboard_filter_preset",
        "user_default_preset",
        "dashboard_filter_preset",
        ["preset_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Hidden admin presets per user
    create_table(
        "hidden_preset",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("preset_id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("user_id", "preset_id"),
    )

    create_fks_for_table(
        "fk_hidden_preset_user_id_ab_user",
        "hidden_preset",
        "ab_user",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    create_fks_for_table(
        "fk_hidden_preset_preset_id_dashboard_filter_preset",
        "hidden_preset",
        "dashboard_filter_preset",
        ["preset_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade():
    drop_table("hidden_preset")
    drop_table("user_default_preset")
    drop_table("dashboard_filter_preset")
