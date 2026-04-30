import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { Cell, DriversCellEl } from '../styles';
import { deltaClass, fmtDelta, nf1, nf2, nf0 } from '../utils/formatRussian';
import { colorFromKey } from '../utils/colorFromKey';
/** Ячейка «Основные драйверы» — 3 строки для store, 2 для сегмента. */
function DriversCellInner({ data, tokens }) {
    const causeColor = colorFromKey(data.mainCause.colorKey, tokens);
    const dCls1 = deltaClass(data.mainCauseDelta, true);
    const dCls2 = deltaClass(data.mainWoTypeDelta, true);
    const causeRow = (_jsxs("span", { className: "driver-row", children: [_jsxs("span", { className: "driver-name", children: [_jsx("span", { className: "type-dot", style: { background: causeColor } }), data.mainCause.name] }), _jsxs("span", { className: "driver-pct", children: [nf1(data.mainCausePct), "%"] }), _jsx("span", { className: `driver-delta ${dCls1}`, children: fmtDelta(data.mainCauseDelta) })] }));
    const woRow = (_jsxs("span", { className: "driver-row", children: [_jsxs("span", { className: "driver-name", children: [_jsx("span", { className: "type-dot", style: { background: tokens.g500 } }), data.mainWoType] }), _jsxs("span", { className: "driver-pct", children: [nf2(data.mainWoTypePct), "%"] }), _jsx("span", { className: `driver-delta ${dCls2}`, children: fmtDelta(data.mainWoTypeDelta) })] }));
    if (data.isSegment) {
        return (_jsx(Cell, { "$align": "left", children: _jsxs(DriversCellEl, { children: [causeRow, woRow] }) }));
    }
    const dCls3 = deltaClass(data.mainSegmentDelta, true);
    return (_jsx(Cell, { "$align": "left", children: _jsxs(DriversCellEl, { children: [causeRow, woRow, _jsxs("span", { className: "driver-row", children: [_jsxs("span", { className: "driver-name", children: [_jsx("span", { className: "type-dot", style: { background: tokens.g500 } }), data.mainSegment] }), _jsxs("span", { className: "driver-pct", children: [nf0(data.mainSegmentPct), "%"] }), _jsx("span", { className: `driver-delta ${dCls3}`, children: fmtDelta(data.mainSegmentDelta) })] })] }) }));
}
export default memo(DriversCellInner);
//# sourceMappingURL=DriversCell.js.map