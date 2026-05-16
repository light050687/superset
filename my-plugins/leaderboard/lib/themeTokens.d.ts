/**
 * Design System v2.0 — цветовые и типографические токены для плагина
 * "Рейтинг магазинов". Соответствуют прототипу ref/ranked-stores-prototype.html.
 *
 * Токены оборачиваются в CSS custom properties (см. toCssVars) и
 * навешиваются на root styled-div плагина через style prop. Все
 * styled-компоненты внутри читают их через var(--…), тем самым
 * обеспечивая единый источник истины и поддержку live-смены темы.
 */
export interface DsTokens {
    bg: string;
    surface: string;
    ink: string;
    onAccent: string;
    shadow: string;
    g50: string;
    g100: string;
    g200: string;
    g300: string;
    g400: string;
    g500: string;
    g600: string;
    g700: string;
    sky: string;
    violet: string;
    tangerine: string;
    fuchsia: string;
    amber: string;
    up: string;
    dn: string;
    wn: string;
    fontFace: string;
    fontMono: string;
    ease: string;
}
export declare const LIGHT_TOKENS: DsTokens;
export declare const DARK_TOKENS: DsTokens;
/** Преобразует токены в объект CSS custom properties. */
export declare function toCssVars(tokens: DsTokens): Record<string, string>;
/** hex → rgba string с заданной непрозрачностью. */
export declare function hexToRgba(hex: string, alpha: number): string;
//# sourceMappingURL=themeTokens.d.ts.map