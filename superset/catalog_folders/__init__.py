# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
"""Админ-управляемые папки каталога с произвольной вложенностью.

Используются новым shell v2 (rail + drawer) для группировки дашбордов,
чартов, датасетов, сохранённых запросов и AI-документов по департаментам
или любым другим кастомным иерархиям. Каждый объект может быть связан
с несколькими папками (many-to-many через catalog_folder_item).
"""
