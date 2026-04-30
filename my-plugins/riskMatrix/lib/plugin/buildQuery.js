"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = buildQuery;
const core_1 = require("@superset-ui/core");
/**
 * Build query для ScatterRisk.
 *
 * Один запрос: groupby=[store, format, city?], metrics=[x, y, size?, plan_x?, plan_y?, sum_loss?].
 * Каждая строка ответа = одна точка на scatter.
 *
 * Сложные фильтры (filters/where/having) передаются из Superset как есть —
 * это обеспечивает cross-filter от других визуалов на дашборде.
 */
function buildQuery(formData) {
    const fd = formData;
    // sharedControls.groupby сохраняет arrays даже при multi:false —
    // нормализуем к scalar (иначе buildQueryContext упадёт на .toLowerCase()).
    const normalizeField = (key, camelKey) => {
        if (Array.isArray(fd[key])) {
            const arr = fd[key];
            fd[key] = arr.length > 0 ? arr[0] : undefined;
        }
        if (Array.isArray(fd[camelKey])) {
            const arr = fd[camelKey];
            fd[camelKey] = arr.length > 0 ? arr[0] : undefined;
        }
    };
    normalizeField('groupby_store', 'groupbyStore');
    normalizeField('groupby_format', 'groupbyFormat');
    normalizeField('groupby_city', 'groupbyCity');
    const groupbyStore = (fd.groupby_store ?? fd.groupbyStore);
    const groupbyFormat = (fd.groupby_format ?? fd.groupbyFormat);
    const groupbyCity = (fd.groupby_city ?? fd.groupbyCity);
    const metricX = (fd.metric_x ?? fd.metricX);
    const metricY = (fd.metric_y ?? fd.metricY);
    const metricSize = (fd.metric_size ?? fd.metricSize);
    const metricPlanX = (fd.metric_plan_x ?? fd.metricPlanX);
    const metricPlanY = (fd.metric_plan_y ?? fd.metricPlanY);
    const metricSumLoss = (fd.metric_sum_loss ?? fd.metricSumLoss);
    return (0, core_1.buildQueryContext)(formData, (baseQueryObject) => {
        const metrics = [];
        const seen = new Set();
        const addMetric = (m) => {
            if (!m)
                return;
            const label = typeof m === 'string'
                ? m
                : m.label ?? JSON.stringify(m);
            if (!seen.has(label)) {
                seen.add(label);
                metrics.push(m);
            }
        };
        addMetric(metricX);
        addMetric(metricY);
        addMetric(metricSize);
        addMetric(metricPlanX);
        addMetric(metricPlanY);
        addMetric(metricSumLoss);
        // Mock mode: пустой COUNT(*) чтобы Superset не ругался
        const isMockOn = fd.mock_mode_enabled ??
            fd.mockModeEnabled ??
            false;
        if (metrics.length === 0 && isMockOn) {
            metrics.push({
                expressionType: 'SQL',
                sqlExpression: 'COUNT(*)',
                label: '__mock',
            });
        }
        const columns = [];
        if (groupbyStore)
            columns.push(groupbyStore);
        if (groupbyFormat && groupbyFormat !== groupbyStore)
            columns.push(groupbyFormat);
        if (groupbyCity && groupbyCity !== groupbyStore && groupbyCity !== groupbyFormat) {
            columns.push(groupbyCity);
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
        const rowLimit = Number(fd.row_limit ?? fd.rowLimit ?? 1000) || 1000;
        const mainQuery = {
            ...baseFields,
            metrics,
            columns,
            orderby: metricSize ? [[metricSize, false]] : [],
            row_limit: rowLimit,
            post_processing: [],
        };
        return [mainQuery];
    });
}
//# sourceMappingURL=buildQuery.js.map