import { ChartPlugin, ChartMetadata } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
/**
 * Drill-down Donut plugin для Superset (internal: StructureDonut).
 *
 * Регистрация в MainPreset.js:
 *   new SupersetPluginChartDrilldownDonut().configure({ key: 'ext-structure-donut' })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartDrilldownDonut extends ChartPlugin {
    constructor() {
        super({
            buildQuery,
            controlPanel,
            loadChart: () => import('../StructureDonut'),
            metadata: new ChartMetadata({
                name: '[MRTS] Drill-down Donut',
                description: 'Двухуровневая кольцевая диаграмма с drill-down, переключателем ₽/%, ' +
                    'hero-числом в центре и кастомной легендой. Design System v2.0.',
                thumbnail,
                tags: ['MRTS', 'Donut', 'Pie', 'Drill-down', 'Structure', 'Featured'],
                category: 'MRTS',
            }),
            transformProps,
        });
    }
}
//# sourceMappingURL=index.js.map