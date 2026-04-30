# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""Исключения модуля catalog_folders."""

from flask_babel import lazy_gettext as _

from superset.exceptions import SupersetException


class CatalogFolderNotFoundError(SupersetException):
    message = _("Папка каталога не найдена.")


class CatalogFolderCyclicError(SupersetException):
    message = _(
        "Нельзя поместить папку внутрь её собственной подпапки — получится цикл."
    )


class CatalogFolderInvalidParentError(SupersetException):
    message = _("Родительская папка не найдена или указывает сама на себя.")


class CatalogFolderItemInvalidObjectError(SupersetException):
    message = _(
        "Объект с таким типом и id не существует в каталоге — добавление отклонено."
    )


class CatalogFolderCannotDeleteDefaultError(SupersetException):
    message = _(
        "Дефолтную папку «Без департамента» удалить нельзя — в неё попадают все "
        "объекты, не привязанные к другим папкам."
    )


class CatalogFolderDefaultAlreadyExistsError(SupersetException):
    message = _(
        "Дефолтная папка уже существует. Одновременно может быть только одна "
        "папка с флагом is_default."
    )
