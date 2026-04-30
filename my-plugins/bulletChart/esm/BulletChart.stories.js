import BulletChart from './BulletChart';
import { getPreset } from './mocks/presets';
import { computeScaleMax } from './utils/aggregation';
import { makeFormatters } from './utils/format';
const meta = {
    title: 'BulletChart',
    component: BulletChart,
    parameters: { layout: 'padded' },
};
export default meta;
function makeProps(overrides = {}, presetName = 'formats', direction = 'less_is_better') {
    const preset = getPreset(presetName, undefined, direction, 5);
    const scaleMax = computeScaleMax(preset.rows);
    const formatters = makeFormatters({
        decimals: 2,
        suffix: '%',
        unitLabel: 'п.п.',
        autoRussian: true,
    });
    return {
        width: 1000,
        height: 560,
        dataState: preset.rows.length ? 'populated' : 'empty',
        headerText: preset.title || 'Bullet Chart',
        subheaderText: 'Факт vs план vs ПГ · Март 2026',
        rows: preset.rows,
        scaleMax,
        direction,
        defaultSort: 'factDesc',
        filterWorseThanPlanDefault: false,
        enableCrossFilter: true,
        enableDetailModal: true,
        formatters,
        valueSuffix: '%',
        valueUnitLabel: 'п.п.',
        isDarkMode: false,
        theme: {},
        detailQueryParams: undefined,
        mockModeEnabled: true,
        ...overrides,
    };
}
export const Populated = { args: makeProps() };
export const DarkMode = { args: makeProps({ isDarkMode: true }) };
export const Categories = { args: makeProps({}, 'categories') };
export const ManyRows = { args: makeProps({}, 'many_rows') };
export const LongNames = { args: makeProps({}, 'long_names') };
export const Negative = { args: makeProps({}, 'negative') };
export const SingleRow = { args: makeProps({}, 'single_row') };
export const Empty = {
    args: { ...makeProps({}, 'empty'), dataState: 'empty' },
};
export const Loading = {
    args: { ...makeProps(), dataState: 'loading' },
};
export const Error = {
    args: { ...makeProps(), dataState: 'error' },
};
export const FilterBadActive = {
    args: makeProps({ filterWorseThanPlanDefault: true }),
};
export const SortByDeltaPlan = {
    args: makeProps({ defaultSort: 'deltaPlanDesc' }),
};
export const MoreIsBetter = {
    args: makeProps({
        headerText: 'Выполнение плана продаж',
        subheaderText: 'Чем больше — тем лучше',
    }, 'categories', 'more_is_better'),
};
export const SmallWidth = {
    args: makeProps({ width: 420, height: 560 }),
};
export const SmallHeight = {
    args: makeProps({ width: 900, height: 320 }),
};
//# sourceMappingURL=BulletChart.stories.js.map