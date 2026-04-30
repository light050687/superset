import { jsx as _jsx } from "react/jsx-runtime";
import { memo } from 'react';
import { ExBtn, TreeBullet, TreeCellEl } from '../styles';
function TreeChevronInner({ level, expandable, expanded, onToggle }) {
    if (!expandable) {
        return (_jsx(TreeCellEl, { "$level": level, children: _jsx(TreeBullet, { "aria-hidden": true }) }));
    }
    return (_jsx(TreeCellEl, { "$level": level, children: _jsx(ExBtn, { type: "button", "$open": expanded, "aria-label": expanded ? 'Свернуть' : 'Раскрыть', "aria-expanded": expanded, onClick: e => {
                e.stopPropagation();
                onToggle?.();
            }, children: _jsx("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M3 1 L7 5 L3 9" }) }) }) }));
}
export default memo(TreeChevronInner);
//# sourceMappingURL=TreeChevron.js.map