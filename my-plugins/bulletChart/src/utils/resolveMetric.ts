import { getMetricLabel, QueryFormMetric } from '@superset-ui/core';

/**
 * Ищем числовое значение метрики в строке результата.
 *
 * Стратегия 1: прямое обращение по label (getMetricLabel).
 * Стратегия 2: fallback — первый неиспользованный ключ в строке (backward-compat
 * для случаев, когда метрику переименовали).
 */
export function resolveMetricValue(
  formDataMetric: QueryFormMetric | undefined,
  row: Record<string, unknown> | undefined,
  excludeKeys: Set<string>,
): { label: string | null; value: number | null } {
  if (!formDataMetric) return { label: null, value: null };
  if (!row) return { label: null, value: null };

  // Strategy 1: direct label lookup
  const label = getMetricLabel(formDataMetric);
  if (label && row[label] != null) {
    const v = Number(row[label]);
    return { label, value: Number.isFinite(v) ? v : null };
  }

  // Strategy 2: fallback — первый неиспользованный ключ
  const nextKey = Object.keys(row).find(k => !excludeKeys.has(k));
  if (nextKey) {
    const val = row[nextKey];
    const n = val != null ? Number(val) : null;
    return { label: nextKey, value: n != null && Number.isFinite(n) ? n : null };
  }

  return { label: null, value: null };
}
