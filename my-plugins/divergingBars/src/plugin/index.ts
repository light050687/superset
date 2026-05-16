import { ChartPlugin, ChartMetadata, t } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
import type { VelocityDivergingFormData } from '../types';

/**
 * Diverging Bars plugin for Apache Superset 6.0+ (internal: VelocityDiverging).
 *
 * Двусторонняя bar-диаграмма для сравнения объектов по темпу изменения метрики
 * между двумя периодами (WoW / 4W / MoM / Кумулятив.), с диверджент-баром,
 * спарклайнами и модалкой детализации. Design System v2.0.
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
            'между периодами (WoW / 4W / MoM / Кумулят.) с ' +
            'диверджент-баром, спарклайнами и детализацией. DS 2.0.',
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
