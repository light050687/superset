/**
 * Управляет жизненным циклом ECharts-инстанса: init / resize / dispose.
 * Возвращает ref на div-контейнер и функции для привязки option и listeners.
 */
import type { EChartsType } from 'echarts/core';
import type { EChartsOption } from '../echarts/buildOption';
export interface UseChartInstanceArgs {
    option: EChartsOption;
    width: number;
    height: number;
    onReady?: (chart: EChartsType) => void;
}
export declare function useChartInstance({ option, width, height, onReady, }: UseChartInstanceArgs): {
    containerRef: import("react").MutableRefObject<HTMLDivElement>;
    getChart: () => EChartsType | null;
};
export type { EChartsType };
//# sourceMappingURL=useChartInstance.d.ts.map