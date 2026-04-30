import { QueryFormMetric } from '@superset-ui/core';
import { FormatRow, RowStatus, Direction } from '../types';
interface AggregationInput {
    rawRows: Record<string, unknown>[];
    categoryColumn: string;
    metricFact: QueryFormMetric | undefined;
    metricPlan: QueryFormMetric | undefined;
    metricPy: QueryFormMetric | undefined;
    metricStores: QueryFormMetric | undefined;
    direction: Direction;
    /** Tolerance зоны «около плана» в процентах от plan. По умолчанию 5% (ref:635-641). */
    tolerancePct?: number;
}
/** Преобразование сырых rows из queriesData[0].data → список FormatRow. */
export declare function buildFormatRows(input: AggregationInput): FormatRow[];
/**
 * Статус строки по соотношению rate/plan и направлению метрики.
 *
 * Формула из прототипа (ref:635-641):
 *   ratio = rate / plan
 *   less_is_better: ratio ≤ (1 − tol) → good; ratio ≥ (1 + tol) → bad; иначе warn
 *   more_is_better: инверсия
 *
 * @param rate         фактическое значение
 * @param plan         целевое значение; если null → neutral
 * @param direction    что считать успехом
 * @param tolerancePct размер «серой зоны» вокруг плана, %
 */
export declare function computeStatus(rate: number, plan: number | null, direction: Direction, tolerancePct?: number): RowStatus;
/** Единая шкала для всех bullet-баров — max(rate, plan, py) × 1.1 (ref:865). */
export declare function computeScaleMax(rows: FormatRow[]): number;
export {};
//# sourceMappingURL=aggregation.d.ts.map