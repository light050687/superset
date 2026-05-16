import type { CellStatus, Thresholds, CellData, TotalsSlice } from '../types';
/**
 * Compute status class for a cell / totals slice based on fact/plan ratio.
 *
 * Semantics (prototype §cellStatus):
 *   - nd: no data (ratio is null or undefined)
 *   - polarity=higher_is_worse (default, losses/costs):
 *       ratio ≤ thresholds.ok  →  ok (green)
 *       ratio ≤ thresholds.wn  →  wn (yellow)
 *       ratio >  thresholds.wn →  dn (red)
 *   - polarity=higher_is_better (revenue):
 *       inverse — higher ratio is good
 */
export declare function statusFromRatio(ratio: number | null | undefined, t: Thresholds): CellStatus;
export declare function cellStatus(cell: CellData | null | undefined, t: Thresholds): CellStatus;
export declare function totalsStatus(slice: TotalsSlice | null | undefined, t: Thresholds): CellStatus;
/** Human-readable status labels (Russian, for tooltip / a11y) */
export declare const STATUS_LABEL: Record<CellStatus, string>;
//# sourceMappingURL=thresholds.d.ts.map