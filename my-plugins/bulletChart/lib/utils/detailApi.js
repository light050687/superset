"use strict";
/**
 * Drill-down API для DetailModal: серверный GROUP BY по detail-колонке
 * с фильтром по выбранной категории. Server-side pagination через
 * row_offset + row_limit = pageSize + 1 (cursor-based hasNextPage detection,
 * паттерн scorecard buildGroupsPayload).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDetailRows = fetchDetailRows;
exports.fetchDetailCount = fetchDetailCount;
exports.safeMetricLabel = safeMetricLabel;
const core_1 = require("@superset-ui/core");
/** ── Helpers ── */
function extractApiRows(json) {
    const j = json;
    return j?.result?.[0]?.data ?? [];
}
function buildSearchFilter(searchQuery, col) {
    const trimmed = searchQuery?.trim();
    if (!trimmed)
        return null;
    return { col, op: 'ILIKE', val: `%${trimmed}%` };
}
function buildBasePayload(params, extraFilter = null) {
    const { datasourceId, datasourceType, categoryColumn, categoryValue, filters, extras, granularity, timeRange, } = params;
    const allFilters = [
        ...filters.map(f => ({ col: f.col, op: f.op, val: f.val })),
        { col: categoryColumn, op: '==', val: categoryValue },
    ];
    if (extraFilter)
        allFilters.push(extraFilter);
    return {
        datasource: { id: datasourceId, type: datasourceType },
        filters: allFilters,
        extras: extras ?? {},
        granularity,
        timeRange,
    };
}
function mapRow(row, detailGroupby, metricLabels) {
    const name = String(row[detailGroupby] ?? '—');
    const rateKey = metricLabels.fact;
    const rate = Number(row[rateKey] ?? 0);
    const plan = metricLabels.plan && row[metricLabels.plan] != null
        ? Number(row[metricLabels.plan])
        : null;
    const py = metricLabels.py && row[metricLabels.py] != null
        ? Number(row[metricLabels.py])
        : null;
    const stores = metricLabels.stores && row[metricLabels.stores] != null
        ? Number(row[metricLabels.stores])
        : null;
    return { name, rate, plan, py, stores };
}
/**
 * Запрос страницы детализации.
 *
 *   row_limit = pageSize + 1 → server возвращает на 1 больше → hasNextPage = received > pageSize.
 *   row_offset = page * pageSize.
 *   orderby по основной метрике (fact desc) — server-side стабильная сортировка.
 *
 * Сохраняет back-compat сигнатуру: page/pageSize опциональны (default 0 / 50).
 */
async function fetchDetailRows(params) {
    const { detailGroupby, metrics, metricLabels, page = 0, pageSize = 50, searchQuery, signal, } = params;
    const searchFilter = buildSearchFilter(searchQuery, detailGroupby);
    const base = buildBasePayload(params, searchFilter);
    const queryObject = {
        metrics,
        columns: [detailGroupby],
        filters: base.filters,
        extras: base.extras,
        granularity: base.granularity,
        time_range: base.timeRange,
        orderby: metrics[0]
            ? [[metrics[0], false]]
            : [],
        row_limit: pageSize + 1,
        row_offset: page * pageSize,
        post_processing: [],
        is_timeseries: false,
    };
    const queryContext = {
        datasource: base.datasource,
        queries: [queryObject],
        result_format: 'json',
        result_type: 'full',
        force: false,
    };
    const response = await core_1.SupersetClient.post({
        endpoint: '/api/v1/chart/data',
        jsonPayload: queryContext,
        signal,
    });
    const rawRows = extractApiRows(response.json);
    const hasNextPage = rawRows.length > pageSize;
    const displayRows = hasNextPage ? rawRows.slice(0, pageSize) : rawRows;
    return {
        rows: displayRows.map(row => mapRow(row, detailGroupby, metricLabels)),
        hasNextPage,
    };
}
/**
 * Точный count детализации для PaginationWrap.
 *
 *   Pattern из scorecard buildCountPayload: GROUP BY detailGroupby без пагинации,
 *   запрашиваем только основную метрику для HAVING != 0 (минимум transfer).
 *   Затем `rows.length` = total non-zero groups.
 *
 *   row_limit 100000 — defensive cap (реалистично детальная колонка <50K уникальных).
 */
async function fetchDetailCount(params) {
    const { detailGroupby, metrics, metricLabels, searchQuery, signal, } = params;
    const searchFilter = buildSearchFilter(searchQuery, detailGroupby);
    const base = buildBasePayload(params, searchFilter);
    // HAVING fact != 0 — фильтруем zero-метрик group'ы (как server-side groups в scorecard)
    const existingHaving = base.extras.having;
    const zeroFilter = `${metricLabels.fact} != 0`;
    const having = existingHaving
        ? `${existingHaving} AND ${zeroFilter}`
        : zeroFilter;
    const queryObject = {
        metrics: [metrics[0]],
        columns: [detailGroupby],
        filters: base.filters,
        extras: { ...base.extras, having },
        granularity: base.granularity,
        time_range: base.timeRange,
        row_limit: 100000,
        post_processing: [],
        is_timeseries: false,
    };
    const queryContext = {
        datasource: base.datasource,
        queries: [queryObject],
        result_format: 'json',
        result_type: 'full',
        force: false,
    };
    const response = await core_1.SupersetClient.post({
        endpoint: '/api/v1/chart/data',
        jsonPayload: queryContext,
        signal,
    });
    const rawRows = extractApiRows(response.json);
    return rawRows.length;
}
/** Получить ярлык метрики (безопасно для undefined). */
function safeMetricLabel(m) {
    if (!m)
        return null;
    try {
        return (0, core_1.getMetricLabel)(m);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=detailApi.js.map