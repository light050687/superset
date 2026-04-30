"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HintRow;
const jsx_runtime_1 = require("react/jsx-runtime");
const styled_1 = require("../styles/styled");
/** Подсказка-строка «клик — фильтр · Ctrl+клик — разложение» в футере карточки. */
function HintRow() {
    return ((0, jsx_runtime_1.jsxs)(styled_1.HintItem, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "currentColor", "aria-hidden": true, children: (0, jsx_runtime_1.jsx)("path", { d: "M3 2 L3 13 L6 10 L8 14 L10 13 L8 9 L12 9 Z" }) }), (0, jsx_runtime_1.jsx)("span", { children: "\u043A\u043B\u0438\u043A \u2014 \u0444\u0438\u043B\u044C\u0442\u0440" })] }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, children: [(0, jsx_runtime_1.jsx)("rect", { x: "2", y: "3", width: "12", height: "10", rx: "1.5" }), (0, jsx_runtime_1.jsx)("path", { d: "M6 7 L8 9 L10 7" })] }), (0, jsx_runtime_1.jsx)("span", { children: "Ctrl+\u043A\u043B\u0438\u043A \u2014 \u0440\u0430\u0437\u043B\u043E\u0436\u0435\u043D\u0438\u0435" })] })] }));
}
//# sourceMappingURL=HintRow.js.map