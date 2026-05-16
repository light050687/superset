/**
 * Форматтеры «по контракту метрики» прототипа:
 *   fmtRub  — значение + metricUnit («21,8 млн ₽»)
 *   fmtPct1 — одно число после запятой с «%» («71,6%»)
 *   fmtPct2 — два числа после запятой с «%» («7,15%»)
 *
 * В прототипе значения уже приходят в «млн ₽», поэтому тут используется
 * простой `Intl.NumberFormat('ru-RU')` — БЕЗ smart-abbreviation
 * (эта функция — в formatRussian.ts, когда сырые значения в ₽).
 */
/** Форматирует value в формате «N,N {metricUnit}» («21,8 млн ₽»). */
export declare function formatMetricValue(value: number | null | undefined, metricUnit: string): string;
export declare function formatPct1(value: number | null | undefined): string;
export declare function formatPct2(value: number | null | undefined): string;
/** Целое число в ru-RU (для рангов и счётчиков). */
export declare function formatInt(value: number): string;
/** Форматирует signed percentage delta («+12,3%»). */
export declare function formatSignedPct1(value: number | null | undefined): string;
//# sourceMappingURL=paretoFormat.d.ts.map