"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chart_controls_1 = require("@superset-ui/chart-controls");
const core_1 = require("@superset-ui/core");
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
const SORT_CHOICES = [
    ['lossCombined', (0, core_1.t)('Уровень потерь (по умолчанию)')],
    ['writeoff', (0, core_1.t)('% Списаний')],
    ['shrinkage', (0, core_1.t)('% Недостач')],
    ['avgWriteoff', (0, core_1.t)('Ср. сумма списания')],
    ['avgShrinkageCheck', (0, core_1.t)('Ср. чек недостачи')],
    ['name', (0, core_1.t)('Имя магазина (А-Я)')],
];
const MOCK_PRESET_CHOICES = [
    ['losses_400', (0, core_1.t)('Потери · 400 магазинов')],
    ['losses_50', (0, core_1.t)('Потери · 50 магазинов (быстрая демо)')],
    ['empty', (0, core_1.t)('Пустой набор')],
];
const ROW_LIMIT_CHOICES = [
    [100, '100'],
    [500, '500'],
    [1000, '1\u00a0000'],
    [5000, '5\u00a0000'],
    [10000, '10\u00a0000'],
];
const PAGE_SIZE_CHOICES = [
    [25, '25'],
    [50, '50'],
    [100, '100'],
    [200, '200'],
];
const config = {
    controlPanelSections: [
        chart_controls_1.sections.legacyTimeseriesTime,
        // ── 1. Запрос (Данные) ───────────────────────────────────────
        {
            label: (0, core_1.t)('Запрос'),
            expanded: false,
            description: (0, core_1.t)('Перетащите столбцы и метрики из левой панели. Если поле оставить пустым — ' +
                'плагин использует дефолтное имя из dataset (см. описание каждого поля).'),
            controlSetRows: [
                ['adhoc_filters'],
                // ── Метрики ──
                [
                    {
                        name: 'metric_writeoff',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('% Списаний'),
                            description: (0, core_1.t)('Дефолт: writeoff_pct'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_shrinkage',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('% Недостач'),
                            description: (0, core_1.t)('Дефолт: shrinkage_pct'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_plan_writeoff',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('План % списаний'),
                            description: (0, core_1.t)('Дефолт: plan_writeoff_pct'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_plan_shrinkage',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('План % недостач'),
                            description: (0, core_1.t)('Дефолт: plan_shrinkage_pct'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_avg_writeoff',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Ср. сумма списания (₽)'),
                            description: (0, core_1.t)('Дефолт: avg_writeoff_rub'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_avg_shrinkage_check',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Ср. чек недостачи (₽)'),
                            description: (0, core_1.t)('Дефолт: avg_shrinkage_check_rub'),
                            validators: [],
                        },
                    },
                ],
                // ── Измерения ──
                [
                    {
                        name: 'groupby_store_id',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('ID магазина'),
                            description: (0, core_1.t)('Дефолт: store_id'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_store_name',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Название магазина'),
                            description: (0, core_1.t)('Дефолт: store_name'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_city',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Город'),
                            description: (0, core_1.t)('Дефолт: city'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_format',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Формат (код)'),
                            description: (0, core_1.t)('Код формата: express / minimarket / super / home / superstore. ' +
                                'Дефолт: format'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_format_name',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Название формата'),
                            description: (0, core_1.t)('Дефолт: format_name'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_division',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Дивизион'),
                            description: (0, core_1.t)('Дефолт: division'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_to_class',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('ТО (млн ₽)'),
                            description: (0, core_1.t)('Дефолт: to_class'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                // ── Лимит ──
                [
                    {
                        name: 'row_limit',
                        config: {
                            ...chart_controls_1.sharedControls.row_limit,
                            label: (0, core_1.t)('Лимит строк'),
                            default: 1000,
                            choices: ROW_LIMIT_CHOICES,
                            description: (0, core_1.t)('Максимальное число магазинов, загружаемых из dataset.'),
                        },
                    },
                ],
            ],
        },
        // ── 2. Режим проектирования (Кастомизация) ───────────────────
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
                            description: (0, core_1.t)('Показывает тестовые данные (рейтинг магазинов из прототипа). ' +
                                'Выключите, когда реальные данные из StarRocks будут готовы.'),
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
                            label: (0, core_1.t)('Пресет mock-данных'),
                            default: 'losses_400',
                            choices: MOCK_PRESET_CHOICES,
                            renderTrigger: true,
                            visibility: isMockEnabled,
                        },
                    },
                ],
            ],
        },
        // ── 3. Отображение (Кастомизация) ────────────────────────────
        {
            label: (0, core_1.t)('Отображение'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'default_sort',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Сортировка по умолчанию'),
                            default: 'lossCombined',
                            choices: SORT_CHOICES,
                            description: (0, core_1.t)('По какому столбцу сортировать таблицу при первой загрузке.'),
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'page_size',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Магазинов на странице'),
                            default: 50,
                            choices: PAGE_SIZE_CHOICES,
                            freeForm: false,
                            description: (0, core_1.t)('Размер страницы пагинации. Сейчас навигация работает по уже загруженной выборке (row_limit); серверная пагинация — следующий шаг.'),
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'period_label',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Подпись периода'),
                            default: '',
                            description: (0, core_1.t)('Например «Март 2026» — выводится в шапке карточки ' +
                                'под заголовком «Рейтинг магазинов».'),
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