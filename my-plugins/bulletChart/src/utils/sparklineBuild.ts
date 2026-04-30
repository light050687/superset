import { QueryFormMetric, getMetricLabel } from '@superset-ui/core';
import { FormatRow } from '../types';

/**
 * Строим sparkline для каждого ряда из timeseries-данных (queriesData[1]).
 *
 * Ожидаемый формат row-а: { __timestamp: number, <categoryColumn>: string, <metricLabel>: number }.
 * Если sparkline-запрос не возвращён (пустой второй query), массивы остаются пустыми.
 */
export function attachSparklines(
  rows: FormatRow[],
  sparkData: Record<string, unknown>[],
  categoryColumn: string,
  metricFact: QueryFormMetric | undefined,
  lastNPoints: number,
): FormatRow[] {
  if (!sparkData.length || !categoryColumn || !metricFact) return rows;

  const metricLabel = getMetricLabel(metricFact);
  if (!metricLabel) return rows;

  // Группируем по категории; для каждой — отсортировать по времени и взять last N.
  const byCategory = new Map<string, Array<{ t: number; v: number }>>();

  for (const row of sparkData) {
    const catRaw = row[categoryColumn];
    if (catRaw == null) continue;
    const catKey = String(catRaw);

    const tRaw = row.__timestamp ?? row.ds ?? row.timestamp;
    const t =
      typeof tRaw === 'number'
        ? tRaw
        : tRaw != null
        ? new Date(tRaw as string).getTime()
        : 0;

    const vRaw = row[metricLabel];
    const v = vRaw != null ? Number(vRaw) : NaN;
    if (!Number.isFinite(v)) continue;

    const arr = byCategory.get(catKey) ?? [];
    arr.push({ t, v });
    byCategory.set(catKey, arr);
  }

  // Матчим категории на строки. id имеет вид "<name>__<idx>", name = категория.
  return rows.map(row => {
    const series = byCategory.get(row.name);
    if (!series) return row;
    const sorted = series.sort((a, b) => a.t - b.t).slice(-lastNPoints);
    return { ...row, spark: sorted.map(p => p.v) };
  });
}
