import { QueryFormData } from '@superset-ui/core';
/**
 * Builds the query context for Ranked Bars.
 *
 * Emits up to two queries:
 *   - query[0]: aggregated top-N rows (dimension + metric + metric_prev)
 *   - query[1]: optional time-series for sparklines (one row per time bucket per dimension)
 *
 * Drill-down queries (top stores / top SKUs / 12-week trend) are NOT emitted here.
 * They are fetched lazily in `utils/detailApi.ts` when the user Ctrl+clicks a row.
 */
export default function buildQuery(formData: QueryFormData): import("@superset-ui/core").QueryContext;
//# sourceMappingURL=buildQuery.d.ts.map