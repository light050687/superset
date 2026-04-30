/**
 * SupersetClient — lazy-load detail data для drill modals.
 *
 * Вызывается из StoreDrillModal / QuadrantDrillModal при открытии;
 * делает параллельные запросы к /api/v1/chart/data.
 *
 * Паттерн взят из kpiCard/src/utils/detailApi.ts и адаптирован под
 * 3 типа drill-данных: trend (12 недель), causes (топ-3), skus (топ-5).
 */
import { DetailQueryParams } from '../types';
export interface TrendPoint {
    t: string;
    value: number;
}
export interface CauseRow {
    name: string;
    value: number;
}
export interface SkuRow {
    name: string;
    value: number;
}
export interface RankInFormat {
    rank: number;
    total: number;
}
/** ===================== TREND ===================== */
export declare function fetchStoreTrend(params: DetailQueryParams, storeId: string): Promise<TrendPoint[]>;
/** ===================== CAUSES (top-N) ===================== */
export declare function fetchStoreCauses(params: DetailQueryParams, storeId: string): Promise<CauseRow[]>;
/** ===================== SKUs (top-N) ===================== */
export declare function fetchStoreSkus(params: DetailQueryParams, storeId: string): Promise<SkuRow[]>;
//# sourceMappingURL=detailApi.d.ts.map