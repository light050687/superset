import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { IconDropdown, IconDropdownItem, IconDropdownTrigger, IconDropdownWrap, } from '../styles';
const OPTIONS = [
    {
        id: 'sum',
        title: 'По сумме',
        icon: (_jsxs("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("line", { x1: "2", y1: "3", x2: "14", y2: "3" }), _jsx("line", { x1: "2", y1: "7", x2: "11", y2: "7" }), _jsx("line", { x1: "2", y1: "11", x2: "7", y2: "11" })] })),
    },
    {
        id: 'delta',
        title: 'По дельте к прошлому периоду',
        icon: (_jsx("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M3 11 L8 4 L13 11 Z" }) })),
    },
    {
        id: 'share',
        title: 'По доле от общего',
        icon: (_jsxs("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "8", cy: "7", r: "5" }), _jsx("path", { d: "M8 2 L8 7 L13 7", strokeWidth: 1.6 })] })),
    },
];
/**
 * Compact icon-only dropdown for switching sort mode (sum / delta / share).
 * Expands downward on click; closes on click-outside and Esc.
 */
const SortDropdown = ({ value, onChange, deltaDisabled = false, }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const close = useCallback(() => setOpen(false), []);
    const toggle = useCallback(() => setOpen(prev => !prev), []);
    useEffect(() => {
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
    return (_jsx(IconDropdownWrap, { ref: rootRef, children: _jsxs(IconDropdown, { "$open": open, children: [_jsx(IconDropdownTrigger, { type: "button", "aria-haspopup": "listbox", "aria-expanded": open, "aria-label": `Сортировка: ${active.title}`, title: "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430", onClick: toggle, children: active.icon }), open && (_jsx("div", { role: "listbox", "aria-label": "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430", children: OPTIONS.map(opt => {
                        const isActive = opt.id === value;
                        const disabled = opt.id === 'delta' && deltaDisabled;
                        const disabledTitle = disabled
                            ? 'Требуется «Метрика прошлого периода»'
                            : opt.title;
                        return (_jsx(IconDropdownItem, { type: "button", role: "option", "aria-selected": isActive, "aria-label": disabledTitle, "$active": isActive, title: disabledTitle, disabled: disabled, onClick: () => {
                                if (disabled)
                                    return;
                                onChange(opt.id);
                                close();
                            }, children: opt.icon }, opt.id));
                    }) }))] }) }));
};
export default memo(SortDropdown);
//# sourceMappingURL=SortDropdown.js.map