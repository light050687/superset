import type { AxisItem, CellData, TotalsSlice } from '../types';
interface ReshapeInput {
    data: Record<string, unknown>[];
    rowAxisCol: string;
    colAxisCol: string;
    valueKey: string;
    planKey: string | null;
    revenueKey: string | null;
    shopsKey: string | null;
}
interface ReshapeResult {
    cells: Map<string, CellData>;
    rows: AxisItem[];
    cols: AxisItem[];
    rowTotals: Map<string, TotalsSlice>;
    colTotals: Map<string, TotalsSlice>;
    grandTotal: TotalsSlice | null;
}
/**
 * Reshape flat server response into pivoted matrix.
 *
 * Server returns: [{row_axis: 'A', col_axis: 'X', metric: 100}, ...]
 * We build:
 *   - cells: Map("A|X" → CellData)
 *   - rows / cols: unique ordered lists (first-seen order)
 *   - rowTotals / colTotals: client-side SUM (valid only for SUM-aggregated metrics)
 */
export declare function reshapePivot(input: ReshapeInput): ReshapeResult;
export {};
//# sourceMappingURL=pivotReshape.d.ts.map