import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  Tooltip as TooltipBox,
  TtHead,
  TtHeadBody,
  TtL,
  TtName,
  TtRow,
  TtRows,
  TtStatus,
  TtStatusText,
  TtSub,
  TtV,
} from '../styles';
import type { FormatRow, Formatters } from '../types';
import { formatStoresCount } from '../utils/format';

interface TooltipProps {
  row: FormatRow;
  direction: 'less_is_better' | 'more_is_better';
  formatters: Formatters;
  statusColor: string;
  x: number;
  y: number;
  rootEl: HTMLElement | null;
  showDetailHint: boolean;
  /** ink/s/g300 цвета для tooltip — нужны inline т.к. portal вне CSS-vars
      scope CardRoot и cascade переменных не работает. */
  ink: string;
  surface: string;
  border: string;
}

function statusLabel(
  status: FormatRow['status'],
  direction: 'less_is_better' | 'more_is_better',
): string {
  if (status === 'good')
    return direction === 'less_is_better' ? '✓ В норме — лучше плана' : '✓ В норме — выше плана';
  if (status === 'bad')
    return direction === 'less_is_better'
      ? '✕ Хуже плана — требует внимания'
      : '✕ Ниже плана — требует внимания';
  if (status === 'warn') return '~ Около плана — нейтрально';
  return '—';
}

function tone(s: FormatRow['status']): 'up' | 'dn' | 'wn' | 'default' {
  return s === 'good' ? 'up' : s === 'bad' ? 'dn' : s === 'warn' ? 'wn' : 'default';
}

function deltaTone(
  delta: number | null,
  direction: 'less_is_better' | 'more_is_better',
): 'up' | 'dn' | 'wn' | 'default' {
  if (delta == null) return 'default';
  if (Math.abs(delta) <= 0.01) return 'wn';
  if (direction === 'less_is_better') return delta > 0 ? 'dn' : 'up';
  return delta > 0 ? 'up' : 'dn';
}

/** Направление тренда по sparkline (first vs last). */
function computeTrend(
  spark: number[],
  direction: 'less_is_better' | 'more_is_better',
): { icon: '↗' | '↘' | '→'; text: string; tone: 'up' | 'dn' | 'wn' } | null {
  if (!spark || spark.length < 2) return null;
  const first = spark[0];
  const last = spark[spark.length - 1];
  if (first === last) return { icon: '→', text: 'стабильно', tone: 'wn' };

  const rising = last > first;
  // Для less_is_better рост = плохо (dn), падение = хорошо (up).
  const upIsBad = direction === 'less_is_better';
  const trendTone: 'up' | 'dn' = rising
    ? upIsBad ? 'dn' : 'up'
    : upIsBad ? 'up' : 'dn';
  return {
    icon: rising ? '↗' : '↘',
    text: rising ? 'растёт' : 'снижается',
    tone: trendTone,
  };
}

const BulletTooltip: React.FC<TooltipProps> = ({
  row,
  direction,
  formatters,
  statusColor,
  x,
  y,
  rootEl,
  showDetailHint,
  ink,
  surface,
  border,
}) => {
  if (!rootEl) return null;

  // Смещение — вниз-вправо от курсора, с коррекцией у края экрана.
  const OFFSET = 14;
  const W = 280;
  const H = 240;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const left = x + OFFSET + W > vw - 8 ? x - W - OFFSET : x + OFFSET;
  const top = y + OFFSET + H > vh - 8 ? y - H - OFFSET : y + OFFSET;

  const trend = computeTrend(row.spark, direction);

  // % магазинов хуже плана (только если есть storesList в mock-режиме).
  const storesList = row.storesList;
  let badStores: { count: number; total: number; pct: number } | null = null;
  if (storesList && storesList.length > 0) {
    const worse = storesList.filter(s => {
      if (s.plan == null) return false;
      return direction === 'less_is_better' ? s.rate > s.plan : s.rate < s.plan;
    }).length;
    badStores = {
      count: worse,
      total: storesList.length,
      pct: Math.round((worse / storesList.length) * 100),
    };
  }

  const badTone: 'up' | 'dn' | 'wn' = !badStores
    ? 'wn'
    : badStores.pct > 50
    ? 'dn'
    : badStores.pct > 30
    ? 'wn'
    : 'up';

  return createPortal(
    <TooltipBox
      role="tooltip"
      style={{ left, top, background: ink, color: surface, borderColor: border }}
      statusColor={statusColor}
    >
      <TtHead>
        <TtStatus />
        <TtHeadBody>
          <TtName>{row.name}</TtName>
          {row.stores != null ? (
            <TtSub>{formatStoresCount(row.stores)}</TtSub>
          ) : null}
        </TtHeadBody>
      </TtHead>
      <TtRows>
        <TtRow>
          <TtL>Факт</TtL>
          <TtV tone={tone(row.status)}>{formatters.value(row.rate)}</TtV>
        </TtRow>
        {row.plan != null ? (
          <TtRow>
            <TtL>План (цель)</TtL>
            <TtV tone="default">{formatters.value(row.plan)}</TtV>
          </TtRow>
        ) : null}
        {row.py != null ? (
          <TtRow>
            <TtL>Прошлый год</TtL>
            <TtV tone="default">{formatters.value(row.py)}</TtV>
          </TtRow>
        ) : null}
        {row.deltaPlan != null ? (
          <TtRow>
            <TtL>Δ к плану</TtL>
            <TtV tone={deltaTone(row.deltaPlan, direction)}>
              {formatters.deltaPP(row.deltaPlan)}
            </TtV>
          </TtRow>
        ) : null}
        {row.deltaPy != null ? (
          <TtRow>
            <TtL>Δ к ПГ</TtL>
            <TtV tone={deltaTone(row.deltaPy, direction)}>
              {formatters.deltaPP(row.deltaPy)}
            </TtV>
          </TtRow>
        ) : null}
        {trend != null ? (
          <TtRow>
            <TtL>Тренд</TtL>
            <TtV tone={trend.tone}>
              {trend.icon} {trend.text}
            </TtV>
          </TtRow>
        ) : null}
        {badStores != null ? (
          <TtRow>
            <TtL>Хуже плана</TtL>
            <TtV tone={badTone}>
              {badStores.count} из {badStores.total} ({badStores.pct}%)
            </TtV>
          </TtRow>
        ) : null}
      </TtRows>
      <TtStatusText>{statusLabel(row.status, direction)}</TtStatusText>
    </TooltipBox>,
    rootEl,
  );
};

export default BulletTooltip;
