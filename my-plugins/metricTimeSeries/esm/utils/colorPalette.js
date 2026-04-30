import { LIGHT_TOKENS, DARK_TOKENS } from '../themeTokens';
export const CATEGORY_PALETTE = [
    {
        colorToken: '--c-sky',
        colorLight: LIGHT_TOKENS.cSky,
        colorDark: DARK_TOKENS.cSky,
    },
    {
        colorToken: '--c-tangerine',
        colorLight: LIGHT_TOKENS.cTangerine,
        colorDark: DARK_TOKENS.cTangerine,
    },
    {
        colorToken: '--c-fuchsia',
        colorLight: LIGHT_TOKENS.cFuchsia,
        colorDark: DARK_TOKENS.cFuchsia,
    },
    {
        colorToken: '--c-amber',
        colorLight: LIGHT_TOKENS.cAmber,
        colorDark: DARK_TOKENS.cAmber,
    },
    {
        colorToken: '--c-violet',
        colorLight: LIGHT_TOKENS.cViolet,
        colorDark: DARK_TOKENS.cViolet,
    },
];
/** Fallback color for the "Other" category bucket */
export const OTHER_COLOR = {
    colorToken: '--g500',
    colorLight: LIGHT_TOKENS.g500,
    colorDark: DARK_TOKENS.g500,
};
/**
 * Pick a palette entry by index, cycling when the caller exceeds CATEGORY_PALETTE.length.
 */
export function pickPaletteEntry(index) {
    if (index < CATEGORY_PALETTE.length)
        return CATEGORY_PALETTE[index];
    return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}
/** Pick the right color for the current theme */
export function resolveColor(entry, isDark) {
    return isDark ? entry.colorDark : entry.colorLight;
}
//# sourceMappingURL=colorPalette.js.map