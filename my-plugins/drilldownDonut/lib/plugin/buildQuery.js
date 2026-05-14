"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@superset-ui/core");
/**
 * Build query context для structure-donut.
 *
 * Стратегия: один query с `columns: [categoryCol, subcategoryCol]` и метриками
 * [valueMetric, countMetric?, revenueMetric?]. Client-side группировка в
 * transformProps / groupRows(). Row limit 500.
 *
 * Важный gotcha (см. kpiCard/buildQuery.ts): sharedControls.groupby всегда
 * возвращает массив, даже при multi:false. buildQueryContext может вызвать
 * .toLowerCase() на этих полях → crash если не string. Нормализуем в начале.
 */
function buildQuery(formData) {
    const fd = formData;
    for (const k of [
        'groupby_category',
        'groupby_subcategory',
        'groupbyCategory',
        'groupbySubcategory',
    ]) {
        if (Array.isArray(fd[k])) {
            fd[k] = fd[k][0] ?? undefined;
        }
    }
    return (0, core_1.buildQueryContext)(formData, (baseQueryObject) => {
        const catCol = (fd.groupbyCategory ?? fd.groupby_category);
        const subCol = (fd.groupbySubcategory ?? fd.groupby_subcategory);
        const columns = [];
        if (catCol)
            columns.push(catCol);
        if (subCol)
            columns.push(subCol);
        // Собираем метрики с дедупликацией по label
        const allMetrics = [];
        const seenLabels = new Set();
        const addMetric = (m) => {
            if (!m)
                return;
            const label = typeof m === 'string'
                ? m
                : m.label ?? JSON.stringify(m);
            if (!seenLabels.has(label)) {
                seenLabels.add(label);
                allMetrics.push(m);
            }
        };
        addMetric(formData.valueMetric);
        addMetric(formData.countMetric);
        addMetric(formData.revenueMetric);
        // Mock-mode COUNT(*) fallback — избегаем «Empty query?» если метрики не настроены.
        const isMockOn = fd.mock_mode_enabled ??
            fd.mockModeEnabled ??
            false;
        if (allMetrics.length === 0 && isMockOn) {
            allMetrics.push({
                expressionType: 'SQL',
                sqlExpression: 'COUNT(*)',
                label: '__mock',
            });
        }
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
            metrics: allMetrics,
            columns,
            orderby: allMetrics.length > 0
                ? [[allMetrics[0], false]]
                : [],
            row_limit: 500,
            post_processing: [],
        };
        return [query];
    });
}
exports.default = buildQuery;
//# sourceMappingURL=buildQuery.js.map