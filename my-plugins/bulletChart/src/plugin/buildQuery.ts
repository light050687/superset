import { buildQueryContext, QueryFormMetric } from '@superset-ui/core';
import { BulletChartFormData } from '../types';

/**
 * Build query context for Bullet Chart.
 *
 * Sends 1 или 2 queries:
 *   - Query 0: основной — агрегаты {факт, план, ПГ, магазины} по категории.
 *   - Query 1: sparkline — временной ряд по категории (если включён).
 *
 * Все входящие ключи — snake_case из controlPanel.
 */
export default function buildQuery(formData: BulletChartFormData) {
  const {
    metric_fact,
    metric_plan,
    metric_py,
    metric_stores,
  } = formData;

  // Нормализация groupby (sharedControls.groupby хранит массивы даже при multi:false).
  // buildQueryContext может вызвать .toLowerCase() → crash если массив.
  const fd = formData as Record<string, unknown>;
  if (Array.isArray(fd.groupby_category)) {
    fd.groupby_category = fd.groupby_category[0] ?? undefined;
  }
  if (Array.isArray(fd.groupbyCategory)) {
    fd.groupbyCategory = fd.groupbyCategory[0] ?? undefined;
  }
  if (Array.isArray(fd.detail_groupby)) {
    fd.detail_groupby = fd.detail_groupby[0] ?? undefined;
  }
  if (Array.isArray(fd.detailGroupby)) {
    fd.detailGroupby = fd.detailGroupby[0] ?? undefined;
  }

  const category = (fd.groupby_category as string) || (fd.groupbyCategory as string) || '';

  return buildQueryContext(formData, baseQueryObject => {
    // ── Сбор метрик с дедупликацией ──
    const allMetrics: QueryFormMetric[] = [];
    const seenLabels = new Set<string>();

    const addMetric = (m: QueryFormMetric | undefined): void => {
      if (!m) return;
      const label =
        typeof m === 'string'
          ? m
          : (m as { label?: string }).label ?? JSON.stringify(m);
      if (!seenLabels.has(label)) {
        seenLabels.add(label);
        allMetrics.push(m);
      }
    };

    addMetric(metric_fact);
    addMetric(metric_plan);
    addMetric(metric_py);
    addMetric(metric_stores);

    // Mock-mode: если нет метрик — используем COUNT(*) чтобы избежать "Empty query".
    const fdExt = formData as unknown as {
      mock_mode_enabled?: boolean;
      mockModeEnabled?: boolean;
    };
    const isMockOn = fdExt.mock_mode_enabled ?? fdExt.mockModeEnabled ?? false;
    if (allMetrics.length === 0 && isMockOn) {
      allMetrics.push({
        expressionType: 'SQL',
        sqlExpression: 'COUNT(*)',
        label: '__mock',
      } as QueryFormMetric);
    }

    // Safe base-fields (не допускаем pollution колонками)
    const {
      time_range,
      since,
      until,
      granularity,
      filters,
      extras,
      applied_time_extras,
      where,
      having,
      annotation_layers,
      url_params,
      custom_params,
    } = baseQueryObject;

    const baseFields = {
      time_range,
      since,
      until,
      granularity,
      filters,
      extras,
      applied_time_extras,
      where,
      having,
      annotation_layers,
      url_params,
      custom_params,
    };

    // ── Query 0: main ──
    const mainQuery = {
      ...baseFields,
      metrics: allMetrics,
      columns: category ? [category] : [],
      orderby: metric_fact
        ? [[metric_fact as unknown as QueryFormMetric, false] as [QueryFormMetric, boolean]]
        : [],
      row_limit: Number((formData as Record<string, unknown>).row_limit) || 50,
      post_processing: [],
    };

    const queries: Record<string, unknown>[] = [mainQuery];

    // ── Query 1: sparkline timeseries ──
    const sparklineEnabled =
      (formData as Record<string, unknown>).sparkline_enabled !== false &&
      (formData as Record<string, unknown>).sparklineEnabled !== false;

    if (sparklineEnabled && metric_fact && category) {
      const timeGrain =
        ((formData as Record<string, unknown>).sparkline_time_grain as string) ||
        ((formData as Record<string, unknown>).sparklineTimeGrain as string) ||
        'P1W';

      const sparklineQuery = {
        ...baseFields,
        metrics: [metric_fact],
        columns: [category],
        orderby: [],
        row_limit: 10000,
        is_timeseries: true,
        extras: { ...(extras || {}), time_grain_sqla: timeGrain },
        post_processing: [],
      };
      queries.push(sparklineQuery);
    }

    return queries;
  });
}
