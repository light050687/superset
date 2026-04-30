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
import { ThemeTokens } from '../types';
export declare const LIGHT_TOKENS: ThemeTokens;
export declare const DARK_TOKENS: ThemeTokens;
export declare function getActiveTokens(isDark: boolean): ThemeTokens;
/** Палитра акцентов для «Разложения причин» — циклически по индексу. */
export declare function breakdownColor(index: number, tokens: ThemeTokens): string;
//# sourceMappingURL=tokens.d.ts.map