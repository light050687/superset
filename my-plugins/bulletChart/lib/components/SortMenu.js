"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_dom_1 = require("react-dom");
const styles_1 = require("../styles");
const SORT_ICONS = {
    factDesc: ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "3", x2: "14", y2: "3" }), (0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "7", x2: "11", y2: "7" }), (0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "11", x2: "7", y2: "11" })] })),
    factAsc: ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "3", x2: "7", y2: "3" }), (0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "7", x2: "11", y2: "7" }), (0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "11", x2: "14", y2: "11" })] })),
    deltaPlanDesc: ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M3 11 L8 4 L13 11 Z" }) })),
    deltaPyDesc: ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "8", cy: "7", r: "5" }), (0, jsx_runtime_1.jsx)("path", { d: "M8 2 L8 7 L13 7", strokeWidth: "1.6" })] })),
    storesDesc: ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: [(0, jsx_runtime_1.jsx)("rect", { x: "2", y: "5", width: "3", height: "8" }), (0, jsx_runtime_1.jsx)("rect", { x: "6.5", y: "3", width: "3", height: "10" }), (0, jsx_runtime_1.jsx)("rect", { x: "11", y: "7", width: "3", height: "6" })] })),
    nameAsc: ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 14", width: "16", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", children: [(0, jsx_runtime_1.jsx)("path", { d: "M3 4 L5 2 L7 4" }), (0, jsx_runtime_1.jsx)("line", { x1: "5", y1: "2", x2: "5", y2: "12" }), (0, jsx_runtime_1.jsx)("text", { x: "9", y: "7", fontFamily: "'JetBrains Mono', monospace", fontSize: "5", children: "\u0410" }), (0, jsx_runtime_1.jsx)("text", { x: "9", y: "12", fontFamily: "'JetBrains Mono', monospace", fontSize: "5", children: "\u042F" })] })),
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
    const triggerRef = React.useRef(null);
    const [pos, setPos] = React.useState({ top: 0, left: 0 });
    /* Portal в body — обходит overflow:hidden и stacking-контексты от hero-чисел.
       Position computed от trigger. Closes: outside-click + Escape + scroll. */
    React.useEffect(() => {
        if (!open)
            return undefined;
        const update = () => {
            const r = triggerRef.current?.getBoundingClientRect();
            if (!r)
                return;
            setPos({ top: r.bottom + 4, left: r.left });
        };
        update();
        const outside = (e) => {
            const t = e.target;
            if (!t)
                return;
            if (t.closest('.bc-sort-portal') || t === triggerRef.current || triggerRef.current?.contains(t))
                return;
            setOpen(false);
        };
        const esc = (e) => {
            if (e.key === 'Escape')
                setOpen(false);
        };
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        document.addEventListener('mousedown', outside);
        document.addEventListener('keydown', esc);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
            document.removeEventListener('mousedown', outside);
            document.removeEventListener('keydown', esc);
        };
    }, [open]);
    return ((0, jsx_runtime_1.jsxs)(styles_1.IconDdWrap, { children: [(0, jsx_runtime_1.jsx)(styles_1.IconDdBtn, { ref: triggerRef, type: "button", onClick: () => setOpen(o => !o), "aria-haspopup": "listbox", "aria-expanded": open, "aria-label": `Сортировка: ${SORT_TITLES[value]}`, title: `Сортировка: ${SORT_TITLES[value]}`, style: {
                    width: 32,
                    height: 30,
                    background: 'var(--g100)',
                    border: `1px solid ${open ? 'var(--g300)' : 'var(--g200)'}`,
                    borderRadius: 6,
                }, children: SORT_ICONS[value] }), open && (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)("div", { className: "bc-sort-portal", role: "listbox", "aria-label": "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430", style: {
                    position: 'fixed',
                    top: pos.top,
                    left: pos.left,
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    width: 32,
                    background: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    borderRadius: 6,
                    overflow: 'hidden',
                    boxShadow: '0 10px 28px rgba(15,17,20,.15)',
                }, children: SORT_ORDER.filter(s => s !== value).map(s => ((0, jsx_runtime_1.jsx)("button", { type: "button", role: "option", "aria-selected": false, title: SORT_TITLES[s], onClick: () => {
                        onChange(s);
                        setOpen(false);
                    }, style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 30,
                        background: 'transparent',
                        border: 'none',
                        color: '#0F1114',
                        cursor: 'pointer',
                    }, onMouseEnter: e => { e.currentTarget.style.background = '#E5E7EB'; }, onMouseLeave: e => { e.currentTarget.style.background = 'transparent'; }, children: SORT_ICONS[s] }, s))) }), document.body)] }));
};
exports.default = SortMenu;
//# sourceMappingURL=SortMenu.js.map