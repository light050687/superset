/**
 * Чистая функция сборки EChartsCoreOption для Pareto Card.
 *
 * Принимает на вход:
 *   - computed: результат computePareto() с уже рассчитанными зонами и рангами
 *   - state: runtime-state (unit, topAOnly, prevOverlay, zoneFilter, selectedId,
 *            seriesVisible, threshold)
 *   - tokens: DS 2.0 hex-значения активной темы
 *   - metricUnit: строка для formatter-ов оси Y (напр. «млн ₽»)
 *
 * Не делает никаких side-effect'ов и не трогает window/document.
 */

import { ComputedPareto, ComputedParetoItem, ParetoState, ThemeTokens } from '../types';
import { zoneColor } from '../utils/zoneColors';

const nf1 = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export interface BuildOptionArgs {
  computed: ComputedPareto;
  state: ParetoState;
  tokens: ThemeTokens;
}

// Тип опции оставляем как `unknown`-совместимый object — `echarts/core`
// типизация `EChartsCoreOption` слишком строгая для наших per-item-label'ов,
// поэтому экспортируем более мягкий тип.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EChartsOption = Record<string, any>;

/** Per-item label → ★ / ▲N / ▼N над баром, без подложки. */
function anchorLabel(
  it: ComputedParetoItem,
  tokens: ThemeTokens,
  showLabels: boolean,
): Record<string, unknown> | undefined {
  if (!showLabels) return undefined;
  if (it.isNewInA) {
    return {
      show: true,
      position: 'top',
      distance: 6,
      formatter: '★ новый',
      color: tokens.dn,
      fontFamily: tokens.fontMono,
      fontSize: 10,
      fontWeight: 700,
    };
  }
  if (it.rankDelta != null && Math.abs(it.rankDelta) >= 2) {
    const isWorse = it.rankDelta > 0;
    return {
      show: true,
      position: 'top',
      distance: 6,
      formatter: `${isWorse ? '▲ ' : '▼ '}${Math.abs(it.rankDelta)}`,
      color: isWorse ? tokens.dn : tokens.up,
      fontFamily: tokens.fontMono,
      fontSize: 10,
      fontWeight: 700,
    };
  }
  return undefined;
}

export function buildEChartsOption({
  computed,
  state,
  tokens,
}: BuildOptionArgs): EChartsOption {
  // Видимые items — учёт Top-A режима.
  const items: ComputedParetoItem[] = state.topAOnly
    ? computed.items.filter(i => i.zone === 'A')
    : computed.items;

  const categories = items.map(i => i.name);
  const totalAll =
    computed.items.reduce((s, i) => s + i.value, 0) || 1;

  // ─── Bar series (current period) ───
  const barData = items.map(it => {
    const matchesCell = state.selectedId == null || state.selectedId === it.id;
    const matchesZone = state.zoneFilter == null || state.zoneFilter === it.zone;
    const matchesFilter = matchesCell && matchesZone;
    const isDimmed =
      (state.selectedId != null || state.zoneFilter != null) && !matchesFilter;

    // Значение бара зависит от unit (₽/%).
    const value =
      state.unit === 'rub' ? it.value : +((it.value / totalAll) * 100).toFixed(2);

    const color = zoneColor(it.zone, tokens);
    const label = anchorLabel(it, tokens, state.seriesVisible.bars);

    return {
      value,
      // Сохраняем raw-item для tooltip/click-обработчиков.
      _item: it,
      itemStyle: {
        color,
        opacity: state.seriesVisible.bars ? (isDimmed ? 0.28 : 1) : 0,
        borderRadius: [3, 3, 0, 0],
      },
      emphasis: {
        itemStyle: {
          color,
          shadowBlur: 12,
          shadowColor: `${color}66`, // ~0.4 alpha
        },
      },
      ...(label ? { label } : {}),
    };
  });

  // ─── Ghost bars (previous period), если включён overlay ───
  const ghostData = items.map(it => ({
    value: it.valuePrev ?? 0,
    _item: it,
  }));

  // ─── Cumulative line ───
  const lineData = state.seriesVisible.line
    ? items.map(it => ({ value: +it.cumPct.toFixed(2), _item: it }))
    : [];

  // ─── Assemble series ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series: Record<string, any>[] = [];

  // 1. Текущий период — бары.
  series.push({
    name: 'bars',
    type: 'bar',
    yAxisIndex: 0,
    data: barData,
    barMaxWidth: state.prevOverlay ? 40 : 52,
    barCategoryGap: '22%',
    z: 2,
    silent: false,
    itemStyle: { borderRadius: [3, 3, 0, 0] },
  });

  // 2. Прошлый период — опционально (ghost bars).
  // barGap:'-50%' — как в прототипе: ghost-бары наполовину выглядывают из-за
  // current-баров, z:1 кладёт их под current. Получаем «current впереди,
  // prev как рамка сзади со сдвигом».
  if (state.prevOverlay) {
    series.push({
      name: 'bars-prev',
      type: 'bar',
      yAxisIndex: 0,
      data: ghostData,
      barMaxWidth: 40,
      barGap: '-50%',
      z: 1,
      silent: true,
      itemStyle: {
        color: 'transparent',
        borderRadius: [3, 3, 0, 0],
        borderColor: tokens.g400,
        borderWidth: 1,
        borderType: 'dashed',
        opacity: 0.75,
      },
    });
  }

  // 3. Кумулятивная линия + markLine на thresholds.
  series.push({
    name: 'line',
    type: 'line',
    yAxisIndex: 1,
    data: lineData,
    smooth: false,
    showSymbol: state.seriesVisible.line,
    symbolSize: 7,
    z: 3,
    lineStyle: {
      color: tokens.ink,
      width: 2,
    },
    itemStyle: {
      color: tokens.s,
      borderColor: tokens.ink,
      borderWidth: 2,
    },
    emphasis: {
      itemStyle: {
        color: tokens.ink,
        borderColor: tokens.ink,
        borderWidth: 2,
      },
      scale: 1.3,
    },
    markLine: state.seriesVisible.line
      ? {
          silent: true,
          symbol: ['none', 'none'],
          lineStyle: {
            color: tokens.g400,
            type: 'dashed',
            width: 1,
            opacity: 0.6,
          },
          label: {
            show: true,
            position: 'end',
            color: tokens.g500,
            fontFamily: tokens.fontMono,
            fontSize: 9,
            fontWeight: 600,
            formatter: (p: { value: number }) => `${p.value}%`,
            padding: [0, 0, 0, 4],
          },
          data: state.topAOnly
            ? [{ yAxis: state.threshold }]
            : [{ yAxis: state.threshold }, { yAxis: 95 }],
        }
      : undefined,
  });

  // ─── Option ───
  return {
    animation: true,
    animationDuration: 450,
    animationEasing: 'cubicOut',
    /* Update animation выключена — transformProps пересоздаёт items[] reference
       на каждый Redux dispatch (rows.map → new array). useChartInstance вызывает
       setOption({ notMerge: true }) → ECharts проигрывает update animation, даже
       если данные идентичны. Initial 450ms reveal остаётся.
       См. CLAUDE.md «Re-render guard (viz)». */
    animationDurationUpdate: 0,
    animationEasingUpdate: 'linear',

    tooltip: { show: false },

    grid: {
      left: 14,
      right: 48,
      top: 22,
      bottom: 72,
      containLabel: true,
    },

    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: tokens.g300 } },
      axisTick: { show: false },
      axisLabel: {
        color: tokens.g500,
        fontFamily: tokens.fontSans,
        fontSize: 10,
        fontWeight: 500,
        interval: 0,
        rotate: 28,
        align: 'right',
        verticalAlign: 'top',
        margin: 10,
        formatter: (name: string) =>
          name && name.length > 16 ? `${name.slice(0, 15)}…` : name,
      },
    },

    yAxis: [
      // Левая — значения бара (₽ или %).
      {
        type: 'value',
        position: 'left',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: tokens.g200, type: 'dashed' } },
        max: state.unit === 'pct' ? 100 : undefined,
        axisLabel: {
          color: tokens.g500,
          fontFamily: tokens.fontMono,
          fontSize: 9,
          fontWeight: 500,
          formatter: (v: number) =>
            state.unit === 'rub'
              ? nf1.format(v)
              : `${nf1.format(v)}%`,
        },
      },
      // Правая — кумулятивные % 0..100.
      {
        type: 'value',
        position: 'right',
        min: 0,
        max: 100,
        interval: 25,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: tokens.g400,
          fontFamily: tokens.fontMono,
          fontSize: 9,
          fontWeight: 500,
          formatter: (v: number) => `${v}%`,
        },
      },
    ],

    series,
  };
}
