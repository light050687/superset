import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { Chip, ChipCell } from '../styles';
import { STATUSES } from '../utils/statusRules';
import { colorFromKey } from '../utils/colorFromKey';
import { hexToRgba } from '../themeTokens';
function StatusChipInner({ status, tokens }) {
    const st = STATUSES[status];
    const color = colorFromKey(st.colorKey, tokens);
    return (_jsx(ChipCell, { children: _jsxs(Chip, { "$color": color, "$bg": hexToRgba(color, 0.15), "$border": hexToRgba(color, 0.35), children: [_jsx("span", { className: "dot" }), st.label] }) }));
}
export default memo(StatusChipInner);
//# sourceMappingURL=StatusChip.js.map