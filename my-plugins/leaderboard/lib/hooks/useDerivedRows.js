"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDerivedRows = useDerivedRows;
const react_1 = require("react");
/**
 * Поэтапная цепочка useMemo: каждый шаг кешируется независимо,
 * что помогает изолировать инвалидацию (например смена expanded
 * не вызывает пересортировку).
 */
function useDerivedRows(input) {
    const { stores, debouncedSearch, statusFilters, formatFilters, pinned, expanded, sortBy, sortDir, } = input;
    const filtered = (0, react_1.useMemo)(() => {
        const q = debouncedSearch.trim().toLowerCase();
        return stores.filter(s => {
            if (formatFilters.size > 0 && !formatFilters.has(s.format))
                return false;
            if (statusFilters.size > 0 && !statusFilters.has(s.status))
                return false;
            if (q &&
                !s.name.toLowerCase().includes(q) &&
                !s.city.toLowerCase().includes(q) &&
                !s.code.toLowerCase().includes(q)) {
                return false;
            }
            return true;
        });
    }, [stores, debouncedSearch, statusFilters, formatFilters]);
    const sorted = (0, react_1.useMemo)(() => {
        const dirMul = sortDir === 'asc' ? 1 : -1;
        const arr = [...filtered];
        arr.sort((a, b) => {
            const av = a[sortBy];
            const bv = b[sortBy];
            if (typeof av === 'string' && typeof bv === 'string') {
                return dirMul * av.localeCompare(bv, 'ru');
            }
            return dirMul * (av - bv);
        });
        return arr;
    }, [filtered, sortBy, sortDir]);
    /* Pinned — наверх, сохраняем порядок внутри группы */
    const rankedStores = (0, react_1.useMemo)(() => {
        if (pinned.size === 0)
            return sorted;
        const p = [];
        const rest = [];
        sorted.forEach(s => (pinned.has(s.id) ? p.push(s) : rest.push(s)));
        return [...p, ...rest];
    }, [sorted, pinned]);
    const flatRows = (0, react_1.useMemo)(() => {
        const rows = [];
        rankedStores.forEach((s, i) => {
            rows.push({
                kind: 'store',
                data: s,
                level: 0,
                displayIdx: i + 1,
            });
            if (expanded.has(s.id)) {
                const segs = [...s.segmentsDist].sort((a, b) => b.lossCombined - a.lossCombined);
                segs.forEach((seg, j) => {
                    rows.push({
                        kind: 'segment',
                        data: seg,
                        level: 1,
                        displayIdx: j + 1,
                        parentStoreId: s.id,
                    });
                });
            }
        });
        return rows;
    }, [rankedStores, expanded]);
    return {
        rankedStores,
        flatRows,
        shownCount: rankedStores.length,
        totalCount: stores.length,
    };
}
//# sourceMappingURL=useDerivedRows.js.map