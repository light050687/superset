/**
 * Обёртка вокруг ECharts-инстанса. Перепроброс hover/click-событий наверх,
 * чтобы родитель рисовал свой DOM tooltip и принимал решения о drill/cross-filter.
 */

import { useEffect, useCallback } from 'react';
import type { EChartsType } from 'echarts/core';
import { ChartCanvasDiv } from '../styles/styled';
import { useChartInstance } from '../hooks/useChartInstance';
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

/**
 * Shape события мыши от ECharts — публичный API не экспортирует тип,
 * поэтому описываем локально то, что реально используется.
 */
interface EChartsMouseEvent {
  dataIndex?: number;
  data?: { _item?: ComputedParetoItem };
  event?: {
    event?: MouseEvent;
    offsetX?: number;
    offsetY?: number;
  };
}

interface ZrMouseEvent {
  event?: MouseEvent;
  target?: unknown;
}

// ECharts типизирует обработчики как (params: unknown) => void,
// но фактически передаёт ECElementEvent (и zrender — CallbackDataParams).
// Делаем тип-гард, чтобы внутри хендлера работать с конкретной формой.
type EChartsEventHandler = (params: EChartsMouseEvent) => void;
type ZrEventHandler = (event: ZrMouseEvent) => void;

export default function ChartCanvas({
  option,
  width,
  height,
  onHoverItem,
  onItemClick,
  onBackgroundClick,
  onReady,
}: ChartCanvasProps): JSX.Element {
  const handleReady = useCallback(
    (chart: EChartsType) => {
      onReady?.(chart);
    },
    [onReady],
  );

  const { containerRef, getChart } = useChartInstance({
    option,
    width,
    height,
    onReady: handleReady,
  });

  useEffect(() => {
    const chart = getChart();
    if (!chart) return undefined;

    const handleMouseOver: EChartsEventHandler = params => {
      const item = params.data?._item;
      if (!item) return;
      const ev = params.event?.event;
      const x = ev?.offsetX ?? params.event?.offsetX ?? 0;
      const y = ev?.offsetY ?? params.event?.offsetY ?? 0;
      onHoverItem?.({ item, x, y });
    };
    const handleMouseOut: EChartsEventHandler = () => onHoverItem?.(null);

    const handleClick: EChartsEventHandler = params => {
      const item = params.data?._item;
      if (!item) return;
      const native = params.event?.event;
      const ctrlKey = Boolean(native?.ctrlKey || native?.metaKey);
      onItemClick?.(item, ctrlKey);
    };

    // ECharts API-тип для on-handlers — `(params: unknown) => void`; наш
    // локальный EChartsMouseEvent описывает реально передаваемое поле набором
    // опциональных свойств, поэтому каст безопасен.
    chart.on('mouseover', handleMouseOver as (p: unknown) => void);
    chart.on('mouseout', handleMouseOut as (p: unknown) => void);
    chart.on('click', handleClick as (p: unknown) => void);

    const zr = chart.getZr();
    const zrClickHandler: ZrEventHandler = evt => {
      if (!evt.target) onBackgroundClick?.();
    };
    zr.on('click', zrClickHandler as (p: unknown) => void);

    return () => {
      chart.off('mouseover', handleMouseOver as (p: unknown) => void);
      chart.off('mouseout', handleMouseOut as (p: unknown) => void);
      chart.off('click', handleClick as (p: unknown) => void);
      zr.off('click', zrClickHandler as (p: unknown) => void);
    };
  }, [getChart, onHoverItem, onItemClick, onBackgroundClick]);

  return <ChartCanvasDiv ref={containerRef} />;
}
