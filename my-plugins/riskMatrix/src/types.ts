import { QueryFormData, QueryFormMetric, AdhocFilter } from '@superset-ui/core';

/* ============================================================
 * Runtime Superset types — расширения, которых нет в @superset-ui/core
 * ============================================================ */

export interface SupersetThemeExtended {
  colorBgContainer?: string;
  colorBgElevated?: string;
  colorText?: string;
  colorPrimary?: string;
  fontFamily?: string;
  [key: string]: unknown;
}

/** Простой фильтр (col/op/val) — для SupersetClient запросов */
export interface SimpleAdhocFilter {
  col: string;
  op: string;
  val: string | number | string[] | number[];
}

export type SemanticColor = 'up' | 'dn' | 'wn' | 'x' | 'y';

export type QuadrantKey = 'tl' | 'tr' | 'bl' | 'br';

export type ThresholdMode = 'metric' | 'static' | 'avg';

/* ============================================================
 * Domain types — данные чарта
 * ============================================================ */

/** Одна точка-пузырь на scatter */
export interface StorePoint {
  /** ключ для cross-filter (value из groupby_store) */
  id: string;
  /** человекочитаемое имя (обычно совпадает с id) */
  name: string;
  /** город (опционально, из groupby_city) */
  city?: string;
  /** ключ формата (value из groupby_format) */
  format: string;
  /** человекочитаемое имя формата */
  formatName: string;
  /** metric_x */
  x: number;
  /** metric_y */
  y: number;
  /** metric_size (выручка) — нормализуется в радиус 3..14px */
  size: number;
  /** per-row plan для X (для bullet chart в store-modal) */
  planX?: number;
  /** per-row plan для Y */
  planY?: number;
  /** сумма потерь (метрика sum_loss) — для summary в модалях */
  sumLoss?: number;
}

/** Мета формата — цвет и агрегированные плановые значения */
export interface FormatMeta {
  id: string;
  name: string;
  color: string;
  count: number;
  planX?: number;
  planY?: number;
}

/** Квадрант — точки, агрегаты, конфигурация */
export interface QuadrantDef {
  key: QuadrantKey;
  label: string;
  semantic: SemanticColor;
  color: string;
  description: string;
}

export interface QuadrantStats {
  count: number;
  loss: number;
}

/* ============================================================
 * Form data — то, что приходит из controlPanel
 *
 * Superset автоматически конвертирует snake_case → camelCase.
 * Поэтому в типе мы декларируем camelCase, но buildQuery/transformProps
 * нормализуют оба варианта.
 * ============================================================ */

export interface ScatterRiskFormData extends QueryFormData {
  // --- Запрос ---
  groupbyStore?: string | string[];
  groupbyFormat?: string | string[];
  groupbyCity?: string | string[];
  metricX?: QueryFormMetric;
  metricY?: QueryFormMetric;
  metricSize?: QueryFormMetric;
  metricPlanX?: QueryFormMetric;
  metricPlanY?: QueryFormMetric;
  metricSumLoss?: QueryFormMetric;
  adhocFilters?: AdhocFilter[];
  rowLimit?: number;

  // --- Отображение ---
  title?: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
  xUnit?: string;
  yUnit?: string;
  xDecimals?: number;
  yDecimals?: number;
  sizeUnit?: string;
  enableWorstStar?: boolean;
  enableQuadrantAnnotations?: boolean;

  thresholdMode?: ThresholdMode;
  staticThresholdX?: number;
  staticThresholdY?: number;

  colorScheme?: string;

  // --- Квадранты ---
  quadTlLabel?: string;
  quadTrLabel?: string;
  quadBlLabel?: string;
  quadBrLabel?: string;
  quadTlSemantic?: SemanticColor;
  quadTrSemantic?: SemanticColor;
  quadBlSemantic?: SemanticColor;
  quadBrSemantic?: SemanticColor;

  // --- Детализация (drill-down) ---
  drillEnabled?: boolean;
  detailDatasetId?: number;
  trendTimeColumn?: string;
  trendWeeks?: number;
  trendFilterByStoreColumn?: string;
  causesDimension?: string;
  causesMetric?: QueryFormMetric;
  causesTopN?: number;
  skusDimension?: string;
  skusMetric?: QueryFormMetric;
  skusTopN?: number;
  rankDimension?: string;
  shortcutsHint?: string;

  // --- Mock mode ---
  mockModeEnabled?: boolean;
  mockPreset?: string;
}

/* ============================================================
 * Props — то, что transformProps передаёт в React-компонент
 * ============================================================ */

export type FormatValueFn = (value: number) => string;

export interface DetailQueryParams {
  /** ID датасета деталей (для drill-запросов) */
  datasetId?: number;

  /** Имя колонки-измерения магазинов (из groupby_store) */
  storeColumn?: string;

  /** Имя временной колонки для trend */
  trendTimeColumn?: string;
  /** Сколько недель показать в trend */
  trendWeeks: number;
  /** Метрика trend — по умолчанию metricX */
  trendMetric?: QueryFormMetric;

  /** Колонка для причин */
  causesDimension?: string;
  causesMetric?: QueryFormMetric;
  causesTopN: number;

  /** Колонка для SKU */
  skusDimension?: string;
  skusMetric?: QueryFormMetric;
  skusTopN: number;

  /** Для ранга */
  rankDimension?: string;

  /** Стабильный baseline-фильтр (из adhoc_filters) */
  baseFilters: SimpleAdhocFilter[];
  baseWhere?: string;
  baseHaving?: string;
  timeRange?: string;
}

export interface ScatterRiskProps {
  width: number;
  height: number;

  /** Данные точек */
  stores: StorePoint[];

  /** Агрегированные форматы (для легенды и цветов) */
  formats: FormatMeta[];

  /** Пороги (вертикальная/горизонтальная штриховые линии) */
  thresholdX: number;
  thresholdY: number;
  /** Есть ли реальный план (влияет на отображение threshold lines) */
  hasThresholds: boolean;

  /** Квадранты */
  quadrants: Record<QuadrantKey, QuadrantDef>;
  enableQuadrantAnnotations: boolean;
  enableWorstStar: boolean;

  /** Подписи */
  title: string;
  subtitle: string;
  xLabel: string;
  yLabel: string;
  xUnit: string;
  yUnit: string;
  sizeUnit: string;

  /** Форматтеры */
  formatX: FormatValueFn;
  formatY: FormatValueFn;
  formatSize: FormatValueFn;
  formatLoss: FormatValueFn;
  formatCount: FormatValueFn;

  /** Имена measure-labels (для tooltip/drill-labels) */
  xShort: string;
  yShort: string;

  /** Темы */
  isDarkMode: boolean;

  /** Cross-filter API (необязателен — плагин работает standalone в Storybook) */
  setDataMask?: (mask: DataMaskPayload) => void;
  filterState?: { value?: unknown };
  storeColumn?: string;

  /** Drill-down */
  drillEnabled: boolean;
  detailQueryParams: DetailQueryParams;

  /** Подсказка клавиш */
  shortcutsHint: string;
}

/** Shape для setDataMask (совместим с Superset API) */
export interface DataMaskPayload {
  extraFormData?: {
    filters?: Array<{ col: string; op: string; val: unknown }>;
  };
  filterState?: {
    value?: unknown;
    selectedValues?: unknown;
  };
  ownState?: Record<string, unknown>;
}
