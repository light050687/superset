import { SupersetClient, getMetricLabel } from '@superset-ui/core';
function makeAggregateQuery(queryParams, rowId, groupbyCol, limit) {
    return {
        datasource: queryParams.datasource,
        result_format: 'json',
        result_type: 'full',
        queries: [
            {
                columns: [groupbyCol],
                metrics: [queryParams.metric],
                orderby: [[queryParams.metric, false]],
                row_limit: limit,
                is_timeseries: false,
                filters: [
                    { col: queryParams.groupbyCol, op: 'IN', val: [rowId] },
                ],
                extras: {},
                applied_time_extras: {},
            },
        ],
        ...(queryParams.timeRange ? { time_range: queryParams.timeRange } : {}),
    };
}
function makeTimeseriesQuery(queryParams, rowId, buckets) {
    return {
        datasource: queryParams.datasource,
        result_format: 'json',
        result_type: 'full',
        queries: [
            {
                columns: [],
                metrics: [queryParams.metric],
                orderby: [],
                row_limit: buckets,
                is_timeseries: true,
                filters: [
                    { col: queryParams.groupbyCol, op: 'IN', val: [rowId] },
                ],
                extras: {},
                applied_time_extras: {},
            },
        ],
        ...(queryParams.timeRange ? { time_range: queryParams.timeRange } : {}),
    };
}
function extractRows(response) {
    if (!response || typeof response !== 'object')
        return [];
    const obj = response;
    // `/api/v1/chart/data` returns { result: [{ data: [...] }, ...] }
    const result = obj.result;
    if (!Array.isArray(result) || result.length === 0)
        return [];
    const first = result[0];
    const data = first.data;
    return Array.isArray(data) ? data : [];
}
function parseTopRows(rows, groupbyCol, metricLabel) {
    return rows
        .map(row => {
        const name = row[groupbyCol];
        const valueRaw = row[metricLabel];
        const value = valueRaw == null ? null : Number(valueRaw);
        if (name == null || value == null || !Number.isFinite(value)) {
            return null;
        }
        return { name: String(name), value };
    })
        .filter((r) => r !== null);
}
function parseTrend(rows, metricLabel) {
    return rows
        .map(row => {
        const raw = row[metricLabel];
        const v = raw == null ? null : Number(raw);
        return Number.isFinite(v) ? v : null;
    })
        .filter((v) => v != null);
}
/**
 * Parallel fetch of all drill data needed to render DetailModal.
 * Promises are fired together with a single AbortController so a close/cancel drops all three.
 *
 * Returns empty lists for any dimension not configured (storeDim / skuDim).
 */
export async function fetchDrillData(queryParams, rowId, signal) {
    const metricLabel = getMetricLabel(queryParams.metric);
    const n = queryParams.detailTopN;
    const storeDim = queryParams.storeDim;
    const skuDim = queryParams.skuDim;
    const storesPromise = storeDim
        ? SupersetClient.post({
            endpoint: 'api/v1/chart/data',
            jsonPayload: makeAggregateQuery(queryParams, rowId, storeDim, n),
            signal,
        }).then(r => parseTopRows(extractRows(r.json), storeDim, metricLabel))
        : Promise.resolve([]);
    const skusPromise = skuDim
        ? SupersetClient.post({
            endpoint: 'api/v1/chart/data',
            jsonPayload: makeAggregateQuery(queryParams, rowId, skuDim, n),
            signal,
        }).then(r => parseTopRows(extractRows(r.json), skuDim, metricLabel))
        : Promise.resolve([]);
    const trendPromise = SupersetClient.post({
        endpoint: 'api/v1/chart/data',
        jsonPayload: makeTimeseriesQuery(queryParams, rowId, 12),
        signal,
    }).then(r => parseTrend(extractRows(r.json), metricLabel));
    const [stores, skus, trend] = await Promise.all([
        storesPromise,
        skusPromise,
        trendPromise,
    ]);
    return { stores, skus, trend };
}
//# sourceMappingURL=detailApi.js.map