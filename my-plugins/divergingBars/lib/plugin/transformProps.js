"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = transformProps;
const core_1 = require("@superset-ui/core");
const presets_1 = require("../mocks/presets");
const mockGenerator_1 = require("../utils/mockGenerator");
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
        return mockGenerator_1.DEFAULT_FORMATS;
    try {
        const parsed = JSON.parse(raw);
        const out = Object.entries(parsed).map(([id, cfg]) => ({
            id,
            name: cfg.name ?? id,
            color: cfg.color ?? 'c-sky',
            plan: cfg.plan,
        }));
        return out.length ? out : mockGenerator_1.DEFAULT_FORMATS;
    }
    catch {
        return mockGenerator_1.DEFAULT_FORMATS;
    }
}
function firstString(v) {
    if (typeof v === 'string')
        return v;
    if (Array.isArray(v) && v.length && typeof v[0] === 'string')
        return v[0];
    return undefined;
}
/** Группирует плоские строки запроса в Store[] с 12 неделями. */
function rowsToStores(rows, columns, formatsMap) {
    const { codeCol, nameCol, cityCol, formatCol, weekCol, lossLabel, turnoverLabel } = columns;
    // Собираем уникальные недели и сортируем по возрастанию (12 последних берём в конце).
    const weekSet = new Set();
    rows.forEach(r => {
        if (weekCol) {
            const w = r[weekCol];
            if (w != null)
                weekSet.add(String(w));
        }
    });
    const weeksSorted = Array.from(weekSet).sort();
    const weeksToUse = weeksSorted.slice(-12);
    const weekIndex = new Map();
    weeksToUse.forEach((w, i) => weekIndex.set(w, i));
    // Ключ магазина — code, если есть, иначе name+city.
    const storeMap = new Map();
    rows.forEach(r => {
        const code = codeCol ? String(r[codeCol] ?? '') : '';
        const name = nameCol ? String(r[nameCol] ?? '') : code || '—';
        const city = cityCol ? String(r[cityCol] ?? '') : '';
        const formatId = formatCol ? String(r[formatCol] ?? '') : '';
        const weekVal = weekCol ? String(r[weekCol] ?? '') : '';
        const idx = weekIndex.get(weekVal);
        if (idx === undefined)
            return;
        const key = code || `${name}|${city}`;
        let store = storeMap.get(key);
        if (!store) {
            const fmtDef = formatsMap.get(formatId);
            store = {
                id: key,
                code: code || name,
                name,
                shortLabel: name,
                city,
                format: formatId,
                formatName: fmtDef?.name ?? formatId ?? '—',
                plan: fmtDef?.plan ?? 0,
                to: 0,
                weeksRub: new Array(12).fill(0),
                weeksPct: new Array(12).fill(0),
            };
            storeMap.set(key, store);
        }
        const loss = lossLabel ? Number(r[lossLabel] ?? 0) : 0;
        const to = turnoverLabel ? Number(r[turnoverLabel] ?? 0) : 0;
        store.weeksRub[idx] = Number.isFinite(loss) ? loss : 0;
        // % к ТО для этой недели; если ТО = 0, то 0
        const pct = to > 0 ? (loss / to) * 100 : 0;
        store.weeksPct[idx] = +pct.toFixed(2);
        store.to = Math.max(store.to, Number.isFinite(to) ? to : 0);
    });
    return Array.from(storeMap.values());
}
function transformProps(chartProps) {
    const { formData, queriesData, width, height, theme } = chartProps;
    const isDarkMode = detectDarkMode(theme);
    const headerText = formData.header_text ??
        formData.headerText ??
        'Скорость роста потерь';
    const userSubtitle = formData.subtitle_text ??
        formData.subtitleText;
    const timeRange = formData.time_range ??
        formData.timeRange;
    const subtitleText = (userSubtitle?.trim() || formatTimeRangeRu(timeRange));
    const defaultHorizon = (formData.default_horizon ??
        formData.defaultHorizon) ?? '4w';
    const defaultMetric = (formData.default_metric ??
        formData.defaultMetric) ?? 'rub';
    const showCumulativeView = formData
        .show_cumulative_view ??
        formData.showCumulativeView ??
        true;
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
    const baseProps = {
        width,
        height,
        headerText,
        subtitleText,
        defaultHorizon,
        defaultMetric,
        showCumulativeView,
        showDetailModal,
        showCsvExport,
        showSummaryStrip,
        isDarkMode,
        formats,
        theme,
        mockModeEnabled,
    };
    // ── Mock mode: возвращаем сгенерированные данные, игнорируя queriesData ──
    if (mockModeEnabled) {
        const preset = (0, presets_1.getPreset)(formData.mock_preset ??
            'losses_velocity');
        return {
            ...baseProps,
            dataState: 'populated',
            stores: preset.stores,
            formats: preset.formats,
        };
    }
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
    const rows = firstQuery?.data ?? [];
    if (rows.length === 0) {
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
    const lossLabel = metricLoss ? (0, core_1.getMetricLabel)(metricLoss) : undefined;
    const turnoverLabel = metricTurnover
        ? (0, core_1.getMetricLabel)(metricTurnover)
        : undefined;
    // Partial — если не хватает ключевых колонок, предупреждаем.
    const missing = [];
    if (!weekCol)
        missing.push('неделя');
    if (!lossLabel)
        missing.push('метрика потерь');
    if (!codeCol && !nameCol)
        missing.push('код или название магазина');
    const formatsMap = new Map();
    formats.forEach(f => formatsMap.set(f.id, f));
    const stores = rowsToStores(rows, {
        codeCol,
        nameCol,
        cityCol,
        formatCol,
        weekCol,
        lossLabel,
        turnoverLabel,
    }, formatsMap);
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
    return {
        ...baseProps,
        dataState: partialWarning ? 'partial' : 'populated',
        stores,
        partialWarning,
    };
}
//# sourceMappingURL=transformProps.js.map