/**
 * Drill-down API для DetailModal: серверный GROUP BY по detail-колонке
 * с фильтром по выбранной категории. Server-side pagination через
 * row_offset + row_limit = pageSize + 1 (cursor-based hasNextPage detection,
 * паттерн scorecard buildGroupsPayload).
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

export interface FetchDetailRowsResult {
  rows: DetailStoreRow[];
  hasNextPage: boolean;
}

interface FetchDetailParams extends DetailQueryParams {
  /** Page index 0-based. */
  page?: number;
  /** Number of rows per page. */
  pageSize?: number;
  /** Optional ILIKE search query на детальной колонке. */
  searchQuery?: string;
  /** AbortSignal — для отмены при смене страницы/поиска/закрытии модалки. */
  signal?: AbortSignal;
}

/** ── Helpers ── */

function extractApiRows(json: unknown): Record<string, unknown>[] {
  const j = json as { result?: Array<{ data?: Record<string, unknown>[] }> };
  return j?.result?.[0]?.data ?? [];
}

function buildSearchFilter(
  searchQuery: string | undefined,
  col: string,
): { col: string; op: string; val: unknown } | null {
  const trimmed = searchQuery?.trim();
  if (!trimmed) return null;
  return { col, op: 'ILIKE', val: `%${trimmed}%` };
}

function buildBasePayload(
  params: DetailQueryParams,
  extraFilter: { col: string; op: string; val: unknown } | null = null,
): Record<string, unknown> {
  const {
    datasourceId,
    datasourceType,
    categoryColumn,
    categoryValue,
    filters,
    extras,
    granularity,
    timeRange,
  } = params;

  const allFilters: Array<Record<string, unknown>> = [
    ...filters.map(f => ({ col: f.col, op: f.op, val: f.val })),
    { col: categoryColumn, op: '==', val: categoryValue },
  ];
  if (extraFilter) allFilters.push(extraFilter);

  return {
    datasource: { id: datasourceId, type: datasourceType },
    filters: allFilters,
    extras: extras ?? {},
    granularity,
    timeRange,
  };
}

function mapRow(
  row: Record<string, unknown>,
  detailGroupby: string,
  metricLabels: DetailQueryParams['metricLabels'],
): DetailStoreRow {
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
}

/**
 * Запрос страницы детализации.
 *
 *   row_limit = pageSize + 1 → server возвращает на 1 больше → hasNextPage = received > pageSize.
 *   row_offset = page * pageSize.
 *   orderby по основной метрике (fact desc) — server-side стабильная сортировка.
 *
 * Сохраняет back-compat сигнатуру: page/pageSize опциональны (default 0 / 50).
 */
export async function fetchDetailRows(
  params: FetchDetailParams,
): Promise<FetchDetailRowsResult> {
  const {
    detailGroupby,
    metrics,
    metricLabels,
    page = 0,
    pageSize = 50,
    searchQuery,
    signal,
  } = params;

  const searchFilter = buildSearchFilter(searchQuery, detailGroupby);
  const base = buildBasePayload(params, searchFilter);

  const queryObject: Record<string, unknown> = {
    metrics,
    columns: [detailGroupby],
    filters: base.filters,
    extras: base.extras,
    granularity: base.granularity,
    time_range: base.timeRange,
    orderby: metrics[0]
      ? [[metrics[0] as QueryFormMetric, false]]
      : [],
    row_limit: pageSize + 1,
    row_offset: page * pageSize,
    post_processing: [],
    is_timeseries: false,
  };

  const queryContext = {
    datasource: base.datasource,
    queries: [queryObject],
    result_format: 'json',
    result_type: 'full',
    force: false,
  };

  const response = await SupersetClient.post({
    endpoint: '/api/v1/chart/data',
    jsonPayload: queryContext,
    signal,
  });

  const rawRows = extractApiRows(
    (response as unknown as { json: unknown }).json,
  );

  const hasNextPage = rawRows.length > pageSize;
  const displayRows = hasNextPage ? rawRows.slice(0, pageSize) : rawRows;

  return {
    rows: displayRows.map(row => mapRow(row, detailGroupby, metricLabels)),
    hasNextPage,
  };
}

/**
 * Точный count детализации для PaginationWrap.
 *
 *   Pattern из scorecard buildCountPayload: GROUP BY detailGroupby без пагинации,
 *   запрашиваем только основную метрику для HAVING != 0 (минимум transfer).
 *   Затем `rows.length` = total non-zero groups.
 *
 *   row_limit 100000 — defensive cap (реалистично детальная колонка <50K уникальных).
 */
export async function fetchDetailCount(
  params: FetchDetailParams,
): Promise<number> {
  const {
    detailGroupby,
    metrics,
    metricLabels,
    searchQuery,
    signal,
  } = params;

  const searchFilter = buildSearchFilter(searchQuery, detailGroupby);
  const base = buildBasePayload(params, searchFilter);

  // HAVING fact != 0 — фильтруем zero-метрик group'ы (как server-side groups в scorecard)
  const existingHaving = (base.extras as Record<string, unknown>).having as
    | string
    | undefined;
  const zeroFilter = `${metricLabels.fact} != 0`;
  const having = existingHaving
    ? `${existingHaving} AND ${zeroFilter}`
    : zeroFilter;

  const queryObject: Record<string, unknown> = {
    metrics: [metrics[0]],
    columns: [detailGroupby],
    filters: base.filters,
    extras: { ...(base.extras as Record<string, unknown>), having },
    granularity: base.granularity,
    time_range: base.timeRange,
    row_limit: 100000,
    post_processing: [],
    is_timeseries: false,
  };

  const queryContext = {
    datasource: base.datasource,
    queries: [queryObject],
    result_format: 'json',
    result_type: 'full',
    force: false,
  };

  const response = await SupersetClient.post({
    endpoint: '/api/v1/chart/data',
    jsonPayload: queryContext,
    signal,
  });

  const rawRows = extractApiRows(
    (response as unknown as { json: unknown }).json,
  );
  return rawRows.length;
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
