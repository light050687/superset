"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
function ErrorStateInner({ message, onRetry }) {
    return ((0, jsx_runtime_1.jsxs)(styles_1.StateContainer, { role: "alert", "aria-live": "assertive", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "state-icon", viewBox: "0 0 48 48", fill: "none", stroke: "var(--dn)", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, children: [(0, jsx_runtime_1.jsx)("circle", { cx: "24", cy: "24", r: "20" }), (0, jsx_runtime_1.jsx)("line", { x1: "24", y1: "14", x2: "24", y2: "26" }), (0, jsx_runtime_1.jsx)("line", { x1: "24", y1: "32", x2: "24", y2: "33" })] }), (0, jsx_runtime_1.jsx)("div", { className: "state-title", style: { color: 'var(--dn)' }, children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445" }), message && (0, jsx_runtime_1.jsx)("div", { className: "state-desc", children: message }), onRetry && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: onRetry, style: {
                    padding: '8px 14px',
                    background: 'var(--ink)',
                    color: 'var(--on-accent)',
                    border: 'none',
                    borderRadius: 6,
                    fontFamily: 'var(--m)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    minHeight: 32,
                }, children: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" }))] }));
}
exports.default = (0, react_1.memo)(ErrorStateInner);
//# sourceMappingURL=ErrorState.js.map