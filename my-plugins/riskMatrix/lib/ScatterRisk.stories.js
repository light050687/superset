"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmallViewport = exports.WithoutThresholds = exports.Empty = exports.Light = exports.Dark = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const ScatterRisk_1 = __importDefault(require("./ScatterRisk"));
const presets_1 = require("./mocks/presets");
const themeTokens_1 = require("./themeTokens");
/* =========================================================
 * Helpers для конфигурации story
 * ========================================================= */
const makeFormatMeta = (stores, tokens) => {
    const map = new Map();
    stores.forEach((s) => {
        if (map.has(s.format))
            return;
        const paletteKey = themeTokens_1.DEFAULT_FORMAT_PALETTE[map.size % themeTokens_1.DEFAULT_FORMAT_PALETTE.length];
        const color = tokens[paletteKey];
        map.set(s.format, {
            id: s.format,
            name: s.formatName,
            color,
            count: 0,
            planX: s.planX,
            planY: s.planY,
        });
    });
    stores.forEach((s) => {
        const m = map.get(s.format);
        if (m)
            m.count += 1;
    });
    return Array.from(map.values());
};
const makeQuadrants = (tokens) => ({
    tl: { key: 'tl', label: 'НЕДОСТАЧИ', semantic: 'y', color: tokens.cSky, description: 'Только недостачи' },
    tr: { key: 'tr', label: 'КРИТИЧЕСКИ ⚠', semantic: 'dn', color: tokens.dn, description: 'Обе проблемы' },
    bl: { key: 'bl', label: 'НОРМА ✓', semantic: 'up', color: tokens.up, description: 'В норме' },
    br: { key: 'br', label: 'СПИСАНИЯ', semantic: 'x', color: tokens.cTangerine, description: 'Только списания' },
});
const EMPTY_DETAIL = {
    trendWeeks: 12,
    causesTopN: 3,
    skusTopN: 5,
    baseFilters: [],
};
const fmtPct = (decimals) => (n) => Number.isFinite(n) ? `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)}\u00A0%` : '—';
const fmtMln = (n) => Number.isFinite(n) ? `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)}\u00A0млн ₽` : '—';
const fmtCount = (n) => Number.isFinite(n) ? new Intl.NumberFormat('ru-RU').format(n) : '—';
const makeProps = (isDarkMode, overrides = {}) => {
    const tokens = isDarkMode ? themeTokens_1.DARK_TOKENS : themeTokens_1.LIGHT_TOKENS;
    const preset = (0, presets_1.getMockPreset)('retail');
    const formats = makeFormatMeta(preset.stores, tokens);
    const quadrants = makeQuadrants(tokens);
    return {
        width: 1200,
        height: 720,
        stores: preset.stores,
        formats,
        thresholdX: 1.5,
        thresholdY: 0.5,
        hasThresholds: true,
        quadrants,
        enableQuadrantAnnotations: true,
        enableWorstStar: true,
        title: 'Матрица рисков магазинов',
        subtitle: 'Списания × Недостачи',
        xLabel: 'Уровень списаний',
        yLabel: 'Уровень недостач',
        xUnit: '%',
        yUnit: '%',
        sizeUnit: 'млн ₽',
        formatX: fmtPct(2),
        formatY: fmtPct(2),
        formatSize: fmtMln,
        formatLoss: fmtMln,
        formatCount: fmtCount,
        xShort: 'Списания',
        yShort: 'Недостачи',
        isDarkMode,
        storeColumn: 'store_id',
        drillEnabled: true,
        detailQueryParams: EMPTY_DETAIL,
        shortcutsHint: 'Click — фильтр · Ctrl+Click — детализация · Drag — перемещение · Scroll — масштаб',
        ...overrides,
    };
};
/* =========================================================
 * Stories
 * ========================================================= */
const meta = {
    title: 'ScatterRisk / Матрица рисков',
    component: ScatterRisk_1.default,
    parameters: { layout: 'fullscreen' },
};
exports.default = meta;
exports.Dark = {
    render: () => ((0, jsx_runtime_1.jsx)("div", { style: { padding: 24, background: themeTokens_1.DARK_TOKENS.bg, minHeight: '100vh' }, children: (0, jsx_runtime_1.jsx)(ScatterRisk_1.default, { ...makeProps(true) }) })),
};
exports.Light = {
    render: () => ((0, jsx_runtime_1.jsx)("div", { style: { padding: 24, background: themeTokens_1.LIGHT_TOKENS.bg, minHeight: '100vh' }, children: (0, jsx_runtime_1.jsx)(ScatterRisk_1.default, { ...makeProps(false) }) })),
};
exports.Empty = {
    render: () => ((0, jsx_runtime_1.jsx)("div", { style: { padding: 24, background: themeTokens_1.DARK_TOKENS.bg, minHeight: '100vh' }, children: (0, jsx_runtime_1.jsx)(ScatterRisk_1.default, { ...makeProps(true, {
                stores: [],
                formats: [],
                hasThresholds: false,
            }) }) })),
};
exports.WithoutThresholds = {
    render: () => ((0, jsx_runtime_1.jsx)("div", { style: { padding: 24, background: themeTokens_1.DARK_TOKENS.bg, minHeight: '100vh' }, children: (0, jsx_runtime_1.jsx)(ScatterRisk_1.default, { ...makeProps(true, {
                hasThresholds: false,
                enableQuadrantAnnotations: false,
            }) }) })),
};
exports.SmallViewport = {
    render: () => ((0, jsx_runtime_1.jsx)("div", { style: {
            padding: 12,
            background: themeTokens_1.DARK_TOKENS.bg,
            minHeight: '100vh',
            maxWidth: 640,
        }, children: (0, jsx_runtime_1.jsx)(ScatterRisk_1.default, { ...makeProps(true, { width: 600, height: 420 }) }) })),
};
//# sourceMappingURL=ScatterRisk.stories.js.map