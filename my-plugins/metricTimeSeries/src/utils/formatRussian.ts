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

const RU_LOCALE = 'ru-RU';

/** Format with fixed fraction digits in Russian locale */
function ruNumber(value: number, fractionDigits: number): string {
  return new Intl.NumberFormat(RU_LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Format without fraction digits */
function ruInt(value: number): string {
  return new Intl.NumberFormat(RU_LOCALE, {
    maximumFractionDigits: 0,
  }).format(value);
}

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
export function fmtRub(value: number | null, decimals = 2): string {
  if (value == null) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${ruNumber(value / 1_000_000, decimals)} трлн ₽`;
  }
  if (abs >= 1_000) {
    return `${ruNumber(value / 1_000, decimals)} млрд ₽`;
  }
  if (abs >= 1) {
    return `${ruNumber(value, 1)} млн ₽`;
  }
  return `${ruInt(value * 1000)} тыс ₽`;
}

/** Short axis formatter for RUB — "62,5 млн" (no currency sign to keep axis thin) */
export function fmtRubAxis(value: number | null): string {
  if (value == null) return '';
  return `${ruNumber(value, 1)} млн`;
}

/** Percent formatter (1 fraction digit) — "104,3%" */
export function fmtPct(value: number | null): string {
  if (value == null) return '—';
  return `${ruNumber(value, 1)}%`;
}

/** Short percent for axis — "104%" (no decimals to keep axis readable) */
export function fmtPctAxis(value: number | null): string {
  if (value == null) return '';
  return `${ruInt(value)}%`;
}

/**
 * Smart general formatter when custom suffix/decimals are supplied from controlPanel.
 *
 * @param value — raw value
 * @param decimals — fixed decimals (-1 = auto)
 * @param suffix — appended with a preceding space when non-empty
 */
export function fmtSmart(
  value: number | null,
  decimals = -1,
  suffix = '',
): string {
  if (value == null) return '—';
  const abs = Math.abs(value);
  const sfx = suffix ? ` ${suffix}` : '';
  if (abs >= 1_000_000_000_000) {
    const d = decimals >= 0 ? decimals : abs >= 10_000_000_000_000 ? 1 : 2;
    return `${ruNumber(value / 1_000_000_000_000, d)} трлн${sfx}`;
  }
  if (abs >= 1_000_000_000) {
    const d = decimals >= 0 ? decimals : abs >= 10_000_000_000 ? 1 : 2;
    return `${ruNumber(value / 1_000_000_000, d)} млрд${sfx}`;
  }
  if (abs >= 1_000_000) {
    const d = decimals >= 0 ? decimals : abs >= 100_000_000 ? 1 : 2;
    return `${ruNumber(value / 1_000_000, d)} млн${sfx}`;
  }
  if (abs >= 10_000) {
    const d = decimals >= 0 ? decimals : abs >= 100_000 ? 0 : 1;
    return `${ruNumber(value / 1_000, d)} тыс${sfx}`;
  }
  const d = decimals >= 0 ? decimals : 1;
  return `${ruNumber(value, d)}${sfx}`;
}

/**
 * Convert hex color "#RRGGBB" to rgba(r,g,b,a).
 * Used by buildOption for gradient fills and brush styling.
 */
export function toRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
