import { useEffect, RefObject } from 'react';

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
export function useKeyboardNav(
  handlers: KeyboardNavHandlers,
  target?: RefObject<HTMLElement>,
): void {
  useEffect(() => {
    const el: HTMLElement | (Window & typeof globalThis) =
      target?.current ?? window;
    const listener = (e: Event) => {
      const ke = e as KeyboardEvent;
      switch (ke.key) {
        case 'Escape':
          if (handlers.onEscape) {
            handlers.onEscape();
          }
          break;
        case 'ArrowDown':
          if (handlers.onArrowDown) {
            ke.preventDefault();
            handlers.onArrowDown();
          }
          break;
        case 'ArrowUp':
          if (handlers.onArrowUp) {
            ke.preventDefault();
            handlers.onArrowUp();
          }
          break;
        case 'Enter':
          if (handlers.onEnter) {
            handlers.onEnter();
          }
          break;
        case ' ':
        case 'Spacebar':
          if (handlers.onSpace) {
            ke.preventDefault();
            handlers.onSpace();
          }
          break;
        default:
          break;
      }
    };
    el.addEventListener('keydown', listener as EventListener);
    return () => {
      el.removeEventListener('keydown', listener as EventListener);
    };
  }, [handlers, target]);
}
