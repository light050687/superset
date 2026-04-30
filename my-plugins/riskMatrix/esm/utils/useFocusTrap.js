import { useEffect, useRef } from 'react';
const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
/**
 * Focus trap для модальных окон (WCAG 2.2 AA).
 *
 * - Запоминает элемент, бывший в фокусе до открытия модали.
 * - При Tab — зацикливает фокус между первым и последним focusable внутри.
 * - При unmount — возвращает фокус предыдущему элементу.
 *
 * @param active  Активна ли ловушка (обычно = модаль открыта)
 * @returns       Ref, который нужно повесить на корневой элемент модали
 */
export function useFocusTrap(active) {
    const containerRef = useRef(null);
    const previouslyFocusedRef = useRef(null);
    useEffect(() => {
        if (!active)
            return;
        // Запоминаем активный элемент, чтобы восстановить фокус при закрытии
        previouslyFocusedRef.current = document.activeElement;
        const container = containerRef.current;
        if (!container)
            return;
        // Перемещаем фокус внутрь модали на первый focusable (или сам контейнер)
        const getFocusable = () => Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null);
        const focusables = getFocusable();
        if (focusables.length > 0) {
            focusables[0].focus();
        }
        else {
            container.setAttribute('tabindex', '-1');
            container.focus();
        }
        const onKeyDown = (e) => {
            if (e.key !== 'Tab')
                return;
            const list = getFocusable();
            if (list.length === 0) {
                e.preventDefault();
                return;
            }
            const first = list[0];
            const last = list[list.length - 1];
            const current = document.activeElement;
            if (e.shiftKey) {
                if (current === first || !container.contains(current)) {
                    e.preventDefault();
                    last.focus();
                }
            }
            else {
                if (current === last || !container.contains(current)) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        container.addEventListener('keydown', onKeyDown);
        return () => {
            container.removeEventListener('keydown', onKeyDown);
            // Восстанавливаем фокус
            const prev = previouslyFocusedRef.current;
            if (prev && typeof prev.focus === 'function') {
                try {
                    prev.focus();
                }
                catch {
                    // silently ignore — элемент мог быть размонтирован
                }
            }
        };
    }, [active]);
    return containerRef;
}
//# sourceMappingURL=useFocusTrap.js.map