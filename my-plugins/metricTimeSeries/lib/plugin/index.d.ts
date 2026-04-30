import { ChartPlugin } from '@superset-ui/core';
import { WriteoffsTSFormData } from '../types';
/**
 * Metric Time Series plugin для Superset (internal: WriteoffsTimeseries).
 *
 * Register in MainPreset.js with:
 *   new SupersetPluginChartMetricTimeSeries().configure({ key: 'ext-writeoffs-timeseries' })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartMetricTimeSeries extends ChartPlugin<WriteoffsTSFormData> {
    constructor();
}
//# sourceMappingURL=index.d.ts.map