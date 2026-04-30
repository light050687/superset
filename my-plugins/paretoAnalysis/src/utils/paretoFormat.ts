/**
 * Форматтеры «по контракту метрики» прототипа:
 *   fmtRub  — значение + metricUnit («21,8 млн ₽»)
 *   fmtPct1 — одно число после запятой с «%» («71,6%»)
 *   fmtPct2 — два числа после запятой с «%» («7,15%»)
 *
 * В прототипе значения уже приходят в «млн ₽», поэтому тут используется
 * простой `Intl.NumberFormat('ru-RU')` — БЕЗ smart-abbreviation
 * (эта функция — в formatRussian.ts, когда сырые значения в ₽).
 */

const nf1 = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const nf2 = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const nf0 = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Форматирует value в формате «N,N {metricUnit}» («21,8 млн ₽»). */
export function formatMetricValue(
  value: number | null | undefined,
  metricUnit: string,
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${nf1.format(value)} ${metricUnit}`;
}

export function formatPct1(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${nf1.format(value)}%`;
}

export function formatPct2(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${nf2.format(value)}%`;
}

/** Целое число в ru-RU (для рангов и счётчиков). */
export function formatInt(value: number): string {
  return nf0.format(value);
}

/** Форматирует signed percentage delta («+12,3%»). */
export function formatSignedPct1(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${nf1.format(Math.abs(value))}%`;
}
