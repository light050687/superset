import { RefObject } from 'react';
/**
 * Простая реализация focus-trap для модальных окон.
 * При активации запоминает предыдущий activeElement, ловит фокус внутри
 * переданного контейнера, и возвращает фокус при деактивации.
 *
 * Не заменяет полноценный focus-trap из @react-aria, но достаточен для
 * небольших модалок без iframe/custom elements.
 */
export declare function useFocusTrap(active: boolean, containerRef: RefObject<HTMLElement>): void;
//# sourceMappingURL=useFocusTrap.d.ts.map