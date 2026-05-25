"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreset = getPreset;
const mockGenerator_1 = require("../utils/mockGenerator");
let cached = null;
function getPreset(id = 'losses_velocity', comparisonMode = 'prev_period') {
    if (cached && cached.id === id && cached.mode === comparisonMode) {
        return cached.preset;
    }
    const stores = (0, mockGenerator_1.generateStores)(mockGenerator_1.DEFAULT_FORMATS, undefined, comparisonMode);
    const preset = {
        id: 'losses_velocity',
        label: 'Скорость потерь (400 магазинов)',
        stores,
        formats: mockGenerator_1.DEFAULT_FORMATS,
    };
    cached = { id, mode: comparisonMode, preset };
    return preset;
}
//# sourceMappingURL=presets.js.map