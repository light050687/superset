import { ChartPlugin, ChartMetadata, t } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
import { WriteoffsTSFormData } from '../types';

/**
 * Metric Time Series plugin для Superset (internal: WriteoffsTimeseries).
 *
 * Register in MainPreset.js with:
 *   new SupersetPluginChartMetricTimeSeries().configure({ key: 'ext-writeoffs-timeseries' })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartMetricTimeSeries extends ChartPlugin<WriteoffsTSFormData> {
  constructor() {
    super({
      buildQuery,
      controlPanel,
      loadChart: () => import('../WriteoffsTimeseries'),
      metadata: new ChartMetadata({
        name: '[MRTS] Metric Time Series',
        description: t(
          'Многорежимный time-series для метрик: линии, стек-бары ' +
            'и стек-площадь с переключением гранулярности (Год/Месяц/Неделя/День), ' +
            'brush-выделением и разбивкой по категориям. Design System v2.0.',
        ),
        thumbnail,
        tags: ['MRTS', t('Timeseries'), t('Trend'), t('Featured')],
        category: 'MRTS',
      }),
      transformProps,
    });
  }
}
