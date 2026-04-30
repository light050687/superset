import { sections, sharedControls, } from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
const hasGroupbyCategory = ({ controls }) => {
    const v = controls?.groupby_category?.value;
    if (Array.isArray(v))
        return v.length > 0;
    return v != null && v !== '';
};
const config = {
    controlPanelSections: [
        // ── 1. Time ──
        sections.legacyTimeseriesTime,
        // ── 2. Design / Mock mode ──
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
                            default: 'writeoffs',
                            choices: [
                                ['writeoffs', t('Списания (5 категорий, млн ₽)')],
                                ['losses', t('Потери (меньший масштаб)')],
                                ['incidents', t('Инциденты (3 категории)')],
                            ],
                            renderTrigger: true,
                            visibility: isMockEnabled,
                        },
                    },
                ],
            ],
        },
        // ── 3. Query ──
        {
            label: t('Запрос'),
            expanded: true,
            controlSetRows: [
                ['adhoc_filters'],
                [
                    {
                        name: 'metric_fact',
                        config: {
                            ...sharedControls.metric,
                            label: t('Факт'),
                            description: t('Основная мера — фактические значения по времени'),
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
                            description: t('Опциональная мера — плановые значения (бюджет)'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_py',
                        config: {
                            ...sharedControls.metric,
                            label: t('Прошлый год'),
                            description: t('Опциональная мера — значения прошлого года'),
                            validators: [],
                        },
                    },
                ],
            ],
        },
        // ── 4. Category breakdown ──
        {
            label: t('Разбивка по категориям'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'groupby_category',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Колонка категорий'),
                            description: t('Колонка для разбивки на стек-режимах (Стек-бары / Стек-площадь). ' +
                                'Если не задана — работает только линейный режим.'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'categories_limit',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: t('Лимит категорий'),
                            description: t('Количество отображаемых категорий. Остальные сливаются в «Прочее».'),
                            default: 5,
                            renderTrigger: true,
                            visibility: hasGroupbyCategory,
                        },
                    },
                ],
            ],
        },
        // ── 5. Display ──
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
                            default: 'Динамика списаний',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'default_mode',
                        config: {
                            type: 'SelectControl',
                            label: t('Режим по умолчанию'),
                            default: 'line',
                            choices: [
                                ['line', t('Линия')],
                                ['stack-bar', t('Стек-бары')],
                                ['stack-area', t('Стек-площадь')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'default_granularity',
                        config: {
                            type: 'SelectControl',
                            label: t('Гранулярность по умолчанию'),
                            default: 'month',
                            choices: [
                                ['year', t('По годам')],
                                ['month', t('По месяцам')],
                                ['week', t('По неделям')],
                                ['day', t('По дням')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'default_unit',
                        config: {
                            type: 'SelectControl',
                            label: t('Единицы по умолчанию'),
                            default: 'rub',
                            choices: [
                                ['rub', t('Рубли (₽)')],
                                ['pct', t('Проценты от плана (%)')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_brush_button',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Кнопка выделения диапазона'),
                            description: t('Показывать иконку brush в правом верхнем углу'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'enable_drill_down',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Разрешить drill-down'),
                            description: t('Клик по месяцу переключает на недельную разбивку'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── 6. Number formatting ──
        {
            label: t('Форматирование чисел'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'value_decimals',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: t('Знаков после запятой'),
                            description: t('-1 = авто. Масштаб подставляется автоматически (тыс / млн / млрд).'),
                            default: -1,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'value_suffix',
                        config: {
                            type: 'TextControl',
                            label: t('Единица'),
                            description: t('Добавляется после числа. Например "₽", "шт", "кг". Масштаб (тыс/млн/млрд) подставляется автоматически.'),
                            default: '₽',
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── 7. Series labels ──
        {
            label: t('Названия серий'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'label_fact',
                        config: {
                            type: 'TextControl',
                            label: t('Название "Факт"'),
                            default: 'Факт',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'label_plan',
                        config: {
                            type: 'TextControl',
                            label: t('Название "План"'),
                            default: 'План',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'label_py',
                        config: {
                            type: 'TextControl',
                            label: t('Название "Прошлый год"'),
                            default: 'ПГ',
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