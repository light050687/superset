import type {
  AdhocFilter,
  QueryFormMetric,
  SqlaFormData,
} from '@superset-ui/core';

// ═══════════════════════════════════════
// Direction / thresholds
// ═══════════════════════════════════════

/** Направление «хорошо/плохо» для интерпретации факта относительно плана. */
export type Direction = 'less_is_better' | 'more_is_better';

/** Статус строки — используется для цвета значения / bar-а. */
export type RowStatus = 'good' | 'warn' | 'bad' | 'neutral';

/** Варианты сортировки. */
export type SortBy =
  | 'factDesc'
  | 'factAsc'
  | 'deltaPlanDesc'
  | 'deltaPyDesc'
  | 'storesDesc'
  | 'nameAsc';

// ═══════════════════════════════════════
// DataState (Design System v2.0)
// ═══════════════════════════════════════

export type DataState =
  | 'loading'
  | 'error'
  | 'empty'
  | 'partial'
  | 'stale'
  | 'populated';

// ═══════════════════════════════════════
// Domain data
// ═══════════════════════════════════════

/** Одна строка чарта — формат / категория / группа. */
export interface FormatRow {
  id: string;
  name: string;
  stores: number | null;
  rate: number;
  plan: number | null;
  py: number | null;
  spark: number[];
  status: RowStatus;
  /** Дельта к плану (rate − plan). Для less_is_better положительное = плохо. */
  deltaPlan: number | null;
  /** Дельта к прошлому году (rate − py). */
  deltaPy: number | null;
  /** Опциональный список подэлементов для mock-режима (магазины формата и т.п.). */
  storesList?: Array<{
    name: string;
    rate: number;
    plan: number | null;
    py: number | null;
  }>;
}


// ═══════════════════════════════════════
// FormData (snake_case в controlPanel, camelCase в transformProps)
// ═══════════════════════════════════════

/**
 * Ключи formData. В controlPanel мы используем snake_case, в transformProps Superset
 * конвертирует их в camelCase, поэтому в типе формдаты мы описываем обе формы сразу.
 */
export interface BulletChartFormData extends SqlaFormData {
  // Design mode
  mockModeEnabled?: boolean;
  mock_mode_enabled?: boolean;
  mockPreset?: string;
  mock_preset?: string;
  mockCustomJson?: string;
  mock_custom_json?: string;

  // Data
  groupbyCategory?: string | string[];
  groupby_category?: string | string[];
  metricFact?: QueryFormMetric;
  metric_fact?: QueryFormMetric;
  metricPlan?: QueryFormMetric;
  metric_plan?: QueryFormMetric;
  metricPy?: QueryFormMetric;
  metric_py?: QueryFormMetric;
  metricStores?: QueryFormMetric;
  metric_stores?: QueryFormMetric;

  // Sparkline
  sparklineEnabled?: boolean;
  sparkline_enabled?: boolean;
  sparklineTimeGrain?: string;
  sparkline_time_grain?: string;
  sparklinePoints?: number;
  sparkline_points?: number;

  // Direction + tolerance (для статусной зоны «wn»)
  direction?: Direction;
  statusTolerancePct?: number;
  status_tolerance_pct?: number;

  // Display
  headerText?: string;
  header_text?: string;
  subheaderText?: string;
  subheader_text?: string;
  valueSuffix?: string;
  value_suffix?: string;
  autoFormatRussian?: boolean;
  auto_format_russian?: boolean;
  decimals?: number;
  valueUnitLabel?: string;
  value_unit_label?: string;

  // Interaction
  defaultSort?: SortBy;
  default_sort?: SortBy;
  filterWorseThanPlanDefault?: boolean;
  filter_worse_than_plan_default?: boolean;
  enableCrossFilter?: boolean;
  enable_cross_filter?: boolean;
  enableDetailModal?: boolean;
  enable_detail_modal?: boolean;
  detailGroupby?: string | string[];
  detail_groupby?: string | string[];

  // Time (inherited from legacyTimeseriesTime)
  timeRange?: string;
  time_range?: string;
  granularitySqla?: string;
  granularity_sqla?: string;

  // Filters
  adhocFilters?: AdhocFilter[];
}

// ═══════════════════════════════════════
// Detail query (для DetailModal)
// ═══════════════════════════════════════

export interface DetailQueryParams {
  datasourceId: number;
  datasourceType: string;
  detailGroupby: string;
  categoryColumn: string;
  categoryValue: string;
  metrics: QueryFormMetric[];
  metricLabels: {
    fact: string;
    plan: string | null;
    py: string | null;
    stores: string | null;
  };
  timeRange?: string;
  granularity?: string;
  filters: Array<{ col: string; op: string; val?: unknown }>;
  extras: Record<string, unknown>;
}

// ═══════════════════════════════════════
// Value formatters (подготовлены в transformProps)
// ═══════════════════════════════════════

export type ValueFormatter = (n: number) => string;

export interface Formatters {
  value: ValueFormatter;
  deltaPP: ValueFormatter;
  integer: ValueFormatter;
}

// ═══════════════════════════════════════
// Props, отдаваемые в React-компонент
// ═══════════════════════════════════════

export interface BulletChartProps {
  width: number;
  height: number;
  dataState: DataState;

  headerText: string;
  subheaderText: string;

  rows: FormatRow[];
  /** Единая шкала для всех bullet-баров — max(rate, plan, py) × 1.1. */
  scaleMax: number;
  direction: Direction;

  // Настройки сортировки / фильтра (начальные)
  defaultSort: SortBy;
  filterWorseThanPlanDefault: boolean;

  // Взаимодействие
  enableCrossFilter: boolean;
  enableDetailModal: boolean;

  // Форматирование
  formatters: Formatters;
  valueSuffix: string;
  valueUnitLabel: string;

  // Тема
  isDarkMode: boolean;
  theme: Record<string, unknown>;

  // Drill-down
  detailQueryParams?: DetailQueryParams;

  // Metadata
  mockModeEnabled: boolean;
}

// Расширения для типобезопасной работы с formData/theme
export interface SupersetFormDataExtended {
  adhocFilters?: Array<Record<string, unknown>>;
  adhoc_filters?: Array<Record<string, unknown>>;
  timeRange?: string;
  time_range?: string;
  granularitySqla?: string;
  granularity_sqla?: string;
}

export interface SupersetThemeExtended {
  colorBgContainer?: string;
}

export interface DatasourceInfo {
  id?: number;
  type?: string;
}
