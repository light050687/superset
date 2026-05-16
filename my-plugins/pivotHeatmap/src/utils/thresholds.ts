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
export function statusFromRatio(
  ratio: number | null | undefined,
  t: Thresholds,
): CellStatus {
  if (ratio == null || !Number.isFinite(ratio)) return 'nd';

  if (t.polarity === 'higher_is_worse') {
    if (ratio <= t.ok) return 'ok';
    if (ratio <= t.wn) return 'wn';
    return 'dn';
  }
  // higher_is_better — mirror: ratio above 1 is good
  if (ratio >= 1 / t.ok) return 'ok';
  if (ratio >= 1 / t.wn) return 'wn';
  return 'dn';
}

export function cellStatus(cell: CellData | null | undefined, t: Thresholds): CellStatus {
  if (!cell) return 'nd';
  return statusFromRatio(cell.ratio, t);
}

export function totalsStatus(
  slice: TotalsSlice | null | undefined,
  t: Thresholds,
): CellStatus {
  if (!slice) return 'nd';
  return statusFromRatio(slice.ratio, t);
}

/** Human-readable status labels (Russian, for tooltip / a11y) */
export const STATUS_LABEL: Record<CellStatus, string> = {
  ok: 'В норме',
  wn: 'Внимание',
  dn: 'Превышение',
  nd: 'Нет данных',
};
