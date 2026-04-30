import { buildQueryContext, } from '@superset-ui/core';
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
export default function buildQuery(formData) {
    const fd = formData;
    return buildQueryContext(formData, (baseQueryObject) => {
        const metric = fd.metric;
        if (!metric) {
            // Superset will surface a "Missing required metric" error; no further querying.
            return [{ ...baseQueryObject, metrics: [], columns: [], row_limit: 0 }];
        }
        // Collect metrics: main + previous (deduplicated happens server-side by label).
        const metrics = [metric];
        if (fd.metricPrev) {
            metrics.push(fd.metricPrev);
        }
        const rowLimit = typeof fd.rowLimit === 'number' && fd.rowLimit > 0 ? fd.rowLimit : 30;
        // Normalize groupby — Superset may pass string | string[] depending on multi flag.
        const groupbyArr = Array.isArray(fd.groupby)
            ? fd.groupby
            : fd.groupby
                ? [fd.groupby]
                : [];
        const extraCols = [
            fd.nameColumn,
            fd.subColumn,
            fd.iconColumn,
            fd.colorColumn,
        ].filter((c) => c != null);
        // Deduplicate columns — groupby already contains primary dimension.
        const columns = Array.from(new Set([...groupbyArr, ...extraCols]));
        const orderby = [[metric, false]];
        const aggregateQuery = {
            ...baseQueryObject,
            columns,
            metrics,
            orderby,
            row_limit: rowLimit,
            is_timeseries: false,
        };
        const queries = [aggregateQuery];
        // Time-series query for sparkline (only when enabled and dimension is present).
        if (fd.showSparkline && groupbyArr.length > 0) {
            queries.push({
                ...baseQueryObject,
                columns: groupbyArr,
                metrics: [metric],
                orderby,
                row_limit: rowLimit * 12, // ~12 buckets × N dimensions
                is_timeseries: true,
            });
        }
        return queries;
    });
}
//# sourceMappingURL=buildQuery.js.map