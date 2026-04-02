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

import logging
import uuid as uuid_module
from typing import Any, Optional

from sqlalchemy import and_, or_

from superset.daos.base import BaseDAO
from superset.extensions import db
from superset.models.filter_preset import (
    FilterPreset,
    HiddenPreset,
    UserDefaultPreset,
)
from superset.utils import json

logger = logging.getLogger(__name__)


class FilterPresetDAO(BaseDAO[FilterPreset]):
    @staticmethod
    def get_presets_for_dashboard(
        dashboard_id: int,
        user_id: int,
        query: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Get presets visible to this user for a dashboard:
        - user's own presets
        - shared presets from other users
        - admin presets (not hidden by this user)
        """
        hidden_ids = (
            db.session.query(HiddenPreset.preset_id)
            .filter(HiddenPreset.user_id == user_id)
            .subquery()
        )

        base_query = db.session.query(FilterPreset).filter(
            FilterPreset.dashboard_id == dashboard_id,
            ~FilterPreset.id.in_(hidden_ids),
            or_(
                FilterPreset.created_by_fk == user_id,
                FilterPreset.is_shared == True,  # noqa: E712
                FilterPreset.is_admin_preset == True,  # noqa: E712
            ),
        )

        if query:
            search_term = f"%{query}%"
            base_query = base_query.filter(
                or_(
                    FilterPreset.name.ilike(search_term),
                    FilterPreset.description.ilike(search_term),
                )
            )

        presets = base_query.order_by(
            FilterPreset.is_admin_preset.desc(),
            FilterPreset.name,
        ).all()

        # Get default preset id for this user + dashboard
        default_preset_id = None
        default_entry = (
            db.session.query(UserDefaultPreset)
            .filter(
                UserDefaultPreset.user_id == user_id,
                UserDefaultPreset.dashboard_id == dashboard_id,
            )
            .one_or_none()
        )
        if default_entry:
            default_preset_id = default_entry.preset_id

        result = []
        for preset in presets:
            result.append(
                {
                    "id": preset.id,
                    "uuid": str(preset.uuid) if preset.uuid else None,
                    "name": preset.name,
                    "description": preset.description,
                    "filter_data": json.loads(preset.filter_data)
                    if preset.filter_data
                    else {},
                    "included_filters": json.loads(preset.included_filters)
                    if preset.included_filters
                    else [],
                    "is_admin_preset": preset.is_admin_preset,
                    "is_shared": preset.is_shared,
                    "is_default": preset.id == default_preset_id,
                    "created_by": {
                        "id": preset.created_by_fk,
                        "first_name": (
                            preset.created_by.first_name
                            if preset.created_by
                            else None
                        ),
                        "last_name": (
                            preset.created_by.last_name
                            if preset.created_by
                            else None
                        ),
                    },
                    "created_on": (
                        preset.created_on.isoformat()
                        if preset.created_on
                        else None
                    ),
                    "is_own": preset.created_by_fk == user_id,
                }
            )
        return result

    @staticmethod
    def create_preset(
        dashboard_id: int,
        name: str,
        filter_data: dict[str, Any],
        included_filters: list[str],
        description: str | None = None,
        is_admin_preset: bool = False,
        is_shared: bool = True,
    ) -> FilterPreset:
        preset = FilterPreset(
            uuid=uuid_module.uuid4(),
            dashboard_id=dashboard_id,
            name=name,
            description=description,
            filter_data=json.dumps(filter_data),
            included_filters=json.dumps(included_filters),
            is_admin_preset=is_admin_preset,
            is_shared=is_shared,
        )
        db.session.add(preset)
        db.session.commit()
        return preset

    @staticmethod
    def update_preset(
        preset_id: int,
        **kwargs: Any,
    ) -> FilterPreset:
        preset = db.session.query(FilterPreset).get(preset_id)
        if not preset:
            raise ValueError(f"Preset {preset_id} not found")

        for key, value in kwargs.items():
            if key == "filter_data" and isinstance(value, dict):
                value = json.dumps(value)
            elif key == "included_filters" and isinstance(value, list):
                value = json.dumps(value)
            setattr(preset, key, value)

        db.session.commit()
        return preset

    @staticmethod
    def delete_preset(preset_id: int) -> None:
        preset = db.session.query(FilterPreset).get(preset_id)
        if preset:
            db.session.delete(preset)
            db.session.commit()

    @staticmethod
    def set_default(
        user_id: int,
        dashboard_id: int,
        preset_id: int,
    ) -> UserDefaultPreset:
        entry = (
            db.session.query(UserDefaultPreset)
            .filter(
                UserDefaultPreset.user_id == user_id,
                UserDefaultPreset.dashboard_id == dashboard_id,
            )
            .one_or_none()
        )
        if entry:
            entry.preset_id = preset_id
        else:
            entry = UserDefaultPreset(
                user_id=user_id,
                dashboard_id=dashboard_id,
                preset_id=preset_id,
            )
            db.session.add(entry)
        db.session.commit()
        return entry

    @staticmethod
    def remove_default(user_id: int, dashboard_id: int) -> None:
        entry = (
            db.session.query(UserDefaultPreset)
            .filter(
                UserDefaultPreset.user_id == user_id,
                UserDefaultPreset.dashboard_id == dashboard_id,
            )
            .one_or_none()
        )
        if entry:
            db.session.delete(entry)
            db.session.commit()

    @staticmethod
    def get_default_preset(
        user_id: int,
        dashboard_id: int,
    ) -> Optional[dict[str, Any]]:
        entry = (
            db.session.query(UserDefaultPreset)
            .filter(
                UserDefaultPreset.user_id == user_id,
                UserDefaultPreset.dashboard_id == dashboard_id,
            )
            .one_or_none()
        )
        if not entry:
            return None

        preset = db.session.query(FilterPreset).get(entry.preset_id)
        if not preset:
            return None

        return {
            "id": preset.id,
            "name": preset.name,
            "filter_data": json.loads(preset.filter_data)
            if preset.filter_data
            else {},
            "included_filters": json.loads(preset.included_filters)
            if preset.included_filters
            else [],
        }

    @staticmethod
    def hide_preset(user_id: int, preset_id: int) -> None:
        existing = (
            db.session.query(HiddenPreset)
            .filter(
                HiddenPreset.user_id == user_id,
                HiddenPreset.preset_id == preset_id,
            )
            .one_or_none()
        )
        if not existing:
            entry = HiddenPreset(user_id=user_id, preset_id=preset_id)
            db.session.add(entry)
            db.session.commit()

    @staticmethod
    def unhide_preset(user_id: int, preset_id: int) -> None:
        entry = (
            db.session.query(HiddenPreset)
            .filter(
                HiddenPreset.user_id == user_id,
                HiddenPreset.preset_id == preset_id,
            )
            .one_or_none()
        )
        if entry:
            db.session.delete(entry)
            db.session.commit()

    @staticmethod
    def get_preset_for_export(preset_id: int) -> Optional[dict[str, Any]]:
        preset = db.session.query(FilterPreset).get(preset_id)
        if not preset:
            return None

        return {
            "version": 1,
            "name": preset.name,
            "description": preset.description,
            "filter_data": json.loads(preset.filter_data)
            if preset.filter_data
            else {},
            "included_filters": json.loads(preset.included_filters)
            if preset.included_filters
            else [],
            "metadata": {
                "created_by": (
                    f"{preset.created_by.first_name} {preset.created_by.last_name}"
                    if preset.created_by
                    else "Unknown"
                ),
                "created_at": (
                    preset.created_on.isoformat() if preset.created_on else None
                ),
            },
        }
