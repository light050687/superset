"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoSubcategories = exports.Partial = exports.ErrorState = exports.Loading = exports.Empty = exports.Light = exports.Dark = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const StructureDonut_1 = __importDefault(require("./StructureDonut"));
const themeTokens_1 = require("./themeTokens");
const presets_1 = require("./mocks/presets");
const meta = {
    title: 'Plugins/StructureDonut',
    component: StructureDonut_1.default,
    parameters: {
        layout: 'centered',
    },
    argTypes: {
        width: { control: { type: 'number' } },
        height: { control: { type: 'number' } },
        padAngle: { control: { type: 'range', min: 0, max: 4, step: 0.5 } },
        borderRadius: { control: { type: 'range', min: 0, max: 6, step: 1 } },
        showOuterLabelsPct: { control: 'boolean' },
        isDarkMode: { control: 'boolean' },
    },
    decorators: [
        (Story) => ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("link", { href: "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap", rel: "stylesheet" }), (0, jsx_runtime_1.jsx)(Story, {})] })),
    ],
};
exports.default = meta;
function buildArgs(isDark) {
    const tokens = isDark ? themeTokens_1.DARK_TOKENS : themeTokens_1.LIGHT_TOKENS;
    const { categories, totalRevenue } = (0, presets_1.getStructurePreset)('losses', undefined, tokens);
    return {
        width: 720,
        height: 520,
        headerText: 'Структура потерь',
        subtitleText: 'за год',
        dataState: 'populated',
        categories,
        hasSubcategories: true,
        totalRevenue,
        padAngle: 1.5,
        borderRadius: 2,
        showOuterLabelsPct: true,
        isDarkMode: isDark,
        theme: {},
        mockModeEnabled: true,
    };
}
exports.Dark = {
    args: buildArgs(true),
    decorators: [
        (Story) => ((0, jsx_runtime_1.jsx)("div", { style: { background: themeTokens_1.DARK_TOKENS.bg, padding: 32 }, children: (0, jsx_runtime_1.jsx)(Story, {}) })),
    ],
};
exports.Light = {
    args: buildArgs(false),
    decorators: [
        (Story) => ((0, jsx_runtime_1.jsx)("div", { style: { background: themeTokens_1.LIGHT_TOKENS.bg, padding: 32 }, children: (0, jsx_runtime_1.jsx)(Story, {}) })),
    ],
};
exports.Empty = {
    args: {
        ...buildArgs(false),
        dataState: 'empty',
        categories: [],
        hasSubcategories: false,
        totalRevenue: null,
    },
    decorators: [
        (Story) => ((0, jsx_runtime_1.jsx)("div", { style: { background: themeTokens_1.LIGHT_TOKENS.bg, padding: 32 }, children: (0, jsx_runtime_1.jsx)(Story, {}) })),
    ],
};
exports.Loading = {
    args: {
        ...buildArgs(false),
        dataState: 'loading',
        categories: [],
    },
    decorators: [
        (Story) => ((0, jsx_runtime_1.jsx)("div", { style: { background: themeTokens_1.LIGHT_TOKENS.bg, padding: 32 }, children: (0, jsx_runtime_1.jsx)(Story, {}) })),
    ],
};
exports.ErrorState = {
    args: {
        ...buildArgs(false),
        dataState: 'error',
        errorMessage: 'Превышен лимит ожидания запроса',
        categories: [],
    },
    decorators: [
        (Story) => ((0, jsx_runtime_1.jsx)("div", { style: { background: themeTokens_1.LIGHT_TOKENS.bg, padding: 32 }, children: (0, jsx_runtime_1.jsx)(Story, {}) })),
    ],
};
exports.Partial = {
    args: {
        ...buildArgs(false),
        dataState: 'partial',
    },
    decorators: [
        (Story) => ((0, jsx_runtime_1.jsx)("div", { style: { background: themeTokens_1.LIGHT_TOKENS.bg, padding: 32 }, children: (0, jsx_runtime_1.jsx)(Story, {}) })),
    ],
};
exports.NoSubcategories = {
    args: {
        ...buildArgs(false),
        hasSubcategories: false,
        categories: buildArgs(false).categories.map((c) => ({ ...c, children: [] })),
    },
    decorators: [
        (Story) => ((0, jsx_runtime_1.jsx)("div", { style: { background: themeTokens_1.LIGHT_TOKENS.bg, padding: 32 }, children: (0, jsx_runtime_1.jsx)(Story, {}) })),
    ],
};
//# sourceMappingURL=StructureDonut.stories.js.map