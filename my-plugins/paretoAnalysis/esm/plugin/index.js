import { ChartPlugin, ChartMetadata, t } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
/**
 * Pareto Analysis plugin для Superset (internal: ParetoCard).
 *
 * Регистрация в MainPreset.js:
 *   new SupersetPluginChartParetoAnalysis().configure({ key: 'ext-pareto-card' })
 * (viz_type ключ 'ext-pareto-card' оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartParetoAnalysis extends ChartPlugin {
    constructor() {
        super({
            buildQuery,
            controlPanel,
            loadChart: () => import('../ParetoCard'),
            metadata: new ChartMetadata({
                name: '[MRTS] Pareto Analysis',
                description: t('Парето-анализ с ABC-зонами, кумулятивной линией и drill-down. ' +
                    'Runtime-контроли порога, Top-A, Пред.период, ₽/% — прямо в чарте. ' +
                    'Design System v2.0.'),
                thumbnail,
                tags: [
                    'MRTS',
                    t('Pareto'),
                    t('ABC'),
                    t('Combo'),
                    t('Distribution'),
                    t('Featured'),
                ],
                category: 'MRTS',
            }),
            transformProps,
        });
    }
}
//# sourceMappingURL=index.js.map