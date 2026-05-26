import type { FlatRow, FormatCode, SortDir, SortKey, StatusCode, Store } from '../types';
export interface DerivedRowsInput {
    stores: Store[];
    debouncedSearch: string;
    statusFilters: Set<StatusCode>;
    formatFilters: Set<FormatCode>;
    pinned: Set<string>;
    expanded: Set<string>;
    sortBy: SortKey;
    sortDir: SortDir;
    /** 0-indexed страница. Если pageSize не задан — игнорируется. */
    page: number;
    /** Размер страницы. 0 / undefined → пагинация выключена. */
    pageSize: number;
}
export interface DerivedRowsOutput {
    /** Отфильтрованные и отсортированные магазины (весь набор, БЕЗ slice по странице). */
    rankedStores: Store[];
    /** Плоский список строк ТОЛЬКО для текущей страницы (магазины + раскрытые сегменты). */
    flatRows: FlatRow[];
    /** Количество магазинов после фильтров, ДО slice по странице. */
    shownCount: number;
    /** Общее число магазинов до фильтров. */
    totalCount: number;
    /** Общее число страниц для текущего pageSize. Минимум 1. */
    pageCount: number;
    /** Валидный (clamped) номер страницы — если state.page > pageCount-1, тут уже скорректировано. */
    safePage: number;
}
/**
 * Поэтапная цепочка useMemo: каждый шаг кешируется независимо,
 * что помогает изолировать инвалидацию (например смена expanded
 * не вызывает пересортировку).
 */
export declare function useDerivedRows(input: DerivedRowsInput): DerivedRowsOutput;
//# sourceMappingURL=useDerivedRows.d.ts.map