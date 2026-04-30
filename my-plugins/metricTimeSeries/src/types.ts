import { QueryFormData, QueryFormMetric, supersetTheme } from '@superset-ui/core';

// ═══════════════════════════════════════
// Superset Runtime Types
// ═══════════════════════════════════════

/**
 * Extended formData with camelCase keys from Superset's lodash conversion.
 * Superset applies lodash.camelCase to all controlPanel snake_case keys
 * before passing formData to transformProps.
 */
export interface SupersetFormDataExtended {
  adhocFilters?: Array<Record<string, unknown>>;
  adhoc_filters?: Array<Record<string, unknown>>;
  timeRange?: string;
  time_range?: string;
  granularitySqla?: string;
  granularity_sqla?: string;
  timeGrainSqla?: string;
  time_grain_sqla?: string;
  mockModeEnabled?: boolean;
  mock_mode_enabled?: boolean;
  [key: string]: unknown;
}

/** Superset theme extended with Ant Design v5 tokens */
export interface SupersetThemeExtended {
  colorBgContainer?: string;
  [key: string]: unknown;
}

// ═══════════════════════════════════════
// Enums & Utility Types
// ═══════════════════════════════════════

/** Chart render mode */
export type ChartMode = 'line' | 'stack-bar' | 'stack-area';

/** Display granularity (client-side aggregation above base time_grain) */
export type Granularity = 'year' | 'month' | 'week' | 'day';

/** Units for Y-axis and tooltip values */
export type Unit = 'rub' | 'pct';

/** Mock preset identifier */
export type MockPreset = 'writeoffs' | 'losses' | 'incidents' | 'custom';

/** Component data state per Design System v2.0 (6 mandatory states) */
export type DataState = 'loading' | 'error' | 'empty' | 'partial' | 'stale' | 'populated';

/** Series visibility toggle state */
export interface SeriesHidden {
  fact: boolean;
  plan: boolean;
  py: boolean;
}

/** Selection window (indices into the full time axis, inclusive) */
export interface Selection {
  from: number;
  to: number;
}

// ═══════════════════════════════════════
// Data model (transformProps → component)
// ═══════════════════════════════════════

/**
 * One row of the time series.
 * `t` is the original time label (from x_axis or time_col).
 * Category values live in a separate map to keep the flat shape tidy.
 */
export interface TimePoint {
  /** ISO date string or whatever string label came from the query */
  t: string;
  /** Year number parsed from the label (for year-aggregation + x-axis labels) */
  year: number;
  /** Month number 1..12 (for month-aggregation + x-axis labels) */
  month: number;
  /** Russian month name (Январь, Февраль, ...) — cached at parse time */
  monthName: string;
  /** Day of month 1..31 (for day-aggregation + tooltip) */
  day: number;
  /** ISO-like week number of year (for week-aggregation + x-axis labels) */
  week: number;
  fact: number | null;
  plan: number | null;
  py: number | null;
}

/** Parallel arrays per category (len = timePoints.length) */
export interface CategorySeries {
  /** Category id/value from the groupby column */
  id: string;
  /** Display name (same as id by default) */
  name: string;
  /** Color hex (resolved from palette at transformProps time) */
  colorLight: string;
  colorDark: string;
  /** Token CSS var name (e.g. '--c-sky') used for styled elements */
  colorToken: string;
  /** Values parallel to timePoints (null if no data for that point) */
  values: Array<number | null>;
  /** Sum across time window (used for ordering + deciding what's "other") */
  total: number;
}

// ═══════════════════════════════════════
// Form Data (controlPanel → buildQuery → transformProps)
// ═══════════════════════════════════════

export interface WriteoffsTSFormData extends QueryFormData {
  // ── Metrics (3 independent) ──
  metricFact: QueryFormMetric;
  metricPlan?: QueryFormMetric;
  metricPy?: QueryFormMetric;

  // ── Category breakdown ──
  groupbyCategory?: string | string[];
  categoriesLimit?: number;

  // ── Display defaults (renderTrigger) ──
  headerText?: string;
  defaultMode: ChartMode;
  defaultGranularity: Granularity;
  defaultUnit: Unit;
  showBrushButton: boolean;
  enableDrillDown: boolean;

  // ── Number formatting ──
  valueDecimals?: number;
  valueSuffix?: string;

  // ── Series labels (user-customizable) ──
  labelFact?: string;
  labelPlan?: string;
  labelPy?: string;

  // ── Mock mode ──
  mockModeEnabled?: boolean;
  mockPreset?: MockPreset;
  mockCustomJson?: string;
}

// ═══════════════════════════════════════
// Component Props (transformProps → component)
// ═══════════════════════════════════════

export type ValueFormatter = (n: number | null) => string;

export interface WriteoffsTSProps {
  width: number;
  height: number;

  /** Card header text (from controlPanel or default) */
  headerText: string;

  /** 6-state data status per Design System v2.0 */
  dataState: DataState;
  /** Optional error message when dataState === 'error' */
  errorMessage?: string;

  // ── Data ──
  /** Time points sorted ascending by `t`. Aggregation is done client-side on top. */
  timePoints: TimePoint[];
  /** Category breakdown (empty array if groupby not configured). */
  categories: CategorySeries[];

  // ── Defaults from controlPanel ──
  defaultMode: ChartMode;
  defaultGranularity: Granularity;
  defaultUnit: Unit;
  showBrushButton: boolean;
  enableDrillDown: boolean;

  // ── Formatters ──
  formatValue: ValueFormatter;
  formatAxis: ValueFormatter;
  formatPct: ValueFormatter;

  // ── Labels (Russian, ready for display) ──
  seriesLabels: {
    fact: string;
    plan: string;
    py: string;
  };

  // ── Theme ──
  isDarkMode: boolean;
  theme: typeof supersetTheme;

  // ── Mock mode ──
  mockModeEnabled: boolean;
}
