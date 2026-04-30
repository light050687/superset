/**
 * Mock data presets for KPI card design mode.
 *
 * Each preset contains realistic numbers for a specific KPI type.
 * Used when building dashboards before real data is available.
 */
export interface MockPresetData {
    /** Display name (Russian) */
    label: string;
    /** Main metric value — Mode A */
    mainA: number;
    /** Comparison 1 (e.g. previous year) — Mode A */
    comp1A: number | null;
    /** Comparison 2 (e.g. plan) — Mode A */
    comp2A: number | null;
    /** Main metric value — Mode B (percentage/ratio) */
    mainB: number;
    /** Comparison 1 — Mode B */
    comp1B: number | null;
    /** Comparison 2 — Mode B */
    comp2B: number | null;
    /** Number of groups for detail modal */
    groupCount: number;
    /** Children per group in detail modal */
    childrenPerGroup: number;
}
export declare const MOCK_PRESETS: Record<string, MockPresetData>;
/**
 * Parse custom JSON into MockPresetData with safe defaults.
 */
export declare function parseCustomPreset(json: string): MockPresetData;
/**
 * Get preset by key, falling back to 'revenue'.
 */
export declare function getPreset(key: string | undefined, customJson?: string): MockPresetData;
//# sourceMappingURL=presets.d.ts.map