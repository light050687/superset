import { ChartMode, CategorySeries, Granularity, SeriesHidden } from '../types';
import { TokenMap } from '../themeTokens';
import { resolveColor } from '../utils/colorPalette';
import { toRgba } from '../utils/formatRussian';

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
  seriesLabels: { fact: string; plan: string; py: string };
}

type EChartsSeries = Record<string, unknown>;

/**
 * Build ECharts series array for the given chart mode.
 * Matches the prototype (lines 837-1014).
 */
export function buildSeries(params: BuildSeriesParams): EChartsSeries[] {
  const {
    mode,
    gran,
    tokens,
    isDark,
    hidden,
    hiddenCats,
    seriesFact,
    seriesPlan,
    seriesPy,
    categories,
    categoryValues,
    seriesLabels,
  } = params;

  if (mode === 'line') {
    return buildLineSeries({
      gran,
      tokens,
      hidden,
      seriesFact,
      seriesPlan,
      seriesPy,
      seriesLabels,
    });
  }

  return buildStackSeries({
    mode,
    tokens,
    isDark,
    hidden,
    hiddenCats,
    categories,
    categoryValues,
    seriesPlan,
    seriesPy,
    seriesLabels,
  });
}

/* ───────── Line mode ───────── */

function buildLineSeries(args: {
  gran: Granularity;
  tokens: TokenMap;
  hidden: SeriesHidden;
  seriesFact: Array<number | null>;
  seriesPlan: Array<number | null>;
  seriesPy: Array<number | null>;
  seriesLabels: { fact: string; plan: string; py: string };
}): EChartsSeries[] {
  const { gran, tokens, hidden, seriesFact, seriesPlan, seriesPy, seriesLabels } = args;
  const skySolid = tokens.cSky;
  const violetSolid = tokens.cViolet;

  return [
    {
      name: seriesLabels.fact,
      id: 'fact',
      type: 'line',
      smooth: true,
      smoothMonotone: 'x',
      symbol: 'circle',
      symbolSize: gran === 'month' ? 0 : 4,
      showSymbol: gran === 'week',
      lineStyle: { color: skySolid, width: 2.5, cap: 'round' },
      itemStyle: { color: skySolid, borderColor: tokens.s, borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: toRgba(skySolid, 0.28) },
            { offset: 1, color: toRgba(skySolid, 0.02) },
          ],
        },
      },
      emphasis: { disabled: true },
      cursor: gran === 'month' ? 'pointer' : 'crosshair',
      z: 3,
      data: hidden.fact ? [] : seriesFact,
    },
    {
      name: seriesLabels.plan,
      id: 'plan',
      type: 'line',
      smooth: true,
      smoothMonotone: 'x',
      symbol: 'circle',
      showSymbol: true,
      symbolSize: gran === 'month' ? 6 : 4,
      lineStyle: { color: tokens.g600, width: 1.5, cap: 'round', opacity: 1 },
      itemStyle: { color: tokens.s, borderColor: tokens.g600, borderWidth: 1.5 },
      emphasis: { disabled: true },
      z: 2,
      data: hidden.plan ? [] : seriesPlan,
      connectNulls: true,
    },
    {
      name: seriesLabels.py,
      id: 'py',
      type: 'line',
      smooth: true,
      smoothMonotone: 'x',
      symbol: 'none',
      showSymbol: false,
      lineStyle: { color: violetSolid, width: 2, type: [6, 5], cap: 'round', opacity: 0.95 },
      itemStyle: { color: violetSolid },
      emphasis: { disabled: true },
      z: 1,
      data: hidden.py ? [] : seriesPy,
      connectNulls: false,
    },
  ];
}

/* ───────── Stack (bar / area) mode ───────── */

function buildStackSeries(args: {
  mode: ChartMode;
  tokens: TokenMap;
  isDark: boolean;
  hidden: SeriesHidden;
  hiddenCats: Record<string, boolean>;
  categories: CategorySeries[];
  categoryValues: Array<Array<number | null>>;
  seriesPlan: Array<number | null>;
  seriesPy: Array<number | null>;
  seriesLabels: { fact: string; plan: string; py: string };
}): EChartsSeries[] {
  const {
    mode,
    tokens,
    isDark,
    hidden,
    hiddenCats,
    categories,
    categoryValues,
    seriesPlan,
    seriesPy,
    seriesLabels,
  } = args;
  const isArea = mode === 'stack-area';
  const violetSolid = tokens.cViolet;

  const catSeries: EChartsSeries[] = categories.map((cat, ci) => {
    const color = resolveColor({ colorToken: cat.colorToken, colorLight: cat.colorLight, colorDark: cat.colorDark }, isDark);
    const data = hiddenCats[cat.id] ? [] : categoryValues[ci];
    if (isArea) {
      return {
        name: cat.name,
        id: `cat-${cat.id}`,
        type: 'line',
        stack: 'total',
        smooth: true,
        smoothMonotone: 'x',
        symbol: 'none',
        lineStyle: { color, width: 1.2, cap: 'round', opacity: 1 },
        itemStyle: { color },
        areaStyle: { color: toRgba(color, 0.4), opacity: 1 },
        emphasis: { disabled: true },
        data,
        z: 2,
      };
    }
    return {
      name: cat.name,
      id: `cat-${cat.id}`,
      type: 'bar',
      stack: 'total',
      barMaxWidth: 36,
      barCategoryGap: '28%',
      itemStyle: {
        color,
        borderRadius: ci === categories.length - 1 ? [3, 3, 0, 0] : 0,
      },
      emphasis: { disabled: true },
      data,
      z: 2,
    };
  });

  const overlays: EChartsSeries[] = [];
  if (!hidden.plan) {
    overlays.push({
      name: seriesLabels.plan,
      id: 'plan',
      type: 'line',
      smooth: true,
      smoothMonotone: 'x',
      symbol: 'circle',
      showSymbol: true,
      symbolSize: 6,
      z: 11,
      silent: true,
      lineStyle: { color: tokens.g600, width: 1.5, cap: 'round', opacity: 1 },
      itemStyle: { color: tokens.s, borderColor: tokens.g600, borderWidth: 1.5 },
      emphasis: { disabled: true },
      data: seriesPlan,
      connectNulls: true,
    });
  }
  if (!hidden.py) {
    if (mode === 'stack-bar') {
      overlays.push({
        name: seriesLabels.py,
        id: 'py-bar',
        type: 'bar',
        data: seriesPy,
        yAxisIndex: 0,
        barMaxWidth: 36,
        barGap: '-50%',
        z: 1,
        silent: true,
        itemStyle: {
          color: toRgba(violetSolid, 0.35),
          borderRadius: [3, 3, 0, 0],
          borderColor: violetSolid,
          borderWidth: 1,
          borderType: 'dashed',
        },
        emphasis: { disabled: true },
      });
    } else {
      overlays.push({
        name: seriesLabels.py,
        id: 'py',
        type: 'line',
        smooth: true,
        smoothMonotone: 'x',
        symbol: 'none',
        showSymbol: false,
        z: 9,
        silent: true,
        lineStyle: { color: violetSolid, width: 2, type: [5, 4], cap: 'round', opacity: 1 },
        emphasis: { disabled: true },
        data: seriesPy,
        connectNulls: false,
      });
    }
  }

  return [...catSeries, ...overlays];
}
