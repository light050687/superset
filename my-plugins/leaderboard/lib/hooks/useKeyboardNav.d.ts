import { RefObject } from 'react';
export interface KeyboardNavHandlers {
    onEscape?: () => void;
    onArrowDown?: () => void;
    onArrowUp?: () => void;
    onEnter?: () => void;
    onSpace?: () => void;
}
/**
 * Навешивает keydown-listener на переданный контейнер (или window,
 * если ref отсутствует). Полезно для Esc/↑/↓/Enter/Space.
 */
export declare function useKeyboardNav(handlers: KeyboardNavHandlers, target?: RefObject<HTMLElement>): void;
//# sourceMappingURL=useKeyboardNav.d.ts.map