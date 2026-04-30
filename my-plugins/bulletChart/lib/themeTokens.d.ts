/**
 * Design System v2.0 — корпоративные токены.
 *
 * Источник правды для цветов/шрифтов. Используется в styles.ts для инъекции
 * CSS custom properties на :root и в компонентах через useTheme().
 */
export declare const LIGHT_TOKENS: {
    readonly bg: "#f3f3f3";
    readonly s: "#ffffff";
    readonly ink: "#0a0a0a";
    readonly g50: "#f7f7f7";
    readonly g100: "#ebebeb";
    readonly g200: "#dcdcdc";
    readonly g300: "#c0c0c0";
    readonly g400: "#999999";
    readonly g500: "#737373";
    readonly g600: "#555555";
    readonly g700: "#2e2e2e";
    readonly up: "#16a34a";
    readonly dn: "#dc2626";
    readonly wn: "#ccb604";
    readonly upBg: "rgba(22, 163, 74, 0.07)";
    readonly dnBg: "rgba(220, 38, 38, 0.07)";
    readonly wnBg: "rgba(204, 182, 4, 0.07)";
    readonly cSky: "#3b8bd9";
    readonly cViolet: "#8b5cf6";
    readonly cTangerine: "#e87c3e";
    readonly bandGood: "#f3f4f6";
    readonly bandWarn: "#e5e7eb";
    readonly bandBad: "#d1d5db";
};
export declare const DARK_TOKENS: {
    readonly bg: "#0f1114";
    readonly s: "#171a1e";
    readonly ink: "#e6e9ef";
    readonly g50: "#131619";
    readonly g100: "#1b1e22";
    readonly g200: "#272b30";
    readonly g300: "#363b42";
    readonly g400: "#555c65";
    readonly g500: "#7b8390";
    readonly g600: "#9ba3ae";
    readonly g700: "#c4cad2";
    readonly up: "#34d399";
    readonly dn: "#f87171";
    readonly wn: "#f8f571";
    readonly upBg: "rgba(52, 211, 153, 0.1)";
    readonly dnBg: "rgba(248, 113, 113, 0.1)";
    readonly wnBg: "rgba(248, 245, 113, 0.1)";
    readonly cSky: "#5caaf0";
    readonly cViolet: "#a78bfa";
    readonly cTangerine: "#fb923c";
    readonly bandGood: "#1b1e22";
    readonly bandWarn: "#272b30";
    readonly bandBad: "#363b42";
};
export declare const FONTS: {
    readonly text: "'Manrope', system-ui, sans-serif";
    readonly mono: "'JetBrains Mono', monospace";
};
export type ThemeTokens = typeof LIGHT_TOKENS;
//# sourceMappingURL=themeTokens.d.ts.map