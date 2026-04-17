# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""Тесты для marshmallow-схем ai_chats."""
import pytest
from marshmallow import ValidationError

from superset.ai_chats.schemas import (
    AiChatFolderPostSchema,
    AiChatFolderPutSchema,
    AiChatMessagePostSchema,
    AiChatSessionPostSchema,
    AiChatSessionPutSchema,
)


class TestAiChatFolderPostSchema:
    def test_minimal_valid(self) -> None:
        data = AiChatFolderPostSchema().load({"name": "Финансы"})
        assert data == {"name": "Финансы", "parent_id": None, "position": 0}

    def test_name_required(self) -> None:
        with pytest.raises(ValidationError):
            AiChatFolderPostSchema().load({})

    def test_name_too_long(self) -> None:
        with pytest.raises(ValidationError):
            AiChatFolderPostSchema().load({"name": "x" * 256})


class TestAiChatFolderPutSchema:
    def test_empty_valid(self) -> None:
        assert AiChatFolderPutSchema().load({}) == {}

    def test_partial_valid(self) -> None:
        data = AiChatFolderPutSchema().load({"parent_id": 5, "position": 10})
        assert data == {"parent_id": 5, "position": 10}


class TestAiChatSessionPostSchema:
    def test_valid(self) -> None:
        data = AiChatSessionPostSchema().load({"title": "Маржа мяса"})
        assert data["title"] == "Маржа мяса"
        assert data["folder_id"] is None

    def test_title_required(self) -> None:
        with pytest.raises(ValidationError):
            AiChatSessionPostSchema().load({})


class TestAiChatSessionPutSchema:
    def test_empty_valid(self) -> None:
        assert AiChatSessionPutSchema().load({}) == {}


class TestAiChatMessagePostSchema:
    def test_valid_user_message(self) -> None:
        data = AiChatMessagePostSchema().load(
            {"role": "user", "content_json": '{"text": "Вопрос"}'}
        )
        assert data["role"] == "user"

    def test_valid_bot_message_with_meta(self) -> None:
        data = AiChatMessagePostSchema().load(
            {
                "role": "bot",
                "content_json": '{"title": "..."}',
                "meta_json": '{"tokens": 123}',
            }
        )
        assert data["meta_json"] == '{"tokens": 123}'

    def test_invalid_role(self) -> None:
        with pytest.raises(ValidationError):
            AiChatMessagePostSchema().load(
                {"role": "admin", "content_json": "{}"}
            )

    def test_empty_content_rejected(self) -> None:
        with pytest.raises(ValidationError):
            AiChatMessagePostSchema().load(
                {"role": "user", "content_json": ""}
            )
