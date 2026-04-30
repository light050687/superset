/**
 * Russian number formatters matching DS 2.0:
 * — space as thousands separator
 * — comma as decimal separator
 * — currency symbol AFTER the number (1 234,5 млн ₽)
 */

const nf = (decimals: number): Intl.NumberFormat =>
  new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * Format a monetary value in "millions" units.
 * - Values ≥ 1 → `1,2 млн` (value is already expressed in millions).
 * - Values < 1 → `123 тыс` (converted to thousands).
 *
 * Returns two pieces: `number` (rendered with mono font) and `unit` (rendered smaller/muted).
 */
export interface FormattedParts {
  number: string;
  unit: string;
}

export function fmtRub(
  value: number,
  decimals: number = 1,
  suffix: string = 'млн ₽',
): FormattedParts {
  if (!Number.isFinite(value)) {
    return { number: '—', unit: '' };
  }
  if (Math.abs(value) >= 1) {
    return { number: nf(decimals).format(value), unit: ` ${suffix}` };
  }
  const inThousands = value * 1000;
  return {
    number: new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 0,
    }).format(inThousands),
    unit: ' тыс ₽',
  };
}

export function fmtPct(value: number, decimals: number = 1): FormattedParts {
  if (!Number.isFinite(value)) {
    return { number: '—', unit: '' };
  }
  return { number: nf(decimals).format(value), unit: ' %' };
}

/**
 * Format a delta value in percentage points.
 * Returns "+1,03 п.п.", "−0,42 п.п.", "0,00 п.п." with the unicode minus sign.
 */
export function fmtDelta(pp: number, decimals: number = 2): string {
  if (!Number.isFinite(pp)) {
    return '—';
  }
  const formatted = nf(decimals).format(Math.abs(pp));
  const sign = pp > 0 ? '+' : pp < 0 ? '−' : '';
  return `${sign}${formatted} п.п.`;
}

/** Format a plain integer count: "1 234". */
export function fmtCount(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Decide delta CSS status class. For "losses" metrics (`invertGood=true`)
 * an increase is bad (dn), a decrease is good (up). Near-zero values use `wn`.
 */
export type DeltaStatus = 'up' | 'dn' | 'wn';

export function getDeltaStatus(
  pp: number,
  invertGood: boolean,
  threshold: number = 0.1,
): DeltaStatus {
  if (!Number.isFinite(pp) || Math.abs(pp) < threshold) {
    return 'wn';
  }
  if (invertGood) {
    return pp > 0 ? 'dn' : 'up';
  }
  return pp > 0 ? 'up' : 'dn';
}
