import { DEFAULT_FORMATS, generateStores } from '../utils/mockGenerator';
let cachedPreset = null;
export function getPreset(id = 'losses_velocity') {
    if (cachedPreset && cachedPreset.id === id)
        return cachedPreset;
    const stores = generateStores();
    cachedPreset = {
        id: 'losses_velocity',
        label: 'Скорость потерь (400 магазинов)',
        stores,
        formats: DEFAULT_FORMATS,
    };
    return cachedPreset;
}
//# sourceMappingURL=presets.js.map