"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const styles_1 = require("../styles");
/**
 * Singleton tooltip rendered through a portal so z-index and clipping work
 * independently of the card DOM. Auto-flips near viewport edges.
 *
 * The portal host duplicates `data-theme` so CSS custom properties resolve
 * correctly even when rendered outside the plugin root.
 */
const Tooltip = ({ payload }) => {
    const boxRef = (0, react_1.useRef)(null);
    const [host, setHost] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (typeof document === 'undefined')
            return;
        const el = document.createElement('div');
        el.setAttribute('data-rb-tooltip-root', 'true');
        document.body.appendChild(el);
        setHost(el);
        return () => {
            if (el.parentNode)
                el.parentNode.removeChild(el);
        };
    }, []);
    (0, react_1.useEffect)(() => {
        if (!host)
            return;
        host.setAttribute('data-theme', payload?.themeMode ?? 'light');
    }, [host, payload?.themeMode]);
    (0, react_1.useEffect)(() => {
        if (!payload || !boxRef.current)
            return;
        const el = boxRef.current;
        const offset = 14;
        const tw = el.offsetWidth;
        const th = el.offsetHeight;
        let x = payload.clientX + offset;
        let y = payload.clientY + offset;
        if (x + tw > window.innerWidth - 8)
            x = payload.clientX - tw - offset;
        if (y + th > window.innerHeight - 8)
            y = payload.clientY - th - offset;
        if (x < 8)
            x = 8;
        if (y < 8)
            y = 8;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
    }, [payload]);
    if (!host)
        return null;
    return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)(styles_1.TooltipBox, { ref: boxRef, role: "tooltip", "aria-hidden": payload == null, "$visible": payload != null, children: payload?.element }), host);
};
exports.default = Tooltip;
//# sourceMappingURL=Tooltip.js.map