import { buildQueryContext, } from '@superset-ui/core';
/**
 * Дефолтные имена колонок/метрик в dataset. Перекрываются через controlPanel overrides.
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
            /* ── Колонки (override → fallback на дефолтное имя) ── */
            const seenCols = new Set();
            const pushCol = (v, fallback) => {
                const val = v && v.trim() ? v.trim() : fallback;
                if (val && !seenCols.has(val)) {
                    seenCols.add(val);
                    columns.push(val);
                }
            };
            pushCol(getFormDataValue(fd, 'storeIdCol', 'store_id_col'), BUILD_QUERY_DEFAULTS.storeIdCol);
            pushCol(getFormDataValue(fd, 'storeNameCol', 'store_name_col'), BUILD_QUERY_DEFAULTS.storeNameCol);
            pushCol(getFormDataValue(fd, 'cityCol', 'city_col'), BUILD_QUERY_DEFAULTS.cityCol);
            pushCol(getFormDataValue(fd, 'formatCol', 'format_col'), BUILD_QUERY_DEFAULTS.formatCol);
            pushCol(getFormDataValue(fd, 'formatNameCol', 'format_name_col'), BUILD_QUERY_DEFAULTS.formatNameCol);
            pushCol(getFormDataValue(fd, 'divisionCol', 'division_col'), BUILD_QUERY_DEFAULTS.divisionCol);
            pushCol(getFormDataValue(fd, 'toClassCol', 'to_class_col'), BUILD_QUERY_DEFAULTS.toClassCol);
            /* ── Метрики ── */
            const seenMetrics = new Set();
            const pushMetric = (m, fallback) => {
                const val = m && m.trim() ? m.trim() : fallback;
                if (val && !seenMetrics.has(val)) {
                    seenMetrics.add(val);
                    metrics.push(val);
                }
            };
            pushMetric(getFormDataValue(fd, 'writeoffMetric', 'writeoff_metric'), BUILD_QUERY_DEFAULTS.writeoffMetric);
            pushMetric(getFormDataValue(fd, 'shrinkageMetric', 'shrinkage_metric'), BUILD_QUERY_DEFAULTS.shrinkageMetric);
            pushMetric(getFormDataValue(fd, 'planWriteoffMetric', 'plan_writeoff_metric'), BUILD_QUERY_DEFAULTS.planWriteoffMetric);
            pushMetric(getFormDataValue(fd, 'planShrinkageMetric', 'plan_shrinkage_metric'), BUILD_QUERY_DEFAULTS.planShrinkageMetric);
            pushMetric(getFormDataValue(fd, 'avgWriteoffMetric', 'avg_writeoff_metric'), BUILD_QUERY_DEFAULTS.avgWriteoffMetric);
            pushMetric(getFormDataValue(fd, 'avgShrinkageCheckMetric', 'avg_shrinkage_check_metric'), BUILD_QUERY_DEFAULTS.avgShrinkageCheckMetric);
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