import type { AxisItem, CellData, CompareItem, DrillQueryParams, Thresholds, TotalsSlice } from './types';
interface DrillModalProps {
    item: CompareItem;
    onClose: () => void;
    rows: AxisItem[];
    cols: AxisItem[];
    cells: Map<string, CellData>;
    rowTotals: Map<string, TotalsSlice>;
    colTotals: Map<string, TotalsSlice>;
    thresholds: Thresholds;
    unitSuffix: string;
    decimals: number;
    drillQueryParams: DrillQueryParams | null;
    mockMode: boolean;
}
export declare function DrillModal(props: DrillModalProps): JSX.Element | null;
export {};
//# sourceMappingURL=DrillModal.d.ts.map