import { ChartPlugin, ChartMetadata } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
/**
 * Pivot Heatmap plugin for Superset (internal: HeatmapPivot).
 *
 * Register in MainPreset.js with:
 *   new SupersetPluginChartPivotHeatmap().configure({ key: 'ext-heatmap-pivot' })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartPivotHeatmap extends ChartPlugin {
    constructor() {
        super({
            buildQuery,
            controlPanel,
            loadChart: () => import('../HeatmapPivot'),
            metadata: new ChartMetadata({
                name: '[MRTS] Pivot Heatmap',
                description: 'Pivot-таблица с цветными ячейками по статусу: hover-подсветка, сортировка, кросс-фильтр, drill-modal с breakdown, сравнение A vs B. Design System v2.0.',
                thumbnail,
                tags: ['MRTS', 'Heatmap', 'Pivot', 'Matrix', 'Comparison', 'Featured'],
                category: 'MRTS',
            }),
            transformProps,
        });
    }
}
//# sourceMappingURL=index.js.map