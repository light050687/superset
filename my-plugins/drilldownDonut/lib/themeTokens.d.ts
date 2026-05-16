/**
 * Design System v2.0 — токены плагина structure-donut.
 *
 * Значения сверены с `ref/structure-donut-prototype.html` (строки 11–25) и
 * соответствуют базовым токенам из kpiCard. В дополнение к базовому набору
 * шкала акцентов расширена четырьмя цветами: cViolet, cTangerine, cFuchsia,
 * cAmber — они нужны для палитры категорий donut'а.
 *
 * Дубликат вместо cross-plugin импорта — осознанный выбор: каждый плагин
 * самодостаточен, `file:` протокол плохо разрешает cross-file зависимости.
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
    readonly cFuchsia: "#d946a8";
    readonly cAmber: "#ca8a04";
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
    readonly cTangerine: "#f09a62";
    readonly cFuchsia: "#e870c0";
    readonly cAmber: "#fbbf24";
};
/** Шрифты DS 2.0 */
export declare const FONTS: {
    readonly text: "'Manrope', system-ui, sans-serif";
    readonly mono: "'JetBrains Mono', monospace";
};
/** Тип одного набора токенов (для узкого аргумента utils). Use a widened
 *  shape so either LIGHT_TOKENS or DARK_TOKENS can be assigned — the
 *  `as const` literal types on the individual palettes aren't compatible
 *  with each other. */
export type Tokens = {
    readonly [K in keyof typeof LIGHT_TOKENS]: string;
};
//# sourceMappingURL=themeTokens.d.ts.map