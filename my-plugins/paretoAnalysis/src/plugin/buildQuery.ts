import { buildQueryContext, QueryFormMetric } from '@superset-ui/core';
import { ParetoCardFormData } from '../types';

/**
 * Build query context для Pareto Card.
 *
 * Отправляет ОДИН запрос group-by по dimension с суммой metric_value
 * (+ опциональные metric_revenue / metric_prev).
 *
 * Если никаких метрик не задано, а включён mock-режим — в запрос добавляется
 * COUNT(*) как безопасный fallback, чтобы Superset не бросил «Empty query?».
 * Результат такого запроса игнорируется в transformProps при mockModeEnabled=true.
 */
export default function buildQuery(formData: ParetoCardFormData) {
  const { metricValue, metricRevenue, metricPrev } = formData;

  // Нормализуем dimension: sharedControls.groupby хранит массив даже при multi:false.
  const fd = formData as Record<string, unknown>;
  if (Array.isArray(fd.dimension)) {
    fd.dimension = fd.dimension[0] ?? undefined;
  }

  return buildQueryContext(formData, baseQueryObject => {
    const metrics: QueryFormMetric[] = [];
    const seen = new Set<string>();

    const pushMetric = (m: QueryFormMetric | undefined): void => {
      if (!m) return;
      const label =
        typeof m === 'string'
          ? m
          : (m as { label?: string }).label ?? JSON.stringify(m);
      if (seen.has(label)) return;
      seen.add(label);
      metrics.push(m);
    };

    pushMetric(metricValue);
    pushMetric(metricRevenue);
    pushMetric(metricPrev);

    const fdExt = formData as unknown as {
      mock_mode_enabled?: boolean;
      mockModeEnabled?: boolean;
    };
    const isMockOn = fdExt.mock_mode_enabled ?? fdExt.mockModeEnabled ?? false;
    if (metrics.length === 0 && isMockOn) {
      metrics.push({
        expressionType: 'SQL',
        sqlExpression: 'COUNT(*)',
        label: '__mock',
      } as QueryFormMetric);
    }

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

    const dim =
      typeof fd.dimension === 'string' && fd.dimension ? fd.dimension : undefined;

    const columns = dim ? [dim] : [];
    const orderby: [QueryFormMetric, boolean][] = metricValue
      ? [[metricValue, false]]
      : [];

    return [
      {
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
        metrics,
        columns,
        orderby,
        row_limit: 100,
        post_processing: [],
      },
    ];
  });
}
