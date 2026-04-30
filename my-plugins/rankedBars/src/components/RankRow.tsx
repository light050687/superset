import React, { memo, useCallback } from 'react';
import type { RankedRow, UnitMode } from '../types';
import { getIconBody } from '../utils/icons';
import {
  fmtCount,
  fmtDelta,
  fmtPct,
  fmtRub,
  getDeltaStatus,
} from '../utils/formatRussian';
import {
  Bar,
  BarFill,
  BarPrev,
  BarTrack,
  Delta,
  RankBadge,
  RankIcon,
  RankName,
  RankNameL,
  RankNameS,
  RankRowEl,
  Share,
  SparkBox,
  Value,
} from '../styles';
import Sparkline from './Sparkline';

interface RankRowProps {
  row: RankedRow;
  /** 0-based visible index — rendered as `i + 1` in the badge. */
  index: number;
  /**
   * Max metric value across the full dataset, used as the denominator for
   * bar width. Must already match the currently selected unit:
   *   - rub: max of row.value
   *   - pct: max of row.sharePct
   */
  maxValue: number;
  unit: UnitMode;
  invertDeltaGood: boolean;
  decimalsValue: number;
  decimalsDelta: number;
  decimalsShare: number;
  unitSuffixRub: string;
  showSparkline: boolean;
  showGhostPrevBar: boolean;
  filtered: boolean;
  onClick: (row: RankedRow, modKey: boolean) => void;
  onHoverStart?: (row: RankedRow, evt: React.MouseEvent) => void;
  onHoverMove?: (evt: React.MouseEvent) => void;
  onHoverEnd?: () => void;
}

function isModifiedClick(evt: React.MouseEvent | React.KeyboardEvent): boolean {
  return evt.ctrlKey || evt.metaKey;
}

/**
 * One rank row — icon + rank badge, name/sub, bar (+ ghost), sparkline,
 * main value, delta (± p.p.), share %.
 *
 * Events:
 *  - click (normal)    → cross-filter
 *  - click + Ctrl/Cmd  → drill-down modal
 *  - Enter / Space     → cross-filter
 *  - Ctrl + Enter      → drill-down
 *  - mouseenter/leave  → tooltip
 */
const RankRow: React.FC<RankRowProps> = ({
  row,
  index,
  maxValue,
  unit,
  invertDeltaGood,
  decimalsValue,
  decimalsDelta,
  decimalsShare,
  unitSuffixRub,
  showSparkline,
  showGhostPrevBar,
  filtered,
  onClick,
  onHoverStart,
  onHoverMove,
  onHoverEnd,
}) => {
  const handleClick = useCallback(
    (evt: React.MouseEvent) => {
      onClick(row, isModifiedClick(evt));
    },
    [row, onClick],
  );

  const handleKeyDown = useCallback(
    (evt: React.KeyboardEvent) => {
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        onClick(row, isModifiedClick(evt));
      }
    },
    [row, onClick],
  );

  const handleEnter = useCallback(
    (evt: React.MouseEvent) => {
      onHoverStart?.(row, evt);
    },
    [row, onHoverStart],
  );

  // ── Derived values ─────────────────────────────────────────────────────
  const colorVar = row.colorToken.startsWith('#')
    ? row.colorToken
    : `var(${row.colorToken})`;
  const iconBgVar = row.colorToken.startsWith('#')
    ? row.colorToken
    : `color-mix(in srgb, var(${row.colorToken}) 18%, transparent)`;

  // Bar fill: share of the visible maximum in the selected unit.
  const currentValue = unit === 'rub' ? row.value : row.sharePct;
  const barPct = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;

  // Ghost bar (previous-period reference): uses the same scale as the fill bar
  // so the two can be compared visually.
  //   - rub mode: draw valuePrev against the same `maxValue` (which is current-period max).
  //     This shows absolute movement rather than cross-period normalization.
  //   - pct mode: draw sharePrevPct against the same `maxValue` (which is current-period
  //     sharePct max). This shows how the share shifted between periods.
  const prevForBar =
    row.valuePrev == null
      ? null
      : unit === 'rub'
        ? row.valuePrev
        : row.sharePrevPct;
  const prevPct =
    prevForBar != null && maxValue > 0 ? (prevForBar / maxValue) * 100 : 0;

  const deltaStatus = getDeltaStatus(row.deltaPP, invertDeltaGood);

  const valueParts =
    unit === 'rub'
      ? fmtRub(row.value, decimalsValue, unitSuffixRub)
      : fmtPct(row.sharePct, decimalsValue);

  const deltaArrow =
    row.deltaPP > 0 ? (
      <svg viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
        <path d="M4 1 L7 6 L1 6 Z" />
      </svg>
    ) : row.deltaPP < 0 ? (
      <svg viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
        <path d="M4 7 L7 2 L1 2 Z" />
      </svg>
    ) : null;

  const ariaLabel = `${index + 1}. ${row.name}. ${valueParts.number}${valueParts.unit}. Доля ${fmtCount(row.sharePct)} процентов. Дельта ${fmtDelta(row.deltaPP, decimalsDelta)}.`;

  return (
    <RankRowEl
      role="listitem"
      tabIndex={0}
      aria-label={ariaLabel}
      data-id={row.id}
      data-filtered={filtered ? 'true' : 'false'}
      $catColor={colorVar}
      $catBg={iconBgVar}
      $filtered={filtered}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleEnter}
      onMouseMove={onHoverMove}
      onMouseLeave={onHoverEnd}
    >
      <RankIcon>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {getIconBody(row.iconName)}
        </svg>
        <RankBadge aria-hidden="true">{index + 1}</RankBadge>
      </RankIcon>

      <RankName>
        <RankNameL>{row.name}</RankNameL>
        {row.sub && <RankNameS>{row.sub}</RankNameS>}
      </RankName>

      <Bar className="col-bar">
        <BarTrack>
          {showGhostPrevBar && prevForBar != null && (
            <BarPrev $widthPct={prevPct} aria-hidden="true" />
          )}
          <BarFill $widthPct={barPct} aria-hidden="true" />
        </BarTrack>
      </Bar>

      <SparkBox className="col-spark">
        {showSparkline && row.spark.length >= 2 && (
          <Sparkline data={row.spark} color={colorVar} />
        )}
      </SparkBox>

      <Value>
        {valueParts.number}
        <span className="u">{valueParts.unit}</span>
      </Value>

      <Delta $status={deltaStatus} className="col-delta">
        {deltaArrow}
        <span>{fmtDelta(row.deltaPP, decimalsDelta)}</span>
      </Delta>

      <Share>
        {fmtCount(Number(row.sharePct.toFixed(decimalsShare)))}
        <span className="u"> %</span>
      </Share>
    </RankRowEl>
  );
};

export default memo(RankRow);
