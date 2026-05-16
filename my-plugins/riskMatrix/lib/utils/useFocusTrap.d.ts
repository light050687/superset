import { RefObject } from 'react';
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
export declare function useFocusTrap<T extends HTMLElement>(active: boolean): RefObject<T>;
//# sourceMappingURL=useFocusTrap.d.ts.map