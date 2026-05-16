import { buildQueryContext, QueryFormMetric } from '@superset-ui/core';
import { ScatterRiskFormData } from '../types';

/**
 * Build query для ScatterRisk.
 *
 * Один запрос: groupby=[store, format, city?], metrics=[x, y, size?, plan_x?, plan_y?, sum_loss?].
 * Каждая строка ответа = одна точка на scatter.
 *
 * Сложные фильтры (filters/where/having) передаются из Superset как есть —
 * это обеспечивает cross-filter от других визуалов на дашборде.
 */
export default function buildQuery(formData: ScatterRiskFormData) {
  const fd = formData as Record<string, unknown>;

  // sharedControls.groupby сохраняет arrays даже при multi:false —
  // нормализуем к scalar (иначе buildQueryContext упадёт на .toLowerCase()).
  const normalizeField = (key: string, camelKey: string) => {
    if (Array.isArray(fd[key])) {
      const arr = fd[key] as unknown[];
      fd[key] = arr.length > 0 ? arr[0] : undefined;
    }
    if (Array.isArray(fd[camelKey])) {
      const arr = fd[camelKey] as unknown[];
      fd[camelKey] = arr.length > 0 ? arr[0] : undefined;
    }
  };
  normalizeField('groupby_store', 'groupbyStore');
  normalizeField('groupby_format', 'groupbyFormat');
  normalizeField('groupby_city', 'groupbyCity');

  const groupbyStore = (fd.groupby_store ?? fd.groupbyStore) as string | undefined;
  const groupbyFormat = (fd.groupby_format ?? fd.groupbyFormat) as string | undefined;
  const groupbyCity = (fd.groupby_city ?? fd.groupbyCity) as string | undefined;

  const metricX = (fd.metric_x ?? fd.metricX) as QueryFormMetric | undefined;
  const metricY = (fd.metric_y ?? fd.metricY) as QueryFormMetric | undefined;
  const metricSize = (fd.metric_size ?? fd.metricSize) as QueryFormMetric | undefined;
  const metricPlanX = (fd.metric_plan_x ?? fd.metricPlanX) as QueryFormMetric | undefined;
  const metricPlanY = (fd.metric_plan_y ?? fd.metricPlanY) as QueryFormMetric | undefined;
  const metricSumLoss = (fd.metric_sum_loss ?? fd.metricSumLoss) as QueryFormMetric | undefined;

  return buildQueryContext(formData, (baseQueryObject) => {
    const metrics: QueryFormMetric[] = [];
    const seen = new Set<string>();
    const addMetric = (m?: QueryFormMetric): void => {
      if (!m) return;
      const label =
        typeof m === 'string'
          ? m
          : (m as { label?: string }).label ?? JSON.stringify(m);
      if (!seen.has(label)) {
        seen.add(label);
        metrics.push(m);
      }
    };

    addMetric(metricX);
    addMetric(metricY);
    addMetric(metricSize);
    addMetric(metricPlanX);
    addMetric(metricPlanY);
    addMetric(metricSumLoss);

    // Mock mode: пустой COUNT(*) чтобы Superset не ругался
    const isMockOn =
      (fd.mock_mode_enabled as boolean | undefined) ??
      (fd.mockModeEnabled as boolean | undefined) ??
      false;
    if (metrics.length === 0 && isMockOn) {
      metrics.push({
        expressionType: 'SQL',
        sqlExpression: 'COUNT(*)',
        label: '__mock',
      } as QueryFormMetric);
    }

    const columns: string[] = [];
    if (groupbyStore) columns.push(groupbyStore);
    if (groupbyFormat && groupbyFormat !== groupbyStore) columns.push(groupbyFormat);
    if (groupbyCity && groupbyCity !== groupbyStore && groupbyCity !== groupbyFormat) {
      columns.push(groupbyCity);
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

    const rowLimit = Number(fd.row_limit ?? fd.rowLimit ?? 1000) || 1000;

    const mainQuery = {
      ...baseFields,
      metrics,
      columns,
      orderby: metricSize ? ([[metricSize, false]] as [QueryFormMetric, boolean][]) : [],
      row_limit: rowLimit,
      post_processing: [],
    };

    return [mainQuery];
  });
}
