import { KpiCardFormData } from '../types';
/**
 * Build query context for KPI Card.
 *
 * Collects all non-null metrics from both modes (A and B),
 * deduplicates them, and sends 1 or 2 queries:
 *   - Query 0 (summary): single aggregated row, no groupby
 *   - Query 1 (detail):  grouped breakdown for drill-down modal
 */
export default function buildQuery(formData: KpiCardFormData): import("@superset-ui/core").QueryContext;
//# sourceMappingURL=buildQuery.d.ts.map