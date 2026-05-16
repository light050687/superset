"use strict";
/**
 * Design System v2.0 — single source of truth for color tokens.
 *
 * Used by styles.ts to populate CSS custom properties on the root container.
 * All hex values match the corporate design system specification exactly
 * and the `velocity-diverging-prototype.html` reference mockup.
 *
 * В проекте нет общего пакета токенов — файл копирует значения из
 * `my-plugins/kpiCard/src/themeTokens.ts` и дополняет их палитрой форматов
 * (c-tangerine, c-fuchsia, c-amber, c-violet), нужной для цветовой
 * маркировки форматов магазинов.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FONTS = exports.DARK_TOKENS = exports.LIGHT_TOKENS = void 0;
exports.LIGHT_TOKENS = {
    bg: '#f3f3f3',
    s: '#ffffff',
    ink: '#0a0a0a',
    g50: '#f7f7f7',
    g100: '#ebebeb',
    g200: '#dcdcdc',
    g300: '#c0c0c0',
    g400: '#999999',
    g500: '#737373',
    g600: '#555555',
    g700: '#2e2e2e',
    up: '#16a34a',
    dn: '#dc2626',
    wn: '#ccb604',
    upBg: 'rgba(22, 163, 74, 0.07)',
    dnBg: 'rgba(220, 38, 38, 0.07)',
    wnBg: 'rgba(204, 182, 4, 0.07)',
    cSky: '#3b8bd9',
    cViolet: '#8b5cf6',
    cTangerine: '#e87c3e',
    cFuchsia: '#d946a8',
    cAmber: '#ca8a04',
    onAccent: '#ffffff',
};
exports.DARK_TOKENS = {
    bg: '#0f1114',
    s: '#171a1e',
    ink: '#e6e9ef',
    g50: '#131619',
    g100: '#1b1e22',
    g200: '#272b30',
    g300: '#363b42',
    g400: '#555c65',
    g500: '#7b8390',
    g600: '#9ba3ae',
    g700: '#c4cad2',
    up: '#34d399',
    dn: '#f87171',
    wn: '#f8f571',
    upBg: 'rgba(52, 211, 153, 0.1)',
    dnBg: 'rgba(248, 113, 113, 0.1)',
    wnBg: 'rgba(248, 245, 113, 0.1)',
    cSky: '#5caaf0',
    cViolet: '#a78bfa',
    cTangerine: '#f09a62',
    cFuchsia: '#e870c0',
    cAmber: '#fbbf24',
    onAccent: '#ffffff',
};
/** Font stacks from design system */
exports.FONTS = {
    text: "'Manrope', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
};
//# sourceMappingURL=themeTokens.js.map