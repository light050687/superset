"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePareto = computePareto;
/**
 * Определение зоны по cumPct НА ВХОДЕ в категорию:
 *   cumPrev < threshold          → A (критическая)
 *   threshold ≤ cumPrev < 95     → B (важная)
 *   cumPrev ≥ 95                 → C (хвост)
 *
 * Порядок: threshold 50..95, дефолт 80.
 */
function zoneByCumPrev(cumPrev, threshold) {
    if (cumPrev < threshold)
        return 'A';
    if (cumPrev < 95)
        return 'B';
    return 'C';
}
/**
 * Чистая функция: берёт сырые items, threshold (50..95) и возвращает
 * отсортированный по убыванию value массив с ABC-зонами, cumulative %,
 * рангами (текущий и прошлый) и тегами (newInA / rankDelta / lossPctOfRevenue).
 *
 * Покрытие тестами: см. test/computePareto.test.ts
 */
function computePareto(rawItems, threshold = 80) {
    // Нормализация входа — защита от NaN / undefined value.
    const items = rawItems.map(it => ({
        ...it,
        value: Number.isFinite(it.value) ? it.value : 0,
        valuePrev: it.valuePrev != null && Number.isFinite(it.valuePrev)
            ? it.valuePrev
            : null,
        revenueRub: it.revenueRub != null && Number.isFinite(it.revenueRub)
            ? it.revenueRub
            : null,
    }));
    // Ранги и зоны прошлого периода — считаем один раз.
    // Категорию с valuePrev=0 тоже учитываем в ранжировании (хвост);
    // только valuePrev=null/undefined исключаем.
    const withPrev = items.filter(i => i.valuePrev != null);
    const prevRankMap = {};
    const prevZoneMap = {};
    if (withPrev.length) {
        const prevSorted = [...withPrev].sort((a, b) => b.valuePrev - a.valuePrev);
        const prevTotalRaw = prevSorted.reduce((s, i) => s + i.valuePrev, 0);
        // Защита от деления на 0 — если все valuePrev=0, cumBefore = 0 для всех
        // → зоны стягиваются к A (ни одно значение не даёт рост cum).
        const prevTotal = prevTotalRaw > 0 ? prevTotalRaw : 1;
        let cum = 0;
        prevSorted.forEach((it, idx) => {
            prevRankMap[it.id] = idx + 1;
            const v = it.valuePrev;
            const cumBefore = (cum / prevTotal) * 100;
            prevZoneMap[it.id] = zoneByCumPrev(cumBefore, threshold);
            cum += v;
        });
    }
    // Текущий период.
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const total = sorted.reduce((s, i) => s + i.value, 0) || 1;
    let cum = 0;
    const result = sorted.map((it, idx) => {
        cum += it.value;
        const share = (it.value / total) * 100;
        const cumPct = (cum / total) * 100;
        const cumPrev = idx === 0 ? 0 : cumPct - share;
        const zone = zoneByCumPrev(cumPrev, threshold);
        const rank = idx + 1;
        const rankPrev = prevRankMap[it.id] ?? null;
        const rankDelta = rankPrev != null ? rankPrev - rank : null;
        const wasInA = prevZoneMap[it.id] === 'A';
        const isNewInA = zone === 'A' && !wasInA && rankPrev != null;
        const lossPctOfRevenue = it.revenueRub != null && it.revenueRub > 0
            ? (it.value / it.revenueRub) * 100
            : null;
        return {
            ...it,
            share,
            cumPct,
            zone,
            rank,
            rankPrev,
            rankDelta,
            wasInA,
            isNewInA,
            lossPctOfRevenue,
        };
    });
    // Vital Few summary.
    const zoneA = result.filter(i => i.zone === 'A');
    const lastA = zoneA[zoneA.length - 1];
    const vitalFew = {
        countA: zoneA.length,
        total: result.length,
        cumPctA: lastA ? lastA.cumPct : 0,
        sumA: zoneA.reduce((s, i) => s + i.value, 0),
    };
    return { items: result, total, vitalFew };
}
//# sourceMappingURL=computePareto.js.map