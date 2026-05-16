/**
 * Детерминированный генератор псевдослучайных чисел (LCG).
 * Одинаковый seed всегда даёт одинаковую последовательность —
 * значит mock-данные «стабильны» для конкретного магазина.
 */
export declare function seededRandom(seed: number): () => number;
/** Box-Muller: возвращает число из нормального распределения N(mean, sd). */
export declare function randNormal(rng: () => number, mean: number, sd: number): number;
/** Детерминированный хеш строки → 32-битное целое (для seed по store_id). */
export declare function hashString(input: string): number;
//# sourceMappingURL=seededRandom.d.ts.map