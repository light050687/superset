import { ChartPlugin } from '@superset-ui/core';
import { KpiCardFormData } from '../types';
/**
 * Scorecard plugin for Superset (internal: KpiCard).
 *
 * Register in MainPreset.js with:
 *   new SupersetPluginChartScorecard().configure({ key: 'ext-kpi-card' })
 * (viz_type ключ оставлен 'ext-kpi-card' ради совместимости с существующими чартами в БД.)
 */
export default class SupersetPluginChartScorecard extends ChartPlugin<KpiCardFormData> {
    constructor();
}
//# sourceMappingURL=index.d.ts.map