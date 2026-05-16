import { ChartPlugin } from '@superset-ui/core';
import type { RankedBarsFormData } from '../types';
/**
 * Ranked Bars plugin for Superset.
 *
 * Renders a compact ranking card (Top-N rows) with ghost bars, sparklines,
 * delta to previous period, share %, cross-filter on click and drill-down on
 * Ctrl/Cmd+click. Matches DS 2.0 prototype.
 *
 * Register in MainPreset.js with:
 *   new SupersetPluginChartRankedBars().configure({ key: 'ext-ranked-bars' })
 */
export default class SupersetPluginChartRankedBars extends ChartPlugin<RankedBarsFormData> {
    constructor();
}
//# sourceMappingURL=index.d.ts.map