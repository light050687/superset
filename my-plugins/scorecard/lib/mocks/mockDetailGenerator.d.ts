/**
 * Mock data generator for DetailModal.
 *
 * Generates realistic-looking aggregated groups and children
 * with Pareto-like distribution (top groups get most of the value).
 * Supports pagination, sorting, and search — all client-side.
 */
import type { MockPresetData } from './presets';
interface GenerateMockGroupsParams {
    preset: MockPresetData;
    groupbyCol: string;
    childCol?: string;
    page: number;
    pageSize: number;
    sortAsc: boolean;
    searchQuery: string;
    exactMatch: boolean;
    isModeBActive: boolean;
}
interface MockGroupsResult {
    rows: Record<string, unknown>[];
    totalCount: number;
}
/**
 * Generate mock aggregated groups for DetailModal.
 *
 * Returns data in the same shape as Superset API response rows.
 */
export declare function generateMockGroups(params: GenerateMockGroupsParams): MockGroupsResult;
/**
 * Generate mock children for a specific group.
 */
export declare function generateMockChildren(params: {
    preset: MockPresetData;
    groupName: string;
    childCol: string;
    parentMainValue: number;
    isModeBActive: boolean;
}): Record<string, unknown>[];
export {};
//# sourceMappingURL=mockDetailGenerator.d.ts.map