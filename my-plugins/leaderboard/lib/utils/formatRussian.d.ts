/**
 * Локализованные форматтеры для русского UI.
 * Используем ru-RU locale, но жёстко подменяем NARROW NO-BREAK SPACE (U+202F)
 * на обычный NBSP (U+00A0) — первое иногда некорректно рендерится в табличных шрифтах.
 */
export declare const nf0: (v: number) => string;
export declare const nf1: (v: number) => string;
export declare const nf2: (v: number) => string;
/** "1 234,56 %" — процент с двумя знаками. */
export declare const fmtPct: (v: number) => string;
/** "+1,23 п.п." или "−0,45 %" — дельта со знаком. */
export declare const fmtDelta: (v: number, unit?: string) => string;
/** "1 234 ₽" — целое с символом рубля после. */
export declare const fmtRub: (v: number) => string;
/** "12 млн ₽" — млн с короткой подписью. */
export declare const fmtMln: (v: number) => string;
/** "DD.MM.YYYY" — российская дата. */
export declare const fmtDate: (d: Date) => string;
/**
 * Направление дельты для окрашивания (up/dn/wn).
 * @param invertGood true = рост это плохо (например списания)
 */
export declare const deltaClass: (v: number, invertGood?: boolean) => "up" | "dn" | "wn";
//# sourceMappingURL=formatRussian.d.ts.map