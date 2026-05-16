import React from 'react';
import styled from '@emotion/styled';
import type { RankedRow } from '../types';
import { getIconBody } from '../utils/icons';
import {
  fmtCount,
  fmtDelta,
  fmtRub,
  getDeltaStatus,
} from '../utils/formatRussian';

const TTIcon = styled.div<{ $bg: string }>`
  width: 24px;
  height: 24px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $bg }) => $bg};
`;

const TTFootSep = styled.span`
  color: var(--g400);
`;

interface TooltipConfig {
  invertDeltaGood: boolean;
  decimalsValue: number;
  decimalsDelta: number;
  decimalsShare: number;
  unitSuffixRub: string;
}

/**
 * Build tooltip body for a row — 4 rows of stats + trend indicator + footer hint.
 * Runs for hover preview only; DetailModal has its own layout.
 */
export function buildTooltipContent(
  row: RankedRow,
  cfg: TooltipConfig,
): React.ReactNode {
  const colorVar = row.colorToken.startsWith('#')
    ? row.colorToken
    : `var(${row.colorToken})`;
  const iconBg = row.colorToken.startsWith('#')
    ? row.colorToken
    : `color-mix(in srgb, var(${row.colorToken}) 18%, transparent)`;

  const valueParts = fmtRub(row.value, cfg.decimalsValue, cfg.unitSuffixRub);
  const deltaStatus = getDeltaStatus(row.deltaPP, cfg.invertDeltaGood);
  const deltaText = fmtDelta(row.deltaPP, cfg.decimalsDelta);
  const shareText = fmtCount(Number(row.sharePct.toFixed(cfg.decimalsShare)));

  const trendDirection =
    row.spark.length >= 2
      ? row.spark[row.spark.length - 1] > row.spark[0]
        ? 'up'
        : row.spark[row.spark.length - 1] < row.spark[0]
          ? 'down'
          : 'flat'
      : 'flat';
  const trendIcon =
    trendDirection === 'up' ? '↗' : trendDirection === 'down' ? '↘' : '→';
  const trendText =
    trendDirection === 'up'
      ? 'растёт'
      : trendDirection === 'down'
        ? 'снижается'
        : 'стабильно';
  const trendCls =
    trendDirection === 'up'
      ? cfg.invertDeltaGood
        ? 'dn'
        : 'up'
      : trendDirection === 'down'
        ? cfg.invertDeltaGood
          ? 'up'
          : 'dn'
        : 'wn';

  return (
    <>
      <div className="tt-head">
        <TTIcon className="tt-icon" $bg={iconBg}>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke={colorVar}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {getIconBody(row.iconName)}
          </svg>
        </TTIcon>
        <div className="tt-titles">
          <div className="tt-name">{row.name}</div>
          {row.sub && <div className="tt-sub">{row.sub}</div>}
        </div>
      </div>
      <div className="tt-rows">
        <div className="tt-row">
          <span className="tt-l">Сумма</span>
          <span className="tt-v">
            {valueParts.number}
            {valueParts.unit}
          </span>
        </div>
        <div className="tt-row">
          <span className="tt-l">Δ к ПП</span>
          <span className={`tt-v ${deltaStatus}`}>{deltaText}</span>
        </div>
        <div className="tt-row">
          <span className="tt-l">Доля</span>
          <span className="tt-v">{shareText} %</span>
        </div>
        {row.spark.length >= 2 && (
          <div className="tt-row">
            <span className="tt-l">Тренд</span>
            <span className={`tt-v ${trendCls}`}>
              {trendIcon} {trendText}
            </span>
          </div>
        )}
      </div>
      <div className="tt-foot">
        <span>
          <kbd>Click</kbd> фильтр
        </span>
        <TTFootSep aria-hidden="true">·</TTFootSep>
        <span>
          <kbd>Ctrl</kbd>+<kbd>Click</kbd> детализация
        </span>
      </div>
    </>
  );
}
