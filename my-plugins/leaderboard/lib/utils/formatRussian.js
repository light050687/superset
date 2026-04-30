"use strict";
/**
 * Локализованные форматтеры для русского UI.
 * Используем ru-RU locale, но жёстко подменяем NARROW NO-BREAK SPACE (U+202F)
 * на обычный NBSP (U+00A0) — первое иногда некорректно рендерится в табличных шрифтах.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deltaClass = exports.fmtDate = exports.fmtMln = exports.fmtRub = exports.fmtDelta = exports.fmtPct = exports.nf2 = exports.nf1 = exports.nf0 = void 0;
const MINUS = '−'; // U+2212, ровный по ширине с plus
const NBSP = '\u00A0';
const nfCached = (opts) => new Intl.NumberFormat('ru-RU', opts);
const _nf0 = nfCached({ maximumFractionDigits: 0 });
const _nf1 = nfCached({ minimumFractionDigits: 1, maximumFractionDigits: 1 });
const _nf2 = nfCached({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fixSpaces = (s) => s.replace(/\u202F/g, NBSP).replace(/\s/g, NBSP);
const nf0 = (v) => fixSpaces(_nf0.format(v));
exports.nf0 = nf0;
const nf1 = (v) => fixSpaces(_nf1.format(v));
exports.nf1 = nf1;
const nf2 = (v) => fixSpaces(_nf2.format(v));
exports.nf2 = nf2;
/** "1 234,56 %" — процент с двумя знаками. */
const fmtPct = (v) => `${(0, exports.nf2)(v)}${NBSP}%`;
exports.fmtPct = fmtPct;
/** "+1,23 п.п." или "−0,45 %" — дельта со знаком. */
const fmtDelta = (v, unit = 'п.п.') => {
    const sign = v > 0 ? '+' : v < 0 ? MINUS : '';
    return `${sign}${(0, exports.nf2)(Math.abs(v))}${NBSP}${unit}`;
};
exports.fmtDelta = fmtDelta;
/** "1 234 ₽" — целое с символом рубля после. */
const fmtRub = (v) => `${(0, exports.nf0)(v)}${NBSP}₽`;
exports.fmtRub = fmtRub;
/** "12 млн ₽" — млн с короткой подписью. */
const fmtMln = (v) => `${(0, exports.nf0)(v)}${NBSP}млн${NBSP}₽`;
exports.fmtMln = fmtMln;
/** "DD.MM.YYYY" — российская дата. */
const fmtDate = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
};
exports.fmtDate = fmtDate;
/**
 * Направление дельты для окрашивания (up/dn/wn).
 * @param invertGood true = рост это плохо (например списания)
 */
const deltaClass = (v, invertGood = true) => {
    if (Math.abs(v) < 0.05)
        return 'wn';
    return (v > 0) === invertGood ? 'dn' : 'up';
};
exports.deltaClass = deltaClass;
//# sourceMappingURL=formatRussian.js.map