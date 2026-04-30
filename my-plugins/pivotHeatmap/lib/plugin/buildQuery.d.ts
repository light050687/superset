import type { HeatmapPivotFormData } from '../types';
/**
 * Build query for heatmap-pivot.
 *
 * Single queryObject:
 *   columns: [rowAxis, colAxis]                // GROUP BY both
 *   metrics: [value, plan?, revenue?, shops?]  // aggregated per (row, col)
 *
 * Mock-mode safety: if no metric is configured but mockModeEnabled=true,
 * inject COUNT(*) to prevent backend "Empty query?" error — transformProps
 * discards the result and substitutes synthetic data.
 */
export default function buildQuery(formData: HeatmapPivotFormData): import("@superset-ui/core").QueryContext;
//# sourceMappingURL=buildQuery.d.ts.map