"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chart_controls_1 = require("@superset-ui/chart-controls");
const core_1 = require("@superset-ui/core");
const CategoryColorMapControl_1 = __importDefault(require("../controls/CategoryColorMapControl"));
const isMockEnabled = ({ controls }) => controls?.mock_mode_enabled?.value === true;
const isMockCustom = ({ controls }) => isMockEnabled({ controls }) && controls?.mock_preset?.value === 'custom';
// ═══════════════════════════════════════
// Control panel config
// ═══════════════════════════════════════
const config = {
    controlPanelSections: [
        // ── 1. Time ──
        chart_controls_1.sections.legacyTimeseriesTime,
        // ── 2. Режим проектирования ──
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
                            description: (0, core_1.t)('Показывает тестовые данные из прототипа для согласования дизайна. ' +
                                'Выключите, когда реальные данные будут готовы.'),
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
                            label: (0, core_1.t)('Пресет данных'),
                            default: 'losses',
                            choices: [
                                ['losses', (0, core_1.t)('Потери (прототип)')],
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
                            description: (0, core_1.t)('Формат: {"totalRevenue": 88500, "categories": [{"id":"...", ' +
                                '"name":"...", "accent":"cSky", "rub":100, "count":10, ' +
                                '"children":[{"id":"...", "name":"...", "rub":50, "count":5}]}]}'),
                            default: '{}',
                            language: 'json',
                            renderTrigger: true,
                            visibility: isMockCustom,
                        },
                    },
                ],
            ],
        },
        // ── 3. Данные ──
        {
            label: (0, core_1.t)('Данные'),
            expanded: true,
            controlSetRows: [
                ['adhoc_filters'],
                [
                    {
                        name: 'groupby_category',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Категория'),
                            description: (0, core_1.t)('Колонка верхнего уровня иерархии (обязательна)'),
                            multi: false,
                            validators: [core_1.validateNonEmpty],
                        },
                    },
                ],
                [
                    {
                        name: 'groupby_subcategory',
                        config: {
                            ...chart_controls_1.sharedControls.groupby,
                            label: (0, core_1.t)('Подкатегория'),
                            description: (0, core_1.t)('Колонка второго уровня. Если задана — включается drill-down. ' +
                                'NULL-значения собираются в «Без подкатегории».'),
                            multi: false,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'value_metric',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Сумма (₽)'),
                            description: (0, core_1.t)('Основное значение сегмента — сумма потерь в рублях'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'count_metric',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Количество операций'),
                            description: (0, core_1.t)('Опционально — показывается в тултипе («Операций»)'),
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'revenue_metric',
                        config: {
                            ...chart_controls_1.sharedControls.metric,
                            label: (0, core_1.t)('Оборот (знаменатель %)'),
                            description: (0, core_1.t)('Опционально. Метрика, чья сумма по всем строкам используется ' +
                                'как 100% в режиме %. Если не задана — используется сумма видимых сегментов.'),
                            validators: [],
                        },
                    },
                ],
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
                            description: (0, core_1.t)('По умолчанию — «Структура потерь»'),
                            default: 'Структура потерь',
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
                            description: (0, core_1.t)('Показывается в breadcrumb в режиме «Все категории»'),
                            default: 'за год',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_outer_labels_pct',
                        config: {
                            type: 'CheckboxControl',
                            label: (0, core_1.t)('Подписи на сегментах в режиме %'),
                            description: (0, core_1.t)('Показывать процент от оборота на внешней стороне сегмента'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'pad_angle',
                        config: {
                            type: 'SliderControl',
                            label: (0, core_1.t)('Зазор между сегментами'),
                            description: (0, core_1.t)('Угловой зазор между слайсами, градусы'),
                            min: 0,
                            max: 4,
                            step: 0.5,
                            default: 1.5,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'border_radius',
                        config: {
                            type: 'SliderControl',
                            label: (0, core_1.t)('Скругление сегментов'),
                            min: 0,
                            max: 6,
                            step: 1,
                            default: 2,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'rub_decimals',
                        config: {
                            type: 'SliderControl',
                            label: (0, core_1.t)('Знаков после запятой'),
                            description: (0, core_1.t)('Сколько цифр показывать после запятой в hero-числе ' +
                                '(₽). Примеры: 0 → "8 млрд ₽", 1 → "8,2 млрд ₽", ' +
                                '2 → "8,23 млрд ₽", 3 → "8,230 млрд ₽".'),
                            min: 0,
                            max: 3,
                            step: 1,
                            default: 2,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        // ── 5. Цвета категорий ──
        {
            label: (0, core_1.t)('Цвета категорий'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'color_map',
                        config: {
                            type: CategoryColorMapControl_1.default,
                            label: (0, core_1.t)('Соответствие «Категория → цвет»'),
                            description: (0, core_1.t)('Для категорий без явного маппинга применяется автопалитра: ' +
                                'cSky → cViolet → cTangerine → cFuchsia → cAmber.'),
                            default: [],
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