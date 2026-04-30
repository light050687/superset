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
                            label: (0, core_1.t)('Неделя'),
                            description: (0, core_1.t)('Колонка с датой понедельника недели (обычно DATE_TRUNC(\'week\', <date>)). ' +
                                'Ожидается 12 последних недель.'),
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
                        name: 'default_horizon',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Горизонт по умолчанию'),
                            default: '4w',
                            choices: [
                                ['wow', (0, core_1.t)('WoW (неделя к неделе)')],
                                ['4w', (0, core_1.t)('4W vs 4W')],
                                ['mom', (0, core_1.t)('MoM (месяц к месяцу)')],
                                ['cum', (0, core_1.t)('Кумулятивно')],
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
                            label: (0, core_1.t)('Разрешить кумулятивный вид'),
                            description: (0, core_1.t)('Если выключено — кнопка «Кумулят.» будет скрыта из переключателя горизонтов.'),
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
                            description: (0, core_1.t)('Двойной клик / Ctrl+клик открывает 12-недельный тренд магазина.'),
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