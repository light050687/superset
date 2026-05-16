"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chart_controls_1 = require("@superset-ui/chart-controls");
const core_1 = require("@superset-ui/core");
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
const isMockCustom = ({ controls }) => isMockEnabled({ controls }) && controls?.mock_preset?.value === 'custom';
const isDrillEnabled = ({ controls }) => controls?.enable_drill_modal?.value === true;
// ═══════════════════════════════════════════════════════════════════════════
// Ranked Bars Control Panel
// ═══════════════════════════════════════════════════════════════════════════
const config = {
    controlPanelSections: [
        // ── 1. Time ────────────────────────────────────────────────────────────
        chart_controls_1.sections.legacyTimeseriesTime,
        // ── 2. Query ───────────────────────────────────────────────────────────
        {
            label: (0, core_1.t)('Запрос'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'groupby',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Измерение (категория)'),
                            description: (0, core_1.t)('Основное измерение — например, «Причина списания» или «Категория товара».'),
                            multi: false,
                            required: true,
                        },
                    },
                ],
                [
                    {
                        name: 'sub_column',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Подпись (sub)'),
                            description: (0, core_1.t)('Дополнительная колонка с подписью под названием — например «Молочка, хлеб».'),
                            multi: false,
                            required: false,
                        },
                    },
                ],
                [
                    {
                        name: 'icon_column',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Колонка с именем иконки'),
                            description: (0, core_1.t)('Колонка датасета со значениями: clock | thermometer | shield | triangle | package. ' +
                                'Если не задано — все строки получают иконку «package».'),
                            multi: false,
                            required: false,
                        },
                    },
                ],
                [
                    {
                        name: 'color_column',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Колонка с цветовым токеном'),
                            description: (0, core_1.t)('Колонка со значениями вида --c-sky, --c-violet, --c-tangerine, --c-fuchsia, --c-amber. ' +
                                'Если не задано — цвета назначаются по индексу из палитры DS 2.0.'),
                            multi: false,
                            required: false,
                        },
                    },
                ],
                [
                    {
                        name: 'metric',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Основная метрика'),
                            description: (0, core_1.t)('Численное значение для ранжирования — например SUM(loss_amount).'),
                            required: true,
                        },
                    },
                ],
                [
                    {
                        name: 'metric_prev',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Метрика прошлого периода'),
                            description: (0, core_1.t)('Значение для расчёта дельты и пунктирного ghost-бара. ' +
                                'Если не задано — сортировка по дельте и ghost-бар недоступны.'),
                            required: false,
                        },
                    },
                ],
                ['adhoc_filters'],
                [
                    {
                        name: 'row_limit',
                        config: {
                            ...chart_controls_1.sharedControls.row_limit,
                            default: 30,
                            description: (0, core_1.t)('Сколько строк запрашивать у БД. В карточке показываются только первые top_n_visible; ' +
                                'остальные доступны в модалке «Показать все».'),
                        },
                    },
                ],
            ],
        },
        // ── 3. Ranking ─────────────────────────────────────────────────────────
        {
            label: (0, core_1.t)('Рейтинг и сортировка'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'default_sort',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Сортировка по умолчанию'),
                            choices: [
                                ['sum', (0, core_1.t)('По сумме')],
                                ['delta', (0, core_1.t)('По дельте к прошлому периоду')],
                                ['share', (0, core_1.t)('По доле от общего')],
                            ],
                            default: 'sum',
                            clearable: false,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'default_unit',
                        config: {
                            type: 'RadioButtonControl',
                            label: (0, core_1.t)('Единицы по умолчанию'),
                            options: [
                                ['rub', '₽'],
                                ['pct', '%'],
                            ],
                            default: 'rub',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'top_n_visible',
                        config: {
                            type: 'SliderControl',
                            label: (0, core_1.t)('Видимых строк в карточке'),
                            description: (0, core_1.t)('Сколько верхних строк показывать в компактном виде. ' +
                                'Остальные открываются через «Показать все».'),
                            default: 5,
                            min: 3,
                            max: 15,
                            step: 1,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── 4. Display ─────────────────────────────────────────────────────────
        {
            label: (0, core_1.t)('Отображение'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'header_text',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Заголовок карточки'),
                            default: 'Причины списаний',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'header_subtitle_prefix',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Префикс подзаголовка'),
                            description: (0, core_1.t)('Показывается перед периодом в подзаголовке. ' +
                                'Пример: «Топ по сумме · Март 2026 · 159,4 млн ₽».'),
                            default: 'Топ по сумме',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_sparkline',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Показывать спарклайн'),
                            description: (0, core_1.t)('Миниграфик тренда в каждой строке. Требует дополнительного time-series запроса.'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_total_in_header',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Показывать итог в шапке'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_ghost_prev_bar',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Ghost-бар прошлого периода'),
                            description: (0, core_1.t)('Пунктирный прямоугольник позади основного бара показывает значение прошлого периода.'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_hover_tooltip',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Подсказка при наведении'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'invert_delta_good',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Рост метрики — это плохо (как для потерь)'),
                            description: (0, core_1.t)('Если включено, рост значения подсвечивается красным (dn), снижение — зелёным (up). ' +
                                'Подходит для метрик расходов, потерь, ошибок.'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── 5. Detail (drill-down and all-items modals) ────────────────────────
        {
            label: (0, core_1.t)('Детализация'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'enable_drill_modal',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Включить drill-модалку (Ctrl+клик)'),
                            description: (0, core_1.t)('Открывает окно с топ-магазинов / топ-SKU / трендом 12 недель по выбранной категории.'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'store_dim',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Измерение магазина (для drill)'),
                            description: (0, core_1.t)('Используется в drill-модалке для топ-5 магазинов.'),
                            multi: false,
                            required: false,
                            visibility: isDrillEnabled,
                        },
                    },
                ],
                [
                    {
                        name: 'sku_dim',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Измерение SKU (для drill)'),
                            description: (0, core_1.t)('Используется в drill-модалке для топ-5 SKU.'),
                            multi: false,
                            required: false,
                            visibility: isDrillEnabled,
                        },
                    },
                ],
                [
                    {
                        name: 'detail_top_n',
                        config: {
                            type: 'SliderControl',
                            label: (0, core_1.t)('Сколько позиций в топах drill-модалки'),
                            default: 5,
                            min: 3,
                            max: 10,
                            step: 1,
                            renderTrigger: true,
                            visibility: isDrillEnabled,
                        },
                    },
                ],
                [
                    {
                        name: 'enable_all_items_modal',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Включить модалку «Показать все»'),
                            description: (0, core_1.t)('Добавляет ссылку в футере, открывающую полный список всех строк с поиском и сортировкой.'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── 6. Number format ───────────────────────────────────────────────────
        {
            label: (0, core_1.t)('Форматирование чисел'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'unit_suffix_rub',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Суффикс для рублёвых значений'),
                            description: (0, core_1.t)('Примеры: «млн ₽», «тыс ₽», «шт». Подставляется после числа.'),
                            default: 'млн ₽',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_value',
                        config: {
                            type: 'SliderControl',
                            label: (0, core_1.t)('Десятичных знаков для значения'),
                            default: 1,
                            min: 0,
                            max: 3,
                            step: 1,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_delta',
                        config: {
                            type: 'SliderControl',
                            label: (0, core_1.t)('Десятичных знаков для дельты'),
                            default: 2,
                            min: 0,
                            max: 3,
                            step: 1,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_share',
                        config: {
                            type: 'SliderControl',
                            label: (0, core_1.t)('Десятичных знаков для доли'),
                            default: 1,
                            min: 0,
                            max: 2,
                            step: 1,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── 7. Interactivity ───────────────────────────────────────────────────
        {
            label: (0, core_1.t)('Интерактивность'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'enable_cross_filter',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Включить cross-filter (клик по строке)'),
                            description: (0, core_1.t)('Обычный клик по строке переключает фильтр в выбранном измерении на других чартах дашборда.'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── 8. Mock / Design Mode ──────────────────────────────────────────────
        {
            label: (0, core_1.t)('Режим проектирования'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'mock_mode_enabled',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Включить режим проектирования'),
                            description: (0, core_1.t)('Показывает тестовые данные (22 причины списаний или 16 категорий расходов) ' +
                                'для согласования дизайна без БД.'),
                            default: false,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'mock_preset',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Пресет mock-данных'),
                            default: 'losses',
                            choices: [
                                ['losses', (0, core_1.t)('Причины списаний (22 строки)')],
                                ['expenses', (0, core_1.t)('Категории расходов (16 строк)')],
                                ['custom', (0, core_1.t)('Кастомный JSON')],
                            ],
                            renderTrigger: true,
                            visibility: isMockEnabled,
                        },
                    },
                ],
                [
                    {
                        name: 'mock_custom_json',
                        config: {
                            type: 'TextAreaControl',
                            label: (0, core_1.t)('JSON кастомных данных'),
                            description: (0, core_1.t)('Массив строк вида: [{ "id": "...", "name": "...", "sub": "...", ' +
                                '"iconName": "clock", "colorToken": "--c-sky", "value": 10.5, ' +
                                '"valuePrev": 9.8, "spark": [8, 9, 10] }]'),
                            default: '[]',
                            language: 'json',
                            renderTrigger: true,
                            visibility: isMockCustom,
                        },
                    },
                ],
            ],
        },
    ],
};
exports.default = config;
//# sourceMappingURL=controlPanel.js.map