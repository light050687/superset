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
export function buildXAxis(params: AxisBuildParams) {
  const { buckets, gran, tokens, fontText, fontMono } = params;

  const formatter = (_val: string, idx: number): string => {
    const b = buckets[idx];
    if (!b) return '';
    const prev = idx > 0 ? buckets[idx - 1] : null;
    if (gran === 'year') {
      return `{y|${b.year}}`;
    }
    if (gran === 'month') {
      const showYear = !prev || prev.year !== b.year;
      return showYear ? `{m|${b.monthName}}\n{y|${b.year}}` : `{m|${b.monthName}}`;
    }
    if (gran === 'day') {
      const isFirstDayOfMonth = !prev || prev.month !== b.month || prev.year !== b.year;
      if (isFirstDayOfMonth) {
        return `{w|${b.day}}\n{m|${b.monthShort} ${b.year}}`;
      }
      // Sparse tick labels on other days — rely on first-of-week as marker
      return '';
    }
    // week
    const newMonth = !prev || prev.month !== b.month;
    if (newMonth) {
      const newYear = !prev || prev.year !== b.year;
      return newYear
        ? `{w|${b.label}}\n{m|${b.monthShort} ${b.year}}`
        : `{w|${b.label}}\n{m|${b.monthShort}}`;
    }
    return `{w|${b.label}}`;
  };

  // Avoid label overflow in dense granularities.
  // ECharts 'auto' picks every Nth tick based on available width.
  const axisInterval: number | 'auto' =
    gran === 'year' || gran === 'month' ? 0 : 'auto';

  return {
    type: 'category' as const,
    data: buckets.map(b => b.label),
    boundaryGap: false as boolean | [string, string],
    axisLine: { show: true, lineStyle: { color: tokens.g200 } },
    axisTick: { show: false },
    axisLabel: {
      color: tokens.g500,
      fontFamily: fontText,
      fontSize: 11,
      fontWeight: 500,
      margin: 10,
      interval: axisInterval,
      formatter,
      rich: {
        m: {
          color: tokens.g500,
          fontFamily: fontText,
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 14,
          padding: [0, 0, 0, 0],
        },
        y: {
          color: tokens.g600,
          fontFamily: fontMono,
          fontSize: 9,
          fontWeight: 600,
          lineHeight: 12,
          padding: [2, 0, 0, 0],
        },
        w: {
          color: tokens.g500,
          fontFamily: fontMono,
          fontSize: 9,
          fontWeight: 500,
          lineHeight: 12,
          padding: [0, 0, 0, 0],
        },
      },
    },
    splitLine: { show: false },
  };
}

export function buildYAxis(tokens: TokenMap, fontMono: string, axisFormatter: ValueFormatter) {
  return {
    type: 'value' as const,
    position: 'left' as const,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: tokens.g500,
      fontFamily: fontMono,
      fontSize: 10,
      formatter: (value: number) => axisFormatter(value),
      margin: 10,
    },
    splitLine: { show: true, lineStyle: { color: tokens.g200, type: [2, 3] as [number, number] } },
    splitNumber: 4,
  };
}
