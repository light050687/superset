/**
 * Drill-down API для DetailModal: серверный GROUP BY по detail-колонке
 * с фильтром по выбранной категории. Один POST запрос на открытие модали.
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
/**
 * Запрос к /api/v1/chart/data без сохранённого chart — формируется query_context.
 */
export declare function fetchDetailRows(params: DetailQueryParams): Promise<DetailStoreRow[]>;
/** Получить ярлык метрики (безопасно для undefined). */
export declare function safeMetricLabel(m: QueryFormMetric | undefined): string | null;
//# sourceMappingURL=detailApi.d.ts.map