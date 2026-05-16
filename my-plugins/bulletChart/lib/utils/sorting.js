"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortRows = sortRows;
/**
 * Сортировка строк в заданном порядке.
 * Возвращает новый массив — исходный не мутируется.
 */
function sortRows(rows, sortBy) {
    const copy = [...rows];
    switch (sortBy) {
        case 'factDesc':
            return copy.sort((a, b) => b.rate - a.rate);
        case 'factAsc':
            return copy.sort((a, b) => a.rate - b.rate);
        case 'deltaPlanDesc':
            return copy.sort((a, b) => (b.deltaPlan ?? -Infinity) - (a.deltaPlan ?? -Infinity));
        case 'deltaPyDesc':
            return copy.sort((a, b) => (b.deltaPy ?? -Infinity) - (a.deltaPy ?? -Infinity));
        case 'storesDesc':
            return copy.sort((a, b) => (b.stores ?? 0) - (a.stores ?? 0));
        case 'nameAsc':
            return copy.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        default:
            return copy;
    }
}
//# sourceMappingURL=sorting.js.map