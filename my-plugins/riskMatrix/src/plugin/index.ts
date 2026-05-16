import { ChartPlugin, ChartMetadata, t } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
import { ScatterRiskFormData } from '../types';

/**
 * Risk Matrix plugin (internal: ScatterRisk).
 *
 * Register in MainPreset.js:
 *   new SupersetPluginChartRiskMatrix().configure({ key: 'ext-scatter-risk' })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartRiskMatrix extends ChartPlugin<ScatterRiskFormData> {
  constructor() {
    super({
      buildQuery,
      controlPanel,
      loadChart: () => import('../ScatterRisk'),
      metadata: new ChartMetadata({
        name: '[MRTS] Risk Matrix',
        description: t(
          'Scatter-plot матрица рисков с 4 квадрантами, zoom/pan, lasso-выделением ' +
            'и модалями детализации. Design System v2.0.',
        ),
        thumbnail,
        tags: ['MRTS', t('Scatter'), t('Bubble'), t('Risk'), t('Correlation'), t('Featured')],
        category: 'MRTS',
      }),
      transformProps,
    });
  }
}
