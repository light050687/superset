import { TimePoint, CategorySeries, ChartMode, Granularity, Unit, SeriesHidden, Selection, ValueFormatter } from '../types';
import { aggregate } from './aggregations';
export interface BuildOptionParams {
    timePoints: TimePoint[];
    categories: CategorySeries[];
    mode: ChartMode;
    gran: Granularity;
    unit: Unit;
    hidden: SeriesHidden;
    hiddenCats: Record<string, boolean>;
    selection: Selection;
    isDarkMode: boolean;
    formatters: {
        formatValue: ValueFormatter;
        formatAxis: ValueFormatter;
        formatPct: ValueFormatter;
        formatPctAxis: ValueFormatter;
    };
    seriesLabels: {
        fact: string;
        plan: string;
        py: string;
    };
}
export interface BuildOptionResult {
    option: Record<string, unknown>;
    /** Expose buckets so the component can map brush/click events back to dates */
    buckets: ReturnType<typeof aggregate>['buckets'];
}
export declare function buildOption(params: BuildOptionParams): BuildOptionResult;
//# sourceMappingURL=buildOption.d.ts.map