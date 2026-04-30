import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { nf0 } from '../utils/formatRussian';
import { Cell, NumCell } from '../styles';
function NumberCellInner({ value, unit = '₽' }) {
    return (_jsx(Cell, { "$align": "right", children: _jsxs(NumCell, { children: [nf0(value), _jsx("span", { className: "u", children: unit })] }) }));
}
export default memo(NumberCellInner);
//# sourceMappingURL=NumberCell.js.map