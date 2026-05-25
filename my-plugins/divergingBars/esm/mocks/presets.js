import { DEFAULT_FORMATS, generateStores } from '../utils/mockGenerator';
let cached = null;
export function getPreset(id = 'losses_velocity', comparisonMode = 'prev_period') {
    if (cached && cached.id === id && cached.mode === comparisonMode) {
        return cached.preset;
    }
    const stores = generateStores(DEFAULT_FORMATS, undefined, comparisonMode);
    const preset = {
        id: 'losses_velocity',
        label: 'Скорость потерь (400 магазинов)',
        stores,
        formats: DEFAULT_FORMATS,
    };
    cached = { id, mode: comparisonMode, preset };
    return preset;
}
//# sourceMappingURL=presets.js.map