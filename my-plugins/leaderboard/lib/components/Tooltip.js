"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const styles_1 = require("../styles");
/** Portal-tooltip. Позиционируется относительно курсора, «прилипает» к границам окна. */
function TooltipInner({ visible, pos, children, ink, surface, border }) {
    const [portalRoot] = (0, react_1.useState)(() => typeof document !== 'undefined' ? document.body : null);
    const [size, setSize] = (0, react_1.useState)({ w: 280, h: 140 });
    (0, react_1.useEffect)(() => {
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
    return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)(styles_1.TooltipEl, { id: "rs-tooltip", "$visible": visible, style: { left: x, top: y, background: ink, color: surface, borderColor: border }, role: "tooltip", children: children }), portalRoot);
}
exports.default = (0, react_1.memo)(TooltipInner);
//# sourceMappingURL=Tooltip.js.map