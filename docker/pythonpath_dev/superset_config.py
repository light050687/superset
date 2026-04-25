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
#
# This file is included in the final Docker image and SHOULD be overridden when
# deploying the image to prod. Settings configured here are intended for use in local
# development environments. Also note that superset_config_docker.py is imported
# as a final step as a means to override "defaults" configured here
#
import logging
import os
import sys

from celery.schedules import crontab
from flask_caching.backends.filesystemcache import FileSystemCache

logger = logging.getLogger()

DATABASE_DIALECT = os.getenv("DATABASE_DIALECT")
DATABASE_USER = os.getenv("DATABASE_USER")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
DATABASE_HOST = os.getenv("DATABASE_HOST")
DATABASE_PORT = os.getenv("DATABASE_PORT")
DATABASE_DB = os.getenv("DATABASE_DB")

EXAMPLES_USER = os.getenv("EXAMPLES_USER")
EXAMPLES_PASSWORD = os.getenv("EXAMPLES_PASSWORD")
EXAMPLES_HOST = os.getenv("EXAMPLES_HOST")
EXAMPLES_PORT = os.getenv("EXAMPLES_PORT")
EXAMPLES_DB = os.getenv("EXAMPLES_DB")

# The SQLAlchemy connection string.
SQLALCHEMY_DATABASE_URI = (
    f"{DATABASE_DIALECT}://"
    f"{DATABASE_USER}:{DATABASE_PASSWORD}@"
    f"{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_DB}"
)

SQLALCHEMY_EXAMPLES_URI = (
    f"{DATABASE_DIALECT}://"
    f"{EXAMPLES_USER}:{EXAMPLES_PASSWORD}@"
    f"{EXAMPLES_HOST}:{EXAMPLES_PORT}/{EXAMPLES_DB}"
)

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_CELERY_DB = os.getenv("REDIS_CELERY_DB", "0")
REDIS_RESULTS_DB = os.getenv("REDIS_RESULTS_DB", "1")

RESULTS_BACKEND = FileSystemCache("/app/superset_home/sqllab")

CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 300,
    "CACHE_KEY_PREFIX": "superset_",
    "CACHE_REDIS_HOST": REDIS_HOST,
    "CACHE_REDIS_PORT": REDIS_PORT,
    "CACHE_REDIS_DB": REDIS_RESULTS_DB,
}
DATA_CACHE_CONFIG = CACHE_CONFIG
THUMBNAIL_CACHE_CONFIG = CACHE_CONFIG


class CeleryConfig:
    broker_url = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_CELERY_DB}"
    imports = (
        "superset.sql_lab",
        "superset.tasks.scheduler",
        "superset.tasks.thumbnails",
        "superset.tasks.cache",
    )
    result_backend = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_RESULTS_DB}"
    worker_prefetch_multiplier = 1
    task_acks_late = False
    beat_schedule = {
        "reports.scheduler": {
            "task": "reports.scheduler",
            "schedule": crontab(minute="*", hour="*"),
        },
        "reports.prune_log": {
            "task": "reports.prune_log",
            "schedule": crontab(minute=10, hour=0),
        },
    }


CELERY_CONFIG = CeleryConfig

LOGO_RIGHT_TEXT = "МРТС"

FEATURE_FLAGS = {
    "ALERT_REPORTS": True,
    "FILTERBAR_CLOSED_BY_DEFAULT": True,
    # Разрешает повторное использование одного чарта на разных страницах
    # дашборда (в рамках одной страницы дубль по-прежнему запрещён).
    # Frontend SliceAdder скоупит «Добавлено»-проверку по активной странице.
    "ALLOW_DUPLICATE_CHARTS_PER_PAGE": True,
}
ALERT_REPORTS_NOTIFICATION_DRY_RUN = True
WEBDRIVER_BASEURL = f"http://superset_app{os.environ.get('SUPERSET_APP_ROOT', '/')}/"  # When using docker compose baseurl should be http://superset_nginx{ENV{BASEPATH}}/  # noqa: E501
# The base URL for the email report hyperlinks.
WEBDRIVER_BASEURL_USER_FRIENDLY = (
    f"http://localhost:8888/{os.environ.get('SUPERSET_APP_ROOT', '/')}/"
)
SQLLAB_CTAS_NO_LIMIT = True

# --- DS 2.0: шрифты ---
# Manrope + JetBrains Mono загружаются локально через @font-face
# в head_custom_extra.html (файлы в superset/static/assets/fonts/).
# CUSTOM_FONT_URLS не используем — Google Fonts заблокирован корпсетью в Chrome.

# --- DS 2.0: общие AntD токены (размерная сетка, радиусы, отступы) ---
_DS2_COMMON_TOKENS = {
    "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
    "fontFamilyCode": "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    "fontSize": 14,
    "fontSizeSM": 12,
    "fontSizeLG": 16,
    "fontSizeXL": 20,
    "fontSizeXS": 10,
    "fontSizeHeading1": 28,
    "fontSizeHeading2": 24,
    "fontSizeHeading3": 20,
    "fontSizeHeading4": 16,
    "fontSizeHeading5": 14,
    "fontWeightStrong": 600,
    "borderRadius": 6,
    "borderRadiusLG": 10,
    "borderRadiusSM": 4,
    "padding": 16,
    "paddingSM": 12,
    "paddingXS": 8,
    "paddingLG": 24,
    "margin": 16,
    "marginSM": 12,
    "marginXS": 8,
    "marginLG": 24,
    "controlHeight": 32,
    "controlHeightSM": 28,
    "controlHeightLG": 40,
    "brandLogoAlt": "МРТС BI",
}

# --- DS 2.0: AntD тема (светлая) ---
# Переопределяем ВСЕ фоновые/текстовые/fill-токены, чтобы AntD не
# подмешивал colorPrimary в свою автогенерируемую palette (иначе
# карточки/кнопки получают синеватый оттенок вместо нейтрального серого).
THEME_DEFAULT = {
    "algorithm": "default",
    "token": {
        **_DS2_COMMON_TOKENS,
        # --- фоны ---
        "colorBgBase": "#FFFFFF",       # --s
        "colorBgLayout": "#F3F3F3",     # --bg (фон layout)
        "colorBgContainer": "#FFFFFF",  # --s (фон карточек)
        "colorBgElevated": "#FFFFFF",   # --s (модалки, dropdown)
        "colorBgSpotlight": "#0A0A0A",  # --ink (тултипы)
        "colorBgMask": "rgba(10, 10, 10, 0.45)",
        # --- текст ---
        "colorTextBase": "#0A0A0A",     # --ink
        "colorText": "#0A0A0A",         # --ink
        "colorTextSecondary": "#555555",   # --g600
        "colorTextTertiary": "#737373",    # --g500
        "colorTextQuaternary": "#999999",  # --g400 (плейсхолдеры ≥18px)
        # --- заливки (hover, backgrounds, divs) ---
        "colorFill": "#DCDCDC",           # --g200
        "colorFillSecondary": "#EBEBEB",  # --g100
        "colorFillTertiary": "#F7F7F7",   # --g50
        "colorFillQuaternary": "rgba(10, 10, 10, 0.02)",
        # --- бренд/статус ---
        "colorPrimary": "#3B8BD9",      # --c-sky
        "colorLink": "#3B8BD9",
        "colorInfo": "#3B8BD9",
        "colorSuccess": "#16A34A",      # --up
        "colorError": "#DC2626",        # --dn
        "colorWarning": "#CCB604",      # --wn
        # --- бордеры ---
        "colorBorder": "#DCDCDC",          # --g200
        "colorBorderSecondary": "#EBEBEB", # --g100
    },
}

# --- DS 2.0: AntD тема (тёмная) ---
# Каждый оттенок серого явно прокинут из нашей 8-ступенчатой шкалы,
# чтобы AntD dark algorithm не тонировал фоны в primary (#5CAAF0).
THEME_DARK = {
    "algorithm": "dark",
    "token": {
        **_DS2_COMMON_TOKENS,
        # --- фоны ---
        "colorBgBase": "#171A1E",       # --s
        "colorBgLayout": "#0F1114",     # --bg
        "colorBgContainer": "#171A1E",  # --s (КАРТОЧКИ — было #242D3A, теперь нейтральные)
        "colorBgElevated": "#1B1E22",   # --g100 (модалки/dropdown чуть светлее)
        "colorBgSpotlight": "#171A1E",  # --s (тултипы на dark)
        "colorBgMask": "rgba(0, 0, 0, 0.55)",
        # --- текст ---
        "colorTextBase": "#E6E9EF",     # --ink
        "colorText": "#E6E9EF",         # --ink (85%-альфа не используем — иначе прозрачность)
        "colorTextSecondary": "#9BA3AE",   # --g600
        "colorTextTertiary": "#7B8390",    # --g500
        "colorTextQuaternary": "#555C65",  # --g400
        # --- заливки ---
        "colorFill": "#272B30",           # --g200
        "colorFillSecondary": "#1B1E22",  # --g100
        "colorFillTertiary": "#131619",   # --g50
        "colorFillQuaternary": "rgba(230, 233, 239, 0.04)",
        # --- бренд/статус ---
        "colorPrimary": "#5CAAF0",      # --c-sky (dark)
        "colorLink": "#5CAAF0",
        "colorInfo": "#5CAAF0",
        "colorSuccess": "#34D399",      # --up (dark)
        "colorError": "#F87171",        # --dn (dark)
        "colorWarning": "#F8F571",      # --wn (dark)
        # --- бордеры ---
        "colorBorder": "#272B30",          # --g200
        "colorBorderSecondary": "#1B1E22", # --g100
    },
}

# --- DS 2.0: категориальные цветовые схемы ---
EXTRA_CATEGORICAL_COLOR_SCHEMES = [
    {
        "id": "ds2_accents",
        "label": "DS 2.0",
        "description": "DS 2.0 — 5 акцентных цветов данных",
        "isDefault": True,
        "colors": ["#3B8BD9", "#8B5CF6", "#E87C3E", "#D946A8", "#CA8A04"],
    },
    {
        "id": "ds2_semantic",
        "label": "DS 2.0 Семантика",
        "description": "Рост / Снижение / Предупреждение / Нейтральный",
        "colors": ["#16A34A", "#DC2626", "#CCB604", "#9CA3AF"],
    },
]

# --- DS 2.0: последовательная палитра (heatmap / градиенты) ---
EXTRA_SEQUENTIAL_COLOR_SCHEMES = [
    {
        "id": "ds2_sky_seq",
        "label": "DS 2.0 Sky",
        "isDiverging": False,
        "colors": ["#E8F4FD", "#B8D9F2", "#88BEE7", "#3B8BD9", "#2A6BA8", "#1A4B78"],
    },
]

# --- Locale ---
BABEL_DEFAULT_LOCALE = "ru"
LANGUAGES = {
    "ru": {"flag": "ru", "name": "Русский"},
    "en": {"flag": "us", "name": "English"},
}

# --- RU-форматы чисел (пробел-тысячи, запятая-десятичные, ₽ после числа) ---
D3_FORMAT = {
    "decimal": ",",
    "thousands": "\u00a0",
    "grouping": [3],
    "currency": ["", "\u00a0\u20bd"],
}

# --- RU-форматы дат (DD.MM.YYYY, 24ч, русские месяцы) ---
D3_TIME_FORMAT = {
    "dateTime": "%A, %e %B %Y г. %X",
    "date": "%d.%m.%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": [
        "воскресенье", "понедельник", "вторник", "среда",
        "четверг", "пятница", "суббота",
    ],
    "shortDays": ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
    "months": [
        "январь", "февраль", "март", "апрель", "май", "июнь",
        "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
    ],
    "shortMonths": [
        "янв", "фев", "мар", "апр", "май", "июн",
        "июл", "авг", "сен", "окт", "ноя", "дек",
    ],
}

CURRENCIES = ["RUB", "USD", "EUR"]

log_level_text = os.getenv("SUPERSET_LOG_LEVEL", "INFO")
LOG_LEVEL = getattr(logging, log_level_text.upper(), logging.INFO)

if os.getenv("CYPRESS_CONFIG") == "true":
    # When running the service as a cypress backend, we need to import the config
    # located @ tests/integration_tests/superset_test_config.py
    base_dir = os.path.dirname(__file__)
    module_folder = os.path.abspath(
        os.path.join(base_dir, "../../tests/integration_tests/")
    )
    sys.path.insert(0, module_folder)
    from superset_test_config import *  # noqa

    sys.path.pop(0)

#
# Optionally import superset_config_docker.py (which will have been included on
# the PYTHONPATH) in order to allow for local settings to be overridden
#
try:
    import superset_config_docker
    from superset_config_docker import *  # noqa: F403

    logger.info(
        f"Loaded your Docker configuration at [{superset_config_docker.__file__}]"
    )
except ImportError:
    logger.info("Using default Docker config...")
