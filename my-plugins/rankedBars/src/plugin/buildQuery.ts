import {
  buildQueryContext,
  QueryFormData,
  QueryFormMetric,
  QueryFormOrderBy,
  QueryObject,
} from '@superset-ui/core';
import type { RankedBarsFormData } from '../types';

/** Безопасный fallback-запрос для mock-режима — отправляем COUNT(*) чтобы
   Superset не падал на «Empty query?» при отсутствии metric. Результат
   игнорируется в transformProps (там данные генерируются из mock-пресета). */
function buildMockSafeQuery(baseQueryObject: QueryObject): QueryObject[] {
  return [
    {
      ...baseQueryObject,
      metrics: [
        {
          expressionType: 'SQL',
          sqlExpression: 'COUNT(*)',
          label: '__mock',
        } as QueryFormMetric,
      ],
      columns: [],
      row_limit: 1,
      is_timeseries: false,
    },
  ];
}

/**
 * Builds the query context for Ranked Bars.
 *
 * Emits up to two queries:
 *   - query[0]: aggregated top-N rows (dimension + metric + metric_prev)
 *   - query[1]: optional time-series for sparklines (one row per time bucket per dimension)
 *
 * Drill-down queries (top stores / top SKUs / 12-week trend) are NOT emitted here.
 * They are fetched lazily in `utils/detailApi.ts` when the user Ctrl+clicks a row.
 */
export default function buildQuery(formData: QueryFormData) {
  const fd = formData as unknown as RankedBarsFormData;
  const fdAny = formData as unknown as Record<string, unknown>;
  const isMockOn =
    (fdAny.mockModeEnabled ?? fdAny.mock_mode_enabled) === true;

  return buildQueryContext(
    formData,
    (baseQueryObject: QueryObject): QueryObject[] => {
      /* Mock-режим — отправляем безопасный COUNT(*) fallback, transformProps
         игнорит результат и генерит данные из mock-пресета. */
      if (isMockOn) {
        return buildMockSafeQuery(baseQueryObject);
      }
      const metric = fd.metric;
      if (!metric) {
        // Superset will surface a "Missing required metric" error; no further querying.
        return [{ ...baseQueryObject, metrics: [], columns: [], row_limit: 0 }];
      }

      // Collect metrics: main + previous (deduplicated happens server-side by label).
      const metrics = [metric];
      if (fd.metricPrev) {
        metrics.push(fd.metricPrev);
      }

      const rowLimit =
        typeof fd.rowLimit === 'number' && fd.rowLimit > 0 ? fd.rowLimit : 30;

      // Normalize groupby — Superset may pass string | string[] depending on multi flag.
      const groupbyArr = Array.isArray(fd.groupby)
        ? fd.groupby
        : fd.groupby
          ? [fd.groupby as NonNullable<RankedBarsFormData['nameColumn']>]
          : [];

      const extraCols = [
        fd.nameColumn,
        fd.subColumn,
        fd.iconColumn,
        fd.colorColumn,
      ].filter(
        (c): c is NonNullable<RankedBarsFormData['nameColumn']> => c != null,
      );

      // Deduplicate columns — groupby already contains primary dimension.
      const columns = Array.from(new Set([...groupbyArr, ...extraCols]));

      const orderby: QueryFormOrderBy[] = [[metric, false]];

      const aggregateQuery: QueryObject = {
        ...baseQueryObject,
        columns,
        metrics,
        orderby,
        row_limit: rowLimit,
        is_timeseries: false,
      };

      const queries: QueryObject[] = [aggregateQuery];

      // Time-series query for sparkline (only when enabled and dimension is present).
      if (fd.showSparkline && groupbyArr.length > 0) {
        queries.push({
          ...baseQueryObject,
          columns: groupbyArr,
          metrics: [metric],
          orderby,
          row_limit: rowLimit * 12, // ~12 buckets × N dimensions
          is_timeseries: true,
        });
      }

      return queries;
    },
  );
}
