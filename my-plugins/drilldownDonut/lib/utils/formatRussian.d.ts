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
export declare function fmtRub(v: number | null | undefined, decimals?: number): string;
/** «12,3%» — доля от общего (базовое %-форматирование) */
export declare function fmtPct(v: number | null | undefined): string;
/**
 * «Процент от оборота». Если totalRevenue не задан — используем sum-of-visible
 * как денуминатор (вернёт тот же процент, что и fmtPct для доли).
 */
export declare function fmtPctOfRev(v: number | null | undefined, totalRevenue: number | null, fallbackTotal: number): string;
/** «12 480 шт» — количество операций */
export declare function fmtCnt(v: number | null | undefined): string;
//# sourceMappingURL=formatRussian.d.ts.map