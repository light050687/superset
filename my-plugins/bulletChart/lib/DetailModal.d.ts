import * as React from 'react';
import type { DetailQueryParams, Direction, FormatRow, Formatters } from './types';
interface DetailModalProps {
    row: FormatRow;
    scaleMax: number;
    direction: Direction;
    formatters: Formatters;
    detailQueryParams: DetailQueryParams | undefined;
    /** Если true — используем storesList из пресета вместо серверного запроса. */
    mockMode: boolean;
    onClose: () => void;
    rootEl: HTMLElement | null;
}
declare const DetailModal: React.FC<DetailModalProps>;
export default DetailModal;
//# sourceMappingURL=DetailModal.d.ts.map