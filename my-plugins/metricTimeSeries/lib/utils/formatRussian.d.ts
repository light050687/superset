/**
 * Russian-locale number formatting utilities for Writeoffs Timeseries.
 *
 * Conventions:
 *   - Thousands separator: narrow no-break space (Intl.NumberFormat ru-RU default)
 *   - Decimal separator: comma
 *   - Currency suffix follows the value: "62,5 млн ₽"
 *   - Percentage: "104,3%" (no space before %)
 *   - Abbreviations: тыс, млн, млрд
 */
/**
 * Tooltip/main value formatter for RUB scale.
 *
 * Values are assumed to come in millions of rubles (as in the mockup).
 * Anything >= 1 млн → "X,X млн ₽"
 * Below 1 (e.g. 0.5 млн = 500 тыс) → "X тыс ₽"
 * Null → "—"
 */
export declare function fmtRub(value: number | null): string;
/** Short axis formatter for RUB — "62,5 млн" (no currency sign to keep axis thin) */
export declare function fmtRubAxis(value: number | null): string;
/** Percent formatter (1 fraction digit) — "104,3%" */
export declare function fmtPct(value: number | null): string;
/** Short percent for axis — "104%" (no decimals to keep axis readable) */
export declare function fmtPctAxis(value: number | null): string;
/**
 * Smart general formatter when custom suffix/decimals are supplied from controlPanel.
 *
 * @param value — raw value
 * @param decimals — fixed decimals (-1 = auto)
 * @param suffix — appended with a preceding space when non-empty
 */
export declare function fmtSmart(value: number | null, decimals?: number, suffix?: string): string;
/**
 * Convert hex color "#RRGGBB" to rgba(r,g,b,a).
 * Used by buildOption for gradient fills and brush styling.
 */
export declare function toRgba(hex: string, alpha: number): string;
//# sourceMappingURL=formatRussian.d.ts.map