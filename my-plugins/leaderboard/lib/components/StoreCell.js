"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
function StoreCellInner({ data, pinned, onTogglePin }) {
    if (data.isSegment) {
        return ((0, jsx_runtime_1.jsxs)(styles_1.StoreCellEl, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "store-code", children: [(0, jsx_runtime_1.jsx)("span", { className: "code", children: data.code }), (0, jsx_runtime_1.jsx)("span", { children: data.name })] }), (0, jsx_runtime_1.jsxs)("span", { className: "store-meta", children: ["\u0421\u0435\u0433\u043C\u0435\u043D\u0442 \u00B7 \u0422\u041E ", data.toClass, " \u043C\u043B\u043D"] })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(styles_1.StoreCellEl, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "store-code", children: [(0, jsx_runtime_1.jsx)("span", { className: "code", children: data.code }), (0, jsx_runtime_1.jsx)("span", { children: data.shortLabel }), onTogglePin && ((0, jsx_runtime_1.jsx)(styles_1.PinBtn, { type: "button", "$active": !!pinned, "aria-label": pinned ? 'Открепить' : 'Закрепить', "aria-pressed": !!pinned, "data-action": "pin", onClick: e => {
                            e.stopPropagation();
                            onTogglePin();
                        }, children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M5 1 L9 1 L9 5 L10.5 6.5 L7.5 6.5 L7.5 10.5 L6 12 L4.5 10.5 L4.5 6.5 L1.5 6.5 L3 5 Z" }) }) }))] }), (0, jsx_runtime_1.jsxs)("span", { className: "store-meta", children: [data.city, " \u00B7 ", data.formatName, " \u00B7 \u0422\u041E ", data.toClass, "\u043C\u043B\u043D"] })] }));
}
exports.default = (0, react_1.memo)(StoreCellInner);
//# sourceMappingURL=StoreCell.js.map