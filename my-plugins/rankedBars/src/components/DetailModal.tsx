import React, { useEffect, useMemo, useState } from 'react';
import type {
  DrillData,
  DrillQueryParams,
  DrillTopRow,
  RankedRow,
} from '../types';
import ModalShell from './ModalShell';
import TrendChart from './TrendChart';
import { getIconBody } from '../utils/icons';
import {
  fmtCount,
  fmtDelta,
  fmtRub,
  getDeltaStatus,
} from '../utils/formatRussian';
import { fetchDrillData } from '../utils/detailApi';
import {
  InlineEmpty,
  InlineError,
  InlineSkeleton,
  ModalHead,
  ModalHeadIcon,
  ModalSection,
  ModalSummaryGrid,
  StatBox,
  TopBarFill,
  TopList,
  TopRow,
  TrendBox,
} from '../styles';

interface DetailModalProps {
  row: RankedRow;
  queryParams: DrillQueryParams;
  unitSuffixRub: string;
  decimalsValue: number;
  decimalsDelta: number;
  invertDeltaGood: boolean;
  isMockMode: boolean;
  themeMode: 'light' | 'dark';
  onClose: () => void;
}

type DrillState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: DrillData };

/** Generate deterministic mock drill data so Design Mode renders a reasonable picture. */
function buildMockDrill(row: RankedRow): DrillData {
  const storesSeed = [
    'Самбери Хабаровск Центр',
    'Самбери Уссурийск №3',
    'Самбери Владивосток Чуркин',
    'Самбери Находка',
    'Самбери Артём',
  ];
  const skusSeed = [
    `${row.name} · товар A`,
    `${row.name} · товар B`,
    `${row.name} · товар C`,
    `${row.name} · товар D`,
    `${row.name} · товар E`,
  ];
  const stores: DrillTopRow[] = storesSeed.map((name, i) => ({
    name,
    value: +(row.value * (0.14 - i * 0.02)).toFixed(2),
  }));
  const skus: DrillTopRow[] = skusSeed.map((name, i) => ({
    name,
    value: +(row.value * (0.1 - i * 0.015)).toFixed(2),
  }));

  const trend: number[] = [];
  const start = row.spark[0] ?? row.value;
  for (let i = 0; i < 4; i++) {
    trend.push(+(start * (0.85 + Math.random() * 0.15)).toFixed(2));
  }
  trend.push(...row.spark);
  return { stores, skus, trend };
}

const DetailModal: React.FC<DetailModalProps> = ({
  row,
  queryParams,
  unitSuffixRub,
  decimalsValue,
  decimalsDelta,
  invertDeltaGood,
  isMockMode,
  themeMode,
  onClose,
}) => {
  const [state, setState] = useState<DrillState>({ status: 'loading' });

  useEffect(() => {
    if (isMockMode) {
      setState({ status: 'success', data: buildMockDrill(row) });
      return undefined;
    }
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchDrillData(queryParams, row.id, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) {
          setState({ status: 'success', data });
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : 'Ошибка загрузки деталей';
        setState({ status: 'error', message });
      });
    return () => controller.abort();
  }, [isMockMode, queryParams, row]);

  const colorVar = row.colorToken.startsWith('#')
    ? row.colorToken
    : `var(${row.colorToken})`;
  const iconBg = row.colorToken.startsWith('#')
    ? row.colorToken
    : `color-mix(in srgb, var(${row.colorToken}) 18%, transparent)`;

  const sumParts = fmtRub(row.value, decimalsValue, unitSuffixRub);
  const deltaStatus = getDeltaStatus(row.deltaPP, invertDeltaGood);
  const sumDeltaPct =
    row.valuePrev && row.valuePrev !== 0
      ? ((row.value - row.valuePrev) / row.valuePrev) * 100
      : 0;
  const sumDeltaCls =
    sumDeltaPct > 0
      ? invertDeltaGood
        ? 'dn'
        : 'up'
      : sumDeltaPct < 0
        ? invertDeltaGood
          ? 'up'
          : 'dn'
        : 'wn';

  const trendDirection = useMemo(() => {
    if (state.status !== 'success') return 'flat';
    const t = state.data.trend;
    if (t.length < 2) return 'flat';
    if (t[t.length - 1] > t[0]) return 'up';
    if (t[t.length - 1] < t[0]) return 'down';
    return 'flat';
  }, [state]);

  return (
    <ModalShell
      open
      onClose={onClose}
      themeMode={themeMode}
      zIndex={1100}
      labelledBy="rb-detail-title"
    >
      <ModalHead>
        <ModalHeadIcon className="m-icon" $bg={iconBg}>
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
        </ModalHeadIcon>
        <div className="m-titles">
          <div className="m-title" id="rb-detail-title">
            {row.name}
          </div>
          {row.sub && <div className="m-sub">{row.sub}</div>}
        </div>
        <button
          type="button"
          className="m-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <svg
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="2" y1="2" x2="12" y2="12" />
            <line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>
      </ModalHead>

      <ModalSummaryGrid>
        <StatBox>
          <div className="l">Сумма</div>
          <div className="v">
            {sumParts.number}
            <span className="u">{sumParts.unit}</span>
          </div>
          {row.valuePrev != null && (
            <div className={`d ${sumDeltaCls}`}>
              {sumDeltaPct > 0 ? '+' : sumDeltaPct < 0 ? '−' : ''}
              {Math.abs(sumDeltaPct).toFixed(1)}% к ПП
            </div>
          )}
        </StatBox>
        <StatBox>
          <div className="l">Доля от итога</div>
          <div className="v">
            {row.sharePct.toFixed(1)}
            <span className="u"> %</span>
          </div>
          <div className={`d ${deltaStatus}`}>
            {fmtDelta(row.deltaPP, decimalsDelta)}
          </div>
        </StatBox>
        <StatBox>
          <div className="l">Топ-магазинов</div>
          <div className="v">
            {state.status === 'success'
              ? fmtCount(state.data.stores.length)
              : '—'}
          </div>
          <div className="d wn">в рейтинге</div>
        </StatBox>
        <StatBox>
          <div className="l">Тренд</div>
          <div className="v">
            {trendDirection === 'up'
              ? '↗'
              : trendDirection === 'down'
                ? '↘'
                : '→'}
          </div>
          <div
            className={`d ${trendDirection === 'up' ? (invertDeltaGood ? 'dn' : 'up') : trendDirection === 'down' ? (invertDeltaGood ? 'up' : 'dn') : 'wn'}`}
          >
            {trendDirection === 'up'
              ? 'растёт'
              : trendDirection === 'down'
                ? 'снижается'
                : 'стабильно'}
          </div>
        </StatBox>
      </ModalSummaryGrid>

      {/* Trend section */}
      <ModalSection>
        <div className="l">Тренд по времени</div>
        <TrendBox>
          <div className="head">
            <span className="l">Сумма по периодам</span>
            <span className="r">
              {state.status === 'success' && state.data.trend.length > 0
                ? `${state.data.trend[state.data.trend.length - 1].toFixed(1)}${sumParts.unit} · посл. период`
                : ''}
            </span>
          </div>
          {state.status === 'loading' && <Skeleton height={90} />}
          {state.status === 'error' && (
            <ErrorLine message={state.message} />
          )}
          {state.status === 'success' &&
            (state.data.trend.length >= 2 ? (
              <TrendChart data={state.data.trend} color={colorVar} />
            ) : (
              <EmptyLine text="Нет данных для тренда" />
            ))}
        </TrendBox>
      </ModalSection>

      {/* Top stores */}
      <ModalSection>
        <div className="l">
          Топ-{queryParams.detailTopN}{' '}
          {queryParams.storeDim ? 'магазинов по сумме' : 'магазинов'}
        </div>
        {renderTopList(state, 'stores', colorVar, sumParts.unit, queryParams.storeDim == null)}
      </ModalSection>

      {/* Top SKUs */}
      <ModalSection>
        <div className="l">
          Топ-{queryParams.detailTopN}{' '}
          {queryParams.skuDim ? 'SKU по сумме' : 'SKU'}
        </div>
        {renderTopList(state, 'skus', colorVar, sumParts.unit, queryParams.skuDim == null)}
      </ModalSection>
    </ModalShell>
  );
};

// ── Small helpers scoped to this module ────────────────────────────────────

const Skeleton: React.FC<{ height: number }> = ({ height }) => (
  <InlineSkeleton $height={height} aria-hidden="true" />
);

const EmptyLine: React.FC<{ text: string }> = ({ text }) => (
  <InlineEmpty>{text}</InlineEmpty>
);

const ErrorLine: React.FC<{ message: string }> = ({ message }) => (
  <InlineError role="alert">{message}</InlineError>
);

function renderTopList(
  state: DrillState,
  kind: 'stores' | 'skus',
  colorVar: string,
  unitSuffix: string,
  disabled: boolean,
): React.ReactNode {
  if (disabled) {
    return (
      <EmptyLine text="Измерение не настроено — задайте в настройках чарта." />
    );
  }
  if (state.status === 'loading') {
    return (
      <TopList>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={32} />
        ))}
      </TopList>
    );
  }
  if (state.status === 'error') {
    return <ErrorLine message={state.message} />;
  }
  const rows = state.data[kind];
  if (rows.length === 0) {
    return <EmptyLine text="Нет данных" />;
  }
  const max = Math.max(...rows.map(r => r.value));
  return (
    <TopList>
      {rows.map((r, i) => (
        <TopRow key={r.name + i} $catColor={colorVar}>
          <div className="rank">{String(i + 1).padStart(2, '0')}</div>
          <div className="name">{r.name}</div>
          <div className="bar">
            <TopBarFill
              className="bar-fill"
              $widthPct={max > 0 ? (r.value / max) * 100 : 0}
              aria-hidden="true"
            />
          </div>
          <div className="val">
            {r.value.toFixed(1)}
            {unitSuffix}
          </div>
        </TopRow>
      ))}
    </TopList>
  );
}

export default DetailModal;
