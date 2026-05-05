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
 * Канонический fmtRub (DS 2.0): входное значение интерпретируется как
 * МИЛЛИОНЫ рублей (как в исходных данных). Расширено auto-unit до трлн:
 *  - value < 0.001       → "—"
 *  - value <  1          → "X тыс ₽"
 *  - value <  1 000      → "X,X млн ₽"
 *  - value <  1 000 000  → "X,XX млрд ₽"
 *  - иначе               → "X,XX трлн ₽"
 */
export declare function fmtRub(value: number | null, decimals?: number): string;
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