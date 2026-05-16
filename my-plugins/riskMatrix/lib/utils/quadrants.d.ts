import { QuadrantKey, QuadrantStats, StorePoint } from '../types';
export interface Thresholds {
    x: number;
    y: number;
}
/** Определить квадрант точки относительно порогов */
export declare function getQuadrant(store: StorePoint, t: Thresholds): QuadrantKey;
/** Агрегированная статистика по 4 квадрантам */
export declare function getQuadrantStats(stores: StorePoint[], t: Thresholds): Record<QuadrantKey, QuadrantStats>;
/**
 * Оценка «badness» — отклонение от плана.
 * Чем больше, тем хуже магазин.
 */
export declare function storeBadness(s: StorePoint): number;
/** Топ-N худших магазинов (по badness) */
export declare function getWorstN(stores: StorePoint[], n: number): Set<string>;
/** Средневзвешенный план (weight = size) */
export declare function computeWeightedAverage(values: number[], weights: number[]): number;
/** Простое арифметическое среднее (игнорирует NaN/Infinity) */
export declare function computeAverage(values: number[]): number;
//# sourceMappingURL=quadrants.d.ts.map