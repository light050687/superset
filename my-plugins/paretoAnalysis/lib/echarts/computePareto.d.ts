import { ComputedPareto, ParetoItem } from '../types';
/**
 * Чистая функция: берёт сырые items, threshold (50..95) и возвращает
 * отсортированный по убыванию value массив с ABC-зонами, cumulative %,
 * рангами (текущий и прошлый) и тегами (newInA / rankDelta / lossPctOfRevenue).
 *
 * Покрытие тестами: см. test/computePareto.test.ts
 */
export declare function computePareto(rawItems: ParetoItem[], threshold?: number): ComputedPareto;
//# sourceMappingURL=computePareto.d.ts.map