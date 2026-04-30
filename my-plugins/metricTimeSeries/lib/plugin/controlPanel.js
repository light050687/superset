"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chart_controls_1 = require("@superset-ui/chart-controls");
const core_1 = require("@superset-ui/core");
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
const hasGroupbyCategory = ({ controls }) => {
    const v = controls?.groupby_category?.value;
    if (Array.isArray(v))
        return v.length > 0;
    return v != null && v !== '';
};
const config = {
    controlPanelSections: [
        // ── 1. Time ──
        chart_controls_1.sections.legacyTimeseriesTime,
        // ── 2. Design / Mock mode ──
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
                            description: (0, core_1.t)('Показывает тестовые данные для согласования дизайна дашборда. ' +
                                'Выключите когда реальные данные будут готовы.'),
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
                            label: (0, core_1.t)('Пресет данных'),
                            default: 'writeoffs',
                            choices: [
                                ['writeoffs', (0, core_1.t)('Списания (5 категорий, млн ₽)')],
                                ['losses', (0, core_1.t)('Потери (меньший масштаб)')],
                                ['incidents', (0, core_1.t)('Инциденты (3 категории)')],
                            ],
                            renderTrigger: true,
                            visibility: isMockEnabled,
                        },
                    },
                ],
            ],
        },
        // ── 3. Query ──
        {
            label: (0, core_1.t)('Запрос'),
            expanded: true,
            controlSetRows: [
                ['adhoc_filters'],
                [
                    {
                        name: 'metric_fact',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Факт'),
                            description: (0, core_1.t)('Основная мера — фактические значения по времени'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_plan',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('План'),
                            description: (0, core_1.t)('Опциональная мера — плановые значения (бюджет)'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_py',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Прошлый год'),
                            description: (0, core_1.t)('Опциональная мера — значения прошлого года'),
                            validators: [],
                        },
                    },
                ],
            ],
        },
        // ── 4. Category breakdown ──
        {
            label: (0, core_1.t)('Разбивка по категориям'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'groupby_category',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Колонка категорий'),
                            description: (0, core_1.t)('Колонка для разбивки на стек-режимах (Стек-бары / Стек-площадь). ' +
                                'Если не задана — работает только линейный режим.'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'categories_limit',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Лимит категорий'),
                            description: (0, core_1.t)('Количество отображаемых категорий. Остальные сливаются в «Прочее».'),
                            default: 5,
                            renderTrigger: true,
                            visibility: hasGroupbyCategory,
                        },
                    },
                ],
            ],
        },
        // ── 5. Display ──
        {
            label: (0, core_1.t)('Отображение'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'header_text',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Заголовок карточки'),
                            default: 'Динамика списаний',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'default_mode',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Режим по умолчанию'),
                            default: 'line',
                            choices: [
                                ['line', (0, core_1.t)('Линия')],
                                ['stack-bar', (0, core_1.t)('Стек-бары')],
                                ['stack-area', (0, core_1.t)('Стек-площадь')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'default_granularity',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Гранулярность по умолчанию'),
                            default: 'month',
                            choices: [
                                ['year', (0, core_1.t)('По годам')],
                                ['month', (0, core_1.t)('По месяцам')],
                                ['week', (0, core_1.t)('По неделям')],
                                ['day', (0, core_1.t)('По дням')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'default_unit',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Единицы по умолчанию'),
                            default: 'rub',
                            choices: [
                                ['rub', (0, core_1.t)('Рубли (₽)')],
                                ['pct', (0, core_1.t)('Проценты от плана (%)')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_brush_button',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Кнопка выделения диапазона'),
                            description: (0, core_1.t)('Показывать иконку brush в правом верхнем углу'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'enable_drill_down',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Разрешить drill-down'),
                            description: (0, core_1.t)('Клик по месяцу переключает на недельную разбивку'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── 6. Number formatting ──
        {
            label: (0, core_1.t)('Форматирование чисел'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'value_decimals',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Знаков после запятой'),
                            description: (0, core_1.t)('-1 = авто. Масштаб подставляется автоматически (тыс / млн / млрд).'),
                            default: -1,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'value_suffix',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Единица'),
                            description: (0, core_1.t)('Добавляется после числа. Например "₽", "шт", "кг". Масштаб (тыс/млн/млрд) подставляется автоматически.'),
                            default: '₽',
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── 7. Series labels ──
        {
            label: (0, core_1.t)('Названия серий'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'label_fact',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название "Факт"'),
                            default: 'Факт',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'label_plan',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название "План"'),
                            default: 'План',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'label_py',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название "Прошлый год"'),
                            default: 'ПГ',
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
    ],
};
exports.default = config;
//# sourceMappingURL=controlPanel.js.map