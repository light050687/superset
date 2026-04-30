"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const formatRussian_1 = require("../utils/formatRussian");
const styles_1 = require("../styles");
function NumberCellInner({ value, unit = '₽' }) {
    return ((0, jsx_runtime_1.jsx)(styles_1.Cell, { "$align": "right", children: (0, jsx_runtime_1.jsxs)(styles_1.NumCell, { children: [(0, formatRussian_1.nf0)(value), (0, jsx_runtime_1.jsx)("span", { className: "u", children: unit })] }) }));
}
exports.default = (0, react_1.memo)(NumberCellInner);
//# sourceMappingURL=NumberCell.js.map