import React from 'react';
import { TooltipEl } from '../styles/styled';
import { ComputedParetoItem, ThemeTokens } from '../types';
import { zoneColor, zoneLabel, toRgba } from '../utils/zoneColors';
import { formatMetricValue, formatPct1, formatPct2, formatSignedPct1 } from '../utils/paretoFormat';

export interface ChartTooltipProps {
  item: ComputedParetoItem;
  x: number;
  y: number;
  tokens: ThemeTokens;
  metricLabel: string;
  metricUnit: string;
  showPrev: boolean;
}

/**
 * DOM-tooltip поверх ECharts canvas. Позиционируется offsetX/Y внутри
 * родителя с `position:relative`. Не использует порталы, чтобы наследовать
 * overflow/clip карточки и автоматически ехать при scroll дашборда.
 */
export default function ChartTooltip({
  item,
  x,
  y,
  tokens,
  metricLabel,
  metricUnit,
  showPrev,
}: ChartTooltipProps) {
  const zCol = zoneColor(item.zone, tokens);
  const zLab = zoneLabel(item.zone);
  const zBg = toRgba(zCol, 0.18);

  const rankRow =
    showPrev && item.rankPrev != null && item.rankDelta !== 0 ? (
      <div className="tt-row">
        <span>Ранг</span>
        <b className={(item.rankDelta ?? 0) > 0 ? 'dn' : 'up'}>
          #{item.rankPrev} → #{item.rank}
        </b>
      </div>
    ) : (
      <div className="tt-row">
        <span>Ранг</span>
        <b>#{item.rank}</b>
      </div>
    );

  let prevBlock: React.ReactNode = null;
  if (showPrev && item.valuePrev != null) {
    const prev = item.valuePrev;
    const deltaPct =
      prev !== 0 ? ((item.value - prev) / prev) * 100 : null;
    const deltaCls =
      deltaPct == null ? '' : deltaPct > 0.5 ? 'dn' : deltaPct < -0.5 ? 'up' : '';
    prevBlock = (
      <>
        <div className="tt-divider" />
        <div className="tt-row">
          <span>Прошлый период</span>
          <b>{formatMetricValue(prev, metricUnit)}</b>
        </div>
        <div className="tt-row">
          <span>Изменение</span>
          <b className={deltaCls}>{formatSignedPct1(deltaPct)}</b>
        </div>
      </>
    );
  }

  // Смещение от курсора; clamp внутри box будет делать браузер за счёт overflow.
  const style: React.CSSProperties = {
    left: x + 12,
    top: y + 12,
  };

  return (
    <TooltipEl style={style} role="tooltip">
      <div className="tt-title">
        <span className="dot" style={{ background: zCol }} />
        <span>{item.name}</span>
        <span className="zone" style={{ background: zBg, color: zCol }}>
          {zLab}
        </span>
      </div>
      {rankRow}
      <div className="tt-row">
        <span>{metricLabel}</span>
        <b>{formatMetricValue(item.value, metricUnit)}</b>
      </div>
      <div className="tt-row">
        <span>Доля</span>
        <b>{formatPct2(item.share)}</b>
      </div>
      <div className="tt-divider" />
      <div className="tt-row">
        <span>Кумулятивно</span>
        <b>{formatPct1(item.cumPct)}</b>
      </div>
      {prevBlock}
    </TooltipEl>
  );
}
