/**
 * Локализованные форматтеры для русского UI.
 * Используем ru-RU locale, но жёстко подменяем NARROW NO-BREAK SPACE (U+202F)
 * на обычный NBSP (U+00A0) — первое иногда некорректно рендерится в табличных шрифтах.
 */
const MINUS = '−'; // U+2212, ровный по ширине с plus
const NBSP = '\u00A0';
const nfCached = (opts) => new Intl.NumberFormat('ru-RU', opts);
const _nf0 = nfCached({ maximumFractionDigits: 0 });
const _nf1 = nfCached({ minimumFractionDigits: 1, maximumFractionDigits: 1 });
const _nf2 = nfCached({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fixSpaces = (s) => s.replace(/\u202F/g, NBSP).replace(/\s/g, NBSP);
export const nf0 = (v) => fixSpaces(_nf0.format(v));
export const nf1 = (v) => fixSpaces(_nf1.format(v));
export const nf2 = (v) => fixSpaces(_nf2.format(v));
/** "1 234,56 %" — процент с двумя знаками. */
export const fmtPct = (v) => `${nf2(v)}${NBSP}%`;
/** "+1,23 п.п." или "−0,45 %" — дельта со знаком. */
export const fmtDelta = (v, unit = 'п.п.') => {
    const sign = v > 0 ? '+' : v < 0 ? MINUS : '';
    return `${sign}${nf2(Math.abs(v))}${NBSP}${unit}`;
};
/** "1 234 ₽" — целое с символом рубля после. */
export const fmtRub = (v) => `${nf0(v)}${NBSP}₽`;
/** "12 млн ₽" — млн с короткой подписью. */
export const fmtMln = (v) => `${nf0(v)}${NBSP}млн${NBSP}₽`;
/** "DD.MM.YYYY" — российская дата. */
export const fmtDate = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
};
/**
 * Направление дельты для окрашивания (up/dn/wn).
 * @param invertGood true = рост это плохо (например списания)
 */
export const deltaClass = (v, invertGood = true) => {
    if (Math.abs(v) < 0.05)
        return 'wn';
    return (v > 0) === invertGood ? 'dn' : 'up';
};
//# sourceMappingURL=formatRussian.js.map