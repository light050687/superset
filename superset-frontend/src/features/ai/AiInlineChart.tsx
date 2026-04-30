/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * AiInlineChart — inline ECharts визуализация для ответов ai-analytics.
 *
 * Эвристика выбора типа:
 *   - 1 dim + 1 measure ≤ 6 строк    → pie
 *   - 1 dim + 1 measure ≤ 12 строк   → bar (vertical)
 *   - 1 dim + 1 measure > 12 строк   → bar (horizontal, top-15)
 *   - timeDim + 1 measure            → line
 *
 * Если данные не подходят под ни один шаблон — возвращаем null
 * (родитель должен сам решать что показывать, обычно — таблицу).
 */
import { styled } from '@superset-ui/core';
import ReactECharts from 'echarts-for-react';
import { type FC, useEffect, useMemo, useState } from 'react';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';

/**
 * Читает CSS-переменные DS 2.0 для использования в ECharts options
 * (которые не CSS, а runtime JS). Реактивно ре-чейн после смены темы
 * через MutationObserver на data-theme attribute.
 */
function useDs2EChartsColors(): {
  ink: string;
  g500: string;
  g600: string;
  cSky: string;
  cSkyAlpha8: string;
} {
  const read = () => {
    if (typeof document === 'undefined') {
      return { ink: '#0A0A0A', g500: '#737373', g600: '#555555', cSky: '#3B8BD9', cSkyAlpha8: 'rgba(59, 139, 217, 0.08)' };
    }
    const cs = getComputedStyle(document.documentElement);
    const get = (name: string, fallback: string) =>
      (cs.getPropertyValue(name).trim() || fallback) as string;
    return {
      ink: get('--ink', '#0A0A0A'),
      g500: get('--g500', '#737373'),
      g600: get('--g600', '#555555'),
      cSky: get('--c-sky', '#3B8BD9'),
      cSkyAlpha8: 'rgba(59, 139, 217, 0.08)',
    };
  };
  const [colors, setColors] = useState(read);
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const obs = new MutationObserver(() => setColors(read()));
    obs.observe(document.documentElement, { attributes: true });
    return () => obs.disconnect();
  }, []);
  return colors;
}

interface AiInlineChartProps {
  /** Cube.dev query (или подобный) — нужен для определения timeDim/dim/measure. */
  cubeQuery?: unknown;
  /** Сырые данные от Cube/SQL. Каждая строка — объект с полями cube'ов. */
  rawData: Array<Record<string, unknown>>;
}

const Wrap = styled.div`
  margin: ${DS2_SPACE.s3}px 0;
  border: 1px solid ${DS2_VARS.g200};
  border-radius: ${DS2_RADIUS.card}px;
  padding: ${DS2_SPACE.s3}px;
  background: ${DS2_VARS.s};
`;

const ChartHeader = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${DS2_VARS.g600};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: ${DS2_SPACE.s2}px;
  font-family: ${DS2_VARS.fontSans};
`;

/** Извлекает dimension/measure/timeDimension keys из cubeQuery, fallback на keys данных. */
function classifyColumns(
  cubeQuery: unknown,
  data: Array<Record<string, unknown>>,
): { dimensions: string[]; measures: string[]; timeDimension: string | null } {
  const q = (cubeQuery ?? {}) as Record<string, unknown>;
  const dims: string[] = Array.isArray(q.dimensions) ? (q.dimensions as string[]) : [];
  const meas: string[] = Array.isArray(q.measures) ? (q.measures as string[]) : [];
  const timeDimsRaw = Array.isArray(q.timeDimensions)
    ? (q.timeDimensions as Array<Record<string, unknown>>)
    : [];
  const timeDim =
    timeDimsRaw.length > 0 && typeof timeDimsRaw[0]?.dimension === 'string'
      ? (timeDimsRaw[0].dimension as string)
      : null;

  // Если cubeQuery пустой — fallback на keys первой строки.
  if (dims.length === 0 && meas.length === 0 && data.length > 0) {
    const keys = Object.keys(data[0]);
    return {
      dimensions: keys.filter(k => typeof data[0][k] === 'string'),
      measures: keys.filter(k => typeof data[0][k] === 'number' || /^\-?\d/.test(String(data[0][k] ?? ''))),
      timeDimension: null,
    };
  }
  return { dimensions: dims, measures: meas, timeDimension: timeDim };
}

/** Убирает префикс `cubeName.` для читабельных подписей. */
function prettify(col: string): string {
  return col.includes('.') ? col.split('.').slice(1).join('.') : col;
}

/** Берёт numeric значение с поддержкой строковых чисел из Cube.dev. */
function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export const AiInlineChart: FC<AiInlineChartProps> = ({ cubeQuery, rawData }) => {
  const colors = useDs2EChartsColors();

  const option = useMemo(() => {
    if (!Array.isArray(rawData) || rawData.length === 0) return null;
    const { dimensions, measures, timeDimension } = classifyColumns(cubeQuery, rawData);
    if (measures.length === 0) return null;

    const measure = measures[0];
    const measureLabel = prettify(measure);
    const baseGrid = { left: 12, right: 16, top: 24, bottom: 32, containLabel: true };
    const baseTextStyle = {
      fontFamily: "'Manrope', 'Inter', sans-serif",
      fontSize: 11,
      color: colors.g600,
    };

    // 1) Time-series → line.
    if (timeDimension && rawData.length >= 2) {
      const xs = rawData.map(r => String(r[timeDimension] ?? ''));
      const ys = rawData.map(r => toNum(r[measure]));
      return {
        grid: baseGrid,
        textStyle: baseTextStyle,
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: xs, axisLabel: { fontSize: 10 } },
        yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
        series: [
          {
            type: 'line',
            name: measureLabel,
            data: ys,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { width: 2, color: colors.cSky },
            itemStyle: { color: colors.cSky },
            areaStyle: {
              color: colors.cSkyAlpha8,
            },
          },
        ],
      };
    }

    if (dimensions.length === 0) return null;
    const dim = dimensions[0];
    const xs = rawData.map(r => String(r[dim] ?? ''));
    const ys = rawData.map(r => toNum(r[measure]));

    // 2) Pie — мало строк.
    if (rawData.length <= 6) {
      return {
        textStyle: baseTextStyle,
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [
          {
            type: 'pie',
            radius: ['38%', '68%'],
            avoidLabelOverlap: true,
            label: { fontSize: 11, color: colors.ink },
            data: rawData.map(r => ({
              name: String(r[dim] ?? ''),
              value: toNum(r[measure]),
            })),
          },
        ],
      };
    }

    // 3) Bar vertical — средний объём.
    if (rawData.length <= 12) {
      return {
        grid: baseGrid,
        textStyle: baseTextStyle,
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: xs,
          axisLabel: { fontSize: 10, rotate: 30, overflow: 'truncate', width: 100 },
        },
        yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
        series: [
          {
            type: 'bar',
            name: measureLabel,
            data: ys,
            itemStyle: { color: colors.cSky, borderRadius: [4, 4, 0, 0] },
          },
        ],
      };
    }

    // 4) Bar horizontal — top-15.
    const top = rawData
      .slice()
      .sort((a, b) => toNum(b[measure]) - toNum(a[measure]))
      .slice(0, 15);
    const topXs = top.map(r => String(r[dim] ?? '')).reverse();
    const topYs = top.map(r => toNum(r[measure])).reverse();
    return {
      grid: { ...baseGrid, left: 100, bottom: 24 },
      textStyle: baseTextStyle,
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      yAxis: {
        type: 'category',
        data: topXs,
        axisLabel: { fontSize: 10, overflow: 'truncate', width: 90 },
      },
      series: [
        {
          type: 'bar',
          name: measureLabel,
          data: topYs,
          itemStyle: { color: colors.cSky, borderRadius: [0, 4, 4, 0] },
        },
      ],
    };
  }, [cubeQuery, rawData, colors]);

  if (!option) return null;

  return (
    <Wrap>
      <ChartHeader>График</ChartHeader>
      <ReactECharts
        option={option}
        style={{ height: 280, width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </Wrap>
  );
};
