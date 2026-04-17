# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""Тесты для marshmallow-схем catalog_folders."""
import pytest
from marshmallow import ValidationError

from superset.catalog_folders.schemas import (
    CatalogFolderItemsBulkSchema,
    CatalogFolderMoveSchema,
    CatalogFolderPostSchema,
    CatalogFolderPutSchema,
)


class TestCatalogFolderPostSchema:
    def test_minimal_valid(self) -> None:
        data = CatalogFolderPostSchema().load({"name": "Коммерция"})
        assert data["name"] == "Коммерция"
        assert data["parent_id"] is None
        assert data["position"] == 0

    def test_full_valid(self) -> None:
        data = CatalogFolderPostSchema().load(
            {
                "name": "Потери",
                "parent_id": 42,
                "description": "Отдел потерь",
                "color": "#F87171",
                "position": 3,
            }
        )
        assert data["color"] == "#F87171"
        assert data["parent_id"] == 42

    def test_name_required(self) -> None:
        with pytest.raises(ValidationError):
            CatalogFolderPostSchema().load({})

    def test_name_too_long(self) -> None:
        with pytest.raises(ValidationError):
            CatalogFolderPostSchema().load({"name": "x" * 256})

    @pytest.mark.parametrize(
        "bad_color",
        ["red", "#FFF", "rgb(255,0,0)", "#ZZZZZZ", "#1234567"],
    )
    def test_invalid_color_rejected(self, bad_color: str) -> None:
        with pytest.raises(ValidationError):
            CatalogFolderPostSchema().load({"name": "X", "color": bad_color})


class TestCatalogFolderPutSchema:
    def test_partial_valid(self) -> None:
        data = CatalogFolderPutSchema().load({"name": "new"})
        assert data == {"name": "new"}

    def test_empty_valid(self) -> None:
        # PUT без полей допустим (идемпотентный no-op).
        assert CatalogFolderPutSchema().load({}) == {}

    def test_color_validated_when_present(self) -> None:
        with pytest.raises(ValidationError):
            CatalogFolderPutSchema().load({"color": "not-a-hex"})


class TestCatalogFolderItemsBulkSchema:
    def test_valid(self) -> None:
        data = CatalogFolderItemsBulkSchema().load(
            {
                "items": [
                    {"object_type": "dashboard", "object_id": 1},
                    {"object_type": "chart", "object_id": 2, "position": 5},
                ]
            }
        )
        assert len(data["items"]) == 2
        assert data["items"][1]["position"] == 5

    def test_empty_list_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CatalogFolderItemsBulkSchema().load({"items": []})

    def test_unknown_object_type(self) -> None:
        with pytest.raises(ValidationError):
            CatalogFolderItemsBulkSchema().load(
                {"items": [{"object_type": "pizza", "object_id": 1}]}
            )

    def test_max_items_limit(self) -> None:
        # Граничный случай: 500 — допустимо, 501 — нет.
        CatalogFolderItemsBulkSchema().load(
            {"items": [{"object_type": "chart", "object_id": i} for i in range(500)]}
        )
        with pytest.raises(ValidationError):
            CatalogFolderItemsBulkSchema().load(
                {
                    "items": [
                        {"object_type": "chart", "object_id": i} for i in range(501)
                    ]
                }
            )


class TestCatalogFolderMoveSchema:
    def test_root_move(self) -> None:
        data = CatalogFolderMoveSchema().load({"parent_id": None})
        assert data["parent_id"] is None

    def test_with_position(self) -> None:
        data = CatalogFolderMoveSchema().load({"parent_id": 7, "position": 2})
        assert data == {"parent_id": 7, "position": 2}
