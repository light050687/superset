"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
const formatRussian_1 = require("../utils/formatRussian");
/** Стекованные bullets: СП (tangerine) + НД (sky) с планом. */
function DualBulletInner({ writeoff, shrinkage, planWriteoff, planShrinkage, maxWriteoff, maxShrinkage, tokens, }) {
    const maxW = Math.max(maxWriteoff, 0.01) * 1.05;
    const maxS = Math.max(maxShrinkage, 0.01) * 1.05;
    const wFill = Math.min(100, (writeoff / maxW) * 100);
    const wTarget = (planWriteoff / maxW) * 100;
    const sFill = Math.min(100, (Math.max(0, shrinkage) / maxS) * 100);
    const sTarget = (planShrinkage / maxS) * 100;
    return ((0, jsx_runtime_1.jsx)(styles_1.Cell, { "$align": "right", children: (0, jsx_runtime_1.jsxs)(styles_1.DualBulletEl, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "db-row", style: { color: tokens.tangerine }, children: [(0, jsx_runtime_1.jsx)("span", { className: "db-label", children: "\u0421\u041F" }), (0, jsx_runtime_1.jsxs)("span", { className: "db-track", children: [(0, jsx_runtime_1.jsx)("span", { className: "db-fill", style: { width: `${wFill}%`, background: tokens.tangerine } }), (0, jsx_runtime_1.jsx)("span", { className: "db-target", style: { left: `calc(${wTarget}% - 1px)` } })] }), (0, jsx_runtime_1.jsxs)("span", { className: "db-val", children: [(0, formatRussian_1.nf2)(writeoff), "%"] })] }), (0, jsx_runtime_1.jsxs)("span", { className: "db-row", style: { color: tokens.sky }, children: [(0, jsx_runtime_1.jsx)("span", { className: "db-label", children: "\u041D\u0414" }), (0, jsx_runtime_1.jsxs)("span", { className: "db-track", children: [(0, jsx_runtime_1.jsx)("span", { className: "db-fill", style: { width: `${sFill}%`, background: tokens.sky } }), (0, jsx_runtime_1.jsx)("span", { className: "db-target", style: { left: `calc(${sTarget}% - 1px)` } })] }), (0, jsx_runtime_1.jsxs)("span", { className: "db-val", children: [(0, formatRussian_1.nf2)(shrinkage), "%"] })] })] }) }));
}
exports.default = (0, react_1.memo)(DualBulletInner);
//# sourceMappingURL=DualBulletCell.js.map