import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// scorecard-local: модальная версия InfoHint. Портал в document.body +
// backdrop + центрированная карточка. Mobile-friendly (любая ширина Card
// не ограничивает модалку). После approval — мигрировать в canonical.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, } from 'react';
import { createPortal } from 'react-dom';
import { HintTrigger, HintModalBackdrop, HintModalCard, HintOverlayClose, HintOverlayBody, HintOverlayTitle, } from './styles';
function IconInfo() {
    return (_jsxs("svg", { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "10", cy: "10", r: "8" }), _jsx("path", { d: "M10 6.5 L10 6.5", strokeWidth: 2.2 }), _jsx("path", { d: "M10 9 L10 14" })] }));
}
function IconClose() {
    return (_jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M4 4 L12 12 M12 4 L4 12" }) }));
}
export const InfoHint = forwardRef(function InfoHint({ ariaLabel, children, closeOnEscape = true, title = 'Управление чартом' }, ref) {
    const [open, setOpen] = useState(false);
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
        setOpen((v) => !v);
    };
    return (_jsxs(_Fragment, { children: [_jsx(HintTrigger, { ref: triggerRef, type: "button", "aria-label": ariaLabel, "aria-expanded": open, "aria-haspopup": "dialog", onClick: handleToggle, children: _jsx(IconInfo, {}) }), open &&
                typeof document !== 'undefined' &&
                createPortal(_jsx(HintModalBackdrop, { onClick: (e) => {
                        e.stopPropagation();
                        setOpen(false);
                    }, onContextMenu: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpen(false);
                    }, children: _jsxs(HintModalCard, { role: "dialog", "aria-modal": "true", "aria-label": ariaLabel, onClick: (e) => e.stopPropagation(), children: [_jsx(HintOverlayClose, { type: "button", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: () => setOpen(false), children: _jsx(IconClose, {}) }), title && _jsx(HintOverlayTitle, { children: title }), _jsx(HintOverlayBody, { children: children })] }) }), document.body)] }));
});
//# sourceMappingURL=InfoHint.js.map