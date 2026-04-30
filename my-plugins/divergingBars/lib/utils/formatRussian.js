"use strict";
/**
 * Русские форматтеры чисел — DS 2.0 §11.
 * - Тысячный разделитель: неразрывный пробел (U+00A0).
 * - Десятичный: запятая.
 * - Сокращения (входные значения — «тыс. рублей»): <10 — целиком,
 *   10–999 → `Xк`, 1 000–9 999 → `X,Yк`, >=10 000 → `X,YM`, >=10 000 000 → `XB`.
 * - Изменения: знак + стрелка `+12,4% ↑` / `−12,4% ↓`.
 * - Валюта: символ после числа через неразрывный пробел: `1 234 ₽`.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.nf2 = exports.nf1 = exports.nf0 = void 0;
exports.fmtRub = fmtRub;
exports.fmtRubWithUnit = fmtRubWithUnit;
exports.fmtPct = fmtPct;
exports.fmtByMetric = fmtByMetric;
exports.fmtTempoText = fmtTempoText;
exports.fmtSignedPct = fmtSignedPct;
exports.signPrefix = signPrefix;
exports.nf0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
exports.nf1 = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
exports.nf2 = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
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
function fmtRub(v) {
    const abs = Math.abs(v);
    if (abs >= 1000000)
        return `${exports.nf1.format(v / 1000000)}B`;
    if (abs >= 10000)
        return `${exports.nf0.format(v / 1000)}M`;
    if (abs >= 1000)
        return `${exports.nf1.format(v / 1000)}M`;
    return `${exports.nf0.format(v)}к`;
}
/** Полная форма с ₽ после числа (DS 2.0 §11: «1 234 ₽» через неразрывный пробел). */
function fmtRubWithUnit(v) {
    return `${fmtRub(v)}\u00a0₽`;
}
/** Процент, 2 знака после запятой: `3,25%`. */
function fmtPct(v) {
    return `${exports.nf2.format(v)}%`;
}
/** Универсальный форматтер значения по метрике карточки. */
function fmtByMetric(v, metric) {
    return metric === 'rub' ? fmtRub(v) : fmtPct(v);
}
/** Форматирование темпа: `в 1,3 раза` (с учётом правил РФ). */
function fmtTempoText(tempo) {
    return `в ${exports.nf1.format(tempo)} раза`;
}
/**
 * Знак + стрелка согласно DS 2.0 §11:
 *   pct > 0 → `+12,4% ↑`
 *   pct < 0 → `−12,4% ↓`
 *   pct = 0 → `0,0%`
 *
 * Стрелка отделена неразрывным пробелом, минус — U+2212 (типографический).
 */
function fmtSignedPct(pct) {
    const abs = Math.abs(pct);
    if (pct > 0)
        return `+${exports.nf1.format(abs)}%\u00a0\u2191`;
    if (pct < 0)
        return `\u2212${exports.nf1.format(abs)}%\u00a0\u2193`;
    return `${exports.nf1.format(0)}%`;
}
/** Префикс знака без числа: `+` / `−` (U+2212) / `` (пустая строка). */
function signPrefix(v) {
    if (v > 0)
        return '+';
    if (v < 0)
        return '\u2212';
    return '';
}
//# sourceMappingURL=formatRussian.js.map