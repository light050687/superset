import React from 'react';
interface TrendChartProps {
    data: number[];
    color: string;
    height?: number;
    /** Short label under the last point (e.g. "сейчас", "−1н"). */
    labelBuilder?: (weeksAgo: number) => string;
}
declare const _default: React.NamedExoticComponent<TrendChartProps>;
export default _default;
//# sourceMappingURL=TrendChart.d.ts.map