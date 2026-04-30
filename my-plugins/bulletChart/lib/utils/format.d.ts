/**
 * Русский формат чисел (DS 2.0, ru-RU).
 *
 *   Тысячи: неразрывный пробел (\u00A0)
 *   Десятичные: запятая
 *   Валюта: ПОСЛЕ числа (1 234 ₽)
 *   Отрицательные: минус U+2212 (−), не дефис
 */
/** «Умный» формат с авто-сокращением (тыс/млн/млрд). */
export declare function formatRussianSmart(value: number, decimals?: number, suffix?: string): string;
/** Форматер значения без умного сокращения — для процентов и коротких чисел. */
export declare function formatRussianPlain(value: number, decimals?: number, suffix?: string): string;
/**
 * Целочисленный форматер для количества (магазинов).
 * Возвращает «101 магазин» / «220 магазинов» по правилам русского склонения.
 */
export declare function formatStoresCount(n: number): string;
/**
 * Дельта в п.п. с выраженным знаком и unit-label (по умолчанию «п.п.»).
 *   +0,27 п.п. / −0,24 п.п.
 */
export declare function formatDeltaPP(value: number, decimals?: number, unitLabel?: string): string;
/**
 * Форматер сконфигурированный с унифицированными настройками
 * для основного значения / дельты / целого.
 */
export interface FormatterConfig {
    decimals: number;
    suffix: string;
    unitLabel: string;
    autoRussian: boolean;
}
export declare function makeFormatters(cfg: FormatterConfig): {
    value: (n: number) => string;
    deltaPP: (n: number) => string;
    integer: (n: number) => string;
};
//# sourceMappingURL=format.d.ts.map