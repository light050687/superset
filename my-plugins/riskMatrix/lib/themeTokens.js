"use strict";
/**
 * Design System v2.0 — расширенный набор цветовых токенов для scatter-plot.
 * К базовым g50-g700 / up/dn/wn добавлены акценты (sky/violet/tangerine/fuchsia/amber/cyan),
 * которые используются для цветов форматов магазинов и семантики квадрантов.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FORMAT_PALETTE = exports.FONTS = exports.DARK_TOKENS = exports.LIGHT_TOKENS = void 0;
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
    cCyan: '#0891b2',
    onAccent: '#ffffff',
    sh: '0 1px 2px rgba(15, 17, 20, 0.08)',
    // Дополнительные токены, вынесенные из хардкодов
    selectionTint: 'rgba(59, 139, 217, 0.10)',
    modalScrim: 'rgba(15, 17, 20, 0.40)',
    modalShadow: '0 24px 60px rgba(15, 17, 20, 0.25)',
    tooltipShadow: '0 12px 32px rgba(15, 17, 20, 0.18)',
    ddShadow: '0 10px 28px rgba(15, 17, 20, 0.15)',
    annotBg: 'rgba(255, 255, 255, 0.85)',
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
    upBg: 'rgba(52, 211, 153, 0.10)',
    dnBg: 'rgba(248, 113, 113, 0.10)',
    wnBg: 'rgba(248, 245, 113, 0.10)',
    cSky: '#5caaf0',
    cViolet: '#a78bfa',
    cTangerine: '#f09a62',
    cFuchsia: '#e870c0',
    cAmber: '#fbbf24',
    cCyan: '#22d3ee',
    onAccent: '#ffffff',
    sh: '0 1px 2px rgba(0, 0, 0, 0.4)',
    selectionTint: 'rgba(92, 170, 240, 0.10)',
    modalScrim: 'rgba(0, 0, 0, 0.50)',
    modalShadow: '0 24px 60px rgba(0, 0, 0, 0.50)',
    tooltipShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
    ddShadow: '0 10px 28px rgba(0, 0, 0, 0.45)',
    annotBg: 'rgba(23, 26, 30, 0.78)',
};
exports.FONTS = {
    text: "'Manrope', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
};
/** Палитра цветов форматов по умолчанию — по порядку акцентов DS 2.0 */
exports.DEFAULT_FORMAT_PALETTE = [
    'cSky',
    'cTangerine',
    'cFuchsia',
    'cAmber',
    'cViolet',
    'cCyan',
];
//# sourceMappingURL=themeTokens.js.map