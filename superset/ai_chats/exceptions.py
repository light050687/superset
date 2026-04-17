# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""Исключения модуля ai_chats."""

from flask_babel import lazy_gettext as _

from superset.exceptions import SupersetException


class AiChatNotFoundError(SupersetException):
    message = _("Чат, папка или сообщение не найдены.")


class AiChatAccessDeniedError(SupersetException):
    message = _("Нет доступа к этому чату.")


class AiChatCyclicError(SupersetException):
    message = _(
        "Нельзя вложить папку чатов в её собственную подпапку — получится цикл."
    )
