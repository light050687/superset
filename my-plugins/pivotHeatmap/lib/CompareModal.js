"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompareModal = CompareModal;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const formatRussian_1 = require("./utils/formatRussian");
const drillApi_1 = require("./utils/drillApi");
const lossesPreset_1 = require("./mocks/lossesPreset");
const styles_1 = require("./styles");
function buildSide(item, rows, cols, cells, rowTotals, colTotals) {
    if (item.type === 'cell' && item.rowId && item.colId) {
        const cell = cells.get(`${item.rowId}|${item.colId}`);
        if (!cell)
            return null;
        const rowName = rows.find((r) => r.id === item.rowId)?.name ?? item.rowId;
        const colName = cols.find((c) => c.id === item.colId)?.name ?? item.colId;
        return {
            title: `${rowName} × ${colName}`,
            fact: cell.value,
            plan: cell.plan,
            pct: cell.pct,
            shops: cell.shops,
        };
    }
    if (item.type === 'row' && item.rowId) {
        const slice = rowTotals.get(item.rowId);
        if (!slice)
            return null;
        const rowName = rows.find((r) => r.id === item.rowId)?.name ?? item.rowId;
        return {
            title: rowName,
            fact: slice.fact,
            plan: slice.plan,
            pct: slice.pct,
            shops: null,
        };
    }
    if (item.type === 'col' && item.colId) {
        const slice = colTotals.get(item.colId);
        if (!slice)
            return null;
        const colName = cols.find((c) => c.id === item.colId)?.name ?? item.colId;
        return {
            title: colName,
            fact: slice.fact,
            plan: slice.plan,
            pct: slice.pct,
            shops: null,
        };
    }
    return null;
}
function mockBreakdown(item) {
    const mockCells = (0, lossesPreset_1.buildMockCells)();
    if (item.type === 'cell' && item.rowId && item.colId) {
        const c = mockCells.get(`${item.rowId}|${item.colId}`);
        return c?.breakdown ?? [];
    }
    const bucket = new Map();
    mockCells.forEach((c) => {
        const match = (item.type === 'row' && c.rowId === item.rowId) ||
            (item.type === 'col' && c.colId === item.colId);
        if (!match)
            return;
        c.breakdown.forEach((b) => {
            bucket.set(b.name, (bucket.get(b.name) ?? 0) + b.value);
        });
    });
    return Array.from(bucket.entries())
        .map(([name, value]) => ({ name, value: Number(value.toFixed(1)) }))
        .sort((a, b) => b.value - a.value);
}
/** Delta between A and B — up/dn semantics expects losses (higher=worse). */
function pctDelta(va, vb) {
    if (va == null || vb == null || vb === 0)
        return { cls: '', text: '—' };
    const d = ((va - vb) / vb) * 100;
    const cls = d > 0.5 ? 'dn' : d < -0.5 ? 'up' : '';
    return { cls, text: (0, formatRussian_1.formatRussianDeltaPercent)(d, 1) };
}
function CompareModal(props) {
    const { itemA, itemB, onClose, rows, cols, cells, rowTotals, colTotals, unitSuffix, decimals, drillQueryParams, mockMode, } = props;
    const sideA = buildSide(itemA, rows, cols, cells, rowTotals, colTotals);
    const sideB = buildSide(itemB, rows, cols, cells, rowTotals, colTotals);
    const [breakdownA, setBreakdownA] = (0, react_1.useState)([]);
    const [breakdownB, setBreakdownB] = (0, react_1.useState)([]);
    const fetchSeq = (0, react_1.useRef)(0);
    const closeBtnRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        closeBtnRef.current?.focus();
    }, []);
    (0, react_1.useEffect)(() => {
        if (mockMode) {
            setBreakdownA(mockBreakdown(itemA));
            setBreakdownB(mockBreakdown(itemB));
            return;
        }
        if (!drillQueryParams)
            return;
        const mySeq = ++fetchSeq.current;
        const buildScope = (it) => {
            const scope = {};
            if (it.type === 'cell' || it.type === 'row')
                scope.rowId = it.rowId;
            if (it.type === 'cell' || it.type === 'col')
                scope.colId = it.colId;
            return scope;
        };
        Promise.all([
            (0, drillApi_1.fetchBreakdown)(drillQueryParams, buildScope(itemA)),
            (0, drillApi_1.fetchBreakdown)(drillQueryParams, buildScope(itemB)),
        ]).then(([a, b]) => {
            if (fetchSeq.current !== mySeq)
                return;
            setBreakdownA(a);
            setBreakdownB(b);
        });
    }, [itemA, itemB, drillQueryParams, mockMode]);
    if (!sideA || !sideB)
        return null;
    const typeLabel = itemA.type === 'cell' ? 'Пересечения'
        : itemA.type === 'row' ? 'Строки'
            : 'Колонки';
    const fmtFact = (v) => v == null ? '—' : (0, formatRussian_1.formatRussianSmartEx)(v, decimals, unitSuffix);
    const fmtPct = (v) => v == null ? '—' : (0, formatRussian_1.formatRussianPercent)(v, decimals);
    const mainRows = [
        { label: 'Сумма', va: sideA.fact, vb: sideB.fact, fmt: fmtFact, delta: pctDelta(sideA.fact, sideB.fact) },
        { label: '%', va: sideA.pct, vb: sideB.pct, fmt: fmtPct, delta: pctDelta(sideA.pct, sideB.pct) },
        { label: 'План', va: sideA.plan, vb: sideB.plan, fmt: fmtFact, delta: pctDelta(sideA.plan, sideB.plan) },
        {
            label: 'Магазинов',
            va: sideA.shops,
            vb: sideB.shops,
            fmt: (v) => (v == null ? '—' : String(v)),
            delta: pctDelta(sideA.shops, sideB.shops),
        },
    ];
    // Merge breakdown categories across A and B
    const categories = Array.from(new Set([
        ...breakdownA.map((x) => x.name),
        ...breakdownB.map((x) => x.name),
    ]));
    const mapA = new Map(breakdownA.map((x) => [x.name, x.value]));
    const mapB = new Map(breakdownB.map((x) => [x.name, x.value]));
    const subRows = categories.map((name) => {
        const va = mapA.get(name) ?? 0;
        const vb = mapB.get(name) ?? 0;
        return { label: name, va, vb, fmt: fmtFact, delta: pctDelta(va, vb) };
    });
    return ((0, jsx_runtime_1.jsxs)(styles_1.ModalRoot, { className: "show", role: "dialog", "aria-modal": "true", "aria-label": "\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 A vs B", onClick: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: [(0, jsx_runtime_1.jsx)(styles_1.ModalBackdrop, { onClick: onClose }), (0, jsx_runtime_1.jsxs)(styles_1.Modal, { children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalTitle, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-eyebrow", children: ["\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 \u00B7 ", typeLabel] }), (0, jsx_runtime_1.jsx)("div", { className: "m-h", children: "A vs B" })] }), (0, jsx_runtime_1.jsx)(styles_1.ModalClose, { type: "button", ref: closeBtnRef, onClick: onClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M3 3 L13 13 M13 3 L3 13" }) }) })] }), (0, jsx_runtime_1.jsx)(styles_1.ModalBody, { children: (0, jsx_runtime_1.jsxs)(styles_1.CmpTable, { children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "cmp-l", scope: "col" }), (0, jsx_runtime_1.jsxs)("th", { className: "cmp-a", scope: "col", children: [(0, jsx_runtime_1.jsxs)("div", { className: "cmp-h-badge", children: [(0, jsx_runtime_1.jsx)("span", { className: "dot" }), "A"] }), (0, jsx_runtime_1.jsx)("div", { className: "cmp-h-name", children: sideA.title })] }), (0, jsx_runtime_1.jsxs)("th", { className: "cmp-b", scope: "col", children: [(0, jsx_runtime_1.jsxs)("div", { className: "cmp-h-badge", children: [(0, jsx_runtime_1.jsx)("span", { className: "dot" }), "B"] }), (0, jsx_runtime_1.jsx)("div", { className: "cmp-h-name", children: sideB.title })] }), (0, jsx_runtime_1.jsx)("th", { className: "cmp-d", scope: "col", children: "\u0394" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: mainRows.map((r) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { scope: "row", className: "cmp-l", children: r.label }), (0, jsx_runtime_1.jsx)("td", { className: "cmp-a", children: r.fmt(r.va) }), (0, jsx_runtime_1.jsx)("td", { className: "cmp-b", children: r.fmt(r.vb) }), (0, jsx_runtime_1.jsx)("td", { className: `cmp-d ${r.delta.cls}`, children: r.delta.text })] }, r.label))) }), subRows.length > 0 && ((0, jsx_runtime_1.jsxs)("tbody", { className: "cmp-sub", children: [(0, jsx_runtime_1.jsx)("tr", { className: "cmp-sub-title", children: (0, jsx_runtime_1.jsx)("td", { colSpan: 4, children: "\u0420\u0430\u0437\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043F\u043E \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F\u043C" }) }), subRows.map((r) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { scope: "row", className: "cmp-l", children: r.label }), (0, jsx_runtime_1.jsx)("td", { className: "cmp-a", children: r.fmt(r.va) }), (0, jsx_runtime_1.jsx)("td", { className: "cmp-b", children: r.fmt(r.vb) }), (0, jsx_runtime_1.jsx)("td", { className: `cmp-d ${r.delta.cls}`, children: r.delta.text })] }, r.label)))] }))] }) })] })] }));
}
//# sourceMappingURL=CompareModal.js.map