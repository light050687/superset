"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTempo = computeTempo;
exports.tempoDirection = tempoDirection;
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
function computeTempo(prev, curr) {
    const safePrev = Number.isFinite(prev) ? prev : 0;
    const safeCurr = Number.isFinite(curr) ? curr : 0;
    const tempo = safePrev > 0 ? safeCurr / safePrev : 1;
    const pctChange = safePrev > 0 ? ((safeCurr - safePrev) / safePrev) * 100 : 0;
    const absDelta = safeCurr - safePrev;
    return {
        prev: safePrev,
        curr: safeCurr,
        tempo: +tempo.toFixed(3),
        pctChange: +pctChange.toFixed(1),
        absDelta: +absDelta.toFixed(0),
    };
}
/** Классификация магазина по темпу: grow / shrink / flat. */
function tempoDirection(tempo) {
    if (tempo > 1.05)
        return 'grow';
    if (tempo < 0.95)
        return 'shrink';
    return 'flat';
}
//# sourceMappingURL=computeTempo.js.map