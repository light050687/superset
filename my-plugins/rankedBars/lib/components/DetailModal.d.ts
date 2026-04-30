import React from 'react';
import type { DrillQueryParams, RankedRow } from '../types';
interface DetailModalProps {
    row: RankedRow;
    queryParams: DrillQueryParams;
    unitSuffixRub: string;
    decimalsValue: number;
    decimalsDelta: number;
    invertDeltaGood: boolean;
    isMockMode: boolean;
    themeMode: 'light' | 'dark';
    onClose: () => void;
}
declare const DetailModal: React.FC<DetailModalProps>;
export default DetailModal;
//# sourceMappingURL=DetailModal.d.ts.map