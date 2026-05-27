import { ChartProps, getMetricLabel } from '@superset-ui/core';
import type {
  DataState,
  DrillQueryParams,
  IconName,
  QueryResult,
  QueryRow,
  RankedBarsFormData,
  RankedBarsProps,
  RankedRow,
  SortMode,
  UnitMode,
} from '../types';
import { resolveIcon } from '../utils/icons';
import { normalizeColorToken } from '../utils/colors';
import {
  EXPENSES_PRESET,
  LOSSES_PRESET,
  parseCustomMockJson,
} from '../mocks/presets';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function asNumberOrNull(raw: unknown): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * DS 2.0 локализация Superset time_range пресетов в русский subtitle.
 */
function formatTimeRangeRu(tr: string | undefined): string {
  if (!tr || tr === 'No filter') return 'за период';
  const map: Record<string, string> = {
    'Last day': 'за день',
    'Last week': 'за неделю',
    'Last month': 'за месяц',
    'Last quarter': 'за квартал',
    'Last year': 'за год',
    Today: 'сегодня',
    'This week': 'за эту неделю',
    'This month': 'за этот месяц',
    'This year': 'за этот год',
    'previous calendar week': 'за прошлую неделю',
    'previous calendar month': 'за прошлый месяц',
    'previous calendar year': 'за прошлый год',
  };
  return map[tr] ?? tr;
}

function getFirstGroupbyCol(formData: RankedBarsFormData): string | null {
  const g = formData.groupby;
  if (Array.isArray(g)) {
    const first = g[0];
    return typeof first === 'string' ? first : null;
  }
  return typeof g === 'string' ? g : null;
}

function getColumnName(col: unknown): string | null {
  if (typeof col === 'string') return col;
  if (col && typeof col === 'object' && 'label' in col) {
    return (col as { label?: string }).label ?? null;
  }
  return null;
}

/**
 * Returns a new array with `sharePct`, `sharePrevPct`, and `deltaPP` filled in.
 * Pure — does not mutate the input.
 */
function computeShareAndDelta(rows: RankedRow[]): RankedRow[] {
  const totalCurrent = rows.reduce((s, r) => s + (r.value || 0), 0);
  const totalPrev = rows.reduce(
    (s, r) => s + (r.valuePrev != null ? r.valuePrev : 0),
    0,
  );
  if (totalCurrent <= 0) {
    return rows.map(r => ({
      ...r,
      sharePct: 0,
      sharePrevPct: r.valuePrev != null ? 0 : null,
      deltaPP: 0,
    }));
  }
  return rows.map(r => {
    const sharePct = (r.value / totalCurrent) * 100;
    let sharePrevPct: number | null = null;
    let deltaPP = 0;
    if (r.valuePrev != null && totalPrev > 0) {
      sharePrevPct = (r.valuePrev / totalPrev) * 100;
      deltaPP = sharePct - sharePrevPct;
    }
    return { ...r, sharePct, sharePrevPct, deltaPP };
  });
}

/**
 * Group time-series sparkline query into a map keyed by dimension id.
 * Returns last 8 values per dimension to match ref prototype width.
 */
function buildSparklineMap(
  sparkData: QueryRow[] | undefined,
  groupbyCol: string | null,
  metricLabel: string,
): Map<string, number[]> {
  const map = new Map<string, number[]>();
  if (!sparkData || !groupbyCol) return map;

  for (const row of sparkData) {
    const key = String(row[groupbyCol] ?? '');
    if (!key) continue;
    const val = asNumberOrNull(row[metricLabel]);
    if (val == null) continue;
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(val);
    } else {
      map.set(key, [val]);
    }
  }
  // Trim each series to last 8 points.
  map.forEach((arr, k) => {
    if (arr.length > 8) {
      map.set(k, arr.slice(arr.length - 8));
    }
  });
  return map;
}

function mapPresetToRows(preset: string, customJson?: string): RankedRow[] {
  let base: RankedRow[];
  if (preset === 'expenses') {
    base = EXPENSES_PRESET.map(r => ({ ...r, spark: [...r.spark] }));
  } else if (preset === 'custom') {
    base = parseCustomMockJson(customJson);
  } else {
    base = LOSSES_PRESET.map(r => ({ ...r, spark: [...r.spark] }));
  }
  return computeShareAndDelta(base);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main transform
// ─────────────────────────────────────────────────────────────────────────────

export default function transformProps(chartProps: ChartProps): RankedBarsProps {
  const {
    width,
    height,
    formData: rawFormData,
    queriesData = [],
    hooks,
    filterState,
    theme,
  } = chartProps as ChartProps & {
    hooks?: { setDataMask?: RankedBarsProps['setDataMask'] };
  };

  const formData = rawFormData as unknown as RankedBarsFormData;
  const queries = queriesData as QueryResult[];
  const primary: QueryResult | undefined = queries[0];
  const sparkQuery: QueryResult | undefined = queries[1];

  // ── Defaults ──────────────────────────────────────────────────────────────
  const defaultUnit: UnitMode = formData.defaultUnit ?? 'rub';
  const defaultSort: SortMode = formData.defaultSort ?? 'sum';
  const topNVisible = Math.max(3, Math.min(15, formData.topNVisible ?? 5));
  const invertDeltaGood = formData.invertDeltaGood ?? true;
  const headerText = formData.headerText ?? 'Рейтинг';
  // Если headerSubtitlePrefix не задан явно — берём активный time_range и
  // переводим в русский («Last year» → «за год»). DS 2.0 канон.
  const userSubtitle = formData.headerSubtitlePrefix as string | undefined;
  const fdRec = formData as unknown as Record<string, unknown>;
  const headerSubtitlePrefix = userSubtitle?.trim() || '';
  const showSparkline = formData.showSparkline ?? true;
  const showTotalInHeader = formData.showTotalInHeader ?? true;
  const showGhostPrevBar = formData.showGhostPrevBar ?? true;
  const showHoverTooltip = formData.showHoverTooltip ?? true;
  const unitSuffixRub = formData.unitSuffixRub ?? 'млн ₽';
  const decimalsValue = formData.decimalsValue ?? 1;
  const decimalsDelta = formData.decimalsDelta ?? 2;
  const decimalsShare = formData.decimalsShare ?? 1;
  const enableDrillModal = formData.enableDrillModal ?? true;
  const enableAllItemsModal = formData.enableAllItemsModal ?? true;
  const enableCrossFilter = formData.enableCrossFilter ?? true;

  // ── Mock mode short-circuit ──────────────────────────────────────────────
  if (formData.mockModeEnabled) {
    const mockRows = mapPresetToRows(
      formData.mockPreset ?? 'losses',
      formData.mockCustomJson,
    );
    const total = mockRows.reduce((s, r) => s + r.value, 0);
    return {
      width,
      height,
      dataState: mockRows.length > 0 ? 'populated' : 'empty',
      rows: mockRows,
      totalSum: total,
      headerText,
      headerSubtitlePrefix,
      showTotalInHeader,
      showSparkline,
      showGhostPrevBar,
      showHoverTooltip,
      invertDeltaGood,
      defaultSort,
      defaultUnit,
      topNVisible,
      unitSuffixRub,
      decimalsValue,
      decimalsDelta,
      decimalsShare,
      enableDrillModal,
      enableAllItemsModal,
      /* В моке cross-filter — чисто visual highlight через local state
         в RankedBars (setDataMask не вызывается). */
      enableCrossFilter: true,
      hasPrevMetric: true,
      /* Stub в моке: DetailModal внутри сам строит buildMockDrill(row).
         Реальные значения не используются — нужны только чтобы guard
         в RankedBars пропустил рендер модалки и чтобы renderTopList
         не упал в "Измерение не настроено". */
      drillQueryParams: {
        datasource: 'mock',
        groupbyCol: 'mock',
        storeDim: 'mock_store',
        skuDim: 'mock_sku',
        metric: 'count' as unknown as DrillQueryParams['metric'],
        detailTopN: 5,
      },
      setDataMask: hooks?.setDataMask,
      filterState,
      isMockMode: true,
      themeMode: inferThemeMode(theme),
    };
  }

  // ── Extract query metadata ───────────────────────────────────────────────
  const metric = formData.metric;
  const groupbyCol = getFirstGroupbyCol(formData);

  if (!metric) {
    return buildEmptyProps(
      'empty',
      'Выберите основную метрику в разделе «Запрос»',
    );
  }
  if (!groupbyCol) {
    return buildEmptyProps('empty', 'Выберите измерение в разделе «Запрос»');
  }

  const subCol = getColumnName(formData.subColumn);
  const iconCol = getColumnName(formData.iconColumn);
  const colorCol = getColumnName(formData.colorColumn);
  const nameCol = getColumnName(formData.nameColumn) ?? groupbyCol;

  const metricLabel = getMetricLabel(metric);
  const metricPrevLabel = formData.metricPrev
    ? getMetricLabel(formData.metricPrev)
    : null;
  const hasPrevMetric = metricPrevLabel != null;

  // ── Handle error state ───────────────────────────────────────────────────
  const errorMessage = primary?.error_message ?? undefined;
  if (errorMessage) {
    return buildEmptyProps('error', errorMessage);
  }

  // ── Handle loading / empty states ────────────────────────────────────────
  const rawRows: QueryRow[] = (primary?.data ?? []) as QueryRow[];

  const sparkMap = showSparkline
    ? buildSparklineMap(sparkQuery?.data as QueryRow[] | undefined, groupbyCol, metricLabel)
    : new Map<string, number[]>();

  const rawMappedRows: RankedRow[] = rawRows
    .map((row, idx): RankedRow | null => {
      const id = row[groupbyCol];
      if (id == null) return null;
      const idStr = String(id);
      const value = asNumberOrNull(row[metricLabel]);
      if (value == null) return null;

      const valuePrev = metricPrevLabel
        ? asNumberOrNull(row[metricPrevLabel])
        : null;

      const displayName =
        nameCol && nameCol !== groupbyCol
          ? String(row[nameCol] ?? idStr)
          : idStr;
      const sub = subCol ? String(row[subCol] ?? '') : '';
      const iconName: IconName = resolveIcon(iconCol ? row[iconCol] : undefined);
      const colorToken = normalizeColorToken(
        colorCol ? row[colorCol] : undefined,
        idx,
      );
      const spark = sparkMap.get(idStr) ?? [];

      return {
        id: idStr,
        name: displayName,
        sub,
        iconName,
        colorToken,
        value,
        valuePrev,
        sharePct: 0,
        sharePrevPct: null,
        deltaPP: 0,
        spark,
      };
    })
    .filter((r): r is RankedRow => r !== null);

  const rows = computeShareAndDelta(rawMappedRows);

  const totalSum = rows.reduce((s, r) => s + r.value, 0);

  /* DS 2.0 §06 «Состояния»: empty / partial / stale / populated.
     - empty: нет строк
     - partial: меньше строк чем requested topN ИЛИ бэкенд отверг фильтры
     - stale: данные пришли из кеша (приоритет ниже partial)
     - populated: всё хорошо.
     'loading' и 'error' приходят отдельно через chartStatus prop. */
  let dataState: DataState;
  if (rows.length === 0) {
    dataState = 'empty';
  } else if (
    rows.length < topNVisible ||
    ((primary as unknown as { rejected_filters?: unknown[] })?.rejected_filters
      ?.length ?? 0) > 0
  ) {
    dataState = 'partial';
  } else if (
    (primary as unknown as { is_cached?: boolean })?.is_cached
  ) {
    dataState = 'stale';
  } else {
    dataState = 'populated';
  }

  // ── Build drill query params ─────────────────────────────────────────────
  const drillQueryParams: DrillQueryParams | null = enableDrillModal
    ? {
        datasource: formData.datasource,
        groupbyCol,
        storeDim: getColumnName(formData.storeDim) ?? undefined,
        skuDim: getColumnName(formData.skuDim) ?? undefined,
        metric,
        timeRange: formData.timeRange,
        adhocFilters: formData.adhocFilters,
        detailTopN: formData.detailTopN ?? 5,
      }
    : null;

  return {
    width,
    height,
    dataState,
    rows,
    totalSum,
    headerText,
    headerSubtitlePrefix,
    showTotalInHeader,
    showSparkline,
    showGhostPrevBar: showGhostPrevBar && hasPrevMetric,
    showHoverTooltip,
    invertDeltaGood,
    defaultSort,
    defaultUnit,
    topNVisible,
    unitSuffixRub,
    decimalsValue,
    decimalsDelta,
    decimalsShare,
    enableDrillModal,
    enableAllItemsModal,
    enableCrossFilter,
    hasPrevMetric,
    drillQueryParams,
    setDataMask: hooks?.setDataMask,
    filterState,
    isMockMode: false,
    themeMode: inferThemeMode(theme),
  };

  // ── Inline helpers ───────────────────────────────────────────────────────
  function buildEmptyProps(state: DataState, message?: string): RankedBarsProps {
    return {
      width,
      height,
      dataState: state,
      errorMessage: message,
      rows: [],
      totalSum: 0,
      headerText,
      headerSubtitlePrefix,
      showTotalInHeader,
      showSparkline,
      showGhostPrevBar,
      showHoverTooltip,
      invertDeltaGood,
      defaultSort,
      defaultUnit,
      topNVisible,
      unitSuffixRub,
      decimalsValue,
      decimalsDelta,
      decimalsShare,
      enableDrillModal,
      enableAllItemsModal,
      enableCrossFilter,
      hasPrevMetric,
      drillQueryParams: null,
      setDataMask: hooks?.setDataMask,
      filterState,
      isMockMode: false,
      themeMode: inferThemeMode(theme),
    };
  }
}

function inferThemeMode(theme: unknown): 'light' | 'dark' {
  if (theme && typeof theme === 'object') {
    const maybeDark = (theme as { isDark?: boolean }).isDark;
    if (typeof maybeDark === 'boolean') return maybeDark ? 'dark' : 'light';
    const mode = (theme as { mode?: string }).mode;
    if (mode === 'dark') return 'dark';
  }
  return 'light';
}
