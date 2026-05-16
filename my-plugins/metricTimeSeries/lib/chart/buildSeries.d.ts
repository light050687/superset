import { ChartMode, CategorySeries, Granularity, SeriesHidden } from '../types';
import { TokenMap } from '../themeTokens';
interface BuildSeriesParams {
    mode: ChartMode;
    gran: Granularity;
    tokens: TokenMap;
    isDark: boolean;
    hidden: SeriesHidden;
    hiddenCats: Record<string, boolean>;
    seriesFact: Array<number | null>;
    seriesPlan: Array<number | null>;
    seriesPy: Array<number | null>;
    categories: CategorySeries[];
    categoryValues: Array<Array<number | null>>;
    seriesLabels: {
        fact: string;
        plan: string;
        py: string;
    };
}
type EChartsSeries = Record<string, unknown>;
/**
 * Build ECharts series array for the given chart mode.
 * Matches the prototype (lines 837-1014).
 */
export declare function buildSeries(params: BuildSeriesParams): EChartsSeries[];
export {};
//# sourceMappingURL=buildSeries.d.ts.map