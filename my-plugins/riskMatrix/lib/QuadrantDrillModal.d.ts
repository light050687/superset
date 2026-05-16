import React from 'react';
import { StorePoint, QuadrantDef, QuadrantKey, FormatValueFn } from './types';
import { Thresholds } from './utils/quadrants';
interface Props {
    quadrantKey: QuadrantKey;
    quadrants: Record<QuadrantKey, QuadrantDef>;
    thresholds: Thresholds;
    stores: StorePoint[];
    allStoresTotal: number;
    formatColorMap: Map<string, string>;
    formatX: FormatValueFn;
    formatY: FormatValueFn;
    formatLoss: FormatValueFn;
    formatCount: FormatValueFn;
    xShort: string;
    yShort: string;
    onClose: () => void;
    onOpenStore: (id: string) => void;
}
declare const QuadrantDrillModal: React.FC<Props>;
export default QuadrantDrillModal;
//# sourceMappingURL=QuadrantDrillModal.d.ts.map