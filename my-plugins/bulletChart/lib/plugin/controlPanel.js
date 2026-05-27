"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chart_controls_1 = require("@superset-ui/chart-controls");
const core_1 = require("@superset-ui/core");
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
const isMockCustom = ({ controls }) => isMockEnabled({ controls }) && controls?.mock_preset?.value === 'custom';
const isSparklineEnabled = ({ controls }) => controls?.sparkline_enabled?.value !== false;
const isDetailModalEnabled = ({ controls }) => controls?.enable_detail_modal?.value !== false;
// ═══════════════════════════════════════
// Control Panel Configuration
// ═══════════════════════════════════════
const config = {
    controlPanelSections: [
        // ── Time ──
        chart_controls_1.sections.legacyTimeseriesTime,
        // ── 1. Режим проектирования ──
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
                            default: true,
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
                            default: 'formats',
                            choices: [
                                ['formats', (0, core_1.t)('Форматы магазинов (списания, 5 строк)')],
                                ['categories', (0, core_1.t)('Категории товаров (8 строк)')],
                                ['single_row', (0, core_1.t)('Одна строка')],
                                ['many_rows', (0, core_1.t)('Много строк (20)')],
                                ['long_names', (0, core_1.t)('Длинные названия')],
                                ['negative', (0, core_1.t)('Отрицательные значения')],
                                ['empty', (0, core_1.t)('Пустой (нет данных)')],
                                ['custom', (0, core_1.t)('Кастом (JSON)')],
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
                            description: (0, core_1.t)('Массив объектов: [{"id":"a","name":"Формат А","stores":10,"rate":2.3,' +
                                '"plan":2.0,"py":2.5,"spark":[1,2,3,4,5,6,7,8]}, ...]'),
                            default: '[]',
                            language: 'json',
                            renderTrigger: true,
                            visibility: isMockCustom,
                        },
                    },
                ],
            ],
        },
        // ── 2. Запрос — Данные ──
        {
            label: (0, core_1.t)('Запрос — Данные'),
            expanded: false,
            controlSetRows: [
                ['adhoc_filters'],
                [
                    {
                        name: 'groupby_category',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Измерение (категория)'),
                            description: (0, core_1.t)('Колонка, по которой группируются строки bullet-чарта. ' +
                                'Например, формат магазина, категория товара, филиал.'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_fact',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Факт'),
                            description: (0, core_1.t)('Основная мера — фактическое значение.'),
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
                            description: (0, core_1.t)('Целевое значение. Маркер «цели» на bullet-баре.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_py',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Прошлый год (ПГ)'),
                            description: (0, core_1.t)('Значение за аналогичный период прошлого года.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_stores',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Количество магазинов'),
                            description: (0, core_1.t)('Опционально — количество элементов в категории ' +
                                '(например, число магазинов в формате). Отображается в заголовке строки.'),
                            validators: [],
                        },
                    },
                ],
                ['row_limit'],
            ],
        },
        // ── 3. Sparkline ──
        {
            label: (0, core_1.t)('Sparkline (тренд)'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'sparkline_enabled',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Показывать sparkline'),
                            description: (0, core_1.t)('Мини-тренд в правой части строки. Второй запрос на данные ' +
                                'с группировкой по времени.'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'sparkline_time_grain',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Шаг времени для sparkline'),
                            default: 'P1W',
                            choices: [
                                ['P1D', (0, core_1.t)('День')],
                                ['P1W', (0, core_1.t)('Неделя')],
                                ['P1M', (0, core_1.t)('Месяц')],
                            ],
                            visibility: isSparklineEnabled,
                        },
                    },
                ],
                [
                    {
                        name: 'sparkline_points',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Количество точек'),
                            description: (0, core_1.t)('Последние N точек временного ряда.'),
                            default: 8,
                            isInt: true,
                            visibility: isSparklineEnabled,
                        },
                    },
                ],
            ],
        },
        // ── 4. Статус и направление ──
        {
            label: (0, core_1.t)('Статус и направление'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'direction',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Направление «хорошо»'),
                            description: (0, core_1.t)('Определяет, что считать успехом: меньше плана (списания, потери) ' +
                                'или больше плана (выручка, маржа). Влияет на раскраску статусов и зон bullet-бара.'),
                            default: 'less_is_better',
                            choices: [
                                ['less_is_better', (0, core_1.t)('Меньше — лучше (списания, потери)')],
                                ['more_is_better', (0, core_1.t)('Больше — лучше (выручка, маржа)')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'status_tolerance_pct',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Tolerance «около плана», %'),
                            description: (0, core_1.t)('Размер «серой зоны» вокруг плана: ratio ∈ [1−tol, 1+tol] → warn. ' +
                                'По умолчанию 5% (из прототипа).'),
                            default: 5,
                            isFloat: true,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── 5. Отображение ──
        {
            label: (0, core_1.t)('Отображение'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'header_text',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Заголовок'),
                            description: (0, core_1.t)('Заголовок карточки. Если пусто — используется имя метрики.'),
                            default: '',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'subheader_text',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Подзаголовок'),
                            description: (0, core_1.t)('Маленький текст под заголовком, напр. «Факт vs план vs ПГ».'),
                            default: 'Факт vs план vs ПГ',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'value_suffix',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Единица измерения'),
                            description: (0, core_1.t)('Что показывается после значения: %, ₽, шт, кг.'),
                            default: '%',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'value_unit_label',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Единица дельты'),
                            description: (0, core_1.t)('Единица для дельт к плану/ПГ, напр. «п.п.» или «₽».'),
                            default: 'п.п.',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'auto_format_russian',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Русский формат (тыс, млн, млрд)'),
                            description: (0, core_1.t)('Пробел как разделитель тысяч, запятая как десятичный, ' +
                                'авто-сокращение больших чисел.'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'decimals',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Десятичных знаков'),
                            default: 2,
                            isInt: true,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── 6. Взаимодействие ──
        {
            label: (0, core_1.t)('Взаимодействие'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'default_sort',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Сортировка по умолчанию'),
                            default: 'factDesc',
                            choices: [
                                ['factDesc', (0, core_1.t)('По факту (убыв.)')],
                                ['factAsc', (0, core_1.t)('По факту (возр.)')],
                                ['deltaPlanDesc', (0, core_1.t)('По дельте к плану')],
                                ['deltaPyDesc', (0, core_1.t)('По дельте к ПГ')],
                                ['storesDesc', (0, core_1.t)('По числу магазинов')],
                                ['nameAsc', (0, core_1.t)('По названию')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'filter_worse_than_plan_default',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Активен фильтр «Хуже плана»'),
                            description: (0, core_1.t)('По умолчанию показывать только строки хуже плана.'),
                            default: false,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'enable_cross_filter',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Cross-filter (клик применяет фильтр к дашборду)'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'enable_detail_modal',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Модаль детализации (Ctrl+клик)'),
                            description: (0, core_1.t)('Открывает список элементов выбранной категории.'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'detail_groupby',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Колонка детализации'),
                            description: (0, core_1.t)('Колонка для drill-down модали. Например, «Название магазина», ' +
                                '«SKU». Если пусто — модаль отключена.'),
                            multi: false,
                            validators: [],
                            visibility: isDetailModalEnabled,
                        },
                    },
                ],
            ],
        },
    ],
};
exports.default = config;
//# sourceMappingURL=controlPanel.js.map