/**
 * Русский формат чисел (DS 2.0, ru-RU).
 *
 *   Тысячи: неразрывный пробел (\u00A0)
 *   Десятичные: запятая
 *   Валюта: ПОСЛЕ числа (1 234 ₽)
 *   Отрицательные: минус U+2212 (−), не дефис
 */

const RU = 'ru-RU';

function ruNumber(value: number, fractionDigits: number): string {
  return new Intl.NumberFormat(RU, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** «Умный» формат с авто-сокращением (тыс/млн/млрд). */
export function formatRussianSmart(
  value: number,
  decimals = -1,
  suffix = '',
): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '\u2212' : '';
  const sfx = suffix ? ` ${suffix}` : '';

  if (abs >= 1_000_000_000_000) {
    const v = abs / 1_000_000_000_000;
    const d = decimals >= 0 ? decimals : abs >= 10_000_000_000_000 ? 1 : 2;
    return `${sign}${ruNumber(v, d)} трлн${sfx}`;
  }
  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000;
    const d = decimals >= 0 ? decimals : abs >= 10_000_000_000 ? 1 : 2;
    return `${sign}${ruNumber(v, d)} млрд${sfx}`;
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    const d = decimals >= 0 ? decimals : abs >= 100_000_000 ? 1 : 2;
    return `${sign}${ruNumber(v, d)} млн${sfx}`;
  }
  if (abs >= 10_000) {
    const v = abs / 1_000;
    const d = decimals >= 0 ? decimals : abs >= 100_000 ? 0 : 1;
    return `${sign}${ruNumber(v, d)} тыс${sfx}`;
  }

  const d = decimals >= 0 ? decimals : 0;
  return `${ruNumber(value, d)}${sfx}`;
}

/** Форматер значения без умного сокращения — для процентов и коротких чисел. */
export function formatRussianPlain(
  value: number,
  decimals = 2,
  suffix = '',
): string {
  const sfx = suffix ? `\u00A0${suffix}` : '';
  return `${ruNumber(value, decimals)}${sfx}`;
}

/**
 * Целочисленный форматер для количества (магазинов).
 * Возвращает «101 магазин» / «220 магазинов» по правилам русского склонения.
 */
export function formatStoresCount(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  let word: string;
  if (mod100 >= 11 && mod100 <= 14) word = 'магазинов';
  else if (mod10 === 1) word = 'магазин';
  else if (mod10 >= 2 && mod10 <= 4) word = 'магазина';
  else word = 'магазинов';
  return `${ruNumber(abs, 0)} ${word}`;
}

/**
 * Дельта в п.п. с выраженным знаком и unit-label (по умолчанию «п.п.»).
 *   +0,27 п.п. / −0,24 п.п.
 */
export function formatDeltaPP(
  value: number,
  decimals = 2,
  unitLabel = 'п.п.',
): string {
  if (value === 0) return `0${unitLabel ? ` ${unitLabel}` : ''}`;
  const sign = value > 0 ? '+' : '\u2212';
  const abs = Math.abs(value);
  const unit = unitLabel ? ` ${unitLabel}` : '';
  return `${sign}${ruNumber(abs, decimals)}${unit}`;
}

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

export function makeFormatters(cfg: FormatterConfig): {
  value: (n: number) => string;
  deltaPP: (n: number) => string;
  integer: (n: number) => string;
} {
  const { decimals, suffix, unitLabel, autoRussian } = cfg;
  const value = autoRussian
    ? (n: number) => formatRussianSmart(n, decimals, suffix)
    : (n: number) => formatRussianPlain(n, decimals, suffix);
  const deltaPP = (n: number) => formatDeltaPP(n, decimals, unitLabel);
  const integer = (n: number) => ruNumber(Math.trunc(n), 0);
  return { value, deltaPP, integer };
}

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
export function fmtRub(
  v: number | null | undefined,
  decimals = 2,
): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000_000) {
    return `${ruNumber(v / 1_000_000_000_000, decimals)} трлн ₽`;
  }
  if (abs >= 1_000_000_000) {
    return `${ruNumber(v / 1_000_000_000, decimals)} млрд ₽`;
  }
  if (abs >= 1_000_000) {
    return `${ruNumber(v / 1_000_000, decimals)} млн ₽`;
  }
  if (abs >= 10_000) {
    return `${ruNumber(v / 1_000, 0)} тыс ₽`;
  }
  return `${ruNumber(v, 0)} ₽`;
}

/** Процент в форме «12,4%». */
export function fmtPct(
  v: number | null | undefined,
  decimals = 1,
): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${ruNumber(v, decimals)}%`;
}

/** Целое количество шт: «1 234 шт». */
export function fmtCnt(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${ruNumber(Math.round(v), 0)} шт`;
}
