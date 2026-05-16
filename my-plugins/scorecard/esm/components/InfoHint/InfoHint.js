import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// @canonical-version: 3.2.0
// @canonical-source: superset/my-plugins/_shared/info-hint/
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, } from 'react';
import { createPortal } from 'react-dom';
import { HintTrigger, HintOverlay, HintOverlayClose, HintOverlayBody, HintOverlayTitle, } from './styles';
function IconInfo() {
    return (_jsxs("svg", { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "10", cy: "10", r: "8" }), _jsx("path", { d: "M10 6.5 L10 6.5", strokeWidth: 2.2 }), _jsx("path", { d: "M10 9 L10 14" })] }));
}
function IconClose() {
    return (_jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M4 4 L12 12 M12 4 L4 12" }) }));
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
export const InfoHint = forwardRef(function InfoHint({ ariaLabel, children, closeOnEscape = true, title = 'Управление чартом' }, ref) {
    const [open, setOpen] = useState(false);
    const [container, setContainer] = useState(null);
    const triggerRef = useRef(null);
    useImperativeHandle(ref, () => ({
        isOpen: () => open,
        open: () => setOpen(true),
        close: () => setOpen(false),
    }), [open]);
    useEffect(() => {
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
    return (_jsxs(_Fragment, { children: [_jsx(HintTrigger, { ref: triggerRef, type: "button", "aria-label": ariaLabel, "aria-expanded": open, "aria-haspopup": "dialog", onClick: handleToggle, children: _jsx(IconInfo, {}) }), open &&
                container &&
                createPortal(_jsxs(HintOverlay, { role: "dialog", "aria-modal": "true", "aria-label": ariaLabel, onClick: (e) => e.stopPropagation(), onContextMenu: (e) => {
                        e.preventDefault();
                        setOpen(false);
                    }, children: [_jsx(HintOverlayClose, { type: "button", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: () => setOpen(false), children: _jsx(IconClose, {}) }), title && _jsx(HintOverlayTitle, { children: title }), _jsx(HintOverlayBody, { children: children })] }), container)] }));
});
//# sourceMappingURL=InfoHint.js.map