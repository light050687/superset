import { sections, sharedControls, } from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
const isMockCustom = ({ controls }) => isMockEnabled({ controls }) && controls?.mock_preset?.value === 'custom';
const config = {
    controlPanelSections: [
        sections.legacyTimeseriesTime,
        // ── 2. Режим проектирования ──
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
                            description: t('Показывает тестовые данные из прототипа (14 товарных категорий). ' +
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
                            label: t('Пресет данных'),
                            default: 'losses',
                            choices: [
                                ['losses', t('Списания (14 категорий)')],
                                ['empty', t('Пустой')],
                                ['custom', t('Кастом (JSON)')],
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
                            label: t('JSON кастомных данных'),
                            description: t('Формат: {"items":[{"id":"1","name":"X","value":10,"revenueRub":100,"valuePrev":8}], ' +
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
            label: t('Запрос'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'dimension',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Категория'),
                            description: t('Измерение, по которому строится Парето (категория, магазин и т.п.).'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_value',
                        config: {
                            ...sharedControls.metric,
                            label: t('Значение — факт'),
                            description: t('Главная метрика: сумма списаний, потерь и т.п.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_revenue',
                        config: {
                            ...sharedControls.metric,
                            label: t('Выручка (для % от оборота)'),
                            description: t('Опционально: позволяет посчитать «потери от выручки категории».'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_prev',
                        config: {
                            ...sharedControls.metric,
                            label: t('Прошлый период'),
                            description: t('Опционально: включает ghost-бары «Пред. период» и движение рангов (▲/▼).'),
                            validators: [],
                        },
                    },
                ],
                ['adhoc_filters'],
            ],
        },
        // ── 4. Отображение ──
        {
            label: t('Отображение'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'header_text',
                        config: {
                            type: 'TextControl',
                            label: t('Заголовок карточки'),
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
                            label: t('Подзаголовок'),
                            description: t('Если пусто — берётся активный диапазон времени (Last year → «за год»).'),
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
                            label: t('Название метрики'),
                            description: t('Именительный падеж, для легенды и tooltip.'),
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
                            label: t('Единицы измерения'),
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
                            label: t('Родительный падеж метрики'),
                            description: t('Для фразы «…категорий дают X% ___». Например: «всех списаний».'),
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
                            label: t('Заголовок раскладки в drill'),
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
                            label: t('Порог зоны A (%)'),
                            description: t('От 50 до 95 с шагом 5. По умолчанию 80.'),
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
                            label: t('ARIA-label графика'),
                            description: t('Для screen reader-ов (WCAG 2.2).'),
                            default: 'Парето-диаграмма',
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