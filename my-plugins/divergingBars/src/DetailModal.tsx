import { useEffect, useRef } from 'react';
import { t } from '@superset-ui/core';
import { ModalOverlay } from './styles';
import type { Horizon, MetricMode, Store } from './types';
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
  g200: string;
  g50: string;
  g500: string;
  g600: string;
  fontMono: string;
}

interface DetailModalProps {
  store: Store;
  metric: MetricMode;
  horizon: Horizon;
  theme: 'light' | 'dark';
  palette: DetailPalette;
  onClose: () => void;
}

/**
 * Большой спарклайн с плавной кривой Безье (порт buildBigSpark).
 * Принимает цвета через palette — нет вызовов getComputedStyle.
 */
const BigSpark: React.FC<{
  data: number[];
  tempo: number;
  palette: DetailPalette;
}> = ({ data, tempo, palette }) => {
  const w = 860;
  const h = 160;
  const padL = 12;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  if (!data.length) return <svg viewBox={`0 0 ${w} ${h}`} />;
  const min = Math.min(...data) * 0.88;
  const max = Math.max(...data) * 1.1;
  const range = max - min || 1;
  const sx = (i: number): number =>
    padL + (i / (data.length - 1)) * (w - padL - padR);
  const sy = (v: number): number =>
    h - padB - ((v - min) / range) * (h - padT - padB);
  const pts = data.map((v, i) => ({ x: sx(i), y: sy(v), v }));
  let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  const areaPath = `${path} L${pts[pts.length - 1].x.toFixed(1)} ${(h - padB).toFixed(1)} L${pts[0].x.toFixed(1)} ${(h - padB).toFixed(1)} Z`;

  const color =
    tempo > 1.1 ? palette.dn : tempo < 0.9 ? palette.up : palette.g600;
  const gradId = `vd-big-spark-grad-${tempo.toFixed(3).replace(/\./g, '-')}`;

  const labels: { x: number; label: string }[] = [];
  for (let i = 0; i < 12; i += 2) {
    labels.push({ x: sx(i), label: i === 11 ? t('сейчас') : `Н${i + 1}` });
  }

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      overflow="visible"
      role="img"
      aria-label={t('Тренд потерь за 12 недель')}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <line
        x1={padL}
        y1={h - padB}
        x2={w - padR}
        y2={h - padB}
        stroke={palette.g200}
        strokeWidth="1"
      />
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x.toFixed(1)}
          cy={p.y.toFixed(1)}
          r={i === pts.length - 1 ? 3.5 : 2}
          fill={color}
          stroke={palette.g50}
          strokeWidth={i === pts.length - 1 ? 1.5 : 1}
        />
      ))}
      {labels.map(l => (
        <text
          key={l.label}
          x={l.x}
          y={h - 8}
          fontFamily={palette.fontMono}
          fontSize="11"
          fill={palette.g600}
          textAnchor="middle"
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
};

const DetailModal: React.FC<DetailModalProps> = ({
  store,
  metric,
  horizon,
  theme,
  palette,
  onClose,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<Element | null>(null);

  const tr = computeTempo(store, horizon, metric);
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
      const prev = previousFocus.current;
      if (prev instanceof HTMLElement) prev.focus();
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === overlayRef.current) onClose();
  };

  const weeks = metric === 'rub' ? store.weeksRub : store.weeksPct;
  const fv = (v: number): string => fmtByMetric(v, metric);
  const signed = tr.pctChange > 0 ? '+' : tr.pctChange < 0 ? '\u2212' : '';
  const trendNote = `${fmtTempoText(tr.tempo)} · ${fmtSignedPct(tr.pctChange)}`;

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
        <div className="m-trend-wrap">
          <div className="m-section-l">
            <span>{t('Тренд потерь · 12 недель')}</span>
            <span className="right">{trendNote}</span>
          </div>
          <div className="m-trend-card">
            <BigSpark data={weeks} tempo={tr.tempo} palette={palette} />
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default DetailModal;
