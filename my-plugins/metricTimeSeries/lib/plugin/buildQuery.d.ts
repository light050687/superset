import { WriteoffsTSFormData } from '../types';
/**
 * Build query context for Writeoffs Timeseries.
 *
 * Produces up to 2 queries:
 *   - Query 0 (series): time series with fact / plan? / py? metrics, no groupby.
 *   - Query 1 (categories, optional): time series × category breakdown — only fact metric.
 *     Omitted when groupby_category isn't set.
 *
 * Mock mode fallback: if no metric is configured AND mock is on, send COUNT(*)
 * so Superset doesn't error on "Empty query?" before we reach transformProps.
 */
export default function buildQuery(formData: WriteoffsTSFormData): import("@superset-ui/core").QueryContext;
//# sourceMappingURL=buildQuery.d.ts.map