import { useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { t } from '@superset-ui/core';
import { ModalOverlay } from './styles';
import type { ComparisonMode, MetricMode, Store } from './types';
import { computeTempo, tempoDirection } from './utils/computeTempo';
import {
  fmtByMetric,
  fmtSignedPct,
  fmtTempoText,
} from './utils/formatRussian';

/** Пропс-палитра из VelocityDiverging.tsx — только нужные поля. */
interface DetailPalette {
  up: string;
  dn: string;
  g50: string;
  g100: string;
  g200: string;
  g500: string;
  g600: string;
  g700: string;
  s: string;
  ink: string;
  fontText: string;
  fontMono: string;
}

interface DetailModalProps {
  store: Store;
  metric: MetricMode;
  /** Текущий режим сравнения — для подписи «Сравнение с …» в шапке. */
  comparisonMode: ComparisonMode;
  theme: 'light' | 'dark';
  palette: DetailPalette;
  onClose: () => void;
}

/** Человекочитаемая подпись режима сравнения. */
function comparisonModeLabel(mode: ComparisonMode): string {
  switch (mode) {
    case 'prev_period':
      return 'предыдущий период';
    case 'prev_week':
      return 'прошлая неделя';
    case 'prev_month':
      return 'прошлый месяц';
    case 'prev_quarter':
      return 'прошлый квартал';
    case 'prev_year':
      return 'прошлый год';
    case 'custom':
      return 'вручную выбранный период';
    default:
      return 'предыдущий период';
  }
}

/**
 * Тренд по main-периоду — на ECharts.
 *
 * Длина по х-оси = длина массива trend (определяется backend'ом).
 * Лейблы по х-оси берутся из trendLabels (если есть) или Н1..НN.
 * Animation: 700ms cubicOut (синхронизация с card-mount cascade DS 2.1).
 * Цвет: tempo > 1.1 → dn (рост потерь), < 0.9 → up (снижение), else g600.
 */
function buildTrendOption(
  data: number[],
  labels: string[],
  tempo: number,
  metric: MetricMode,
  palette: DetailPalette,
): Record<string, unknown> {
  const lineColor =
    tempo > 1.1 ? palette.dn : tempo < 0.9 ? palette.up : palette.g600;

  const xLabels = labels.length === data.length
    ? labels
    : data.map((_, i) => (i === data.length - 1 ? t('сейчас') : `Н${i + 1}`));

  const fmtVal = (v: number): string => fmtByMetric(v, metric);

  return {
    animation: true,
    /* DS canonical: ECharts series animation 700ms cubicOut — синхронизировано
       с card-mount cascade. */
    animationDuration: 700,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 0,
    animationEasingUpdate: 'linear',
    grid: { left: 10, right: 12, top: 12, bottom: 26, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.s,
      borderColor: 'rgba(128,128,128,0.25)',
      borderWidth: 1,
      padding: [8, 12, 8, 12],
      extraCssText:
        'pointer-events:none;border-radius:6px;border:1px solid #d4d8de;max-width:240px',
      textStyle: {
        color: palette.ink,
        fontFamily: palette.fontText,
        fontSize: 13,
      },
      axisPointer: {
        type: 'line',
        lineStyle: { color: palette.g200, width: 1, type: [2, 3] as number[] },
        z: 0,
      },
      formatter: (params: unknown): string => {
        const arr = Array.isArray(params) ? params : [params];
        const p = arr[0] as { dataIndex?: number; value?: number; data?: number };
        const idx = p?.dataIndex ?? 0;
        const v = typeof p?.value === 'number' ? p.value : (p?.data as number);
        const prevV = idx > 0 ? data[idx - 1] : null;
        const deltaPctRaw =
          prevV != null && prevV !== 0 ? ((v - prevV) / prevV) * 100 : 0;
        const deltaPct =
          prevV != null && prevV !== 0 ? fmtSignedPct(deltaPctRaw) : '—';
        const weekLabel = xLabels[idx] ?? '';
        return (
          `<div style="font-family:${palette.fontMono};line-height:1.5;min-width:120px">` +
          `<div style="color:${palette.g600};text-transform:uppercase;letter-spacing:.06em;font-size:11px;margin-bottom:4px">${weekLabel}</div>` +
          `<div style="color:${palette.g600};font-size:12px">${t('Потери')}</div>` +
          `<div style="color:${palette.ink};font-weight:700;font-size:17px;margin:4px 0">${fmtVal(v)}</div>` +
          `<div style="color:${palette.g600};font-size:12px">${t('к пред.')}: ${deltaPct}</div>` +
          `</div>`
        );
      },
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLine: { lineStyle: { color: palette.g200 } },
      axisTick: { show: false },
      axisLabel: {
        color: palette.g600,
        fontFamily: palette.fontMono,
        fontSize: 11,
        interval: data.length > 12 ? 'auto' : 1,
      },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: palette.g100, type: [2, 3] as number[] } },
      axisLabel: {
        color: palette.g600,
        fontFamily: palette.fontMono,
        fontSize: 11,
        formatter: (v: number): string => fmtVal(v),
      },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data,
        symbol: 'circle',
        symbolSize: 6,
        showAllSymbol: true,
        lineStyle: { color: lineColor, width: 2.2 },
        itemStyle: { color: lineColor, borderColor: palette.g50, borderWidth: 1 },
        emphasis: {
          focus: 'series',
          itemStyle: {
            color: lineColor,
            borderColor: palette.s,
            borderWidth: 2,
            shadowBlur: 6,
            shadowColor: lineColor,
          },
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${lineColor}4D` /* 0.30 alpha */ },
              { offset: 1, color: `${lineColor}05` /* 0.02 alpha */ },
            ],
          },
        },
        z: 2,
      },
    ],
  };
}

const DetailModal: React.FC<DetailModalProps> = ({
  store,
  metric,
  comparisonMode,
  theme,
  palette,
  onClose,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<Element | null>(null);

  const prev = metric === 'rub' ? store.prevValueRub : store.prevValuePct;
  const curr = metric === 'rub' ? store.currValueRub : store.currValuePct;
  const tr = computeTempo(prev, curr);
  const dir = tempoDirection(tr.tempo);
  const color = dir === 'grow' ? palette.dn : dir === 'shrink' ? palette.up : palette.g600;
  const tCls = dir === 'grow' ? 'dn' : dir === 'shrink' ? 'up' : 'wn';

  /* Escape + focus trap (DS 2.0 §10 + CLAUDE.md a11y). */
  useEffect(() => {
    previousFocus.current = document.activeElement;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && overlayRef.current) {
        const focusables = overlayRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      const prevFocus = previousFocus.current;
      if (prevFocus instanceof HTMLElement) prevFocus.focus();
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === overlayRef.current) onClose();
  };

  /* Trend данные — опциональны (backend может не отдать). */
  const trendData =
    (metric === 'rub' ? store.trendRub : store.trendPct) ?? [];
  const trendLabels = store.trendLabels ?? [];
  const hasTrend = trendData.length > 1;

  const fv = (v: number): string => fmtByMetric(v, metric);
  const signed = tr.pctChange > 0 ? '+' : tr.pctChange < 0 ? '−' : '';
  const trendNote = `${fmtTempoText(tr.tempo)} · ${fmtSignedPct(tr.pctChange)}`;

  const option = useMemo(
    () => buildTrendOption(trendData, trendLabels, tr.tempo, metric, palette),
    [trendData, trendLabels, tr.tempo, metric, palette],
  );

  return (
    <ModalOverlay
      ref={overlayRef}
      data-theme={theme}
      role="dialog"
      aria-modal="true"
      aria-label={`${t('Детализация магазина')} ${store.name}`}
      onClick={handleOverlayClick}
    >
      <div className="vd-modal">
        <div className="m-head">
          <div className="m-status" style={{ background: color }} />
          <div className="m-titles">
            <h3 className="m-title">{store.name}</h3>
            <div className="m-sub">
              <span className="m-code">{store.code}</span>
              <span>{store.city}</span>
              <span className="m-dot" aria-hidden="true" />
              <span>{store.formatName}</span>
              <span className="m-dot" aria-hidden="true" />
              <span>
                {t('ТО')} {store.to} {t('млн ₽')}
              </span>
            </div>
          </div>
          <button
            type="button"
            ref={closeBtnRef}
            className="m-close"
            aria-label={t('Закрыть')}
            onClick={onClose}
          >
            <svg
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>
        <div className="m-summary">
          <div className="m-stat">
            <div className="m-stat-l">{t('Было')}</div>
            <div className="m-stat-v">{fv(tr.prev)}</div>
            <div className="m-stat-d">{t('прошлый период')}</div>
          </div>
          <div className="m-stat">
            <div className="m-stat-l">{t('Стало')}</div>
            <div className="m-stat-v">{fv(tr.curr)}</div>
            <div className="m-stat-d">{t('текущий период')}</div>
          </div>
          <div className="m-stat">
            <div className="m-stat-l">{t('Темп')}</div>
            <div className="m-stat-v" style={{ color }}>
              {fmtTempoText(tr.tempo)}
            </div>
            <div className={`m-stat-d ${tCls}`}>{fmtSignedPct(tr.pctChange)}</div>
          </div>
          <div className="m-stat">
            <div className="m-stat-l">{t('Абс. разница')}</div>
            <div className="m-stat-v" style={{ color }}>
              {signed}
              {fv(Math.abs(tr.absDelta))}
            </div>
            <div className="m-stat-d">
              {dir === 'grow'
                ? t('прирост')
                : dir === 'shrink'
                  ? t('снижение')
                  : t('без изменений')}
            </div>
          </div>
        </div>
        {hasTrend ? (
          <div className="m-trend-wrap">
            <div className="m-section-l">
              <span>
                {t('Тренд потерь')} · {trendData.length} {t('точек')}
              </span>
              <span className="right">{trendNote}</span>
            </div>
            <div className="m-trend-card">
              <div className="m-trend-chart">
                <ReactECharts
                  option={option}
                  notMerge
                  style={{ width: '100%', height: '100%' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '16px 12px',
              fontSize: 12,
              color: palette.g600,
              fontFamily: palette.fontText,
              fontStyle: 'italic',
            }}
          >
            {t(
              'Тренд недоступен — для графика добавьте колонку «Неделя» ' +
                'в настройках чарта.',
            )}
          </div>
        )}
      </div>
    </ModalOverlay>
  );
};

export default DetailModal;
