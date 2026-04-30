import type {
  QueryFormData,
  QueryFormMetric,
  SupersetTheme,
} from '@superset-ui/core';

/** Горизонт сравнения. */
export type Horizon = 'wow' | '4w' | 'mom' | 'cum';

/** Метрика для отображения: рубли или % к ТО. */
export type MetricMode = 'rub' | 'pct';

/** Направление темпа для фильтра-чипов. */
export type DirectionFilter = 'all' | 'grow' | 'shrink' | 'flat';

/** Данные одного магазина (плоская структура, с 12-недельными рядами). */
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
  weeksRub: number[];
  weeksPct: number[];
}

/** Описание формата магазина (для фильтра и цветовой маркировки). */
export interface FormatDef {
  id: string;
  name: string;
  color: string;
  count?: number;
  plan?: number;
}

/** Результат computeTempo для одного магазина и горизонта. */
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
  default_horizon?: Horizon;
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
}

/** Props главного компонента, результат работы transformProps. */
export interface VelocityDivergingProps {
  width: number;
  height: number;
  headerText: string;
  dataState: DataState;
  partialWarning?: PartialWarning;
  errorMessage?: string;
  stores: Store[];
  formats: FormatDef[];
  defaultHorizon: Horizon;
  defaultMetric: MetricMode;
  showCumulativeView: boolean;
  showDetailModal: boolean;
  showCsvExport: boolean;
  showSummaryStrip: boolean;
  isDarkMode: boolean;
  theme?: SupersetTheme;
}

/** Маппинг имени CSS-переменной (без `--`) на описание формата. */
export type FormatColorToken =
  | 'c-sky'
  | 'c-violet'
  | 'c-tangerine'
  | 'c-fuchsia'
  | 'c-amber'
  | 'g500';
