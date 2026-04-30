"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMetricValue = resolveMetricValue;
const core_1 = require("@superset-ui/core");
/**
 * Ищем числовое значение метрики в строке результата.
 *
 * Стратегия 1: прямое обращение по label (getMetricLabel).
 * Стратегия 2: fallback — первый неиспользованный ключ в строке (backward-compat
 * для случаев, когда метрику переименовали).
 */
function resolveMetricValue(formDataMetric, row, excludeKeys) {
    if (!formDataMetric)
        return { label: null, value: null };
    if (!row)
        return { label: null, value: null };
    // Strategy 1: direct label lookup
    const label = (0, core_1.getMetricLabel)(formDataMetric);
    if (label && row[label] != null) {
        const v = Number(row[label]);
        return { label, value: Number.isFinite(v) ? v : null };
    }
    // Strategy 2: fallback — первый неиспользованный ключ
    const nextKey = Object.keys(row).find(k => !excludeKeys.has(k));
    if (nextKey) {
        const val = row[nextKey];
        const n = val != null ? Number(val) : null;
        return { label: nextKey, value: n != null && Number.isFinite(n) ? n : null };
    }
    return { label: null, value: null };
}
//# sourceMappingURL=resolveMetric.js.map