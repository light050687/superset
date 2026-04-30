/**
 * Design System v2.0 — single source of truth for color tokens.
 *
 * Values come directly from the `writeoffs-timeseries-prototype.html` mockup
 * (:root for light, [data-theme="dark"] overrides).
 *
 * Used by styles.ts (CSS custom properties) and chart/buildOption.ts (inline).
 */
export const LIGHT_TOKENS = {
    // Foundation
    bg: '#f3f3f3',
    s: '#ffffff',
    ink: '#0a0a0a',
    // Grayscale (g400 запрещён для текста <18px)
    g50: '#f7f7f7',
    g100: '#ebebeb',
    g200: '#dcdcdc',
    g300: '#c0c0c0',
    g400: '#999999',
    g500: '#737373',
    g600: '#555555',
    g700: '#2e2e2e',
    // Semantic
    up: '#16a34a',
    dn: '#dc2626',
    wn: '#ccb604',
    upBg: 'rgba(22, 163, 74, 0.07)',
    dnBg: 'rgba(220, 38, 38, 0.07)',
    wnBg: 'rgba(204, 182, 4, 0.07)',
    // Chart accents (5 + grey for "other")
    cSky: '#3b8bd9',
    cViolet: '#8b5cf6',
    cTangerine: '#e87c3e',
    cFuchsia: '#d946a8',
    cAmber: '#ca8a04',
    cSkyBg: 'rgba(59, 139, 217, 0.08)',
    cVioletBg: 'rgba(139, 92, 246, 0.08)',
    cTangerineBg: 'rgba(232, 124, 62, 0.15)',
    cFuchsiaBg: 'rgba(217, 70, 168, 0.1)',
    cAmberBg: 'rgba(202, 138, 4, 0.1)',
};
export const DARK_TOKENS = {
    // Foundation
    bg: '#0f1114',
    s: '#171a1e',
    ink: '#e6e9ef',
    // Grayscale
    g50: '#131619',
    g100: '#1b1e22',
    g200: '#272b30',
    g300: '#363b42',
    g400: '#555c65',
    g500: '#7b8390',
    g600: '#9ba3ae',
    g700: '#c4cad2',
    // Semantic
    up: '#34d399',
    dn: '#f87171',
    wn: '#f8f571',
    upBg: 'rgba(52, 211, 153, 0.1)',
    dnBg: 'rgba(248, 113, 113, 0.1)',
    wnBg: 'rgba(248, 245, 113, 0.1)',
    // Chart accents
    cSky: '#5caaf0',
    cViolet: '#a78bfa',
    cTangerine: '#f09a62',
    cFuchsia: '#e870c0',
    cAmber: '#fbbf24',
    cSkyBg: 'rgba(92, 170, 240, 0.1)',
    cVioletBg: 'rgba(167, 139, 250, 0.1)',
    cTangerineBg: 'rgba(240, 154, 98, 0.18)',
    cFuchsiaBg: 'rgba(232, 112, 192, 0.1)',
    cAmberBg: 'rgba(251, 191, 36, 0.1)',
};
/** Font stacks from design system */
export const FONTS = {
    text: "'Manrope', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
};
//# sourceMappingURL=themeTokens.js.map