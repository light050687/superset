"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = transformProps;
const core_1 = require("@superset-ui/core");
const pivotReshape_1 = require("../utils/pivotReshape");
const lossesPreset_1 = require("../mocks/lossesPreset");
function firstValue(v) {
    if (v == null)
        return undefined;
    return Array.isArray(v) ? v[0] : v;
}
function resolveColumnName(col) {
    if (!col)
        return '';
    if (typeof col === 'string')
        return col;
    return (0, core_1.getColumnLabel)(col);
}
function resolveMetricLabel(m) {
    if (!m)
        return '';
    return (0, core_1.getMetricLabel)(m);
}
function buildMockProps(props, thresholds, fd, overrides = {}) {
    const mockCells = (0, lossesPreset_1.buildMockCells)();
    const cells = new Map();
    mockCells.forEach((v, k) => {
        cells.set(k, {
            rowId: v.rowId,
            colId: v.colId,
            value: v.value,
            plan: v.plan,
            ratio: v.ratio,
            pct: v.pct,
            planPct: v.planPct,
            revenue: v.revenue,
            shops: v.shops,
        });
    });
    const rowTotals = new Map();
    const colTotals = new Map();
    lossesPreset_1.MOCK_ROWS.forEach((r) => rowTotals.set(r.id, buildEmptySlice()));
    lossesPreset_1.MOCK_COLS.forEach((c) => colTotals.set(c.id, buildEmptySlice()));
    let gf = 0;
    let gp = 0;
    let gr = 0;
    cells.forEach((c) => {
        const rt = rowTotals.get(c.rowId);
        const ct = colTotals.get(c.colId);
        if (rt) {
            rt.fact += c.value;
            if (c.plan != null)
                rt.plan = (rt.plan ?? 0) + c.plan;
            if (c.revenue != null)
                rt.revenue = (rt.revenue ?? 0) + c.revenue;
        }
        if (ct) {
            ct.fact += c.value;
            if (c.plan != null)
                ct.plan = (ct.plan ?? 0) + c.plan;
            if (c.revenue != null)
                ct.revenue = (ct.revenue ?? 0) + c.revenue;
        }
        gf += c.value;
        if (c.plan != null)
            gp += c.plan;
        if (c.revenue != null)
            gr += c.revenue;
    });
    rowTotals.forEach((s) => {
        s.ratio = s.plan && s.plan !== 0 ? s.fact / s.plan : null;
        s.pct = s.revenue && s.revenue !== 0 ? (s.fact / s.revenue) * 100 : null;
    });
    colTotals.forEach((s) => {
        s.ratio = s.plan && s.plan !== 0 ? s.fact / s.plan : null;
        s.pct = s.revenue && s.revenue !== 0 ? (s.fact / s.revenue) * 100 : null;
    });
    const hooks = (props.hooks ?? {});
    return {
        width: props.width,
        height: props.height,
        formData: fd,
        rowAxisLabel: overrides.rowAxisLabel ?? 'Формат',
        colAxisLabel: overrides.colAxisLabel ?? 'Дивизион',
        rows: lossesPreset_1.MOCK_ROWS,
        cols: lossesPreset_1.MOCK_COLS,
        cells,
        rowTotals,
        colTotals,
        grandTotal: {
            fact: gf,
            plan: gp || null,
            ratio: gp !== 0 ? gf / gp : null,
            revenue: gr || null,
            pct: gr !== 0 ? (gf / gr) * 100 : null,
        },
        thresholds,
        defaultUnit: fd.defaultUnit ?? 'abs',
        unitSuffix: fd.unitSuffix ?? 'млн ₽',
        decimals: fd.decimals ?? 1,
        autoFormatRussian: fd.autoFormatRussian ?? true,
        showTotalsDefault: fd.showTotals ?? false,
        headerText: fd.headerText ?? 'Уровень потерь по форматам',
        headerSubtitle: overrides.subtitle ??
            fd.headerSubtitle ??
            'Форматы × Дивизион · за год · демо-данные',
        emitFilter: false, // mock mode doesn't emit cross-filters
        setDataMask: hooks.setDataMask,
        drillQueryParams: null,
        mockMode: true,
        dataState: 'populated',
    };
}
function buildEmptySlice() {
    return { fact: 0, plan: 0, ratio: null, revenue: 0, pct: null };
}
function transformProps(chartProps) {
    const props = chartProps;
    const { width, height, formData, queriesData, hooks } = props;
    const fd = formData;
    const thresholds = {
        ok: Number(fd.thresholdOk ?? 1.0),
        wn: Number(fd.thresholdWn ?? 1.3),
        polarity: (fd.valuePolarity ?? 'higher_is_worse'),
    };
    const fdRec = fd;
    // ── Mock mode short-circuit ──
    // Read both snake_case (raw) and camelCase (post-lodash) — Superset is inconsistent:
    // some controls (esp. CheckboxControl) sometimes leak through with snake_case keys.
    const mockOn = Boolean(fdRec.mockModeEnabled ?? fdRec.mock_mode_enabled ?? false);
    if (mockOn) {
        return buildMockProps(props, thresholds, fd);
    }
    const rowAxisRaw = firstValue((fd.rowAxis ?? fdRec.row_axis));
    const colAxisRaw = firstValue((fd.colAxis ?? fdRec.col_axis));
    const breakdownRaw = firstValue((fd.breakdownDim ?? fdRec.breakdown_dim));
    const rowAxisCol = resolveColumnName(rowAxisRaw);
    const colAxisCol = resolveColumnName(colAxisRaw);
    const valueLabel = resolveMetricLabel(fd.valueMetric);
    const planLabel = resolveMetricLabel(fd.planMetric);
    const revenueLabel = resolveMetricLabel(fd.revenueMetric);
    const shopsLabel = resolveMetricLabel(fd.shopsMetric);
    const rawData = queriesData?.[0]?.data ?? [];
    // Second-level mock fallback: when the chart isn't fully configured yet,
    // show the design preset so the user immediately sees what the viz looks like.
    // This prevents the "blank chart" experience right after adding a new viz.
    if (!rowAxisCol || !colAxisCol || !valueLabel) {
        return buildMockProps(props, thresholds, fd, {
            subtitle: 'Демо-данные · выберите оси и метрику или включите режим проектирования',
            rowAxisLabel: rowAxisCol || 'Формат',
            colAxisLabel: colAxisCol || 'Дивизион',
        });
    }
    let dataState = 'populated';
    let errorMessage;
    if (rawData.length === 0) {
        dataState = 'empty';
    }
    const reshape = (0, pivotReshape_1.reshapePivot)({
        data: rawData,
        rowAxisCol,
        colAxisCol,
        valueKey: valueLabel,
        planKey: planLabel || null,
        revenueKey: revenueLabel || null,
        shopsKey: shopsLabel || null,
    });
    // Axis names fallback to column name
    const rows = reshape.rows;
    const cols = reshape.cols;
    const setDataMask = hooks?.setDataMask;
    const emitCrossFilters = fdRec.emitCrossFilters ?? false;
    const emitFilter = Boolean(fd.emitFilter && emitCrossFilters);
    const datasource = props.datasource ?? {};
    // Drill query params — collected once and reused by DrillModal / CompareModal
    const drillQueryParams = datasource.id && datasource.type && rowAxisCol && colAxisCol && fd.valueMetric
        ? {
            datasourceId: datasource.id,
            datasourceType: datasource.type,
            rowAxisCol,
            colAxisCol,
            breakdownCol: resolveColumnName(breakdownRaw) || null,
            valueMetric: fd.valueMetric,
            valueMetricLabel: valueLabel,
            timeRange: fdRec.timeRange ??
                fdRec.time_range ??
                'No filter',
            filters: fdRec.filters ?? [],
            extras: fdRec.extras ?? {},
        }
        : null;
    return {
        width,
        height,
        formData: fd,
        rowAxisLabel: rowAxisCol || 'Строки',
        colAxisLabel: colAxisCol || 'Колонки',
        rows,
        cols,
        cells: reshape.cells,
        rowTotals: reshape.rowTotals,
        colTotals: reshape.colTotals,
        grandTotal: reshape.grandTotal,
        thresholds,
        defaultUnit: fd.defaultUnit ?? 'abs',
        unitSuffix: fd.unitSuffix ?? '',
        decimals: fd.decimals ?? 1,
        autoFormatRussian: fd.autoFormatRussian ?? true,
        showTotalsDefault: fd.showTotals ?? false,
        headerText: fd.headerText ?? 'Heatmap Pivot',
        headerSubtitle: fd.headerSubtitle ??
            `${rowAxisCol || 'Строки'} × ${colAxisCol || 'Колонки'}`,
        emitFilter,
        setDataMask,
        drillQueryParams,
        mockMode: false,
        dataState,
        errorMessage,
    };
}
//# sourceMappingURL=transformProps.js.map