"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chart_controls_1 = require("@superset-ui/chart-controls");
const core_1 = require("@superset-ui/core");
// ── Custom format options (Russian smart + standard D3) ──
const NUMBER_FORMAT_OPTIONS = [
    ['RU_SMART', (0, core_1.t)('Русский формат (тыс, млн, млрд)')],
    ...chart_controls_1.D3_FORMAT_OPTIONS,
];
const COLOR_SCHEME_CHOICES = [
    ['green_up', (0, core_1.t)('Рост — хорошо')],
    ['green_down', (0, core_1.t)('Снижение — хорошо')],
];
const isDual = ({ controls }) => controls?.mode_count?.value === 'dual';
const isComp1Enabled = ({ controls }) => controls?.enable_comp1?.value === true;
const isComp2Enabled = ({ controls }) => controls?.enable_comp2?.value === true;
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
const isMockCustom = ({ controls }) => isMockEnabled({ controls }) && controls?.mock_preset?.value === 'custom';
// ═══════════════════════════════════════
// Control Panel Configuration
// ═══════════════════════════════════════
const config = {
    controlPanelSections: [
        // ── Section 1: Time ──
        chart_controls_1.sections.legacyTimeseriesTime,
        // ── Section 2: Mock / Design Mode ──
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
                            description: (0, core_1.t)('Показывает тестовые данные для согласования дизайна дашборда. ' +
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
                            label: (0, core_1.t)('Пресет данных'),
                            default: 'revenue',
                            choices: [
                                ['revenue', (0, core_1.t)('Выручка (12,4 млрд)')],
                                ['expenses', (0, core_1.t)('Расходы (3,2 млрд)')],
                                ['margin', (0, core_1.t)('Маржа (9,2 млрд)')],
                                ['losses', (0, core_1.t)('Потери (264 млн)')],
                                ['conversion', (0, core_1.t)('Конверсия (5,63%)')],
                                ['empty', (0, core_1.t)('Пустой (все нули)')],
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
                            description: (0, core_1.t)('Формат: {"mainA": 1000, "comp1A": 900, "comp2A": 800, ' +
                                '"mainB": 10.5, "comp1B": 9.8, "comp2B": 8.2, ' +
                                '"groupCount": 20, "childrenPerGroup": 5}'),
                            default: '{}',
                            language: 'json',
                            renderTrigger: true,
                            visibility: isMockCustom,
                        },
                    },
                ],
            ],
        },
        // ── Section 3: Query — Mode A ──
        {
            label: (0, core_1.t)('Запрос — Режим А'),
            expanded: false,
            controlSetRows: [
                ['adhoc_filters'], // DnD validator for columns+metrics → DatasourcePanel shows data
                [
                    {
                        name: 'metric_a',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Основная мера'),
                            description: (0, core_1.t)('Основное значение KPI — большое число на карточке'),
                            validators: [], // validation in transformProps (mock mode needs empty metrics)
                        },
                    },
                ],
                [
                    {
                        name: 'metric_plan_a',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Мера сравнения 1'),
                            description: (0, core_1.t)('Первая мера сравнения (например, план, бюджет)'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_comp2_a',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Мера сравнения 2'),
                            description: (0, core_1.t)('Вторая мера сравнения (например, прошлый год, среднее)'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'metric_delta_1a',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Мера дельты — Сравнение 1'),
                            description: (0, core_1.t)('Готовое значение дельты из SQL. Если не задано — дельта = факт − план.'),
                            validators: [],
                            visibility: isComp1Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'metric_delta_2a',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Мера дельты — Сравнение 2'),
                            description: (0, core_1.t)('Готовое значение дельты из SQL. Если не задано — дельта = факт − план.'),
                            validators: [],
                            visibility: isComp2Enabled,
                        },
                    },
                ],
            ],
        },
        // ── Section 3: Query — Mode B (only in dual mode) ──
        {
            label: (0, core_1.t)('Запрос — Режим Б'),
            expanded: false,
            controlSetRows: [
                ['adhoc_filters'],
                [
                    {
                        name: 'metric_b',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Основная мера'),
                            description: (0, core_1.t)('Основное значение KPI для Режима Б'),
                            validators: [],
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'metric_plan_b',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Мера сравнения 1'),
                            description: (0, core_1.t)('Первая мера сравнения для Режима Б'),
                            validators: [],
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'metric_comp2_b',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Мера сравнения 2'),
                            description: (0, core_1.t)('Вторая мера сравнения для Режима Б'),
                            validators: [],
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'metric_delta_1b',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Мера дельты — Сравнение 1'),
                            description: (0, core_1.t)('Готовое значение дельты из SQL. Если не задано — дельта = факт − план.'),
                            validators: [],
                            visibility: (state) => isDual(state) && isComp1Enabled(state),
                        },
                    },
                ],
                [
                    {
                        name: 'metric_delta_2b',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Мера дельты — Сравнение 2'),
                            description: (0, core_1.t)('Готовое значение дельты из SQL. Если не задано — дельта = факт − план.'),
                            validators: [],
                            visibility: (state) => isDual(state) && isComp2Enabled(state),
                        },
                    },
                ],
            ],
        },
        // ── Section 4: Card Display ──
        {
            label: (0, core_1.t)('Отображение карточки'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'header_text',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Заголовок карточки'),
                            description: (0, core_1.t)('По умолчанию — название метрики'),
                            default: '',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'mode_count',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Режимы отображения'),
                            description: (0, core_1.t)('Single = one view, no toggle. Dual = two views with toggle buttons.'),
                            default: 'dual',
                            choices: [
                                ['single', (0, core_1.t)('Один режим')],
                                ['dual', (0, core_1.t)('Два режима (переключатель А / Б)')],
                            ],
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'auto_format_russian',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Русский формат чисел'),
                            description: (0, core_1.t)('Auto-format with тыс/млн/млрд, space separator, comma decimal'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── Section 5: Mode A Settings ──
        {
            label: (0, core_1.t)('Настройки режима А'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'toggle_label_a',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название кнопки переключения'),
                            default: '₽',
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'subtitle_a',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Подзаголовок'),
                            default: '₽ за период',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'number_format_a',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Формат числа'),
                            default: 'RU_SMART',
                            choices: NUMBER_FORMAT_OPTIONS,
                            freeForm: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'suffix_main_a',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Суффикс основного числа'),
                            default: '',
                            placeholder: '₽, %, шт.',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_main_a',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Знаков после запятой'),
                            default: '',
                            placeholder: (0, core_1.t)('Авто'),
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'suffix_comp1_a',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Суффикс — Сравнение 1'),
                            default: '',
                            renderTrigger: true,
                            visibility: isComp1Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_comp1_a',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Знаков — Сравнение 1'),
                            default: '',
                            placeholder: (0, core_1.t)('Авто'),
                            renderTrigger: true,
                            visibility: isComp1Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'suffix_comp2_a',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Суффикс — Сравнение 2'),
                            default: '',
                            renderTrigger: true,
                            visibility: isComp2Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_comp2_a',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Знаков — Сравнение 2'),
                            default: '',
                            placeholder: (0, core_1.t)('Авто'),
                            renderTrigger: true,
                            visibility: isComp2Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'suffix_delta1_a',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Суффикс дельты 1'),
                            default: '',
                            renderTrigger: true,
                            visibility: isComp1Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_delta1_a',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Знаков — Дельта 1'),
                            default: '',
                            placeholder: (0, core_1.t)('Авто'),
                            renderTrigger: true,
                            visibility: isComp1Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'suffix_delta2_a',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Суффикс дельты 2'),
                            default: '',
                            renderTrigger: true,
                            visibility: isComp2Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_delta2_a',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Знаков — Дельта 2'),
                            default: '',
                            placeholder: (0, core_1.t)('Авто'),
                            renderTrigger: true,
                            visibility: isComp2Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'color_scheme_1a',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Цветовая логика — Сравнение 1'),
                            default: 'green_up',
                            choices: COLOR_SCHEME_CHOICES,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'color_scheme_2a',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Цветовая логика — Сравнение 2'),
                            default: 'green_up',
                            choices: COLOR_SCHEME_CHOICES,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── Section 6: Mode B Settings (visible only in dual mode) ──
        {
            label: (0, core_1.t)('Настройки режима Б'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'toggle_label_b',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название кнопки переключения'),
                            default: '%',
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'subtitle_b',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Подзаголовок'),
                            default: '',
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'number_format_b',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Формат числа'),
                            default: 'RU_SMART',
                            choices: NUMBER_FORMAT_OPTIONS,
                            freeForm: true,
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'suffix_main_b',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Суффикс основного числа'),
                            default: '',
                            placeholder: '₽, %, шт.',
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_main_b',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Знаков после запятой'),
                            default: '',
                            placeholder: (0, core_1.t)('Авто'),
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'suffix_comp1_b',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Суффикс — Сравнение 1'),
                            default: '',
                            renderTrigger: true,
                            visibility: (state) => isDual(state) && isComp1Enabled(state),
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_comp1_b',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Знаков — Сравнение 1'),
                            default: '',
                            placeholder: (0, core_1.t)('Авто'),
                            renderTrigger: true,
                            visibility: (state) => isDual(state) && isComp1Enabled(state),
                        },
                    },
                ],
                [
                    {
                        name: 'suffix_comp2_b',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Суффикс — Сравнение 2'),
                            default: '',
                            renderTrigger: true,
                            visibility: (state) => isDual(state) && isComp2Enabled(state),
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_comp2_b',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Знаков — Сравнение 2'),
                            default: '',
                            placeholder: (0, core_1.t)('Авто'),
                            renderTrigger: true,
                            visibility: (state) => isDual(state) && isComp2Enabled(state),
                        },
                    },
                ],
                [
                    {
                        name: 'suffix_delta1_b',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Суффикс дельты 1'),
                            default: '',
                            renderTrigger: true,
                            visibility: (state) => isDual(state) && isComp1Enabled(state),
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_delta1_b',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Знаков — Дельта 1'),
                            default: '',
                            placeholder: (0, core_1.t)('Авто'),
                            renderTrigger: true,
                            visibility: (state) => isDual(state) && isComp1Enabled(state),
                        },
                    },
                ],
                [
                    {
                        name: 'suffix_delta2_b',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Суффикс дельты 2'),
                            default: '',
                            renderTrigger: true,
                            visibility: (state) => isDual(state) && isComp2Enabled(state),
                        },
                    },
                ],
                [
                    {
                        name: 'decimals_delta2_b',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Знаков — Дельта 2'),
                            default: '',
                            placeholder: (0, core_1.t)('Авто'),
                            renderTrigger: true,
                            visibility: (state) => isDual(state) && isComp2Enabled(state),
                        },
                    },
                ],
                [
                    {
                        name: 'color_scheme_1b',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Цветовая логика — Сравнение 1'),
                            default: 'green_up',
                            choices: COLOR_SCHEME_CHOICES,
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
                [
                    {
                        name: 'color_scheme_2b',
                        config: {
                            type: 'SelectControl',
                            label: (0, core_1.t)('Цветовая логика — Сравнение 2'),
                            default: 'green_up',
                            choices: COLOR_SCHEME_CHOICES,
                            renderTrigger: true,
                            visibility: isDual,
                        },
                    },
                ],
            ],
        },
        // ── Section 7: Comparisons ──
        {
            label: (0, core_1.t)('Сравнения'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'enable_comp1',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Показывать сравнение 1'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'comp1_label',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название сравнения 1'),
                            default: 'ПЛАН:',
                            renderTrigger: true,
                            visibility: isComp1Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'show_delta_1',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Показывать дельту — Сравнение 1'),
                            description: (0, core_1.t)('Если выключено, строка сравнения отображается без дельты (pill)'),
                            default: true,
                            renderTrigger: true,
                            visibility: isComp1Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'enable_comp2',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Показывать сравнение 2'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'comp2_label',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название сравнения 2'),
                            default: 'ПГ:',
                            renderTrigger: true,
                            visibility: isComp2Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'show_delta_2',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Показывать дельту — Сравнение 2'),
                            description: (0, core_1.t)('Если выключено, строка сравнения отображается без дельты (pill)'),
                            default: true,
                            renderTrigger: true,
                            visibility: isComp2Enabled,
                        },
                    },
                ],
            ],
        },
        // ── Section 9: Detail / Drill-Down ──
        {
            label: (0, core_1.t)('Детализация'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'groupby_primary',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Основная группировка'),
                            description: (0, core_1.t)('Колонка основного уровня иерархии'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_secondary',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Вторичная группировка'),
                            description: (0, core_1.t)('Колонка вторичного уровня иерархии'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'hierarchy_label_primary',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название основной группы'),
                            default: 'Магазин',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'hierarchy_label_secondary',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название вторичной группы'),
                            default: 'Сегмент',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'detail_top_n',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Топ N групп'),
                            description: (0, core_1.t)('Ограничить до N групп. 0 = показать все.'),
                            default: 0,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'detail_page_size',
                        config: {
                            type: 'TextControl',
                            isInt: true,
                            label: (0, core_1.t)('Строк на странице'),
                            description: (0, core_1.t)('Количество групп верхнего уровня на одной странице. 0 = без пагинации.'),
                            default: 20,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'detail_col_fact',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название колонки Факт'),
                            default: 'Факт',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'detail_col_comp1',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название колонки Сравнение 1'),
                            default: '',
                            placeholder: (0, core_1.t)('Из названия сравнения'),
                            renderTrigger: true,
                            visibility: isComp1Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'detail_col_delta1',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название колонки Дельта 1'),
                            default: 'Дельта',
                            renderTrigger: true,
                            visibility: isComp1Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'detail_col_comp2',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название колонки Сравнение 2'),
                            default: '',
                            placeholder: (0, core_1.t)('Из названия сравнения'),
                            renderTrigger: true,
                            visibility: isComp2Enabled,
                        },
                    },
                ],
                [
                    {
                        name: 'detail_col_delta2',
                        config: {
                            type: 'TextControl',
                            label: (0, core_1.t)('Название колонки Дельта 2'),
                            default: 'Дельта',
                            renderTrigger: true,
                            visibility: isComp2Enabled,
                        },
                    },
                ],
            ],
        },
    ],
};
exports.default = config;
//# sourceMappingURL=controlPanel.js.map