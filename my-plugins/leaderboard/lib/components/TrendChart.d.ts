import type { DsTokens } from '../themeTokens';
interface Props {
    data: number[];
    tokens: DsTokens;
}
/** Большой SVG-график тренда с Catmull-Rom smooth + hover-overlay с tooltip. */
declare function TrendChartInner({ data, tokens }: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof TrendChartInner>;
export default _default;
//# sourceMappingURL=TrendChart.d.ts.map