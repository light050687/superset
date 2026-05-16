/**
 * Design System v2.0 — single source of truth for color tokens.
 *
 * Values come directly from the `writeoffs-timeseries-prototype.html` mockup
 * (:root for light, [data-theme="dark"] overrides).
 *
 * Used by styles.ts (CSS custom properties) and chart/buildOption.ts (inline).
 */
/**
 * Shared shape of the token map (same keys in light and dark variants).
 * Used by chart helpers that need to index tokens at runtime.
 */
export interface TokenMap {
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
    cSkyBg: string;
    cVioletBg: string;
    cTangerineBg: string;
    cFuchsiaBg: string;
    cAmberBg: string;
}
export declare const LIGHT_TOKENS: TokenMap;
export declare const DARK_TOKENS: TokenMap;
/** Font stacks from design system */
export declare const FONTS: {
    readonly text: "'Manrope', system-ui, sans-serif";
    readonly mono: "'JetBrains Mono', monospace";
};
//# sourceMappingURL=themeTokens.d.ts.map