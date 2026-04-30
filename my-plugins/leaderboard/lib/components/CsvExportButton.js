"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
const csvExport_1 = require("../utils/csvExport");
function CsvExportButtonInner({ stores }) {
    return ((0, jsx_runtime_1.jsx)(styles_1.IconButton, { type: "button", title: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0432 CSV", "aria-label": "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0432 CSV", onClick: () => (0, csvExport_1.downloadCsv)(stores), children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M7 1 L7 9 M4 6 L7 9 L10 6 M2 11 L12 11 L12 13 L2 13 Z" }) }) }));
}
exports.default = (0, react_1.memo)(CsvExportButtonInner);
//# sourceMappingURL=CsvExportButton.js.map