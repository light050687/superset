"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnlyPositive = exports.Error = exports.Loading = exports.Empty = exports.Threshold95 = exports.Threshold50 = exports.DarkPopulated = exports.LightPopulated = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const ParetoCard_1 = __importDefault(require("./ParetoCard"));
const presets_1 = require("./mocks/presets");
/*
 * Storybook stories для Pareto Card.
 * Mock-данные взяты из прототипа ref/pareto-prototype.html.
 *
 * Запуск: npm run storybook (порт 6013 в package.json).
 */
const baseArgs = {
    width: 860,
    height: 540,
    items: presets_1.LOSSES_PRESET.items,
    headerText: presets_1.LOSSES_PRESET.headerText,
    metricLabel: presets_1.LOSSES_PRESET.metricLabel,
    metricUnit: presets_1.LOSSES_PRESET.metricUnit,
    metricGenitive: presets_1.LOSSES_PRESET.metricGenitive,
    breakdownTitle: presets_1.LOSSES_PRESET.breakdownTitle,
    defaultThreshold: 80,
    chartAriaLabel: 'Парето-диаграмма списаний по категориям',
    dataState: 'populated',
    isDarkMode: false,
    mockModeEnabled: true,
};
exports.default = {
    title: 'Plugins/ParetoCard',
    component: ParetoCard_1.default,
    argTypes: {
        width: { control: { type: 'range', min: 480, max: 1280, step: 20 } },
        height: { control: { type: 'range', min: 380, max: 800, step: 20 } },
        isDarkMode: { control: 'boolean' },
        headerText: { control: 'text' },
        metricLabel: { control: 'text' },
        metricUnit: { control: 'text' },
        metricGenitive: { control: 'text' },
        breakdownTitle: { control: 'text' },
        defaultThreshold: {
            control: { type: 'range', min: 50, max: 95, step: 5 },
        },
        chartAriaLabel: { control: 'text' },
        dataState: {
            control: 'select',
            options: ['loading', 'error', 'empty', 'partial', 'stale', 'populated'],
        },
        mockModeEnabled: { control: 'boolean' },
        // hidden
        items: { control: false },
        theme: { control: false },
    },
    parameters: {
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#F3F3F3' },
                { name: 'dark', value: '#0F1114' },
            ],
        },
    },
};
const Template = (args) => ((0, jsx_runtime_1.jsx)("div", { style: {
        padding: 32,
        background: args.isDarkMode ? '#0F1114' : '#F3F3F3',
        minHeight: '100vh',
    }, children: (0, jsx_runtime_1.jsx)(ParetoCard_1.default, { ...args, theme: {} }) }));
// ═══════════════════════════════════════
// Stories
// ═══════════════════════════════════════
exports.LightPopulated = Template.bind({});
exports.LightPopulated.args = {
    ...baseArgs,
    isDarkMode: false,
};
exports.DarkPopulated = Template.bind({});
exports.DarkPopulated.args = {
    ...baseArgs,
    isDarkMode: true,
};
exports.Threshold50 = Template.bind({});
exports.Threshold50.args = {
    ...baseArgs,
    defaultThreshold: 50,
};
exports.Threshold95 = Template.bind({});
exports.Threshold95.args = {
    ...baseArgs,
    defaultThreshold: 95,
};
exports.Empty = Template.bind({});
exports.Empty.args = {
    ...baseArgs,
    items: [],
    dataState: 'empty',
};
exports.Loading = Template.bind({});
exports.Loading.args = {
    ...baseArgs,
    dataState: 'loading',
};
exports.Error = Template.bind({});
exports.Error.args = {
    ...baseArgs,
    dataState: 'error',
};
exports.OnlyPositive = Template.bind({});
exports.OnlyPositive.args = {
    ...baseArgs,
    // Убираем valuePrev — проверяем, что hasPrevData=false и chip «Пред.период» скрыт
    items: presets_1.LOSSES_PRESET.items.map(i => ({ ...i, valuePrev: null, revenueRub: null })),
};
//# sourceMappingURL=ParetoCard.stories.js.map