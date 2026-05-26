"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
function StoreCellInner({ data }) {
    if (data.isSegment) {
        return ((0, jsx_runtime_1.jsxs)(styles_1.StoreCellEl, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "store-code", children: [(0, jsx_runtime_1.jsx)("span", { className: "code", children: data.code }), (0, jsx_runtime_1.jsx)("span", { children: data.name })] }), (0, jsx_runtime_1.jsxs)("span", { className: "store-meta", children: ["\u0421\u0435\u0433\u043C\u0435\u043D\u0442 \u00B7 \u0422\u041E ", data.toClass, " \u043C\u043B\u043D"] })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(styles_1.StoreCellEl, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "store-code", children: [(0, jsx_runtime_1.jsx)("span", { className: "code", children: data.code }), (0, jsx_runtime_1.jsx)("span", { children: data.shortLabel })] }), (0, jsx_runtime_1.jsxs)("span", { className: "store-meta", children: [data.city, " \u00B7 ", data.formatName, " \u00B7 \u0422\u041E ", data.toClass, "\u043C\u043B\u043D"] })] }));
}
exports.default = (0, react_1.memo)(StoreCellInner);
//# sourceMappingURL=StoreCell.js.map