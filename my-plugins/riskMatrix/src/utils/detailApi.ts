/**
 * SupersetClient — lazy-load detail data для drill modals.
 *
 * Вызывается из StoreDrillModal / QuadrantDrillModal при открытии;
 * делает параллельные запросы к /api/v1/chart/data.
 *
 * Паттерн взят из kpiCard/src/utils/detailApi.ts и адаптирован под
 * 3 типа drill-данных: trend (12 недель), causes (топ-3), skus (топ-5).
 */

import { SupersetClient, QueryFormMetric } from '@superset-ui/core';
import { DetailQueryParams, SimpleAdhocFilter } from '../types';

export interface TrendPoint {
  t: string;
  value: number;
}

export interface CauseRow {
  name: string;
  value: number;
}

export interface SkuRow {
  name: string;
  value: number;
}

export interface RankInFormat {
  rank: number;
  total: number;
}

/** Общий shape для post-processing */
interface QueryContextV1 {
  datasource: { id: number; type: 'table' };
  queries: Array<Record<string, unknown>>;
  result_format: 'json';
  result_type: 'full';
}

function makeContext(
  datasetId: number,
  query: Record<string, unknown>,
): QueryContextV1 {
  return {
    datasource: { id: datasetId, type: 'table' },
    queries: [query],
    result_format: 'json',
    result_type: 'full',
  };
}

function storeFilter(
  storeColumn: string | undefined,
  storeId: string,
): SimpleAdhocFilter | null {
  if (!storeColumn || storeId === '') return null;
  return { col: storeColumn, op: '==', val: storeId };
}

/** ===================== TREND ===================== */

export async function fetchStoreTrend(
  params: DetailQueryParams,
  storeId: string,
): Promise<TrendPoint[]> {
  if (!params.datasetId || !params.trendTimeColumn || !params.trendMetric) {
    return [];
  }

  const filters: SimpleAdhocFilter[] = [...params.baseFilters];
  const sf = storeFilter(params.storeColumn, storeId);
  if (sf) filters.push(sf);

  const weeks = Math.max(1, params.trendWeeks || 12);
  const timeRange = params.timeRange ?? `Last ${weeks} weeks`;

  const query: Record<string, unknown> = {
    columns: [{ timeGrain: 'P1W', columnType: 'BASE_AXIS', sqlExpression: params.trendTimeColumn, label: params.trendTimeColumn, expressionType: 'SQL' }],
    metrics: [params.trendMetric],
    orderby: [],
    row_limit: weeks,
    time_range: timeRange,
    filters,
    extras: { where: params.baseWhere ?? '', having: params.baseHaving ?? '' },
  };

  const response = await SupersetClient.post({
    endpoint: '/api/v1/chart/data',
    jsonPayload: makeContext(params.datasetId, query),
  });

  const raw = (response.json as { result?: Array<{ data?: Array<Record<string, unknown>> }> }).result?.[0]?.data ?? [];
  const metricLabel = getMetricLabel(params.trendMetric);
  const timeCol = params.trendTimeColumn;

  return raw
    .map((row) => ({
      t: String(row[timeCol] ?? ''),
      value: Number(row[metricLabel] ?? 0),
    }))
    .filter((p) => Number.isFinite(p.value));
}

/** ===================== CAUSES (top-N) ===================== */

export async function fetchStoreCauses(
  params: DetailQueryParams,
  storeId: string,
): Promise<CauseRow[]> {
  if (!params.datasetId || !params.causesDimension || !params.causesMetric) {
    return [];
  }

  const filters: SimpleAdhocFilter[] = [...params.baseFilters];
  const sf = storeFilter(params.storeColumn, storeId);
  if (sf) filters.push(sf);

  const metric = params.causesMetric;
  const metricLabel = getMetricLabel(metric);

  const query: Record<string, unknown> = {
    columns: [params.causesDimension],
    metrics: [metric],
    orderby: [[metric, false]],
    row_limit: Math.max(1, params.causesTopN),
    time_range: params.timeRange,
    filters,
    extras: { where: params.baseWhere ?? '', having: params.baseHaving ?? '' },
  };

  const response = await SupersetClient.post({
    endpoint: '/api/v1/chart/data',
    jsonPayload: makeContext(params.datasetId, query),
  });

  const raw = (response.json as { result?: Array<{ data?: Array<Record<string, unknown>> }> }).result?.[0]?.data ?? [];
  return raw.map((row) => ({
    name: String(row[params.causesDimension!] ?? ''),
    value: Number(row[metricLabel] ?? 0),
  }));
}

/** ===================== SKUs (top-N) ===================== */

export async function fetchStoreSkus(
  params: DetailQueryParams,
  storeId: string,
): Promise<SkuRow[]> {
  if (!params.datasetId || !params.skusDimension || !params.skusMetric) {
    return [];
  }

  const filters: SimpleAdhocFilter[] = [...params.baseFilters];
  const sf = storeFilter(params.storeColumn, storeId);
  if (sf) filters.push(sf);

  const metric = params.skusMetric;
  const metricLabel = getMetricLabel(metric);

  const query: Record<string, unknown> = {
    columns: [params.skusDimension],
    metrics: [metric],
    orderby: [[metric, false]],
    row_limit: Math.max(1, params.skusTopN),
    time_range: params.timeRange,
    filters,
    extras: { where: params.baseWhere ?? '', having: params.baseHaving ?? '' },
  };

  const response = await SupersetClient.post({
    endpoint: '/api/v1/chart/data',
    jsonPayload: makeContext(params.datasetId, query),
  });

  const raw = (response.json as { result?: Array<{ data?: Array<Record<string, unknown>> }> }).result?.[0]?.data ?? [];
  return raw.map((row) => ({
    name: String(row[params.skusDimension!] ?? ''),
    value: Number(row[metricLabel] ?? 0),
  }));
}

/* ============================================================
 * Вспомогательные
 * ============================================================ */

function getMetricLabel(m: QueryFormMetric): string {
  if (typeof m === 'string') return m;
  const withLabel = m as { label?: string };
  if (withLabel.label) return withLabel.label;
  return JSON.stringify(m);
}
