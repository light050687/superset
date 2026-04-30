import { QueryFormMetric } from '@superset-ui/core';
/**
 * Ищем числовое значение метрики в строке результата.
 *
 * Стратегия 1: прямое обращение по label (getMetricLabel).
 * Стратегия 2: fallback — первый неиспользованный ключ в строке (backward-compat
 * для случаев, когда метрику переименовали).
 */
export declare function resolveMetricValue(formDataMetric: QueryFormMetric | undefined, row: Record<string, unknown> | undefined, excludeKeys: Set<string>): {
    label: string | null;
    value: number | null;
};
//# sourceMappingURL=resolveMetric.d.ts.map