"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
const formatRussian_1 = require("../utils/formatRussian");
/** Список горизонтальных bar-rows (причины/виды списаний в модалке). */
function RankedBarListInner({ items }) {
    const maxPct = Math.max(...items.map(i => i.pct), 0.01);
    return ((0, jsx_runtime_1.jsx)(styles_1.MRanked, { children: items.map((item, idx) => {
            const barPct = (item.pct / maxPct) * 100;
            const dCls = (0, formatRussian_1.deltaClass)(item.delta, true);
            return ((0, jsx_runtime_1.jsxs)(styles_1.MRankRow, { children: [(0, jsx_runtime_1.jsx)("div", { className: "m-rank-name", title: item.name, children: item.name }), (0, jsx_runtime_1.jsx)("div", { className: "m-rank-bar", children: (0, jsx_runtime_1.jsx)("div", { className: "m-rank-bar-fill", style: { width: `${barPct}%`, background: item.color } }) }), (0, jsx_runtime_1.jsxs)("div", { className: "m-rank-pct", children: [(0, formatRussian_1.nf2)(item.pct), "%"] }), (0, jsx_runtime_1.jsx)("div", { className: `m-rank-delta ${dCls}`, children: (0, formatRussian_1.fmtDelta)(item.delta) })] }, `${item.name}-${idx}`));
        }) }));
}
exports.default = (0, react_1.memo)(RankedBarListInner);
//# sourceMappingURL=RankedBarList.js.map