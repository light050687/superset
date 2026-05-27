import { sections, sharedControls, } from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
const SORT_CHOICES = [
    ['lossCombined', t('Уровень потерь (по умолчанию)')],
    ['writeoff', t('% Списаний')],
    ['shrinkage', t('% Недостач')],
    ['avgWriteoff', t('Ср. сумма списания')],
    ['avgShrinkageCheck', t('Ср. чек недостачи')],
    ['name', t('Имя магазина (А-Я)')],
];
const MOCK_PRESET_CHOICES = [
    ['losses_400', t('Потери · 400 магазинов')],
    ['losses_50', t('Потери · 50 магазинов (быстрая демо)')],
    ['empty', t('Пустой набор')],
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
        sections.legacyTimeseriesTime,
        // ── 1. Запрос (Данные) ───────────────────────────────────────
        {
            label: t('Запрос'),
            expanded: false,
            description: t('Перетащите столбцы и метрики из левой панели. Если поле оставить пустым — ' +
                'плагин использует дефолтное имя из dataset (см. описание каждого поля).'),
            controlSetRows: [
                ['adhoc_filters'],
                // ── Метрики ──
                [
                    {
                        name: 'metric_writeoff',
                        config: {
                            ...sharedControls.metric,
                            label: t('% Списаний'),
                            description: t('Дефолт: writeoff_pct'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_shrinkage',
                        config: {
                            ...sharedControls.metric,
                            label: t('% Недостач'),
                            description: t('Дефолт: shrinkage_pct'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_plan_writeoff',
                        config: {
                            ...sharedControls.metric,
                            label: t('План % списаний'),
                            description: t('Дефолт: plan_writeoff_pct'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_plan_shrinkage',
                        config: {
                            ...sharedControls.metric,
                            label: t('План % недостач'),
                            description: t('Дефолт: plan_shrinkage_pct'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_avg_writeoff',
                        config: {
                            ...sharedControls.metric,
                            label: t('Ср. сумма списания (₽)'),
                            description: t('Дефолт: avg_writeoff_rub'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_avg_shrinkage_check',
                        config: {
                            ...sharedControls.metric,
                            label: t('Ср. чек недостачи (₽)'),
                            description: t('Дефолт: avg_shrinkage_check_rub'),
                            validators: [],
                        },
                    },
                ],
                // ── Измерения ──
                [
                    {
                        name: 'groupby_store_id',
                        config: {
                            ...sharedControls.groupby,
                            label: t('ID магазина'),
                            description: t('Дефолт: store_id'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_store_name',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Название магазина'),
                            description: t('Дефолт: store_name'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_city',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Город'),
                            description: t('Дефолт: city'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_format',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Формат (код)'),
                            description: t('Код формата: express / minimarket / super / home / superstore. ' +
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
                            ...sharedControls.groupby,
                            label: t('Название формата'),
                            description: t('Дефолт: format_name'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_division',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Дивизион'),
                            description: t('Дефолт: division'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_to_class',
                        config: {
                            ...sharedControls.groupby,
                            label: t('ТО (млн ₽)'),
                            description: t('Дефолт: to_class'),
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
                            ...sharedControls.row_limit,
                            label: t('Лимит строк'),
                            default: 1000,
                            choices: ROW_LIMIT_CHOICES,
                            description: t('Максимальное число магазинов, загружаемых из dataset.'),
                        },
                    },
                ],
            ],
        },
        // ── 2. Режим проектирования (Кастомизация) ───────────────────
        {
            label: t('Режим проектирования'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'mock_mode_enabled',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Включить режим проектирования'),
                            description: t('Показывает тестовые данные (рейтинг магазинов из прототипа). ' +
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
                            label: t('Пресет mock-данных'),
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
            label: t('Отображение'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'default_sort',
                        config: {
                            type: 'SelectControl',
                            label: t('Сортировка по умолчанию'),
                            default: 'lossCombined',
                            choices: SORT_CHOICES,
                            description: t('По какому столбцу сортировать таблицу при первой загрузке.'),
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'page_size',
                        config: {
                            type: 'SelectControl',
                            label: t('Магазинов на странице'),
                            default: 50,
                            choices: PAGE_SIZE_CHOICES,
                            freeForm: false,
                            description: t('Размер страницы пагинации. Сейчас навигация работает по уже загруженной выборке (row_limit); серверная пагинация — следующий шаг.'),
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'period_label',
                        config: {
                            type: 'TextControl',
                            label: t('Подпись периода'),
                            default: '',
                            description: t('Например «Март 2026» — выводится в шапке карточки ' +
                                'под заголовком «Рейтинг магазинов».'),
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
    ],
};
export default config;
//# sourceMappingURL=controlPanel.js.map