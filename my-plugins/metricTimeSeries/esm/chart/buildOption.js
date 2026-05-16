import { LIGHT_TOKENS, DARK_TOKENS, FONTS } from '../themeTokens';
import { aggregate, toPercentOfPlan } from './aggregations';
import { buildXAxis, buildYAxis } from './buildAxes';
import { buildTooltipFormatter } from './buildTooltip';
import { buildSeries } from './buildSeries';
import { toRgba } from '../utils/formatRussian';
export function buildOption(params) {
    const { timePoints, categories, mode, gran, unit, hidden, hiddenCats, selection, isDarkMode, formatters, seriesLabels, } = params;
    const tokens = isDarkMode ? DARK_TOKENS : LIGHT_TOKENS;
    const fontText = FONTS.text;
    const fontMono = FONTS.mono;
    // Aggregate according to selection + granularity
    const slice = aggregate(timePoints, categories, gran, selection);
    // Unit conversion (% of plan)
    const srcFact = slice.fact;
    const srcPlan = slice.plan;
    const srcPy = slice.py;
    const srcCats = slice.categories;
    const seriesFact = unit === 'rub' ? srcFact : toPercentOfPlan(srcFact, srcPlan);
    const seriesPlan = unit === 'rub' ? srcPlan : srcPlan.map(v => (v == null ? null : 100));
    const seriesPy = unit === 'rub' ? srcPy : toPercentOfPlan(srcPy, srcPlan);
    const categoryValues = unit === 'rub' ? srcCats : srcCats.map(arr => toPercentOfPlan(arr, srcPlan));
    const valueFormatter = unit === 'rub' ? formatters.formatValue : formatters.formatPct;
    const axisValueFormatter = unit === 'rub' ? formatters.formatAxis : formatters.formatPctAxis;
    const series = buildSeries({
        mode,
        gran,
        tokens,
        isDark: isDarkMode,
        hidden,
        hiddenCats,
        seriesFact,
        seriesPlan,
        seriesPy,
        categories,
        categoryValues,
        seriesLabels,
    });
    const xAxis = buildXAxis({
        buckets: slice.buckets,
        gran,
        tokens,
        fontText,
        fontMono,
        axisFormatter: axisValueFormatter,
    });
    const yAxis = buildYAxis(tokens, fontMono, axisValueFormatter);
    const tooltipFormatter = buildTooltipFormatter({
        mode,
        gran,
        buckets: slice.buckets,
        tokens,
        fontText,
        fontMono,
        valueFormatter,
        seriesLabels,
        totalLabel: 'Итого',
    });
    const option = {
        animation: true,
        /* DS canonical: ECharts series animation 700ms — синхронизировано с
           card-mount cascade (0.5s card-in + chart fade-in finish ≤ 1.0s).
           Раньше было 420ms → linechart выглядел почти мгновенным и выбивался
           из общего ритма остальных плагинов. */
        animationDuration: 700,
        animationEasing: 'cubicOut',
        animationDurationUpdate: 500,
        animationEasingUpdate: 'cubicInOut',
        grid: { left: 10, right: 40, top: 22, bottom: 26, containLabel: true },
        toolbox: { show: false },
        tooltip: {
            trigger: 'axis',
            backgroundColor: tokens.ink,
            borderColor: 'transparent',
            borderWidth: 0,
            padding: [8, 12, 9, 12],
            extraCssText: 'pointer-events:none;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.25);max-width:260px',
            textStyle: { color: tokens.s, fontFamily: fontText, fontSize: 11 },
            axisPointer: {
                type: 'line',
                lineStyle: { color: tokens.g400, width: 1, type: [2, 3] },
                z: 0,
            },
            formatter: tooltipFormatter,
        },
        xAxis,
        yAxis,
        brush: {
            toolbox: [],
            xAxisIndex: 0,
            brushLink: 'all',
            throttleType: 'debounce',
            throttleDelay: 100,
            brushType: 'lineX',
            brushStyle: {
                borderWidth: 1,
                borderColor: toRgba(tokens.cSky, 0.55),
                color: toRgba(tokens.cSky, 0.08),
            },
            transformable: false,
            removeOnClick: false,
            inBrush: { opacity: 1 },
            outOfBrush: { opacity: 0.35 },
        },
        series,
    };
    return { option, buckets: slice.buckets };
}
//# sourceMappingURL=buildOption.js.map