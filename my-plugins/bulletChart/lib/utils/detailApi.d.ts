/**
 * Drill-down API для DetailModal: серверный GROUP BY по detail-колонке
 * с фильтром по выбранной категории. Server-side pagination через
 * row_offset + row_limit = pageSize + 1 (cursor-based hasNextPage detection,
 * паттерн scorecard buildGroupsPayload).
 */
import type { QueryFormMetric } from '@superset-ui/core';
import type { DetailQueryParams } from '../types';
export interface DetailStoreRow {
    name: string;
    rate: number;
    plan: number | null;
    py: number | null;
    stores: number | null;
}
export interface FetchDetailRowsResult {
    rows: DetailStoreRow[];
    hasNextPage: boolean;
}
interface FetchDetailParams extends DetailQueryParams {
    /** Page index 0-based. */
    page?: number;
    /** Number of rows per page. */
    pageSize?: number;
    /** Optional ILIKE search query на детальной колонке. */
    searchQuery?: string;
    /** AbortSignal — для отмены при смене страницы/поиска/закрытии модалки. */
    signal?: AbortSignal;
}
/**
 * Запрос страницы детализации.
 *
 *   row_limit = pageSize + 1 → server возвращает на 1 больше → hasNextPage = received > pageSize.
 *   row_offset = page * pageSize.
 *   orderby по основной метрике (fact desc) — server-side стабильная сортировка.
 *
 * Сохраняет back-compat сигнатуру: page/pageSize опциональны (default 0 / 50).
 */
export declare function fetchDetailRows(params: FetchDetailParams): Promise<FetchDetailRowsResult>;
/**
 * Точный count детализации для PaginationWrap.
 *
 *   Pattern из scorecard buildCountPayload: GROUP BY detailGroupby без пагинации,
 *   запрашиваем только основную метрику для HAVING != 0 (минимум transfer).
 *   Затем `rows.length` = total non-zero groups.
 *
 *   row_limit 100000 — defensive cap (реалистично детальная колонка <50K уникальных).
 */
export declare function fetchDetailCount(params: FetchDetailParams): Promise<number>;
/** Получить ярлык метрики (безопасно для undefined). */
export declare function safeMetricLabel(m: QueryFormMetric | undefined): string | null;
export {};
//# sourceMappingURL=detailApi.d.ts.map