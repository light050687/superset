"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = buildQuery;
const core_1 = require("@superset-ui/core");
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
function buildQuery(formData) {
    const { metric_fact, metric_plan, metric_py, } = formData;
    // Normalize groupby_category (sharedControls.groupby returns arrays even with multi:false)
    const fd = formData;
    if (Array.isArray(fd.groupby_category)) {
        fd.groupby_category = fd.groupby_category[0] ?? undefined;
    }
    if (Array.isArray(fd.groupbyCategory)) {
        fd.groupbyCategory = fd.groupbyCategory[0] ?? undefined;
    }
    const groupbyCategory = (fd.groupby_category ?? fd.groupbyCategory);
    return (0, core_1.buildQueryContext)(formData, baseQueryObject => {
        const allMetrics = [];
        const seenLabels = new Set();
        const addMetric = (m) => {
            if (!m)
                return;
            const label = typeof m === 'string' ? m : m.label ?? JSON.stringify(m);
            if (!seenLabels.has(label)) {
                seenLabels.add(label);
                allMetrics.push(m);
            }
        };
        addMetric(metric_fact);
        addMetric(metric_plan);
        addMetric(metric_py);
        const fdExt = formData;
        const isMockOn = fdExt.mock_mode_enabled ?? fdExt.mockModeEnabled ?? false;
        if (allMetrics.length === 0) {
            if (isMockOn) {
                // Satisfy the "Empty query?" guard — value is never read in mock mode.
                allMetrics.push({
                    expressionType: 'SQL',
                    sqlExpression: 'COUNT(*)',
                    label: '__mock',
                });
            }
            else {
                // No metric and no mock — let Superset surface a user-friendly error.
                return [baseQueryObject];
            }
        }
        const { time_range, since, until, granularity, filters, extras, applied_time_extras, where, having, annotation_layers, url_params, custom_params, } = baseQueryObject;
        const baseFields = {
            time_range,
            since,
            until,
            granularity,
            filters,
            extras,
            applied_time_extras,
            where,
            having,
            annotation_layers,
            url_params,
            custom_params,
        };
        // Query 0: time series (no groupby) — fact/plan/py over time.
        // is_timeseries=true tells Superset to include __timestamp column in results
        // and honor granularity_sqla as the time column.
        const seriesQuery = {
            ...baseQueryObject,
            ...baseFields,
            metrics: allMetrics,
            columns: [],
            orderby: [],
            row_limit: 10000,
            post_processing: [],
            is_timeseries: true,
        };
        const queries = [seriesQuery];
        // Query 1: categories breakdown (only when configured)
        // Use fact metric as the single aggregation for category slices.
        // is_timeseries=true + groupby = one row per (timestamp × category).
        if (groupbyCategory && metric_fact) {
            const categoryQuery = {
                ...baseQueryObject,
                ...baseFields,
                metrics: [metric_fact],
                columns: [groupbyCategory],
                orderby: [],
                row_limit: 10000,
                post_processing: [],
                is_timeseries: true,
            };
            queries.push(categoryQuery);
        }
        return queries;
    });
}
//# sourceMappingURL=buildQuery.js.map