"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreset = getPreset;
const mockGenerator_1 = require("../utils/mockGenerator");
let cachedPreset = null;
function getPreset(id = 'losses_velocity') {
    if (cachedPreset && cachedPreset.id === id)
        return cachedPreset;
    const stores = (0, mockGenerator_1.generateStores)();
    cachedPreset = {
        id: 'losses_velocity',
        label: 'Скорость потерь (400 магазинов)',
        stores,
        formats: mockGenerator_1.DEFAULT_FORMATS,
    };
    return cachedPreset;
}
//# sourceMappingURL=presets.js.map