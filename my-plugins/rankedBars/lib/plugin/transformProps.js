"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = transformProps;
const core_1 = require("@superset-ui/core");
const icons_1 = require("../utils/icons");
const colors_1 = require("../utils/colors");
const presets_1 = require("../mocks/presets");
// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function asNumberOrNull(raw) {
    if (raw == null)
        return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}
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
function getFirstGroupbyCol(formData) {
    const g = formData.groupby;
    if (Array.isArray(g)) {
        const first = g[0];
        return typeof first === 'string' ? first : null;
    }
    return typeof g === 'string' ? g : null;
}
function getColumnName(col) {
    if (typeof col === 'string')
        return col;
    if (col && typeof col === 'object' && 'label' in col) {
        return col.label ?? null;
    }
    return null;
}
/**
 * Returns a new array with `sharePct`, `sharePrevPct`, and `deltaPP` filled in.
 * Pure — does not mutate the input.
 */
function computeShareAndDelta(rows) {
    const totalCurrent = rows.reduce((s, r) => s + (r.value || 0), 0);
    const totalPrev = rows.reduce((s, r) => s + (r.valuePrev != null ? r.valuePrev : 0), 0);
    if (totalCurrent <= 0) {
        return rows.map(r => ({
            ...r,
            sharePct: 0,
            sharePrevPct: r.valuePrev != null ? 0 : null,
            deltaPP: 0,
        }));
    }
    return rows.map(r => {
        const sharePct = (r.value / totalCurrent) * 100;
        let sharePrevPct = null;
        let deltaPP = 0;
        if (r.valuePrev != null && totalPrev > 0) {
            sharePrevPct = (r.valuePrev / totalPrev) * 100;
            deltaPP = sharePct - sharePrevPct;
        }
        return { ...r, sharePct, sharePrevPct, deltaPP };
    });
}
/**
 * Group time-series sparkline query into a map keyed by dimension id.
 * Returns last 8 values per dimension to match ref prototype width.
 */
function buildSparklineMap(sparkData, groupbyCol, metricLabel) {
    const map = new Map();
    if (!sparkData || !groupbyCol)
        return map;
    for (const row of sparkData) {
        const key = String(row[groupbyCol] ?? '');
        if (!key)
            continue;
        const val = asNumberOrNull(row[metricLabel]);
        if (val == null)
            continue;
        const bucket = map.get(key);
        if (bucket) {
            bucket.push(val);
        }
        else {
            map.set(key, [val]);
        }
    }
    // Trim each series to last 8 points.
    map.forEach((arr, k) => {
        if (arr.length > 8) {
            map.set(k, arr.slice(arr.length - 8));
        }
    });
    return map;
}
function mapPresetToRows(preset, customJson) {
    let base;
    if (preset === 'expenses') {
        base = presets_1.EXPENSES_PRESET.map(r => ({ ...r, spark: [...r.spark] }));
    }
    else if (preset === 'custom') {
        base = (0, presets_1.parseCustomMockJson)(customJson);
    }
    else {
        base = presets_1.LOSSES_PRESET.map(r => ({ ...r, spark: [...r.spark] }));
    }
    return computeShareAndDelta(base);
}
// ─────────────────────────────────────────────────────────────────────────────
// Main transform
// ─────────────────────────────────────────────────────────────────────────────
function transformProps(chartProps) {
    const { width, height, formData: rawFormData, queriesData = [], hooks, filterState, theme, } = chartProps;
    const formData = rawFormData;
    const queries = queriesData;
    const primary = queries[0];
    const sparkQuery = queries[1];
    // ── Defaults ──────────────────────────────────────────────────────────────
    const defaultUnit = formData.defaultUnit ?? 'rub';
    const defaultSort = formData.defaultSort ?? 'sum';
    const topNVisible = Math.max(3, Math.min(15, formData.topNVisible ?? 5));
    const invertDeltaGood = formData.invertDeltaGood ?? true;
    const headerText = formData.headerText ?? 'Рейтинг';
    // Если headerSubtitlePrefix не задан явно — берём активный time_range и
    // переводим в русский («Last year» → «за год»). DS 2.0 канон.
    const userSubtitle = formData.headerSubtitlePrefix;
    const fdRec = formData;
    const headerSubtitlePrefix = userSubtitle?.trim() ||
        formatTimeRangeRu(fdRec['time_range'] ??
            fdRec['timeRange']) ||
        'Топ по сумме';
    const showSparkline = formData.showSparkline ?? true;
    const showTotalInHeader = formData.showTotalInHeader ?? true;
    const showGhostPrevBar = formData.showGhostPrevBar ?? true;
    const showHoverTooltip = formData.showHoverTooltip ?? true;
    const unitSuffixRub = formData.unitSuffixRub ?? 'млн ₽';
    const decimalsValue = formData.decimalsValue ?? 1;
    const decimalsDelta = formData.decimalsDelta ?? 2;
    const decimalsShare = formData.decimalsShare ?? 1;
    const enableDrillModal = formData.enableDrillModal ?? true;
    const enableAllItemsModal = formData.enableAllItemsModal ?? true;
    const enableCrossFilter = formData.enableCrossFilter ?? true;
    // ── Mock mode short-circuit ──────────────────────────────────────────────
    if (formData.mockModeEnabled) {
        const mockRows = mapPresetToRows(formData.mockPreset ?? 'losses', formData.mockCustomJson);
        const total = mockRows.reduce((s, r) => s + r.value, 0);
        return {
            width,
            height,
            dataState: mockRows.length > 0 ? 'populated' : 'empty',
            rows: mockRows,
            totalSum: total,
            headerText,
            headerSubtitlePrefix,
            showTotalInHeader,
            showSparkline,
            showGhostPrevBar,
            showHoverTooltip,
            invertDeltaGood,
            defaultSort,
            defaultUnit,
            topNVisible,
            unitSuffixRub,
            decimalsValue,
            decimalsDelta,
            decimalsShare,
            enableDrillModal,
            enableAllItemsModal,
            enableCrossFilter: false,
            hasPrevMetric: true,
            drillQueryParams: null,
            setDataMask: hooks?.setDataMask,
            filterState,
            isMockMode: true,
            themeMode: inferThemeMode(theme),
        };
    }
    // ── Extract query metadata ───────────────────────────────────────────────
    const metric = formData.metric;
    const groupbyCol = getFirstGroupbyCol(formData);
    if (!metric) {
        return buildEmptyProps('empty', 'Выберите основную метрику в разделе «Запрос»');
    }
    if (!groupbyCol) {
        return buildEmptyProps('empty', 'Выберите измерение в разделе «Запрос»');
    }
    const subCol = getColumnName(formData.subColumn);
    const iconCol = getColumnName(formData.iconColumn);
    const colorCol = getColumnName(formData.colorColumn);
    const nameCol = getColumnName(formData.nameColumn) ?? groupbyCol;
    const metricLabel = (0, core_1.getMetricLabel)(metric);
    const metricPrevLabel = formData.metricPrev
        ? (0, core_1.getMetricLabel)(formData.metricPrev)
        : null;
    const hasPrevMetric = metricPrevLabel != null;
    // ── Handle error state ───────────────────────────────────────────────────
    const errorMessage = primary?.error_message ?? undefined;
    if (errorMessage) {
        return buildEmptyProps('error', errorMessage);
    }
    // ── Handle loading / empty states ────────────────────────────────────────
    const rawRows = (primary?.data ?? []);
    const sparkMap = showSparkline
        ? buildSparklineMap(sparkQuery?.data, groupbyCol, metricLabel)
        : new Map();
    const rawMappedRows = rawRows
        .map((row, idx) => {
        const id = row[groupbyCol];
        if (id == null)
            return null;
        const idStr = String(id);
        const value = asNumberOrNull(row[metricLabel]);
        if (value == null)
            return null;
        const valuePrev = metricPrevLabel
            ? asNumberOrNull(row[metricPrevLabel])
            : null;
        const displayName = nameCol && nameCol !== groupbyCol
            ? String(row[nameCol] ?? idStr)
            : idStr;
        const sub = subCol ? String(row[subCol] ?? '') : '';
        const iconName = (0, icons_1.resolveIcon)(iconCol ? row[iconCol] : undefined);
        const colorToken = (0, colors_1.normalizeColorToken)(colorCol ? row[colorCol] : undefined, idx);
        const spark = sparkMap.get(idStr) ?? [];
        return {
            id: idStr,
            name: displayName,
            sub,
            iconName,
            colorToken,
            value,
            valuePrev,
            sharePct: 0,
            sharePrevPct: null,
            deltaPP: 0,
            spark,
        };
    })
        .filter((r) => r !== null);
    const rows = computeShareAndDelta(rawMappedRows);
    const totalSum = rows.reduce((s, r) => s + r.value, 0);
    /* DS 2.0 §06 «Состояния»: empty / partial / stale / populated.
       - empty: нет строк
       - partial: меньше строк чем requested topN ИЛИ бэкенд отверг фильтры
       - stale: данные пришли из кеша (приоритет ниже partial)
       - populated: всё хорошо.
       'loading' и 'error' приходят отдельно через chartStatus prop. */
    let dataState;
    if (rows.length === 0) {
        dataState = 'empty';
    }
    else if (rows.length < topNVisible ||
        (primary?.rejected_filters
            ?.length ?? 0) > 0) {
        dataState = 'partial';
    }
    else if (primary?.is_cached) {
        dataState = 'stale';
    }
    else {
        dataState = 'populated';
    }
    // ── Build drill query params ─────────────────────────────────────────────
    const drillQueryParams = enableDrillModal
        ? {
            datasource: formData.datasource,
            groupbyCol,
            storeDim: getColumnName(formData.storeDim) ?? undefined,
            skuDim: getColumnName(formData.skuDim) ?? undefined,
            metric,
            timeRange: formData.timeRange,
            adhocFilters: formData.adhocFilters,
            detailTopN: formData.detailTopN ?? 5,
        }
        : null;
    return {
        width,
        height,
        dataState,
        rows,
        totalSum,
        headerText,
        headerSubtitlePrefix,
        showTotalInHeader,
        showSparkline,
        showGhostPrevBar: showGhostPrevBar && hasPrevMetric,
        showHoverTooltip,
        invertDeltaGood,
        defaultSort,
        defaultUnit,
        topNVisible,
        unitSuffixRub,
        decimalsValue,
        decimalsDelta,
        decimalsShare,
        enableDrillModal,
        enableAllItemsModal,
        enableCrossFilter,
        hasPrevMetric,
        drillQueryParams,
        setDataMask: hooks?.setDataMask,
        filterState,
        isMockMode: false,
        themeMode: inferThemeMode(theme),
    };
    // ── Inline helpers ───────────────────────────────────────────────────────
    function buildEmptyProps(state, message) {
        return {
            width,
            height,
            dataState: state,
            errorMessage: message,
            rows: [],
            totalSum: 0,
            headerText,
            headerSubtitlePrefix,
            showTotalInHeader,
            showSparkline,
            showGhostPrevBar,
            showHoverTooltip,
            invertDeltaGood,
            defaultSort,
            defaultUnit,
            topNVisible,
            unitSuffixRub,
            decimalsValue,
            decimalsDelta,
            decimalsShare,
            enableDrillModal,
            enableAllItemsModal,
            enableCrossFilter,
            hasPrevMetric,
            drillQueryParams: null,
            setDataMask: hooks?.setDataMask,
            filterState,
            isMockMode: false,
            themeMode: inferThemeMode(theme),
        };
    }
}
function inferThemeMode(theme) {
    if (theme && typeof theme === 'object') {
        const maybeDark = theme.isDark;
        if (typeof maybeDark === 'boolean')
            return maybeDark ? 'dark' : 'light';
        const mode = theme.mode;
        if (mode === 'dark')
            return 'dark';
    }
    return 'light';
}
//# sourceMappingURL=transformProps.js.map