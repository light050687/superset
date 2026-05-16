/**
 * Resolve a user-supplied color spec to a CSS value usable in `background`, `stroke`, etc.
 *
 * Priority:
 *   1. Raw hex → used as-is.
 *   2. Known DS 2.0 token (with or without leading `--`) → wrapped in `var(…)`.
 *   3. Fallback to categorical palette by `index` (first 5 rows get accent colors,
 *      remaining rows get `--g500`).
 */
export declare function resolveColor(raw: unknown, index: number): string;
/** Extract the raw CSS token (like `--c-sky`) or hex string kept on the row, for animations and a11y. */
export declare function normalizeColorToken(raw: unknown, index: number): string;
/**
 * Convert a `#rrggbb` string to `rgba(r, g, b, a)`. Used for icon backgrounds (fill tint).
 * If the input is a CSS var reference (`var(--c-sky)`) the runtime resolution must happen
 * in the component via `getComputedStyle`; this helper is for hex only.
 */
export declare function hexToRgba(hex: string, alpha: number): string;
//# sourceMappingURL=colors.d.ts.map