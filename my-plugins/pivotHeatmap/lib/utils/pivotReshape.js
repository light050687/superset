"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reshapePivot = reshapePivot;
const toNum = (v) => {
    if (v == null || v === '')
        return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};
const toStr = (v) => {
    if (v == null)
        return '';
    return String(v);
};
/**
 * Reshape flat server response into pivoted matrix.
 *
 * Server returns: [{row_axis: 'A', col_axis: 'X', metric: 100}, ...]
 * We build:
 *   - cells: Map("A|X" → CellData)
 *   - rows / cols: unique ordered lists (first-seen order)
 *   - rowTotals / colTotals: client-side SUM (valid only for SUM-aggregated metrics)
 */
function reshapePivot(input) {
    const { data, rowAxisCol, colAxisCol, valueKey, planKey, revenueKey, shopsKey } = input;
    const cells = new Map();
    const rowSet = new Map();
    const colSet = new Map();
    data.forEach((row) => {
        const rowId = toStr(row[rowAxisCol]);
        const colId = toStr(row[colAxisCol]);
        if (!rowId || !colId)
            return;
        const value = toNum(row[valueKey]) ?? 0;
        const plan = planKey ? toNum(row[planKey]) : null;
        const revenue = revenueKey ? toNum(row[revenueKey]) : null;
        const shops = shopsKey ? toNum(row[shopsKey]) : null;
        const ratio = plan != null && plan !== 0 ? value / plan : null;
        const pct = revenue != null && revenue !== 0 ? (value / revenue) * 100 : null;
        const planPct = revenue != null && revenue !== 0 && plan != null ? (plan / revenue) * 100 : null;
        const cell = {
            rowId,
            colId,
            value,
            plan,
            ratio,
            pct,
            planPct,
            revenue,
            shops,
        };
        cells.set(`${rowId}|${colId}`, cell);
        if (!rowSet.has(rowId))
            rowSet.set(rowId, { id: rowId, name: rowId });
        if (!colSet.has(colId))
            colSet.set(colId, { id: colId, name: colId });
    });
    const rows = Array.from(rowSet.values());
    const cols = Array.from(colSet.values());
    // ── Totals ──
    const emptySlice = () => ({
        fact: 0,
        plan: 0,
        ratio: null,
        revenue: 0,
        pct: null,
    });
    const rowTotals = new Map();
    const colTotals = new Map();
    let grandFact = 0;
    let grandPlan = 0;
    let grandRevenue = 0;
    let grandHasPlan = false;
    let grandHasRevenue = false;
    rows.forEach((r) => rowTotals.set(r.id, emptySlice()));
    cols.forEach((c) => colTotals.set(c.id, emptySlice()));
    cells.forEach((cell) => {
        const rt = rowTotals.get(cell.rowId);
        const ct = colTotals.get(cell.colId);
        if (rt) {
            rt.fact += cell.value;
            if (cell.plan != null) {
                rt.plan = (rt.plan ?? 0) + cell.plan;
            }
            if (cell.revenue != null) {
                rt.revenue = (rt.revenue ?? 0) + cell.revenue;
            }
        }
        if (ct) {
            ct.fact += cell.value;
            if (cell.plan != null) {
                ct.plan = (ct.plan ?? 0) + cell.plan;
            }
            if (cell.revenue != null) {
                ct.revenue = (ct.revenue ?? 0) + cell.revenue;
            }
        }
        grandFact += cell.value;
        if (cell.plan != null) {
            grandPlan += cell.plan;
            grandHasPlan = true;
        }
        if (cell.revenue != null) {
            grandRevenue += cell.revenue;
            grandHasRevenue = true;
        }
    });
    rowTotals.forEach((slice) => {
        slice.ratio = slice.plan && slice.plan !== 0 ? slice.fact / slice.plan : null;
        slice.pct =
            slice.revenue && slice.revenue !== 0
                ? (slice.fact / slice.revenue) * 100
                : null;
    });
    colTotals.forEach((slice) => {
        slice.ratio = slice.plan && slice.plan !== 0 ? slice.fact / slice.plan : null;
        slice.pct =
            slice.revenue && slice.revenue !== 0
                ? (slice.fact / slice.revenue) * 100
                : null;
    });
    const grandTotal = cells.size
        ? {
            fact: grandFact,
            plan: grandHasPlan ? grandPlan : null,
            ratio: grandHasPlan && grandPlan !== 0 ? grandFact / grandPlan : null,
            revenue: grandHasRevenue ? grandRevenue : null,
            pct: grandHasRevenue && grandRevenue !== 0
                ? (grandFact / grandRevenue) * 100
                : null,
        }
        : null;
    return { cells, rows, cols, rowTotals, colTotals, grandTotal };
}
//# sourceMappingURL=pivotReshape.js.map