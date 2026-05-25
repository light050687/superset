import { ChartPlugin, ChartMetadata, t } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
import type { VelocityDivergingFormData } from '../types';

/**
 * Diverging Bars plugin for Apache Superset 6.0+ (internal: VelocityDiverging).
 *
 * Двусторонняя bar-диаграмма для сравнения объектов period-over-period.
 * Через Superset built-in time_compare поддерживает 5 preset режимов
 * (предыдущий период / неделя / месяц / квартал / год) + custom через
 * два независимых RangePicker'а. Design System v2.0+.
 *
 * Register in MainPreset.js with:
 *   new SupersetPluginChartDivergingBars().configure({
 *     key: 'ext-velocity-diverging',
 *   })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartDivergingBars extends ChartPlugin<VelocityDivergingFormData> {
  constructor() {
    super({
      buildQuery,
      controlPanel,
      loadChart: () => import('../VelocityDiverging'),
      metadata: new ChartMetadata({
        name: '[MRTS] Diverging Bars',
        description: t(
          'Двусторонняя bar-диаграмма: ранжирование объектов по темпу ' +
            'period-over-period (предыдущий период / неделя / месяц / ' +
            'квартал / год / custom) с диверджент-баром и детализацией. ' +
            'DS 2.0.',
        ),
        thumbnail,
        tags: [
          'MRTS',
          t('Ranking'),
          t('Diverging'),
          t('Comparison'),
          t('Featured'),
        ],
        category: 'MRTS',
      }),
      transformProps,
    });
  }
}
