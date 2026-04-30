import { ChartPlugin } from '@superset-ui/core';
import { StructureDonutFormData } from '../types';
/**
 * Drill-down Donut plugin для Superset (internal: StructureDonut).
 *
 * Регистрация в MainPreset.js:
 *   new SupersetPluginChartDrilldownDonut().configure({ key: 'ext-structure-donut' })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartDrilldownDonut extends ChartPlugin<StructureDonutFormData> {
    constructor();
}
//# sourceMappingURL=index.d.ts.map