"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = buildQuery;
const core_1 = require("@superset-ui/core");
const rowsToStores_1 = require("../utils/rowsToStores");
/**
 * Build query для Velocity Diverging — period-over-period.
 *
 * Стратегия по режимам сравнения:
 *  - preset (prev_period / prev_week / prev_month / prev_quarter / prev_year):
 *      ОДИН query с `time_offsets: [<shift>]`. Backend Superset 6.x сам
 *      делает второй subquery, склеивает по groupby и возвращает в data
 *      колонки `<metricLabel>` (текущий) + `<metricLabel>__<shift>` (прошлый).
 *      Reference: `BigNumberPeriodOverPeriod/buildQuery.ts` (upstream).
 *  - custom: ДВА независимых query через `queries: [main, comp]` — каждый
 *      со своим `time_range`. Backend возвращает result[0]=main, result[1]=comp,
 *      склейка по groupby — на стороне transformProps.
 *
 * В mock-режиме шлём минимальный COUNT(*)-запрос, чтобы Superset не показывал
 * "Empty query?" ошибку.
 */
function pickComparisonMode(fd) {
    // Runtime override от компонента имеет приоритет над default из control panel.
    const runtime = fd.comparison_mode ??
        fd.comparisonMode;
    if (runtime)
        return runtime;
    const def = fd.default_comparison_mode ??
        fd.defaultComparisonMode;
    if (def)
        return def;
    // Back-compat: legacy default_horizon → ближайший mode.
    const legacy = (fd.default_horizon ?? fd.defaultHorizon);
    if (legacy === 'wow')
        return 'prev_week';
    if (legacy === 'mom')
        return 'prev_month';
    // '4w' и 'cum' — оба про «такой же период раньше».
    return 'prev_period';
}
function parseCustomRange(raw) {
    if (!raw)
        return undefined;
    const s = String(raw);
    // Ожидаемые форматы:
    //  - "YYYY-MM-DD : YYYY-MM-DD" (Superset time_range)
    //  - "YYYY-MM-DD,YYYY-MM-DD"
    const sep = s.includes(' : ') ? ' : ' : s.includes(',') ? ',' : null;
    if (!sep)
        return undefined;
    const [start, end] = s.split(sep).map(p => p.trim());
    if (!start || !end)
        return undefined;
    return [start, end];
}
function buildQuery(formData) {
    const fd = formData;
    // Нормализуем groupby-поля.
    const groupbyKeys = [
        'groupby_store_code',
        'groupby_store_name',
        'groupby_city',
        'groupby_format',
        'groupby_week',
        'groupbyStoreCode',
        'groupbyStoreName',
        'groupbyCity',
        'groupbyFormat',
        'groupbyWeek',
    ];
    groupbyKeys.forEach(k => {
        if (Array.isArray(fd[k])) {
            const first = fd[k][0];
            fd[k] = typeof first === 'string' ? first : undefined;
        }
    });
    const comparisonMode = pickComparisonMode(fd);
    const isCustom = comparisonMode === 'custom';
    const shift = !isCustom ? (0, rowsToStores_1.comparisonModeToShift)(comparisonMode) : '';
    // Custom-режим: парсим два диапазона.
    const customCurrent = isCustom
        ? parseCustomRange(fd.custom_current_range ?? fd.customCurrentRange)
        : undefined;
    const customPrevious = isCustom
        ? parseCustomRange(fd.custom_previous_range ?? fd.customPreviousRange)
        : undefined;
    return (0, core_1.buildQueryContext)(formData, baseQueryObject => {
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
        const isMockOn = fd.mock_mode_enabled ??
            fd.mockModeEnabled ??
            false;
        // ── Mock mode: минимальный запрос, данные игнорируются в transformProps ──
        if (isMockOn) {
            return [
                {
                    ...baseFields,
                    metrics: [
                        {
                            expressionType: 'SQL',
                            sqlExpression: 'COUNT(*)',
                            label: '__mock',
                        },
                    ],
                    columns: [],
                    orderby: [],
                    row_limit: 1,
                    post_processing: [],
                },
            ];
        }
        // ── Real data mode ──
        // Columns: только store-grouping (без weekCol — period-over-period
        // агрегируется backend'ом, тренд берётся отдельно при необходимости).
        const columns = [];
        [
            'groupby_store_code',
            'groupby_store_name',
            'groupby_city',
            'groupby_format',
        ].forEach(key => {
            const v = fd[key];
            if (typeof v === 'string' && v.length > 0)
                columns.push(v);
        });
        const metrics = [];
        const metricLoss = fd.metric_loss;
        const metricTurnover = fd.metric_turnover;
        if (metricLoss)
            metrics.push(metricLoss);
        if (metricTurnover)
            metrics.push(metricTurnover);
        // ── Preset mode (включая prev_period): один query с time_offsets ──
        if (!isCustom) {
            return [
                {
                    ...baseFields,
                    metrics,
                    columns,
                    orderby: metricLoss
                        ? [[metricLoss, false]]
                        : [],
                    row_limit: 20000,
                    // Superset 6.x: time_offsets — встроенный параметр для
                    // period-over-period. Backend сам делает второй subquery и
                    // склеивает по groupby-ключу, возвращая в data колонки
                    // `<metric>` и `<metric>__<shift>`.
                    time_offsets: shift ? [shift] : [],
                    post_processing: [],
                },
            ];
        }
        // ── Custom mode: два независимых query ──
        const mainQuery = {
            ...baseFields,
            metrics,
            columns,
            orderby: metricLoss
                ? [[metricLoss, false]]
                : [],
            row_limit: 20000,
            // Если пользователь явно задал custom-current — переопределяем time_range.
            ...(customCurrent
                ? { time_range: `${customCurrent[0]} : ${customCurrent[1]}` }
                : {}),
            time_offsets: [],
            post_processing: [],
        };
        const compQuery = {
            ...baseFields,
            metrics,
            columns,
            orderby: metricLoss
                ? [[metricLoss, false]]
                : [],
            row_limit: 20000,
            time_range: customPrevious
                ? `${customPrevious[0]} : ${customPrevious[1]}`
                : time_range ?? 'No filter',
            time_offsets: [],
            post_processing: [],
        };
        return [mainQuery, compQuery];
    });
}
//# sourceMappingURL=buildQuery.js.map