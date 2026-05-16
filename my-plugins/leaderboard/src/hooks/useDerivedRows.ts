import { useMemo } from 'react';
import type {
  FlatRow,
  FormatCode,
  SortDir,
  SortKey,
  StatusCode,
  Store,
} from '../types';

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
export function useDerivedRows(input: DerivedRowsInput): DerivedRowsOutput {
  const {
    stores,
    debouncedSearch,
    statusFilters,
    formatFilters,
    pinned,
    expanded,
    sortBy,
    sortDir,
  } = input;

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return stores.filter(s => {
      if (formatFilters.size > 0 && !formatFilters.has(s.format)) return false;
      if (statusFilters.size > 0 && !statusFilters.has(s.status)) return false;
      if (
        q &&
        !s.name.toLowerCase().includes(q) &&
        !s.city.toLowerCase().includes(q) &&
        !s.code.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [stores, debouncedSearch, statusFilters, formatFilters]);

  const sorted = useMemo(() => {
    const dirMul = sortDir === 'asc' ? 1 : -1;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortBy] as string | number;
      const bv = b[sortBy] as string | number;
      if (typeof av === 'string' && typeof bv === 'string') {
        return dirMul * av.localeCompare(bv, 'ru');
      }
      return dirMul * ((av as number) - (bv as number));
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  /* Pinned — наверх, сохраняем порядок внутри группы */
  const rankedStores = useMemo(() => {
    if (pinned.size === 0) return sorted;
    const p: Store[] = [];
    const rest: Store[] = [];
    sorted.forEach(s => (pinned.has(s.id) ? p.push(s) : rest.push(s)));
    return [...p, ...rest];
  }, [sorted, pinned]);

  const flatRows = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    rankedStores.forEach((s, i) => {
      rows.push({
        kind: 'store',
        data: s,
        level: 0,
        displayIdx: i + 1,
      });
      if (expanded.has(s.id)) {
        const segs = [...s.segmentsDist].sort(
          (a, b) => b.lossCombined - a.lossCombined,
        );
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
