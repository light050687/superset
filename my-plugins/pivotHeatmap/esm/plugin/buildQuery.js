import { buildQueryContext, ensureIsArray, getColumnLabel, } from '@superset-ui/core';
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
export default function buildQuery(formData) {
    // sharedControls.groupby always returns an array even with multi:false →
    // buildQueryContext can choke on .toLowerCase(array). Normalize first.
    const fd = formData;
    const normAxis = (snake, camel) => {
        if (Array.isArray(fd[snake])) {
            fd[snake] = fd[snake][0] ?? undefined;
        }
        if (Array.isArray(fd[camel])) {
            fd[camel] = fd[camel][0] ?? undefined;
        }
    };
    normAxis('row_axis', 'rowAxis');
    normAxis('col_axis', 'colAxis');
    normAxis('breakdown_dim', 'breakdownDim');
    const rowAxis = (fd.rowAxis ?? fd.row_axis);
    const colAxis = (fd.colAxis ?? fd.col_axis);
    const { valueMetric, planMetric, revenueMetric, shopsMetric, } = formData;
    return buildQueryContext(formData, (baseQueryObject) => {
        const columns = [
            ...ensureIsArray(rowAxis),
            ...ensureIsArray(colAxis),
        ];
        const metrics = [];
        const seen = new Set();
        const addMetric = (m) => {
            if (!m)
                return;
            const key = typeof m === 'string' ? m : m.label ?? JSON.stringify(m);
            if (seen.has(key))
                return;
            seen.add(key);
            metrics.push(m);
        };
        addMetric(valueMetric);
        addMetric(planMetric);
        addMetric(revenueMetric);
        addMetric(shopsMetric);
        // Mock-mode fallback (mirrors kpiCard pattern)
        // Read both forms — buildQuery typically gets raw snake_case, but be defensive.
        const fdExt = formData;
        const isMockOn = Boolean(fdExt.mock_mode_enabled ?? fdExt.mockModeEnabled ?? false);
        if (metrics.length === 0 && isMockOn) {
            metrics.push({
                expressionType: 'SQL',
                sqlExpression: 'COUNT(*)',
                label: '__mock',
            });
        }
        // Pick only safe fields from baseQueryObject
        const { time_range, since, until, granularity, filters, extras, applied_time_extras, where, having, annotation_layers, url_params, custom_params, } = baseQueryObject;
        const query = {
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
            columns: columns.map((c) => {
                // buildQueryContext expects either string column name or adhoc column object
                if (typeof c === 'string')
                    return c;
                const label = getColumnLabel(c);
                return label || c;
            }),
            metrics,
            orderby: [],
            row_limit: 10000,
            post_processing: [],
        };
        return [query];
    });
}
//# sourceMappingURL=buildQuery.js.map