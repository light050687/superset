"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chart_controls_1 = require("@superset-ui/chart-controls");
const core_1 = require("@superset-ui/core");
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
const isMockCustom = ({ controls }) => isMockEnabled({ controls }) && controls?.mock_preset?.value === 'custom';
const config = {
    controlPanelSections: [
        chart_controls_1.sections.legacyTimeseriesTime,
        // ── 2. Режим проектирования ──
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
                            description: (0, core_1.t)('Показывает тестовые данные из прототипа (14 товарных категорий). ' +
                                'Выключите, когда реальные данные будут готовы.'),
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
                            default: 'losses',
                            choices: [
                                ['losses', (0, core_1.t)('Списания (14 категорий)')],
                                ['empty', (0, core_1.t)('Пустой')],
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
                            description: (0, core_1.t)('Формат: {"items":[{"id":"1","name":"X","value":10,"revenueRub":100,"valuePrev":8}], ' +
                                '"metricLabel":"...","metricUnit":"...","metricGenitive":"..."}'),
                            default: '{}',
                            language: 'json',
                            renderTrigger: true,
                            visibility: isMockCustom,
                        },
                    },
                ],
            ],
        },
        // ── 3. Запрос ──
        {
            label: (0, core_1.t)('Запрос'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'dimension',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Категория'),
                            description: (0, core_1.t)('Измерение, по которому строится Парето (категория, магазин и т.п.).'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_value',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Значение — факт'),
                            description: (0, core_1.t)('Главная метрика: сумма списаний, потерь и т.п.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_revenue',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Выручка (для % от оборота)'),
                            description: (0, core_1.t)('Опционально: позволяет посчитать «потери от выручки категории».'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_prev',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Прошлый период'),
                            description: (0, core_1.t)('Опционально: включает ghost-бары «Пред. период» и движение рангов (▲/▼).'),
                            validators: [],
                        },
                    },
                ],
                ['adhoc_filters'],
            ],
        },
        // ── 4. Отображение ──
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
                            default: 'Списания по Парето',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'subtitle_text',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Подзаголовок'),
                            description: (0, core_1.t)('Если пусто — берётся активный диапазон времени (Last year → «за год»).'),
                            default: '',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'metric_label',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название метрики'),
                            description: (0, core_1.t)('Именительный падеж, для легенды и tooltip.'),
                            default: 'Сумма списаний',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'metric_unit',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Единицы измерения'),
                            default: 'млн ₽',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'metric_genitive',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Родительный падеж метрики'),
                            description: (0, core_1.t)('Для фразы «…категорий дают X% ___». Например: «всех списаний».'),
                            default: 'всех списаний',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'breakdown_title',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Заголовок раскладки в drill'),
                            default: 'Причины списаний',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'default_threshold',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Порог зоны A (%)'),
                            description: (0, core_1.t)('От 50 до 95 с шагом 5. По умолчанию 80.'),
                            default: 80,
                            isInt: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'chart_aria_label',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('ARIA-label графика'),
                            description: (0, core_1.t)('Для screen reader-ов (WCAG 2.2).'),
                            default: 'Парето-диаграмма',
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