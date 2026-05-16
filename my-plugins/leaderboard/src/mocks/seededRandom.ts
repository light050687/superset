/**
 * Детерминированный генератор псевдослучайных чисел (LCG).
 * Одинаковый seed всегда даёт одинаковую последовательность —
 * значит mock-данные «стабильны» для конкретного магазина.
 */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Box-Muller: возвращает число из нормального распределения N(mean, sd). */
export function randNormal(rng: () => number, mean: number, sd: number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * sd;
}

/** Детерминированный хеш строки → 32-битное целое (для seed по store_id). */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
