import type { Horizon, MetricMode, Store, TempoResult } from '../types';
/**
 * Вычисляет темп и разницу между периодами для магазина на заданном
 * горизонте. Порт computeTempo() из `velocity-diverging-prototype.html`.
 *
 * - `wow`: неделя 11 vs неделя 10 (последняя vs предпоследняя).
 * - `4w`:  сумма недель 8..11 vs сумма 4..7 (4W vs 4W).
 * - `mom`: сумма недель 8..11 vs сумма 0..3 (этот месяц vs позапрошлый).
 * - `cum`: сумма 6..11 vs сумма 0..5 (вторые 6 недель vs первые 6).
 *
 * Возвращает NaN-безопасные значения: если prev=0 → tempo=1, pctChange=0.
 */
export declare function computeTempo(store: Store, horizon: Horizon, metric: MetricMode): TempoResult;
/** Классификация магазина по темпу: grow / shrink / flat. */
export declare function tempoDirection(tempo: number): 'grow' | 'shrink' | 'flat';
//# sourceMappingURL=computeTempo.d.ts.map