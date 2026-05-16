"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ModalShell_1 = __importDefault(require("./ModalShell"));
const RankRow_1 = __importDefault(require("./RankRow"));
const styles_1 = require("../styles");
const formatRussian_1 = require("../utils/formatRussian");
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
    const [query, setQuery] = (0, react_1.useState)('');
    const [sortBy, setSortBy] = (0, react_1.useState)(initialSort);
    const searchRef = (0, react_1.useRef)(null);
    // Auto-focus the search input once the modal has opened and its entry
    // animation settles (200ms) — matches the ref prototype.
    (0, react_1.useEffect)(() => {
        const id = window.setTimeout(() => {
            searchRef.current?.focus();
        }, 200);
        return () => window.clearTimeout(id);
    }, []);
    const filtered = (0, react_1.useMemo)(() => {
        const q = query.trim().toLowerCase();
        const base = q
            ? rows.filter(r => r.name.toLowerCase().includes(q) ||
                r.sub.toLowerCase().includes(q))
            : rows;
        return sortRows(base, sortBy);
    }, [rows, query, sortBy]);
    const filteredSum = (0, react_1.useMemo)(() => filtered.reduce((s, r) => s + r.value, 0), [filtered]);
    const totalSumParts = (0, formatRussian_1.fmtRub)(filteredSum, decimalsValue, unitSuffixRub);
    const sharePct = totalSum > 0 ? (filteredSum / totalSum) * 100 : 0;
    const handleRowClickInModal = (0, react_1.useCallback)((row, modKey) => {
        onRowClick(row, modKey);
        if (modKey) {
            // DetailModal will pop on top; keep AllItemsModal open for context.
        }
    }, [onRowClick]);
    return ((0, jsx_runtime_1.jsxs)(ModalShell_1.default, { open: true, onClose: onClose, wide: true, themeMode: themeMode, zIndex: 1050, labelledBy: "rb-all-title", children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalHead, { children: [(0, jsx_runtime_1.jsx)(styles_1.AllModalIcon, { children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "3", x2: "14", y2: "3" }), (0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "7", x2: "11", y2: "7" }), (0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "11", x2: "7", y2: "11" })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "m-titles", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-title", id: "rb-all-title", children: "\u0412\u0441\u0435 \u043F\u043E\u0437\u0438\u0446\u0438\u0438" }), (0, jsx_runtime_1.jsxs)("div", { className: "m-sub", children: ["\u0412\u0441\u0435\u0433\u043E ", totalRows, " \u0441\u0442\u0440\u043E\u043A"] })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "m-close", onClick: onClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), (0, jsx_runtime_1.jsxs)(styles_1.AllToolbar, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-wrap", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "search-icon", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "6", cy: "6", r: "4" }), (0, jsx_runtime_1.jsx)("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), (0, jsx_runtime_1.jsx)("input", { ref: searchRef, type: "text", value: query, onChange: e => setQuery(e.target.value), placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E\u2026", "aria-label": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E", autoComplete: "off" })] }), (0, jsx_runtime_1.jsxs)(styles_1.SortPills, { children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: sortBy === 'sum' ? 'on' : '', onClick: () => setSortBy('sum'), children: "\u041F\u043E \u0441\u0443\u043C\u043C\u0435" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: sortBy === 'delta' ? 'on' : '', onClick: () => setSortBy('delta'), disabled: !hasPrevMetric, title: hasPrevMetric ? '' : 'Требуется «Метрика прошлого периода»', children: "\u041F\u043E \u0434\u0435\u043B\u044C\u0442\u0435" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: sortBy === 'share' ? 'on' : '', onClick: () => setSortBy('share'), children: "\u041F\u043E \u0434\u043E\u043B\u0435" })] })] }), filtered.length === 0 ? ((0, jsx_runtime_1.jsx)(styles_1.EmptyState, { children: query
                    ? `Ничего не найдено по запросу «${query}»`
                    : 'Нет данных для отображения' })) : ((0, jsx_runtime_1.jsx)(styles_1.RankList, { "$hasFilter": activeIds.size > 0, role: "list", children: filtered.map((row, idx) => ((0, jsx_runtime_1.jsx)(RankRow_1.default, { row: row, index: idx, maxValue: maxValue, unit: unit, invertDeltaGood: invertDeltaGood, decimalsValue: decimalsValue, decimalsDelta: decimalsDelta, decimalsShare: decimalsShare, unitSuffixRub: unitSuffixRub, showSparkline: showSparkline, showGhostPrevBar: showGhostPrevBar, filtered: activeIds.has(row.id), onClick: handleRowClickInModal }, row.id))) })), (0, jsx_runtime_1.jsxs)(styles_1.AllFooter, { children: [(0, jsx_runtime_1.jsxs)("span", { children: ["\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E ", filtered.length, " \u0438\u0437 ", totalRows] }), (0, jsx_runtime_1.jsxs)("span", { children: ["\u0421\u0443\u043C\u043C\u0430:", ' ', (0, jsx_runtime_1.jsxs)("span", { className: "total-strong", children: [totalSumParts.number, totalSumParts.unit] }), ' ', "\u00B7 ", sharePct.toFixed(1), "% \u043E\u0442 \u0438\u0442\u043E\u0433\u0430"] })] })] }));
};
exports.default = AllItemsModal;
//# sourceMappingURL=AllItemsModal.js.map