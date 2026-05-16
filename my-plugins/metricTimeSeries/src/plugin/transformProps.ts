import { ChartProps, getMetricLabel } from '@superset-ui/core';
import {
  WriteoffsTSFormData,
  WriteoffsTSProps,
  SupersetFormDataExtended,
  SupersetThemeExtended,
  TimePoint,
  CategorySeries,
  ChartMode,
  Granularity,
  Unit,
  DataState,
  ValueFormatter,
} from '../types';
import { getPreset } from '../mocks/presets';
import {
  fmtPct,
  fmtSmart,
} from '../utils/formatRussian';
import {
  parseTimeValue,
  isoWeekNumber,
  ruMonthName,
} from '../utils/dateHelpers';
import {
  CATEGORY_PALETTE,
  OTHER_COLOR,
  pickPaletteEntry,
} from '../utils/colorPalette';

interface RawRow {
  [key: string]: unknown;
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

/**
 * Luminance-based dark-mode detection.
 * Mirrors @superset-ui/core isThemeDark (threshold 128) via colorBgContainer.
 */
function detectDarkMode(theme: unknown): boolean {
  const bg = (theme as SupersetThemeExtended | undefined)?.colorBgContainer;
  if (!bg || typeof bg !== 'string' || !bg.startsWith('#')) return false;
  const hex = bg.replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

/**
 * Heuristic to find the time column key in a query result row.
 * Superset uses `__timestamp` for timeseries queries; fall back to any key that
 * parses as a Date.
 */
function findTimeKey(row: RawRow | undefined): string | null {
  if (!row) return null;
  if ('__timestamp' in row) return '__timestamp';
  // Fallback: first key whose value parses as a Date
  for (const key of Object.keys(row)) {
    if (parseTimeValue(row[key])) return key;
  }
  return null;
}

/**
 * Parse a row into a TimePoint (fact/plan/py values + normalized time fields).
 */
function toTimePoint(
  row: RawRow,
  timeKey: string,
  factKey: string | null,
  planKey: string | null,
  pyKey: string | null,
): TimePoint | null {
  const d = parseTimeValue(row[timeKey]);
  if (!d) return null;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return {
    t: typeof row[timeKey] === 'string' ? (row[timeKey] as string) : d.toISOString(),
    year,
    month,
    monthName: ruMonthName(month),
    day,
    week: isoWeekNumber(d),
    fact: factKey ? toNumOrNull(row[factKey]) : null,
    plan: planKey ? toNumOrNull(row[planKey]) : null,
    py: pyKey ? toNumOrNull(row[pyKey]) : null,
  };
}

function toNumOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Build the category series from query 1 results (one row per time×category combo).
 *
 * Steps:
 *   1. Pivot by (time, category) → Map<category, Map<timeKey, value>>.
 *   2. Sort categories by total desc.
 *   3. Trim to `limit`; merge tail into "Прочее".
 *   4. Assign palette colors by rank.
 */
function buildCategorySeries(
  categoryRows: RawRow[],
  timePoints: TimePoint[],
  groupbyColumn: string,
  factKey: string,
  limit: number,
): CategorySeries[] {
  if (!categoryRows.length || !timePoints.length) return [];

  const timeKey = findTimeKey(categoryRows[0]);
  if (!timeKey) return [];

  // Index timePoints by normalized time label for quick lookups
  const timeIdx = new Map<string, number>();
  timePoints.forEach((p, i) => timeIdx.set(p.t, i));

  // category → array of values indexed the same way as timePoints
  const raw = new Map<string, Array<number | null>>();
  const totals = new Map<string, number>();

  categoryRows.forEach(row => {
    const category = String(row[groupbyColumn] ?? 'N/A');
    const d = parseTimeValue(row[timeKey]);
    if (!d) return;
    const tIso =
      typeof row[timeKey] === 'string' ? (row[timeKey] as string) : d.toISOString();
    let idx = timeIdx.get(tIso);
    if (idx == null) {
      // If the string forms mismatch (ISO vs. non-ISO), match by year+month+day
      idx = timePoints.findIndex(
        p =>
          p.year === d.getFullYear() &&
          p.month === d.getMonth() + 1 &&
          p.day === d.getDate(),
      );
      if (idx < 0) return;
    }
    const value = toNumOrNull(row[factKey]);
    let arr = raw.get(category);
    if (!arr) {
      arr = new Array(timePoints.length).fill(null);
      raw.set(category, arr);
    }
    arr[idx] = value;
    totals.set(category, (totals.get(category) ?? 0) + (value ?? 0));
  });

  const ranked = Array.from(raw.entries()).sort(
    ([a], [b]) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0),
  );

  const top = ranked.slice(0, Math.max(1, limit));
  const tail = ranked.slice(Math.max(1, limit));

  const result: CategorySeries[] = top.map(([name, values], i) => {
    const entry = pickPaletteEntry(i);
    return {
      id: name,
      name,
      colorLight: entry.colorLight,
      colorDark: entry.colorDark,
      colorToken: entry.colorToken,
      values: values.slice(),
      total: totals.get(name) ?? 0,
    };
  });

  if (tail.length > 0) {
    const merged: Array<number | null> = new Array(timePoints.length).fill(null);
    let tailTotal = 0;
    tail.forEach(([name, values]) => {
      values.forEach((v, i) => {
        if (v == null) return;
        merged[i] = (merged[i] ?? 0) + v;
      });
      tailTotal += totals.get(name) ?? 0;
    });
    result.push({
      id: '__other__',
      name: 'Прочее',
      colorLight: OTHER_COLOR.colorLight,
      colorDark: OTHER_COLOR.colorDark,
      colorToken: OTHER_COLOR.colorToken,
      values: merged,
      total: tailTotal,
    });
  } else if (result.length === CATEGORY_PALETTE.length) {
    // When we hit palette length exactly, last one still uses OTHER_COLOR grey
    // (prototype convention for "Прочее")
    const last = result[result.length - 1];
    last.colorLight = OTHER_COLOR.colorLight;
    last.colorDark = OTHER_COLOR.colorDark;
    last.colorToken = OTHER_COLOR.colorToken;
  }

  return result;
}

export default function transformProps(chartProps: ChartProps): WriteoffsTSProps {
  const { width, height, formData: fd, queriesData, theme } = chartProps;
  const formData = fd as WriteoffsTSFormData;
  const fdExt = formData as unknown as SupersetFormDataExtended;

  // ── Defaults ──
  const mode: ChartMode = (formData.defaultMode as ChartMode) || 'line';
  const granularity: Granularity =
    (formData.defaultGranularity as Granularity) || 'month';
  const unit: Unit = (formData.defaultUnit as Unit) || 'rub';
  const showBrushButton = formData.showBrushButton ?? true;
  const enableDrillDown = formData.enableDrillDown ?? true;
  const headerText = formData.headerText || 'Динамика списаний';
  const fdRec = formData as unknown as Record<string, unknown>;
  const userSubtitle = formData.subtitleText as string | undefined;
  const subtitleText =
    userSubtitle?.trim() ||
    formatTimeRangeRu(
      (fdRec['time_range'] as string | undefined) ??
        (fdRec['timeRange'] as string | undefined),
    );

  // Number formatting: auto-scaling by magnitude (тыс/млн/млрд) + user suffix.
  // Default suffix is "₽" — fmtSmart applies the correct prefix based on value magnitude.
  const userSuffix = formData.valueSuffix ?? '₽';
  const userDecimals =
    Number(formData.valueDecimals) >= 0 ? Number(formData.valueDecimals) : -1;

  const formatValue: ValueFormatter = v => fmtSmart(v, userDecimals, userSuffix);
  // Axis: suffix-less (shorter labels — "12,4 млрд" instead of "12,4 млрд ₽")
  const formatAxis: ValueFormatter = v => fmtSmart(v, userDecimals, '');
  const formatPctFn: ValueFormatter = fmtPct;

  const isDarkMode = detectDarkMode(theme);

  const seriesLabels = {
    fact: formData.labelFact || 'Факт',
    plan: formData.labelPlan || 'План',
    py: formData.labelPy || 'ПГ',
  };

  // ── Normalize groupby ──
  const groupbyCategory = Array.isArray(formData.groupbyCategory)
    ? (formData.groupbyCategory[0] as string | undefined)
    : (formData.groupbyCategory as string | undefined);

  // ── Mock mode: early return ──
  const mockModeEnabled = formData.mockModeEnabled ?? false;
  if (mockModeEnabled) {
    const preset = getPreset(formData.mockPreset);
    return {
      width,
      height,
      headerText: formData.headerText || `Динамика — ${preset.label}`,
      dataState: 'populated' as DataState,
      timePoints: preset.timePoints,
      categories: preset.categories,
      subtitleText,
      defaultMode: mode,
      defaultGranularity: granularity,
      defaultUnit: unit,
      showBrushButton,
      enableDrillDown,
      formatValue,
      formatAxis,
      formatPct: formatPctFn,
      seriesLabels,
      isDarkMode,
      theme,
      mockModeEnabled: true,
    };
  }

  // ── Real data path ──
  const seriesRows = ((queriesData?.[0]?.data ?? []) as RawRow[]) || [];
  const categoryRows = ((queriesData?.[1]?.data ?? []) as RawRow[]) || [];

  // Guard: no data at all
  if (!seriesRows.length) {
    return {
      width,
      height,
      headerText,
      dataState: 'empty' as DataState,
      timePoints: [],
      categories: [],
      subtitleText,
      defaultMode: mode,
      defaultGranularity: granularity,
      defaultUnit: unit,
      showBrushButton,
      enableDrillDown,
      formatValue,
      formatAxis,
      formatPct: formatPctFn,
      seriesLabels,
      isDarkMode,
      theme,
      mockModeEnabled: false,
    };
  }

  const timeKey = findTimeKey(seriesRows[0]);
  if (!timeKey) {
    return {
      width,
      height,
      headerText,
      dataState: 'error' as DataState,
      errorMessage:
        'Не удалось найти временную колонку в результатах запроса. ' +
        'Проверьте настройку "Time Column" в датасете.',
      timePoints: [],
      categories: [],
      subtitleText,
      defaultMode: mode,
      defaultGranularity: granularity,
      defaultUnit: unit,
      showBrushButton,
      enableDrillDown,
      formatValue,
      formatAxis,
      formatPct: formatPctFn,
      seriesLabels,
      isDarkMode,
      theme,
      mockModeEnabled: false,
    };
  }

  const factKey = formData.metricFact ? getMetricLabel(formData.metricFact) : null;
  const planKey = formData.metricPlan ? getMetricLabel(formData.metricPlan) : null;
  const pyKey = formData.metricPy ? getMetricLabel(formData.metricPy) : null;

  // Build time points, sorted ascending by time
  const timePoints = seriesRows
    .map(row => toTimePoint(row, timeKey, factKey, planKey, pyKey))
    .filter((p): p is TimePoint => p != null)
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });

  // Build category series from query 1 (optional)
  let categories: CategorySeries[] = [];
  if (groupbyCategory && categoryRows.length && factKey) {
    const limit = Number(formData.categoriesLimit) || 5;
    categories = buildCategorySeries(
      categoryRows,
      timePoints,
      groupbyCategory,
      factKey,
      limit,
    );
  }

  // Is the payload served from cache? Superset marks `is_cached: true` on
  // cached queries; surface this as the "stale" state so the user is aware.
  const isCachedQuery = Boolean(
    (queriesData?.[0] as { is_cached?: boolean } | undefined)?.is_cached,
  );
  // Categories may only appear partially if the second query has issues.
  const categoriesExpected = Boolean(groupbyCategory);
  const categoriesPartial = categoriesExpected && categoryRows.length === 0;

  // Data state — distinguish partial (no plan/py/categories) from populated / stale
  const dataState: DataState = (() => {
    if (!timePoints.length) return 'empty';
    if (!factKey) return 'error';
    const hasAnyFact = timePoints.some(p => p.fact != null);
    if (!hasAnyFact) return 'empty';
    const expectedPlan = planKey != null;
    const expectedPy = pyKey != null;
    const hasPlan = expectedPlan ? timePoints.some(p => p.plan != null) : true;
    const hasPy = expectedPy ? timePoints.some(p => p.py != null) : true;
    if (!hasPlan || !hasPy || categoriesPartial) return 'partial';
    if (isCachedQuery) return 'stale';
    return 'populated';
  })();

  // Use fdExt just to cover the snake_case fallback for adhoc_filters
  // (currently unused in downstream logic but kept for future feature parity)
  void fdExt;

  return {
    width,
    height,
    headerText,
    subtitleText,
    dataState,
    errorMessage: dataState === 'error' ? 'Не задана мера "Факт"' : undefined,
    timePoints,
    categories,
    defaultMode: mode,
    defaultGranularity: granularity,
    defaultUnit: unit,
    showBrushButton,
    enableDrillDown,
    formatValue,
    formatAxis,
    formatPct: formatPctFn,
    seriesLabels,
    isDarkMode,
    theme,
    mockModeEnabled: false,
  };
}
