"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveColor = resolveColor;
exports.normalizeColorToken = normalizeColorToken;
exports.hexToRgba = hexToRgba;
const themeTokens_1 = require("../themeTokens");
/**
 * Allowed CSS custom property tokens that rows can reference.
 * The component registers these on its root element in both themes.
 */
const VALID_TOKENS = new Set([
    '--c-sky',
    '--c-violet',
    '--c-tangerine',
    '--c-fuchsia',
    '--c-amber',
    '--g500',
    '--up',
    '--dn',
    '--wn',
]);
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
/**
 * Resolve a user-supplied color spec to a CSS value usable in `background`, `stroke`, etc.
 *
 * Priority:
 *   1. Raw hex → used as-is.
 *   2. Known DS 2.0 token (with or without leading `--`) → wrapped in `var(…)`.
 *   3. Fallback to categorical palette by `index` (first 5 rows get accent colors,
 *      remaining rows get `--g500`).
 */
function resolveColor(raw, index) {
    if (typeof raw === 'string' && raw.length > 0) {
        const trimmed = raw.trim();
        if (HEX_RE.test(trimmed)) {
            return trimmed;
        }
        const withDashes = trimmed.startsWith('--') ? trimmed : `--${trimmed}`;
        if (VALID_TOKENS.has(withDashes)) {
            return `var(${withDashes})`;
        }
    }
    if (index < themeTokens_1.CATEGORICAL_TOKENS.length) {
        return `var(${themeTokens_1.CATEGORICAL_TOKENS[index]})`;
    }
    return 'var(--g500)';
}
/** Extract the raw CSS token (like `--c-sky`) or hex string kept on the row, for animations and a11y. */
function normalizeColorToken(raw, index) {
    if (typeof raw === 'string' && raw.length > 0) {
        const trimmed = raw.trim();
        if (HEX_RE.test(trimmed)) {
            return trimmed;
        }
        const withDashes = trimmed.startsWith('--') ? trimmed : `--${trimmed}`;
        if (VALID_TOKENS.has(withDashes)) {
            return withDashes;
        }
    }
    if (index < themeTokens_1.CATEGORICAL_TOKENS.length) {
        return themeTokens_1.CATEGORICAL_TOKENS[index];
    }
    return '--g500';
}
/**
 * Convert a `#rrggbb` string to `rgba(r, g, b, a)`. Used for icon backgrounds (fill tint).
 * If the input is a CSS var reference (`var(--c-sky)`) the runtime resolution must happen
 * in the component via `getComputedStyle`; this helper is for hex only.
 */
function hexToRgba(hex, alpha) {
    const cleaned = hex.replace('#', '');
    const full = cleaned.length === 3
        ? cleaned
            .split('')
            .map(c => c + c)
            .join('')
        : cleaned;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
//# sourceMappingURL=colors.js.map