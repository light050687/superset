/**
 * Russian-locale number formatting utilities.
 *
 * Subset copied from kpiCard for self-containment.
 * Conventions:
 *   - Thousands separator: thin space (U+202F, Intl default ru-RU)
 *   - Decimal separator: comma
 *   - Abbreviations: тыс, млн, млрд
 */
/** Format plain integer ("1 234") */
export declare function formatRussianInt(value: number): string;
/**
 * Smart Russian number formatter with auto abbreviation and configurable decimals + suffix.
 *
 * @example
 *   formatRussianSmartEx(12345, -1)       → "12,3 тыс"
 *   formatRussianSmartEx(1234567, 2, '₽') → "1,23 млн ₽"
 */
export declare function formatRussianSmartEx(value: number, decimals?: number, suffix?: string): string;
/**
 * Format a percentage value (already in percent space: 2.8 → "2,8%").
 * Do NOT multiply by 100 here.
 *
 * DS 2.0 §11: «Проценты: 1 десятичный знак (12,4%)».
 */
export declare function formatRussianPercent(pct: number, decimals?: number): string;
/**
 * Format a signed delta percentage value (already in percent space).
 *
 * DS 2.0 §11: «Изменения: знак + стрелка (+12,4% ↑)».
 *
 * @example
 *   formatRussianDeltaPercent(14.8) → "+14,8% ↑"
 *   formatRussianDeltaPercent(-5.3) → "−5,3% ↓"
 *   formatRussianDeltaPercent(0)    → "0,0%"
 */
export declare function formatRussianDeltaPercent(pct: number, decimals?: number): string;
//# sourceMappingURL=formatRussian.d.ts.map