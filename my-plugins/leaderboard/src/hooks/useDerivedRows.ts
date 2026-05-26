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
    page,
    pageSize,
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

  /* Пагинация: slice rankedStores по странице, потом flatten.
     Slice по rankedStores (а не по flatRows) — иначе expanded-сегменты
     «съедают» магазины в конце страницы. */
  const pageCount = Math.max(
    1,
    pageSize > 0 ? Math.ceil(rankedStores.length / pageSize) : 1,
  );
  const safePage = Math.min(Math.max(0, page), pageCount - 1);

  const pagedStores = useMemo(() => {
    if (pageSize <= 0) return rankedStores;
    const from = safePage * pageSize;
    return rankedStores.slice(from, from + pageSize);
  }, [rankedStores, safePage, pageSize]);

  const flatRows = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    const baseIdx = pageSize > 0 ? safePage * pageSize : 0;
    pagedStores.forEach((s, i) => {
      rows.push({
        kind: 'store',
        data: s,
        level: 0,
        displayIdx: baseIdx + i + 1,
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
  }, [pagedStores, expanded, safePage, pageSize]);

  return {
    rankedStores,
    flatRows,
    shownCount: rankedStores.length,
    totalCount: stores.length,
    pageCount,
    safePage,
  };
}
