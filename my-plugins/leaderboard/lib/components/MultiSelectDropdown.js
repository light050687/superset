"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
/**
 * Универсальный multi-select dropdown для Status/Format.
 * Закрывается кликом вне и Esc.
 */
function MultiSelectDropdownInner({ label, options, selected, onToggle, externallyClosed, }) {
    const [open, setOpen] = (0, react_1.useState)(false);
    const wrapRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (externallyClosed)
            setOpen(false);
    }, [externallyClosed]);
    (0, react_1.useEffect)(() => {
        if (!open)
            return undefined;
        const onDocClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const onEsc = (e) => {
            if (e.key === 'Escape')
                setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, [open]);
    return ((0, jsx_runtime_1.jsxs)(styles_1.DdWrap, { ref: wrapRef, children: [(0, jsx_runtime_1.jsxs)(styles_1.DdTrigger, { type: "button", "aria-haspopup": "listbox", "aria-expanded": open, onClick: () => setOpen(v => !v), children: [(0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M2 4 L6 8 L10 4" }) }), (0, jsx_runtime_1.jsx)("span", { children: label }), selected.size > 0 && (0, jsx_runtime_1.jsx)(styles_1.CountBadge, { children: selected.size })] }), (0, jsx_runtime_1.jsx)(styles_1.DdMenu, { "$open": open, role: "listbox", children: options.map(opt => {
                    const active = selected.has(opt.key);
                    return ((0, jsx_runtime_1.jsxs)(styles_1.DdItem, { type: "button", "$active": active, role: "option", "aria-selected": active, onClick: e => {
                            e.stopPropagation();
                            onToggle(opt.key);
                        }, children: [(0, jsx_runtime_1.jsx)("span", { className: "dd-check", children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M2 5 L4 7 L8 3" }) }) }), opt.color && ((0, jsx_runtime_1.jsx)("span", { className: "dd-item-dot", style: { background: opt.color } })), (0, jsx_runtime_1.jsx)("span", { className: "dd-item-label", children: opt.label }), opt.count !== undefined && ((0, jsx_runtime_1.jsx)("span", { className: "dd-item-count", children: opt.count }))] }, opt.key));
                }) })] }));
}
exports.default = (0, react_1.memo)(MultiSelectDropdownInner);
//# sourceMappingURL=MultiSelectDropdown.js.map