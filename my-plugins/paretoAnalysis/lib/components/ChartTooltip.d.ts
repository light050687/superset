import { ComputedParetoItem, ThemeTokens } from '../types';
export interface ChartTooltipProps {
    item: ComputedParetoItem;
    x: number;
    y: number;
    tokens: ThemeTokens;
    metricLabel: string;
    metricUnit: string;
    showPrev: boolean;
}
/**
 * DOM-tooltip поверх ECharts canvas. Позиционируется offsetX/Y внутри
 * родителя с `position:relative`. Не использует порталы, чтобы наследовать
 * overflow/clip карточки и автоматически ехать при scroll дашборда.
 */
export default function ChartTooltip({ item, x, y, tokens, metricLabel, metricUnit, showPrev, }: ChartTooltipProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ChartTooltip.d.ts.map