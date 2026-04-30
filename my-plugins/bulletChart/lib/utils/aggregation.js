"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFormatRows = buildFormatRows;
exports.computeStatus = computeStatus;
exports.computeScaleMax = computeScaleMax;
const resolveMetric_1 = require("./resolveMetric");
/** Преобразование сырых rows из queriesData[0].data → список FormatRow. */
function buildFormatRows(input) {
    const { rawRows, categoryColumn, metricFact, metricPlan, metricPy, metricStores, direction, tolerancePct = 5, } = input;
    if (!rawRows.length || !categoryColumn || !metricFact)
        return [];
    return rawRows
        .map((row, idx) => {
        const categoryValue = row[categoryColumn];
        if (categoryValue == null)
            return null;
        const id = String(categoryValue);
        const name = String(categoryValue);
        const used = new Set([categoryColumn]);
        const factRes = (0, resolveMetric_1.resolveMetricValue)(metricFact, row, used);
        if (factRes.value == null)
            return null;
        if (factRes.label)
            used.add(factRes.label);
        const planRes = (0, resolveMetric_1.resolveMetricValue)(metricPlan, row, used);
        if (planRes.label)
            used.add(planRes.label);
        const pyRes = (0, resolveMetric_1.resolveMetricValue)(metricPy, row, used);
        if (pyRes.label)
            used.add(pyRes.label);
        const storesRes = (0, resolveMetric_1.resolveMetricValue)(metricStores, row, used);
        const rate = factRes.value;
        const plan = planRes.value;
        const py = pyRes.value;
        const stores = storesRes.value;
        const deltaPlan = plan != null ? rate - plan : null;
        const deltaPy = py != null ? rate - py : null;
        const status = computeStatus(rate, plan, direction, tolerancePct);
        return {
            id: `${id}__${idx}`,
            name,
            stores,
            rate,
            plan,
            py,
            spark: [],
            status,
            deltaPlan,
            deltaPy,
        };
    })
        .filter((r) => r !== null);
}
/**
 * Статус строки по соотношению rate/plan и направлению метрики.
 *
 * Формула из прототипа (ref:635-641):
 *   ratio = rate / plan
 *   less_is_better: ratio ≤ (1 − tol) → good; ratio ≥ (1 + tol) → bad; иначе warn
 *   more_is_better: инверсия
 *
 * @param rate         фактическое значение
 * @param plan         целевое значение; если null → neutral
 * @param direction    что считать успехом
 * @param tolerancePct размер «серой зоны» вокруг плана, %
 */
function computeStatus(rate, plan, direction, tolerancePct = 5) {
    if (plan == null || plan === 0)
        return 'neutral';
    const ratio = rate / plan;
    const tol = tolerancePct / 100;
    if (direction === 'less_is_better') {
        if (ratio <= 1 - tol)
            return 'good';
        if (ratio >= 1 + tol)
            return 'bad';
        return 'warn';
    }
    // more_is_better
    if (ratio >= 1 + tol)
        return 'good';
    if (ratio <= 1 - tol)
        return 'bad';
    return 'warn';
}
/** Единая шкала для всех bullet-баров — max(rate, plan, py) × 1.1 (ref:865). */
function computeScaleMax(rows) {
    if (rows.length === 0)
        return 1;
    const all = rows.flatMap(r => [
        r.rate,
        ...(r.plan != null ? [r.plan] : []),
        ...(r.py != null ? [r.py] : []),
    ]);
    const max = Math.max(...all);
    if (!Number.isFinite(max) || max <= 0)
        return 1;
    return max * 1.1;
}
//# sourceMappingURL=aggregation.js.map