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

from marshmallow import fields, Schema, validate


class FilterPresetPostSchema(Schema):
    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=256),
        metadata={"description": "Preset name"},
    )
    description = fields.String(
        allow_none=True,
        metadata={"description": "Preset description"},
    )
    filter_data = fields.Dict(
        required=True,
        metadata={"description": "DataMask JSON with selected filter values"},
    )
    included_filters = fields.List(
        fields.String(),
        required=True,
        metadata={"description": "List of filter IDs included in this preset"},
    )
    is_admin_preset = fields.Boolean(
        load_default=False,
        metadata={"description": "Admin preset — read-only for regular users"},
    )
    is_shared = fields.Boolean(
        load_default=True,
        metadata={"description": "Visible to all users of this dashboard"},
    )


class FilterPresetPutSchema(Schema):
    name = fields.String(
        validate=validate.Length(min=1, max=256),
        metadata={"description": "Preset name"},
    )
    description = fields.String(
        allow_none=True,
        metadata={"description": "Preset description"},
    )
    filter_data = fields.Dict(
        metadata={"description": "DataMask JSON with selected filter values"},
    )
    included_filters = fields.List(
        fields.String(),
        metadata={"description": "List of filter IDs included in this preset"},
    )
    is_shared = fields.Boolean(
        metadata={"description": "Visible to all users of this dashboard"},
    )


class FilterPresetImportSchema(Schema):
    version = fields.Integer(
        required=True,
        metadata={"description": "Export format version"},
    )
    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=256),
        metadata={"description": "Preset name"},
    )
    description = fields.String(
        allow_none=True,
        metadata={"description": "Preset description"},
    )
    filter_data = fields.Dict(
        required=True,
        metadata={"description": "DataMask JSON with selected filter values"},
    )
    included_filters = fields.List(
        fields.String(),
        required=True,
        metadata={"description": "List of filter IDs included in this preset"},
    )
    metadata = fields.Dict(
        load_default={},
        metadata={"description": "Export metadata (created_by, created_at)"},
    )
