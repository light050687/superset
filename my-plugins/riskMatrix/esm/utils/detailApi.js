/**
 * SupersetClient — lazy-load detail data для drill modals.
 *
 * Вызывается из StoreDrillModal / QuadrantDrillModal при открытии;
 * делает параллельные запросы к /api/v1/chart/data.
 *
 * Паттерн взят из kpiCard/src/utils/detailApi.ts и адаптирован под
 * 3 типа drill-данных: trend (12 недель), causes (топ-3), skus (топ-5).
 */
import { SupersetClient } from '@superset-ui/core';
function makeContext(datasetId, query) {
    return {
        datasource: { id: datasetId, type: 'table' },
        queries: [query],
        result_format: 'json',
        result_type: 'full',
    };
}
function storeFilter(storeColumn, storeId) {
    if (!storeColumn || storeId === '')
        return null;
    return { col: storeColumn, op: '==', val: storeId };
}
/** ===================== TREND ===================== */
export async function fetchStoreTrend(params, storeId) {
    if (!params.datasetId || !params.trendTimeColumn || !params.trendMetric) {
        return [];
    }
    const filters = [...params.baseFilters];
    const sf = storeFilter(params.storeColumn, storeId);
    if (sf)
        filters.push(sf);
    const weeks = Math.max(1, params.trendWeeks || 12);
    const timeRange = params.timeRange ?? `Last ${weeks} weeks`;
    const query = {
        columns: [{ timeGrain: 'P1W', columnType: 'BASE_AXIS', sqlExpression: params.trendTimeColumn, label: params.trendTimeColumn, expressionType: 'SQL' }],
        metrics: [params.trendMetric],
        orderby: [],
        row_limit: weeks,
        time_range: timeRange,
        filters,
        extras: { where: params.baseWhere ?? '', having: params.baseHaving ?? '' },
    };
    const response = await SupersetClient.post({
        endpoint: '/api/v1/chart/data',
        jsonPayload: makeContext(params.datasetId, query),
    });
    const raw = response.json.result?.[0]?.data ?? [];
    const metricLabel = getMetricLabel(params.trendMetric);
    const timeCol = params.trendTimeColumn;
    return raw
        .map((row) => ({
        t: String(row[timeCol] ?? ''),
        value: Number(row[metricLabel] ?? 0),
    }))
        .filter((p) => Number.isFinite(p.value));
}
/** ===================== CAUSES (top-N) ===================== */
export async function fetchStoreCauses(params, storeId) {
    if (!params.datasetId || !params.causesDimension || !params.causesMetric) {
        return [];
    }
    const filters = [...params.baseFilters];
    const sf = storeFilter(params.storeColumn, storeId);
    if (sf)
        filters.push(sf);
    const metric = params.causesMetric;
    const metricLabel = getMetricLabel(metric);
    const query = {
        columns: [params.causesDimension],
        metrics: [metric],
        orderby: [[metric, false]],
        row_limit: Math.max(1, params.causesTopN),
        time_range: params.timeRange,
        filters,
        extras: { where: params.baseWhere ?? '', having: params.baseHaving ?? '' },
    };
    const response = await SupersetClient.post({
        endpoint: '/api/v1/chart/data',
        jsonPayload: makeContext(params.datasetId, query),
    });
    const raw = response.json.result?.[0]?.data ?? [];
    return raw.map((row) => ({
        name: String(row[params.causesDimension] ?? ''),
        value: Number(row[metricLabel] ?? 0),
    }));
}
/** ===================== SKUs (top-N) ===================== */
export async function fetchStoreSkus(params, storeId) {
    if (!params.datasetId || !params.skusDimension || !params.skusMetric) {
        return [];
    }
    const filters = [...params.baseFilters];
    const sf = storeFilter(params.storeColumn, storeId);
    if (sf)
        filters.push(sf);
    const metric = params.skusMetric;
    const metricLabel = getMetricLabel(metric);
    const query = {
        columns: [params.skusDimension],
        metrics: [metric],
        orderby: [[metric, false]],
        row_limit: Math.max(1, params.skusTopN),
        time_range: params.timeRange,
        filters,
        extras: { where: params.baseWhere ?? '', having: params.baseHaving ?? '' },
    };
    const response = await SupersetClient.post({
        endpoint: '/api/v1/chart/data',
        jsonPayload: makeContext(params.datasetId, query),
    });
    const raw = response.json.result?.[0]?.data ?? [];
    return raw.map((row) => ({
        name: String(row[params.skusDimension] ?? ''),
        value: Number(row[metricLabel] ?? 0),
    }));
}
/* ============================================================
 * Вспомогательные
 * ============================================================ */
function getMetricLabel(m) {
    if (typeof m === 'string')
        return m;
    const withLabel = m;
    if (withLabel.label)
        return withLabel.label;
    return JSON.stringify(m);
}
//# sourceMappingURL=detailApi.js.map