import { sections, sharedControls, } from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';
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
        sections.legacyTimeseriesTime,
        // ── 1. Режим проектирования ──
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
                            description: t('Показывает тестовые данные для согласования дизайна дашборда. ' +
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
                            label: t('Пресет данных'),
                            default: 'formats',
                            choices: [
                                ['formats', t('Форматы магазинов (списания, 5 строк)')],
                                ['categories', t('Категории товаров (8 строк)')],
                                ['single_row', t('Одна строка')],
                                ['many_rows', t('Много строк (20)')],
                                ['long_names', t('Длинные названия')],
                                ['negative', t('Отрицательные значения')],
                                ['empty', t('Пустой (нет данных)')],
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
                            description: t('Массив объектов: [{"id":"a","name":"Формат А","stores":10,"rate":2.3,' +
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
            label: t('Запрос — Данные'),
            expanded: false,
            controlSetRows: [
                ['adhoc_filters'],
                [
                    {
                        name: 'groupby_category',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Измерение (категория)'),
                            description: t('Колонка, по которой группируются строки bullet-чарта. ' +
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
                            ...sharedControls.metric,
                            label: t('Факт'),
                            description: t('Основная мера — фактическое значение.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_plan',
                        config: {
                            ...sharedControls.metric,
                            label: t('План'),
                            description: t('Целевое значение. Маркер «цели» на bullet-баре.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_py',
                        config: {
                            ...sharedControls.metric,
                            label: t('Прошлый год (ПГ)'),
                            description: t('Значение за аналогичный период прошлого года.'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_stores',
                        config: {
                            ...sharedControls.metric,
                            label: t('Количество магазинов'),
                            description: t('Опционально — количество элементов в категории ' +
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
            label: t('Sparkline (тренд)'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'sparkline_enabled',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Показывать sparkline'),
                            description: t('Мини-тренд в правой части строки. Второй запрос на данные ' +
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
                            label: t('Шаг времени для sparkline'),
                            default: 'P1W',
                            choices: [
                                ['P1D', t('День')],
                                ['P1W', t('Неделя')],
                                ['P1M', t('Месяц')],
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
                            label: t('Количество точек'),
                            description: t('Последние N точек временного ряда.'),
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
            label: t('Статус и направление'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'direction',
                        config: {
                            type: 'SelectControl',
                            label: t('Направление «хорошо»'),
                            description: t('Определяет, что считать успехом: меньше плана (списания, потери) ' +
                                'или больше плана (выручка, маржа). Влияет на раскраску статусов и зон bullet-бара.'),
                            default: 'less_is_better',
                            choices: [
                                ['less_is_better', t('Меньше — лучше (списания, потери)')],
                                ['more_is_better', t('Больше — лучше (выручка, маржа)')],
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
                            label: t('Tolerance «около плана», %'),
                            description: t('Размер «серой зоны» вокруг плана: ratio ∈ [1−tol, 1+tol] → warn. ' +
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
            label: t('Отображение'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'header_text',
                        config: {
                            type: 'TextControl',
                            label: t('Заголовок'),
                            description: t('Заголовок карточки. Если пусто — используется имя метрики.'),
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
                            label: t('Подзаголовок'),
                            description: t('Маленький текст под заголовком, напр. «Факт vs план vs ПГ».'),
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
                            label: t('Единица измерения'),
                            description: t('Что показывается после значения: %, ₽, шт, кг.'),
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
                            label: t('Единица дельты'),
                            description: t('Единица для дельт к плану/ПГ, напр. «п.п.» или «₽».'),
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
                            label: t('Русский формат (тыс, млн, млрд)'),
                            description: t('Пробел как разделитель тысяч, запятая как десятичный, ' +
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
                            label: t('Десятичных знаков'),
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
            label: t('Взаимодействие'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'default_sort',
                        config: {
                            type: 'SelectControl',
                            label: t('Сортировка по умолчанию'),
                            default: 'factDesc',
                            choices: [
                                ['factDesc', t('По факту (убыв.)')],
                                ['factAsc', t('По факту (возр.)')],
                                ['deltaPlanDesc', t('По дельте к плану')],
                                ['deltaPyDesc', t('По дельте к ПГ')],
                                ['storesDesc', t('По числу магазинов')],
                                ['nameAsc', t('По названию')],
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
                            label: t('Активен фильтр «Хуже плана»'),
                            description: t('По умолчанию показывать только строки хуже плана.'),
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
                            label: t('Cross-filter (клик применяет фильтр к дашборду)'),
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
                            label: t('Модаль детализации (Ctrl+клик)'),
                            description: t('Открывает список элементов выбранной категории.'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'detail_groupby',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Колонка детализации'),
                            description: t('Колонка для drill-down модали. Например, «Название магазина», ' +
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
export default config;
//# sourceMappingURL=controlPanel.js.map