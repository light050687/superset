import type { TempoResult } from '../types';
/**
 * Вычисляет темп и разницу между prev и curr — period-over-period.
 *
 * Раньше функция нарезала локально weeks[12] на 4 фиксированных горизонта
 * (WoW/4W/MoM/Cum). Теперь prev/curr приходят готовыми из backend
 * (через Superset built-in `time_compare`), а локально остаётся только
 * чистая арифметика темпа.
 *
 * NaN-безопасно: если prev=0 → tempo=1, pctChange=0 (отсутствие базы для
 * сравнения трактуется как «нет изменений»).
 */
export declare function computeTempo(prev: number, curr: number): TempoResult;
/** Классификация магазина по темпу: grow / shrink / flat. */
export declare function tempoDirection(tempo: number): 'grow' | 'shrink' | 'flat';
//# sourceMappingURL=computeTempo.d.ts.map