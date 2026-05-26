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
        // ── 1. Режим проектирования ───────────────────────────────────
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
        // ── 2. Отображение ───────────────────────────────────────────
        {
            label: (0, core_1.t)('Отображение'),
            expanded: true,
            controlSetRows: [
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
        // ── 3. Сопоставление колонок dataset ─────────────────────────
        {
            label: (0, core_1.t)('Сопоставление колонок'),
            expanded: false,
            description: (0, core_1.t)('Имена столбцов и метрик, если они отличаются от дефолтов. ' +
                'По умолчанию плагин ожидает: store_id, store_name, city, format, ' +
                'format_name, division, to_class, writeoff_pct, shrinkage_pct, ' +
                'plan_writeoff_pct, plan_shrinkage_pct, avg_writeoff_rub, ' +
                'avg_shrinkage_check_rub.'),
            controlSetRows: [
                [
                    {
                        name: 'store_id_col',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Столбец ID магазина'),
                            default: 'store_id',
                            renderTrigger: false,
                        },
                    },
                    {
                        name: 'store_name_col',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Столбец названия'),
                            default: 'store_name',
                            renderTrigger: false,
                        },
                    },
                ],
                [
                    {
                        name: 'city_col',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Столбец города'),
                            default: 'city',
                            renderTrigger: false,
                        },
                    },
                    {
                        name: 'format_col',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Столбец формата'),
                            default: 'format',
                            renderTrigger: false,
                        },
                    },
                ],
                [
                    {
                        name: 'format_name_col',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Столбец названия формата'),
                            default: 'format_name',
                            renderTrigger: false,
                        },
                    },
                    {
                        name: 'division_col',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Столбец дивизиона'),
                            default: 'division',
                            renderTrigger: false,
                        },
                    },
                ],
                [
                    {
                        name: 'to_class_col',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Столбец ТО (млн ₽)'),
                            default: 'to_class',
                            renderTrigger: false,
                        },
                    },
                    {
                        name: 'segment_id_col',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Столбец ID сегмента (для cross-filter)'),
                            default: 'segment_id',
                            renderTrigger: false,
                        },
                    },
                ],
                [
                    {
                        name: 'writeoff_metric',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Метрика % списаний'),
                            default: 'writeoff_pct',
                            renderTrigger: false,
                        },
                    },
                    {
                        name: 'shrinkage_metric',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Метрика % недостач'),
                            default: 'shrinkage_pct',
                            renderTrigger: false,
                        },
                    },
                ],
                [
                    {
                        name: 'plan_writeoff_metric',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Метрика плана списаний'),
                            default: 'plan_writeoff_pct',
                            renderTrigger: false,
                        },
                    },
                    {
                        name: 'plan_shrinkage_metric',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Метрика плана недостач'),
                            default: 'plan_shrinkage_pct',
                            renderTrigger: false,
                        },
                    },
                ],
                [
                    {
                        name: 'avg_writeoff_metric',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Метрика ср. суммы списания (₽)'),
                            default: 'avg_writeoff_rub',
                            renderTrigger: false,
                        },
                    },
                    {
                        name: 'avg_shrinkage_check_metric',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Метрика ср. чека недостачи (₽)'),
                            default: 'avg_shrinkage_check_rub',
                            renderTrigger: false,
                        },
                    },
                ],
            ],
        },
    ],
};
exports.default = config;
//# sourceMappingURL=controlPanel.js.map