import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { SupersetClient, t } from '@superset-ui/core';
import { sanitizeCsvCell } from './sanitizeCsvCell';
// @ts-ignore — subpath resolves в runtime через Superset webpack aliases.
// Подмена на 'antd' ломает runtime потому что antd не зарегистрирован как dep плагина.
// @ts-ignore — antd доступен через peerDep `@superset-ui/core` в Superset frontend.
import { DatePicker as _AntdDP } from 'antd';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RangePicker: React.ComponentType<any> | undefined = (_AntdDP as any)?.RangePicker;
// @ts-ignore — dayjs не зарегистрирован как deps плагина, но доступен в bundle
// через Superset (peerDep antd). Используется здесь только для конвертации
// строк ISO → Dayjs объекты для RangePicker'а.
import dayjs from 'dayjs';
// @ts-ignore — русский локаль для dayjs (использует RangePicker).
import 'dayjs/locale/ru';
dayjs.locale('ru');
// @ts-ignore — antd ruRU locale доступен через peerDep antd в Superset.
import ruRU from 'antd/locale/ru_RU';
type Dayjs = ReturnType<typeof dayjs>;
import {
  BarCell,
  InlineSpinnerLarge,
  KEYFRAMES_CSS,
  PageBtn,
  PageEllipsis,
  PageInput,
  PaginationWrap,
  RefreshBar,
  ROOT_CLASS,
  SkeletonBlock,
  TooltipRoot,
  VelocityRoot,
} from './styles';
import { InfoHint, InfoHintTopRight } from './components/InfoHint';
import { DARK_TOKENS, LIGHT_TOKENS } from './themeTokens';
import type {
  ComparisonMode,
  DirectionFilter,
  FormatDef,
  MetricMode,
  Store,
  StoresQueryParams,
  VelocityDivergingProps,
} from './types';
import { computeTempo, tempoDirection } from './utils/computeTempo';

/* RangePicker — отдельный named export из того же subpath. */
import {
  fmtByMetric,
  fmtSignedPct,
  fmtTempoText,
  nf0,
  nf1,
  nf2,
  signPrefix,
} from './utils/formatRussian';
import {
  buildStoresCountPayload,
  buildStoresPayload,
  extractApiCompRows,
  extractApiRows,
} from './utils/detailApi';
import { rowsToStores } from './utils/rowsToStores';
import {
  formatRangeDateRu,
  rangeDurationDays,
  resolveComparisonRange,
  resolveTimeRangeAsync,
} from './utils/resolveRange';
import type { DateRange } from './utils/resolveRange';
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
  g100: string;
  g200: string;
  g300: string;
  g400: string;
  g500: string;
  g600: string;
  g700: string;
  s: string;
  ink: string;
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
    g100: T.g100,
    g200: T.g200,
    g300: T.g300,
    g400: T.g400,
    g500: T.g500,
    g600: T.g600,
    g700: T.g700,
    s: T.s,
    ink: T.ink,
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

/** Опции для dropdown «Сравнить с» — порядок имеет значение для UI. */
const COMPARISON_OPTIONS: {
  id: ComparisonMode;
  label: string;
  short: string;
}[] = [
  { id: 'prev_period', label: 'Предыдущий период', short: 'Пред. период' },
  { id: 'prev_week', label: 'Прошлая неделя', short: 'Прош. неделя' },
  { id: 'prev_month', label: 'Прошлый месяц', short: 'Прош. месяц' },
  { id: 'prev_quarter', label: 'Прошлый квартал', short: 'Прош. квартал' },
  { id: 'prev_year', label: 'Прошлый год', short: 'Прош. год' },
  { id: 'custom', label: 'Выбрать вручную', short: 'Вручную' },
];

/** Возвращает читаемую метку периода для текущего comparison-режима. */
function getComparisonPeriodLabel(mode: ComparisonMode): string {
  const opt = COMPARISON_OPTIONS.find(o => o.id === mode);
  return opt ? `Сравнение · ${opt.label.toLowerCase()}` : 'Сравнение периодов';
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
  defaultComparisonMode,
  customCurrentRange,
  customPreviousRange,
  defaultMetric,
  showCumulativeView,
  showDetailModal,
  showCsvExport,
  showSummaryStrip,
  isDarkMode,
  mockModeEnabled,
  pageSize,
  queryParams,
}) => {
  const theme: 'light' | 'dark' = isDarkMode ? 'dark' : 'light';
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureKeyframes();
  }, []);

  /** Палитра DS 2.0 — пересчитывается только при смене темы. */
  const palette = useMemo(() => buildPalette(isDarkMode), [isDarkMode]);

  const [metric, setMetric] = useState<MetricMode>(defaultMetric);
  /* Default ВСЕГДА = prev_period. Переключается на 'custom' при manual override. */
  const [comparisonMode, setComparisonMode] =
    useState<ComparisonMode>('prev_period');
  /* Locally applied custom-диапазоны (после нажатия «Применить» в панели).
     При comparisonMode = 'custom' они идут в payload как customCurrent/Previous.
     В остальных режимах их наличие == manual override (mode переключится
     в 'custom' при Apply). */
  const [customRange, setCustomRange] = useState<{
    current?: [string, string];
    previous?: [string, string];
  }>({
    current: customCurrentRange,
    previous: customPreviousRange,
  });
  /* Manual-override panel: pending draft + open state. Применяется в
     customRange ТОЛЬКО при нажатии «Применить». При «Отмена» — игнор. */
  const [panelOpen, setPanelOpen] = useState(false);
  const [pendingCurrent, setPendingCurrent] = useState<
    [string, string] | undefined
  >(undefined);
  const [pendingPrevious, setPendingPrevious] = useState<
    [string, string] | undefined
  >(undefined);
  const [cmpDdOpen, setCmpDdOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('tempo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [dirFilter, setDirFilter] = useState<DirectionFilter>('all');
  const [formatFilters, setFormatFilters] = useState<Set<string>>(new Set());
  const [crossFilter, setCrossFilter] = useState<Set<string>>(new Set());
  const [fmtDdOpen, setFmtDdOpen] = useState(false);
  /* Direction-filter dropdown: badge-trigger в .vd-controls вместо
     старого filter-row с 4 chips. Outside-click и Escape ниже в effects. */
  const [dirDdOpen, setDirDdOpen] = useState(false);
  /* Trigger ref + computed position для portal menu. VelocityRoot имеет
     overflow:auto + container-type:inline-size — absolute menu обрезается.
     Portal в body + position:fixed решает. */
  const dirTriggerRef = useRef<HTMLButtonElement>(null);
  const [dirMenuPos, setDirMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  useEffect(() => {
    if (!dirDdOpen) return undefined;
    const update = (): void => {
      const r = dirTriggerRef.current?.getBoundingClientRect();
      if (!r) return;
      setDirMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [dirDdOpen]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [detailStoreId, setDetailStoreId] = useState<string | null>(null);

  /* ── Серверная пагинация (mockOff). При mockOn все 400 магазинов уже в
     inputStores, пагинация локальная. ── */
  const [currentPage, setCurrentPage] = useState(0);
  const [serverStores, setServerStores] = useState<Store[]>(inputStores);
  const [serverHasNext, setServerHasNext] = useState(false);
  const [serverTotalCount, setServerTotalCount] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const countAbortRef = useRef<AbortController | null>(null);
  const hasEverLoaded = useRef(false);

  /* ── Resolved дата-диапазоны для UI-подсказки «Текущий: dd.MM – dd.MM
     vs dd.MM – dd.MM». Резолвим текущий через fetchTimeRange (или
     синхронно если уже ISO), а comparison — локально через dayjs. ── */
  const [resolvedCurrent, setResolvedCurrent] = useState<DateRange | null>(
    null,
  );
  const [isResolvingCurrent, setIsResolvingCurrent] = useState(false);
  const resolveAbortRef = useRef<AbortController | null>(null);

  /* Debounce поиска для серверной пагинации. */
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* Сброс currentPage при изменении выборки (вне sort/search — те уже сами
     сбрасывают). comparisonMode/metric — затрагивают tempo → ранжирование меняется,
     pageSize — окно. */
  useEffect(() => {
    setCurrentPage(0);
  }, [comparisonMode, metric, pageSize, dirFilter]);

  /* Отдельный useState-cumulative для показа дополнительного блока «Топ-10
     накопленных потерь». Не привязан к comparison-mode (раньше cum было одним
     из 4 горизонтов). По умолчанию выключен — пользователь включает кнопкой. */
  const [showCumulativeBlock, setShowCumulativeBlock] = useState(false);
  useEffect(() => {
    if (!showCumulativeView) setShowCumulativeBlock(false);
  }, [showCumulativeView]);

  /* formatFilters: тот же сброс, но Set нужно сериализовать. */
  const formatFiltersKey = useMemo(
    () => Array.from(formatFilters).sort().join('|'),
    [formatFilters],
  );
  useEffect(() => {
    setCurrentPage(0);
  }, [formatFiltersKey]);

  /* ── Server-side pagination fetch (только когда real data + есть queryParams).
     При mock — пользуемся inputStores в локальной пагинации (см. ниже). ── */
  const isServerPagingActive = !mockModeEnabled && Boolean(queryParams);

  /* formatsMap нужен для rowsToStores на стороне клиента. */
  const formatsMapServer = useMemo(() => {
    const m = new Map<string, FormatDef>();
    inputFormats?.forEach(f => m.set(f.id, f));
    return m;
  }, [inputFormats]);

  useEffect(() => {
    if (!isServerPagingActive || !queryParams) return undefined;
    if (dataState === 'error' || dataState === 'loading' || dataState === 'empty') {
      return undefined;
    }

    // Abort prev
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    if (!hasEverLoaded.current) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setFetchError(null);

    const payload = buildStoresPayload({
      queryParams,
      page: currentPage,
      pageSize,
      sortBy,
      sortAsc: sortDir === 'asc',
      searchQuery: debouncedSearch,
      comparisonMode,
      customCurrentRange: customRange.current,
      customPreviousRange: customRange.previous,
    });

    SupersetClient.post({
      endpoint: 'api/v1/chart/data',
      jsonPayload: payload,
      signal: controller.signal,
    })
      .then(({ json }: { json: Record<string, unknown> }) => {
        const rows = extractApiRows(json);
        const compRows =
          comparisonMode === 'custom' ? extractApiCompRows(json) : undefined;
        const parsed = rowsToStores(
          rows,
          { ...queryParams, comparisonMode },
          formatsMapServer,
          compRows,
        );
        // Page-cursor: pageSize+1 уникальных. Если больше → hasNext.
        const hasNext = parsed.length > pageSize;
        const displayed = hasNext ? parsed.slice(0, pageSize) : parsed;
        setServerStores(displayed);
        setServerHasNext(hasNext);
        hasEverLoaded.current = true;
        setIsInitialLoading(false);
        setIsRefreshing(false);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setFetchError(err.message || 'Ошибка загрузки данных');
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isServerPagingActive,
    currentPage,
    pageSize,
    sortBy,
    sortDir,
    debouncedSearch,
    queryParams?.datasourceId,
    comparisonMode,
    customRange.current?.[0],
    customRange.current?.[1],
    customRange.previous?.[0],
    customRange.previous?.[1],
  ]);

  /* Total-count fetch (один раз на изменение поиска). */
  useEffect(() => {
    if (!isServerPagingActive || !queryParams) return undefined;

    countAbortRef.current?.abort();
    const controller = new AbortController();
    countAbortRef.current = controller;

    const payload = buildStoresCountPayload({
      queryParams,
      searchQuery: debouncedSearch,
    });

    SupersetClient.post({
      endpoint: 'api/v1/chart/data',
      jsonPayload: payload,
      signal: controller.signal,
    })
      .then(({ json }: { json: Record<string, unknown> }) => {
        const rows = extractApiRows(json);
        setServerTotalCount(rows.length);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setServerTotalCount(null);
        }
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isServerPagingActive, debouncedSearch, queryParams?.datasourceId]);

  /* ── Резолв текущего периода для отображения «Текущий: dd.MM.YYYY – dd.MM.YYYY».
     Если comparisonMode = 'custom' с заданным customRange.current — используем его.
     Иначе — берём queryParams.timeRange и резолвим через Superset API
     (для preset-строк типа 'Last 7 days'). ── */
  useEffect(() => {
    resolveAbortRef.current?.abort();
    const controller = new AbortController();
    resolveAbortRef.current = controller;

    // Приоритет 1: custom-current задан (mode=custom или manual override) —
    // используем его как есть, без API запроса.
    if (
      comparisonMode === 'custom' &&
      customRange.current &&
      customRange.current[0] &&
      customRange.current[1]
    ) {
      setResolvedCurrent({
        start: customRange.current[0],
        end: customRange.current[1],
      });
      setIsResolvingCurrent(false);
      return undefined;
    }

    // Приоритет 2: queryParams.timeRange (real-data path).
    const tr = queryParams?.timeRange;
    if (!tr) {
      setResolvedCurrent(null);
      setIsResolvingCurrent(false);
      return undefined;
    }
    setIsResolvingCurrent(true);
    resolveTimeRangeAsync(tr, controller.signal).then(range => {
      if (controller.signal.aborted) return;
      setResolvedCurrent(range);
      setIsResolvingCurrent(false);
    });

    return () => controller.abort();
  }, [
    queryParams?.timeRange,
    comparisonMode,
    customRange.current?.[0],
    customRange.current?.[1],
  ]);

  /* Resolved comparison-range — вычисляем локально из resolvedCurrent. */
  const resolvedPrevious = useMemo<DateRange | null>(() => {
    if (!resolvedCurrent) return null;
    const customPrev =
      customRange.previous &&
      customRange.previous[0] &&
      customRange.previous[1]
        ? { start: customRange.previous[0], end: customRange.previous[1] }
        : undefined;
    return resolveComparisonRange(
      resolvedCurrent.start,
      resolvedCurrent.end,
      comparisonMode,
      customPrev,
    );
  }, [
    resolvedCurrent,
    comparisonMode,
    customRange.previous?.[0],
    customRange.previous?.[1],
  ]);

  /* ── Manual override active? — иконка-замок рядом с resolved-датами.
     Override считается активным когда mode='custom' и у пользователя
     заданы кастомные диапазоны. ── */
  const isManualOverride =
    comparisonMode === 'custom' &&
    Boolean(customRange.current) &&
    Boolean(customRange.previous);

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

  /* Активный набор магазинов: либо server-paged (real data), либо
     полный inputStores (mock-режим). */
  const activeStores = isServerPagingActive ? serverStores : inputStores;

  /* Фильтры + сортировка. Применяются к activeStores. В server-mode фильтры
     dir / format и поиск выполняют локальную пост-фильтрацию (на 1 странице)
     — это компромисс ради простоты; при включении dir-filter / format-filter
     в server-mode пользователь увидит "меньше pageSize" если эти фильтры
     активны. Searching уходит на сервер через debouncedSearch. */
  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let arr = activeStores.map(s => {
      const prev = metric === 'rub' ? s.prevValueRub : s.prevValuePct;
      const curr = metric === 'rub' ? s.currValueRub : s.currValuePct;
      const tr = computeTempo(prev, curr);
      return { store: s, ...tr };
    });
    arr = arr.filter(x => {
      const s = x.store;
      if (formatFilters.size > 0 && !formatFilters.has(s.format)) return false;
      // В server-mode фильтр по тексту делает сервер (через debouncedSearch),
      // локально игнорим чтобы не вычитать с current page больше.
      if (
        !isServerPagingActive &&
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
  }, [
    activeStores,
    metric,
    searchQuery,
    formatFilters,
    dirFilter,
    sortBy,
    sortDir,
    isServerPagingActive,
  ]);

  /* Локальная пагинация для mock-mode или fallback (server-mode уже разделил
     данные на странице). */
  const totalLocalPages = useMemo(() => {
    if (isServerPagingActive) return 0; // не используется в server-mode
    return Math.max(1, Math.ceil(filteredStores.length / pageSize));
  }, [isServerPagingActive, filteredStores.length, pageSize]);

  const pagedStores = useMemo(() => {
    if (isServerPagingActive) {
      // server-mode: serverStores уже = текущая страница, filteredStores
      // фильтрует/сортирует её локально.
      return filteredStores;
    }
    const start = currentPage * pageSize;
    return filteredStores.slice(start, start + pageSize);
  }, [isServerPagingActive, filteredStores, currentPage, pageSize]);

  /* Если currentPage стал out-of-bounds (например фильтры сократили N) —
     откатываем на 0 (только локально). */
  useEffect(() => {
    if (isServerPagingActive) return;
    if (currentPage >= totalLocalPages) setCurrentPage(0);
  }, [currentPage, totalLocalPages, isServerPagingActive]);

  /* Суммарные данные — в mock-mode по всему filteredStores (всем магазинам),
     в server-mode по current page (filteredStores уже = одна страница). */
  const summary = useMemo(() => {
    const totalPrev = filteredStores.reduce((s, x) => s + x.prev, 0);
    const totalCurr = filteredStores.reduce((s, x) => s + x.curr, 0);
    const netTempo = totalPrev > 0 ? totalCurr / totalPrev : 1;
    const growCount = filteredStores.filter(x => x.tempo > 1.5).length;
    // В server-mode showcount предпочитаем серверное (если знаем)
    const storesCount = isServerPagingActive
      ? serverTotalCount ?? filteredStores.length
      : filteredStores.length;
    return {
      totalPrev,
      totalCurr,
      netTempo,
      growCount,
      storesCount,
    };
  }, [filteredStores, isServerPagingActive, serverTotalCount]);

  /* barScale рассчитываем по pagedStores: масштаб бара меняется по странице,
     зрительно проще читать «рост N1 = 3× против N2». */
  const barScale = useMemo(() => {
    if (!pagedStores.length) return { maxScale: 2.5 };
    const maxTempo = Math.max(...pagedStores.map(x => x.tempo), 2);
    const minTempo = Math.min(...pagedStores.map(x => x.tempo), 0.5);
    const maxScale = Math.max(maxTempo, 1 / Math.max(minTempo, 0.001), 2.5);
    return { maxScale };
  }, [pagedStores]);

  const tempoToPct = useCallback(
    (t0: number): number => {
      const { maxScale } = barScale;
      if (t0 >= 1) return 50 + ((t0 - 1) / (maxScale - 1)) * 50;
      return 50 - ((1 - t0) / (1 - 1 / maxScale)) * 50;
    },
    [barScale],
  );

  /* Активная метка периода — зависит от текущего comparison-режима. */
  const activePeriodLabel = useMemo(
    () => getComparisonPeriodLabel(comparisonMode),
    [comparisonMode],
  );

  /* Топ-10 магазинов для кумулятивного вида — вычисляем всегда
     (Rules of Hooks: не внутри условных веток). Cumulative — отдельный
     режим показа (toggle), независимый от comparisonMode. */
  const cumulativeStores = useMemo<Store[]>(() => {
    if (!showCumulativeView || !showCumulativeBlock) return [];
    return filteredStores
      .slice()
      .sort((a, b) => b.tempo - a.tempo)
      .slice(0, 10)
      .map(x => x.store);
  }, [filteredStores, showCumulativeView, showCumulativeBlock]);

  /* Сброс фильтров. */
  const hasActiveFilters =
    dirFilter !== 'all' || formatFilters.size > 0 || searchQuery.length > 0;
  const resetFilters = useCallback(() => {
    setDirFilter('all');
    setFormatFilters(new Set());
    setSearchQuery('');
    setCurrentPage(0);
  }, []);

  /* Сортировка. Любая смена sort → сбрасываем currentPage. */
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
      setCurrentPage(0);
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

  /* ── Управление range-panel («Изменить даты»). Pending state — draft;
     применяется только при «Применить». Открытие из любого режима
     инициализирует pending от текущих resolved-дат. ── */
  const openRangePanel = useCallback(() => {
    // Pre-fill pending значениями текущих resolved-периодов
    // (если уже есть customRange — берём его как стартовую точку).
    const cur =
      customRange.current ??
      (resolvedCurrent
        ? ([resolvedCurrent.start, resolvedCurrent.end] as [string, string])
        : undefined);
    const prev =
      customRange.previous ??
      (resolvedPrevious
        ? ([resolvedPrevious.start, resolvedPrevious.end] as [string, string])
        : undefined);
    setPendingCurrent(cur);
    setPendingPrevious(prev);
    setPanelOpen(true);
  }, [customRange, resolvedCurrent, resolvedPrevious]);

  const closeRangePanel = useCallback(() => {
    setPanelOpen(false);
    setPendingCurrent(undefined);
    setPendingPrevious(undefined);
  }, []);

  const applyRangePanel = useCallback(() => {
    // Сохраняем pending → customRange; mode → 'custom'.
    setCustomRange({ current: pendingCurrent, previous: pendingPrevious });
    setComparisonMode('custom');
    setPanelOpen(false);
    setCurrentPage(0);
  }, [pendingCurrent, pendingPrevious]);

  const resetRangePanel = useCallback(() => {
    // Сбрасываем custom-override → возврат к prev_period (auto).
    setCustomRange({ current: undefined, previous: undefined });
    setComparisonMode('prev_period');
    setPanelOpen(false);
    setPendingCurrent(undefined);
    setPendingPrevious(undefined);
    setCurrentPage(0);
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
      const str = sanitizeCsvCell(v);
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
        setDirDdOpen(false);
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

  /* Outside-click для direction-dropdown. Используем отдельный класс
     `.vd-dir-dd-wrap` чтобы клик внутри другого `.vd-dd-wrap` (форматы)
     не закрывал его молча. */
  useEffect(() => {
    if (!dirDdOpen) return undefined;
    const h = (e: MouseEvent): void => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('.vd-dir-dd-wrap')) setDirDdOpen(false);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [dirDdOpen]);

  /* Escape closes range-panel (но не если открыт AntD календарь). */
  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (panelOpen) {
          // Не закрываем если AntD календарь открыт — он сам ловит Escape.
          const calOpen = document.querySelector('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
          if (!calOpen) closeRangePanel();
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [panelOpen, closeRangePanel]);

  /* Tooltip для ряда. */
  const showRowTooltip = useCallback(
    (e: { clientX: number; clientY: number }, store: Store) => {
      const prev = metric === 'rub' ? store.prevValueRub : store.prevValuePct;
      const curr = metric === 'rub' ? store.currValueRub : store.currValuePct;
      const tr = computeTempo(prev, curr);
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
    [metric, theme, palette],
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
        <div className="vd-card" data-info-hint-container="" data-no-anim="">
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
        <div className="vd-card" data-info-hint-container="" data-no-anim="" aria-busy="true" aria-live="polite">
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
        <div className="vd-card" data-info-hint-container="" data-no-anim="">
          <h2 className="vd-title">
            {headerText}
            {mockModeEnabled && <span className="vd-mock-badge">ТЕСТ</span>}
          </h2>
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
        <div className="vd-card" data-info-hint-container="">
          {/* Header */}
          <div className="vd-head">
            <div className="vd-title-block">
              <h2 className="vd-title">
                {headerText}
                {mockModeEnabled && <span className="vd-mock-badge">ТЕСТ</span>}
              </h2>
              <div className="vd-sub">
                {subtitleText && (
                  <>
                    <span>{subtitleText}</span>
                    <span className="vd-dot" aria-hidden="true" />
                  </>
                )}
                <span aria-live="polite">
                  {(() => {
                    const total = isServerPagingActive
                      ? serverTotalCount ?? `${serverHasNext ? '≥' : ''}${(currentPage + 1) * pageSize}`
                      : inputStores.length;
                    const shown = isServerPagingActive
                      ? pagedStores.length
                      : summary.storesCount;
                    return (
                      <>
                        {shown} {t('из')} {total} {t('магазинов')}
                      </>
                    );
                  })()}
                </span>
              </div>
            </div>
            <div className="vd-controls">
              {showCumulativeView && (
                <button
                  type="button"
                  className={`vd-dd-trigger${showCumulativeBlock ? ' on' : ''}`}
                  aria-pressed={showCumulativeBlock}
                  onClick={() => setShowCumulativeBlock(v => !v)}
                  title={t('Кумулятивные потери — топ-10 магазинов')}
                  style={
                    showCumulativeBlock
                      ? {
                          background: 'var(--c-sky)',
                          color: 'var(--on-accent)',
                          borderColor: 'var(--c-sky)',
                        }
                      : undefined
                  }
                >
                  {t('Кумулят.')}
                </button>
              )}
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
              {/* Direction filter — badge с dropdown. Заменяет
                  старую filter-row с 4 chips (см. vd-filter-row).
                  Outside-click / Escape — useEffect выше. */}
              <div className="vd-dd-wrap vd-dir-dd-wrap">
                {(() => {
                  const cur =
                    DIR_CHIPS.find(c => c.id === dirFilter) ?? DIR_CHIPS[0];
                  const curColor = palette[cur.colorKey];
                  const triggerStyle = {
                    '--vd-chip-color': curColor,
                  } as unknown as React.CSSProperties &
                    Record<'--vd-chip-color', string>;
                  return (
                    <button
                      ref={dirTriggerRef}
                      type="button"
                      className={`vd-dd-trigger vd-dir-dd-trigger${dirDdOpen ? ' open' : ''}${dirFilter !== 'all' ? ' on' : ''}`}
                      aria-haspopup="listbox"
                      aria-expanded={dirDdOpen}
                      aria-label={t('Направление темпа: %s', cur.label)}
                      title={t('Фильтр по направлению темпа')}
                      style={triggerStyle}
                      onClick={() => setDirDdOpen(v => !v)}
                    >
                      <span
                        className="vd-dir-dd-trigger-dot"
                        aria-hidden="true"
                      />
                      <span className="vd-dir-dd-trigger-label">
                        {t(cur.label)}
                      </span>
                      <svg
                        viewBox="0 0 10 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M1 1 L5 5 L9 1" />
                      </svg>
                    </button>
                  );
                })()}
                {dirDdOpen && createPortal(
                  <div
                    role="listbox"
                    aria-label={t('Фильтр по направлению темпа')}
                    style={{
                      position: 'fixed',
                      top: dirMenuPos.top,
                      right: dirMenuPos.right,
                      zIndex: 10000,
                      minWidth: 180,
                      background: '#ffffff',
                      border: '1px solid #D1D5DB',
                      borderRadius: 10,
                      padding: 4,
                      boxShadow: '0 10px 28px rgba(15, 17, 20, 0.15)',
                      animation: 'vd-dd-fade 0.18s ease',
                    }}
                  >
                    {DIR_CHIPS.map(c => {
                      const color = palette[c.colorKey];
                      const isOn = dirFilter === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          role="option"
                          aria-selected={isOn}
                          onClick={() => {
                            setDirFilter(c.id);
                            setDirDdOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            width: '100%',
                            minHeight: 34,
                            padding: '7px 10px',
                            background: isOn ? '#F3F4F6' : 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            color: '#0F1114',
                            fontFamily: 'inherit',
                            fontSize: 12,
                            fontWeight: isOn ? 600 : 500,
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => {
                            if (!isOn) (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB';
                          }}
                          onMouseLeave={e => {
                            if (!isOn) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: color,
                              flexShrink: 0,
                              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
                            }}
                          />
                          <span>{t(c.label)}</span>
                        </button>
                      );
                    })}
                  </div>,
                  document.body,
                )}
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="vd-filter-reset vd-filter-reset-inline"
                  aria-label={t('Сбросить фильтры')}
                  title={t('Сбросить фильтры')}
                  onClick={resetFilters}
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
                    <path d="M2.5 7 a4.5 4.5 0 1 0 1.32-3.18" />
                    <path d="M2 2 L2 4.5 L4.5 4.5" />
                  </svg>
                </button>
              )}
              {/* Metric toggle — перенесён правее, перед info-иконкой. */}
              <div className="vd-seg" role="group" aria-label={t('Метрика')}>
                {(['rub', 'pct'] as MetricMode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={metric === m}
                    className={metric === m ? 'on' : undefined}
                    onClick={() => setMetric(m)}
                  >
                    {m === 'rub' ? '₽' : '%'}
                  </button>
                ))}
              </div>
              <InfoHintTopRight>
                <InfoHint ariaLabel="Подсказка по управлению">
                  <div className="hint-section">
                    <div className="hint-section-title">Управление таблицей</div>
                    <span className="hi"><kbd>Click</kbd> — кросс-фильтр</span>
                    {showDetailModal && (
                      <>
                        <span className="hi-sep" aria-hidden="true" />
                        <span className="hi"><kbd>Ctrl</kbd>+<kbd>Click</kbd> — детализация</span>
                      </>
                    )}
                    <span className="hi-sep" aria-hidden="true" />
                    <span className="hi"><kbd>Esc</kbd> — закрыть</span>
                    <span className="hi-sep" aria-hidden="true" />
                    <span className="hi"><kbd>Right Click</kbd> — меню действий</span>
                  </div>
                  <div className="hint-section">
                    <div className="hint-section-title">Управление сравнением</div>
                    <span className="hi">
                      <strong>«Сравнить с: …»</strong> — выбор пресета (прошлая
                      неделя/месяц/квартал/год или предыдущий период такой же
                      длины).
                    </span>
                    <span className="hi-sep" aria-hidden="true" />
                    <span className="hi">
                      <strong>«Изменить даты»</strong> — ручной override:
                      открывает два RangePicker'а для current/previous периодов.
                      Применение автоматически переключает режим в «Custom».
                    </span>
                    <span className="hi-sep" aria-hidden="true" />
                    <span className="hi">
                      Под dropdown'ом всегда видна строка с конкретными
                      датами текущего и сравниваемого периодов.
                    </span>
                  </div>
                </InfoHint>
              </InfoHintTopRight>
            </div>
          </div>

          {/* Resolved-периоды info row — ВСЕГДА visible. Click → открывает
              range-panel для ручного override. Tab/Enter — то же. */}
          <button
            type="button"
            className={`vd-compare-info${panelOpen ? ' on' : ''}${isManualOverride ? ' override' : ''}`}
            aria-expanded={panelOpen}
            aria-controls="vd-range-panel"
            onClick={() => (panelOpen ? closeRangePanel() : openRangePanel())}
            title={t('Нажмите чтобы изменить даты')}
          >
            <span className="vd-compare-info-cal" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3.5" width="12" height="10" rx="1.5" />
                <line x1="2" y1="6.5" x2="14" y2="6.5" />
                <line x1="5.5" y1="2" x2="5.5" y2="4.5" />
                <line x1="10.5" y1="2" x2="10.5" y2="4.5" />
              </svg>
            </span>
            <span className="vd-compare-info-line">
              <span className="vd-compare-info-label">{t('Текущий')}:</span>
              <span className="vd-compare-info-dates">
                {resolvedCurrent ? (
                  <>
                    {formatRangeDateRu(resolvedCurrent.start)}
                    {' – '}
                    {formatRangeDateRu(resolvedCurrent.end)}
                  </>
                ) : (
                  '—'
                )}
              </span>
              {resolvedCurrent && (
                <span className="vd-compare-info-dur">
                  ({rangeDurationDays(resolvedCurrent)} {t('дн')})
                </span>
              )}
            </span>
            <span className="vd-compare-info-line">
              <span className="vd-compare-info-label">vs</span>
              <span className="vd-compare-info-dates">
                {resolvedPrevious ? (
                  <>
                    {formatRangeDateRu(resolvedPrevious.start)}
                    {' – '}
                    {formatRangeDateRu(resolvedPrevious.end)}
                  </>
                ) : (
                  '—'
                )}
              </span>
              {resolvedPrevious && (
                <span className="vd-compare-info-dur">
                  ({rangeDurationDays(resolvedPrevious)} {t('дн')})
                </span>
              )}
            </span>
            {isResolvingCurrent && (
              <span className="vd-compare-info-loading" aria-label={t('Резолв периода')}>
                <InlineSpinnerLarge
                  style={{ width: 12, height: 12 }}
                  aria-hidden="true"
                />
              </span>
            )}
            {isManualOverride && (
              <span
                className="vd-compare-info-locked"
                aria-label={t('Локальная настройка чарта')}
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <rect x="3" y="6" width="6" height="4.5" rx="0.8" />
                  <path d="M4.2 6 V4.5 a1.8 1.8 0 0 1 3.6 0 V6" />
                </svg>
                {t('Ручной выбор')}
              </span>
            )}
          </button>

          {/* Range-modal — портал в document.body. Стили inline т.к. CSS
              styled-components scope не охватывает портал → класс не получит
              эмоция-стили из VelocityRoot. */}
          {panelOpen && RangePicker && createPortal(
            <div
              role="presentation"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeRangePanel();
              }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10000,
                background: 'rgba(0, 0, 0, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                animation: 'vd-overlay-in 0.18s ease',
              }}
            >
            <div
              id="vd-range-panel"
              role="dialog"
              aria-modal="true"
              aria-label={t('Выбор диапазонов для сравнения')}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: 12,
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: 480,
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '16px 18px 18px',
                color: '#0F1114',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}>
                <h3 style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#0F1114',
                  margin: 0,
                }}>{t('Период сравнения')}</h3>
                <button
                  type="button"
                  aria-label={t('Закрыть')}
                  onClick={closeRangePanel}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    color: '#6B7280',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <line x1="2" y1="2" x2="12" y2="12" />
                    <line x1="12" y1="2" x2="2" y2="12" />
                  </svg>
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1114' }}>{t('Текущий период')}</span>
                  <RangePicker
                    value={
                      pendingCurrent
                        ? ([
                            dayjs(pendingCurrent[0]),
                            dayjs(pendingCurrent[1]),
                          ] as [Dayjs, Dayjs])
                        : null
                    }
                    onChange={(dates: unknown) => {
                      const arr = dates as [Dayjs, Dayjs] | null;
                      setPendingCurrent(
                        arr
                          ? [
                              arr[0].format('YYYY-MM-DD'),
                              arr[1].format('YYYY-MM-DD'),
                            ]
                          : undefined,
                      );
                    }}
                    format="DD.MM.YYYY"
                    popupClassName="vd-rp-single"
                    popupStyle={{ zIndex: 10001 }}
                    locale={ruRU.DatePicker}
                    allowClear
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1114' }}>
                    {t('Период для сравнения')}
                  </span>
                  <RangePicker
                    value={
                      pendingPrevious
                        ? ([
                            dayjs(pendingPrevious[0]),
                            dayjs(pendingPrevious[1]),
                          ] as [Dayjs, Dayjs])
                        : null
                    }
                    onChange={(dates: unknown) => {
                      const arr = dates as [Dayjs, Dayjs] | null;
                      setPendingPrevious(
                        arr
                          ? [
                              arr[0].format('YYYY-MM-DD'),
                              arr[1].format('YYYY-MM-DD'),
                            ]
                          : undefined,
                      );
                    }}
                    format="DD.MM.YYYY"
                    popupClassName="vd-rp-single"
                    popupStyle={{ zIndex: 10001 }}
                    locale={ruRU.DatePicker}
                    allowClear
                  />
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 16,
                paddingTop: 14,
                borderTop: '1px solid #E5E7EB',
              }}>
                {isManualOverride && (
                  <button
                    type="button"
                    onClick={resetRangePanel}
                    style={{
                      minHeight: 36,
                      padding: '0 14px',
                      background: 'transparent',
                      border: '1px solid #FCA5A5',
                      borderRadius: 8,
                      color: '#DC2626',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t('Сбросить')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeRangePanel}
                  style={{
                    minHeight: 36,
                    padding: '0 14px',
                    background: 'transparent',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    color: '#374151',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('Отмена')}
                </button>
                <button
                  type="button"
                  disabled={!pendingCurrent || !pendingPrevious}
                  onClick={applyRangePanel}
                  style={{
                    minHeight: 36,
                    padding: '0 16px',
                    background: (!pendingCurrent || !pendingPrevious) ? '#9CA3AF' : '#2563EB',
                    border: 'none',
                    borderRadius: 8,
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: (!pendingCurrent || !pendingPrevious) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {t('Применить')}
                </button>
              </div>
            </div>
            </div>,
            document.body,
          )}

          {/* Direction filter переехал в .vd-controls как badge-dropdown
              (.vd-dir-dd-wrap). Старый vd-filter-row удалён. */}

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
          {showCumulativeBlock && showCumulativeView ? (
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
              style={{ position: 'relative' }}
            >
              {isRefreshing && <RefreshBar />}
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
              <div
                className="vd-table-body"
                style={{
                  opacity: isRefreshing ? 0.55 : 1,
                  transition: 'opacity 0.15s ease',
                  pointerEvents: isRefreshing ? 'none' : 'auto',
                }}
              >
                {isInitialLoading && (
                  <div className="vd-state" role="status" aria-live="polite">
                    <InlineSpinnerLarge aria-label={t('Загрузка')} />
                    <div className="vd-state-message">{t('Загрузка…')}</div>
                  </div>
                )}
                {!isInitialLoading && fetchError && (
                  <div className="vd-state error" role="alert">
                    <IconError />
                    <div className="vd-state-message">{fetchError}</div>
                    <button
                      type="button"
                      className="vd-state-action"
                      onClick={() => setCurrentPage(p => p)}
                    >
                      {t('Повторить')}
                    </button>
                  </div>
                )}
                {!isInitialLoading && !fetchError && pagedStores.length === 0 && (
                  <div className="vd-state" role="status">
                    <IconEmpty />
                    <div className="vd-state-message">
                      {t('Ничего не найдено по заданным фильтрам.')}
                    </div>
                  </div>
                )}
                {!isInitialLoading && !fetchError && pagedStores.map((x, i) => (
                  <TableRow
                    key={x.store.id}
                    index={currentPage * pageSize + i}
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

          {/* Pagination (отдельно для server-mode и client-mode). */}
          {(() => {
            const isCumulative = showCumulativeBlock && showCumulativeView;
            if (isCumulative) return null;

            let totalPages: number | null;
            if (isServerPagingActive) {
              if (serverTotalCount != null) {
                totalPages = Math.ceil(serverTotalCount / pageSize);
              } else if (serverHasNext) {
                // exact count неизвестен — рисуем «N+» режим: текущая + еще
                totalPages = null;
              } else {
                totalPages = currentPage + 1;
              }
            } else {
              totalPages = totalLocalPages;
            }

            if (totalPages != null && totalPages <= 1) return null;

            const cur1 = currentPage + 1;

            // Helper для генерации [1, ..., n-1, n] видимых страниц
            const getPageNumbers = (
              current0: number,
              total: number,
            ): (number | '...')[] => {
              if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
              const pages = new Set<number>();
              pages.add(1);
              pages.add(total);
              pages.add(total - 1);
              pages.add(total - 2);
              const cur = current0 + 1;
              pages.add(cur);
              if (cur > 1) pages.add(cur - 1);
              if (cur < total) pages.add(cur + 1);
              const sorted = [...pages]
                .filter(p => p >= 1 && p <= total)
                .sort((a, b) => a - b);
              const result: (number | '...')[] = [];
              for (let i = 0; i < sorted.length; i += 1) {
                if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
                result.push(sorted[i]);
              }
              return result;
            };

            return (
              <PaginationWrap
                style={{
                  opacity: isRefreshing ? 0.5 : 1,
                  pointerEvents: isRefreshing ? 'none' : 'auto',
                  transition: 'opacity 0.15s ease',
                }}
                role="navigation"
                aria-label={t('Постраничная навигация')}
              >
                <PageBtn
                  type="button"
                  aria-label={t('Предыдущая страница')}
                  disabled={isRefreshing || currentPage === 0}
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                >
                  ‹
                </PageBtn>
                {totalPages != null
                  ? getPageNumbers(currentPage, totalPages).map((item, idx) =>
                      item === '...' ? (
                        <PageEllipsis key={`e${idx}`}>…</PageEllipsis>
                      ) : (
                        <PageBtn
                          key={item}
                          type="button"
                          isActive={item === cur1}
                          aria-label={`${t('Страница')} ${item}`}
                          aria-current={item === cur1 ? 'page' : undefined}
                          disabled={isRefreshing}
                          onClick={() => setCurrentPage((item as number) - 1)}
                        >
                          {item}
                        </PageBtn>
                      ),
                    )
                  : /* server-mode без exact count: показываем «N+». */
                    [
                      <PageBtn
                        key="cur"
                        type="button"
                        isActive
                        aria-current="page"
                        disabled={isRefreshing}
                      >
                        {cur1}
                      </PageBtn>,
                      <PageEllipsis key="ell">…</PageEllipsis>,
                    ]}
                <PageBtn
                  type="button"
                  aria-label={t('Следующая страница')}
                  disabled={
                    isRefreshing ||
                    (totalPages != null
                      ? currentPage >= totalPages - 1
                      : !serverHasNext)
                  }
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  ›
                </PageBtn>
                {totalPages != null && totalPages > 7 && (
                  <PageInput
                    type="number"
                    min={1}
                    max={totalPages}
                    placeholder="№"
                    aria-label={t('Перейти на страницу')}
                    disabled={isRefreshing}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(
                          (e.target as HTMLInputElement).value,
                          10,
                        );
                        if (val >= 1 && val <= totalPages) {
                          setCurrentPage(val - 1);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                )}
              </PaginationWrap>
            );
          })()}

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
          // В server-mode искать сначала в serverStores (current page), потом
          // в inputStores (mock/initial). В mock-mode наоборот.
          const store =
            (isServerPagingActive
              ? serverStores.find(s => s.id === detailStoreId)
              : inputStores.find(s => s.id === detailStoreId)) ??
            inputStores.find(s => s.id === detailStoreId);
          if (!store) return null;
          return createPortal(
            <DetailModal
              store={store}
              metric={metric}
              comparisonMode={comparisonMode}
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
  /* Тренд опционален: backend может не отдать (если weekCol не задан). */
  const weeks: number[] =
    (metric === 'rub' ? store.trendRub : store.trendPct) ?? [];
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

  /* Trend данных может не быть (backend не задал weekCol). В таком случае
     показываем «нет данных для тренда» вместо падения. */
  const cumData = stores.map(s => {
    const weeks =
      (metric === 'rub' ? s.trendRub : s.trendPct) ?? [];
    let sum = 0;
    return weeks.map(v => {
      sum += v;
      return sum;
    });
  });
  const trendLen = Math.max(0, ...cumData.map(arr => arr.length));
  const hasTrend = trendLen > 1;
  const allMax = Math.max(1, ...cumData.flat()) * 1.05;
  const sx = (i: number): number =>
    padL + (trendLen > 1 ? i / (trendLen - 1) : 0) * (w - padL - padR);
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
        {!hasTrend ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: palette.g600,
              fontFamily: palette.fontText,
              fontSize: 13,
            }}
          >
            {t(
              'Тренд недоступен — добавьте колонку «Неделя» в настройках чарта, ' +
                'чтобы увидеть накопленные потери по периодам.',
            )}
          </div>
        ) : (
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
            {/* Динамические тики: ~6 равномерно по длине тренда. */}
            {Array.from(
              { length: Math.min(6, trendLen) },
              (_, k) => {
                const step = (trendLen - 1) / Math.max(1, Math.min(5, trendLen - 1));
                return Math.round(k * step);
              },
            ).map(i => (
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
              if (cum.length === 0) return null;
              const color = lineColors[si % lineColors.length];
              const pts = cum
                .map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`)
                .join(' ');
              const lx = sx(cum.length - 1);
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
        )}
      </div>
    </div>
  );
};

export default VelocityDiverging;
export type { Palette };
