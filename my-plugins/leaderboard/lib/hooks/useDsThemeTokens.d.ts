import { DsTokens } from '../themeTokens';
export interface DsThemeBundle {
    tokens: DsTokens;
    cssVars: Record<string, string>;
    isDark: boolean;
}
/**
 * Возвращает DS 2.0 токены и набор CSS custom properties для root-контейнера.
 * Светлый/тёмный режим определяется по фону Superset-темы.
 *
 * Правило CLAUDE.md: "ВСЕГДА useTheme() для цветов/шрифтов. Никогда не хардкодить".
 * Базовые цвета (bg, ink, border) мерджим из Superset theme, остальные
 * берём из наших DS 2.0 констант — они живут в themeTokens.ts единой точкой.
 */
export declare function useDsThemeTokens(): DsThemeBundle;
//# sourceMappingURL=useDsThemeTokens.d.ts.map