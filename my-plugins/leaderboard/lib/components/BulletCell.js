"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
const formatRussian_1 = require("../utils/formatRussian");
/**
 * Bullet chart с plan-маркером (столбец "Уровень потерь").
 * Цвет заливки определяется по дельте value-plan и правилу invertGood=true
 * (рост списаний это плохо).
 */
function BulletCellInner({ value, plan, globalMax, tokens }) {
    const dClass = (0, formatRussian_1.deltaClass)(value - plan, true);
    const color = dClass === 'dn' ? tokens.dn : dClass === 'up' ? tokens.up : tokens.wn;
    const max = Math.max(globalMax, plan, value, 0.01) * 1.05;
    const fillPct = Math.min(100, (value / max) * 100);
    const planPct = (plan / max) * 100;
    return ((0, jsx_runtime_1.jsx)(styles_1.Cell, { "$align": "right", children: (0, jsx_runtime_1.jsxs)(styles_1.BulletCellEl, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "bullet-val", style: { color }, children: [(0, jsx_runtime_1.jsxs)("span", { children: [(0, formatRussian_1.nf2)(value), "%"] }), (0, jsx_runtime_1.jsxs)("span", { className: "plan", children: ["\u043F\u043B\u0430\u043D ", (0, formatRussian_1.nf2)(plan), "%"] })] }), (0, jsx_runtime_1.jsxs)("span", { className: "bullet-track", children: [(0, jsx_runtime_1.jsx)("span", { className: "bullet-fill", style: { width: `${fillPct}%`, background: color } }), (0, jsx_runtime_1.jsx)("span", { className: "bullet-target", style: { left: `calc(${planPct}% - 1px)` } })] })] }) }));
}
exports.default = (0, react_1.memo)(BulletCellInner);
//# sourceMappingURL=BulletCell.js.map