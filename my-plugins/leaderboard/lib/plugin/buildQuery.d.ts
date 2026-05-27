import type { RankedStoresFormData } from '../types';
/**
 * Дефолтные имена колонок/метрик в dataset. Используются как fallback,
 * если D&D-поле в controlPanel оставлено пустым.
 *
 * В DsData: поля приходят и как snake_case (оригинал), и как camelCase
 * (авто-конверсия Superset через lodash). Читаем оба варианта.
 */
export declare const BUILD_QUERY_DEFAULTS: {
    readonly storeIdCol: "store_id";
    readonly storeNameCol: "store_name";
    readonly cityCol: "city";
    readonly formatCol: "format";
    readonly formatNameCol: "format_name";
    readonly divisionCol: "division";
    readonly toClassCol: "to_class";
    readonly writeoffMetric: "writeoff_pct";
    readonly shrinkageMetric: "shrinkage_pct";
    readonly planWriteoffMetric: "plan_writeoff_pct";
    readonly planShrinkageMetric: "plan_shrinkage_pct";
    readonly avgWriteoffMetric: "avg_writeoff_rub";
    readonly avgShrinkageCheckMetric: "avg_shrinkage_check_rub";
};
/**
 * Резолв D&D-column-zone в строку имени столбца.
 * D&D отдаёт массив (multi=false → массив с одним элементом) либо строку.
 * Возвращает fallback если zone пустой.
 */
declare function resolveColumn(fd: Record<string, unknown>, camelKey: string, snakeKey: string, fallback: string, legacyTextKey?: {
    camel: string;
    snake: string;
}): string;
/**
 * Резолв D&D-metric-zone в строку имени метрики (label).
 * Может быть строкой (saved metric), либо объектом AdhocMetric с .label.
 */
declare function resolveMetric(fd: Record<string, unknown>, camelKey: string, snakeKey: string, fallback: string, legacyTextKey?: {
    camel: string;
    snake: string;
}): string;
/** Public helper — те же resolvers экспортируем для transformProps. */
export declare const resolvers: {
    resolveColumn: typeof resolveColumn;
    resolveMetric: typeof resolveMetric;
};
/**
 * Собирает запрос к dataset.
 *
 * columns — набор dimensions, которые таблица рисует в колонке «Магазин».
 * metrics — все % и ₽, которые рендерятся в bullet/dual/number cells.
 *
 * Если mock_mode_enabled = true, отправляем безопасный COUNT(*) fallback —
 * чтобы Superset не упал с "Empty query?" при отсутствии реальных метрик.
 * Результат такого запроса игнорируется в transformProps.
 */
export default function buildQuery(formData: RankedStoresFormData): import("@superset-ui/core").QueryContext;
export {};
//# sourceMappingURL=buildQuery.d.ts.map