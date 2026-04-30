import { ruMonthName, ruMonthShort } from '../utils/dateHelpers';
function sumNullable(values) {
    let total = 0;
    let hasValue = false;
    for (const v of values) {
        if (v != null) {
            total += v;
            hasValue = true;
        }
    }
    return hasValue ? total : null;
}
function bucketByKey(items, keyFn) {
    const map = new Map();
    items.forEach((item, idx) => {
        const key = keyFn(item);
        const existing = map.get(key);
        if (existing) {
            existing.items.push(item);
            existing.lastIdx = idx;
        }
        else {
            map.set(key, { items: [item], firstIdx: idx, lastIdx: idx });
        }
    });
    return map;
}
/**
 * Aggregate a time series into buckets for the requested granularity,
 * respecting the selection window (inclusive indices into timePoints).
 *
 * Implementation:
 *   - Take timePoints[selection.from..selection.to].
 *   - Group by the key for the current granularity.
 *   - For each bucket, SUM fact/plan/py and each category's values across its points.
 *   - Nulls are skipped; a bucket whose entire fact column is null stays null.
 */
export function aggregate(timePoints, categories, gran, selection) {
    if (!timePoints.length) {
        return { buckets: [], fact: [], plan: [], py: [], categories: categories.map(() => []) };
    }
    const from = Math.max(0, selection.from);
    const to = Math.min(timePoints.length - 1, selection.to);
    if (to < from) {
        return { buckets: [], fact: [], plan: [], py: [], categories: categories.map(() => []) };
    }
    const range = [];
    for (let i = from; i <= to; i++)
        range.push({ p: timePoints[i], idx: i });
    const keyFn = (() => {
        if (gran === 'year')
            return (ip) => String(ip.p.year);
        if (gran === 'month')
            return (ip) => `${ip.p.year}-${String(ip.p.month).padStart(2, '0')}`;
        if (gran === 'week')
            return (ip) => `${ip.p.year}-W${String(ip.p.week).padStart(2, '0')}`;
        // day
        return (ip) => `${ip.p.year}-${String(ip.p.month).padStart(2, '0')}-${String(ip.p.day).padStart(2, '0')}`;
    })();
    const groups = bucketByKey(range, keyFn);
    const buckets = [];
    const fact = [];
    const plan = [];
    const py = [];
    const catArrays = categories.map(() => []);
    // Preserve insertion order (original time order, since Map keeps it)
    for (const [, group] of groups) {
        const points = group.items;
        const first = points[0].p;
        let label;
        if (gran === 'year') {
            label = String(first.year);
        }
        else if (gran === 'month') {
            label = first.monthName || ruMonthName(first.month);
        }
        else if (gran === 'week') {
            label = `Н${first.week}`;
        }
        else {
            label = `${first.day}`;
        }
        buckets.push({
            label,
            monthShort: ruMonthShort(first.month),
            monthName: first.monthName || ruMonthName(first.month),
            year: first.year,
            month: first.month,
            day: first.day,
            week: first.week,
            firstPointIdx: group.firstIdx,
            lastPointIdx: group.lastIdx,
        });
        fact.push(sumNullable(points.map(ip => ip.p.fact)));
        plan.push(sumNullable(points.map(ip => ip.p.plan)));
        py.push(sumNullable(points.map(ip => ip.p.py)));
        categories.forEach((cat, ci) => {
            const vals = points.map(ip => cat.values[ip.idx] ?? null);
            catArrays[ci].push(sumNullable(vals));
        });
    }
    return { buckets, fact, plan, py, categories: catArrays };
}
/** Convert absolute values → percent of plan (null-safe, divide-by-zero → null) */
export function toPercentOfPlan(values, plan) {
    return values.map((v, i) => {
        const p = plan[i];
        if (v == null || p == null || p === 0)
            return null;
        return +((v / p) * 100).toFixed(1);
    });
}
//# sourceMappingURL=aggregations.js.map