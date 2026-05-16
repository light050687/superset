import * as React from 'react';
import {
  BArrow,
  BMain,
  BMeta,
  BMetaCell,
  BMetaL,
  BMetaRow,
  BMetaV,
  BName,
  BNameWrap,
  BRow,
  BSpark,
  BTop,
  BVal,
} from '../styles';
import BulletBar from './BulletBar';
import Sparkline from './Sparkline';
import type { Direction, FormatRow, Formatters } from '../types';
import { formatStoresCount } from '../utils/format';

export interface BulletRowHandlers {
  onClick: (row: FormatRow, ctrlKey: boolean) => void;
  onHover: (row: FormatRow | null, x: number, y: number) => void;
}

interface BulletRowProps {
  row: FormatRow;
  scaleMax: number;
  direction: Direction;
  filtered: boolean;
  dimmed: boolean;
  statusColor: string;
  formatters: Formatters;
  handlers: BulletRowHandlers;
}

function deltaTone(
  delta: number | null,
  direction: Direction,
  tolerance = 0.01,
): 'up' | 'dn' | 'wn' | 'default' {
  if (delta == null) return 'default';
  if (Math.abs(delta) <= tolerance) return 'wn';
  if (direction === 'less_is_better') return delta > 0 ? 'dn' : 'up';
  return delta > 0 ? 'up' : 'dn';
}

// ── SVG-иконки ──

// Треугольник для дельты к плану: острием в направлении знака (ref:803-807).
const ArrowTriangle: React.FC<{ sign: 'up' | 'down' }> = ({ sign }) => (
  <svg
    viewBox="0 0 8 8"
    width={9}
    height={9}
    fill="currentColor"
    aria-hidden="true"
  >
    {sign === 'up' ? (
      <path d="M4 1 L7 6 L1 6 Z" />
    ) : (
      <path d="M4 7 L7 2 L1 2 Z" />
    )}
  </svg>
);

// Иконка домика перед количеством магазинов (ref:815-818).
const StoresIcon: React.FC = () => (
  <svg
    viewBox="0 0 12 12"
    width={9}
    height={9}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 5 L2 10 L10 10 L10 5" />
    <path d="M1 5 L6 1 L11 5" />
  </svg>
);

const BulletRow: React.FC<BulletRowProps> = ({
  row,
  scaleMax,
  direction,
  filtered,
  dimmed,
  statusColor,
  formatters,
  handlers,
}) => {
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handlers.onClick(row, e.ctrlKey || e.metaKey);
    },
    [handlers, row],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handlers.onClick(row, e.ctrlKey || e.metaKey);
      }
    },
    [handlers, row],
  );

  const handleMouseEnter = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handlers.onHover(row, e.clientX, e.clientY);
    },
    [handlers, row],
  );
  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handlers.onHover(row, e.clientX, e.clientY);
    },
    [handlers, row],
  );
  const handleMouseLeave = React.useCallback(() => {
    handlers.onHover(null, 0, 0);
  }, [handlers]);

  const deltaPlanStr =
    row.deltaPlan != null ? formatters.deltaPP(row.deltaPlan) : '—';
  const deltaPyStr = row.deltaPy != null ? formatters.deltaPP(row.deltaPy) : '—';

  // Стрелка направления по знаку дельты (для less_is_better: + рост = плохо ⇒ ▲).
  const arrowSign: 'up' | 'down' | null =
    row.deltaPlan == null || Math.abs(row.deltaPlan) <= 0.01
      ? null
      : row.deltaPlan > 0
      ? 'up'
      : 'down';

  return (
    <BRow
      role="listitem"
      tabIndex={0}
      filtered={filtered}
      dimmed={dimmed}
      statusColor={statusColor}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label={`${row.name}: факт ${formatters.value(row.rate)}${
        row.plan != null ? `, план ${formatters.value(row.plan)}` : ''
      }`}
    >
      <BTop>
        <BNameWrap>
          <BName>{row.name}</BName>
          {row.stores != null ? (
            <BMeta>
              <StoresIcon />
              {formatStoresCount(row.stores)}
            </BMeta>
          ) : null}
        </BNameWrap>
        <BMain>
          <BVal>{formatters.value(row.rate)}</BVal>
          {arrowSign != null ? (
            <BArrow>
              <ArrowTriangle sign={arrowSign} />
              <span>{deltaPlanStr}</span>
            </BArrow>
          ) : null}
        </BMain>
      </BTop>
      <BulletBar
        value={row.rate}
        target={row.plan}
        scaleMax={scaleMax}
        direction={direction}
      />
      <BMetaRow>
        <BMetaCell>
          <BMetaL>План</BMetaL>
          <BMetaV tone="default">
            {row.plan != null ? formatters.value(row.plan) : '—'}
          </BMetaV>
        </BMetaCell>
        <BMetaCell>
          <BMetaL>Прошл. год</BMetaL>
          <BMetaV tone="default">
            {row.py != null ? formatters.value(row.py) : '—'}
          </BMetaV>
        </BMetaCell>
        <BMetaCell>
          <BMetaL>Δ к плану</BMetaL>
          <BMetaV tone={deltaTone(row.deltaPlan, direction)}>
            {deltaPlanStr}
          </BMetaV>
        </BMetaCell>
        <BMetaCell>
          <BMetaL>Δ к ПГ</BMetaL>
          <BMetaV tone={deltaTone(row.deltaPy, direction)}>{deltaPyStr}</BMetaV>
        </BMetaCell>
        <BSpark>
          <Sparkline points={row.spark} color={statusColor} width={70} height={18} />
        </BSpark>
      </BMetaRow>
    </BRow>
  );
};

export default React.memo(BulletRow);
