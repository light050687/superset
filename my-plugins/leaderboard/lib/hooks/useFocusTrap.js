"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFocusTrap = useFocusTrap;
const react_1 = require("react");
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');
/**
 * Простая реализация focus-trap для модальных окон.
 * При активации запоминает предыдущий activeElement, ловит фокус внутри
 * переданного контейнера, и возвращает фокус при деактивации.
 *
 * Не заменяет полноценный focus-trap из @react-aria, но достаточен для
 * небольших модалок без iframe/custom elements.
 */
function useFocusTrap(active, containerRef) {
    (0, react_1.useEffect)(() => {
        if (!active)
            return undefined;
        const container = containerRef.current;
        if (!container)
            return undefined;
        const previouslyFocused = document.activeElement;
        /* Фокус на первый focusable в контейнере или на сам контейнер */
        const focusables = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
        if (focusables.length > 0) {
            focusables[0].focus();
        }
        else {
            container.focus();
        }
        const handleKeyDown = (e) => {
            if (e.key !== 'Tab')
                return;
            const live = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
            if (live.length === 0) {
                e.preventDefault();
                return;
            }
            const first = live[0];
            const last = live[live.length - 1];
            const active = document.activeElement;
            if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            }
            else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                previouslyFocused.focus();
            }
        };
    }, [active, containerRef]);
}
//# sourceMappingURL=useFocusTrap.js.map