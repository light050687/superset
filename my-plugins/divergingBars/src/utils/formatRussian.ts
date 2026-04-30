/**
 * Русские форматтеры чисел — DS 2.0 §11.
 * - Тысячный разделитель: неразрывный пробел (U+00A0).
 * - Десятичный: запятая.
 * - Сокращения (входные значения — «тыс. рублей»): <10 — целиком,
 *   10–999 → `Xк`, 1 000–9 999 → `X,Yк`, >=10 000 → `X,YM`, >=10 000 000 → `XB`.
 * - Изменения: знак + стрелка `+12,4% ↑` / `−12,4% ↓`.
 * - Валюта: символ после числа через неразрывный пробел: `1 234 ₽`.
 */

export const nf0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
export const nf1 = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
export const nf2 = new Intl.NumberFormat('ru-RU', {
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
export function fmtRub(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${nf1.format(v / 1_000_000)}B`;
  if (abs >= 10_000) return `${nf0.format(v / 1000)}M`;
  if (abs >= 1000) return `${nf1.format(v / 1000)}M`;
  return `${nf0.format(v)}к`;
}

/** Полная форма с ₽ после числа (DS 2.0 §11: «1 234 ₽» через неразрывный пробел). */
export function fmtRubWithUnit(v: number): string {
  return `${fmtRub(v)}\u00a0₽`;
}

/** Процент, 2 знака после запятой: `3,25%`. */
export function fmtPct(v: number): string {
  return `${nf2.format(v)}%`;
}

/** Универсальный форматтер значения по метрике карточки. */
export function fmtByMetric(v: number, metric: 'rub' | 'pct'): string {
  return metric === 'rub' ? fmtRub(v) : fmtPct(v);
}

/** Форматирование темпа: `в 1,3 раза` (с учётом правил РФ). */
export function fmtTempoText(tempo: number): string {
  return `в ${nf1.format(tempo)} раза`;
}

/**
 * Знак + стрелка согласно DS 2.0 §11:
 *   pct > 0 → `+12,4% ↑`
 *   pct < 0 → `−12,4% ↓`
 *   pct = 0 → `0,0%`
 *
 * Стрелка отделена неразрывным пробелом, минус — U+2212 (типографический).
 */
export function fmtSignedPct(pct: number): string {
  const abs = Math.abs(pct);
  if (pct > 0) return `+${nf1.format(abs)}%\u00a0\u2191`;
  if (pct < 0) return `\u2212${nf1.format(abs)}%\u00a0\u2193`;
  return `${nf1.format(0)}%`;
}

/** Префикс знака без числа: `+` / `−` (U+2212) / `` (пустая строка). */
export function signPrefix(v: number): string {
  if (v > 0) return '+';
  if (v < 0) return '\u2212';
  return '';
}
