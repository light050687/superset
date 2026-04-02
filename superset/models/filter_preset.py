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
from __future__ import annotations

from flask_appbuilder import Model
from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import relationship
from sqlalchemy_utils import UUIDType

from superset.models.helpers import AuditMixinNullable


class FilterPreset(AuditMixinNullable, Model):
    """Named filter preset for a dashboard."""

    __tablename__ = "dashboard_filter_preset"

    id = Column(Integer, primary_key=True)
    uuid = Column(UUIDType(), unique=True)
    dashboard_id = Column(
        Integer,
        ForeignKey("dashboards.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    filter_data = Column(
        Text().with_variant(mysql.MEDIUMTEXT(), "mysql"),
        nullable=False,
    )
    included_filters = Column(
        Text().with_variant(mysql.MEDIUMTEXT(), "mysql"),
        nullable=True,
    )
    is_admin_preset = Column(Boolean, default=False, nullable=False)
    is_shared = Column(Boolean, default=True, nullable=False)

    dashboard = relationship(
        "Dashboard",
        foreign_keys=[dashboard_id],
    )

    __table_args__ = (
        UniqueConstraint(
            "dashboard_id",
            "created_by_fk",
            "name",
            name="uq_dashboard_filter_preset_dashboard_user_name",
        ),
    )

    def __repr__(self) -> str:
        return f"<FilterPreset {self.name} (dashboard={self.dashboard_id})>"


class UserDefaultPreset(Model):
    """Tracks which preset is default for a user on a specific dashboard."""

    __tablename__ = "user_default_preset"

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer,
        ForeignKey("ab_user.id", ondelete="CASCADE"),
        nullable=False,
    )
    dashboard_id = Column(
        Integer,
        ForeignKey("dashboards.id", ondelete="CASCADE"),
        nullable=False,
    )
    preset_id = Column(
        Integer,
        ForeignKey("dashboard_filter_preset.id", ondelete="CASCADE"),
        nullable=False,
    )

    preset = relationship("FilterPreset", foreign_keys=[preset_id])

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "dashboard_id",
            name="uq_user_default_preset_user_dashboard",
        ),
    )


class HiddenPreset(Model):
    """Tracks which admin presets a user has hidden."""

    __tablename__ = "hidden_preset"

    user_id = Column(
        Integer,
        ForeignKey("ab_user.id", ondelete="CASCADE"),
        primary_key=True,
    )
    preset_id = Column(
        Integer,
        ForeignKey("dashboard_filter_preset.id", ondelete="CASCADE"),
        primary_key=True,
    )
