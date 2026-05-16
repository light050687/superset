import type { AxisItem, CellData, CompareItem, DrillQueryParams, TotalsSlice } from './types';
interface CompareModalProps {
    itemA: CompareItem;
    itemB: CompareItem;
    onClose: () => void;
    rows: AxisItem[];
    cols: AxisItem[];
    cells: Map<string, CellData>;
    rowTotals: Map<string, TotalsSlice>;
    colTotals: Map<string, TotalsSlice>;
    unitSuffix: string;
    decimals: number;
    drillQueryParams: DrillQueryParams | null;
    mockMode: boolean;
}
export declare function CompareModal(props: CompareModalProps): JSX.Element | null;
export {};
//# sourceMappingURL=CompareModal.d.ts.map