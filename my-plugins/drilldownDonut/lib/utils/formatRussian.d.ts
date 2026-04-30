/**
 * RU-локализация чисел: пробел-тысячи, запятая-десятичные.
 * Повторяет §11 прототипа (строки 200–205).
 */
/** «1 234,5 млн ₽» — сумма в миллионах рублей */
export declare function fmtRub(v: number | null | undefined): string;
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