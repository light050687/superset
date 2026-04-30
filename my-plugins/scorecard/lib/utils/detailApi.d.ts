/**
 * Server-side detail data fetching API.
 *
 * Replaces client-side aggregation (aggregateDetailData) with
 * server GROUP BY + SUM queries. Each request returns ~20
 * aggregated rows instead of loading 50K raw rows.
 */
import type { AggregationType, ComparisonColorScheme, DeltaFormat, DetailQueryParams, DetailRow } from '../types';
type SortColumn = 'name' | 'value' | 'comp1Value' | 'comp1Delta' | 'comp2Value' | 'comp2Delta';
/**
 * Map UI sort column to a server-side column/metric label.
 *
 * For computed deltas (no delta metric in SQL), fall back to
 * the main metric as a sorting proxy.
 */
export declare function resolveSortTarget(sortColumn: SortColumn, groupbyCol: string, metricLabel: string, comp1Label: string | null, comp2Label: string | null, delta1Label: string | null, delta2Label: string | null): string;
interface GroupsPayloadParams {
    queryParams: DetailQueryParams;
    activeMode: 'a' | 'b';
    groupbyCol: string;
    childCol: string | undefined;
    page: number;
    pageSize: number;
    sortTarget: string;
    sortAsc: boolean;
    searchQuery: string;
    searchScope: 'group' | 'child';
    exactMatch: boolean;
    metricLabel: string;
}
/**
 * Build POST /api/v1/chart/data payload for aggregated groups.
 *
 * Server performs GROUP BY groupbyCol with SUM/AVG on all metrics.
 * Returns pageSize+1 rows for cursor-based "has next page" detection.
 */
export declare function buildGroupsPayload(params: GroupsPayloadParams): Record<string, unknown>;
/**
 * Build a COUNT(*) query to get exact total number of non-zero groups.
 *
 * Uses a subquery approach: GROUP BY groupbyCol with HAVING metric != 0,
 * then wraps with COUNT. Since API doesn't support subqueries directly,
 * we request all group names (no metrics, no pagination) and count client-side.
 * row_limit = 100000 to get all groups.
 */
export declare function buildCountPayload(params: Omit<GroupsPayloadParams, 'page' | 'pageSize' | 'sortTarget' | 'sortAsc'>): Record<string, unknown>;
interface ChildrenPayloadParams {
    queryParams: DetailQueryParams;
    activeMode: 'a' | 'b';
    parentCol: string;
    parentValue: string;
    childCol: string;
    metricLabel: string;
    searchQuery?: string;
    searchScope?: 'group' | 'child';
    exactMatch?: boolean;
}
/**
 * Build POST /api/v1/chart/data payload for children of a specific group.
 *
 * Adds an equality filter on the parent column to scope results.
 */
export declare function buildChildrenPayload(params: ChildrenPayloadParams): Record<string, unknown>;
/**
 * Build payload for CSV export — both GROUP BY columns, no pagination.
 *
 * Server aggregates by (groupbyCol, childCol) combination.
 * Each row = one parent+child pair with aggregated metrics.
 */
export declare function buildExportPayload(queryParams: DetailQueryParams, activeMode: 'a' | 'b', groupbyCol: string, childCol: string, metricLabel: string, searchQuery: string, searchScope: 'group' | 'child', exactMatch?: boolean): Record<string, unknown>;
export interface FormatRowOpts {
    aggregationType: AggregationType;
    formatValue: (n: number) => string;
    formatDelta: (n: number) => string;
    colorScheme1: ComparisonColorScheme;
    colorScheme2: ComparisonColorScheme;
    enableComp1: boolean;
    enableComp2: boolean;
    deltaFormat1: DeltaFormat;
    deltaFormat2: DeltaFormat;
    fmtComp1?: (n: number) => string;
    fmtComp2?: (n: number) => string;
    fmtDelta1?: (n: number) => string;
    fmtDelta2?: (n: number) => string;
    showDelta1: boolean;
    showDelta2: boolean;
}
/**
 * Convert a raw server row (keyed by metric labels) into a formatted DetailRow.
 *
 * For PERCENT mode: computes ratio = metric / comp1, formats as percentage.
 * For other modes: uses the raw SUM values directly.
 *
 * Returns both the formatted row and the raw metric for sorting verification.
 */
export declare function formatServerRow(row: Record<string, unknown>, nameCol: string, metricLabel: string, comp1Label: string | null, comp2Label: string | null, delta1Label: string | null, delta2Label: string | null, opts: FormatRowOpts): {
    name: string;
    summary: DetailRow;
    rawMetric: number;
};
export {};
//# sourceMappingURL=detailApi.d.ts.map