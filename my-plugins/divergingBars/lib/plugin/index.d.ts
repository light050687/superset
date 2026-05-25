import { ChartPlugin } from '@superset-ui/core';
import type { VelocityDivergingFormData } from '../types';
/**
 * Diverging Bars plugin for Apache Superset 6.0+ (internal: VelocityDiverging).
 *
 * Двусторонняя bar-диаграмма для сравнения объектов period-over-period.
 * Через Superset built-in time_compare поддерживает 5 preset режимов
 * (предыдущий период / неделя / месяц / квартал / год) + custom через
 * два независимых RangePicker'а. Design System v2.0+.
 *
 * Register in MainPreset.js with:
 *   new SupersetPluginChartDivergingBars().configure({
 *     key: 'ext-velocity-diverging',
 *   })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartDivergingBars extends ChartPlugin<VelocityDivergingFormData> {
    constructor();
}
//# sourceMappingURL=index.d.ts.map