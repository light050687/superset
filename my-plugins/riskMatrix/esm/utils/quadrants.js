/** Определить квадрант точки относительно порогов */
export function getQuadrant(store, t) {
    const x = store.x;
    const y = store.y;
    if (x >= t.x && y >= t.y)
        return 'tr';
    if (x < t.x && y >= t.y)
        return 'tl';
    if (x >= t.x && y < t.y)
        return 'br';
    return 'bl';
}
/** Агрегированная статистика по 4 квадрантам */
export function getQuadrantStats(stores, t) {
    const stats = {
        tl: { count: 0, loss: 0 },
        tr: { count: 0, loss: 0 },
        bl: { count: 0, loss: 0 },
        br: { count: 0, loss: 0 },
    };
    stores.forEach((s) => {
        const q = getQuadrant(s, t);
        stats[q].count += 1;
        stats[q].loss += s.sumLoss ?? 0;
    });
    return stats;
}
/**
 * Оценка «badness» — отклонение от плана.
 * Чем больше, тем хуже магазин.
 */
export function storeBadness(s) {
    const dx = s.planX && s.planX !== 0 ? (s.x - s.planX) / s.planX : 0;
    const dy = s.planY && s.planY !== 0 ? (s.y - s.planY) / s.planY : 0;
    return dx + Math.max(0, dy);
}
/** Топ-N худших магазинов (по badness) */
export function getWorstN(stores, n) {
    const sorted = [...stores].sort((a, b) => storeBadness(b) - storeBadness(a));
    return new Set(sorted.slice(0, n).map((s) => s.id));
}
/** Средневзвешенный план (weight = size) */
export function computeWeightedAverage(values, weights) {
    if (values.length === 0)
        return 0;
    let sumW = 0;
    let sumWV = 0;
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        const w = weights[i];
        if (!Number.isFinite(v) || !Number.isFinite(w) || w <= 0)
            continue;
        sumW += w;
        sumWV += v * w;
    }
    return sumW > 0 ? sumWV / sumW : 0;
}
/** Простое арифметическое среднее (игнорирует NaN/Infinity) */
export function computeAverage(values) {
    if (values.length === 0)
        return 0;
    let sum = 0;
    let count = 0;
    for (const v of values) {
        if (Number.isFinite(v)) {
            sum += v;
            count += 1;
        }
    }
    return count > 0 ? sum / count : 0;
}
//# sourceMappingURL=quadrants.js.map