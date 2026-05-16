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
    # Concurrency-limited chart fetch (native priority queue, max 8) +
    # viewport priority + lazy off-screen skip + DS 2.0 skeleton overlay.
    # Настройки в DevToolsPanel → Настройки дашборда. Per-dashboard
    # config в json_metadata.fetch_strategy.
    "ENABLE_DASHBOARD_FETCH_STRATEGY": True,
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

# --- DS 2.0: ECharts options overrides ---
# Superset 6.0 НЕ поддерживает ключ "echartsOptionsOverrides" в THEME_DEFAULT
# (SerializableThemeConfig игнорирует — типы только token/components/algorithm/hashed/inherit).
# Реальная DS 2.0 ECharts theme патчена в frontend:
#   - superset-frontend/plugins/plugin-chart-echarts/src/components/Echart.tsx (getEchartsTheme)
#   - superset-frontend/plugins/plugin-chart-echarts/src/defaults.ts (defaultGrid)
# Все ECharts чарты (Bar/Line/Pie/Area/Sunburst/Treemap/...) автоматически получают:
#   - axisLabel: 11px JetBrains Mono var(--g600)
#   - legend: 13px Manrope var(--ink)
#   - tooltip: 12px JetBrains Mono на var(--ink) с radius 6px
#   - grid: { left: 8%, right: 4%, top: 12%, bottom: 12% }
# Цвета через AntD theme tokens — автоматически переключаются light/dark.
# См. docs/audit-ds2/_appendix/wave13-echarts-theme-changes.md.

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
    "borderRadiusSM": 6,
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
    # --- DS 2.0: flat solid — все AntD shadow-токены = none ---
    # Глубина передаётся только через 1px hairline border (var(--g200)).
    # Без этого AntD рисует свои дефолтные тени для Card/Modal/Popover/Drawer/Tabs.
    "boxShadow": "none",
    "boxShadowSecondary": "none",
    "boxShadowTertiary": "none",
    "boxShadowDrawerLeft": "none",
    "boxShadowDrawerRight": "none",
    "boxShadowDrawerUp": "none",
    "boxShadowDrawerDown": "none",
    "boxShadowPopoverArrow": "none",
    "boxShadowCard": "none",
    "boxShadowTabsOverflowBottom": "none",
    "boxShadowTabsOverflowLeft": "none",
    "boxShadowTabsOverflowRight": "none",
    "boxShadowTabsOverflowTop": "none",
}

# --- DS 2.0: общий конфиг AntD components (тема-нейтральные настройки) ---
# Размерная сетка 8px, радиусы карточек 10 / контролов 6, шрифты Manrope+JetBrains.
# Цветовые токены (headerBg, handleColor, inkBarColor) вынесены в light/dark
# словари ниже — там где значения отличаются между темами.
_DS2_ANTD_COMPONENTS_COMMON = {
    # --- 1. Кнопки и контролы ---
    "Button": {
        "borderRadius": 6,
        "borderRadiusLG": 6,
        "borderRadiusSM": 6,
        "controlHeight": 32,
        "controlHeightLG": 40,
        "controlHeightSM": 28,
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
        "fontWeight": 600,
        "primaryShadow": "none",
        "defaultShadow": "none",
        "dangerShadow": "none",
    },
    "Input": {
        "borderRadius": 6,
        "borderRadiusLG": 6,
        "borderRadiusSM": 6,
        "controlHeight": 32,
        "controlHeightLG": 40,
        "controlHeightSM": 28,
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
        "paddingInline": 12,
        "paddingInlineLG": 16,
        "paddingInlineSM": 8,
    },
    "Select": {
        "borderRadius": 6,
        "borderRadiusLG": 6,
        "borderRadiusSM": 6,
        "controlHeight": 32,
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
        "optionPadding": "8px 12px",
        "optionFontSize": 14,
    },
    "DatePicker": {
        "borderRadius": 6,
        "borderRadiusLG": 6,
        "borderRadiusSM": 6,
        "controlHeight": 32,
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
    },
    # --- 2. Контейнеры и поверхности ---
    "Card": {
        "borderRadius": 10,
        "borderRadiusLG": 10,
        "headerFontSize": 14,
        "headerFontSizeSM": 13,
        "headerHeight": 48,
        "boxShadow": "none",
        "boxShadowTertiary": "none",
        "padding": 16,
        "paddingLG": 24,
    },
    "Modal": {
        # headerBg / titleColor задаются в light/dark секциях ниже
        "borderRadiusLG": 10,
        "titleFontSize": 16,
        "titleLineHeight": 1.5,
        "padding": 24,
        "paddingLG": 24,
        "paddingMD": 20,
    },
    "Drawer": {
        "borderRadiusLG": 0,  # drawer flush с краем экрана
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
    },
    "Collapse": {
        "borderRadiusLG": 10,
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
        "headerBg": "transparent",
        "headerPadding": "12px 16px",
        "contentPadding": "16px",
    },
    # --- 3. Оверлеи (popover/tooltip/dropdown/notif/message) ---
    "Popover": {
        "borderRadiusLG": 6,  # tooltip-like overlay → control radius
        "boxShadowSecondary": "none",
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
    },
    "Tooltip": {
        # tooltip фон/цвет задаются через token.colorBgSpotlight + colorTextLightSolid
        "borderRadius": 6,
        "fontSize": 12,
        "paddingXS": 8,
        "paddingSM": 12,
    },
    "Dropdown": {
        "borderRadiusLG": 6,
        "boxShadowSecondary": "none",
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
    },
    "Notification": {
        "borderRadiusLG": 10,
        "boxShadow": "none",
        "boxShadowSecondary": "none",
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
    },
    "Message": {
        "borderRadiusLG": 6,
        "boxShadow": "none",
        "boxShadowSecondary": "none",
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
    },
    "Alert": {
        "borderRadiusLG": 6,
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
    },
    # --- 4. Навигация ---
    "Tabs": {
        # inkBarColor задаётся в light/dark
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
        "titleFontSize": 14,
        "titleFontSizeLG": 16,
        "titleFontSizeSM": 13,
        "horizontalItemGutter": 24,
        "horizontalItemPadding": "8px 0",
        "horizontalItemPaddingLG": "12px 0",
        "horizontalItemPaddingSM": "6px 0",
        "verticalItemPadding": "8px 16px",
    },
    "Menu": {
        "borderRadius": 6,
        "borderRadiusLG": 6,
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
        "itemBorderRadius": 6,
        "itemFontSize": 14,
        "itemHeight": 32,
        "itemPadding": "8px 12px",
        "subMenuItemBorderRadius": 6,
    },
    "Steps": {
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
        "iconFontSize": 14,
        "titleLineHeight": 1.4,
    },
    "Pagination": {
        "borderRadius": 6,
        "fontFamily": "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        "itemSize": 32,
        "itemSizeSM": 28,
    },
    # --- 5. Индикаторы ---
    "Tag": {
        "borderRadiusSM": 6,
        "fontSize": 11,
        "fontSizeSM": 10,
        "fontFamily": "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        "lineHeight": 1.5,
    },
    "Badge": {
        "fontSize": 10,
        "fontFamily": "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        "fontWeight": 600,
    },
    # --- 6. Формы и значения ---
    "Form": {
        "labelFontSize": 13,
        "labelHeight": 32,
        "verticalLabelPadding": "0 0 8px",
    },
    "Switch": {
        # colorPrimary задаётся в light/dark
        "trackHeight": 22,
        "trackPadding": 2,
        "handleSize": 18,
        "fontSize": 14,
    },
    "Slider": {
        # handleColor / trackBg / dotBorderColor задаются в light/dark
        "borderRadiusXS": 6,
        "handleSize": 14,
        "handleSizeHover": 16,
        "railSize": 4,
    },
    # --- 7. Данные (таблицы, деревья) ---
    "Table": {
        # headerBg / headerColor / headerSplitColor / rowHoverBg задаются в light/dark
        "borderRadius": 10,
        "borderRadiusLG": 10,
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
        "fontSize": 14,
        "padding": 16,
        "paddingContentVerticalLG": 16,
        "headerBorderRadius": 0,  # таблица обычно внутри карточки → без внешнего радиуса
        "cellFontSize": 14,
        "cellFontSizeSM": 13,
    },
    "Tree": {
        # directoryNodeSelectedBg задаётся в light/dark
        "borderRadiusSM": 6,
        "fontFamily": "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
        "titleHeight": 28,
    },
}

# --- DS 2.0: AntD components (светлая) ---
# Здесь только light-специфичные цветовые поля.
# Все размерные/шрифтовые токены наследуются из _DS2_ANTD_COMPONENTS_COMMON.
_DS2_ANTD_COMPONENTS_LIGHT = {
    **{k: dict(v) for k, v in _DS2_ANTD_COMPONENTS_COMMON.items()},
}
_DS2_ANTD_COMPONENTS_LIGHT["Modal"].update({
    "headerBg": "#FFFFFF",     # --s
    "titleColor": "#0A0A0A",   # --ink
})
_DS2_ANTD_COMPONENTS_LIGHT["Tabs"].update({
    "inkBarColor": "#3B8BD9",  # --c-sky
})
_DS2_ANTD_COMPONENTS_LIGHT["Switch"].update({
    "colorPrimary": "#3B8BD9", # --c-sky
})
_DS2_ANTD_COMPONENTS_LIGHT["Slider"].update({
    "handleColor": "#3B8BD9",     # --c-sky
    "trackBg": "#3B8BD9",         # --c-sky
    "dotBorderColor": "#DCDCDC",  # --g200
})
_DS2_ANTD_COMPONENTS_LIGHT["Table"].update({
    "headerBg": "#F7F7F7",          # --g50
    "headerColor": "#0A0A0A",       # --ink
    "headerSplitColor": "#DCDCDC",  # --g200
    "rowHoverBg": "#F7F7F7",        # --g50
})
_DS2_ANTD_COMPONENTS_LIGHT["Tree"].update({
    "directoryNodeSelectedBg": "#3B8BD9",  # --c-sky
})

# --- DS 2.0: AntD components (тёмная) ---
# Здесь только dark-специфичные цветовые поля (по DS «Тёмная тема» секции).
_DS2_ANTD_COMPONENTS_DARK = {
    **{k: dict(v) for k, v in _DS2_ANTD_COMPONENTS_COMMON.items()},
}
_DS2_ANTD_COMPONENTS_DARK["Modal"].update({
    "headerBg": "#171A1E",     # --s dark
    "titleColor": "#E6E9EF",   # --ink dark
})
_DS2_ANTD_COMPONENTS_DARK["Tabs"].update({
    "inkBarColor": "#5CAAF0",  # --c-sky dark
})
_DS2_ANTD_COMPONENTS_DARK["Switch"].update({
    "colorPrimary": "#5CAAF0", # --c-sky dark
})
_DS2_ANTD_COMPONENTS_DARK["Slider"].update({
    "handleColor": "#5CAAF0",     # --c-sky dark
    "trackBg": "#5CAAF0",         # --c-sky dark
    "dotBorderColor": "#272B30",  # --g200 dark
})
_DS2_ANTD_COMPONENTS_DARK["Table"].update({
    "headerBg": "#131619",          # --g50 dark
    "headerColor": "#E6E9EF",       # --ink dark
    "headerSplitColor": "#272B30",  # --g200 dark
    "rowHoverBg": "#131619",        # --g50 dark
})
_DS2_ANTD_COMPONENTS_DARK["Tree"].update({
    "directoryNodeSelectedBg": "#5CAAF0",  # --c-sky dark
})

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
        "colorBgMask": "rgba(0, 0, 0, 0.40)",
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
        "colorFillQuaternary": "#F7F7F7",  # --g50 (DS: solid, без прозрачности)
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
    "components": _DS2_ANTD_COMPONENTS_LIGHT,
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
        "colorFillQuaternary": "#131619",  # --g50 (DS: solid, без прозрачности)
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
    "components": _DS2_ANTD_COMPONENTS_DARK,
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

# --- AI-analytics: разрешаем CSP connect-src на корп-сервер ---
# Superset 6.0 по дефолту блокирует fetch на любой origin кроме 'self' + mapbox
# (см. superset/config.py:1826-1858). AI-чат (features/ai/api.ts) ходит на
# ai-analytics:8080. Без этого override браузер выдаёт CSP-блок в console.
_AI_BACKEND_HOST = os.getenv(
    "AI_BACKEND_URL",
    "http://dataru-saod-llm02-vm.samberi.com:8080",
)

TALISMAN_CONFIG = {
    "content_security_policy": {
        "base-uri": ["'self'"],
        "default-src": ["'self'"],
        "img-src": [
            "'self'",
            "blob:",
            "data:",
            "https://apachesuperset.gateway.scarf.sh",
            "https://static.scarf.sh/",
            "ows.terrestris.de",
            "https://cdn.document360.io",
        ],
        "worker-src": ["'self'", "blob:"],
        "connect-src": [
            "'self'",
            "https://api.mapbox.com",
            "https://events.mapbox.com",
            "https://tile.openstreetmap.org",
            "https://tile.osm.ch",
            _AI_BACKEND_HOST,
        ],
        "object-src": "'none'",
        "style-src": ["'self'", "'unsafe-inline'"],
        "script-src": ["'self'", "'strict-dynamic'"],
    },
    "content_security_policy_nonce_in": ["script-src"],
    "force_https": False,
    "session_cookie_secure": False,
}

# Dev-вариант: тот же connect-src + 'unsafe-eval' для React dev-mode.
TALISMAN_DEV_CONFIG = {
    "content_security_policy": {
        **TALISMAN_CONFIG["content_security_policy"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    },
    "content_security_policy_nonce_in": ["script-src"],
    "force_https": False,
    "session_cookie_secure": False,
}

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
