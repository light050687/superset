import { sections, sharedControls, } from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';
const isStaticThreshold = ({ controls }) => controls?.threshold_mode?.value === 'static';
const isDrillEnabled = ({ controls }) => controls?.drill_enabled?.value === true;
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
// ── Choices ──
const THRESHOLD_MODE_CHOICES = [
    ['metric', t('Из метрик plan_x / plan_y')],
    ['static', t('Статические числа')],
    ['avg', t('Среднее по фактическим значениям')],
];
const SEMANTIC_CHOICES = [
    ['up', t('Позитив (зелёный)')],
    ['dn', t('Негатив (красный)')],
    ['wn', t('Внимание (жёлтый)')],
    ['x', t('Цвет метрики X')],
    ['y', t('Цвет метрики Y')],
];
// ═══════════════════════════════════════
// Control Panel
// ═══════════════════════════════════════
const config = {
    controlPanelSections: [
        sections.legacyTimeseriesTime,
        // ── Режим проектирования (mock) ──
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
                            description: t('Показывает синтетические данные (400 магазинов) для согласования ' +
                                'дизайна без подключения датасета.'),
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
                            label: t('Пресет данных'),
                            default: 'retail',
                            choices: [['retail', t('Ритейл: 400 магазинов, 5 форматов')]],
                            renderTrigger: true,
                            visibility: isMockEnabled,
                        },
                    },
                ],
            ],
        },
        // ── Запрос ──
        {
            label: t('Запрос'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'groupby_store',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Измерение: магазин'),
                            description: t('Уникальный идентификатор магазина (например, store_code). ' +
                                'Каждая строка запроса = одна точка на scatter. Обязательно.'),
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
                            label: t('Измерение: формат'),
                            description: t('Определяет цвет точки. Обычно формат магазина (экспресс, минимаркет…).'),
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
                            label: t('Измерение: город (опционально)'),
                            description: t('Показывается в tooltip и используется в поиске.'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_x',
                        config: {
                            ...sharedControls.metric,
                            label: t('Метрика X'),
                            description: t('Горизонтальная ось (например, % списаний).'),
                        },
                    },
                ],
                [
                    {
                        name: 'metric_y',
                        config: {
                            ...sharedControls.metric,
                            label: t('Метрика Y'),
                            description: t('Вертикальная ось (например, % недостач).'),
                        },
                    },
                ],
                [
                    {
                        name: 'metric_size',
                        config: {
                            ...sharedControls.metric,
                            label: t('Метрика размера (опционально)'),
                            description: t('Размер пузыря. Если не задано — все точки одинакового размера.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_plan_x',
                        config: {
                            ...sharedControls.metric,
                            label: t('План X (опционально)'),
                            description: t('Плановое значение X по строке. Используется для bullet charts и порогов. ' +
                                'Если задано — threshold = средневзвешенный план.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_plan_y',
                        config: {
                            ...sharedControls.metric,
                            label: t('План Y (опционально)'),
                            description: t('Плановое значение Y по строке.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_sum_loss',
                        config: {
                            ...sharedControls.metric,
                            label: t('Сумма потерь (опционально)'),
                            description: t('Отображается в аннотациях квадрантов и summary модалей.'),
                            validators: [],
                        },
                    },
                ],
                ['adhoc_filters'],
                ['row_limit'],
            ],
        },
        // ── Отображение ──
        {
            label: t('Отображение'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'title',
                        config: {
                            type: 'TextControl',
                            label: t('Заголовок'),
                            default: 'Матрица рисков магазинов',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'subtitle',
                        config: {
                            type: 'TextControl',
                            label: t('Подзаголовок'),
                            default: 'Списания × Недостачи',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'x_label',
                        config: {
                            type: 'TextControl',
                            label: t('Подпись оси X'),
                            default: '',
                            description: t('Если пусто — используется метка метрики.'),
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'y_label',
                        config: {
                            type: 'TextControl',
                            label: t('Подпись оси Y'),
                            default: '',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'x_unit',
                        config: {
                            type: 'TextControl',
                            label: t('Единица X'),
                            default: '%',
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'y_unit',
                        config: {
                            type: 'TextControl',
                            label: t('Единица Y'),
                            default: '%',
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'size_unit',
                        config: {
                            type: 'TextControl',
                            label: t('Единица размера'),
                            default: 'млн ₽',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'x_decimals',
                        config: {
                            type: 'SelectControl',
                            label: t('Знаки после запятой X'),
                            default: 2,
                            choices: [
                                [0, '0'],
                                [1, '1'],
                                [2, '2'],
                                [3, '3'],
                            ],
                            clearable: false,
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'y_decimals',
                        config: {
                            type: 'SelectControl',
                            label: t('Знаки после запятой Y'),
                            default: 2,
                            choices: [
                                [0, '0'],
                                [1, '1'],
                                [2, '2'],
                                [3, '3'],
                            ],
                            clearable: false,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'enable_worst_star',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Подсвечивать топ-5 худших звёздочкой'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'enable_quadrant_annotations',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Показывать плашки с метриками квадрантов'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'threshold_mode',
                        config: {
                            type: 'SelectControl',
                            label: t('Источник порогов (штриховые линии)'),
                            default: 'metric',
                            choices: THRESHOLD_MODE_CHOICES,
                            clearable: false,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'static_threshold_x',
                        config: {
                            type: 'TextControl',
                            isFloat: true,
                            label: t('Порог X'),
                            default: 1.5,
                            renderTrigger: true,
                            visibility: isStaticThreshold,
                        },
                    },
                    {
                        name: 'static_threshold_y',
                        config: {
                            type: 'TextControl',
                            isFloat: true,
                            label: t('Порог Y'),
                            default: 0.5,
                            renderTrigger: true,
                            visibility: isStaticThreshold,
                        },
                    },
                ],
                ['color_scheme'],
            ],
        },
        // ── Квадранты ──
        {
            label: t('Квадранты'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'quad_tl_label',
                        config: {
                            type: 'TextControl',
                            label: t('TL: заголовок'),
                            default: 'НЕДОСТАЧИ',
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'quad_tl_semantic',
                        config: {
                            type: 'SelectControl',
                            label: t('TL: семантика'),
                            default: 'y',
                            choices: SEMANTIC_CHOICES,
                            clearable: false,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'quad_tr_label',
                        config: {
                            type: 'TextControl',
                            label: t('TR: заголовок'),
                            default: 'КРИТИЧЕСКИ ⚠',
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'quad_tr_semantic',
                        config: {
                            type: 'SelectControl',
                            label: t('TR: семантика'),
                            default: 'dn',
                            choices: SEMANTIC_CHOICES,
                            clearable: false,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'quad_bl_label',
                        config: {
                            type: 'TextControl',
                            label: t('BL: заголовок'),
                            default: 'НОРМА ✓',
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'quad_bl_semantic',
                        config: {
                            type: 'SelectControl',
                            label: t('BL: семантика'),
                            default: 'up',
                            choices: SEMANTIC_CHOICES,
                            clearable: false,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'quad_br_label',
                        config: {
                            type: 'TextControl',
                            label: t('BR: заголовок'),
                            default: 'СПИСАНИЯ',
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'quad_br_semantic',
                        config: {
                            type: 'SelectControl',
                            label: t('BR: семантика'),
                            default: 'x',
                            choices: SEMANTIC_CHOICES,
                            clearable: false,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── Детализация ──
        {
            label: t('Детализация (drill-down)'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'drill_enabled',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Разрешить модали детализации'),
                            description: t('Ctrl+Click по точке открывает модаль магазина, Ctrl+Click по квадранту — модаль квадранта.'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'detail_dataset_id',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: t('ID датасета деталей'),
                            description: t('Тот же или другой датасет для запросов trend/causes/skus. Оставить пустым — модали покажут только базовые данные.'),
                            default: '',
                            visibility: isDrillEnabled,
                        },
                    },
                ],
                [
                    {
                        name: 'trend_time_column',
                        config: {
                            type: 'TextControl',
                            label: t('Колонка времени (для trend)'),
                            description: t('Название временной колонки в датасете деталей. По умолчанию — недельная группировка.'),
                            default: '',
                            visibility: isDrillEnabled,
                        },
                    },
                    {
                        name: 'trend_weeks',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: t('Недель в trend'),
                            default: 12,
                            visibility: isDrillEnabled,
                        },
                    },
                ],
                [
                    {
                        name: 'causes_dimension',
                        config: {
                            type: 'TextControl',
                            label: t('Причины: dimension'),
                            description: t('Имя колонки с категорией причин (например, reason_name). Топ-N по причинам.'),
                            default: '',
                            visibility: isDrillEnabled,
                        },
                    },
                    {
                        name: 'causes_top_n',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: t('Причин (top-N)'),
                            default: 3,
                            visibility: isDrillEnabled,
                        },
                    },
                ],
                [
                    {
                        name: 'causes_metric',
                        config: {
                            ...sharedControls.metric,
                            label: t('Причины: метрика'),
                            description: t('Метрика для сортировки причин (обычно — сумма потерь).'),
                            validators: [],
                            visibility: isDrillEnabled,
                        },
                    },
                ],
                [
                    {
                        name: 'skus_dimension',
                        config: {
                            type: 'TextControl',
                            label: t('SKU: dimension'),
                            default: '',
                            visibility: isDrillEnabled,
                        },
                    },
                    {
                        name: 'skus_top_n',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: t('SKU (top-N)'),
                            default: 5,
                            visibility: isDrillEnabled,
                        },
                    },
                ],
                [
                    {
                        name: 'skus_metric',
                        config: {
                            ...sharedControls.metric,
                            label: t('SKU: метрика'),
                            validators: [],
                            visibility: isDrillEnabled,
                        },
                    },
                ],
                [
                    {
                        name: 'rank_dimension',
                        config: {
                            type: 'TextControl',
                            label: t('Ранк: dimension'),
                            description: t('По умолчанию — то же, что «Измерение: формат». По какой группе считать место магазина.'),
                            default: '',
                            visibility: isDrillEnabled,
                        },
                    },
                ],
                [
                    {
                        name: 'shortcuts_hint',
                        config: {
                            type: 'TextControl',
                            label: t('Подсказка горячих клавиш'),
                            default: 'Click — фильтр · Ctrl+Click — детализация · Drag — перемещение · Scroll — масштаб',
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
    ],
    // Контроль метки/aggregation для shared metrics
    controlOverrides: {
        series: { multi: true },
    },
};
export default config;
//# sourceMappingURL=controlPanel.js.map