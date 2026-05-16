/**
 * Чистая функция сборки EChartsCoreOption для Pareto Card.
 *
 * Принимает на вход:
 *   - computed: результат computePareto() с уже рассчитанными зонами и рангами
 *   - state: runtime-state (unit, topAOnly, prevOverlay, zoneFilter, selectedId,
 *            seriesVisible, threshold)
 *   - tokens: DS 2.0 hex-значения активной темы
 *   - metricUnit: строка для formatter-ов оси Y (напр. «млн ₽»)
 *
 * Не делает никаких side-effect'ов и не трогает window/document.
 */
import { ComputedPareto, ParetoState, ThemeTokens } from '../types';
export interface BuildOptionArgs {
    computed: ComputedPareto;
    state: ParetoState;
    tokens: ThemeTokens;
}
export type EChartsOption = Record<string, any>;
export declare function buildEChartsOption({ computed, state, tokens, }: BuildOptionArgs): EChartsOption;
//# sourceMappingURL=buildOption.d.ts.map