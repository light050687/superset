/**
 * Серверная пагинация магазинов для карточки Velocity Diverging — v2.
 *
 * Стратегия period-over-period:
 *  - preset modes: один query с `time_offsets: [<shift>]`. Backend возвращает
 *    столбцы `<metric>` (текущий) + `<metric>__<shift>` (прошлый). Одна row
 *    на магазин — pagination прямая (row_limit = pageSize+1, row_offset = page*pageSize).
 *  - custom mode: два query с разными `time_range`.
 *
 * Reference: BigNumberPeriodOverPeriod (upstream) и MixedTimeseries.
 */
import type { ComparisonMode, StoresQueryParams } from '../types';
/** Сортировки в карточке. Сервер сортирует по level магазина (group). */
export type ServerSortBy = 'tempo' | 'name' | 'absDelta';
interface StoresPayloadParams {
    queryParams: StoresQueryParams;
    page: number;
    pageSize: number;
    sortBy: ServerSortBy;
    sortAsc: boolean;
    searchQuery: string;
    /**
     * Override comparison-режима (от компонента). Если не задан — берётся из
     * queryParams.comparisonMode.
     */
    comparisonMode?: ComparisonMode;
    customCurrentRange?: [string, string];
    customPreviousRange?: [string, string];
}
/**
 * Build payload для подгрузки страницы магазинов.
 *
 * Возвращает (pageSize+1) уникальных магазинов в одной странице.
 * В custom-режиме — два query, frontend сам слит результаты.
 */
export declare function buildStoresPayload(params: StoresPayloadParams): Record<string, unknown>;
/**
 * Build payload для exact-count магазинов. Группируем только по storeCode
 * без недели — получаем минимум данных.
 */
export declare function buildStoresCountPayload(params: Omit<StoresPayloadParams, 'page' | 'pageSize' | 'sortBy' | 'sortAsc'>): Record<string, unknown>;
/** Извлечь массив строк из ответа Superset API (queries[0].data). */
export declare function extractApiRows(json: Record<string, unknown>): Record<string, unknown>[];
/** Извлечь второй query (comparison) — для custom-режима. */
export declare function extractApiCompRows(json: Record<string, unknown>): Record<string, unknown>[] | undefined;
export {};
//# sourceMappingURL=detailApi.d.ts.map