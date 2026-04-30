import { ChartPlugin } from '@superset-ui/core';
import { RankedStoresFormData } from '../types';
/**
 * Leaderboard plugin for Superset (internal: RankedStores).
 *
 * Интерактивная таблица-рейтинг с tree-expansion сегментов,
 * двумя drill-down модалями, cross-filter, фильтрами/поиском/сортировкой,
 * CSV-экспортом и Design System v2.0 темой.
 *
 * Register in MainPreset.js with:
 *   new SupersetPluginChartLeaderboard().configure({ key: 'ext-ranked-stores' })
 * (viz_type ключ оставлен ради совместимости с существующими чартами.)
 */
export default class SupersetPluginChartLeaderboard extends ChartPlugin<RankedStoresFormData> {
    constructor();
}
//# sourceMappingURL=index.d.ts.map