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
import type { ComparisonMode } from '../types';
export interface DateRange {
    /** ISO 'YYYY-MM-DD' (включительно). */
    start: string;
    /** ISO 'YYYY-MM-DD' (включительно). */
    end: string;
}
/**
 * Резолвит comparison-диапазон относительно текущего периода.
 *
 * @returns DateRange (start/end включительно) или null, если резолвить нельзя
 *          (невалидный вход, или custom без customPrev).
 */
export declare function resolveComparisonRange(currStart: string, currEnd: string, mode: ComparisonMode, customPrev?: DateRange): DateRange | null;
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
export declare function parseSupersetTimeRange(timeRange: string | undefined): DateRange | null;
/**
 * Резолвит time_range до конкретных ISO-дат. Сначала пробует синхронно,
 * иначе зовёт Superset API `/api/v1/time_range/?q=...` (через
 * `fetchTimeRange` из @superset-ui/core).
 *
 * Возвращает null, если резолвить не удалось (UI покажет «—»).
 */
export declare function resolveTimeRangeAsync(timeRange: string | undefined, signal?: AbortSignal): Promise<DateRange | null>;
/** Форматирует ISO-дату 'YYYY-MM-DD' → 'DD.MM.YYYY' (русский). */
export declare function formatRangeDateRu(iso: string): string;
/** Длительность диапазона в днях (включительно). */
export declare function rangeDurationDays(range: DateRange): number;
//# sourceMappingURL=resolveRange.d.ts.map