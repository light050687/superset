"use strict";
/**
 * Design System v2.0 tokens — light и dark версии.
 *
 * Значения взяты из прототипа ref/pareto-prototype.html (строки 11-27).
 * Дополнительно к kpiCard/themeTokens.ts добавлены акценты
 * cViolet/cTangerine/cFuchsia/cAmber — они используются в DS 2.0 для
 * раскраски «Разложения причин» в drill-модалке.
 *
 * Экспортируется helper getActiveTokens(isDark) — для buildOption.ts,
 * которому нужны именно hex-строки, т.к. ECharts canvas не резолвит
 * CSS-переменные.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DARK_TOKENS = exports.LIGHT_TOKENS = void 0;
exports.getActiveTokens = getActiveTokens;
exports.breakdownColor = breakdownColor;
const FONT_SANS = "'Manrope', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";
exports.LIGHT_TOKENS = {
    bg: '#F3F3F3',
    s: '#FFFFFF',
    ink: '#0A0A0A',
    g50: '#F7F7F7',
    g100: '#EBEBEB',
    g200: '#DCDCDC',
    g300: '#C0C0C0',
    g400: '#999999',
    g500: '#737373',
    g600: '#555555',
    g700: '#2E2E2E',
    up: '#16A34A',
    dn: '#DC2626',
    wn: '#CCB604',
    cSky: '#3B8BD9',
    cViolet: '#8B5CF6',
    cTangerine: '#E87C3E',
    cFuchsia: '#D946A8',
    cAmber: '#CA8A04',
    onAccent: '#FFFFFF',
    fontSans: FONT_SANS,
    fontMono: FONT_MONO,
};
exports.DARK_TOKENS = {
    bg: '#0F1114',
    s: '#171A1E',
    ink: '#E6E9EF',
    g50: '#131619',
    g100: '#1B1E22',
    g200: '#272B30',
    g300: '#363B42',
    g400: '#555C65',
    g500: '#7B8390',
    g600: '#9BA3AE',
    g700: '#C4CAD2',
    up: '#34D399',
    dn: '#F87171',
    wn: '#F8F571',
    cSky: '#5CAAF0',
    cViolet: '#A78BFA',
    cTangerine: '#F09A62',
    cFuchsia: '#E870C0',
    cAmber: '#FBBF24',
    onAccent: '#FFFFFF',
    fontSans: FONT_SANS,
    fontMono: FONT_MONO,
};
function getActiveTokens(isDark) {
    return isDark ? exports.DARK_TOKENS : exports.LIGHT_TOKENS;
}
/** Палитра акцентов для «Разложения причин» — циклически по индексу. */
function breakdownColor(index, tokens) {
    const palette = [
        tokens.cSky,
        tokens.cViolet,
        tokens.cTangerine,
        tokens.cFuchsia,
        tokens.cAmber,
    ];
    return palette[index % palette.length];
}
//# sourceMappingURL=tokens.js.map