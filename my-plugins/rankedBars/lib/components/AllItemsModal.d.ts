import React from 'react';
import type { RankedRow, SortMode, UnitMode } from '../types';
interface AllItemsModalProps {
    rows: RankedRow[];
    totalRows: number;
    totalSum: number;
    unit: UnitMode;
    maxValue: number;
    invertDeltaGood: boolean;
    decimalsValue: number;
    decimalsDelta: number;
    decimalsShare: number;
    unitSuffixRub: string;
    showSparkline: boolean;
    showGhostPrevBar: boolean;
    hasPrevMetric: boolean;
    activeIds: Set<string>;
    themeMode: 'light' | 'dark';
    initialSort: SortMode;
    onRowClick: (row: RankedRow, modKey: boolean) => void;
    onClose: () => void;
}
declare const AllItemsModal: React.FC<AllItemsModalProps>;
export default AllItemsModal;
//# sourceMappingURL=AllItemsModal.d.ts.map