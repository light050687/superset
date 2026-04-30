"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrillModal = DrillModal;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const thresholds_1 = require("./utils/thresholds");
const formatRussian_1 = require("./utils/formatRussian");
const drillApi_1 = require("./utils/drillApi");
const lossesPreset_1 = require("./mocks/lossesPreset");
const styles_1 = require("./styles");
function buildSummary(item, rows, cols, cells, rowTotals, colTotals) {
    if (item.type === 'cell' && item.rowId && item.colId) {
        const cell = cells.get(`${item.rowId}|${item.colId}`);
        if (!cell)
            return null;
        const rowName = rows.find((r) => r.id === item.rowId)?.name ?? item.rowId;
        const colName = cols.find((c) => c.id === item.colId)?.name ?? item.colId;
        return {
            title: `${rowName} × ${colName}`,
            totalFact: cell.value,
            totalPlan: cell.plan,
            pct: cell.pct,
            ratio: cell.ratio,
            shops: cell.shops,
        };
    }
    if (item.type === 'row' && item.rowId) {
        const slice = rowTotals.get(item.rowId);
        if (!slice)
            return null;
        const rowName = rows.find((r) => r.id === item.rowId)?.name ?? item.rowId;
        return {
            title: `Строка: ${rowName}`,
            totalFact: slice.fact,
            totalPlan: slice.plan,
            pct: slice.pct,
            ratio: slice.ratio,
            shops: null,
        };
    }
    if (item.type === 'col' && item.colId) {
        const slice = colTotals.get(item.colId);
        if (!slice)
            return null;
        const colName = cols.find((c) => c.id === item.colId)?.name ?? item.colId;
        return {
            title: `Колонка: ${colName}`,
            totalFact: slice.fact,
            totalPlan: slice.plan,
            pct: slice.pct,
            ratio: slice.ratio,
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
    // Row / col — aggregate breakdown across matching cells
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
function DrillModal(props) {
    const { item, onClose, rows, cols, cells, rowTotals, colTotals, thresholds, unitSuffix, decimals, drillQueryParams, mockMode, } = props;
    const summary = buildSummary(item, rows, cols, cells, rowTotals, colTotals);
    const [breakdown, setBreakdown] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const fetchSeq = (0, react_1.useRef)(0);
    // Close button focus on mount + focus trap setup
    const closeBtnRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        closeBtnRef.current?.focus();
    }, []);
    (0, react_1.useEffect)(() => {
        if (mockMode) {
            setBreakdown(mockBreakdown(item));
            return;
        }
        if (!drillQueryParams)
            return;
        const mySeq = ++fetchSeq.current;
        setLoading(true);
        const scope = {};
        if (item.type === 'cell' || item.type === 'row')
            scope.rowId = item.rowId;
        if (item.type === 'cell' || item.type === 'col')
            scope.colId = item.colId;
        (0, drillApi_1.fetchBreakdown)(drillQueryParams, scope)
            .then((result) => {
            if (fetchSeq.current !== mySeq)
                return; // stale
            setBreakdown(result);
        })
            .finally(() => {
            if (fetchSeq.current !== mySeq)
                return;
            setLoading(false);
        });
    }, [item, drillQueryParams, mockMode]);
    if (!summary)
        return null;
    const status = item.type === 'cell'
        ? (0, thresholds_1.cellStatus)(cells.get(`${item.rowId ?? ''}|${item.colId ?? ''}`), thresholds)
        : item.type === 'row'
            ? (0, thresholds_1.totalsStatus)(rowTotals.get(item.rowId ?? ''), thresholds)
            : (0, thresholds_1.totalsStatus)(colTotals.get(item.colId ?? ''), thresholds);
    const dotColor = status === 'ok' ? 'var(--up)' : status === 'dn' ? 'var(--dn)' : status === 'wn' ? 'var(--wn)' : 'var(--g400)';
    const statusClass = status === 'ok' ? 'status-ok' : status === 'dn' ? 'status-dn' : status === 'wn' ? 'status-wn' : '';
    const maxValue = Math.max(1, ...breakdown.map((b) => Math.abs(b.value)));
    const eyebrow = item.type === 'cell' ? 'Разложение · Пересечение'
        : item.type === 'row' ? 'Разложение · Строка'
            : 'Разложение · Колонка';
    return ((0, jsx_runtime_1.jsxs)(styles_1.ModalRoot, { className: "show", role: "dialog", "aria-modal": "true", "aria-label": `${eyebrow}: ${summary.title}`, onClick: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: [(0, jsx_runtime_1.jsx)(styles_1.ModalBackdrop, { onClick: onClose }), (0, jsx_runtime_1.jsxs)(styles_1.Modal, { children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalTitle, { children: [(0, jsx_runtime_1.jsx)("div", { className: "m-eyebrow", children: eyebrow }), (0, jsx_runtime_1.jsxs)("div", { className: "m-h", children: [(0, jsx_runtime_1.jsx)("span", { className: "dot", style: { background: dotColor } }), summary.title] })] }), (0, jsx_runtime_1.jsx)(styles_1.ModalClose, { type: "button", ref: closeBtnRef, onClick: onClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M3 3 L13 13 M13 3 L3 13" }) }) })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalBody, { children: [(0, jsx_runtime_1.jsxs)(styles_1.DrillSummary, { children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "s-l", children: "\u0421\u0443\u043C\u043C\u0430" }), (0, jsx_runtime_1.jsx)("div", { className: "s-v", children: (0, formatRussian_1.formatRussianSmartEx)(summary.totalFact, decimals, unitSuffix) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "s-l", children: "% \u043E\u0442 \u0437\u043D\u0430\u043C\u0435\u043D\u0430\u0442\u0435\u043B\u044F" }), (0, jsx_runtime_1.jsx)("div", { className: `s-v ${statusClass}`, children: summary.pct != null ? (0, formatRussian_1.formatRussianPercent)(summary.pct, decimals) : '—' })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "s-l", children: "\u041F\u043B\u0430\u043D" }), (0, jsx_runtime_1.jsx)("div", { className: "s-v", children: summary.totalPlan != null
                                                    ? (0, formatRussian_1.formatRussianSmartEx)(summary.totalPlan, decimals, unitSuffix)
                                                    : '—' })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "s-l", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), (0, jsx_runtime_1.jsx)("div", { className: `s-v ${statusClass}`, children: thresholds_1.STATUS_LABEL[status] })] })] }), summary.shops != null && ((0, jsx_runtime_1.jsxs)(styles_1.DrillSectionTitle, { children: ["\u041C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432: ", (0, formatRussian_1.formatRussianInt)(summary.shops)] })), (0, jsx_runtime_1.jsx)(styles_1.DrillSectionTitle, { children: "\u0420\u0430\u0437\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043F\u043E \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F\u043C" }), loading && (0, jsx_runtime_1.jsx)("div", { style: { color: 'var(--g500)', fontSize: 12 }, children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026" }), !loading && breakdown.length === 0 && ((0, jsx_runtime_1.jsx)("div", { style: { color: 'var(--g500)', fontSize: 12 }, children: drillQueryParams?.breakdownCol
                                    ? 'Нет данных по детализации'
                                    : 'Укажите «Измерение детализации» в настройках чарта' })), !loading && breakdown.length > 0 && ((0, jsx_runtime_1.jsx)(styles_1.DrillBars, { children: breakdown.map((b) => {
                                    const w = Math.round((Math.abs(b.value) / maxValue) * 100);
                                    const pctOfTotal = summary.totalFact !== 0 ? (b.value / summary.totalFact) * 100 : 0;
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: "dbf", children: [(0, jsx_runtime_1.jsx)("div", { className: "dbf-l", children: b.name }), (0, jsx_runtime_1.jsx)("div", { className: "dbf-bar", children: (0, jsx_runtime_1.jsx)("div", { className: "dbf-bar-fill", style: { width: `${w}%`, background: dotColor } }) }), (0, jsx_runtime_1.jsxs)("div", { className: "dbf-v", children: [(0, formatRussian_1.formatRussianSmartEx)(b.value, decimals, unitSuffix), (0, jsx_runtime_1.jsxs)("span", { className: "pct", children: [pctOfTotal.toFixed(1), "%"] })] })] }, b.name));
                                }) }))] })] })] }));
}
//# sourceMappingURL=DrillModal.js.map