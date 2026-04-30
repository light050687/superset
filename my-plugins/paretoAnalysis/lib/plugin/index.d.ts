import { ChartPlugin } from '@superset-ui/core';
import { ParetoCardFormData } from '../types';
/**
 * Pareto Analysis plugin для Superset (internal: ParetoCard).
 *
 * Регистрация в MainPreset.js:
 *   new SupersetPluginChartParetoAnalysis().configure({ key: 'ext-pareto-card' })
 * (viz_type ключ 'ext-pareto-card' оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartParetoAnalysis extends ChartPlugin<ParetoCardFormData> {
    constructor();
}
//# sourceMappingURL=index.d.ts.map