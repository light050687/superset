import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { t } from '@superset-ui/core';
import {
  BarCell,
  KEYFRAMES_CSS,
  ROOT_CLASS,
  SkeletonBlock,
  TooltipRoot,
  VelocityRoot,
} from './styles';
import { DARK_TOKENS, LIGHT_TOKENS } from './themeTokens';
import type {
  DirectionFilter,
  FormatDef,
  Horizon,
  MetricMode,
  Store,
  VelocityDivergingProps,
} from './types';
import { computeTempo, tempoDirection } from './utils/computeTempo';
import {
  fmtByMetric,
  fmtSignedPct,
  fmtTempoText,
  nf0,
  nf1,
  nf2,
  signPrefix,
} from './utils/formatRussian';
import DetailModal from './DetailModal';

/* Инжектируем keyframes один раз на весь документ, как в kpiCard. */
const STYLE_ID = 'velocity-diverging-keyframes';
function ensureKeyframes(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = KEYFRAMES_CSS;
  document.head.appendChild(style);
}

type SortBy = 'tempo' | 'name' | 'absDelta';

interface TooltipState {
  html: React.ReactNode;
  theme: 'light' | 'dark';
  status: string;
  x: number;
  y: number;
}

/**
 * Палитра DS 2.0 — ветка light/dark. Используем напрямую токены из
 * themeTokens.ts, а не читаем CSS-переменные через getComputedStyle,
 * чтобы избежать 2000 вызовов getComputedStyle на рендер (400 строк × 5 цветов).
 */
interface Palette {
  up: string;
  dn: string;
  wn: string;
  g50: string;
  g200: string;
  g300: string;
  g400: string;
  g500: string;
  g600: string;
  g700: string;
  s: string;
  cSky: string;
  cViolet: string;
  cTangerine: string;
  cFuchsia: string;
  cAmber: string;
  fontText: string;
  fontMono: string;
}

function buildPalette(isDarkMode: boolean): Palette {
  const T = isDarkMode ? DARK_TOKENS : LIGHT_TOKENS;
  return {
    up: T.up,
    dn: T.dn,
    wn: T.wn,
    g50: T.g50,
    g200: T.g200,
    g300: T.g300,
    g400: T.g400,
    g500: T.g500,
    g600: T.g600,
    g700: T.g700,
    s: T.s,
    cSky: T.cSky,
    cViolet: T.cViolet,
    cTangerine: T.cTangerine,
    cFuchsia: T.cFuchsia,
    cAmber: T.cAmber,
    fontText: "'Manrope', system-ui, sans-serif",
    fontMono: "'JetBrains Mono', monospace",
  };
}

const DIR_CHIPS: { id: DirectionFilter; label: string; colorKey: keyof Palette }[] = [
  { id: 'all', label: 'Все', colorKey: 'g400' },
  { id: 'grow', label: 'Рост', colorKey: 'dn' },
  { id: 'shrink', label: 'Снижение', colorKey: 'up' },
  { id: 'flat', label: 'Стабильные', colorKey: 'g500' },
];

const ALL_HORIZONS: { id: Horizon; label: string }[] = [
  { id: 'wow', label: 'WoW' },
  { id: '4w', label: '4W vs 4W' },
  { id: 'mom', label: 'MoM' },
  { id: 'cum', label: 'Кумулят.' },
];

/** Возвращает читаемую метку периода для заданного горизонта. */
function getHorizonPeriodLabel(horizon: Horizon): string {
  switch (horizon) {
    case 'wow':
      return 'WoW · последняя неделя';
    case '4w':
      return '4W vs 4W · текущий месяц';
    case 'mom':
      return 'MoM · месяц vs месяц';
    case 'cum':
    default:
      return 'Кумулятивно · текущий период';
  }
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/**
 * Мини-спарклайн 12 недель — чистый SVG, использует прямые цвета из palette
 * (не читает CSS-переменные при рендере).
 */
const MiniSpark: React.FC<{
  data: number[];
  color: string;
  surfaceColor: string;
}> = ({ data, color, surfaceColor }) => {
  const w = 120;
  const h = 30;
  const padT = 3;
  const padB = 3;
  if (!data.length) return <svg viewBox={`0 0 ${w} ${h}`} />;
  const min = Math.min(...data) * 0.85;
  const max = Math.max(...data) * 1.1;
  const range = max - min || 1;
  const sx = (i: number): number => (i / (data.length - 1)) * w;
  const sy = (v: number): number =>
    h - padB - ((v - min) / range) * (h - padT - padB);
  const pts = data.map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
  const lastX = sx(data.length - 1);
  const lastY = sy(data[data.length - 1]);
  const gradId = `vd-mini-${Math.abs(hashString(`${color}:${data.join(',')}`))}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pts} ${lastX},${h - padB} 0,${h - padB}`}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2" fill={color} stroke={surfaceColor} strokeWidth="1" />
    </svg>
  );
};

/* ── SVG-иконки для состояний (DS 2.0 §08) ──────────────── */
const IconEmpty: React.FC = () => (
  <svg
    className="vd-state-icon"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="8" y="10" width="32" height="28" rx="3" />
    <line x1="8" y1="18" x2="40" y2="18" />
    <line x1="16" y1="26" x2="32" y2="26" />
    <line x1="16" y1="32" x2="26" y2="32" />
  </svg>
);

const IconError: React.FC = () => (
  <svg
    className="vd-state-icon"
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="24" cy="24" r="18" />
    <line x1="24" y1="14" x2="24" y2="26" />
    <circle cx="24" cy="32" r="1.5" fill="currentColor" />
  </svg>
);

const IconWarning: React.FC = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 1 L15 14 L1 14 Z" />
    <line x1="8" y1="6" x2="8" y2="10" />
    <circle cx="8" cy="12" r="0.8" fill="currentColor" />
  </svg>
);

/**
 * Главный компонент.
 */
const VelocityDiverging: React.FC<VelocityDivergingProps> = ({
  width,
  height,
  headerText,
  subtitleText,
  dataState,
  partialWarning,
  errorMessage,
  stores: inputStores,
  formats: inputFormats,
  defaultHorizon,
  defaultMetric,
  showCumulativeView,
  showDetailModal,
  showCsvExport,
  showSummaryStrip,
  isDarkMode,
}) => {
  const theme: 'light' | 'dark' = isDarkMode ? 'dark' : 'light';
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureKeyframes();
  }, []);

  /** Палитра DS 2.0 — пересчитывается только при смене темы. */
  const palette = useMemo(() => buildPalette(isDarkMode), [isDarkMode]);

  const [metric, setMetric] = useState<MetricMode>(defaultMetric);
  const [horizon, setHorizon] = useState<Horizon>(defaultHorizon);
  const [sortBy, setSortBy] = useState<SortBy>('tempo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [dirFilter, setDirFilter] = useState<DirectionFilter>('all');
  const [formatFilters, setFormatFilters] = useState<Set<string>>(new Set());
  const [crossFilter, setCrossFilter] = useState<Set<string>>(new Set());
  const [fmtDdOpen, setFmtDdOpen] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [detailStoreId, setDetailStoreId] = useState<string | null>(null);

  /* Доступные горизонты с учётом настройки. */
  const availableHorizons = useMemo<Horizon[]>(() => {
    const all: Horizon[] = ['wow', '4w', 'mom', 'cum'];
    return showCumulativeView ? all : all.filter(h => h !== 'cum');
  }, [showCumulativeView]);

  useEffect(() => {
    if (!availableHorizons.includes(horizon)) {
      setHorizon(availableHorizons[1] ?? availableHorizons[0] ?? '4w');
    }
  }, [availableHorizons, horizon]);

  /* Форматы для dropdown. */
  const formats: FormatDef[] = useMemo(() => {
    if (inputFormats && inputFormats.length) return inputFormats;
    const uniq = new Map<string, FormatDef>();
    inputStores.forEach(s => {
      if (!uniq.has(s.format)) {
        uniq.set(s.format, {
          id: s.format,
          name: s.formatName || s.format,
          color: 'c-sky',
        });
      }
    });
    return Array.from(uniq.values());
  }, [inputFormats, inputStores]);

  const formatCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    formats.forEach(f => {
      counts[f.id] = 0;
    });
    inputStores.forEach(s => {
      counts[s.format] = (counts[s.format] ?? 0) + 1;
    });
    return counts;
  }, [formats, inputStores]);

  /* Фильтры + сортировка. */
  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let arr = inputStores.map(s => {
      const tr = computeTempo(s, horizon, metric);
      return { store: s, ...tr };
    });
    arr = arr.filter(x => {
      const s = x.store;
      if (formatFilters.size > 0 && !formatFilters.has(s.format)) return false;
      if (
        q &&
        !(
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q)
        )
      )
        return false;
      const dir = tempoDirection(x.tempo);
      if (dirFilter === 'grow' && dir !== 'grow') return false;
      if (dirFilter === 'shrink' && dir !== 'shrink') return false;
      if (dirFilter === 'flat' && dir !== 'flat') return false;
      return true;
    });
    arr.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'name')
        return mul * a.store.name.localeCompare(b.store.name, 'ru');
      if (sortBy === 'absDelta') return mul * (a.absDelta - b.absDelta);
      return mul * (a.tempo - b.tempo);
    });
    return arr;
  }, [inputStores, horizon, metric, searchQuery, formatFilters, dirFilter, sortBy, sortDir]);

  const summary = useMemo(() => {
    const totalPrev = filteredStores.reduce((s, x) => s + x.prev, 0);
    const totalCurr = filteredStores.reduce((s, x) => s + x.curr, 0);
    const netTempo = totalPrev > 0 ? totalCurr / totalPrev : 1;
    const growCount = filteredStores.filter(x => x.tempo > 1.5).length;
    return {
      totalPrev,
      totalCurr,
      netTempo,
      growCount,
      storesCount: filteredStores.length,
    };
  }, [filteredStores]);

  const barScale = useMemo(() => {
    if (!filteredStores.length) return { maxScale: 2.5 };
    const maxTempo = Math.max(...filteredStores.map(x => x.tempo), 2);
    const minTempo = Math.min(...filteredStores.map(x => x.tempo), 0.5);
    const maxScale = Math.max(maxTempo, 1 / Math.max(minTempo, 0.001), 2.5);
    return { maxScale };
  }, [filteredStores]);

  const tempoToPct = useCallback(
    (t0: number): number => {
      const { maxScale } = barScale;
      if (t0 >= 1) return 50 + ((t0 - 1) / (maxScale - 1)) * 50;
      return 50 - ((1 - t0) / (1 - 1 / maxScale)) * 50;
    },
    [barScale],
  );

  /* Активная метка периода — зависит от текущего horizon (J2 fix). */
  const activePeriodLabel = useMemo(
    () => getHorizonPeriodLabel(horizon),
    [horizon],
  );

  /* Топ-10 магазинов для кумулятивного вида — вычисляем всегда
     (Rules of Hooks: не внутри условных веток). */
  const cumulativeStores = useMemo<Store[]>(() => {
    if (!showCumulativeView || horizon !== 'cum') return [];
    return filteredStores
      .slice()
      .sort((a, b) => b.tempo - a.tempo)
      .slice(0, 10)
      .map(x => x.store);
  }, [filteredStores, horizon, showCumulativeView]);

  /* Сброс фильтров. */
  const hasActiveFilters =
    dirFilter !== 'all' || formatFilters.size > 0 || searchQuery.length > 0;
  const resetFilters = useCallback(() => {
    setDirFilter('all');
    setFormatFilters(new Set());
    setSearchQuery('');
  }, []);

  /* Сортировка. */
  const toggleSort = useCallback(
    (key: SortBy, defaultDir: 'asc' | 'desc' = 'desc') => {
      setSortBy(prev => {
        if (prev === key) {
          setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
          return prev;
        }
        setSortDir(defaultDir);
        return key;
      });
    },
    [],
  );

  const toggleRowCross = useCallback((id: string) => {
    setCrossFilter(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleFormat = useCallback((id: string) => {
    setFormatFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exportCSV = useCallback(() => {
    const isRub = metric === 'rub';
    const fmtVal = (v: number): string =>
      isRub ? nf0.format(v) : nf2.format(v);
    const headers = [
      '№',
      'Код',
      'Магазин',
      'Город',
      'Формат',
      'Было',
      'Стало',
      'Темп (×)',
      'Изменение %',
      'Абс. разница',
    ];
    const rows = filteredStores.map((x, i) => [
      i + 1,
      x.store.code,
      x.store.name,
      x.store.city,
      x.store.formatName,
      fmtVal(x.prev),
      fmtVal(x.curr),
      nf2.format(x.tempo),
      nf1.format(x.pctChange),
      fmtVal(x.absDelta),
    ]);
    const esc = (v: string | number): string => {
      const str = String(v);
      return /[";\n,]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const csv = [headers, ...rows].map(r => r.map(esc).join(';')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `samberi-скорость-потерь-${ymd}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredStores, metric]);

  /* Escape — закрывает dropdown. */
  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setFmtDdOpen(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    if (!fmtDdOpen) return undefined;
    const h = (e: MouseEvent): void => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('.vd-dd-wrap')) setFmtDdOpen(false);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [fmtDdOpen]);

  /* Tooltip для ряда. */
  const showRowTooltip = useCallback(
    (e: { clientX: number; clientY: number }, store: Store) => {
      const tr = computeTempo(store, horizon, metric);
      const tCls = tr.tempo > 1.05 ? 'dn' : tr.tempo < 0.95 ? 'up' : '';
      const statusColor =
        tr.tempo > 1.05
          ? palette.dn
          : tr.tempo < 0.95
            ? palette.up
            : palette.g600;
      const fv = (v: number): string => fmtByMetric(v, metric);
      const node = (
        <>
          <div className="tt-head">
            <div className="tt-status" style={{ background: statusColor }} />
            <div className="tt-titles">
              <div className="tt-name">{store.shortLabel}</div>
              <div className="tt-sub">
                {store.code} · {store.city} · {store.formatName}
              </div>
            </div>
          </div>
          <div className="tt-rows">
            <div className="tt-row">
              <span className="tt-l">{t('Было')}</span>
              <span className="tt-v">{fv(tr.prev)}</span>
            </div>
            <div className="tt-row">
              <span className="tt-l">{t('Стало')}</span>
              <span className="tt-v">{fv(tr.curr)}</span>
            </div>
            <div className="tt-row">
              <span className="tt-l">{t('Темп')}</span>
              <span className={`tt-v ${tCls}`}>{fmtTempoText(tr.tempo)}</span>
            </div>
            <div className="tt-row">
              <span className="tt-l">{t('Изменение')}</span>
              <span className={`tt-v ${tCls}`}>{fmtSignedPct(tr.pctChange)}</span>
            </div>
            <div className="tt-row">
              <span className="tt-l">{t('Формат план')}</span>
              <span className="tt-v">{nf2.format(store.plan)}%</span>
            </div>
            <div className="tt-row">
              <span className="tt-l">{t('ТО')}</span>
              <span className="tt-v">
                {store.to} {t('млн ₽')}
              </span>
            </div>
          </div>
        </>
      );
      setTooltip({
        html: node,
        theme,
        status: statusColor,
        x: e.clientX + 14,
        y: e.clientY + 14,
      });
    },
    [horizon, metric, theme, palette],
  );
  const moveTooltip = useCallback((e: React.MouseEvent) => {
    setTooltip(prev =>
      prev ? { ...prev, x: e.clientX + 14, y: e.clientY + 14 } : prev,
    );
  }, []);
  const hideTooltip = useCallback(() => setTooltip(null), []);

  const handleRowClick = useCallback(
    (e: React.MouseEvent, store: Store) => {
      if (showDetailModal && (e.ctrlKey || e.metaKey)) {
        setDetailStoreId(store.id);
        hideTooltip();
        return;
      }
      toggleRowCross(store.id);
    },
    [showDetailModal, toggleRowCross, hideTooltip],
  );

  const handleRowKey = useCallback(
    (e: React.KeyboardEvent, store: Store) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if ((e.ctrlKey || e.metaKey) && showDetailModal) {
          setDetailStoreId(store.id);
        } else {
          toggleRowCross(store.id);
        }
      }
    },
    [showDetailModal, toggleRowCross],
  );

  /* ── Render state-helpers ───────────────────────────── */
  const rootProps = {
    ref: rootRef,
    width,
    height,
    className: ROOT_CLASS,
    'data-theme': theme,
  } as const;

  /* Error state (DS 2.0 §08: иконка + текст + кнопка «Повторить»). */
  if (dataState === 'error') {
    return (
      <VelocityRoot {...rootProps}>
        <div className="vd-card">
          <div className="vd-state error" role="alert" aria-live="assertive">
            <IconError />
            <div className="vd-state-message">
              {errorMessage || t('Не удалось загрузить данные.')}
            </div>
            <button
              type="button"
              className="vd-state-action"
              onClick={() => window.location.reload()}
            >
              {t('Повторить')}
            </button>
          </div>
        </div>
      </VelocityRoot>
    );
  }

  /* Loading state (DS 2.0 §08: skeleton 0.8s, aria-busy). */
  if (dataState === 'loading') {
    return (
      <VelocityRoot {...rootProps}>
        <div className="vd-card" aria-busy="true" aria-live="polite">
          <SkeletonBlock variant="title" />
          <SkeletonBlock variant="header" />
          <SkeletonBlock variant="row" />
          <SkeletonBlock variant="row" />
          <SkeletonBlock variant="row" />
          <SkeletonBlock variant="row" />
        </div>
      </VelocityRoot>
    );
  }

  /* Empty state (DS 2.0 §08: иконка 48×48 --g300 + текст + предложение). */
  if (dataState === 'empty') {
    return (
      <VelocityRoot {...rootProps}>
        <div className="vd-card">
          <h2 className="vd-title">{headerText}</h2>
          <div className="vd-state" role="status">
            <IconEmpty />
            <div className="vd-state-message">
              {t('Нет данных для отображения.')}
            </div>
            <div className="vd-state-hint">
              {t('Попробуйте изменить фильтры или расширить диапазон дат.')}
            </div>
          </div>
        </div>
      </VelocityRoot>
    );
  }

  const netCls =
    summary.netTempo > 1.05 ? 'dn' : summary.netTempo < 0.95 ? 'up' : '';
  const netTempoText = fmtTempoText(summary.netTempo);
  const netPctChange = (summary.netTempo - 1) * 100;
  const netPctText = `${signPrefix(netPctChange)}${nf1.format(Math.abs(netPctChange))}%`;

  return (
    <>
      <VelocityRoot {...rootProps} role="region" aria-label={headerText}>
        <div className="vd-card">
          {/* Header */}
          <div className="vd-head">
            <div className="vd-title-block">
              <h2 className="vd-title">{headerText}</h2>
              <div className="vd-sub">
                {subtitleText && (
                  <>
                    <span>{subtitleText}</span>
                    <span className="vd-dot" aria-hidden="true" />
                  </>
                )}
                <span aria-live="polite">
                  {summary.storesCount} {t('из')} {inputStores.length} {t('магазинов')}
                </span>
                <span className="vd-dot" aria-hidden="true" />
                <span>{activePeriodLabel}</span>
                <span className="vd-dot" aria-hidden="true" />
                <span>{t('Ранжирование по темпу')}</span>
              </div>
            </div>
            <div className="vd-controls">
              {/* Metric toggle */}
              <div className="vd-seg" role="group" aria-label={t('Метрика')}>
                {(['rub', 'pct'] as MetricMode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={metric === m}
                    className={metric === m ? 'on' : undefined}
                    onClick={() => setMetric(m)}
                  >
                    {m === 'rub' ? t('₽ Суммы') : t('% к ТО')}
                  </button>
                ))}
              </div>
              {/* Horizon toggle */}
              <div className="vd-seg" role="group" aria-label={t('Горизонт')}>
                {ALL_HORIZONS.filter(h => availableHorizons.includes(h.id)).map(
                  h => (
                    <button
                      key={h.id}
                      type="button"
                      aria-pressed={horizon === h.id}
                      className={horizon === h.id ? 'on' : undefined}
                      onClick={() => setHorizon(h.id)}
                    >
                      {h.label}
                    </button>
                  ),
                )}
              </div>
              {/* Formats dropdown */}
              <div className="vd-dd-wrap">
                <button
                  type="button"
                  className="vd-dd-trigger"
                  aria-haspopup="true"
                  aria-expanded={fmtDdOpen}
                  onClick={() => setFmtDdOpen(v => !v)}
                >
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M2 4 L6 8 L10 4" />
                  </svg>
                  <span>{t('Форматы')}</span>
                  {formatFilters.size > 0 && (
                    <span className="vd-count-badge">{formatFilters.size}</span>
                  )}
                </button>
                <div
                  className="vd-dd-menu"
                  data-open={fmtDdOpen}
                  role="menu"
                  aria-label={t('Форматы магазинов')}
                >
                  {formats.map(f => {
                    const on = formatFilters.has(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={on}
                        className={`vd-dd-item${on ? ' on' : ''}`}
                        onClick={() => toggleFormat(f.id)}
                      >
                        <span className="vd-dd-check" aria-hidden="true">
                          <svg
                            viewBox="0 0 10 10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 5 L4 7 L8 3" />
                          </svg>
                        </span>
                        <span
                          className="vd-dd-item-dot"
                          style={{ background: `var(--${f.color})` }}
                        />
                        <span className="vd-dd-item-label">{f.name}</span>
                        <span className="vd-dd-item-count">
                          {formatCounts[f.id] ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Search */}
              <div className="vd-search">
                <svg
                  className="vd-search-icon"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="6" cy="6" r="4" />
                  <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('Поиск…')}
                  autoComplete="off"
                  aria-label={t('Поиск по магазину, городу или коду')}
                />
                <button
                  type="button"
                  className="vd-search-clear"
                  hidden={searchQuery.length === 0}
                  aria-label={t('Очистить поиск')}
                  onClick={() => setSearchQuery('')}
                >
                  <svg
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="2" y1="2" x2="8" y2="8" />
                    <line x1="8" y1="2" x2="2" y2="8" />
                  </svg>
                </button>
              </div>
              {showCsvExport && (
                <button
                  type="button"
                  className="vd-export-btn"
                  title={t('Экспорт в CSV')}
                  aria-label={t('Экспорт в CSV')}
                  onClick={exportCSV}
                >
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M7 1 L7 9 M4 6 L7 9 L10 6 M2 11 L12 11 L12 13 L2 13 Z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Direction chips */}
          <div
            className="vd-filter-row"
            role="group"
            aria-label={t('Фильтр по направлению темпа')}
          >
            <span className="vd-filter-label">{t('Направление')}</span>
            {DIR_CHIPS.map(c => {
              const color = palette[c.colorKey];
              // CSS custom property ("--vd-chip-color") — React's CSSProperties
              // doesn't model custom props, so build the object via computed key
              // and assert through `unknown` to bridge the index-signature gap.
              const chipStyle = {
                '--vd-chip-color': color,
              } as unknown as React.CSSProperties &
                Record<'--vd-chip-color', string>;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`vd-chip${dirFilter === c.id ? ' on' : ''}`}
                  aria-pressed={dirFilter === c.id}
                  style={chipStyle}
                  onClick={() => setDirFilter(c.id)}
                >
                  <span className="vd-chip-dot" aria-hidden="true" />
                  {c.label}
                </button>
              );
            })}
            <button
              type="button"
              className="vd-filter-reset"
              disabled={!hasActiveFilters}
              onClick={resetFilters}
            >
              {t('Сбросить')}
            </button>
          </div>

          {/* Stale badge (DS 2.0 §08) */}
          {dataState === 'stale' && (
            <div role="status" aria-live="polite">
              <span className="vd-stale-badge">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <circle cx="5" cy="5" r="3.5" />
                  <path d="M5 3 L5 5 L6.5 6" />
                </svg>
                {t('Данные устарели, обновите страницу')}
              </span>
            </div>
          )}

          {/* Partial warning */}
          {dataState === 'partial' && partialWarning && (
            <div className="vd-partial-badge" role="status" aria-live="polite">
              <IconWarning />
              <span>{partialWarning.message}</span>
            </div>
          )}

          {/* Summary */}
          {showSummaryStrip && (
            <div className="vd-summary" role="group" aria-label={t('Сводка')}>
              <div className="vd-sm">
                <div className="vd-sm-l">{t('Текущий период')}</div>
                <div className="vd-sm-v">{fmtByMetric(summary.totalCurr, metric)}</div>
                <div className="vd-sm-d">
                  {summary.storesCount} {t('магазинов')}
                </div>
              </div>
              <div className="vd-sm">
                <div className="vd-sm-l">{t('Прошлый период')}</div>
                <div className="vd-sm-v">{fmtByMetric(summary.totalPrev, metric)}</div>
                <div className="vd-sm-d">{t('для сравнения')}</div>
              </div>
              <div className="vd-sm">
                <div className="vd-sm-l">{t('Темп сети')}</div>
                <div className={`vd-sm-v ${netCls}`}>{netTempoText}</div>
                <div className="vd-sm-d">{netPctText}</div>
              </div>
              <div className="vd-sm">
                <div className="vd-sm-l">{t('Магазинов ×>1.5')}</div>
                <div className="vd-sm-v dn">
                  {summary.growCount}
                  <span className="vd-u">{t('маг.')}</span>
                </div>
                <div className="vd-sm-d">{t('потери выросли в 1.5+ раз')}</div>
              </div>
            </div>
          )}

          {/* Table / Cumulative view */}
          {horizon === 'cum' && showCumulativeView ? (
            <CumulativeView
              stores={cumulativeStores}
              metric={metric}
              palette={palette}
            />
          ) : (
            <div
              className="vd-table-wrap"
              role="table"
              aria-label={t('Таблица магазинов по темпу')}
            >
              <div className="vd-table-head" role="row">
                <div className="vd-th center" role="columnheader">
                  №
                </div>
                <button
                  type="button"
                  className={`vd-th sortable${sortBy === 'name' ? ' sorted' : ''}`}
                  role="columnheader"
                  aria-sort={
                    sortBy === 'name'
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                  onClick={() => toggleSort('name', 'asc')}
                >
                  {t('Магазин')}
                  {sortBy === 'name' && <SortArrow dir={sortDir} />}
                </button>
                <div className="vd-th right" role="columnheader">
                  {t('Было')}
                </div>
                <div className="vd-th center" role="columnheader">
                  {t('Изменение (темп)')}
                </div>
                <div className="vd-th right" role="columnheader">
                  {t('Стало')}
                </div>
                <button
                  type="button"
                  className={`vd-th right sortable${sortBy === 'tempo' ? ' sorted' : ''}`}
                  role="columnheader"
                  aria-sort={
                    sortBy === 'tempo'
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                  onClick={() => toggleSort('tempo', 'desc')}
                >
                  {t('Темп')}
                  {sortBy === 'tempo' && <SortArrow dir={sortDir} />}
                </button>
                <div className="vd-th" role="columnheader">
                  {t('Тренд 12 нед')}
                </div>
              </div>
              <div className="vd-table-body">
                {filteredStores.length === 0 && (
                  <div className="vd-state" role="status">
                    <IconEmpty />
                    <div className="vd-state-message">
                      {t('Ничего не найдено по заданным фильтрам.')}
                    </div>
                  </div>
                )}
                {filteredStores.map((x, i) => (
                  <TableRow
                    key={x.store.id}
                    index={i}
                    x={x}
                    metric={metric}
                    tempoToPct={tempoToPct}
                    palette={palette}
                    isCrossSelected={crossFilter.has(x.store.id)}
                    isDimmed={crossFilter.size > 0 && !crossFilter.has(x.store.id)}
                    onClick={e => handleRowClick(e, x.store)}
                    onDoubleClick={() => {
                      if (showDetailModal) setDetailStoreId(x.store.id);
                    }}
                    onKeyDown={e => handleRowKey(e, x.store)}
                    onMouseEnter={e => showRowTooltip(e, x.store)}
                    onMouseMove={moveTooltip}
                    onMouseLeave={hideTooltip}
                    onFocus={e => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      showRowTooltip(
                        {
                          clientX: rect.left + 40,
                          clientY: rect.top + rect.height / 2,
                        },
                        x.store,
                      );
                    }}
                    onBlur={hideTooltip}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="vd-footer">
            <div className="vd-hint">
              <div className="vd-legend-item">
                <span
                  className="vd-sw"
                  style={{ background: palette.dn }}
                  aria-hidden="true"
                />
                <span>{t('рост потерь')}</span>
              </div>
              <div className="vd-legend-item">
                <span
                  className="vd-sw"
                  style={{ background: palette.up }}
                  aria-hidden="true"
                />
                <span>{t('снижение')}</span>
              </div>
              <div className="vd-hint-item">
                <kbd>Click</kbd> — {t('кросс-фильтр')}
              </div>
              {showDetailModal && (
                <div className="vd-hint-item">
                  <kbd>Ctrl</kbd>+<kbd>Click</kbd> — {t('детализация')}
                </div>
              )}
              <div className="vd-hint-item">
                <kbd>Esc</kbd> — {t('закрыть')}
              </div>
            </div>
            <div aria-live="polite">
              {t('Показано')}{' '}
              <span className="vd-total-right">{filteredStores.length}</span>{' '}
              {t('из')}{' '}
              <span className="vd-total-right">{inputStores.length}</span>
            </div>
          </div>
        </div>
      </VelocityRoot>

      {tooltip && typeof document !== 'undefined' &&
        createPortal(
          <TooltipRoot
            data-theme={tooltip.theme}
            data-visible="true"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.html}
          </TooltipRoot>,
          document.body,
        )}

      {showDetailModal && detailStoreId && typeof document !== 'undefined' &&
        (() => {
          const store = inputStores.find(s => s.id === detailStoreId);
          if (!store) return null;
          return createPortal(
            <DetailModal
              store={store}
              metric={metric}
              horizon={horizon}
              theme={theme}
              palette={palette}
              onClose={() => setDetailStoreId(null)}
            />,
            document.body,
          );
        })()}
    </>
  );
};

const SortArrow: React.FC<{ dir: 'asc' | 'desc' }> = ({ dir }) => (
  <svg
    className="vd-sort-arrow"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    {dir === 'desc' ? (
      <path d="M5 2 L5 8 M2.5 6 L5 8 L7.5 6" />
    ) : (
      <path d="M5 8 L5 2 M2.5 4 L5 2 L7.5 4" />
    )}
  </svg>
);

interface RowProps {
  index: number;
  x: {
    store: Store;
    prev: number;
    curr: number;
    tempo: number;
    pctChange: number;
    absDelta: number;
  };
  metric: MetricMode;
  tempoToPct: (t: number) => number;
  palette: Palette;
  isCrossSelected: boolean;
  isDimmed: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onFocus: (e: React.FocusEvent) => void;
  onBlur: () => void;
}
const TableRow: React.FC<RowProps> = ({
  index,
  x,
  metric,
  tempoToPct,
  palette,
  isCrossSelected,
  isDimmed,
  onClick,
  onDoubleClick,
  onKeyDown,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onFocus,
  onBlur,
}) => {
  const { store, prev, curr, tempo, pctChange } = x;
  const dir = tempoDirection(tempo);
  const barColor =
    dir === 'grow' ? palette.dn : dir === 'shrink' ? palette.up : palette.g400;
  const sparkColor =
    tempo > 1.1 ? palette.dn : tempo < 0.9 ? palette.up : palette.g600;
  const tCls = dir === 'grow' ? 'dn' : dir === 'shrink' ? 'up' : 'wn';
  const barPct = tempoToPct(tempo);
  let barLeft: number;
  let barWidth: number;
  if (tempo >= 1) {
    barLeft = 50;
    barWidth = barPct - 50;
  } else {
    barLeft = barPct;
    barWidth = 50 - barPct;
  }
  const barOpacity = Math.min(1, 0.4 + Math.abs(tempo - 1) * 0.7);
  const weeks = metric === 'rub' ? store.weeksRub : store.weeksPct;
  const fv = (v: number): string => fmtByMetric(v, metric);
  const rowCls = ['vd-row'];
  if (isCrossSelected) rowCls.push('selected');
  if (isDimmed) rowCls.push('dimmed');

  return (
    <div
      role="row"
      tabIndex={0}
      className={rowCls.join(' ')}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-selected={isCrossSelected}
    >
      <div className="vd-rank-cell" role="cell">
        {index + 1}
      </div>
      <div className="vd-store-cell" role="cell">
        <div className="vd-store-name">
          <span className="vd-code">{store.code}</span>
          {store.shortLabel}
        </div>
        <div className="vd-store-meta">
          {store.city} · {store.formatName}
        </div>
      </div>
      <div className="vd-period-cell" role="cell">
        {fv(prev)}
        <span className="vd-sub-text">{t('пред.')}</span>
      </div>
      <BarCell role="cell">
        <div className="vd-bar-wrap">
          <div className="vd-bar-bg">
            <div className="vd-bar-bg-left" />
            <div className="vd-bar-bg-right" />
          </div>
          <div className="vd-bar-center" />
          <div
            className="vd-bar-fill"
            style={{
              left: `${barLeft}%`,
              width: `${barWidth}%`,
              background: barColor,
              opacity: barOpacity,
            }}
          />
        </div>
      </BarCell>
      <div className="vd-period-cell" role="cell">
        {fv(curr)}
        <span className="vd-sub-text">{t('текущ.')}</span>
      </div>
      <div className="vd-tempo-cell" role="cell">
        <span className={`vd-tempo-main ${tCls}`}>{fmtTempoText(tempo)}</span>
        <span className={`vd-tempo-pct ${tCls}`}>{fmtSignedPct(pctChange)}</span>
      </div>
      <div className="vd-spark-cell" role="cell">
        <MiniSpark data={weeks} color={sparkColor} surfaceColor={palette.s} />
      </div>
    </div>
  );
};

interface CumulativeProps {
  stores: Store[];
  metric: MetricMode;
  palette: Palette;
}
const CumulativeView: React.FC<CumulativeProps> = ({ stores, metric, palette }) => {
  const w = 900;
  const h = 220;
  const padL = 60;
  const padR = 20;
  const padT = 18;
  const padB = 28;
  const lineColors = [
    palette.dn,
    palette.cTangerine,
    palette.cAmber,
    palette.cFuchsia,
    palette.cSky,
    palette.cViolet,
    palette.g600,
    palette.up,
    palette.cFuchsia,
    palette.cViolet,
  ];

  const cumData = stores.map(s => {
    const weeks = metric === 'rub' ? s.weeksRub : s.weeksPct;
    let sum = 0;
    return weeks.map(v => {
      sum += v;
      return sum;
    });
  });
  const allMax = Math.max(1, ...cumData.flat()) * 1.05;
  const sx = (i: number): number => padL + (i / 11) * (w - padL - padR);
  const sy = (v: number): number =>
    h - padB - (v / allMax) * (h - padT - padB);

  return (
    <div className="vd-cum-wrap visible">
      <div className="vd-cum-title">
        <span>{t('Кумулятивные потери с начала периода')}</span>
        <span className="vd-right">
          {stores.length
            ? `${t('Топ')}-${stores.length} ${t('магазинов')}`
            : ''}
        </span>
      </div>
      <div className="vd-cum-chart">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height={h}
          role="img"
          aria-label={t('Кумулятивные потери по топ-10 магазинам')}
        >
          <line
            x1={padL}
            y1={h - padB}
            x2={w - padR}
            y2={h - padB}
            stroke={palette.g200}
            strokeWidth="1"
          />
          <line
            x1={padL}
            y1={padT}
            x2={padL}
            y2={h - padB}
            stroke={palette.g200}
            strokeWidth="1"
          />
          {[0, 2, 4, 6, 8, 10].map(i => (
            <text
              key={i}
              x={sx(i)}
              y={h - 10}
              fontFamily={palette.fontMono}
              fontSize="11"
              fill={palette.g600}
              textAnchor="middle"
            >
              Н{i + 1}
            </text>
          ))}
          {cumData.map((cum, si) => {
            const color = lineColors[si % lineColors.length];
            const pts = cum
              .map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`)
              .join(' ');
            const lx = sx(11);
            const ly = sy(cum[cum.length - 1]);
            const rawLabel = stores[si]?.name ?? '';
            const label =
              rawLabel.length > 12 ? `${rawLabel.slice(0, 11)}…` : rawLabel;
            return (
              <g key={stores[si]?.id ?? si}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx={lx}
                  cy={ly}
                  r="3"
                  fill={color}
                  stroke={palette.s}
                  strokeWidth="1.5"
                />
                <text
                  x={lx + 8}
                  y={ly + 4}
                  fontFamily={palette.fontMono}
                  fontSize="11"
                  fontWeight="600"
                  fill={color}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default VelocityDiverging;
export type { Palette };
