"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOption = buildOption;
const themeTokens_1 = require("../themeTokens");
const aggregations_1 = require("./aggregations");
const buildAxes_1 = require("./buildAxes");
const buildTooltip_1 = require("./buildTooltip");
const buildSeries_1 = require("./buildSeries");
const formatRussian_1 = require("../utils/formatRussian");
function buildOption(params) {
    const { timePoints, categories, mode, gran, unit, hidden, hiddenCats, selection, isDarkMode, formatters, seriesLabels, } = params;
    const tokens = isDarkMode ? themeTokens_1.DARK_TOKENS : themeTokens_1.LIGHT_TOKENS;
    const fontText = themeTokens_1.FONTS.text;
    const fontMono = themeTokens_1.FONTS.mono;
    // Aggregate according to selection + granularity
    const slice = (0, aggregations_1.aggregate)(timePoints, categories, gran, selection);
    // Unit conversion (% of plan)
    const srcFact = slice.fact;
    const srcPlan = slice.plan;
    const srcPy = slice.py;
    const srcCats = slice.categories;
    const seriesFact = unit === 'rub' ? srcFact : (0, aggregations_1.toPercentOfPlan)(srcFact, srcPlan);
    const seriesPlan = unit === 'rub' ? srcPlan : srcPlan.map(v => (v == null ? null : 100));
    const seriesPy = unit === 'rub' ? srcPy : (0, aggregations_1.toPercentOfPlan)(srcPy, srcPlan);
    const categoryValues = unit === 'rub' ? srcCats : srcCats.map(arr => (0, aggregations_1.toPercentOfPlan)(arr, srcPlan));
    const valueFormatter = unit === 'rub' ? formatters.formatValue : formatters.formatPct;
    const axisValueFormatter = unit === 'rub' ? formatters.formatAxis : formatters.formatPctAxis;
    const series = (0, buildSeries_1.buildSeries)({
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
    const xAxis = (0, buildAxes_1.buildXAxis)({
        buckets: slice.buckets,
        gran,
        tokens,
        fontText,
        fontMono,
        axisFormatter: axisValueFormatter,
    });
    const yAxis = (0, buildAxes_1.buildYAxis)(tokens, fontMono, axisValueFormatter);
    const tooltipFormatter = (0, buildTooltip_1.buildTooltipFormatter)({
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
                borderColor: (0, formatRussian_1.toRgba)(tokens.cSky, 0.55),
                color: (0, formatRussian_1.toRgba)(tokens.cSky, 0.08),
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