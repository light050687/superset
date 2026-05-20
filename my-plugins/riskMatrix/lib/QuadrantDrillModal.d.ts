import React from 'react';
import { StorePoint, QuadrantDef, QuadrantKey, FormatValueFn } from './types';
import { Thresholds } from './utils/quadrants';
interface Props {
    /** Quadrant-режим: показать stores конкретного quadrant'a.
        Null в selection-режиме (когда передан selectionIds). */
    quadrantKey: QuadrantKey | null;
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
    /** Selection-режим: показать stores по списку ID (cross-filter selection).
        Когда задан, quadrantKey игнорируется, header показывает
        «Выбранные магазины» вместо quadrant title. */
    selectionIds?: string[];
    /** Override заголовка в selection-режиме (default: «Выбранные магазины»).
        Используется когда selectionIds = все stores (для «Все магазины»). */
    selectionTitle?: string;
    /** Override подзаголовка в selection-режиме. */
    selectionSubtitle?: string;
}
declare const QuadrantDrillModal: React.FC<Props>;
export default QuadrantDrillModal;
//# sourceMappingURL=QuadrantDrillModal.d.ts.map