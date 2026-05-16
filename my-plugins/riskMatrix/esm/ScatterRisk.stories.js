import { jsx as _jsx } from "react/jsx-runtime";
import ScatterRisk from './ScatterRisk';
import { getMockPreset } from './mocks/presets';
import { LIGHT_TOKENS, DARK_TOKENS, DEFAULT_FORMAT_PALETTE } from './themeTokens';
/* =========================================================
 * Helpers для конфигурации story
 * ========================================================= */
const makeFormatMeta = (stores, tokens) => {
    const map = new Map();
    stores.forEach((s) => {
        if (map.has(s.format))
            return;
        const paletteKey = DEFAULT_FORMAT_PALETTE[map.size % DEFAULT_FORMAT_PALETTE.length];
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
    const tokens = isDarkMode ? DARK_TOKENS : LIGHT_TOKENS;
    const preset = getMockPreset('retail');
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
    component: ScatterRisk,
    parameters: { layout: 'fullscreen' },
};
export default meta;
export const Dark = {
    render: () => (_jsx("div", { style: { padding: 24, background: DARK_TOKENS.bg, minHeight: '100vh' }, children: _jsx(ScatterRisk, { ...makeProps(true) }) })),
};
export const Light = {
    render: () => (_jsx("div", { style: { padding: 24, background: LIGHT_TOKENS.bg, minHeight: '100vh' }, children: _jsx(ScatterRisk, { ...makeProps(false) }) })),
};
export const Empty = {
    render: () => (_jsx("div", { style: { padding: 24, background: DARK_TOKENS.bg, minHeight: '100vh' }, children: _jsx(ScatterRisk, { ...makeProps(true, {
                stores: [],
                formats: [],
                hasThresholds: false,
            }) }) })),
};
export const WithoutThresholds = {
    render: () => (_jsx("div", { style: { padding: 24, background: DARK_TOKENS.bg, minHeight: '100vh' }, children: _jsx(ScatterRisk, { ...makeProps(true, {
                hasThresholds: false,
                enableQuadrantAnnotations: false,
            }) }) })),
};
export const SmallViewport = {
    render: () => (_jsx("div", { style: {
            padding: 12,
            background: DARK_TOKENS.bg,
            minHeight: '100vh',
            maxWidth: 640,
        }, children: _jsx(ScatterRisk, { ...makeProps(true, { width: 600, height: 420 }) }) })),
};
//# sourceMappingURL=ScatterRisk.stories.js.map