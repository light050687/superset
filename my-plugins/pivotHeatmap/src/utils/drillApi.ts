import { SupersetClient } from '@superset-ui/core';
import type { DrillQueryParams, BreakdownRow } from '../types';

interface DrillScope {
  /** When omitted, filter is not applied on that axis (used for row/col totals drill) */
  rowId?: string;
  colId?: string;
}

interface DrillResultRow {
  [key: string]: unknown;
}

/**
 * Fetch breakdown rows for a cell / row / column via SupersetClient.
 *
 * Returns one row per `breakdownDim` value with its summed metric.
 * Safe to call when breakdownCol is null — in that case resolves to [].
 */
export async function fetchBreakdown(
  params: DrillQueryParams,
  scope: DrillScope,
): Promise<BreakdownRow[]> {
  if (!params.breakdownCol || !params.valueMetric) return [];

  const filters = [...params.filters];
  if (scope.rowId !== undefined) {
    filters.push({ col: params.rowAxisCol, op: '==', val: scope.rowId });
  }
  if (scope.colId !== undefined) {
    filters.push({ col: params.colAxisCol, op: '==', val: scope.colId });
  }

  const body = {
    datasource: {
      id: params.datasourceId,
      type: params.datasourceType,
    },
    queries: [
      {
        columns: [params.breakdownCol],
        metrics: [params.valueMetric],
        time_range: params.timeRange || 'No filter',
        filters,
        extras: params.extras,
        row_limit: 50,
        orderby: [[params.valueMetric, false]],
        post_processing: [],
      },
    ],
    result_format: 'json',
    result_type: 'full',
  };

  try {
    const response = await SupersetClient.post({
      endpoint: '/api/v1/chart/data',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    // SupersetClient response shape is typed loosely — use runtime checks
    const payload = (response as { json?: { result?: Array<{ data?: DrillResultRow[] }> } }).json;
    const rows = payload?.result?.[0]?.data ?? [];
    const metricLabel = params.valueMetricLabel;
    const breakdownKey = params.breakdownCol;

    return rows
      .map((r) => ({
        name: String(r[breakdownKey] ?? '—'),
        value: Number(r[metricLabel] ?? 0),
      }))
      .filter((r) => Number.isFinite(r.value));
  } catch (err) {
    // Log to console — production telemetry would go here via structured logger
    // eslint-disable-next-line no-console
    console.error('[heatmap-pivot] drill fetch failed', err);
    return [];
  }
}
