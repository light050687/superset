"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HigherIsBetter = exports.Error = exports.Empty = exports.Loading = exports.PercentUnit = exports.WithTotals = exports.Default = void 0;
const HeatmapPivot_1 = __importDefault(require("./HeatmapPivot"));
const lossesPreset_1 = require("./mocks/lossesPreset");
function buildMockProps(overrides = {}) {
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
    lossesPreset_1.MOCK_ROWS.forEach((r) => rowTotals.set(r.id, { fact: 0, plan: 0, ratio: null, revenue: 0, pct: null }));
    lossesPreset_1.MOCK_COLS.forEach((c) => colTotals.set(c.id, { fact: 0, plan: 0, ratio: null, revenue: 0, pct: null }));
    cells.forEach((c) => {
        const rt = rowTotals.get(c.rowId);
        const ct = colTotals.get(c.colId);
        if (rt) {
            rt.fact += c.value;
            if (c.plan != null)
                rt.plan += c.plan;
            if (c.revenue != null)
                rt.revenue += c.revenue;
        }
        if (ct) {
            ct.fact += c.value;
            if (c.plan != null)
                ct.plan += c.plan;
            if (c.revenue != null)
                ct.revenue += c.revenue;
        }
    });
    rowTotals.forEach((s) => {
        s.ratio = s.plan !== 0 ? s.fact / s.plan : null;
        s.pct = s.revenue !== 0 ? (s.fact / s.revenue) * 100 : null;
    });
    colTotals.forEach((s) => {
        s.ratio = s.plan !== 0 ? s.fact / s.plan : null;
        s.pct = s.revenue !== 0 ? (s.fact / s.revenue) * 100 : null;
    });
    let gf = 0;
    let gp = 0;
    let gr = 0;
    cells.forEach((c) => {
        gf += c.value;
        if (c.plan != null)
            gp += c.plan;
        if (c.revenue != null)
            gr += c.revenue;
    });
    return {
        width: 1200,
        height: 700,
        formData: {},
        rowAxisLabel: 'Формат',
        colAxisLabel: 'Дивизион',
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
        thresholds: { ok: 1.0, wn: 1.3, polarity: 'higher_is_worse' },
        defaultUnit: 'abs',
        unitSuffix: 'млн ₽',
        decimals: 1,
        autoFormatRussian: true,
        showTotalsDefault: false,
        headerText: 'Уровень потерь по форматам',
        headerSubtitle: 'Форматы × Дивизион · за год',
        emitFilter: false,
        setDataMask: undefined,
        drillQueryParams: null,
        mockMode: true,
        dataState: 'populated',
        ...overrides,
    };
}
const meta = {
    title: 'Plugins/HeatmapPivot',
    component: HeatmapPivot_1.default,
    parameters: { layout: 'fullscreen' },
};
exports.default = meta;
exports.Default = {
    args: buildMockProps(),
};
exports.WithTotals = {
    args: buildMockProps({ showTotalsDefault: true }),
};
exports.PercentUnit = {
    args: buildMockProps({ defaultUnit: 'pct' }),
};
exports.Loading = {
    args: buildMockProps({ dataState: 'loading' }),
};
exports.Empty = {
    args: buildMockProps({
        dataState: 'empty',
        cells: new Map(),
        rowTotals: new Map(),
        colTotals: new Map(),
        grandTotal: null,
    }),
};
exports.Error = {
    args: buildMockProps({
        dataState: 'error',
        errorMessage: 'Не удалось загрузить данные: таймаут запроса к StarRocks',
    }),
};
exports.HigherIsBetter = {
    args: buildMockProps({
        thresholds: { ok: 1.0, wn: 1.3, polarity: 'higher_is_better' },
        headerText: 'Выручка по форматам (выше — лучше)',
    }),
};
//# sourceMappingURL=HeatmapPivot.stories.js.map