"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKeyboardNav = useKeyboardNav;
const react_1 = require("react");
/**
 * Навешивает keydown-listener на переданный контейнер (или window,
 * если ref отсутствует). Полезно для Esc/↑/↓/Enter/Space.
 */
function useKeyboardNav(handlers, target) {
    (0, react_1.useEffect)(() => {
        const el = target?.current ?? window;
        const listener = (e) => {
            const ke = e;
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
        el.addEventListener('keydown', listener);
        return () => {
            el.removeEventListener('keydown', listener);
        };
    }, [handlers, target]);
}
//# sourceMappingURL=useKeyboardNav.js.map