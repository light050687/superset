/**
 * Synthetic losses dataset used in mock mode.
 *
 * Values mirror the prototype `ref/heatmap-pivot-prototype.html`
 * makeData() generator — deterministic pseudo-random numbers seeded
 * by row+col id strings.
 */
import type { AxisItem, BreakdownRow, CellData } from '../types';
export declare const MOCK_ROWS: AxisItem[];
export declare const MOCK_COLS: AxisItem[];
export interface MockCellFull extends CellData {
    breakdown: BreakdownRow[];
}
export declare function buildMockCells(): Map<string, MockCellFull>;
//# sourceMappingURL=lossesPreset.d.ts.map