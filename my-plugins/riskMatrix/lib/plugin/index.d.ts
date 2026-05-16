import { ChartPlugin } from '@superset-ui/core';
import { ScatterRiskFormData } from '../types';
/**
 * Risk Matrix plugin (internal: ScatterRisk).
 *
 * Register in MainPreset.js:
 *   new SupersetPluginChartRiskMatrix().configure({ key: 'ext-scatter-risk' })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartRiskMatrix extends ChartPlugin<ScatterRiskFormData> {
    constructor();
}
//# sourceMappingURL=index.d.ts.map