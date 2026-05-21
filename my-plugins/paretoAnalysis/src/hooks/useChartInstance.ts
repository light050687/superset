/**
 * Управляет жизненным циклом ECharts-инстанса: init / resize / dispose.
 * Возвращает ref на div-контейнер и функции для привязки option и listeners.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { EChartsType } from 'echarts/core';
import { registerEchartsOnce } from '../echarts/echartsRegistry';
import type { EChartsOption } from '../echarts/buildOption';

export interface UseChartInstanceArgs {
  option: EChartsOption;
  width: number;
  height: number;
  onReady?: (chart: EChartsType) => void;
}

export function useChartInstance({
  option,
  width,
  height,
  onReady,
}: UseChartInstanceArgs) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Init + dispose.
  useEffect(() => {
    if (!containerRef.current) return undefined;
    const echarts = registerEchartsOnce();
    const chart: EChartsType = echarts.init(containerRef.current, undefined, {
      renderer: 'canvas',
    });
    chartRef.current = chart;

    if (typeof ResizeObserver !== 'undefined') {
      observerRef.current = new ResizeObserver(() => {
        chart.resize();
      });
      observerRef.current.observe(containerRef.current);
    }

    /* Resilience: Chrome выгружает canvas content при долгом offscreen
       или memory pressure. При возврате в viewport / tab visible — force
       resize + setOption чтобы canvas перерисовался. */
    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      intersectionObserver = new IntersectionObserver(
        entries => {
          if (entries.some(e => e.isIntersecting)) {
            chartRef.current?.resize();
          }
        },
        { threshold: 0.01 },
      );
      intersectionObserver.observe(containerRef.current);
    }
    const onVisibility = (): void => {
      if (!document.hidden) chartRef.current?.resize();
    };
    document.addEventListener('visibilitychange', onVisibility);

    onReady?.(chart);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      intersectionObserver?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Реактивное обновление option.
  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  // Ресайз при смене width/height props от Superset.
  useEffect(() => {
    chartRef.current?.resize();
  }, [width, height]);

  const getChart = useCallback((): EChartsType | null => chartRef.current, []);

  return { containerRef, getChart };
}

export type { EChartsType };
