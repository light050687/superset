import { TimePoint, CategorySeries, Granularity, Selection } from '../types';
import { ruMonthName, ruMonthShort } from '../utils/dateHelpers';

/**
 * One logical "bucket" of the aggregated time axis.
 * `label` — short text shown as an X-axis tick (the `rich` formatter may split it later).
 * `rich`  — flags used by buildAxes to decide when to show year/month/week headers.
 * Parallel arrays on TimeseriesSlice keep the buckets aligned with series values.
 */
export interface Bucket {
  label: string;
  monthShort: string;
  monthName: string;
  year: number;
  month: number;
  day: number;
  week: number;
  /** Index into the underlying TimePoint[] — used for drill-down / brush-to-data mapping */
  firstPointIdx: number;
  lastPointIdx: number;
}

export interface TimeseriesSlice {
  buckets: Bucket[];
  fact: Array<number | null>;
  plan: Array<number | null>;
  py: Array<number | null>;
  /** One parallel values-array per category (length = categories.length) */
  categories: Array<Array<number | null>>;
}

function sumNullable(values: Array<number | null>): number | null {
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

function bucketByKey<T>(
  items: T[],
  keyFn: (item: T) => string,
): Map<string, { items: T[]; firstIdx: number; lastIdx: number }> {
  const map = new Map<string, { items: T[]; firstIdx: number; lastIdx: number }>();
  items.forEach((item, idx) => {
    const key = keyFn(item);
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
      existing.lastIdx = idx;
    } else {
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
export function aggregate(
  timePoints: TimePoint[],
  categories: CategorySeries[],
  gran: Granularity,
  selection: Selection,
): TimeseriesSlice {
  if (!timePoints.length) {
    return { buckets: [], fact: [], plan: [], py: [], categories: categories.map(() => []) };
  }

  const from = Math.max(0, selection.from);
  const to = Math.min(timePoints.length - 1, selection.to);
  if (to < from) {
    return { buckets: [], fact: [], plan: [], py: [], categories: categories.map(() => []) };
  }

  // Keep original indices alongside the points so we can trace drill/brush back.
  type IndexedPoint = { p: TimePoint; idx: number };
  const range: IndexedPoint[] = [];
  for (let i = from; i <= to; i++) range.push({ p: timePoints[i], idx: i });

  const keyFn = (() => {
    if (gran === 'year') return (ip: IndexedPoint) => String(ip.p.year);
    if (gran === 'month') return (ip: IndexedPoint) => `${ip.p.year}-${String(ip.p.month).padStart(2, '0')}`;
    if (gran === 'week') return (ip: IndexedPoint) => `${ip.p.year}-W${String(ip.p.week).padStart(2, '0')}`;
    // day
    return (ip: IndexedPoint) =>
      `${ip.p.year}-${String(ip.p.month).padStart(2, '0')}-${String(ip.p.day).padStart(2, '0')}`;
  })();

  const groups = bucketByKey(range, keyFn);

  const buckets: Bucket[] = [];
  const fact: Array<number | null> = [];
  const plan: Array<number | null> = [];
  const py: Array<number | null> = [];
  const catArrays: Array<Array<number | null>> = categories.map(() => []);

  // Preserve insertion order (original time order, since Map keeps it)
  for (const [, group] of groups) {
    const points = group.items;
    const first = points[0].p;

    let label: string;
    if (gran === 'year') {
      label = String(first.year);
    } else if (gran === 'month') {
      label = first.monthName || ruMonthName(first.month);
    } else if (gran === 'week') {
      label = `Н${first.week}`;
    } else {
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
export function toPercentOfPlan(
  values: Array<number | null>,
  plan: Array<number | null>,
): Array<number | null> {
  return values.map((v, i) => {
    const p = plan[i];
    if (v == null || p == null || p === 0) return null;
    return +((v / p) * 100).toFixed(1);
  });
}
