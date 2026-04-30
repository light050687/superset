"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("../styles");
const OPTIONS = [
    {
        id: 'sum',
        title: 'По сумме',
        icon: ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "3", x2: "14", y2: "3" }), (0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "7", x2: "11", y2: "7" }), (0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "11", x2: "7", y2: "11" })] })),
    },
    {
        id: 'delta',
        title: 'По дельте к прошлому периоду',
        icon: ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M3 11 L8 4 L13 11 Z" }) })),
    },
    {
        id: 'share',
        title: 'По доле от общего',
        icon: ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "8", cy: "7", r: "5" }), (0, jsx_runtime_1.jsx)("path", { d: "M8 2 L8 7 L13 7", strokeWidth: 1.6 })] })),
    },
];
/**
 * Compact icon-only dropdown for switching sort mode (sum / delta / share).
 * Expands downward on click; closes on click-outside and Esc.
 */
const SortDropdown = ({ value, onChange, deltaDisabled = false, }) => {
    const [open, setOpen] = (0, react_1.useState)(false);
    const rootRef = (0, react_1.useRef)(null);
    const close = (0, react_1.useCallback)(() => setOpen(false), []);
    const toggle = (0, react_1.useCallback)(() => setOpen(prev => !prev), []);
    (0, react_1.useEffect)(() => {
        if (!open)
            return undefined;
        function handleClickOutside(event) {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                close();
            }
        }
        function handleKey(event) {
            if (event.key === 'Escape')
                close();
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open, close]);
    const active = OPTIONS.find(o => o.id === value) ?? OPTIONS[0];
    return ((0, jsx_runtime_1.jsx)(styles_1.IconDropdownWrap, { ref: rootRef, children: (0, jsx_runtime_1.jsxs)(styles_1.IconDropdown, { "$open": open, children: [(0, jsx_runtime_1.jsx)(styles_1.IconDropdownTrigger, { type: "button", "aria-haspopup": "listbox", "aria-expanded": open, "aria-label": `Сортировка: ${active.title}`, title: "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430", onClick: toggle, children: active.icon }), open && ((0, jsx_runtime_1.jsx)("div", { role: "listbox", "aria-label": "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430", children: OPTIONS.map(opt => {
                        const isActive = opt.id === value;
                        const disabled = opt.id === 'delta' && deltaDisabled;
                        const disabledTitle = disabled
                            ? 'Требуется «Метрика прошлого периода»'
                            : opt.title;
                        return ((0, jsx_runtime_1.jsx)(styles_1.IconDropdownItem, { type: "button", role: "option", "aria-selected": isActive, "aria-label": disabledTitle, "$active": isActive, title: disabledTitle, disabled: disabled, onClick: () => {
                                if (disabled)
                                    return;
                                onChange(opt.id);
                                close();
                            }, children: opt.icon }, opt.id));
                    }) }))] }) }));
};
exports.default = (0, react_1.memo)(SortDropdown);
//# sourceMappingURL=SortDropdown.js.map