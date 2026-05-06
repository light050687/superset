import type { QueryFormData, QueryFormMetric, QueryFormColumn } from '@superset-ui/core';
/** Status shown by cell color */
export type CellStatus = 'ok' | 'wn' | 'dn' | 'nd';
/** Whether "higher ratio" means "worse" (losses, costs) or "better" (revenue) */
export type ValuePolarity = 'higher_is_worse' | 'higher_is_better';
/** Unit toggle — absolute or percentage of revenue */
export type UnitMode = 'abs' | 'pct';
/** 6 mandatory data states per Design System v2.0 */
export type DataState = 'loading' | 'error' | 'empty' | 'partial' | 'stale' | 'populated';
/** Item type for drill / compare */
export type CompareItemType = 'cell' | 'row' | 'col';
export interface CompareItem {
    type: CompareItemType;
    rowId?: string;
    colId?: string;
}
/** Pre-computed slice for a single column-axis variant (mock mode multi-axis). */
export interface ColAxisOption {
    key: string;
    label: string;
    cols: AxisItem[];
    cells: Map<string, CellData>;
    rowTotals: Map<string, TotalsSlice>;
    colTotals: Map<string, TotalsSlice>;
    grandTotal: TotalsSlice | null;
}
export interface HeatmapPivotFormData extends QueryFormData {
    rowAxis: QueryFormColumn;
    colAxis: QueryFormColumn;
    breakdownDim?: QueryFormColumn;
    valueMetric: QueryFormMetric;
    planMetric?: QueryFormMetric;
    revenueMetric?: QueryFormMetric;
    shopsMetric?: QueryFormMetric;
    headerText?: string;
    headerSubtitle?: string;
    defaultUnit: UnitMode;
    unitSuffix: string;
    decimals: number;
    autoFormatRussian: boolean;
    thresholdOk: number;
    thresholdWn: number;
    valuePolarity: ValuePolarity;
    showTotals: boolean;
    emitFilter: boolean;
    colLabelMaxChars?: number;
    rowLabelMaxChars?: number;
    mockModeEnabled?: boolean;
    mockPreset?: string;
}
/** Single cell of pivoted matrix */
export interface CellData {
    rowId: string;
    colId: string;
    /** Fact (absolute) */
    value: number;
    /** Plan (absolute) — null when not configured */
    plan: number | null;
    /** Fact / Plan ratio — used for status */
    ratio: number | null;
    /** Fact as % of revenue (when revenueMetric present) */
    pct: number | null;
    /** Plan as % of revenue */
    planPct: number | null;
    /** Revenue (denominator for pct) */
    revenue: number | null;
    /** Shop count aggregate */
    shops: number | null;
}
/** Axis item — used for both rows and columns */
export interface AxisItem {
    id: string;
    name: string;
}
/** Totals slice — computed client-side (SUM only) */
export interface TotalsSlice {
    fact: number;
    plan: number | null;
    ratio: number | null;
    revenue: number | null;
    pct: number | null;
}
/** Thresholds config (resolved) */
export interface Thresholds {
    ok: number;
    wn: number;
    polarity: ValuePolarity;
}
/** Breakdown row for DrillModal bars */
export interface BreakdownRow {
    name: string;
    value: number;
}
/** Params needed by DrillModal / CompareModal to call SupersetClient */
export interface DrillQueryParams {
    datasourceId: number;
    datasourceType: string;
    rowAxisCol: string;
    colAxisCol: string;
    breakdownCol: string | null;
    valueMetric: QueryFormMetric | null;
    valueMetricLabel: string;
    timeRange: string;
    filters: Array<{
        col: string;
        op: string;
        val: unknown;
    }>;
    extras: Record<string, unknown>;
}
export interface HeatmapPivotProps {
    width: number;
    height: number;
    formData: HeatmapPivotFormData;
    rowAxisLabel: string;
    colAxisLabel: string;
    rows: AxisItem[];
    cols: AxisItem[];
    cells: Map<string, CellData>;
    rowTotals: Map<string, TotalsSlice>;
    colTotals: Map<string, TotalsSlice>;
    grandTotal: TotalsSlice | null;
    thresholds: Thresholds;
    defaultUnit: UnitMode;
    unitSuffix: string;
    decimals: number;
    autoFormatRussian: boolean;
    showTotalsDefault: boolean;
    headerText: string;
    headerSubtitle: string;
    emitFilter: boolean;
    /** Superset hook to propagate cross-filter */
    setDataMask?: (mask: Record<string, unknown>) => void;
    drillQueryParams: DrillQueryParams | null;
    /** Mock-mode flag — disables real SupersetClient calls, returns synthetic data */
    mockMode: boolean;
    /** Max chars in column header label before "…"-truncation. <=0 means no limit. */
    colLabelMaxChars: number;
    /** Max chars in row header label before "…"-truncation. <=0 means no limit. */
    rowLabelMaxChars: number;
    /** Available column-axis variants (mock mode only). When set, UI shows
     *  collapsible Dropdown to switch axis on the fly. */
    colAxisOptions?: ColAxisOption[];
    dataState: DataState;
    errorMessage?: string;
}
//# sourceMappingURL=types.d.ts.map