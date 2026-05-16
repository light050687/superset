/**
 * Category color palette — aligned with the prototype.
 *
 * Ordering: sky → tangerine → fuchsia → amber → violet → grey.
 * Last entry is used for the "Other" bucket when categories exceed the limit.
 */
export interface PaletteEntry {
    colorToken: string;
    colorLight: string;
    colorDark: string;
}
export declare const CATEGORY_PALETTE: PaletteEntry[];
/** Fallback color for the "Other" category bucket */
export declare const OTHER_COLOR: PaletteEntry;
/**
 * Pick a palette entry by index, cycling when the caller exceeds CATEGORY_PALETTE.length.
 */
export declare function pickPaletteEntry(index: number): PaletteEntry;
/** Pick the right color for the current theme */
export declare function resolveColor(entry: PaletteEntry, isDark: boolean): string;
//# sourceMappingURL=colorPalette.d.ts.map