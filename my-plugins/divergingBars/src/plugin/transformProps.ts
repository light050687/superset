import { ChartProps, getMetricLabel } from '@superset-ui/core';
import type { QueryFormMetric } from '@superset-ui/core';
import type {
  ComparisonMode,
  DataState,
  FormatDef,
  Horizon,
  MetricMode,
  PartialWarning,
  Store,
  StoresQueryParams,
  VelocityDivergingFormData,
  VelocityDivergingProps,
} from '../types';
import { getPreset } from '../mocks/presets';
import { DEFAULT_FORMATS } from '../utils/mockGenerator';
import { rowsToStores } from '../utils/rowsToStores';

/**
 * Расширенная форма ChartProps — queriesData типизируется на уровне плагина,
 * т.к. @superset-ui/core по-разному типизирует его в разных минорных версиях.
 */
type VelocityChartProps = ChartProps<VelocityDivergingFormData> & {
  queriesData?: Array<{
    data?: Record<string, unknown>[];
    error?: string | null;
    errorMessage?: string | null;
  }>;
};

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

function detectDarkMode(theme: unknown): boolean {
  const bg = (theme as { colorBgContainer?: string } | undefined)
    ?.colorBgContainer;
  if (!bg || typeof bg !== 'string' || !bg.startsWith('#')) return false;
  const hex = bg.replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function parseFormats(raw: string | undefined): FormatDef[] {
  if (!raw || raw.trim().length === 0) return DEFAULT_FORMATS;
  try {
    const parsed = JSON.parse(raw) as Record<
      string,
      { name?: string; color?: string; plan?: number }
    >;
    const out: FormatDef[] = Object.entries(parsed).map(([id, cfg]) => ({
      id,
      name: cfg.name ?? id,
      color: cfg.color ?? 'c-sky',
      plan: cfg.plan,
    }));
    return out.length ? out : DEFAULT_FORMATS;
  } catch {
    return DEFAULT_FORMATS;
  }
}

function firstString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.length && typeof v[0] === 'string')
    return v[0] as string;
  return undefined;
}

/**
 * Back-compat: legacy `default_horizon` → ComparisonMode.
 *   'wow' → 'prev_week'
 *   '4w'  → 'prev_period' (4 weeks back = inherit для main = 4 weeks)
 *   'mom' → 'prev_month'
 *   'cum' → 'prev_period'
 */
function migrateHorizonToMode(horizon: Horizon | undefined): ComparisonMode {
  switch (horizon) {
    case 'wow':
      return 'prev_week';
    case 'mom':
      return 'prev_month';
    case 'cum':
    case '4w':
    default:
      return 'prev_period';
  }
}

function parseRange(raw: unknown): [string, string] | undefined {
  if (!raw) return undefined;
  const s = String(raw);
  const sep = s.includes(' : ') ? ' : ' : s.includes(',') ? ',' : null;
  if (!sep) return undefined;
  const [start, end] = s.split(sep).map(p => p.trim());
  if (!start || !end) return undefined;
  return [start, end];
}

export default function transformProps(
  chartProps: VelocityChartProps,
): VelocityDivergingProps {
  const { formData, queriesData, width, height, theme } = chartProps;
  const isDarkMode = detectDarkMode(theme);

  const headerText =
    (formData.header_text as string | undefined) ??
    (formData as unknown as { headerText?: string }).headerText ??
    'Скорость роста потерь';

  const userSubtitle =
    (formData.subtitle_text as string | undefined) ??
    (formData as unknown as { subtitleText?: string }).subtitleText;
  const timeRange =
    (formData as unknown as { time_range?: string; timeRange?: string }).time_range ??
    (formData as unknown as { timeRange?: string }).timeRange;
  const subtitleText = userSubtitle?.trim() || '';

  // ── Comparison mode resolution ───────────────────────────
  // 1) Явный new key: default_comparison_mode.
  // 2) Legacy: default_horizon → migrate.
  // 3) Default fallback: 'prev_period'.
  const explicitMode =
    (formData.default_comparison_mode as ComparisonMode | undefined) ??
    (formData as unknown as { defaultComparisonMode?: ComparisonMode })
      .defaultComparisonMode;
  const legacyHorizon =
    (formData.default_horizon as Horizon | undefined) ??
    (formData as unknown as { defaultHorizon?: Horizon }).defaultHorizon;
  let defaultComparisonMode: ComparisonMode = 'prev_period';
  if (explicitMode) {
    defaultComparisonMode = explicitMode;
  } else if (legacyHorizon) {
    defaultComparisonMode = migrateHorizonToMode(legacyHorizon);
    // eslint-disable-next-line no-console
    console.warn(
      `[velocity-diverging] legacy formData.default_horizon='${legacyHorizon}' ` +
        `migrated to default_comparison_mode='${defaultComparisonMode}'. ` +
        `Re-save the chart to use the new control.`,
    );
  }

  const customCurrentRange = parseRange(
    (formData as unknown as { custom_current_range?: unknown }).custom_current_range ??
      (formData as unknown as { customCurrentRange?: unknown }).customCurrentRange,
  );
  const customPreviousRange = parseRange(
    (formData as unknown as { custom_previous_range?: unknown }).custom_previous_range ??
      (formData as unknown as { customPreviousRange?: unknown }).customPreviousRange,
  );

  const defaultMetric: MetricMode =
    ((formData.default_metric ??
      (formData as unknown as { defaultMetric?: MetricMode }).defaultMetric) as MetricMode) ?? 'rub';

  // Кумулятивный блок отключён по запросу — кнопка и view скрыты в UI.
  const showCumulativeView = false;
  const showDetailModal =
    (formData as unknown as { show_detail_modal?: boolean; showDetailModal?: boolean })
      .show_detail_modal ??
    (formData as unknown as { showDetailModal?: boolean }).showDetailModal ??
    true;
  const showCsvExport =
    (formData as unknown as { show_csv_export?: boolean; showCsvExport?: boolean })
      .show_csv_export ??
    (formData as unknown as { showCsvExport?: boolean }).showCsvExport ??
    true;
  const showSummaryStrip =
    (formData as unknown as { show_summary_strip?: boolean; showSummaryStrip?: boolean })
      .show_summary_strip ??
    (formData as unknown as { showSummaryStrip?: boolean }).showSummaryStrip ??
    true;

  const formats = parseFormats(
    (formData as unknown as { format_mapping_json?: string; formatMappingJson?: string })
      .format_mapping_json ??
      (formData as unknown as { formatMappingJson?: string }).formatMappingJson,
  );

  const mockModeEnabled =
    (formData as unknown as { mock_mode_enabled?: boolean; mockModeEnabled?: boolean })
      .mock_mode_enabled ??
    (formData as unknown as { mockModeEnabled?: boolean }).mockModeEnabled ??
    false;

  const pageSizeRaw =
    (formData as unknown as { page_size?: number | string; pageSize?: number | string })
      .page_size ??
    (formData as unknown as { pageSize?: number | string }).pageSize ??
    20;
  const pageSizeParsed = Number(pageSizeRaw);
  const pageSize =
    Number.isFinite(pageSizeParsed) && pageSizeParsed > 0
      ? Math.min(Math.floor(pageSizeParsed), 500)
      : 20;

  const baseProps = {
    width,
    height,
    headerText,
    subtitleText,
    defaultComparisonMode,
    customCurrentRange,
    customPreviousRange,
    defaultMetric,
    showCumulativeView,
    showDetailModal,
    showCsvExport,
    showSummaryStrip,
    isDarkMode,
    formats,
    theme,
    mockModeEnabled,
    pageSize,
  };

  // ── Mock mode: возвращаем сгенерированные данные, игнорируя queriesData ──
  if (mockModeEnabled) {
    const preset = getPreset(
      (formData as unknown as { mock_preset?: string }).mock_preset ??
        'losses_velocity',
      defaultComparisonMode,
    );
    return {
      ...baseProps,
      dataState: 'populated' as DataState,
      stores: preset.stores,
      formats: preset.formats,
    };
  }

  // ── Convert adhoc_filters → simple {col, op, val} + freeform SQL для
  //    серверной пагинации внутри карточки. То же что scorecard. ──
  const fdExt = formData as unknown as {
    adhocFilters?: Array<Record<string, unknown>>;
    adhoc_filters?: Array<Record<string, unknown>>;
    timeRange?: string;
    time_range?: string;
    granularitySqla?: string;
    granularity_sqla?: string;
  };
  const adhocFilters = (fdExt.adhocFilters ?? fdExt.adhoc_filters ?? []) as Array<
    Record<string, unknown>
  >;
  const simpleFilters: Array<{ col: string; op: string; val?: unknown }> = [];
  const freeformWhere: string[] = [];
  const freeformHaving: string[] = [];
  for (const f of adhocFilters) {
    if (f.expressionType === 'SIMPLE') {
      simpleFilters.push({
        col: f.subject as string,
        op: f.operator as string,
        val: f.comparator,
      });
    } else if (f.expressionType === 'SQL') {
      const sql = `(${f.sqlExpression as string})`;
      if (f.clause === 'HAVING') freeformHaving.push(sql);
      else freeformWhere.push(sql);
    }
  }
  const baseExtras: Record<string, unknown> = {
    ...((formData.extras as Record<string, unknown>) ?? {}),
  };
  if (freeformWhere.length > 0) baseExtras.where = freeformWhere.join(' AND ');
  if (freeformHaving.length > 0) baseExtras.having = freeformHaving.join(' AND ');

  const ds = (chartProps as unknown as {
    datasource?: { id?: number; type?: string };
    datasourceId?: number;
  }).datasource;
  const dsId =
    ds?.id ??
    (chartProps as unknown as { datasourceId?: number }).datasourceId ??
    0;
  const dsType = ds?.type ?? 'table';

  // ── Real data mode ──
  const firstQuery = queriesData?.[0];
  const errMsg = firstQuery?.error || firstQuery?.errorMessage;
  if (errMsg) {
    return {
      ...baseProps,
      dataState: 'error' as DataState,
      stores: [],
      errorMessage: errMsg,
    };
  }

  const mainRows = (firstQuery?.data as Record<string, unknown>[] | undefined) ?? [];
  // queriesData[1] есть только в custom-режиме (см. buildQuery).
  const compRows =
    defaultComparisonMode === 'custom'
      ? (queriesData?.[1]?.data as Record<string, unknown>[] | undefined) ?? []
      : undefined;

  if (mainRows.length === 0) {
    return {
      ...baseProps,
      dataState: 'empty' as DataState,
      stores: [],
    };
  }

  const codeCol = firstString(
    (formData as unknown as { groupby_store_code?: unknown; groupbyStoreCode?: unknown })
      .groupby_store_code ??
      (formData as unknown as { groupbyStoreCode?: unknown }).groupbyStoreCode,
  );
  const nameCol = firstString(
    (formData as unknown as { groupby_store_name?: unknown; groupbyStoreName?: unknown })
      .groupby_store_name ??
      (formData as unknown as { groupbyStoreName?: unknown }).groupbyStoreName,
  );
  const cityCol = firstString(
    (formData as unknown as { groupby_city?: unknown; groupbyCity?: unknown })
      .groupby_city ??
      (formData as unknown as { groupbyCity?: unknown }).groupbyCity,
  );
  const formatCol = firstString(
    (formData as unknown as { groupby_format?: unknown; groupbyFormat?: unknown })
      .groupby_format ??
      (formData as unknown as { groupbyFormat?: unknown }).groupbyFormat,
  );
  const weekCol = firstString(
    (formData as unknown as { groupby_week?: unknown; groupbyWeek?: unknown })
      .groupby_week ??
      (formData as unknown as { groupbyWeek?: unknown }).groupbyWeek,
  );

  const metricLoss =
    (formData as unknown as { metric_loss?: unknown }).metric_loss ??
    (formData as unknown as { metricLoss?: unknown }).metricLoss;
  const metricTurnover =
    (formData as unknown as { metric_turnover?: unknown }).metric_turnover ??
    (formData as unknown as { metricTurnover?: unknown }).metricTurnover;
  const lossLabel = metricLoss ? getMetricLabel(metricLoss as never) : undefined;
  const turnoverLabel = metricTurnover
    ? getMetricLabel(metricTurnover as never)
    : undefined;

  // Partial — если не хватает ключевых колонок, предупреждаем.
  const missing: string[] = [];
  if (!lossLabel) missing.push('метрика потерь');
  if (!codeCol && !nameCol) missing.push('код или название магазина');

  const formatsMap = new Map<string, FormatDef>();
  formats.forEach(f => formatsMap.set(f.id, f));

  const stores = rowsToStores(
    mainRows,
    {
      codeCol,
      nameCol,
      cityCol,
      formatCol,
      weekCol,
      lossLabel,
      turnoverLabel,
      comparisonMode: defaultComparisonMode,
    },
    formatsMap,
    compRows,
  );

  if (stores.length === 0) {
    return {
      ...baseProps,
      dataState: 'empty' as DataState,
      stores: [],
    };
  }

  const partialWarning: PartialWarning | undefined = missing.length
    ? {
        message: `Не хватает колонок: ${missing.join(', ')}. Отображаются частичные данные.`,
      }
    : undefined;

  const queryMetrics: QueryFormMetric[] = [];
  if (metricLoss) queryMetrics.push(metricLoss as QueryFormMetric);
  if (metricTurnover) queryMetrics.push(metricTurnover as QueryFormMetric);

  const queryParams: StoresQueryParams = {
    datasourceId: dsId,
    datasourceType: dsType,
    codeCol,
    nameCol,
    cityCol,
    formatCol,
    weekCol,
    lossLabel,
    turnoverLabel,
    metrics: queryMetrics,
    timeRange: fdExt.timeRange ?? fdExt.time_range,
    granularity: fdExt.granularitySqla ?? fdExt.granularity_sqla,
    filters: simpleFilters,
    extras: baseExtras,
    comparisonMode: defaultComparisonMode,
    customCurrentRange,
    customPreviousRange,
  };

  return {
    ...baseProps,
    dataState: partialWarning ? ('partial' as DataState) : ('populated' as DataState),
    stores,
    partialWarning,
    queryParams,
  };
}
