import type { RankedRow } from '../types';
/**
 * Mock dataset: «Причины списаний» — 22 rows matching ref/ranked-bars-prototype.html.
 * Used in Design Mode (controlPanel `mock_mode_enabled=true`).
 * Values are in millions of RUB.
 */
export declare const LOSSES_PRESET: RankedRow[];
/** Simpler preset — 16 expense categories. */
export declare const EXPENSES_PRESET: RankedRow[];
/** Parse user-supplied custom JSON safely. Returns empty array on any error. */
export declare function parseCustomMockJson(raw: unknown): RankedRow[];
//# sourceMappingURL=presets.d.ts.map