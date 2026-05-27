import { getMetricLabel } from '@superset-ui/core';
import { getPreset } from '../mocks/presets';
import { DEFAULT_FORMATS } from '../utils/mockGenerator';
import { rowsToStores } from '../utils/rowsToStores';
/**
 * DS 2.0 локализация Superset time_range пресетов в русский subtitle.
 */
function formatTimeRangeRu(tr) {
    if (!tr || tr === 'No filter')
        return 'за период';
    const map = {
        'Last day': 'за день',
        'Last week': 'за неделю',
        'Last month': 'за месяц',
        'Last quarter': 'за квартал',
        'Last year': 'за год',
        Today: 'сегодня',
        'This week': 'за эту неделю',
        'This month': 'за этот месяц',
        'This year': 'за этот год',
        'previous calendar week': 'за прошлую неделю',
        'previous calendar month': 'за прошлый месяц',
        'previous calendar year': 'за прошлый год',
    };
    return map[tr] ?? tr;
}
function detectDarkMode(theme) {
    const bg = theme
        ?.colorBgContainer;
    if (!bg || typeof bg !== 'string' || !bg.startsWith('#'))
        return false;
    const hex = bg.replace('#', '');
    if (hex.length < 6)
        return false;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
function parseFormats(raw) {
    if (!raw || raw.trim().length === 0)
        return DEFAULT_FORMATS;
    try {
        const parsed = JSON.parse(raw);
        const out = Object.entries(parsed).map(([id, cfg]) => ({
            id,
            name: cfg.name ?? id,
            color: cfg.color ?? 'c-sky',
            plan: cfg.plan,
        }));
        return out.length ? out : DEFAULT_FORMATS;
    }
    catch {
        return DEFAULT_FORMATS;
    }
}
function firstString(v) {
    if (typeof v === 'string')
        return v;
    if (Array.isArray(v) && v.length && typeof v[0] === 'string')
        return v[0];
    return undefined;
}
/**
 * Back-compat: legacy `default_horizon` → ComparisonMode.
 *   'wow' → 'prev_week'
 *   '4w'  → 'prev_period' (4 weeks back = inherit для main = 4 weeks)
 *   'mom' → 'prev_month'
 *   'cum' → 'prev_period'
 */
function migrateHorizonToMode(horizon) {
    switch (horizon) {
        case 'wow':
            return 'prev_week';
        case 'mom':
            return 'prev_month';
        case 'cum':
        case '4w':
        default:
            return 'prev_period';
    }
}
function parseRange(raw) {
    if (!raw)
        return undefined;
    const s = String(raw);
    const sep = s.includes(' : ') ? ' : ' : s.includes(',') ? ',' : null;
    if (!sep)
        return undefined;
    const [start, end] = s.split(sep).map(p => p.trim());
    if (!start || !end)
        return undefined;
    return [start, end];
}
export default function transformProps(chartProps) {
    const { formData, queriesData, width, height, theme } = chartProps;
    const isDarkMode = detectDarkMode(theme);
    const headerText = formData.header_text ??
        formData.headerText ??
        'Скорость роста потерь';
    const userSubtitle = formData.subtitle_text ??
        formData.subtitleText;
    const timeRange = formData.time_range ??
        formData.timeRange;
    const subtitleText = userSubtitle?.trim() || '';
    // ── Comparison mode resolution ───────────────────────────
    // 1) Явный new key: default_comparison_mode.
    // 2) Legacy: default_horizon → migrate.
    // 3) Default fallback: 'prev_period'.
    const explicitMode = formData.default_comparison_mode ??
        formData
            .defaultComparisonMode;
    const legacyHorizon = formData.default_horizon ??
        formData.defaultHorizon;
    let defaultComparisonMode = 'prev_period';
    if (explicitMode) {
        defaultComparisonMode = explicitMode;
    }
    else if (legacyHorizon) {
        defaultComparisonMode = migrateHorizonToMode(legacyHorizon);
        // eslint-disable-next-line no-console
        console.warn(`[velocity-diverging] legacy formData.default_horizon='${legacyHorizon}' ` +
            `migrated to default_comparison_mode='${defaultComparisonMode}'. ` +
            `Re-save the chart to use the new control.`);
    }
    const customCurrentRange = parseRange(formData.custom_current_range ??
        formData.customCurrentRange);
    const customPreviousRange = parseRange(formData.custom_previous_range ??
        formData.customPreviousRange);
    const defaultMetric = (formData.default_metric ??
        formData.defaultMetric) ?? 'rub';
    // Кумулятивный блок отключён по запросу — кнопка и view скрыты в UI.
    const showCumulativeView = false;
    const showDetailModal = formData
        .show_detail_modal ??
        formData.showDetailModal ??
        true;
    const showCsvExport = formData
        .show_csv_export ??
        formData.showCsvExport ??
        true;
    const showSummaryStrip = formData
        .show_summary_strip ??
        formData.showSummaryStrip ??
        true;
    const formats = parseFormats(formData
        .format_mapping_json ??
        formData.formatMappingJson);
    const mockModeEnabled = formData
        .mock_mode_enabled ??
        formData.mockModeEnabled ??
        false;
    const pageSizeRaw = formData
        .page_size ??
        formData.pageSize ??
        20;
    const pageSizeParsed = Number(pageSizeRaw);
    const pageSize = Number.isFinite(pageSizeParsed) && pageSizeParsed > 0
        ? Math.min(Math.floor(pageSizeParsed), 500)
        : 20;
    const baseProps = {
        width,
        height,
        headerText,
        subtitleText,
        defaultComparisonMode,
        customCurrentRange,
        customPreviousRange,
        defaultMetric,
        showCumulativeView,
        showDetailModal,
        showCsvExport,
        showSummaryStrip,
        isDarkMode,
        formats,
        theme,
        mockModeEnabled,
        pageSize,
    };
    // ── Mock mode: возвращаем сгенерированные данные, игнорируя queriesData ──
    if (mockModeEnabled) {
        const preset = getPreset(formData.mock_preset ??
            'losses_velocity', defaultComparisonMode);
        return {
            ...baseProps,
            dataState: 'populated',
            stores: preset.stores,
            formats: preset.formats,
        };
    }
    // ── Convert adhoc_filters → simple {col, op, val} + freeform SQL для
    //    серверной пагинации внутри карточки. То же что scorecard. ──
    const fdExt = formData;
    const adhocFilters = (fdExt.adhocFilters ?? fdExt.adhoc_filters ?? []);
    const simpleFilters = [];
    const freeformWhere = [];
    const freeformHaving = [];
    for (const f of adhocFilters) {
        if (f.expressionType === 'SIMPLE') {
            simpleFilters.push({
                col: f.subject,
                op: f.operator,
                val: f.comparator,
            });
        }
        else if (f.expressionType === 'SQL') {
            const sql = `(${f.sqlExpression})`;
            if (f.clause === 'HAVING')
                freeformHaving.push(sql);
            else
                freeformWhere.push(sql);
        }
    }
    const baseExtras = {
        ...(formData.extras ?? {}),
    };
    if (freeformWhere.length > 0)
        baseExtras.where = freeformWhere.join(' AND ');
    if (freeformHaving.length > 0)
        baseExtras.having = freeformHaving.join(' AND ');
    const ds = chartProps.datasource;
    const dsId = ds?.id ??
        chartProps.datasourceId ??
        0;
    const dsType = ds?.type ?? 'table';
    // ── Real data mode ──
    const firstQuery = queriesData?.[0];
    const errMsg = firstQuery?.error || firstQuery?.errorMessage;
    if (errMsg) {
        return {
            ...baseProps,
            dataState: 'error',
            stores: [],
            errorMessage: errMsg,
        };
    }
    const mainRows = firstQuery?.data ?? [];
    // queriesData[1] есть только в custom-режиме (см. buildQuery).
    const compRows = defaultComparisonMode === 'custom'
        ? queriesData?.[1]?.data ?? []
        : undefined;
    if (mainRows.length === 0) {
        return {
            ...baseProps,
            dataState: 'empty',
            stores: [],
        };
    }
    const codeCol = firstString(formData
        .groupby_store_code ??
        formData.groupbyStoreCode);
    const nameCol = firstString(formData
        .groupby_store_name ??
        formData.groupbyStoreName);
    const cityCol = firstString(formData
        .groupby_city ??
        formData.groupbyCity);
    const formatCol = firstString(formData
        .groupby_format ??
        formData.groupbyFormat);
    const weekCol = firstString(formData
        .groupby_week ??
        formData.groupbyWeek);
    const metricLoss = formData.metric_loss ??
        formData.metricLoss;
    const metricTurnover = formData.metric_turnover ??
        formData.metricTurnover;
    const lossLabel = metricLoss ? getMetricLabel(metricLoss) : undefined;
    const turnoverLabel = metricTurnover
        ? getMetricLabel(metricTurnover)
        : undefined;
    // Partial — если не хватает ключевых колонок, предупреждаем.
    const missing = [];
    if (!lossLabel)
        missing.push('метрика потерь');
    if (!codeCol && !nameCol)
        missing.push('код или название магазина');
    const formatsMap = new Map();
    formats.forEach(f => formatsMap.set(f.id, f));
    const stores = rowsToStores(mainRows, {
        codeCol,
        nameCol,
        cityCol,
        formatCol,
        weekCol,
        lossLabel,
        turnoverLabel,
        comparisonMode: defaultComparisonMode,
    }, formatsMap, compRows);
    if (stores.length === 0) {
        return {
            ...baseProps,
            dataState: 'empty',
            stores: [],
        };
    }
    const partialWarning = missing.length
        ? {
            message: `Не хватает колонок: ${missing.join(', ')}. Отображаются частичные данные.`,
        }
        : undefined;
    const queryMetrics = [];
    if (metricLoss)
        queryMetrics.push(metricLoss);
    if (metricTurnover)
        queryMetrics.push(metricTurnover);
    const queryParams = {
        datasourceId: dsId,
        datasourceType: dsType,
        codeCol,
        nameCol,
        cityCol,
        formatCol,
        weekCol,
        lossLabel,
        turnoverLabel,
        metrics: queryMetrics,
        timeRange: fdExt.timeRange ?? fdExt.time_range,
        granularity: fdExt.granularitySqla ?? fdExt.granularity_sqla,
        filters: simpleFilters,
        extras: baseExtras,
        comparisonMode: defaultComparisonMode,
        customCurrentRange,
        customPreviousRange,
    };
    return {
        ...baseProps,
        dataState: partialWarning ? 'partial' : 'populated',
        stores,
        partialWarning,
        queryParams,
    };
}
//# sourceMappingURL=transformProps.js.map