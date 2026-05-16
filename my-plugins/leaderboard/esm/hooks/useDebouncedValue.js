import { useEffect, useState } from 'react';
/**
 * Возвращает значение с задержкой (debounce).
 * Полезно для search-инпута — чтобы не пересчитывать фильтры на каждый ввод.
 */
export function useDebouncedValue(value, delayMs) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(id);
    }, [value, delayMs]);
    return debounced;
}
//# sourceMappingURL=useDebouncedValue.js.map