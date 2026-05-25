import type { ComparisonMode, FormatDef, Store } from '../types';
import { DEFAULT_FORMATS, generateStores } from '../utils/mockGenerator';

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

let cached: { id: string; mode: ComparisonMode; preset: VelocityPreset } | null =
  null;

export function getPreset(
  id: string = 'losses_velocity',
  comparisonMode: ComparisonMode = 'prev_period',
): VelocityPreset {
  if (cached && cached.id === id && cached.mode === comparisonMode) {
    return cached.preset;
  }
  const stores = generateStores(DEFAULT_FORMATS, undefined, comparisonMode);
  const preset: VelocityPreset = {
    id: 'losses_velocity',
    label: 'Скорость потерь (400 магазинов)',
    stores,
    formats: DEFAULT_FORMATS,
  };
  cached = { id, mode: comparisonMode, preset };
  return preset;
}
