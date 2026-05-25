"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chart_controls_1 = require("@superset-ui/chart-controls");
const core_1 = require("@superset-ui/core");
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
const isRealData = ({ controls }) => controls?.mock_mode_enabled?.value !== true;
const DEFAULT_FORMAT_MAPPING = JSON.stringify({
    express: { name: 'Экспресс', color: 'c-sky', plan: 2.09 },
    minimarket: { name: 'Минимаркет', color: 'c-tangerine', plan: 2.25 },
    super: { name: 'Супермаркет', color: 'c-fuchsia', plan: 1.95 },
    home: { name: 'Магазин у дома', color: 'c-amber', plan: 1.15 },
    superstore: { name: 'Суперстор', color: 'g500', plan: 0.92 },
}, null, 2);
const config = {
    controlPanelSections: [
        chart_controls_1.sections.legacyTimeseriesTime,
        // ── Режим проектирования (mock) ──
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
                            description: (0, core_1.t)('Показывает 400 тестовых магазинов (детерминированная генерация ' +
                                'по seed). Выключите, когда датасет в StarRocks будет готов.'),
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
                            default: 'losses_velocity',
                            choices: [
                                ['losses_velocity', (0, core_1.t)('Скорость потерь (400 магазинов)')],
                            ],
                            renderTrigger: true,
                            visibility: isMockEnabled,
                        },
                    },
                ],
            ],
        },
        // ── Запрос к БД ──
        {
            label: (0, core_1.t)('Запрос'),
            expanded: true,
            controlSetRows: [
                ['adhoc_filters'],
                [
                    {
                        name: 'metric_loss',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Метрика потерь'),
                            description: (0, core_1.t)('Сумма потерь за период (обычно SUM(loss_rub)).'),
                            validators: [],
                            visibility: isRealData,
                        },
                    },
                ],
                [
                    {
                        name: 'metric_turnover',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Метрика товарооборота'),
                            description: (0, core_1.t)('Товарооборот (ТО) — нужен для расчёта % к ТО.'),
                            validators: [],
                            visibility: isRealData,
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_store_code',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Код магазина'),
                            description: (0, core_1.t)('Уникальный код магазина, напр. Д123.'),
                            multi: false,
                            validators: [],
                            visibility: isRealData,
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_store_name',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Название магазина'),
                            description: (0, core_1.t)('Короткое название магазина для отображения.'),
                            multi: false,
                            validators: [],
                            visibility: isRealData,
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_city',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Город'),
                            multi: false,
                            validators: [],
                            visibility: isRealData,
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_format',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Формат магазина'),
                            description: (0, core_1.t)('Код формата (express / minimarket / super / home / superstore). ' +
                                'Маппинг на русские названия и цвет — в секции «Форматы магазинов».'),
                            multi: false,
                            validators: [],
                            visibility: isRealData,
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_week',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Неделя (опционально)'),
                            description: (0, core_1.t)('Колонка временного измерения для тренда (обычно ' +
                                "DATE_TRUNC('week', <date>)). Не используется для основной агрегации — " +
                                'агрегация period-over-period выполняется через time_compare. ' +
                                'Если не задана — модалка покажет только Было/Стало без графика.'),
                            multi: false,
                            validators: [],
                            visibility: isRealData,
                        },
                    },
                ],
            ],
        },
        // ── Отображение ──
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
                            default: (0, core_1.t)('Скорость роста потерь'),
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'default_comparison_mode',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Сравнение по умолчанию'),
                            description: (0, core_1.t)('Период, с которым сравнивается текущий time_range. ' +
                                'Пользователь сможет переключить режим прямо в карточке. ' +
                                '«Выбрать вручную» — два независимых RangePicker\'а.'),
                            default: 'prev_period',
                            choices: [
                                ['prev_period', (0, core_1.t)('Предыдущий период')],
                                ['prev_week', (0, core_1.t)('Прошлая неделя')],
                                ['prev_month', (0, core_1.t)('Прошлый месяц')],
                                ['prev_quarter', (0, core_1.t)('Прошлый квартал')],
                                ['prev_year', (0, core_1.t)('Прошлый год')],
                                ['custom', (0, core_1.t)('Выбрать вручную')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'default_metric',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Метрика по умолчанию'),
                            default: 'rub',
                            choices: [
                                ['rub', (0, core_1.t)('₽ Суммы')],
                                ['pct', (0, core_1.t)('% к ТО')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_summary_strip',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Показывать сводку сверху'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_cumulative_view',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Кнопка кумулятивного вида'),
                            description: (0, core_1.t)('Показать переключатель «Кумулят.» рядом с дропдауном сравнения. ' +
                                'Отдельный вид — топ-10 магазинов с накопленными потерями ' +
                                'по доступным datapoints тренда (требуется trendRub).'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_detail_modal',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Разрешить модалку детализации'),
                            description: (0, core_1.t)('Двойной клик / Ctrl+клик открывает карточку с тем же самым ' +
                                'было/стало + тренд по main-периоду (если backend отдал).'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_csv_export',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Показывать кнопку CSV'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'page_size',
                        config: {
                            type: 'SelectControl',
                            freeForm: true,
                            clearable: false,
                            label: (0, core_1.t)('Магазинов на странице'),
                            description: (0, core_1.t)('Серверная пагинация: на каждую страницу делается отдельный запрос. ' +
                                'Меньше — быстрее, больше — реже клики.'),
                            default: 20,
                            choices: [
                                [10, '10'],
                                [20, '20'],
                                [50, '50'],
                                [100, '100'],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── Форматы магазинов (маппинг) ──
        {
            label: (0, core_1.t)('Форматы магазинов'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'format_mapping_json',
                        config: {
                            type: 'TextAreaControl',
                            label: (0, core_1.t)('Маппинг форматов (JSON)'),
                            description: (0, core_1.t)('Соответствие code → {name, color, plan}. ' +
                                'Допустимые color: c-sky, c-violet, c-tangerine, c-fuchsia, c-amber, g500.'),
                            default: DEFAULT_FORMAT_MAPPING,
                            language: 'json',
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