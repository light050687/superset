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
}
export interface DerivedRowsOutput {
    /** Отфильтрованные и отсортированные магазины (без flatten). */
    rankedStores: Store[];
    /** Плоский список строк для рендера (магазины + раскрытые сегменты). */
    flatRows: FlatRow[];
    /** Количество магазинов после фильтров (для подсчёта «N из total»). */
    shownCount: number;
    /** Общее число магазинов до фильтров. */
    totalCount: number;
}
/**
 * Поэтапная цепочка useMemo: каждый шаг кешируется независимо,
 * что помогает изолировать инвалидацию (например смена expanded
 * не вызывает пересортировку).
 */
export declare function useDerivedRows(input: DerivedRowsInput): DerivedRowsOutput;
//# sourceMappingURL=useDerivedRows.d.ts.map