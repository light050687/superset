import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useEffect, useRef, useState } from 'react';
import { CountBadge, DdItem, DdMenu, DdTrigger, DdWrap } from '../styles';
/**
 * Универсальный multi-select dropdown для Status/Format.
 * Закрывается кликом вне и Esc.
 */
function MultiSelectDropdownInner({ label, options, selected, onToggle, externallyClosed, }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    useEffect(() => {
        if (externallyClosed)
            setOpen(false);
    }, [externallyClosed]);
    useEffect(() => {
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
    return (_jsxs(DdWrap, { ref: wrapRef, children: [_jsxs(DdTrigger, { type: "button", "aria-haspopup": "listbox", "aria-expanded": open, onClick: () => setOpen(v => !v), children: [_jsx("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", children: _jsx("path", { d: "M2 4 L6 8 L10 4" }) }), _jsx("span", { children: label }), selected.size > 0 && _jsx(CountBadge, { children: selected.size })] }), _jsx(DdMenu, { "$open": open, role: "listbox", children: options.map(opt => {
                    const active = selected.has(opt.key);
                    return (_jsxs(DdItem, { type: "button", "$active": active, role: "option", "aria-selected": active, onClick: e => {
                            e.stopPropagation();
                            onToggle(opt.key);
                        }, children: [_jsx("span", { className: "dd-check", children: _jsx("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M2 5 L4 7 L8 3" }) }) }), opt.color && (_jsx("span", { className: "dd-item-dot", style: { background: opt.color } })), _jsx("span", { className: "dd-item-label", children: opt.label }), opt.count !== undefined && (_jsx("span", { className: "dd-item-count", children: opt.count }))] }, opt.key));
                }) })] }));
}
export default memo(MultiSelectDropdownInner);
//# sourceMappingURL=MultiSelectDropdown.js.map