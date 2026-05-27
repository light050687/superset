import { buildQueryContext, getMetricLabel, } from '@superset-ui/core';
/**
 * Дефолтные имена колонок/метрик в dataset. Используются как fallback,
 * если D&D-поле в controlPanel оставлено пустым.
 *
 * В DsData: поля приходят и как snake_case (оригинал), и как camelCase
 * (авто-конверсия Superset через lodash). Читаем оба варианта.
 */
export const BUILD_QUERY_DEFAULTS = {
    storeIdCol: 'store_id',
    storeNameCol: 'store_name',
    cityCol: 'city',
    formatCol: 'format',
    formatNameCol: 'format_name',
    divisionCol: 'division',
    toClassCol: 'to_class',
    writeoffMetric: 'writeoff_pct',
    shrinkageMetric: 'shrinkage_pct',
    planWriteoffMetric: 'plan_writeoff_pct',
    planShrinkageMetric: 'plan_shrinkage_pct',
    avgWriteoffMetric: 'avg_writeoff_rub',
    avgShrinkageCheckMetric: 'avg_shrinkage_check_rub',
};
/**
 * Вернёт значение formData по ключу, читая и snake_case, и camelCase вариант.
 * Нужно потому, что Superset иногда конвертирует, иногда — нет.
 */
function getFormDataValue(formData, camelCaseKey, snakeCaseKey) {
    return (formData[camelCaseKey] ?? formData[snakeCaseKey]);
}
/**
 * Резолв D&D-column-zone в строку имени столбца.
 * D&D отдаёт массив (multi=false → массив с одним элементом) либо строку.
 * Возвращает fallback если zone пустой.
 */
function resolveColumn(fd, camelKey, snakeKey, fallback, legacyTextKey) {
    const v = getFormDataValue(fd, camelKey, snakeKey);
    if (Array.isArray(v) && v.length > 0) {
        const first = v[0];
        if (typeof first === 'string' && first.trim())
            return first.trim();
        if (first && typeof first === 'object' && 'label' in first) {
            const lbl = first.label;
            if (lbl && lbl.trim())
                return lbl.trim();
        }
    }
    if (typeof v === 'string' && v.trim())
        return v.trim();
    // legacy text-override fallback (для backward compat со старыми saved charts)
    if (legacyTextKey) {
        const legacy = getFormDataValue(fd, legacyTextKey.camel, legacyTextKey.snake);
        if (legacy && legacy.trim())
            return legacy.trim();
    }
    return fallback;
}
/**
 * Резолв D&D-metric-zone в строку имени метрики (label).
 * Может быть строкой (saved metric), либо объектом AdhocMetric с .label.
 */
function resolveMetric(fd, camelKey, snakeKey, fallback, legacyTextKey) {
    const v = getFormDataValue(fd, camelKey, snakeKey);
    if (v) {
        if (typeof v === 'string' && v.trim())
            return v.trim();
        const lbl = getMetricLabel(v);
        if (lbl && lbl.trim())
            return lbl.trim();
    }
    if (legacyTextKey) {
        const legacy = getFormDataValue(fd, legacyTextKey.camel, legacyTextKey.snake);
        if (legacy && legacy.trim())
            return legacy.trim();
    }
    return fallback;
}
/**
 * Резолв D&D-metric-zone в QueryFormMetric (для отправки в БД).
 * Если выбрана adhoc/saved-метрика — возвращаем как есть. Если пусто — строка-имя (fallback).
 */
function resolveMetricForQuery(fd, camelKey, snakeKey, fallback, legacyTextKey) {
    const v = getFormDataValue(fd, camelKey, snakeKey);
    if (v && (typeof v === 'object' || (typeof v === 'string' && v.trim()))) {
        return v;
    }
    if (legacyTextKey) {
        const legacy = getFormDataValue(fd, legacyTextKey.camel, legacyTextKey.snake);
        if (legacy && legacy.trim())
            return legacy.trim();
    }
    return fallback;
}
/** Public helper — те же resolvers экспортируем для transformProps. */
export const resolvers = { resolveColumn, resolveMetric };
/**
 * Собирает запрос к dataset.
 *
 * columns — набор dimensions, которые таблица рисует в колонке «Магазин».
 * metrics — все % и ₽, которые рендерятся в bullet/dual/number cells.
 *
 * Если mock_mode_enabled = true, отправляем безопасный COUNT(*) fallback —
 * чтобы Superset не упал с "Empty query?" при отсутствии реальных метрик.
 * Результат такого запроса игнорируется в transformProps.
 */
export default function buildQuery(formData) {
    const fd = formData;
    const isMockOn = (getFormDataValue(fd, 'mockModeEnabled', 'mock_mode_enabled') ??
        false) === true;
    return buildQueryContext(formData, baseQueryObject => {
        const columns = [];
        const metrics = [];
        if (isMockOn) {
            /* Mock-режим: transformProps игнорирует queriesData и генерирует Store[]
               из пресета. Отправляем минимальный safe-запрос — без реальных колонок,
               чтобы Superset не падал на валидации schema, если в датасете нет
               store_id / writeoff_pct / ... (типичный случай при первом подключении
               к чужому датасету для согласования дизайна). */
            metrics.push({
                expressionType: 'SQL',
                sqlExpression: 'COUNT(*)',
                label: '__mock',
            });
        }
        else {
            /* ── Колонки (D&D zone → legacy text-override → дефолт) ── */
            const seenCols = new Set();
            const pushCol = (val) => {
                if (val && !seenCols.has(val)) {
                    seenCols.add(val);
                    columns.push(val);
                }
            };
            pushCol(resolveColumn(fd, 'groupbyStoreId', 'groupby_store_id', BUILD_QUERY_DEFAULTS.storeIdCol, { camel: 'storeIdCol', snake: 'store_id_col' }));
            pushCol(resolveColumn(fd, 'groupbyStoreName', 'groupby_store_name', BUILD_QUERY_DEFAULTS.storeNameCol, { camel: 'storeNameCol', snake: 'store_name_col' }));
            pushCol(resolveColumn(fd, 'groupbyCity', 'groupby_city', BUILD_QUERY_DEFAULTS.cityCol, { camel: 'cityCol', snake: 'city_col' }));
            pushCol(resolveColumn(fd, 'groupbyFormat', 'groupby_format', BUILD_QUERY_DEFAULTS.formatCol, { camel: 'formatCol', snake: 'format_col' }));
            pushCol(resolveColumn(fd, 'groupbyFormatName', 'groupby_format_name', BUILD_QUERY_DEFAULTS.formatNameCol, { camel: 'formatNameCol', snake: 'format_name_col' }));
            pushCol(resolveColumn(fd, 'groupbyDivision', 'groupby_division', BUILD_QUERY_DEFAULTS.divisionCol, { camel: 'divisionCol', snake: 'division_col' }));
            pushCol(resolveColumn(fd, 'groupbyToClass', 'groupby_to_class', BUILD_QUERY_DEFAULTS.toClassCol, { camel: 'toClassCol', snake: 'to_class_col' }));
            /* ── Метрики (D&D zone → legacy text-override → дефолт) ── */
            const seenMetricLabels = new Set();
            const pushMetric = (camel, snake, fallback, legacy) => {
                const m = resolveMetricForQuery(fd, camel, snake, fallback, legacy);
                const lbl = typeof m === 'string' ? m : getMetricLabel(m) ?? '';
                if (lbl && !seenMetricLabels.has(lbl)) {
                    seenMetricLabels.add(lbl);
                    metrics.push(m);
                }
            };
            pushMetric('metricWriteoff', 'metric_writeoff', BUILD_QUERY_DEFAULTS.writeoffMetric, { camel: 'writeoffMetric', snake: 'writeoff_metric' });
            pushMetric('metricShrinkage', 'metric_shrinkage', BUILD_QUERY_DEFAULTS.shrinkageMetric, { camel: 'shrinkageMetric', snake: 'shrinkage_metric' });
            pushMetric('metricPlanWriteoff', 'metric_plan_writeoff', BUILD_QUERY_DEFAULTS.planWriteoffMetric, { camel: 'planWriteoffMetric', snake: 'plan_writeoff_metric' });
            pushMetric('metricPlanShrinkage', 'metric_plan_shrinkage', BUILD_QUERY_DEFAULTS.planShrinkageMetric, { camel: 'planShrinkageMetric', snake: 'plan_shrinkage_metric' });
            pushMetric('metricAvgWriteoff', 'metric_avg_writeoff', BUILD_QUERY_DEFAULTS.avgWriteoffMetric, { camel: 'avgWriteoffMetric', snake: 'avg_writeoff_metric' });
            pushMetric('metricAvgShrinkageCheck', 'metric_avg_shrinkage_check', BUILD_QUERY_DEFAULTS.avgShrinkageCheckMetric, { camel: 'avgShrinkageCheckMetric', snake: 'avg_shrinkage_check_metric' });
        }
        const { time_range, since, until, granularity, filters, extras, applied_time_extras, where, having, annotation_layers, url_params, custom_params, } = baseQueryObject;
        const rowLimit = (getFormDataValue(fd, 'rowLimit', 'row_limit') ?? 1000) || 1000;
        /* orderby — только если есть первая метрика и не __mock */
        const firstMetric = metrics.find(m => typeof m !== 'object' || m.label !== '__mock');
        const orderby = firstMetric
            ? [[firstMetric, false /* DESC */]]
            : [];
        return [
            {
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
                columns,
                metrics,
                row_limit: rowLimit,
                orderby,
                post_processing: [],
            },
        ];
    });
}
//# sourceMappingURL=buildQuery.js.map