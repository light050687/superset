/**
 * Russian number formatters matching DS 2.0:
 * — space as thousands separator
 * — comma as decimal separator
 * — currency symbol AFTER the number (1 234,5 млн ₽)
 */
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
export declare function fmtRub(value: number, decimals?: number, suffix?: string): FormattedParts;
export declare function fmtPct(value: number, decimals?: number): FormattedParts;
/**
 * Format a delta value in percentage points.
 * Returns "+1,03 п.п.", "−0,42 п.п.", "0,00 п.п." with the unicode minus sign.
 */
export declare function fmtDelta(pp: number, decimals?: number): string;
/** Format a plain integer count: "1 234". */
export declare function fmtCount(value: number): string;
/**
 * Decide delta CSS status class. For "losses" metrics (`invertGood=true`)
 * an increase is bad (dn), a decrease is good (up). Near-zero values use `wn`.
 */
export type DeltaStatus = 'up' | 'dn' | 'wn';
export declare function getDeltaStatus(pp: number, invertGood: boolean, threshold?: number): DeltaStatus;
//# sourceMappingURL=formatRussian.d.ts.map