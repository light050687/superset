import { ChartPlugin, ChartMetadata, t } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
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
export default class SupersetPluginChartRankedBars extends ChartPlugin {
    constructor() {
        super({
            buildQuery,
            controlPanel,
            loadChart: () => import('../RankedBars'),
            metadata: new ChartMetadata({
                name: '[MRTS] Ranked Bars',
                description: t('Карточка-рейтинг с прогресс-барами, спарклайнами, дельтой к прошлому периоду, ' +
                    'cross-filter по клику и drill-down по Ctrl+клику. Design System v2.0.'),
                thumbnail,
                tags: ['MRTS', t('Ranking'), t('Top-N'), t('Featured')],
                category: 'MRTS',
            }),
            transformProps,
        });
    }
}
//# sourceMappingURL=index.js.map