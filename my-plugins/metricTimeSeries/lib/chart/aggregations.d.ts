import { TimePoint, CategorySeries, Granularity, Selection } from '../types';
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
export declare function aggregate(timePoints: TimePoint[], categories: CategorySeries[], gran: Granularity, selection: Selection): TimeseriesSlice;
/** Convert absolute values → percent of plan (null-safe, divide-by-zero → null) */
export declare function toPercentOfPlan(values: Array<number | null>, plan: Array<number | null>): Array<number | null>;
//# sourceMappingURL=aggregations.d.ts.map