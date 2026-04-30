"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmallHeight = exports.SmallWidth = exports.MoreIsBetter = exports.SortByDeltaPlan = exports.FilterBadActive = exports.Error = exports.Loading = exports.Empty = exports.SingleRow = exports.Negative = exports.LongNames = exports.ManyRows = exports.Categories = exports.DarkMode = exports.Populated = void 0;
const BulletChart_1 = __importDefault(require("./BulletChart"));
const presets_1 = require("./mocks/presets");
const aggregation_1 = require("./utils/aggregation");
const format_1 = require("./utils/format");
const meta = {
    title: 'BulletChart',
    component: BulletChart_1.default,
    parameters: { layout: 'padded' },
};
exports.default = meta;
function makeProps(overrides = {}, presetName = 'formats', direction = 'less_is_better') {
    const preset = (0, presets_1.getPreset)(presetName, undefined, direction, 5);
    const scaleMax = (0, aggregation_1.computeScaleMax)(preset.rows);
    const formatters = (0, format_1.makeFormatters)({
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
exports.Populated = { args: makeProps() };
exports.DarkMode = { args: makeProps({ isDarkMode: true }) };
exports.Categories = { args: makeProps({}, 'categories') };
exports.ManyRows = { args: makeProps({}, 'many_rows') };
exports.LongNames = { args: makeProps({}, 'long_names') };
exports.Negative = { args: makeProps({}, 'negative') };
exports.SingleRow = { args: makeProps({}, 'single_row') };
exports.Empty = {
    args: { ...makeProps({}, 'empty'), dataState: 'empty' },
};
exports.Loading = {
    args: { ...makeProps(), dataState: 'loading' },
};
exports.Error = {
    args: { ...makeProps(), dataState: 'error' },
};
exports.FilterBadActive = {
    args: makeProps({ filterWorseThanPlanDefault: true }),
};
exports.SortByDeltaPlan = {
    args: makeProps({ defaultSort: 'deltaPlanDesc' }),
};
exports.MoreIsBetter = {
    args: makeProps({
        headerText: 'Выполнение плана продаж',
        subheaderText: 'Чем больше — тем лучше',
    }, 'categories', 'more_is_better'),
};
exports.SmallWidth = {
    args: makeProps({ width: 420, height: 560 }),
};
exports.SmallHeight = {
    args: makeProps({ width: 900, height: 320 }),
};
//# sourceMappingURL=BulletChart.stories.js.map