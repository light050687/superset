"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chart_controls_1 = require("@superset-ui/chart-controls");
const core_1 = require("@superset-ui/core");
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
const config = {
    controlPanelSections: [
        chart_controls_1.sections.legacyTimeseriesTime,
        // ── Режим проектирования ──
        {
            label: (0, core_1.t)('Режим проектирования'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'mock_mode_enabled',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Включить режим проектирования'),
                            description: (0, core_1.t)('Показывает синтетические данные из прототипа (5 форматов × 7 дивизионов, потери с breakdown). Выключите, когда реальные данные будут готовы.'),
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
                            default: 'losses',
                            choices: [['losses', (0, core_1.t)('Потери по форматам')]],
                            renderTrigger: true,
                            visibility: isMockEnabled,
                        },
                    },
                ],
            ],
        },
        // ── Запрос ──
        {
            label: (0, core_1.t)('Запрос'),
            expanded: true,
            controlSetRows: [
                ['adhoc_filters'],
                [
                    {
                        name: 'row_axis',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Ось строк'),
                            description: (0, core_1.t)('Колонка для строк pivot-таблицы (например, формат магазина)'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'col_axis',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Ось колонок'),
                            description: (0, core_1.t)('Колонка для колонок pivot-таблицы (например, дивизион)'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'value_metric',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Основная метрика'),
                            description: (0, core_1.t)('Значение, отображаемое в ячейках (обязательно)'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'plan_metric',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Плановая метрика'),
                            description: (0, core_1.t)('Плановое значение для сравнения (опционально). Ratio = факт/план.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'revenue_metric',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Метрика знаменателя (% от)'),
                            description: (0, core_1.t)('Используется для расчёта процента (оборот для потерь). Опционально.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'shops_metric',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Количество магазинов'),
                            description: (0, core_1.t)('Для детализации в drill-модалке. Опционально.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'breakdown_dim',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Измерение детализации'),
                            description: (0, core_1.t)('Колонка для breakdown в drill-модалке (например, категория потерь: списания, кражи). Опционально.'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
            ],
        },
        // ── Пороги ──
        {
            label: (0, core_1.t)('Пороги статусов'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'threshold_ok',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Порог «В норме» (ratio)'),
                            description: (0, core_1.t)('Максимальное отношение факт/план для зелёного статуса. По умолчанию 1.0.'),
                            default: 1.0,
                            isFloat: true,
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'threshold_wn',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Порог «Внимание» (ratio)'),
                            description: (0, core_1.t)('Максимальное отношение факт/план для жёлтого статуса. Выше — красный. По умолчанию 1.3.'),
                            default: 1.3,
                            isFloat: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'value_polarity',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Полярность метрики'),
                            description: (0, core_1.t)('Семантика: выше = хуже (потери, расходы) или выше = лучше (выручка).'),
                            default: 'higher_is_worse',
                            choices: [
                                ['higher_is_worse', (0, core_1.t)('Выше — хуже (потери, расходы)')],
                                ['higher_is_better', (0, core_1.t)('Выше — лучше (выручка)')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── Формат и отображение ──
        {
            label: (0, core_1.t)('Формат и отображение'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'header_text',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Заголовок карточки'),
                            default: 'Heatmap Pivot',
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
                            default: 'abs',
                            choices: [
                                ['abs', (0, core_1.t)('Абсолютное значение')],
                                ['pct', (0, core_1.t)('Процент (%)')],
                            ],
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'unit_suffix',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Суффикс единиц'),
                            description: (0, core_1.t)('Например: «млн ₽», «тыс шт.»'),
                            default: 'млн ₽',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'decimals',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Знаков после запятой'),
                            description: (0, core_1.t)('По DS 2.0: проценты с 1 знаком (12,4%); абсолютные числа — обычно 1.'),
                            default: 1,
                            isInt: true,
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'auto_format_russian',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Русский формат (тыс/млн/млрд)'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_totals',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Показывать Σ Итоги по умолчанию'),
                            description: (0, core_1.t)('Строка и колонка итогов (ячейка Σ в шапке карточки переключает вручную).'),
                            default: false,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'emit_filter',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Эмитировать cross-filter'),
                            description: (0, core_1.t)('Клик по ячейке/строке/колонке фильтрует другие чарты дашборда. Работает только если cross-filters включены в свойствах чарта.'),
                            default: true,
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