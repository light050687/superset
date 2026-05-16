/**
 * Локализованные форматтеры для русского UI.
 * Используем ru-RU locale, но жёстко подменяем NARROW NO-BREAK SPACE (U+202F)
 * на обычный NBSP (U+00A0) — первое иногда некорректно рендерится в табличных шрифтах.
 */

const MINUS = '−'; // U+2212, ровный по ширине с plus
const NBSP = '\u00A0';

const nfCached = (opts: Intl.NumberFormatOptions): Intl.NumberFormat =>
  new Intl.NumberFormat('ru-RU', opts);

const _nf0 = nfCached({ maximumFractionDigits: 0 });
const _nf1 = nfCached({ minimumFractionDigits: 1, maximumFractionDigits: 1 });
const _nf2 = nfCached({ minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fixSpaces = (s: string): string =>
  s.replace(/\u202F/g, NBSP).replace(/\s/g, NBSP);

export const nf0 = (v: number): string => fixSpaces(_nf0.format(v));
export const nf1 = (v: number): string => fixSpaces(_nf1.format(v));
export const nf2 = (v: number): string => fixSpaces(_nf2.format(v));

/** "1 234,56 %" — процент с двумя знаками. */
export const fmtPct = (v: number): string => `${nf2(v)}${NBSP}%`;

/** "+1,23 п.п." или "−0,45 %" — дельта со знаком. */
export const fmtDelta = (v: number, unit: string = 'п.п.'): string => {
  const sign = v > 0 ? '+' : v < 0 ? MINUS : '';
  return `${sign}${nf2(Math.abs(v))}${NBSP}${unit}`;
};

/**
 * Канонический fmtRub (DS 2.0): авто-переключение единицы для рублёвых сумм.
 * Базовая единица входа — рубли. До запятой ≤3 цифр.
 *
 *  - <10k       → "1 234 ₽"
 *  - <1M        → "1 234 тыс ₽"
 *  - <1B        → "1,23 млн ₽"
 *  - <1T        → "1,23 млрд ₽"
 *  - иначе      → "1,23 трлн ₽"
 */
export const fmtRub = (v: number, decimals = 2): string => {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000_000) {
    return `${nfDec(decimals)(v / 1_000_000_000_000)}${NBSP}трлн${NBSP}₽`;
  }
  if (abs >= 1_000_000_000) {
    return `${nfDec(decimals)(v / 1_000_000_000)}${NBSP}млрд${NBSP}₽`;
  }
  if (abs >= 1_000_000) {
    return `${nfDec(decimals)(v / 1_000_000)}${NBSP}млн${NBSP}₽`;
  }
  if (abs >= 10_000) {
    return `${nf0(v / 1_000)}${NBSP}тыс${NBSP}₽`;
  }
  return `${nf0(v)}${NBSP}₽`;
};

const nfDec = (d: number) => {
  const fmt = nfCached({
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
  return (v: number): string => fixSpaces(fmt.format(v));
};

/** "12 млн ₽" — статичная форма с предзаданной единицей "млн". Используется
 *  там, где значение УЖЕ в млн ₽ (не нужен auto-unit). */
export const fmtMln = (v: number): string => `${nf0(v)}${NBSP}млн${NBSP}₽`;

/** "DD.MM.YYYY" — российская дата. */
export const fmtDate = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
};

/**
 * Направление дельты для окрашивания (up/dn/wn).
 * @param invertGood true = рост это плохо (например списания)
 */
export const deltaClass = (
  v: number,
  invertGood: boolean = true,
): 'up' | 'dn' | 'wn' => {
  if (Math.abs(v) < 0.05) return 'wn';
  return (v > 0) === invertGood ? 'dn' : 'up';
};
