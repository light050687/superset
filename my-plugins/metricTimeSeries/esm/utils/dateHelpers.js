/**
 * Date parsing/formatting helpers for Writeoffs Timeseries.
 *
 * Superset delivers time_col values as numeric timestamps (ms) OR ISO strings
 * depending on the datasource. We normalise both into a single canonical form
 * with year/month/day/week cached on the TimePoint.
 */
const RU_MONTHS_FULL = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
];
const RU_MONTHS_SHORT = [
    'янв',
    'фев',
    'мар',
    'апр',
    'май',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек',
];
/** Russian full month name, 1-indexed (monthNum 1..12) */
export function ruMonthName(monthNum) {
    if (monthNum < 1 || monthNum > 12)
        return '';
    return RU_MONTHS_FULL[monthNum - 1];
}
/** Russian short month name, 1-indexed */
export function ruMonthShort(monthNum) {
    if (monthNum < 1 || monthNum > 12)
        return '';
    return RU_MONTHS_SHORT[monthNum - 1];
}
/**
 * Parse a raw Superset time value into a JS Date.
 *
 * Handles:
 *   - number (epoch ms)
 *   - ISO string "2025-04-01" or "2025-04-01T00:00:00.000Z"
 *   - any Date-compatible string
 */
export function parseTimeValue(raw) {
    if (raw == null)
        return null;
    if (raw instanceof Date)
        return isNaN(raw.getTime()) ? null : raw;
    if (typeof raw === 'number') {
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
    }
    if (typeof raw === 'string') {
        // Plain "YYYY-MM-DD" gets UTC interpretation in some browsers;
        // to keep month/day stable regardless of timezone, split manually when it matches.
        const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
        if (ymd) {
            const [, y, m, day] = ymd;
            const d = new Date(Number(y), Number(m) - 1, Number(day));
            return isNaN(d.getTime()) ? null : d;
        }
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}
/**
 * ISO 8601 week number (Monday-based).
 * Copied from a well-known recipe; works without Temporal.
 */
export function isoWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
/** Format a Date as DD.MM.YYYY (Russian convention) */
export function fmtRuDate(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
}
//# sourceMappingURL=dateHelpers.js.map