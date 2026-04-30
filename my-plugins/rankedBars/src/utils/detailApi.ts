import { SupersetClient, getMetricLabel } from '@superset-ui/core';
import type { DrillData, DrillQueryParams, DrillTopRow } from '../types';

/**
 * Lazy fetch API for the drill-down modal.
 *
 * Builds three parallel requests to `/api/v1/chart/data`:
 *   - top N stores aggregated by `storeDim`
 *   - top N SKUs aggregated by `skuDim`
 *   - 12-bucket trend (time-series) for the selected category
 *
 * Each request sends a new `filters` entry that narrows data to the selected row id.
 * Caller is responsible for caching or debouncing; this module only wires up network calls.
 */

interface JsonLike {
  json: unknown;
}

function makeAggregateQuery(
  queryParams: DrillQueryParams,
  rowId: string,
  groupbyCol: string,
  limit: number,
): Record<string, unknown> {
  return {
    datasource: queryParams.datasource,
    result_format: 'json',
    result_type: 'full',
    queries: [
      {
        columns: [groupbyCol],
        metrics: [queryParams.metric],
        orderby: [[queryParams.metric, false]],
        row_limit: limit,
        is_timeseries: false,
        filters: [
          { col: queryParams.groupbyCol, op: 'IN', val: [rowId] },
        ],
        extras: {},
        applied_time_extras: {},
      },
    ],
    ...(queryParams.timeRange ? { time_range: queryParams.timeRange } : {}),
  };
}

function makeTimeseriesQuery(
  queryParams: DrillQueryParams,
  rowId: string,
  buckets: number,
): Record<string, unknown> {
  return {
    datasource: queryParams.datasource,
    result_format: 'json',
    result_type: 'full',
    queries: [
      {
        columns: [],
        metrics: [queryParams.metric],
        orderby: [],
        row_limit: buckets,
        is_timeseries: true,
        filters: [
          { col: queryParams.groupbyCol, op: 'IN', val: [rowId] },
        ],
        extras: {},
        applied_time_extras: {},
      },
    ],
    ...(queryParams.timeRange ? { time_range: queryParams.timeRange } : {}),
  };
}

function extractRows(
  response: unknown,
): Array<Record<string, unknown>> {
  if (!response || typeof response !== 'object') return [];
  const obj = response as Record<string, unknown>;
  // `/api/v1/chart/data` returns { result: [{ data: [...] }, ...] }
  const result = obj.result;
  if (!Array.isArray(result) || result.length === 0) return [];
  const first = result[0] as Record<string, unknown>;
  const data = first.data;
  return Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
}

function parseTopRows(
  rows: Array<Record<string, unknown>>,
  groupbyCol: string,
  metricLabel: string,
): DrillTopRow[] {
  return rows
    .map(row => {
      const name = row[groupbyCol];
      const valueRaw = row[metricLabel];
      const value = valueRaw == null ? null : Number(valueRaw);
      if (name == null || value == null || !Number.isFinite(value)) {
        return null;
      }
      return { name: String(name), value };
    })
    .filter((r): r is DrillTopRow => r !== null);
}

function parseTrend(
  rows: Array<Record<string, unknown>>,
  metricLabel: string,
): number[] {
  return rows
    .map(row => {
      const raw = row[metricLabel];
      const v = raw == null ? null : Number(raw);
      return Number.isFinite(v) ? (v as number) : null;
    })
    .filter((v): v is number => v != null);
}

/**
 * Parallel fetch of all drill data needed to render DetailModal.
 * Promises are fired together with a single AbortController so a close/cancel drops all three.
 *
 * Returns empty lists for any dimension not configured (storeDim / skuDim).
 */
export async function fetchDrillData(
  queryParams: DrillQueryParams,
  rowId: string,
  signal?: AbortSignal,
): Promise<DrillData> {
  const metricLabel = getMetricLabel(queryParams.metric);
  const n = queryParams.detailTopN;

  const storeDim = queryParams.storeDim;
  const skuDim = queryParams.skuDim;

  const storesPromise: Promise<DrillTopRow[]> = storeDim
    ? (SupersetClient.post({
        endpoint: 'api/v1/chart/data',
        jsonPayload: makeAggregateQuery(queryParams, rowId, storeDim, n),
        signal,
      }) as unknown as Promise<JsonLike>).then(r =>
        parseTopRows(extractRows(r.json), storeDim, metricLabel),
      )
    : Promise.resolve([]);

  const skusPromise: Promise<DrillTopRow[]> = skuDim
    ? (SupersetClient.post({
        endpoint: 'api/v1/chart/data',
        jsonPayload: makeAggregateQuery(queryParams, rowId, skuDim, n),
        signal,
      }) as unknown as Promise<JsonLike>).then(r =>
        parseTopRows(extractRows(r.json), skuDim, metricLabel),
      )
    : Promise.resolve([]);

  const trendPromise: Promise<number[]> = (
    SupersetClient.post({
      endpoint: 'api/v1/chart/data',
      jsonPayload: makeTimeseriesQuery(queryParams, rowId, 12),
      signal,
    }) as unknown as Promise<JsonLike>
  ).then(r => parseTrend(extractRows(r.json), metricLabel));

  const [stores, skus, trend] = await Promise.all([
    storesPromise,
    skusPromise,
    trendPromise,
  ]);

  return { stores, skus, trend };
}
