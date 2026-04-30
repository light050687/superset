"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
/** Красивое пустое состояние с иконкой и пояснением. DS 2.0: 6 состояний. */
function EmptyStateInner({ title = 'Нет данных для отображения', description = 'Измените фильтры или проверьте соответствие колонок в настройках плагина. ' +
    'Ожидаемые поля dataset: store_id, store_name, city, format, format_name, ' +
    'division, to_class, writeoff_pct, shrinkage_pct, plan_writeoff_pct, ' +
    'plan_shrinkage_pct, avg_writeoff_rub, avg_shrinkage_check_rub.', }) {
    return ((0, jsx_runtime_1.jsxs)(styles_1.StateContainer, { role: "status", "aria-live": "polite", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "state-icon", viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, children: [(0, jsx_runtime_1.jsx)("rect", { x: "6", y: "10", width: "36", height: "28", rx: "3" }), (0, jsx_runtime_1.jsx)("line", { x1: "6", y1: "18", x2: "42", y2: "18" }), (0, jsx_runtime_1.jsx)("line", { x1: "14", y1: "26", x2: "26", y2: "26" }), (0, jsx_runtime_1.jsx)("line", { x1: "14", y1: "32", x2: "22", y2: "32" })] }), (0, jsx_runtime_1.jsx)("div", { className: "state-title", children: title }), (0, jsx_runtime_1.jsx)("div", { className: "state-desc", children: description })] }));
}
exports.default = (0, react_1.memo)(EmptyStateInner);
//# sourceMappingURL=EmptyState.js.map