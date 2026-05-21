import { jsx as _jsx } from "react/jsx-runtime";
import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TooltipEl } from '../styles';
/** Portal-tooltip. Позиционируется относительно курсора, «прилипает» к границам окна. */
function TooltipInner({ visible, pos, children, ink, surface, border }) {
    const [portalRoot] = useState(() => typeof document !== 'undefined' ? document.body : null);
    const [size, setSize] = useState({ w: 280, h: 140 });
    useEffect(() => {
        const el = document.getElementById('rs-tooltip');
        if (el)
            setSize({ w: el.offsetWidth, h: el.offsetHeight });
    }, [children, visible]);
    if (!portalRoot || !visible || !pos)
        return null;
    const offset = 14;
    let x = pos.x + offset;
    let y = pos.y + offset;
    if (x + size.w > window.innerWidth - 8)
        x = pos.x - size.w - offset;
    if (y + size.h > window.innerHeight - 8)
        y = pos.y - size.h - offset;
    if (x < 8)
        x = 8;
    if (y < 8)
        y = 8;
    return createPortal(_jsx(TooltipEl, { id: "rs-tooltip", "$visible": visible, style: { left: x, top: y, background: ink, color: surface, borderColor: border }, role: "tooltip", children: children }), portalRoot);
}
export default memo(TooltipInner);
//# sourceMappingURL=Tooltip.js.map