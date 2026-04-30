/**
 * Математические утилиты для scatter-plot:
 *   - pickStep / formatStep — адаптивный шаг для gridlines
 *   - radius — нормализация метрики в радиус пузыря
 *   - hexToRgba — конверсия цвета
 *   - pointInRect / pointInPolygon — hit-test для выделения
 *   - seededRandom / randNormal — синтетика для fallback trend
 */
/** Адаптивный шаг для gridlines: range / targetTicks → 1/2/5/10 */
export declare function pickStep(range: number, targetTicks: number): number;
/** Форматирование числа в соответствии с выбранным шагом */
export declare function formatStep(v: number, step: number): string;
/**
 * Нормализация метрики size в радиус пузыря (в px).
 *
 * @param rev      текущее значение
 * @param minSize  минимальное значение в выборке (для нормализации)
 * @param maxSize  максимальное значение в выборке
 * @returns        радиус в диапазоне [3, 14]
 */
export declare function radius(rev: number, minSize: number, maxSize: number): number;
/** Hex → rgba. Принимает #RRGGBB или короткий #RGB. */
export declare function hexToRgba(hex: string, a: number): string;
export interface Point2D {
    x: number;
    y: number;
}
export interface Rect2D {
    x: number;
    y: number;
    w: number;
    h: number;
}
export declare function pointInRect(p: Point2D, r: Rect2D): boolean;
/** Алгоритм ray-casting */
export declare function pointInPolygon(point: Point2D, polygon: Point2D[]): boolean;
/** Детерминированный PRNG — для стабильного fallback trend */
export declare function seededRandom(seed: number): () => number;
/** Нормальное распределение (Box-Muller) */
export declare function randNormal(rng: () => number, mean: number, sd: number): number;
//# sourceMappingURL=scales.d.ts.map