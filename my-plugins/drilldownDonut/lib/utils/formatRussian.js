"use strict";
/**
 * RU-локализация чисел: пробел-тысячи, запятая-десятичные.
 * Повторяет §11 прототипа (строки 200–205).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtRub = fmtRub;
exports.fmtPct = fmtPct;
exports.fmtPctOfRev = fmtPctOfRev;
exports.fmtCnt = fmtCnt;
const nf1 = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
const nf0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
/** «1 234,5 млн ₽» — сумма в миллионах рублей */
function fmtRub(v) {
    if (v == null || !Number.isFinite(v))
        return '—';
    return `${nf1.format(v)} млн ₽`;
}
/** «12,3%» — доля от общего (базовое %-форматирование) */
function fmtPct(v) {
    if (v == null || !Number.isFinite(v))
        return '—';
    return `${nf1.format(v)}%`;
}
/**
 * «Процент от оборота». Если totalRevenue не задан — используем sum-of-visible
 * как денуминатор (вернёт тот же процент, что и fmtPct для доли).
 */
function fmtPctOfRev(v, totalRevenue, fallbackTotal) {
    if (v == null || !Number.isFinite(v))
        return '—';
    const denom = totalRevenue && totalRevenue > 0 ? totalRevenue : fallbackTotal;
    if (!denom || !Number.isFinite(denom))
        return '—';
    return `${nf1.format((v / denom) * 100)}%`;
}
/** «12 480 шт» — количество операций */
function fmtCnt(v) {
    if (v == null || !Number.isFinite(v))
        return '—';
    return `${nf0.format(v)} шт`;
}
//# sourceMappingURL=formatRussian.js.map