/**
 * RU-локализация чисел: пробел-тысячи, запятая-десятичные.
 * Базовая единица входных rub-значений — МИЛЛИОНЫ рублей
 * (как в `ref/structure-donut-prototype.html` строки 200–205).
 *
 * Правило (DS 2.0): целая часть ≤ 3 цифр; дробная — `decimals` знаков
 * (по умолчанию 2). Авто-переключение единиц вверх и вниз:
 *
 *   v=0.005   → "5,00 тыс ₽"   (0.5 млн → 500 тыс)
 *   v=264     → "264,00 млн ₽"
 *   v=8230    → "8,23 млрд ₽"
 *   v=12400   → "12,40 млрд ₽"
 *   v=1500000 → "1,50 трлн ₽"
 */
const nf1 = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
const nf0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
export function fmtRub(v, decimals = 2) {
    if (v == null || !Number.isFinite(v))
        return '—';
    const abs = Math.abs(v);
    let value = v;
    let unit = 'млн';
    if (abs >= 1000000) {
        // ≥ 1 трлн (в млн)
        value = v / 1000000;
        unit = 'трлн';
    }
    else if (abs >= 1000) {
        // ≥ 1 млрд (в млн)
        value = v / 1000;
        unit = 'млрд';
    }
    else if (abs >= 1) {
        // 1–999 млн — оставляем "млн"
        value = v;
        unit = 'млн';
    }
    else if (abs >= 0.001) {
        // < 1 млн → переходим на "тыс" (умножаем на 1000)
        value = v * 1000;
        unit = 'тыс';
    }
    else {
        // < 1 тыс → переходим на рубли (×1_000_000)
        value = v * 1000000;
        unit = '';
    }
    const fmt = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return unit ? `${fmt.format(value)} ${unit} ₽` : `${fmt.format(value)} ₽`;
}
/** «12,3%» — доля от общего (базовое %-форматирование) */
export function fmtPct(v) {
    if (v == null || !Number.isFinite(v))
        return '—';
    return `${nf1.format(v)}%`;
}
/**
 * «Процент от оборота». Если totalRevenue не задан — используем sum-of-visible
 * как денуминатор (вернёт тот же процент, что и fmtPct для доли).
 */
export function fmtPctOfRev(v, totalRevenue, fallbackTotal) {
    if (v == null || !Number.isFinite(v))
        return '—';
    const denom = totalRevenue && totalRevenue > 0 ? totalRevenue : fallbackTotal;
    if (!denom || !Number.isFinite(denom))
        return '—';
    return `${nf1.format((v / denom) * 100)}%`;
}
/** «12 480 шт» — количество операций */
export function fmtCnt(v) {
    if (v == null || !Number.isFinite(v))
        return '—';
    return `${nf0.format(v)} шт`;
}
//# sourceMappingURL=formatRussian.js.map