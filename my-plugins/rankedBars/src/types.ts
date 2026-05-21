import type {
  ChartDataResponseResult,
  QueryFormColumn,
  QueryFormMetric,
} from '@superset-ui/core';

export type UnitMode = 'rub' | 'pct';
export type SortMode = 'sum' | 'delta' | 'share';

export type DataState =
  | 'loading'
  | 'error'
  | 'empty'
  | 'partial'
  | 'stale'
  | 'populated';

export type IconName =
  | 'clock'
  | 'thermometer'
  | 'shield'
  | 'triangle'
  | 'package';

/** One row in the ranking — produced by transformProps from query[0] and sparkline query[1]. */
export interface RankedRow {
  id: string;
  name: string;
  sub: string;
  iconName: IconName;
  /** Resolved CSS custom property name (e.g. `--c-sky`) or raw hex. */
  colorToken: string;
  /** Primary metric value in original units (e.g. rubles). */
  value: number;
  /** Previous-period value or null when unavailable. */
  valuePrev: number | null;
  /** Computed percentage share of total (0..100). */
  sharePct: number;
  /** Computed percentage share of previous-period total (0..100); null when valuePrev is null. */
  sharePrevPct: number | null;
  /** Computed share delta in percentage points (pp). */
  deltaPP: number;
  /** Sparkline series (trend), most recent last. Empty array disables sparkline. */
  spark: number[];
}

/** Top-5 store/SKU row for DetailModal. */
export interface DrillTopRow {
  name: string;
  value: number;
}

/** Drill data fetched lazily when the user Ctrl+clicks a row. */
export interface DrillData {
  stores: DrillTopRow[];
  skus: DrillTopRow[];
  trend: number[];
}

/** Mock presets for design mode. */
export type MockPreset = 'losses' | 'expenses' | 'custom';

/**
 * FormData produced by controlPanel, camelCase keys (Superset converts snake_case → camelCase).
 */
export interface RankedBarsFormData {
  datasource: string;
  viz_type: string;

  // Query — metric/groupby checked at runtime; typed optional to satisfy SqlaFormData.
  groupby?: QueryFormColumn[];
  nameColumn?: QueryFormColumn;
  subColumn?: QueryFormColumn;
  iconColumn?: QueryFormColumn;
  colorColumn?: QueryFormColumn;
  metric?: QueryFormMetric;
  metricPrev?: QueryFormMetric;
  rowLimit?: number;
  adhocFilters?: unknown[];
  timeRange?: string;

  // Ranking
  defaultSort?: SortMode;
  defaultUnit?: UnitMode;
  topNVisible?: number;

  // Display
  headerText?: string;
  headerSubtitlePrefix?: string;
  showSparkline?: boolean;
  showTotalInHeader?: boolean;
  invertDeltaGood?: boolean;

  // Detail
  enableDrillModal?: boolean;
  storeDim?: QueryFormColumn;
  skuDim?: QueryFormColumn;
  detailTopN?: number;
  enableAllItemsModal?: boolean;

  // Number format
  unitSuffixRub?: string;
  decimalsValue?: number;
  decimalsDelta?: number;
  decimalsShare?: number;

  // Interactivity
  enableCrossFilter?: boolean;
  showGhostPrevBar?: boolean;
  showHoverTooltip?: boolean;

  // Mock
  mockModeEnabled?: boolean;
  mockPreset?: MockPreset;
  mockCustomJson?: string;
}

/** Props passed to RankedBars React component. */
export interface RankedBarsProps {
  width: number;
  height: number;

  dataState: DataState;
  errorMessage?: string;

  rows: RankedRow[];
  totalSum: number;

  headerText: string;
  headerSubtitlePrefix: string;
  showTotalInHeader: boolean;
  showSparkline: boolean;
  showGhostPrevBar: boolean;
  showHoverTooltip: boolean;
  invertDeltaGood: boolean;

  defaultSort: SortMode;
  defaultUnit: UnitMode;
  topNVisible: number;

  unitSuffixRub: string;
  decimalsValue: number;
  decimalsDelta: number;
  decimalsShare: number;

  enableDrillModal: boolean;
  enableAllItemsModal: boolean;
  enableCrossFilter: boolean;

  /** Whether metric_prev was configured — disables delta sort when false. */
  hasPrevMetric: boolean;

  /** Parameters required for lazy drill-down fetches. */
  drillQueryParams: DrillQueryParams | null;

  /** Cross-filter plumbing from Superset dashboard context. */
  setDataMask?: (mask: DataMaskInput) => void;
  filterState?: { value?: string[] | null };

  /** True inside Storybook / mock mode — skips real fetches. */
  isMockMode: boolean;

  /** Theme hint from Superset (Ant Design 5) — 'dark' or 'light'. */
  themeMode: 'light' | 'dark';
}

/** Shape consumed by Superset setDataMask for cross-filters. */
export interface DataMaskInput {
  filterState?: {
    value?: string[] | null;
    selectedValues?: string[] | null;
  };
  extraFormData?: {
    filters?: Array<{
      col: string;
      op: 'IN' | 'NOT IN';
      val: string[];
    }>;
  };
}

/** Parameters needed to fetch drill-down data. */
export interface DrillQueryParams {
  datasource: string;
  groupbyCol: string;
  storeDim?: string;
  skuDim?: string;
  timeCol?: string;
  metric: QueryFormMetric;
  timeRange?: string;
  adhocFilters?: unknown[];
  detailTopN: number;
}

/** Shape of a single row returned by query[0]. */
export type QueryRow = Record<string, unknown>;

/**
 * Raw result slice Superset returns.
 *
 * We extend the built-in `ChartDataResponseResult` with `error_message` because
 * the runtime shape in Superset 6 carries this field even though the TypeScript
 * types do not expose it. Keeping the property optional preserves backwards
 * compatibility with the SDK type.
 */
export type QueryResult = ChartDataResponseResult & {
  error_message?: string | null;
};
