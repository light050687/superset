/**
 * Русские форматтеры чисел — DS 2.0 §11.
 * - Тысячный разделитель: неразрывный пробел (U+00A0).
 * - Десятичный: запятая.
 * - Сокращения (входные значения — «тыс. рублей»): <10 — целиком,
 *   10–999 → `Xк`, 1 000–9 999 → `X,Yк`, >=10 000 → `X,YM`, >=10 000 000 → `XB`.
 * - Изменения: знак + стрелка `+12,4% ↑` / `−12,4% ↓`.
 * - Валюта: символ после числа через неразрывный пробел: `1 234 ₽`.
 */
export declare const nf0: Intl.NumberFormat;
export declare const nf1: Intl.NumberFormat;
export declare const nf2: Intl.NumberFormat;
/**
 * Короткий формат сумм в «тыс. рублей» (как во входных данных прототипа):
 *   <10       → `Xк`   (исходно <10 тыс. ₽)
 *   10–999    → `Xк`   (целое число тыс.)
 *   1 000–9 999 → `1,3M`
 *   ≥10 000   → `12M`  (без десятичной, миллионы)
 *   ≥1 000 000 → `1,2B`
 *
 * Принимаем значение в тыс. рублей (как `weeksRub` в прототипе).
 * При выходе не указываем символ валюты — это решает вызывающий код
 * через `fmtRubWithUnit` для полной формы `1 234 ₽`.
 */
export declare function fmtRub(v: number): string;
/** Полная форма с ₽ после числа (DS 2.0 §11: «1 234 ₽» через неразрывный пробел). */
export declare function fmtRubWithUnit(v: number): string;
/** Процент, 2 знака после запятой: `3,25%`. */
export declare function fmtPct(v: number): string;
/** Универсальный форматтер значения по метрике карточки. */
export declare function fmtByMetric(v: number, metric: 'rub' | 'pct'): string;
/** Форматирование темпа: `в 1,3 раза` (с учётом правил РФ). */
export declare function fmtTempoText(tempo: number): string;
/**
 * Знак + стрелка согласно DS 2.0 §11:
 *   pct > 0 → `+12,4% ↑`
 *   pct < 0 → `−12,4% ↓`
 *   pct = 0 → `0,0%`
 *
 * Стрелка отделена неразрывным пробелом, минус — U+2212 (типографический).
 */
export declare function fmtSignedPct(pct: number): string;
/** Префикс знака без числа: `+` / `−` (U+2212) / `` (пустая строка). */
export declare function signPrefix(v: number): string;
//# sourceMappingURL=formatRussian.d.ts.map