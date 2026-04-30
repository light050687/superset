/**
 * Design System v2.0 — расширенный набор цветовых токенов для scatter-plot.
 * К базовым g50-g700 / up/dn/wn добавлены акценты (sky/violet/tangerine/fuchsia/amber/cyan),
 * которые используются для цветов форматов магазинов и семантики квадрантов.
 */
export interface ThemeTokens {
    bg: string;
    s: string;
    ink: string;
    g50: string;
    g100: string;
    g200: string;
    g300: string;
    g400: string;
    g500: string;
    g600: string;
    g700: string;
    up: string;
    dn: string;
    wn: string;
    upBg: string;
    dnBg: string;
    wnBg: string;
    cSky: string;
    cViolet: string;
    cTangerine: string;
    cFuchsia: string;
    cAmber: string;
    cCyan: string;
    onAccent: string;
    sh: string;
    selectionTint: string;
    modalScrim: string;
    modalShadow: string;
    tooltipShadow: string;
    ddShadow: string;
    annotBg: string;
}
export declare const LIGHT_TOKENS: ThemeTokens;
export declare const DARK_TOKENS: ThemeTokens;
export declare const FONTS: {
    readonly text: "'Manrope', system-ui, sans-serif";
    readonly mono: "'JetBrains Mono', ui-monospace, monospace";
};
/** Палитра цветов форматов по умолчанию — по порядку акцентов DS 2.0 */
export declare const DEFAULT_FORMAT_PALETTE: readonly ["cSky", "cTangerine", "cFuchsia", "cAmber", "cViolet", "cCyan"];
export type FormatColorKey = (typeof DEFAULT_FORMAT_PALETTE)[number];
//# sourceMappingURL=themeTokens.d.ts.map