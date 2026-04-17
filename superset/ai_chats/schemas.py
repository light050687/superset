# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""Marshmallow схемы для AI-чатов."""
from __future__ import annotations

from marshmallow import fields, Schema, validate

from superset.ai_chats.models import AiChatMessageRole

ROLE_VALUES = [r.value for r in AiChatMessageRole]


# ───────── Папки ─────────


class AiChatFolderPostSchema(Schema):
    name = fields.String(
        required=True, validate=validate.Length(min=1, max=255)
    )
    parent_id = fields.Integer(allow_none=True, load_default=None)
    position = fields.Integer(load_default=0)


class AiChatFolderPutSchema(Schema):
    name = fields.String(required=False, validate=validate.Length(min=1, max=255))
    parent_id = fields.Integer(required=False, allow_none=True)
    position = fields.Integer(required=False)


# ───────── Сессии ─────────


class AiChatSessionPostSchema(Schema):
    title = fields.String(
        required=True, validate=validate.Length(min=1, max=512)
    )
    folder_id = fields.Integer(allow_none=True, load_default=None)
    position = fields.Integer(load_default=0)


class AiChatSessionPutSchema(Schema):
    title = fields.String(required=False, validate=validate.Length(min=1, max=512))
    folder_id = fields.Integer(required=False, allow_none=True)
    position = fields.Integer(required=False)


# ───────── Сообщения ─────────


class AiChatMessagePostSchema(Schema):
    role = fields.String(required=True, validate=validate.OneOf(ROLE_VALUES))
    content_json = fields.String(required=True, validate=validate.Length(min=1))
    meta_json = fields.String(required=False, allow_none=True)
