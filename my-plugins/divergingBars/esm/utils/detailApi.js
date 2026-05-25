/**
 * Серверная пагинация магазинов для карточки Velocity Diverging — v2.
 *
 * Стратегия period-over-period:
 *  - preset modes: один query с `time_offsets: [<shift>]`. Backend возвращает
 *    столбцы `<metric>` (текущий) + `<metric>__<shift>` (прошлый). Одна row
 *    на магазин — pagination прямая (row_limit = pageSize+1, row_offset = page*pageSize).
 *  - custom mode: два query с разными `time_range`.
 *
 * Reference: BigNumberPeriodOverPeriod (upstream) и MixedTimeseries.
 */
import { getMetricLabel } from '@superset-ui/core';
import { comparisonModeToShift } from './rowsToStores';
/** Найти метрику по её label-строке. */
function findMetricByLabel(metrics, label) {
    return metrics.find(m => getMetricLabel(m) === label);
}
/**
 * Build payload для подгрузки страницы магазинов.
 *
 * Возвращает (pageSize+1) уникальных магазинов в одной странице.
 * В custom-режиме — два query, frontend сам слит результаты.
 */
export function buildStoresPayload(params) {
    const { queryParams, page, pageSize, sortBy, sortAsc, searchQuery, comparisonMode, customCurrentRange, customPreviousRange, } = params;
    const { codeCol, nameCol, cityCol, formatCol, lossLabel, metrics, timeRange, granularity, filters, extras, datasourceId, datasourceType, } = queryParams;
    const mode = comparisonMode ?? queryParams.comparisonMode ?? 'prev_period';
    const isCustom = mode === 'custom';
    const shift = !isCustom ? comparisonModeToShift(mode) : '';
    // Group-by columns (без weekCol — period-over-period агрегируется backend'ом).
    const columns = [];
    if (codeCol)
        columns.push(codeCol);
    if (nameCol && nameCol !== codeCol)
        columns.push(nameCol);
    if (cityCol)
        columns.push(cityCol);
    if (formatCol)
        columns.push(formatCol);
    // Filters: base + search.
    const searchFilters = [...filters];
    const trimmed = searchQuery.trim();
    if (trimmed) {
        const searchCol = nameCol ?? codeCol;
        if (searchCol) {
            searchFilters.push({ col: searchCol, op: 'ILIKE', val: `%${trimmed}%` });
        }
    }
    // Orderby.
    let orderbyTarget;
    if (sortBy === 'name' && nameCol) {
        orderbyTarget = nameCol;
    }
    else if (lossLabel) {
        const m = findMetricByLabel(metrics, lossLabel);
        orderbyTarget = m ?? lossLabel;
    }
    else {
        orderbyTarget = nameCol ?? codeCol ?? '';
    }
    // Pagination: одна row = один магазин.
    const rowLimit = pageSize + 1;
    const rowOffset = page * pageSize;
    const finalTimeRange = isCustom && customCurrentRange
        ? `${customCurrentRange[0]} : ${customCurrentRange[1]}`
        : timeRange || 'No filter';
    const baseQuery = {
        columns,
        metrics,
        time_range: finalTimeRange,
        granularity,
        filters: searchFilters,
        extras: extras ?? {},
        row_limit: rowLimit,
        row_offset: rowOffset,
        orderby: orderbyTarget ? [[orderbyTarget, sortAsc]] : [],
        post_processing: [],
    };
    // Preset mode: одна query с time_offsets.
    if (!isCustom) {
        return {
            datasource: { id: datasourceId, type: datasourceType },
            queries: [
                {
                    ...baseQuery,
                    time_offsets: shift ? [shift] : [],
                },
            ],
            result_format: 'json',
            result_type: 'full',
        };
    }
    // Custom mode: два query.
    const compTimeRange = customPreviousRange
        ? `${customPreviousRange[0]} : ${customPreviousRange[1]}`
        : timeRange || 'No filter';
    return {
        datasource: { id: datasourceId, type: datasourceType },
        queries: [
            baseQuery,
            {
                ...baseQuery,
                time_range: compTimeRange,
            },
        ],
        result_format: 'json',
        result_type: 'full',
    };
}
/**
 * Build payload для exact-count магазинов. Группируем только по storeCode
 * без недели — получаем минимум данных.
 */
export function buildStoresCountPayload(params) {
    const { queryParams, searchQuery } = params;
    const { codeCol, nameCol, metrics, timeRange, granularity, filters, extras, datasourceId, datasourceType, lossLabel, } = queryParams;
    const groupCol = codeCol ?? nameCol;
    if (!groupCol) {
        return {
            datasource: { id: datasourceId, type: datasourceType },
            queries: [],
            result_format: 'json',
            result_type: 'full',
        };
    }
    const searchFilters = [...filters];
    const trimmed = searchQuery.trim();
    if (trimmed) {
        const searchCol = nameCol ?? codeCol;
        if (searchCol) {
            searchFilters.push({ col: searchCol, op: 'ILIKE', val: `%${trimmed}%` });
        }
    }
    const primaryMetric = lossLabel
        ? findMetricByLabel(metrics, lossLabel) ?? metrics[0]
        : metrics[0];
    return {
        datasource: { id: datasourceId, type: datasourceType },
        queries: [
            {
                columns: [groupCol],
                metrics: primaryMetric ? [primaryMetric] : [],
                time_range: timeRange || 'No filter',
                granularity,
                filters: searchFilters,
                extras: extras ?? {},
                row_limit: 50000,
                post_processing: [],
            },
        ],
        result_format: 'json',
        result_type: 'full',
    };
}
/** Извлечь массив строк из ответа Superset API (queries[0].data). */
export function extractApiRows(json) {
    const resultArr = json.result;
    return resultArr?.[0]?.data ?? [];
}
/** Извлечь второй query (comparison) — для custom-режима. */
export function extractApiCompRows(json) {
    const resultArr = json.result;
    return resultArr?.[1]?.data;
}
//# sourceMappingURL=detailApi.js.map