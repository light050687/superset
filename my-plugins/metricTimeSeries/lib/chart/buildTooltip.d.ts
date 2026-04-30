import { ChartMode, Granularity, ValueFormatter } from '../types';
import { TokenMap } from '../themeTokens';
import { Bucket } from './aggregations';
interface EChartsTooltipParam {
    seriesId?: string;
    seriesName?: string;
    dataIndex?: number;
    value?: number | null;
    color?: string;
}
interface TooltipBuildParams {
    mode: ChartMode;
    gran: Granularity;
    buckets: Bucket[];
    tokens: TokenMap;
    fontText: string;
    fontMono: string;
    valueFormatter: ValueFormatter;
    seriesLabels: {
        fact: string;
        plan: string;
        py: string;
    };
    totalLabel: string;
}
/**
 * Build the ECharts tooltip formatter.
 * Returns a fn(params) that produces HTML as a string.
 *
 * Matches the prototype layout (lines 1038-1108):
 *   - title line (month/year + optional week label)
 *   - series rows with dot/swatch + value (right-aligned, tabular-nums)
 *   - stack mode: total row after separator, then overlays (plan/py)
 */
export declare function buildTooltipFormatter(params: TooltipBuildParams): (rawParams: EChartsTooltipParam | EChartsTooltipParam[]) => string;
export {};
//# sourceMappingURL=buildTooltip.d.ts.map