# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""ИИ-чаты: папки, сессии и сообщения.

Хранятся в metadata DB Superset, потому что содержат пользовательские
диалоги с ИИ-аналитиком, которые нужно персистить между сессиями.
Сами вычисления LLM — в ai-analytics Go-сервисе (POST /api/v1/analyze).
"""
