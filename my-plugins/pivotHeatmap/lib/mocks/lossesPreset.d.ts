/**
 * Synthetic losses dataset used in mock mode.
 *
 * Values mirror the prototype `ref/heatmap-pivot-prototype.html`
 * makeData() generator — deterministic pseudo-random numbers seeded
 * by row+col id strings.
 */
import type { AxisItem, BreakdownRow, CellData } from '../types';
export declare const MOCK_ROWS: AxisItem[];
export declare const MOCK_COLS_DIVISION: AxisItem[];
export declare const MOCK_COLS_REGION: AxisItem[];
export declare const MOCK_COLS_UPR_REGION: AxisItem[];
export declare const MOCK_COLS_CITY: AxisItem[];
/** Default axis = division (matches prototype default). */
export declare const MOCK_COLS: AxisItem[];
export interface MockAxisDescriptor {
    key: string;
    label: string;
    cols: AxisItem[];
}
export declare const MOCK_AXES: MockAxisDescriptor[];
export interface MockCellFull extends CellData {
    breakdown: BreakdownRow[];
}
export declare function buildMockCells(axisKey?: string): Map<string, MockCellFull>;
//# sourceMappingURL=lossesPreset.d.ts.map