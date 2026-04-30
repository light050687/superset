/**
 * RU-локализация чисел: пробел-тысячи, запятая-десятичные.
 * Повторяет §11 прототипа (строки 200–205).
 */

const nf1 = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const nf0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/** «1 234,5 млн ₽» — сумма в миллионах рублей */
export function fmtRub(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${nf1.format(v)} млн ₽`;
}

/** «12,3%» — доля от общего (базовое %-форматирование) */
export function fmtPct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${nf1.format(v)}%`;
}

/**
 * «Процент от оборота». Если totalRevenue не задан — используем sum-of-visible
 * как денуминатор (вернёт тот же процент, что и fmtPct для доли).
 */
export function fmtPctOfRev(
  v: number | null | undefined,
  totalRevenue: number | null,
  fallbackTotal: number,
): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const denom = totalRevenue && totalRevenue > 0 ? totalRevenue : fallbackTotal;
  if (!denom || !Number.isFinite(denom)) return '—';
  return `${nf1.format((v / denom) * 100)}%`;
}

/** «12 480 шт» — количество операций */
export function fmtCnt(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${nf0.format(v)} шт`;
}
