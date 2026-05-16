import { ChartPlugin, ChartMetadata, Behavior } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
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
export default class SupersetPluginChartLeaderboard extends ChartPlugin {
    constructor() {
        super({
            buildQuery,
            controlPanel,
            loadChart: () => import('../RankedStoresChart'),
            metadata: new ChartMetadata({
                name: '[MRTS] Leaderboard',
                description: 'Интерактивная таблица-рейтинг: bullet-метрики, ' +
                    'tree-сегменты, drill-down модали, cross-filter, поиск и ' +
                    'CSV-экспорт. Design System v2.0.',
                thumbnail,
                tags: ['MRTS', 'Ranking', 'Leaderboard', 'Table', 'Featured'],
                category: 'MRTS',
                behaviors: [Behavior.InteractiveChart, Behavior.DrillToDetail],
            }),
            transformProps,
        });
    }
}
//# sourceMappingURL=index.js.map