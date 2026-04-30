"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTHER_COLOR = exports.CATEGORY_PALETTE = void 0;
exports.pickPaletteEntry = pickPaletteEntry;
exports.resolveColor = resolveColor;
const themeTokens_1 = require("../themeTokens");
exports.CATEGORY_PALETTE = [
    {
        colorToken: '--c-sky',
        colorLight: themeTokens_1.LIGHT_TOKENS.cSky,
        colorDark: themeTokens_1.DARK_TOKENS.cSky,
    },
    {
        colorToken: '--c-tangerine',
        colorLight: themeTokens_1.LIGHT_TOKENS.cTangerine,
        colorDark: themeTokens_1.DARK_TOKENS.cTangerine,
    },
    {
        colorToken: '--c-fuchsia',
        colorLight: themeTokens_1.LIGHT_TOKENS.cFuchsia,
        colorDark: themeTokens_1.DARK_TOKENS.cFuchsia,
    },
    {
        colorToken: '--c-amber',
        colorLight: themeTokens_1.LIGHT_TOKENS.cAmber,
        colorDark: themeTokens_1.DARK_TOKENS.cAmber,
    },
    {
        colorToken: '--c-violet',
        colorLight: themeTokens_1.LIGHT_TOKENS.cViolet,
        colorDark: themeTokens_1.DARK_TOKENS.cViolet,
    },
];
/** Fallback color for the "Other" category bucket */
exports.OTHER_COLOR = {
    colorToken: '--g500',
    colorLight: themeTokens_1.LIGHT_TOKENS.g500,
    colorDark: themeTokens_1.DARK_TOKENS.g500,
};
/**
 * Pick a palette entry by index, cycling when the caller exceeds CATEGORY_PALETTE.length.
 */
function pickPaletteEntry(index) {
    if (index < exports.CATEGORY_PALETTE.length)
        return exports.CATEGORY_PALETTE[index];
    return exports.CATEGORY_PALETTE[index % exports.CATEGORY_PALETTE.length];
}
/** Pick the right color for the current theme */
function resolveColor(entry, isDark) {
    return isDark ? entry.colorDark : entry.colorLight;
}
//# sourceMappingURL=colorPalette.js.map