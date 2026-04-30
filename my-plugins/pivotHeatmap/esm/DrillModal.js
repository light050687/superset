import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { cellStatus, STATUS_LABEL, totalsStatus } from './utils/thresholds';
import { formatRussianInt, formatRussianPercent, formatRussianSmartEx, } from './utils/formatRussian';
import { fetchBreakdown } from './utils/drillApi';
import { buildMockCells } from './mocks/lossesPreset';
import { DrillBars, DrillSectionTitle, DrillSummary, Modal, ModalBackdrop, ModalBody, ModalClose, ModalHead, ModalRoot, ModalTitle, } from './styles';
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
    const mockCells = buildMockCells();
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
export function DrillModal(props) {
    const { item, onClose, rows, cols, cells, rowTotals, colTotals, thresholds, unitSuffix, decimals, drillQueryParams, mockMode, } = props;
    const summary = buildSummary(item, rows, cols, cells, rowTotals, colTotals);
    const [breakdown, setBreakdown] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchSeq = useRef(0);
    // Close button focus on mount + focus trap setup
    const closeBtnRef = useRef(null);
    useEffect(() => {
        closeBtnRef.current?.focus();
    }, []);
    useEffect(() => {
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
        fetchBreakdown(drillQueryParams, scope)
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
        ? cellStatus(cells.get(`${item.rowId ?? ''}|${item.colId ?? ''}`), thresholds)
        : item.type === 'row'
            ? totalsStatus(rowTotals.get(item.rowId ?? ''), thresholds)
            : totalsStatus(colTotals.get(item.colId ?? ''), thresholds);
    const dotColor = status === 'ok' ? 'var(--up)' : status === 'dn' ? 'var(--dn)' : status === 'wn' ? 'var(--wn)' : 'var(--g400)';
    const statusClass = status === 'ok' ? 'status-ok' : status === 'dn' ? 'status-dn' : status === 'wn' ? 'status-wn' : '';
    const maxValue = Math.max(1, ...breakdown.map((b) => Math.abs(b.value)));
    const eyebrow = item.type === 'cell' ? 'Разложение · Пересечение'
        : item.type === 'row' ? 'Разложение · Строка'
            : 'Разложение · Колонка';
    return (_jsxs(ModalRoot, { className: "show", role: "dialog", "aria-modal": "true", "aria-label": `${eyebrow}: ${summary.title}`, onClick: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: [_jsx(ModalBackdrop, { onClick: onClose }), _jsxs(Modal, { children: [_jsxs(ModalHead, { children: [_jsxs(ModalTitle, { children: [_jsx("div", { className: "m-eyebrow", children: eyebrow }), _jsxs("div", { className: "m-h", children: [_jsx("span", { className: "dot", style: { background: dotColor } }), summary.title] })] }), _jsx(ModalClose, { type: "button", ref: closeBtnRef, onClick: onClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: _jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", children: _jsx("path", { d: "M3 3 L13 13 M13 3 L3 13" }) }) })] }), _jsxs(ModalBody, { children: [_jsxs(DrillSummary, { children: [_jsxs("div", { children: [_jsx("div", { className: "s-l", children: "\u0421\u0443\u043C\u043C\u0430" }), _jsx("div", { className: "s-v", children: formatRussianSmartEx(summary.totalFact, decimals, unitSuffix) })] }), _jsxs("div", { children: [_jsx("div", { className: "s-l", children: "% \u043E\u0442 \u0437\u043D\u0430\u043C\u0435\u043D\u0430\u0442\u0435\u043B\u044F" }), _jsx("div", { className: `s-v ${statusClass}`, children: summary.pct != null ? formatRussianPercent(summary.pct, decimals) : '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "s-l", children: "\u041F\u043B\u0430\u043D" }), _jsx("div", { className: "s-v", children: summary.totalPlan != null
                                                    ? formatRussianSmartEx(summary.totalPlan, decimals, unitSuffix)
                                                    : '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "s-l", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("div", { className: `s-v ${statusClass}`, children: STATUS_LABEL[status] })] })] }), summary.shops != null && (_jsxs(DrillSectionTitle, { children: ["\u041C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432: ", formatRussianInt(summary.shops)] })), _jsx(DrillSectionTitle, { children: "\u0420\u0430\u0437\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043F\u043E \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F\u043C" }), loading && _jsx("div", { style: { color: 'var(--g500)', fontSize: 12 }, children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026" }), !loading && breakdown.length === 0 && (_jsx("div", { style: { color: 'var(--g500)', fontSize: 12 }, children: drillQueryParams?.breakdownCol
                                    ? 'Нет данных по детализации'
                                    : 'Укажите «Измерение детализации» в настройках чарта' })), !loading && breakdown.length > 0 && (_jsx(DrillBars, { children: breakdown.map((b) => {
                                    const w = Math.round((Math.abs(b.value) / maxValue) * 100);
                                    const pctOfTotal = summary.totalFact !== 0 ? (b.value / summary.totalFact) * 100 : 0;
                                    return (_jsxs("div", { className: "dbf", children: [_jsx("div", { className: "dbf-l", children: b.name }), _jsx("div", { className: "dbf-bar", children: _jsx("div", { className: "dbf-bar-fill", style: { width: `${w}%`, background: dotColor } }) }), _jsxs("div", { className: "dbf-v", children: [formatRussianSmartEx(b.value, decimals, unitSuffix), _jsxs("span", { className: "pct", children: [pctOfTotal.toFixed(1), "%"] })] })] }, b.name));
                                }) }))] })] })] }));
}
//# sourceMappingURL=DrillModal.js.map