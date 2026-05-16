import type { FormatDef, Store } from '../types';
import { DEFAULT_FORMATS, generateStores } from '../utils/mockGenerator';

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

let cachedPreset: VelocityPreset | null = null;

export function getPreset(id: string = 'losses_velocity'): VelocityPreset {
  if (cachedPreset && cachedPreset.id === id) return cachedPreset;
  const stores = generateStores();
  cachedPreset = {
    id: 'losses_velocity',
    label: 'Скорость потерь (400 магазинов)',
    stores,
    formats: DEFAULT_FORMATS,
  };
  return cachedPreset;
}
