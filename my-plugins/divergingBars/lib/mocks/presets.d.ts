import type { ComparisonMode, FormatDef, Store } from '../types';
/**
 * Пресеты мок-данных для карточки «Скорость роста потерь».
 * В первой итерации — только один (losses_velocity, 400 магазинов).
 *
 * Данные генерируются с учётом текущего ComparisonMode: чем «дальше»
 * comparison-период, тем сильнее разброс prev vs curr.
 */
export interface VelocityPreset {
    id: string;
    label: string;
    stores: Store[];
    formats: FormatDef[];
}
export declare function getPreset(id?: string, comparisonMode?: ComparisonMode): VelocityPreset;
//# sourceMappingURL=presets.d.ts.map