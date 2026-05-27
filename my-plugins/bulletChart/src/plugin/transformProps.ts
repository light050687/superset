import { ChartProps, getMetricLabel, QueryFormMetric } from '@superset-ui/core';
import {
  BulletChartFormData,
  BulletChartProps,
  DataState,
  DatasourceInfo,
  DetailQueryParams,
  Direction,
  SortBy,
  SupersetFormDataExtended,
  SupersetThemeExtended,
} from '../types';
import { buildFormatRows, computeScaleMax } from '../utils/aggregation';
import { attachSparklines } from '../utils/sparklineBuild';
import { makeFormatters } from '../utils/format';
import { getPreset } from '../mocks/presets';

// ═══════════════════════════════════════
// Dark-mode detection (W3C luminance)
// ═══════════════════════════════════════
function isThemeDark(theme: unknown): boolean {
  const bg = (theme as SupersetThemeExtended)?.colorBgContainer;
  if (!bg || typeof bg !== 'string' || !bg.startsWith('#')) return false;
  const hex = bg.replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
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

// ═══════════════════════════════════════
// Main transform
// ═══════════════════════════════════════

export default function transformProps(chartProps: ChartProps): BulletChartProps {
  const { width, height, formData: fd, queriesData, theme } = chartProps;
  const formData = fd as BulletChartFormData;

  // ── Нормализация groupby ──
  const groupbyCategory: string | undefined = Array.isArray(formData.groupbyCategory)
    ? (formData.groupbyCategory[0] as string | undefined)
    : formData.groupbyCategory;
  const detailGroupby: string | undefined = Array.isArray(formData.detailGroupby)
    ? (formData.detailGroupby[0] as string | undefined)
    : formData.detailGroupby;

  // ── Defaults ──
  const direction: Direction = formData.direction ?? 'less_is_better';
  const tolerancePct =
    Number(formData.statusTolerancePct) > 0 ? Number(formData.statusTolerancePct) : 5;
  const autoRussian = formData.autoFormatRussian ?? true;
  const decimalsRaw = Number(formData.decimals);
  const decimals =
    Number.isFinite(decimalsRaw) && decimalsRaw >= 0 ? decimalsRaw : 2;
  const valueSuffix = formData.valueSuffix ?? '%';
  const valueUnitLabel = formData.valueUnitLabel ?? 'п.п.';
  const defaultSort: SortBy = formData.defaultSort ?? 'factDesc';
  const filterWorseThanPlanDefault = formData.filterWorseThanPlanDefault ?? false;
  const enableCrossFilter = formData.enableCrossFilter ?? true;
  const enableDetailModal = formData.enableDetailModal ?? true;
  const sparklineEnabled = formData.sparklineEnabled ?? true;
  const sparklinePoints = Number(formData.sparklinePoints) || 8;

  const headerText = formData.headerText || '';
  // DS 2.0: subheader fallback на локализованный time_range («Last year» → «за год»).
  const userSubheader = formData.subheaderText as string | undefined;
  const fdRecAll = formData as unknown as Record<string, unknown>;
  const subheaderText = userSubheader?.trim() || '';

  const formatters = makeFormatters({
    decimals,
    suffix: valueSuffix,
    unitLabel: valueUnitLabel,
    autoRussian,
  });

  const isDarkMode = isThemeDark(theme);

  // ── Adhoc-фильтры (для detail query) ──
  const fdExt = formData as unknown as SupersetFormDataExtended;
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
  const detailExtras: Record<string, unknown> = {
    ...((formData.extras as Record<string, unknown>) ?? {}),
  };
  if (freeformWhere.length > 0) detailExtras.where = freeformWhere.join(' AND ');
  if (freeformHaving.length > 0) detailExtras.having = freeformHaving.join(' AND ');

  // ── Mock режим: ранний return с пресетом ──
  const mockModeEnabled = formData.mockModeEnabled ?? false;
  if (mockModeEnabled) {
    const preset = getPreset(
      formData.mockPreset,
      formData.mockCustomJson,
      direction,
      tolerancePct,
    );
    const rows = preset.rows;
    const scaleMax = computeScaleMax(rows);
    return {
      width,
      height,
      dataState: rows.length === 0 ? 'empty' : 'populated',
      headerText: headerText || preset.title || 'Bullet Chart',
      subheaderText,
      rows,
      scaleMax,
      direction,
      defaultSort,
      filterWorseThanPlanDefault,
      enableCrossFilter,
      enableDetailModal,
      formatters,
      valueSuffix,
      valueUnitLabel,
      isDarkMode,
      theme: theme as unknown as Record<string, unknown>,
      detailQueryParams: undefined,
      mockModeEnabled: true,
    };
  }

  // ── Guard: нет метрики факта или категории — empty state ──
  if (!formData.metricFact || !groupbyCategory) {
    return {
      width,
      height,
      dataState: 'empty',
      headerText: headerText || 'Bullet Chart',
      subheaderText,
      rows: [],
      scaleMax: 1,
      direction,
      defaultSort,
      filterWorseThanPlanDefault,
      enableCrossFilter,
      enableDetailModal,
      formatters,
      valueSuffix,
      valueUnitLabel,
      isDarkMode,
      theme: theme as unknown as Record<string, unknown>,
      detailQueryParams: undefined,
      mockModeEnabled: false,
    };
  }

  // ── Main data (Query 0) ──
  const mainData = (queriesData?.[0]?.data as Record<string, unknown>[]) ?? [];
  const sparkData = sparklineEnabled
    ? ((queriesData?.[1]?.data as Record<string, unknown>[]) ?? [])
    : [];

  let rows = buildFormatRows({
    rawRows: mainData,
    categoryColumn: groupbyCategory,
    metricFact: formData.metricFact,
    metricPlan: formData.metricPlan,
    metricPy: formData.metricPy,
    metricStores: formData.metricStores,
    direction,
    tolerancePct,
  });

  if (sparklineEnabled && sparkData.length > 0) {
    rows = attachSparklines(
      rows,
      sparkData,
      groupbyCategory,
      formData.metricFact,
      sparklinePoints,
    );
  }

  const scaleMax = computeScaleMax(rows);

  // ── Metric labels для detail API ──
  const factLabel = getMetricLabel(formData.metricFact);
  const planLabel = formData.metricPlan ? getMetricLabel(formData.metricPlan) : null;
  const pyLabel = formData.metricPy ? getMetricLabel(formData.metricPy) : null;
  const storesLabel = formData.metricStores
    ? getMetricLabel(formData.metricStores)
    : null;

  // ── Detail query params (lazy через SupersetClient) ──
  const ds = (chartProps as unknown as { datasource?: DatasourceInfo }).datasource;
  const dsId =
    ds?.id ??
    (chartProps as unknown as { datasourceId?: number }).datasourceId ??
    0;
  const dsType = ds?.type ?? 'table';

  const detailMetrics: QueryFormMetric[] = [formData.metricFact];
  if (formData.metricPlan) detailMetrics.push(formData.metricPlan);
  if (formData.metricPy) detailMetrics.push(formData.metricPy);
  if (formData.metricStores) detailMetrics.push(formData.metricStores);

  const detailQueryParams: DetailQueryParams | undefined =
    enableDetailModal && detailGroupby
      ? {
          datasourceId: dsId,
          datasourceType: dsType,
          detailGroupby,
          categoryColumn: groupbyCategory,
          categoryValue: '',
          metrics: detailMetrics,
          metricLabels: {
            fact: factLabel,
            plan: planLabel,
            py: pyLabel,
            stores: storesLabel,
          },
          timeRange: (fdExt.timeRange ?? fdExt.time_range) as string | undefined,
          granularity: (fdExt.granularitySqla ?? fdExt.granularity_sqla) as
            | string
            | undefined,
          filters: simpleFilters,
          extras: detailExtras,
        }
      : undefined;

  /* DS 2.0 §06 «Состояния»: empty / partial / stale / populated.
     - partial: бэкенд отверг часть фильтров (rejected_filters > 0)
     - stale: данные пришли из кеша (is_cached)
     - partial > stale по приоритету (юзеру важнее знать про фильтр).
     'loading' и 'error' приходят отдельно через chartStatus prop. */
  const q0 = queriesData?.[0] as
    | { is_cached?: boolean; rejected_filters?: Array<unknown> }
    | undefined;
  let dataState: DataState;
  if (!mainData.length || rows.length === 0) {
    dataState = 'empty';
  } else if (q0?.rejected_filters && q0.rejected_filters.length > 0) {
    dataState = 'partial';
  } else if (q0?.is_cached) {
    dataState = 'stale';
  } else {
    dataState = 'populated';
  }

  return {
    width,
    height,
    dataState,
    headerText: headerText || factLabel || 'Bullet Chart',
    subheaderText,
    rows,
    scaleMax,
    direction,
    defaultSort,
    filterWorseThanPlanDefault,
    enableCrossFilter,
    enableDetailModal,
    formatters,
    valueSuffix,
    valueUnitLabel,
    isDarkMode,
    theme: theme as unknown as Record<string, unknown>,
    detailQueryParams,
    mockModeEnabled: false,
  };
}
