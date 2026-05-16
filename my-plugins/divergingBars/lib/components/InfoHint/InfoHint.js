"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoHint = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
// @canonical-version: 3.1.0
// @canonical-source: superset/my-plugins/_shared/info-hint/
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const styles_1 = require("./styles");
function IconInfo() {
    return ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "10", cy: "10", r: "8" }), (0, jsx_runtime_1.jsx)("path", { d: "M10 6.5 L10 6.5", strokeWidth: 2.2 }), (0, jsx_runtime_1.jsx)("path", { d: "M10 9 L10 14" })] }));
}
function IconClose() {
    return ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M4 4 L12 12 M12 4 L4 12" }) }));
}
/* Ищем контейнер для HintOverlay. Приоритет — элемент с явным маркером
   [data-info-hint-container] (плагин помечает свой Card этим атрибутом).
   Fallback — ближайший positioned ancestor.
   Маркер важен потому что внутри плагина могут быть промежуточные
   position:relative блоки (например ComparisonSection scorecard'а имеет
   position:relative для своего ::before), и без явного маркера portal
   попадёт в них, а не в Card. */
function findHintContainer(el) {
    const marked = el.closest('[data-info-hint-container]');
    if (marked)
        return marked;
    let p = el.parentElement;
    while (p && p !== document.body) {
        const pos = window.getComputedStyle(p).position;
        if (pos === 'relative' || pos === 'absolute' || pos === 'fixed' || pos === 'sticky') {
            return p;
        }
        p = p.parentElement;
    }
    return null;
}
exports.InfoHint = (0, react_1.forwardRef)(function InfoHint({ ariaLabel, children, closeOnEscape = true }, ref) {
    const [open, setOpen] = (0, react_1.useState)(false);
    const [container, setContainer] = (0, react_1.useState)(null);
    const triggerRef = (0, react_1.useRef)(null);
    (0, react_1.useImperativeHandle)(ref, () => ({
        isOpen: () => open,
        open: () => setOpen(true),
        close: () => setOpen(false),
    }), [open]);
    (0, react_1.useEffect)(() => {
        if (!open || !closeOnEscape)
            return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape')
                setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, closeOnEscape]);
    const handleToggle = (e) => {
        e.stopPropagation();
        if (!open && triggerRef.current) {
            setContainer(findHintContainer(triggerRef.current));
        }
        setOpen((v) => !v);
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(styles_1.HintTrigger, { ref: triggerRef, type: "button", "aria-label": ariaLabel, "aria-expanded": open, "aria-haspopup": "dialog", onClick: handleToggle, children: (0, jsx_runtime_1.jsx)(IconInfo, {}) }), open &&
                container &&
                (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsxs)(styles_1.HintOverlay, { role: "dialog", "aria-modal": "true", "aria-label": ariaLabel, onClick: (e) => e.stopPropagation(), onContextMenu: (e) => {
                        e.preventDefault();
                        setOpen(false);
                    }, children: [(0, jsx_runtime_1.jsx)(styles_1.HintOverlayClose, { type: "button", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: () => setOpen(false), children: (0, jsx_runtime_1.jsx)(IconClose, {}) }), (0, jsx_runtime_1.jsx)(styles_1.HintOverlayBody, { children: children })] }), container)] }));
});
//# sourceMappingURL=InfoHint.js.map