import { ChartPlugin, ChartMetadata } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
/**
 * Bullet Chart plugin for Superset.
 *
 * Register in MainPreset.js:
 *   new SupersetPluginChartBullet().configure({ key: 'ext-bullet-chart' })
 */
export default class SupersetPluginChartBullet extends ChartPlugin {
    constructor() {
        super({
            buildQuery,
            controlPanel,
            loadChart: () => import('../BulletChart'),
            metadata: new ChartMetadata({
                name: '[MRTS] Bullet Chart',
                description: 'Bullet chart в стиле Stephen Few: сравнение факта с планом и ПГ ' +
                    'по категориям, зоны качества, sparkline, drill-down. Design System v2.0.',
                thumbnail,
                tags: ['MRTS', 'KPI', 'Bullet', 'Comparison', 'Featured'],
                category: 'MRTS',
            }),
            transformProps,
        });
    }
}
//# sourceMappingURL=index.js.map