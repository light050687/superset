/**
 * Обёртка вокруг ECharts-инстанса. Перепроброс hover/click-событий наверх,
 * чтобы родитель рисовал свой DOM tooltip и принимал решения о drill/cross-filter.
 */
import type { EChartsType } from 'echarts/core';
import type { EChartsOption } from '../echarts/buildOption';
import { ComputedParetoItem } from '../types';
export interface HoverPayload {
    item: ComputedParetoItem;
    x: number;
    y: number;
}
export interface ChartCanvasProps {
    option: EChartsOption;
    width: number;
    height: number;
    onHoverItem?: (payload: HoverPayload | null) => void;
    onItemClick?: (item: ComputedParetoItem, ctrlKey: boolean) => void;
    onBackgroundClick?: () => void;
    onReady?: (chart: EChartsType) => void;
}
export default function ChartCanvas({ option, width, height, onHoverItem, onItemClick, onBackgroundClick, onReady, }: ChartCanvasProps): JSX.Element;
//# sourceMappingURL=ChartCanvas.d.ts.map