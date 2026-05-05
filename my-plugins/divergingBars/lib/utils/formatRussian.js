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
exports.fmtRubFull = fmtRubFull;
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
    // Расширено до трлн (DS 2.0): большие компании могут перешагнуть млрд тыс ₽.
    if (abs >= 1000000000)
        return `${exports.nf1.format(v / 1000000000)}T`;
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
function fmtRubFull(v, decimals = 2) {
    if (v == null || !Number.isFinite(v))
        return '\u2014';
    const abs = Math.abs(v);
    const nf = (d) => new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
    });
    if (abs >= 1000000000000) {
        return `${nf(decimals).format(v / 1000000000000)} \u0442\u0440\u043b\u043d \u20bd`;
    }
    if (abs >= 1000000000) {
        return `${nf(decimals).format(v / 1000000000)} \u043c\u043b\u0440\u0434 \u20bd`;
    }
    if (abs >= 1000000) {
        return `${nf(decimals).format(v / 1000000)} \u043c\u043b\u043d \u20bd`;
    }
    if (abs >= 10000) {
        return `${nf(0).format(v / 1000)} \u0442\u044b\u0441 \u20bd`;
    }
    return `${nf(0).format(v)} \u20bd`;
}
//# sourceMappingURL=formatRussian.js.map