/**
 * Russian-locale number formatting utilities.
 *
 * Follows standard Russian conventions:
 *   - Thousands separator: thin space (U+202F)
 *   - Decimal separator: comma
 *   - Abbreviations: тыс, млн, млрд
 *   - Percentage points: п.п.
 */
/**
 * Smart Russian number formatter with auto abbreviation.
 *
 * @example
 *   formatRussianSmart(1234)          → "1 234"
 *   formatRussianSmart(12345)         → "12,3 тыс"
 *   formatRussianSmart(1234567)       → "1,23 млн"
 *   formatRussianSmart(1234567890)    → "1,23 млрд"
 *   formatRussianSmart(-500000)       → "−500 тыс"
 */
export declare function formatRussianSmart(value: number): string;
/**
 * Extended smart formatter with configurable decimals and suffix.
 *
 * @param value    - numeric value
 * @param decimals - fixed decimal places (-1 = auto)
 * @param suffix   - unit suffix appended after abbreviation (₽, п.п., %)
 */
export declare function formatRussianSmartEx(value: number, decimals?: number, suffix?: string): string;
/**
 * Format a ratio (0.148 → "+14,8%") with optional sign.
 *
 * @param ratio  - Fractional value (e.g. 0.148 for 14.8%)
 * @param signed - Whether to prepend + for positive values
 *
 * @example
 *   formatRussianPercent(0.148, true)  → "+14,8%"
 *   formatRussianPercent(-0.053, true) → "−5,3%"
 *   formatRussianPercent(0, true)      → "0,0%"
 */
export declare function formatRussianPercent(ratio: number, signed?: boolean): string;
/**
 * Format percentage-point delta (0.013 → "+1,3 п.п.").
 *
 * @param ratio - Fractional pp delta (e.g. 0.013 for 1.3 pp)
 *
 * @example
 *   formatRussianPP(0.013)  → "+1,3 п.п."
 *   formatRussianPP(-0.021) → "−2,1 п.п."
 */
export declare function formatRussianPP(ratio: number): string;
/**
 * Format a delta value: 'auto' → auto-resolved keyword, anything else → suffix.
 *
 * @param diff - raw numeric difference (current - reference)
 * @param ref  - reference value (for percent calculation)
 * @param fmt  - resolved format keyword ('percent'|'pp'|'absolute') or custom suffix text
 * @param isRatioSpace - true when diff/ref are already in ratio space (PERCENT aggregation)
 * @param suffixOverride - if set, replaces the default suffix with custom text
 */
export declare function formatDeltaByFormat(diff: number, ref: number, fmt: string, isRatioSpace?: boolean, suffixOverride?: string): string;
/**
 * Extended delta-abs formatter with configurable decimals and suffix.
 * Prefixes positive values with '+'.
 */
export declare function formatRussianDeltaAbsEx(value: number, decimals?: number, suffix?: string): string;
export declare function formatRussianDeltaAbs(value: number): string;
/**
 * Канонический fmtRub (DS 2.0): авто-переключение единицы для рублёвых сумм.
 * Базовая единица входа — рубли. До запятой ≤3 цифр.
 *
 *  - <10k       → "1 234 ₽"
 *  - <1M        → "1 234 тыс ₽"
 *  - <1B        → "1,23 млн ₽"
 *  - <1T        → "1,23 млрд ₽"
 *  - иначе      → "1,23 трлн ₽"
 */
export declare function fmtRub(v: number | null | undefined, decimals?: number): string;
//# sourceMappingURL=formatRussian.d.ts.map