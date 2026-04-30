import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ModalShell from './ModalShell';
import RankRow from './RankRow';
import { AllFooter, AllModalIcon, AllToolbar, EmptyState, ModalHead, RankList, SortPills, } from '../styles';
import { fmtRub } from '../utils/formatRussian';
function sortRows(rows, by) {
    const copy = [...rows];
    switch (by) {
        case 'sum':
            copy.sort((a, b) => b.value - a.value);
            break;
        case 'share':
            copy.sort((a, b) => b.sharePct - a.sharePct);
            break;
        case 'delta':
            copy.sort((a, b) => b.deltaPP - a.deltaPP);
            break;
    }
    return copy;
}
const AllItemsModal = ({ rows, totalRows, totalSum, unit, maxValue, invertDeltaGood, decimalsValue, decimalsDelta, decimalsShare, unitSuffixRub, showSparkline, showGhostPrevBar, hasPrevMetric, activeIds, themeMode, initialSort, onRowClick, onClose, }) => {
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState(initialSort);
    const searchRef = useRef(null);
    // Auto-focus the search input once the modal has opened and its entry
    // animation settles (200ms) — matches the ref prototype.
    useEffect(() => {
        const id = window.setTimeout(() => {
            searchRef.current?.focus();
        }, 200);
        return () => window.clearTimeout(id);
    }, []);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = q
            ? rows.filter(r => r.name.toLowerCase().includes(q) ||
                r.sub.toLowerCase().includes(q))
            : rows;
        return sortRows(base, sortBy);
    }, [rows, query, sortBy]);
    const filteredSum = useMemo(() => filtered.reduce((s, r) => s + r.value, 0), [filtered]);
    const totalSumParts = fmtRub(filteredSum, decimalsValue, unitSuffixRub);
    const sharePct = totalSum > 0 ? (filteredSum / totalSum) * 100 : 0;
    const handleRowClickInModal = useCallback((row, modKey) => {
        onRowClick(row, modKey);
        if (modKey) {
            // DetailModal will pop on top; keep AllItemsModal open for context.
        }
    }, [onRowClick]);
    return (_jsxs(ModalShell, { open: true, onClose: onClose, wide: true, themeMode: themeMode, zIndex: 1050, labelledBy: "rb-all-title", children: [_jsxs(ModalHead, { children: [_jsx(AllModalIcon, { children: _jsxs("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("line", { x1: "2", y1: "3", x2: "14", y2: "3" }), _jsx("line", { x1: "2", y1: "7", x2: "11", y2: "7" }), _jsx("line", { x1: "2", y1: "11", x2: "7", y2: "11" })] }) }), _jsxs("div", { className: "m-titles", children: [_jsx("div", { className: "m-title", id: "rb-all-title", children: "\u0412\u0441\u0435 \u043F\u043E\u0437\u0438\u0446\u0438\u0438" }), _jsxs("div", { className: "m-sub", children: ["\u0412\u0441\u0435\u0433\u043E ", totalRows, " \u0441\u0442\u0440\u043E\u043A"] })] }), _jsx("button", { type: "button", className: "m-close", onClick: onClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: _jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), _jsxs(AllToolbar, { children: [_jsxs("div", { className: "search-wrap", children: [_jsxs("svg", { className: "search-icon", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "6", cy: "6", r: "4" }), _jsx("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), _jsx("input", { ref: searchRef, type: "text", value: query, onChange: e => setQuery(e.target.value), placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E\u2026", "aria-label": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E", autoComplete: "off" })] }), _jsxs(SortPills, { children: [_jsx("button", { type: "button", className: sortBy === 'sum' ? 'on' : '', onClick: () => setSortBy('sum'), children: "\u041F\u043E \u0441\u0443\u043C\u043C\u0435" }), _jsx("button", { type: "button", className: sortBy === 'delta' ? 'on' : '', onClick: () => setSortBy('delta'), disabled: !hasPrevMetric, title: hasPrevMetric ? '' : 'Требуется «Метрика прошлого периода»', children: "\u041F\u043E \u0434\u0435\u043B\u044C\u0442\u0435" }), _jsx("button", { type: "button", className: sortBy === 'share' ? 'on' : '', onClick: () => setSortBy('share'), children: "\u041F\u043E \u0434\u043E\u043B\u0435" })] })] }), filtered.length === 0 ? (_jsx(EmptyState, { children: query
                    ? `Ничего не найдено по запросу «${query}»`
                    : 'Нет данных для отображения' })) : (_jsx(RankList, { "$hasFilter": activeIds.size > 0, role: "list", children: filtered.map((row, idx) => (_jsx(RankRow, { row: row, index: idx, maxValue: maxValue, unit: unit, invertDeltaGood: invertDeltaGood, decimalsValue: decimalsValue, decimalsDelta: decimalsDelta, decimalsShare: decimalsShare, unitSuffixRub: unitSuffixRub, showSparkline: showSparkline, showGhostPrevBar: showGhostPrevBar, filtered: activeIds.has(row.id), onClick: handleRowClickInModal }, row.id))) })), _jsxs(AllFooter, { children: [_jsxs("span", { children: ["\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E ", filtered.length, " \u0438\u0437 ", totalRows] }), _jsxs("span", { children: ["\u0421\u0443\u043C\u043C\u0430:", ' ', _jsxs("span", { className: "total-strong", children: [totalSumParts.number, totalSumParts.unit] }), ' ', "\u00B7 ", sharePct.toFixed(1), "% \u043E\u0442 \u0438\u0442\u043E\u0433\u0430"] })] })] }));
};
export default AllItemsModal;
//# sourceMappingURL=AllItemsModal.js.map