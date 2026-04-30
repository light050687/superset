import { Granularity, ValueFormatter } from '../types';
import { TokenMap } from '../themeTokens';
import { Bucket } from './aggregations';
interface AxisBuildParams {
    buckets: Bucket[];
    gran: Granularity;
    tokens: TokenMap;
    fontText: string;
    fontMono: string;
    axisFormatter: ValueFormatter;
}
/**
 * Build xAxis config for ECharts with rich formatter that mirrors the prototype.
 *
 * Rules (matching prototype lines 786-820):
 *   - year:  `{y|2025}`
 *   - month: `{m|Апрель}\n{y|2025}` on year boundary, `{m|Апрель}` otherwise
 *   - week:  `{w|Н1}\n{m|апр 2025}` on month+year boundary,
 *            `{w|Н1}\n{m|апр}` on month boundary only,
 *            `{w|Н1}` otherwise
 *   - day:   `{w|1}\n{m|апр 2025}` on the first day of the first week of the month,
 *            `{w|1н}` on the first day of a new week,
 *            '' otherwise — keeps tick labels sparse
 */
export declare function buildXAxis(params: AxisBuildParams): {
    type: "category";
    data: string[];
    boundaryGap: boolean | [string, string];
    axisLine: {
        show: boolean;
        lineStyle: {
            color: string;
        };
    };
    axisTick: {
        show: boolean;
    };
    axisLabel: {
        color: string;
        fontFamily: string;
        fontSize: number;
        fontWeight: number;
        margin: number;
        interval: number | "auto";
        formatter: (_val: string, idx: number) => string;
        rich: {
            m: {
                color: string;
                fontFamily: string;
                fontSize: number;
                fontWeight: number;
                lineHeight: number;
                padding: number[];
            };
            y: {
                color: string;
                fontFamily: string;
                fontSize: number;
                fontWeight: number;
                lineHeight: number;
                padding: number[];
            };
            w: {
                color: string;
                fontFamily: string;
                fontSize: number;
                fontWeight: number;
                lineHeight: number;
                padding: number[];
            };
        };
    };
    splitLine: {
        show: boolean;
    };
};
export declare function buildYAxis(tokens: TokenMap, fontMono: string, axisFormatter: ValueFormatter): {
    type: "value";
    position: "left";
    axisLine: {
        show: boolean;
    };
    axisTick: {
        show: boolean;
    };
    axisLabel: {
        color: string;
        fontFamily: string;
        fontSize: number;
        formatter: (value: number) => string;
        margin: number;
    };
    splitLine: {
        show: boolean;
        lineStyle: {
            color: string;
            type: [number, number];
        };
    };
    splitNumber: number;
};
export {};
//# sourceMappingURL=buildAxes.d.ts.map