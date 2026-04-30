import { jsx as _jsx } from "react/jsx-runtime";
import ParetoCard from './ParetoCard';
import { LOSSES_PRESET } from './mocks/presets';
/*
 * Storybook stories для Pareto Card.
 * Mock-данные взяты из прототипа ref/pareto-prototype.html.
 *
 * Запуск: npm run storybook (порт 6013 в package.json).
 */
const baseArgs = {
    width: 860,
    height: 540,
    items: LOSSES_PRESET.items,
    headerText: LOSSES_PRESET.headerText,
    metricLabel: LOSSES_PRESET.metricLabel,
    metricUnit: LOSSES_PRESET.metricUnit,
    metricGenitive: LOSSES_PRESET.metricGenitive,
    breakdownTitle: LOSSES_PRESET.breakdownTitle,
    defaultThreshold: 80,
    chartAriaLabel: 'Парето-диаграмма списаний по категориям',
    dataState: 'populated',
    isDarkMode: false,
    mockModeEnabled: true,
};
export default {
    title: 'Plugins/ParetoCard',
    component: ParetoCard,
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
const Template = (args) => (_jsx("div", { style: {
        padding: 32,
        background: args.isDarkMode ? '#0F1114' : '#F3F3F3',
        minHeight: '100vh',
    }, children: _jsx(ParetoCard, { ...args, theme: {} }) }));
// ═══════════════════════════════════════
// Stories
// ═══════════════════════════════════════
export const LightPopulated = Template.bind({});
LightPopulated.args = {
    ...baseArgs,
    isDarkMode: false,
};
export const DarkPopulated = Template.bind({});
DarkPopulated.args = {
    ...baseArgs,
    isDarkMode: true,
};
export const Threshold50 = Template.bind({});
Threshold50.args = {
    ...baseArgs,
    defaultThreshold: 50,
};
export const Threshold95 = Template.bind({});
Threshold95.args = {
    ...baseArgs,
    defaultThreshold: 95,
};
export const Empty = Template.bind({});
Empty.args = {
    ...baseArgs,
    items: [],
    dataState: 'empty',
};
export const Loading = Template.bind({});
Loading.args = {
    ...baseArgs,
    dataState: 'loading',
};
export const Error = Template.bind({});
Error.args = {
    ...baseArgs,
    dataState: 'error',
};
export const OnlyPositive = Template.bind({});
OnlyPositive.args = {
    ...baseArgs,
    // Убираем valuePrev — проверяем, что hasPrevData=false и chip «Пред.период» скрыт
    items: LOSSES_PRESET.items.map(i => ({ ...i, valuePrev: null, revenueRub: null })),
};
//# sourceMappingURL=ParetoCard.stories.js.map