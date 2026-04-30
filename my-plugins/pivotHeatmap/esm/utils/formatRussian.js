/**
 * Russian-locale number formatting utilities.
 *
 * Subset copied from kpiCard for self-containment.
 * Conventions:
 *   - Thousands separator: thin space (U+202F, Intl default ru-RU)
 *   - Decimal separator: comma
 *   - Abbreviations: тыс, млн, млрд
 */
const RU_LOCALE = 'ru-RU';
function ruNumber(value, fractionDigits) {
    return new Intl.NumberFormat(RU_LOCALE, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(value);
}
/** Format plain integer ("1 234") */
export function formatRussianInt(value) {
    return new Intl.NumberFormat(RU_LOCALE, {
        maximumFractionDigits: 0,
    }).format(value);
}
/**
 * Smart Russian number formatter with auto abbreviation and configurable decimals + suffix.
 *
 * @example
 *   formatRussianSmartEx(12345, -1)       → "12,3 тыс"
 *   formatRussianSmartEx(1234567, 2, '₽') → "1,23 млн ₽"
 */
export function formatRussianSmartEx(value, decimals = -1, suffix = '') {
    const abs = Math.abs(value);
    const sign = value < 0 ? '−' : '';
    const sfx = suffix ? ` ${suffix}` : '';
    if (abs >= 1000000000) {
        const v = abs / 1000000000;
        const d = decimals >= 0 ? decimals : (abs >= 10000000000 ? 1 : 2);
        return `${sign}${ruNumber(v, d)} млрд${sfx}`;
    }
    if (abs >= 1000000) {
        const v = abs / 1000000;
        const d = decimals >= 0 ? decimals : (abs >= 100000000 ? 1 : 2);
        return `${sign}${ruNumber(v, d)} млн${sfx}`;
    }
    if (abs >= 10000) {
        const v = abs / 1000;
        const d = decimals >= 0 ? decimals : (abs >= 100000 ? 0 : 1);
        return `${sign}${ruNumber(v, d)} тыс${sfx}`;
    }
    const d = decimals >= 0 ? decimals : 0;
    return `${ruNumber(value, d)}${sfx}`;
}
/**
 * Format a percentage value (already in percent space: 2.8 → "2,8%").
 * Do NOT multiply by 100 here.
 *
 * DS 2.0 §11: «Проценты: 1 десятичный знак (12,4%)».
 */
export function formatRussianPercent(pct, decimals = 1) {
    return `${ruNumber(pct, decimals)}%`;
}
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
export function formatRussianDeltaPercent(pct, decimals = 1) {
    const formatted = ruNumber(Math.abs(pct), decimals);
    if (pct > 0.05)
        return `+${formatted}% ↑`;
    if (pct < -0.05)
        return `−${formatted}% ↓`;
    return `${formatted}%`;
}
//# sourceMappingURL=formatRussian.js.map