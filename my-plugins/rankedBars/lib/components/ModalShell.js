"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const styles_1 = require("../styles");
/**
 * Common modal wrapper: portal-mounted backdrop + box with shared styling.
 * Handles click-outside-to-close and ensures CSS custom properties exist in the
 * portal subtree via `rootCss` + `data-theme`.
 *
 * Focus trap/restore is intentionally minimal: we set initial focus on the
 * first focusable child and listen to Tab to prevent escaping. `Escape`
 * handling is done by the RankedBars parent (priority-aware for stacked
 * modals).
 */
const ModalShell = ({ open, onClose, wide = false, themeMode, zIndex, labelledBy, children, }) => {
    const boxRef = (0, react_1.useRef)(null);
    const previousActive = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!open)
            return undefined;
        previousActive.current = document.activeElement;
        const box = boxRef.current;
        if (box) {
            const focusable = box.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            focusable?.focus();
        }
        return () => {
            const prev = previousActive.current;
            if (prev instanceof HTMLElement) {
                prev.focus();
            }
        };
    }, [open]);
    (0, react_1.useEffect)(() => {
        if (!open)
            return undefined;
        function onKey(evt) {
            if (evt.key !== 'Tab')
                return;
            const box = boxRef.current;
            if (!box)
                return;
            const focusables = Array.from(box.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
            if (focusables.length === 0)
                return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;
            if (evt.shiftKey) {
                if (active === first || !box.contains(active)) {
                    evt.preventDefault();
                    last.focus();
                }
            }
            else if (active === last) {
                evt.preventDefault();
                first.focus();
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);
    if (!open || typeof document === 'undefined')
        return null;
    return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)(styles_1.ModalBackdrop, { "data-theme": themeMode, "$zIndex": zIndex, onClick: e => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: (0, jsx_runtime_1.jsx)(styles_1.ModalBox, { ref: boxRef, role: "dialog", "aria-modal": "true", "aria-labelledby": labelledBy, "$wide": wide, children: children }) }), document.body);
};
exports.default = ModalShell;
//# sourceMappingURL=ModalShell.js.map