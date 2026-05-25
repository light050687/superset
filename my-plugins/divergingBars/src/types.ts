import type {
  QueryFormData,
  QueryFormMetric,
  SupersetTheme,
} from '@superset-ui/core';

/** Параметры серверного запроса для постраничной подгрузки магазинов. */
export interface StoresQueryParams {
  datasourceId: number;
  datasourceType: string;
  codeCol?: string;
  nameCol?: string;
  cityCol?: string;
  formatCol?: string;
  weekCol?: string;
  lossLabel?: string;
  turnoverLabel?: string;
  metrics: QueryFormMetric[];
  timeRange?: string;
  granularity?: string;
  filters: Array<{ col: string; op: string; val?: unknown }>;
  extras: Record<string, unknown>;
  /** Активный режим сравнения — определяет, как формировать time_offsets. */
  comparisonMode?: ComparisonMode;
  /** Для custom-режима: текущий и сравниваемый диапазоны (ISO-строки). */
  customCurrentRange?: [string, string];
  customPreviousRange?: [string, string];
}

/**
 * Режим сравнения «период-к-периоду».
 *
 * - `prev_period` — предыдущий период такой же длины (Superset 'inherit').
 * - `prev_week` / `prev_month` / `prev_quarter` / `prev_year` — фиксированные
 *   shift-строки в формате Superset time_compare ('1 week ago' и т.д.).
 * - `custom` — два независимых диапазона, задаваемых через `<RangePicker>`.
 */
export type ComparisonMode =
  | 'prev_period'
  | 'prev_week'
  | 'prev_month'
  | 'prev_quarter'
  | 'prev_year'
  | 'custom';

/**
 * Legacy-тип горизонта — оставлен ради back-compat с saved-чартами,
 * где formData.default_horizon ∈ {'wow','4w','mom','cum'}. В новом коде
 * НЕ использовать — нужен только для migration в transformProps.
 *
 * @deprecated Используй {@link ComparisonMode}.
 */
export type Horizon = 'wow' | '4w' | 'mom' | 'cum';

/** Метрика для отображения: рубли или % к ТО. */
export type MetricMode = 'rub' | 'pct';

/** Направление темпа для фильтра-чипов. */
export type DirectionFilter = 'all' | 'grow' | 'shrink' | 'flat';

/**
 * Данные одного магазина — period-over-period.
 *
 * `prevValueRub`/`currValueRub` — агрегированные суммы метрики потерь
 * за прошлый и текущий период соответственно. `*Pct` — то же в % к ТО.
 *
 * `trendRub`/`trendPct` — опциональные ряды по main-диапазону (для DetailModal).
 * Длина определяется длительностью диапазона (день/неделя — на стороне backend).
 * Если backend не вернул тренд — модалка показывает только summary, без графика.
 */
export interface Store {
  id: string;
  code: string;
  name: string;
  shortLabel: string;
  city: string;
  format: string;
  formatName: string;
  plan: number;
  to: number;
  prevValueRub: number;
  currValueRub: number;
  prevValuePct: number;
  currValuePct: number;
  /** Опционально: ряд по main-периоду для тренда (модалка). */
  trendRub?: number[];
  trendPct?: number[];
  /** Подписи к точкам trend (например '2026-W19'); aligned с trendRub. */
  trendLabels?: string[];
}

/** Описание формата магазина (для фильтра и цветовой маркировки). */
export interface FormatDef {
  id: string;
  name: string;
  color: string;
  count?: number;
  plan?: number;
}

/** Результат computeTempo для одного магазина — period-over-period. */
export interface TempoResult {
  prev: number;
  curr: number;
  tempo: number;
  pctChange: number;
  absDelta: number;
}

/** Состояние отображения — 6 обязательных по DS 2.0 состояний. */
export type DataState =
  | 'loading'
  | 'error'
  | 'empty'
  | 'partial'
  | 'stale'
  | 'populated';

/** Что именно «частично»: чего не хватает при state=partial. */
export interface PartialWarning {
  missingColumn?: string;
  message: string;
}

/** FormData плагина — то, что приходит из controlPanel. */
export interface VelocityDivergingFormData extends QueryFormData {
  viz_type: 'ext-velocity-diverging';
  header_text?: string;
  subtitle_text?: string;
  /** @deprecated Используй {@link default_comparison_mode}; migration в transformProps. */
  default_horizon?: Horizon;
  default_comparison_mode?: ComparisonMode;
  /** Runtime override режима сравнения, выставляется компонентом (не из control panel). */
  comparison_mode?: ComparisonMode;
  /** Custom-режим: текущий период (ISO 'YYYY-MM-DD : YYYY-MM-DD'). */
  custom_current_range?: string;
  /** Custom-режим: период для сравнения. */
  custom_previous_range?: string;
  default_metric?: MetricMode;
  show_cumulative_view?: boolean;
  show_detail_modal?: boolean;
  show_csv_export?: boolean;
  show_summary_strip?: boolean;
  format_mapping_json?: string;
  mock_mode_enabled?: boolean;
  mock_preset?: string;
  metric_loss?: QueryFormMetric;
  metric_turnover?: QueryFormMetric;
  groupby_store_code?: string | string[];
  groupby_store_name?: string | string[];
  groupby_city?: string | string[];
  groupby_format?: string | string[];
  groupby_week?: string | string[];
  page_size?: number;
}

/** Props главного компонента, результат работы transformProps. */
export interface VelocityDivergingProps {
  width: number;
  height: number;
  headerText: string;
  subtitleText: string;
  dataState: DataState;
  partialWarning?: PartialWarning;
  errorMessage?: string;
  stores: Store[];
  formats: FormatDef[];
  /** Режим сравнения по умолчанию — initial state для dropdown в карточке. */
  defaultComparisonMode: ComparisonMode;
  /** Дефолт custom-диапазонов (если режим = custom при первом монтировании). */
  customCurrentRange?: [string, string];
  customPreviousRange?: [string, string];
  defaultMetric: MetricMode;
  showCumulativeView: boolean;
  showDetailModal: boolean;
  showCsvExport: boolean;
  showSummaryStrip: boolean;
  isDarkMode: boolean;
  theme?: SupersetTheme;
  /** Mock-режим включён в control panel — рендерим бейдж «ТЕСТ» в шапке. */
  mockModeEnabled: boolean;
  /** Размер страницы в карточке (server-side pagination). 20 по умолчанию. */
  pageSize: number;
  /** Серверный запрос дополнительной страницы, если нет mock-режима. */
  queryParams?: StoresQueryParams;
}

/** Маппинг имени CSS-переменной (без `--`) на описание формата. */
export type FormatColorToken =
  | 'c-sky'
  | 'c-violet'
  | 'c-tangerine'
  | 'c-fuchsia'
  | 'c-amber'
  | 'g500';
