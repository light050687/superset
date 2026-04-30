import { buildQueryContext, QueryFormMetric } from '@superset-ui/core';
import type { VelocityDivergingFormData } from '../types';

/**
 * Build query для Velocity Diverging.
 *
 * Один запрос: groupby = [store_code, store_name, city, format, week],
 * metrics = [metric_loss, metric_turnover], orderby по неделе.
 * Типичное число строк: 400 магазинов × 12 недель = 4800, лимит 20000
 * оставляет запас на расширение периода.
 *
 * В mock-режиме пропускаем конфигурацию метрик/групп и шлём минимальный
 * COUNT(*)-запрос, чтобы Superset не показывал "Empty query?" ошибку.
 */
export default function buildQuery(formData: VelocityDivergingFormData) {
  const fd = formData as Record<string, unknown>;

  // Нормализуем groupby-поля: sharedControls.groupby хранит массивы
  // даже при multi:false, а buildQueryContext может вызвать .toLowerCase()
  // на значении → краш если массив.
  const groupbyKeys = [
    'groupby_store_code',
    'groupby_store_name',
    'groupby_city',
    'groupby_format',
    'groupby_week',
    // camelCase варианты — lodash автоматически преобразует
    'groupbyStoreCode',
    'groupbyStoreName',
    'groupbyCity',
    'groupbyFormat',
    'groupbyWeek',
  ];
  groupbyKeys.forEach(k => {
    if (Array.isArray(fd[k])) {
      const first = (fd[k] as unknown[])[0];
      fd[k] = typeof first === 'string' ? first : undefined;
    }
  });

  return buildQueryContext(formData, baseQueryObject => {
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

    const isMockOn =
      (fd.mock_mode_enabled as boolean | undefined) ??
      (fd.mockModeEnabled as boolean | undefined) ??
      false;

    // ── Mock mode: минимальный запрос, данные игнорируются в transformProps ──
    if (isMockOn) {
      return [
        {
          ...baseFields,
          metrics: [
            {
              expressionType: 'SQL',
              sqlExpression: 'COUNT(*)',
              label: '__mock',
            } as QueryFormMetric,
          ],
          columns: [],
          orderby: [],
          row_limit: 1,
          post_processing: [],
        },
      ];
    }

    // ── Real data mode ──
    const columns: string[] = [];
    (
      [
        'groupby_store_code',
        'groupby_store_name',
        'groupby_city',
        'groupby_format',
        'groupby_week',
      ] as const
    ).forEach(key => {
      const v = fd[key];
      if (typeof v === 'string' && v.length > 0) columns.push(v);
    });

    const metrics: QueryFormMetric[] = [];
    const metricLoss = fd.metric_loss as QueryFormMetric | undefined;
    const metricTurnover = fd.metric_turnover as QueryFormMetric | undefined;
    if (metricLoss) metrics.push(metricLoss);
    if (metricTurnover) metrics.push(metricTurnover);

    const weekCol = fd.groupby_week as string | undefined;

    return [
      {
        ...baseFields,
        metrics,
        columns,
        orderby: weekCol ? [[weekCol, true]] : [],
        row_limit: 20000,
        post_processing: [],
      },
    ];
  });
}
