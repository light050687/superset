import { LIGHT_TOKENS, DARK_TOKENS } from '../themeTokens';

/**
 * Category color palette — aligned with the prototype.
 *
 * Ordering: sky → tangerine → fuchsia → amber → violet → grey.
 * Last entry is used for the "Other" bucket when categories exceed the limit.
 */
export interface PaletteEntry {
  colorToken: string; // CSS var name (e.g. '--c-sky')
  colorLight: string;
  colorDark: string;
}

export const CATEGORY_PALETTE: PaletteEntry[] = [
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
export const OTHER_COLOR: PaletteEntry = {
  colorToken: '--g500',
  colorLight: LIGHT_TOKENS.g500,
  colorDark: DARK_TOKENS.g500,
};

/**
 * Pick a palette entry by index, cycling when the caller exceeds CATEGORY_PALETTE.length.
 */
export function pickPaletteEntry(index: number): PaletteEntry {
  if (index < CATEGORY_PALETTE.length) return CATEGORY_PALETTE[index];
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}

/** Pick the right color for the current theme */
export function resolveColor(entry: PaletteEntry, isDark: boolean): string {
  return isDark ? entry.colorDark : entry.colorLight;
}
