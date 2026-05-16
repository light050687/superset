import { ChartPlugin } from '@superset-ui/core';
import type { VelocityDivergingFormData } from '../types';
/**
 * Diverging Bars plugin for Apache Superset 6.0+ (internal: VelocityDiverging).
 *
 * Двусторонняя bar-диаграмма для сравнения объектов по темпу изменения метрики
 * между двумя периодами (WoW / 4W / MoM / Кумулятив.), с диверджент-баром,
 * спарклайнами и модалкой детализации. Design System v2.0.
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