/**
 * Drill-down API для DetailModal: серверный GROUP BY по detail-колонке
 * с фильтром по выбранной категории. Один POST запрос на открытие модали.
 */

import { SupersetClient, getMetricLabel } from '@superset-ui/core';
import type { QueryFormMetric } from '@superset-ui/core';
import type { DetailQueryParams } from '../types';

export interface DetailStoreRow {
  name: string;
  rate: number;
  plan: number | null;
  py: number | null;
  stores: number | null;
}

/**
 * Запрос к /api/v1/chart/data без сохранённого chart — формируется query_context.
 */
export async function fetchDetailRows(
  params: DetailQueryParams,
): Promise<DetailStoreRow[]> {
  const {
    datasourceId,
    datasourceType,
    detailGroupby,
    categoryColumn,
    categoryValue,
    metrics,
    metricLabels,
    timeRange,
    granularity,
    filters,
    extras,
  } = params;

  const allFilters: Array<Record<string, unknown>> = [
    ...filters.map(f => ({ col: f.col, op: f.op, val: f.val })),
    { col: categoryColumn, op: '==', val: categoryValue },
  ];

  const queryObject: Record<string, unknown> = {
    metrics,
    columns: [detailGroupby],
    filters: allFilters,
    extras: extras ?? {},
    granularity,
    time_range: timeRange,
    orderby: metrics[0]
      ? [[metrics[0] as QueryFormMetric, false]]
      : [],
    row_limit: 500,
    post_processing: [],
    is_timeseries: false,
  };

  const queryContext = {
    datasource: { id: datasourceId, type: datasourceType },
    queries: [queryObject],
    result_format: 'json',
    result_type: 'full',
    force: false,
  };

  const response = await SupersetClient.post({
    endpoint: '/api/v1/chart/data',
    jsonPayload: queryContext,
  });

  const json = (response as unknown as { json: { result: Array<{ data: unknown[] }> } })
    .json;
  const rawRows = (json?.result?.[0]?.data ?? []) as Record<string, unknown>[];

  return rawRows.map((row): DetailStoreRow => {
    const name = String(row[detailGroupby] ?? '—');
    const rateKey = metricLabels.fact;
    const rate = Number(row[rateKey] ?? 0);
    const plan =
      metricLabels.plan && row[metricLabels.plan] != null
        ? Number(row[metricLabels.plan])
        : null;
    const py =
      metricLabels.py && row[metricLabels.py] != null
        ? Number(row[metricLabels.py])
        : null;
    const stores =
      metricLabels.stores && row[metricLabels.stores] != null
        ? Number(row[metricLabels.stores])
        : null;
    return { name, rate, plan, py, stores };
  });
}

/** Получить ярлык метрики (безопасно для undefined). */
export function safeMetricLabel(m: QueryFormMetric | undefined): string | null {
  if (!m) return null;
  try {
    return getMetricLabel(m);
  } catch {
    return null;
  }
}
