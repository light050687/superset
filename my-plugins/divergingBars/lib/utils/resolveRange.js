"use strict";
/**
 * Helpers для резолва comparison-диапазонов на фронте.
 *
 * Цель: показать пользователю «Текущий: 17.05–23.05 │ vs 10.05–16.05» под
 * dropdown'ом «Сравнить с». Backend уже умеет считать сравнение через
 * `time_offsets` (preset shifts) или два queries (custom). Здесь — только
 * UI-side подсказка, чтобы человек видел КАКИЕ ИМЕННО даты сравниваются.
 *
 * Стратегия:
 *  - Текущий период (`currStart`/`currEnd`) — приходит уже resolved из
 *    transformProps (или fallback в виде Superset preset-строки типа
 *    "Last 7 days"). Если preset — фронту нужно сначала резолвнуть через
 *    `fetchTimeRange` (см. parseSupersetTimeRange / resolveTimeRangeAsync).
 *  - Comparison — вычисляется относительно `currStart`/`currEnd` локально
 *    через dayjs, без запросов к API:
 *      prev_period  → отступ назад на длительность (end-start) дней
 *      prev_week    → оба конца -7 дней
 *      prev_month   → subtract(1, 'month')
 *      prev_quarter → subtract(3, 'month')  (не календарный — просто -3м)
 *      prev_year    → subtract(1, 'year')
 *      custom       → как задано пользователем (customPrev)
 *
 * Edge cases: если входные даты невалидные → null (UI покажет «—»).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveComparisonRange = resolveComparisonRange;
exports.parseSupersetTimeRange = parseSupersetTimeRange;
exports.resolveTimeRangeAsync = resolveTimeRangeAsync;
exports.formatRangeDateRu = formatRangeDateRu;
exports.rangeDurationDays = rangeDurationDays;
// @ts-ignore — dayjs не зарегистрирован в peerDeps плагина, но доступен в
// runtime через Superset webpack alias (антд использует dayjs).
const dayjs_1 = __importDefault(require("dayjs"));
const core_1 = require("@superset-ui/core");
/** Регулярка для уверенного парсинга `YYYY-MM-DD` в начале сегмента. */
const ISO_RE = /^\d{4}-\d{2}-\d{2}/;
function toIsoDate(input) {
    // dayjs принимает много форматов; нам нужен только YYYY-MM-DD на выходе.
    if (!input)
        return null;
    const d = (0, dayjs_1.default)(input);
    if (!d.isValid())
        return null;
    return d.format('YYYY-MM-DD');
}
/**
 * Резолвит comparison-диапазон относительно текущего периода.
 *
 * @returns DateRange (start/end включительно) или null, если резолвить нельзя
 *          (невалидный вход, или custom без customPrev).
 */
function resolveComparisonRange(currStart, currEnd, mode, customPrev) {
    if (!currStart || !currEnd)
        return null;
    const ds = (0, dayjs_1.default)(currStart);
    const de = (0, dayjs_1.default)(currEnd);
    if (!ds.isValid() || !de.isValid())
        return null;
    switch (mode) {
        case 'prev_period': {
            // Длительность включает оба конца → diff + 1 день.
            const days = de.diff(ds, 'day') + 1;
            const prevEnd = ds.subtract(1, 'day');
            const prevStart = prevEnd.subtract(days - 1, 'day');
            return {
                start: prevStart.format('YYYY-MM-DD'),
                end: prevEnd.format('YYYY-MM-DD'),
            };
        }
        case 'prev_week':
            return {
                start: ds.subtract(7, 'day').format('YYYY-MM-DD'),
                end: de.subtract(7, 'day').format('YYYY-MM-DD'),
            };
        case 'prev_month':
            return {
                start: ds.subtract(1, 'month').format('YYYY-MM-DD'),
                end: de.subtract(1, 'month').format('YYYY-MM-DD'),
            };
        case 'prev_quarter':
            return {
                start: ds.subtract(3, 'month').format('YYYY-MM-DD'),
                end: de.subtract(3, 'month').format('YYYY-MM-DD'),
            };
        case 'prev_year':
            return {
                start: ds.subtract(1, 'year').format('YYYY-MM-DD'),
                end: de.subtract(1, 'year').format('YYYY-MM-DD'),
            };
        case 'custom': {
            if (!customPrev)
                return null;
            const s = toIsoDate(customPrev.start);
            const e = toIsoDate(customPrev.end);
            if (!s || !e)
                return null;
            return { start: s, end: e };
        }
        default:
            return null;
    }
}
/**
 * Пробует синхронно распарсить `time_range` в формате Superset.
 *
 * Возвращает {start,end} только если строка явно содержит ISO-даты:
 *   '2026-05-17 : 2026-05-23'
 *   '2026-05-17,2026-05-23'
 *   '2026-05-17T00:00:00 : 2026-05-23T00:00:00'
 *
 * Для preset-строк ('Last 7 days', 'No filter', 'previous calendar week',
 * 'DATEADD(...)') возвращает null — нужно резолвить через API
 * (см. resolveTimeRangeAsync).
 */
function parseSupersetTimeRange(timeRange) {
    if (!timeRange)
        return null;
    const trimmed = timeRange.trim();
    if (!trimmed || trimmed === 'No filter')
        return null;
    // Поддерживаем ' : ' (стандарт Superset) и ',' (legacy).
    let sep = null;
    if (trimmed.includes(' : '))
        sep = ' : ';
    else if (trimmed.includes(',') && !trimmed.includes('('))
        sep = ',';
    if (!sep)
        return null;
    const parts = trimmed.split(sep).map(p => p.trim());
    if (parts.length !== 2)
        return null;
    const [a, b] = parts;
    // Принимаем только если оба конца начинаются с YYYY-MM-DD —
    // защита от 'previous calendar week : DATEADD(...)' и подобных.
    if (!ISO_RE.test(a) || !ISO_RE.test(b))
        return null;
    const start = toIsoDate(a);
    const end = toIsoDate(b);
    if (!start || !end)
        return null;
    return { start, end };
}
/**
 * Резолвит time_range до конкретных ISO-дат. Сначала пробует синхронно,
 * иначе зовёт Superset API `/api/v1/time_range/?q=...` (через
 * `fetchTimeRange` из @superset-ui/core).
 *
 * Возвращает null, если резолвить не удалось (UI покажет «—»).
 */
async function resolveTimeRangeAsync(timeRange, signal) {
    if (!timeRange)
        return null;
    // 1. Fast-path: явный ISO-диапазон.
    const local = parseSupersetTimeRange(timeRange);
    if (local)
        return local;
    // 2. API: резолвим preset через Superset.
    try {
        if (signal?.aborted)
            return null;
        const result = await (0, core_1.fetchTimeRange)(timeRange);
        if (signal?.aborted)
            return null;
        // result.value: 'YYYY-MM-DDTHH:mm:ss ≤ col < YYYY-MM-DDTHH:mm:ss'
        // result.error: при ошибке
        const value = result.value;
        if (!value)
            return null;
        // Парсим оба конца из формата '<start> ≤ col < <end>'
        const match = value.match(/(-?∞|\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2})?)\s*≤[^<]*<\s*(-?∞|\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2})?)/);
        if (!match)
            return null;
        const [, rawStart, rawEnd] = match;
        if (rawStart === '-∞' || rawEnd === '∞')
            return null;
        const start = toIsoDate(rawStart);
        // Superset возвращает end exclusive (< end) — для display показываем
        // последний включённый день: end - 1.
        const endDay = (0, dayjs_1.default)(rawEnd);
        if (!endDay.isValid())
            return null;
        const end = endDay.subtract(1, 'day').format('YYYY-MM-DD');
        if (!start)
            return null;
        return { start, end };
    }
    catch {
        return null;
    }
}
/** Форматирует ISO-дату 'YYYY-MM-DD' → 'DD.MM.YYYY' (русский). */
function formatRangeDateRu(iso) {
    const m = ISO_RE.exec(iso);
    if (!m)
        return iso;
    const [y, mo, d] = iso.slice(0, 10).split('-');
    return `${d}.${mo}.${y}`;
}
/** Длительность диапазона в днях (включительно). */
function rangeDurationDays(range) {
    const a = (0, dayjs_1.default)(range.start);
    const b = (0, dayjs_1.default)(range.end);
    if (!a.isValid() || !b.isValid())
        return 0;
    return Math.max(0, b.diff(a, 'day') + 1);
}
//# sourceMappingURL=resolveRange.js.map