import type { DrillQueryParams, BreakdownRow } from '../types';
interface DrillScope {
    /** When omitted, filter is not applied on that axis (used for row/col totals drill) */
    rowId?: string;
    colId?: string;
}
/**
 * Fetch breakdown rows for a cell / row / column via SupersetClient.
 *
 * Returns one row per `breakdownDim` value with its summed metric.
 * Safe to call when breakdownCol is null — in that case resolves to [].
 */
export declare function fetchBreakdown(params: DrillQueryParams, scope: DrillScope): Promise<BreakdownRow[]>;
export {};
//# sourceMappingURL=drillApi.d.ts.map