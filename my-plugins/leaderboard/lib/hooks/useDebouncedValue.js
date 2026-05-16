"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDebouncedValue = useDebouncedValue;
const react_1 = require("react");
/**
 * Возвращает значение с задержкой (debounce).
 * Полезно для search-инпута — чтобы не пересчитывать фильтры на каждый ввод.
 */
function useDebouncedValue(value, delayMs) {
    const [debounced, setDebounced] = (0, react_1.useState)(value);
    (0, react_1.useEffect)(() => {
        const id = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(id);
    }, [value, delayMs]);
    return debounced;
}
//# sourceMappingURL=useDebouncedValue.js.map