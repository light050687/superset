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
  /** Список item'ов — нужен для lookup при hover на axisLabel (truncated label
      не несёт ссылку на item, только value=full name). */
  items?: ComputedParetoItem[];
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
  /** xAxis label events (triggerEvent:true) — componentType='xAxis',
      value = полное название категории (formatter рендерит truncated, но
      events идут с raw value). */
  componentType?: string;
  value?: string | number;
  event?: {
    event?: MouseEvent;
    offsetX?: number;
    offsetY?: number;
    clientX?: number;
    clientY?: number;
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
  items,
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
      const ev = params.event?.event;
      // clientX/Y (viewport-relative) — TooltipEl теперь position:fixed,
      // позиционируется напрямую от viewport, обходит overflow:hidden Card.
      const x = ev?.clientX ?? 0;
      const y = ev?.clientY ?? 0;
      // Hover на series data (bar/line) — item напрямую из data._item.
      const seriesItem = params.data?._item;
      if (seriesItem) {
        onHoverItem?.({ item: seriesItem, x, y });
        return;
      }
      // Hover на axisLabel оси X (triggerEvent:true) — lookup item по name.
      // Только при типе xAxis, иначе любое не-bar событие (например splitLine)
      // могло бы случайно показывать tooltip.
      if (params.componentType === 'xAxis' && items) {
        const name = String(params.value ?? '');
        const axisItem = items.find(it => it.name === name);
        if (axisItem) {
          onHoverItem?.({ item: axisItem, x, y });
        }
      }
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
  }, [getChart, items, onHoverItem, onItemClick, onBackgroundClick]);

  return <ChartCanvasDiv ref={containerRef} />;
}
