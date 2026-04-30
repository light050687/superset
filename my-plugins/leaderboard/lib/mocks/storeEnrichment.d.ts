import type { Store } from '../types';
/**
 * Базовое ядро магазина — всё, что мы получаем из queriesData.
 * Заполняется в transformProps.
 */
export interface StoreBase {
    id: string;
    code: string;
    name: string;
    shortLabel: string;
    city: string;
    format: Store['format'];
    formatName: string;
    division: string;
    revenue: number;
    toClass: number;
    writeoff: number;
    shrinkage: number;
    planWriteoff: number;
    planShrinkage: number;
    avgWriteoff: number;
    avgShrinkageCheck: number;
}
/**
 * Дополняет «реальный» магазин мок-полями:
 *   - spark: тренд 12 недель
 *   - causeDist / woTypeDist: распределения по причинам и видам списаний
 *   - segmentsDist: сегменты для tree-accordion
 *   - main* поля для driversCell
 *   - status, statusRank
 *
 * Всё детерминировано от store_id, что гарантирует стабильность значений
 * при повторных рендерах.
 *
 * TODO (следующая итерация): заменить моки на SupersetClient-запросы при
 * открытии модали и раскрытии tree.
 */
export declare function enrichStoreWithMocks(base: StoreBase): Store;
//# sourceMappingURL=storeEnrichment.d.ts.map