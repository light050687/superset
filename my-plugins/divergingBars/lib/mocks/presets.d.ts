import type { FormatDef, Store } from '../types';
/**
 * Пресеты мок-данных для карточки «Скорость роста потерь».
 * В первой итерации — только один (losses_velocity, 400 магазинов).
 */
export interface VelocityPreset {
    id: string;
    label: string;
    stores: Store[];
    formats: FormatDef[];
}
export declare function getPreset(id?: string): VelocityPreset;
//# sourceMappingURL=presets.d.ts.map