/**
 * Date parsing/formatting helpers for Writeoffs Timeseries.
 *
 * Superset delivers time_col values as numeric timestamps (ms) OR ISO strings
 * depending on the datasource. We normalise both into a single canonical form
 * with year/month/day/week cached on the TimePoint.
 */
/** Russian full month name, 1-indexed (monthNum 1..12) */
export declare function ruMonthName(monthNum: number): string;
/** Russian short month name, 1-indexed */
export declare function ruMonthShort(monthNum: number): string;
/**
 * Parse a raw Superset time value into a JS Date.
 *
 * Handles:
 *   - number (epoch ms)
 *   - ISO string "2025-04-01" or "2025-04-01T00:00:00.000Z"
 *   - any Date-compatible string
 */
export declare function parseTimeValue(raw: unknown): Date | null;
/**
 * ISO 8601 week number (Monday-based).
 * Copied from a well-known recipe; works without Temporal.
 */
export declare function isoWeekNumber(date: Date): number;
/** Format a Date as DD.MM.YYYY (Russian convention) */
export declare function fmtRuDate(d: Date): string;
//# sourceMappingURL=dateHelpers.d.ts.map