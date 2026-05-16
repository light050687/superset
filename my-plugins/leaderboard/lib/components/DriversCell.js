"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
const formatRussian_1 = require("../utils/formatRussian");
const colorFromKey_1 = require("../utils/colorFromKey");
/** Ячейка «Основные драйверы» — 3 строки для store, 2 для сегмента. */
function DriversCellInner({ data, tokens }) {
    const causeColor = (0, colorFromKey_1.colorFromKey)(data.mainCause.colorKey, tokens);
    const dCls1 = (0, formatRussian_1.deltaClass)(data.mainCauseDelta, true);
    const dCls2 = (0, formatRussian_1.deltaClass)(data.mainWoTypeDelta, true);
    const causeRow = ((0, jsx_runtime_1.jsxs)("span", { className: "driver-row", children: [(0, jsx_runtime_1.jsxs)("span", { className: "driver-name", children: [(0, jsx_runtime_1.jsx)("span", { className: "type-dot", style: { background: causeColor } }), data.mainCause.name] }), (0, jsx_runtime_1.jsxs)("span", { className: "driver-pct", children: [(0, formatRussian_1.nf1)(data.mainCausePct), "%"] }), (0, jsx_runtime_1.jsx)("span", { className: `driver-delta ${dCls1}`, children: (0, formatRussian_1.fmtDelta)(data.mainCauseDelta) })] }));
    const woRow = ((0, jsx_runtime_1.jsxs)("span", { className: "driver-row", children: [(0, jsx_runtime_1.jsxs)("span", { className: "driver-name", children: [(0, jsx_runtime_1.jsx)("span", { className: "type-dot", style: { background: tokens.g500 } }), data.mainWoType] }), (0, jsx_runtime_1.jsxs)("span", { className: "driver-pct", children: [(0, formatRussian_1.nf2)(data.mainWoTypePct), "%"] }), (0, jsx_runtime_1.jsx)("span", { className: `driver-delta ${dCls2}`, children: (0, formatRussian_1.fmtDelta)(data.mainWoTypeDelta) })] }));
    if (data.isSegment) {
        return ((0, jsx_runtime_1.jsx)(styles_1.Cell, { "$align": "left", children: (0, jsx_runtime_1.jsxs)(styles_1.DriversCellEl, { children: [causeRow, woRow] }) }));
    }
    const dCls3 = (0, formatRussian_1.deltaClass)(data.mainSegmentDelta, true);
    return ((0, jsx_runtime_1.jsx)(styles_1.Cell, { "$align": "left", children: (0, jsx_runtime_1.jsxs)(styles_1.DriversCellEl, { children: [causeRow, woRow, (0, jsx_runtime_1.jsxs)("span", { className: "driver-row", children: [(0, jsx_runtime_1.jsxs)("span", { className: "driver-name", children: [(0, jsx_runtime_1.jsx)("span", { className: "type-dot", style: { background: tokens.g500 } }), data.mainSegment] }), (0, jsx_runtime_1.jsxs)("span", { className: "driver-pct", children: [(0, formatRussian_1.nf0)(data.mainSegmentPct), "%"] }), (0, jsx_runtime_1.jsx)("span", { className: `driver-delta ${dCls3}`, children: (0, formatRussian_1.fmtDelta)(data.mainSegmentDelta) })] })] }) }));
}
exports.default = (0, react_1.memo)(DriversCellInner);
//# sourceMappingURL=DriversCell.js.map