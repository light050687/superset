import { ChartPlugin } from '@superset-ui/core';
import type { HeatmapPivotFormData } from '../types';
/**
 * Pivot Heatmap plugin for Superset (internal: HeatmapPivot).
 *
 * Register in MainPreset.js with:
 *   new SupersetPluginChartPivotHeatmap().configure({ key: 'ext-heatmap-pivot' })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartPivotHeatmap extends ChartPlugin<HeatmapPivotFormData> {
    constructor();
}
//# sourceMappingURL=index.d.ts.map