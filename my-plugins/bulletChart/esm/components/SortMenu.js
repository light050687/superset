import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { IconDd, IconDdBtn, IconDdWrap } from '../styles';
const SORT_ICONS = {
    factDesc: (_jsxs("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", children: [_jsx("line", { x1: "2", y1: "3", x2: "14", y2: "3" }), _jsx("line", { x1: "2", y1: "7", x2: "11", y2: "7" }), _jsx("line", { x1: "2", y1: "11", x2: "7", y2: "11" })] })),
    factAsc: (_jsxs("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", children: [_jsx("line", { x1: "2", y1: "3", x2: "7", y2: "3" }), _jsx("line", { x1: "2", y1: "7", x2: "11", y2: "7" }), _jsx("line", { x1: "2", y1: "11", x2: "14", y2: "11" })] })),
    deltaPlanDesc: (_jsx("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M3 11 L8 4 L13 11 Z" }) })),
    deltaPyDesc: (_jsxs("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", children: [_jsx("circle", { cx: "8", cy: "7", r: "5" }), _jsx("path", { d: "M8 2 L8 7 L13 7", strokeWidth: "1.6" })] })),
    storesDesc: (_jsxs("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "2", y: "5", width: "3", height: "8" }), _jsx("rect", { x: "6.5", y: "3", width: "3", height: "10" }), _jsx("rect", { x: "11", y: "7", width: "3", height: "6" })] })),
    nameAsc: (_jsxs("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M3 4 L5 2 L7 4" }), _jsx("line", { x1: "5", y1: "2", x2: "5", y2: "12" }), _jsx("text", { x: "9", y: "7", fontFamily: "monospace", fontSize: "5", children: "\u0410" }), _jsx("text", { x: "9", y: "12", fontFamily: "monospace", fontSize: "5", children: "\u042F" })] })),
};
const SORT_TITLES = {
    factDesc: 'По факту (убывание)',
    factAsc: 'По факту (возрастание)',
    deltaPlanDesc: 'По дельте к плану',
    deltaPyDesc: 'По дельте к ПГ',
    storesDesc: 'По числу магазинов',
    nameAsc: 'По названию',
};
const SORT_ORDER = [
    'factDesc',
    'factAsc',
    'deltaPlanDesc',
    'deltaPyDesc',
    'storesDesc',
    'nameAsc',
];
const SortMenu = ({ value, onChange }) => {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);
    // Закрытие по клику вне
    React.useEffect(() => {
        if (!open)
            return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);
    // Закрытие по Escape
    React.useEffect(() => {
        if (!open)
            return;
        const handler = (e) => {
            if (e.key === 'Escape')
                setOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);
    return (_jsx(IconDdWrap, { ref: ref, children: _jsxs(IconDd, { open: open, children: [_jsx(IconDdBtn, { type: "button", onClick: () => setOpen(o => !o), "aria-haspopup": "listbox", "aria-expanded": open, "aria-label": `Сортировка: ${SORT_TITLES[value]}`, title: `Сортировка: ${SORT_TITLES[value]}`, children: SORT_ICONS[value] }), open
                    ? SORT_ORDER.filter(s => s !== value).map(s => (_jsx(IconDdBtn, { type: "button", role: "option", "aria-selected": false, title: SORT_TITLES[s], onClick: () => {
                            onChange(s);
                            setOpen(false);
                        }, children: SORT_ICONS[s] }, s)))
                    : null] }) }));
};
export default SortMenu;
//# sourceMappingURL=SortMenu.js.map