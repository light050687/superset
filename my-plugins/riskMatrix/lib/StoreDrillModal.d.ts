import React from 'react';
import { StorePoint, QuadrantDef, QuadrantKey, DetailQueryParams, FormatValueFn } from './types';
import { Thresholds } from './utils/quadrants';
interface Props {
    storeId: string;
    stores: StorePoint[];
    quadrants: Record<QuadrantKey, QuadrantDef>;
    thresholds: Thresholds;
    formatColorMap: Map<string, string>;
    formatX: FormatValueFn;
    formatY: FormatValueFn;
    formatSize: FormatValueFn;
    formatLoss: FormatValueFn;
    xShort: string;
    yShort: string;
    sizeUnit: string;
    detailQueryParams: DetailQueryParams;
    onClose: () => void;
}
declare const StoreDrillModal: React.FC<Props>;
export default StoreDrillModal;
//# sourceMappingURL=StoreDrillModal.d.ts.map