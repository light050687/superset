import type { ComparisonMode, FormatDef, Store } from '../types';
/**
 * Группирует плоские строки SQL-запроса в Store[] — period-over-period.
 *
 * Структура входа: GROUP BY (store_code, store_name, city, format) и метрики
 * `<lossLabel>` (current) + `<lossLabel>__<shift>` (comparison). Аналогично
 * для turnover. Каждый магазин занимает РОВНО одну строку (без агрегации
 * по неделям). Маркер shift зависит от выбранного `comparisonMode`.
 *
 * - `prev_period` → suffix `__inherit`
 * - `prev_week`   → suffix `__1 week ago`
 * - `prev_month`  → suffix `__1 month ago`
 * - `prev_quarter`→ suffix `__1 quarter ago`
 * - `prev_year`   → suffix `__1 year ago`
 * - `custom`      → отдельный query (comp), здесь не используется
 *
 * Если comparison-колонок нет (например main-query при custom) — prevValue = 0.
 */
export interface RowsToStoresColumns {
    codeCol?: string;
    nameCol?: string;
    cityCol?: string;
    formatCol?: string;
    weekCol?: string;
    lossLabel?: string;
    turnoverLabel?: string;
    /**
     * Режим сравнения — определяет какой suffix искать для comparison-колонок.
     * Если не передан или = 'custom' — comparison не парсится из этих rows.
     */
    comparisonMode?: ComparisonMode;
}
/** Маппинг режима сравнения на time-compare суффикс. */
export declare function comparisonModeToShift(mode: ComparisonMode): string;
/**
 * Группирует rows в Store[]. Каждая row = один магазин (один уникальный
 * groupby-ключ). prev/curr собираются по имени колонок:
 *   `<lossLabel>`           — current
 *   `<lossLabel>__<shift>`  — previous
 */
export declare function rowsToStores(rows: Record<string, unknown>[], columns: RowsToStoresColumns, formatsMap: Map<string, FormatDef>, prevRows?: Record<string, unknown>[]): Store[];
//# sourceMappingURL=rowsToStores.d.ts.map