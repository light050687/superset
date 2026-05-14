"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCategoryColor = void 0;
const types_1 = require("../types");
/**
 * Возвращает accent-ключ и итоговый hex-цвет для категории.
 *
 * Приоритет:
 *   1. Явный override из controlPanel (colorMap по name — регистронезависимо).
 *   2. Автопалитра по индексу: cSky → cViolet → cTangerine → cFuchsia → cAmber → cycle.
 *
 * Неизвестные accent-ключи в overrides отбрасываются с единоразовым warning'ом.
 */
const KNOWN_ACCENTS = new Set(types_1.ACCENT_PALETTE);
function resolveCategoryColor(categoryName, colorMap, tokens, fallbackIndex) {
    const normalizedName = categoryName.trim().toLowerCase();
    const override = colorMap?.find((o) => typeof o.name === 'string' &&
        o.name.trim().toLowerCase() === normalizedName);
    if (override && KNOWN_ACCENTS.has(override.accent)) {
        return { accent: override.accent, color: tokens[override.accent] };
    }
    // Неизвестные accent-ключи молча падают в fallback-палитру. В dev-среде
    // это ловит Zod-валидация CategoryColorMapControl; логировать через
    // console — нарушение observability (structured logging only).
    const accent = types_1.ACCENT_PALETTE[fallbackIndex % types_1.ACCENT_PALETTE.length];
    return { accent, color: tokens[accent] };
}
exports.resolveCategoryColor = resolveCategoryColor;
//# sourceMappingURL=resolveColor.js.map