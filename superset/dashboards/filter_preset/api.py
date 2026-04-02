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

from flask import g, request, Response
from flask_appbuilder.api import expose, protect, safe
from marshmallow import ValidationError

from superset.commands.dashboard.exceptions import (
    DashboardAccessDeniedError,
    DashboardNotFoundError,
)
from superset.constants import MODEL_API_RW_METHOD_PERMISSION_MAP
from superset.daos.dashboard import DashboardDAO
from superset.daos.filter_preset import FilterPresetDAO
from superset.dashboards.filter_preset.schemas import (
    FilterPresetImportSchema,
    FilterPresetPostSchema,
    FilterPresetPutSchema,
)
from superset.extensions import event_logger
from superset.models.filter_preset import FilterPreset
from superset.views.base_api import BaseSupersetApi, requires_json

logger = logging.getLogger(__name__)


class DashboardFilterPresetRestApi(BaseSupersetApi):
    method_permission_name = MODEL_API_RW_METHOD_PERMISSION_MAP
    allow_browser_login = True
    class_permission_name = "DashboardFilterPresetRestApi"
    resource_name = "dashboard"
    openapi_spec_tag = "Dashboard Filter Presets"

    def _check_dashboard_access(self, dashboard_id: int | str) -> None:
        """Validate dashboard exists and user has access."""
        DashboardDAO.get_by_id_or_slug(str(dashboard_id))

    @expose("/<int:dashboard_id>/presets", methods=("GET",))
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.list",
        log_to_statsd=False,
    )
    def list_presets(self, dashboard_id: int) -> Response:
        """List filter presets for a dashboard.
        ---
        get:
          summary: List filter presets for a dashboard
          parameters:
          - in: path
            schema:
              type: integer
            name: dashboard_id
          - in: query
            schema:
              type: string
            name: q
            description: Search query for preset name/description
          responses:
            200:
              description: List of presets
            401:
              $ref: '#/components/responses/401'
            404:
              $ref: '#/components/responses/404'
        """
        try:
            self._check_dashboard_access(dashboard_id)
            query = request.args.get("q")
            presets = FilterPresetDAO.get_presets_for_dashboard(
                dashboard_id=dashboard_id,
                user_id=g.user.id,
                query=query,
            )
            return self.response(200, result=presets)
        except DashboardAccessDeniedError as ex:
            return self.response(403, message=str(ex))
        except DashboardNotFoundError as ex:
            return self.response(404, message=str(ex))

    @expose("/<int:dashboard_id>/presets", methods=("POST",))
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.create",
        log_to_statsd=False,
    )
    @requires_json
    def create_preset(self, dashboard_id: int) -> Response:
        """Create a new filter preset.
        ---
        post:
          summary: Create a new filter preset for a dashboard
          parameters:
          - in: path
            schema:
              type: integer
            name: dashboard_id
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/FilterPresetPostSchema'
          responses:
            201:
              description: Preset created successfully
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            404:
              $ref: '#/components/responses/404'
        """
        try:
            self._check_dashboard_access(dashboard_id)
            schema = FilterPresetPostSchema()
            data = schema.load(request.json)

            # Only admins can create admin presets
            if data.get("is_admin_preset") and not g.user.is_admin:
                return self.response(
                    403,
                    message="Only administrators can create admin presets",
                )

            preset = FilterPresetDAO.create_preset(
                dashboard_id=dashboard_id,
                name=data["name"],
                filter_data=data["filter_data"],
                included_filters=data["included_filters"],
                description=data.get("description"),
                is_admin_preset=data.get("is_admin_preset", False),
                is_shared=data.get("is_shared", True),
            )
            return self.response(201, id=preset.id, uuid=str(preset.uuid))
        except ValidationError as ex:
            return self.response(400, message=str(ex))
        except DashboardAccessDeniedError as ex:
            return self.response(403, message=str(ex))
        except DashboardNotFoundError as ex:
            return self.response(404, message=str(ex))
        except Exception as ex:
            # Handle unique constraint violation
            if "uq_dashboard_filter_preset_dashboard_user_name" in str(ex):
                return self.response(
                    409,
                    message="Preset with this name already exists for this dashboard",
                )
            raise

    @expose("/<int:dashboard_id>/presets/<int:preset_id>", methods=("PUT",))
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.update",
        log_to_statsd=False,
    )
    @requires_json
    def update_preset(self, dashboard_id: int, preset_id: int) -> Response:
        """Update an existing filter preset.
        ---
        put:
          summary: Update a filter preset
          parameters:
          - in: path
            schema:
              type: integer
            name: dashboard_id
          - in: path
            schema:
              type: integer
            name: preset_id
          responses:
            200:
              description: Preset updated successfully
            400:
              $ref: '#/components/responses/400'
            403:
              $ref: '#/components/responses/403'
            404:
              $ref: '#/components/responses/404'
        """
        try:
            self._check_dashboard_access(dashboard_id)
            preset = FilterPresetDAO.find_by_id(preset_id)
            if not preset:
                return self.response(404, message="Preset not found")

            # Only owner can update (admin presets can't be updated by non-admins)
            if preset.is_admin_preset and not g.user.is_admin:
                return self.response(
                    403, message="Cannot modify admin presets"
                )
            if preset.created_by_fk != g.user.id and not g.user.is_admin:
                return self.response(
                    403, message="Can only modify your own presets"
                )

            schema = FilterPresetPutSchema()
            data = schema.load(request.json)
            FilterPresetDAO.update_preset(preset_id, **data)
            return self.response(200, message="Preset updated")
        except ValidationError as ex:
            return self.response(400, message=str(ex))
        except DashboardAccessDeniedError as ex:
            return self.response(403, message=str(ex))
        except DashboardNotFoundError as ex:
            return self.response(404, message=str(ex))

    @expose("/<int:dashboard_id>/presets/<int:preset_id>", methods=("DELETE",))
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.delete",
        log_to_statsd=False,
    )
    def delete_preset(self, dashboard_id: int, preset_id: int) -> Response:
        """Delete a filter preset.
        ---
        delete:
          summary: Delete a filter preset
          parameters:
          - in: path
            schema:
              type: integer
            name: dashboard_id
          - in: path
            schema:
              type: integer
            name: preset_id
          responses:
            200:
              description: Preset deleted
            403:
              $ref: '#/components/responses/403'
            404:
              $ref: '#/components/responses/404'
        """
        try:
            self._check_dashboard_access(dashboard_id)
            preset = FilterPresetDAO.find_by_id(preset_id)
            if not preset:
                return self.response(404, message="Preset not found")
            if preset.created_by_fk != g.user.id and not g.user.is_admin:
                return self.response(
                    403, message="Can only delete your own presets"
                )

            FilterPresetDAO.delete_preset(preset_id)
            return self.response(200, message="Preset deleted")
        except DashboardAccessDeniedError as ex:
            return self.response(403, message=str(ex))
        except DashboardNotFoundError as ex:
            return self.response(404, message=str(ex))

    @expose(
        "/<int:dashboard_id>/presets/<int:preset_id>/set-default",
        methods=("POST",),
    )
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.set_default",
        log_to_statsd=False,
    )
    def set_default(self, dashboard_id: int, preset_id: int) -> Response:
        """Set a preset as the user's default for this dashboard.
        ---
        post:
          summary: Set preset as default
          parameters:
          - in: path
            schema:
              type: integer
            name: dashboard_id
          - in: path
            schema:
              type: integer
            name: preset_id
          responses:
            200:
              description: Default preset set
        """
        try:
            self._check_dashboard_access(dashboard_id)
            preset = FilterPresetDAO.find_by_id(preset_id)
            if not preset:
                return self.response(404, message="Preset not found")

            FilterPresetDAO.set_default(g.user.id, dashboard_id, preset_id)
            return self.response(200, message="Default preset set")
        except DashboardAccessDeniedError as ex:
            return self.response(403, message=str(ex))
        except DashboardNotFoundError as ex:
            return self.response(404, message=str(ex))

    @expose("/<int:dashboard_id>/presets/default", methods=("DELETE",))
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.remove_default",
        log_to_statsd=False,
    )
    def remove_default(self, dashboard_id: int) -> Response:
        """Remove the user's default preset for this dashboard.
        ---
        delete:
          summary: Remove default preset
          parameters:
          - in: path
            schema:
              type: integer
            name: dashboard_id
          responses:
            200:
              description: Default removed
        """
        try:
            self._check_dashboard_access(dashboard_id)
            FilterPresetDAO.remove_default(g.user.id, dashboard_id)
            return self.response(200, message="Default preset removed")
        except DashboardAccessDeniedError as ex:
            return self.response(403, message=str(ex))
        except DashboardNotFoundError as ex:
            return self.response(404, message=str(ex))

    @expose("/<int:dashboard_id>/presets/default", methods=("GET",))
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.get_default",
        log_to_statsd=False,
    )
    def get_default(self, dashboard_id: int) -> Response:
        """Get the user's default preset for this dashboard.
        ---
        get:
          summary: Get default preset
          parameters:
          - in: path
            schema:
              type: integer
            name: dashboard_id
          responses:
            200:
              description: Default preset data (or null)
        """
        try:
            self._check_dashboard_access(dashboard_id)
            preset = FilterPresetDAO.get_default_preset(
                g.user.id, dashboard_id
            )
            return self.response(200, result=preset)
        except DashboardAccessDeniedError as ex:
            return self.response(403, message=str(ex))
        except DashboardNotFoundError as ex:
            return self.response(404, message=str(ex))

    @expose(
        "/<int:dashboard_id>/presets/<int:preset_id>/hide",
        methods=("POST",),
    )
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.hide",
        log_to_statsd=False,
    )
    def hide_preset(self, dashboard_id: int, preset_id: int) -> Response:
        """Hide an admin preset from the current user's view.
        ---
        post:
          summary: Hide an admin preset
          parameters:
          - in: path
            schema:
              type: integer
            name: dashboard_id
          - in: path
            schema:
              type: integer
            name: preset_id
          responses:
            200:
              description: Preset hidden
        """
        try:
            self._check_dashboard_access(dashboard_id)
            FilterPresetDAO.hide_preset(g.user.id, preset_id)
            return self.response(200, message="Preset hidden")
        except DashboardAccessDeniedError as ex:
            return self.response(403, message=str(ex))
        except DashboardNotFoundError as ex:
            return self.response(404, message=str(ex))

    @expose(
        "/<int:dashboard_id>/presets/<int:preset_id>/hide",
        methods=("DELETE",),
    )
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.unhide",
        log_to_statsd=False,
    )
    def unhide_preset(self, dashboard_id: int, preset_id: int) -> Response:
        """Unhide a previously hidden admin preset.
        ---
        delete:
          summary: Unhide an admin preset
          parameters:
          - in: path
            schema:
              type: integer
            name: dashboard_id
          - in: path
            schema:
              type: integer
            name: preset_id
          responses:
            200:
              description: Preset unhidden
        """
        try:
            self._check_dashboard_access(dashboard_id)
            FilterPresetDAO.unhide_preset(g.user.id, preset_id)
            return self.response(200, message="Preset unhidden")
        except DashboardAccessDeniedError as ex:
            return self.response(403, message=str(ex))
        except DashboardNotFoundError as ex:
            return self.response(404, message=str(ex))

    @expose(
        "/<int:dashboard_id>/presets/<int:preset_id>/export",
        methods=("GET",),
    )
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.export",
        log_to_statsd=False,
    )
    def export_preset(self, dashboard_id: int, preset_id: int) -> Response:
        """Export a preset as JSON.
        ---
        get:
          summary: Export a preset as JSON
          parameters:
          - in: path
            schema:
              type: integer
            name: dashboard_id
          - in: path
            schema:
              type: integer
            name: preset_id
          responses:
            200:
              description: Preset export data
            404:
              $ref: '#/components/responses/404'
        """
        try:
            self._check_dashboard_access(dashboard_id)
            export_data = FilterPresetDAO.get_preset_for_export(preset_id)
            if not export_data:
                return self.response(404, message="Preset not found")
            return self.response(200, result=export_data)
        except DashboardAccessDeniedError as ex:
            return self.response(403, message=str(ex))
        except DashboardNotFoundError as ex:
            return self.response(404, message=str(ex))

    @expose("/<int:dashboard_id>/presets/import", methods=("POST",))
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.import_preset",
        log_to_statsd=False,
    )
    @requires_json
    def import_preset(self, dashboard_id: int) -> Response:
        """Import a preset from JSON.
        ---
        post:
          summary: Import a preset from JSON export
          parameters:
          - in: path
            schema:
              type: integer
            name: dashboard_id
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/FilterPresetImportSchema'
          responses:
            201:
              description: Preset imported
            400:
              $ref: '#/components/responses/400'
        """
        try:
            self._check_dashboard_access(dashboard_id)
            schema = FilterPresetImportSchema()
            data = schema.load(request.json)

            preset = FilterPresetDAO.create_preset(
                dashboard_id=dashboard_id,
                name=data["name"],
                filter_data=data["filter_data"],
                included_filters=data["included_filters"],
                description=data.get("description"),
                is_admin_preset=False,
                is_shared=True,
            )
            return self.response(201, id=preset.id, uuid=str(preset.uuid))
        except ValidationError as ex:
            return self.response(400, message=str(ex))
        except DashboardAccessDeniedError as ex:
            return self.response(403, message=str(ex))
        except DashboardNotFoundError as ex:
            return self.response(404, message=str(ex))
        except Exception as ex:
            if "uq_dashboard_filter_preset_dashboard_user_name" in str(ex):
                return self.response(
                    409,
                    message="Preset with this name already exists for this dashboard",
                )
            raise
