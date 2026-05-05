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
/**
 * \u041a\u0430\u043d\u043e\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0439 fmtRubFull (DS 2.0): \u0430\u0432\u0442\u043e-\u043f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435 \u0435\u0434\u0438\u043d\u0438\u0446\u044b \u0434\u043b\u044f \u0440\u0443\u0431\u043b\u0451\u0432\u044b\u0445 \u0441\u0443\u043c\u043c.
 * \u0420\u0430\u0431\u043e\u0442\u0430\u0435\u0442 \u043d\u0430 \u043f\u043e\u043b\u043d\u044b\u0445 \u0440\u0443\u0431\u043b\u044f\u0445 (\u041d\u0415 \u0442\u044b\u0441 \u20bd). \u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f \u0434\u043b\u044f \u043d\u043e\u0432\u044b\u0445 \u0432\u044b\u0437\u043e\u0432\u043e\u0432
 * subtitle/\u0442\u0443\u043b\u0442\u0438\u043f\u043e\u0432 \u0433\u0434\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u043f\u0440\u0438\u0445\u043e\u0434\u044f\u0442 \u0432 \u0440\u0443\u0431\u043b\u044f\u0445 \u0438\u0437 \u0411\u0414.
 *
 *  - <10k       \u2192 "1 234 \u20bd"
 *  - <1M        \u2192 "1 234 \u0442\u044b\u0441 \u20bd"
 *  - <1B        \u2192 "1,23 \u043c\u043b\u043d \u20bd"
 *  - <1T        \u2192 "1,23 \u043c\u043b\u0440\u0434 \u20bd"
 *  - \u0438\u043d\u0430\u0447\u0435      \u2192 "1,23 \u0442\u0440\u043b\u043d \u20bd"
 */
export declare function fmtRubFull(v: number | null | undefined, decimals?: number): string;
//# sourceMappingURL=formatRussian.d.ts.map