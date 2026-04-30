import type { SortKey } from '../types';
export type ColumnType = 'tree' | 'rank' | 'store' | 'bullet-loss' | 'dual-bullet' | 'number' | 'drivers' | 'status';
export interface ColumnDef {
    id: string;
    label: string;
    type: ColumnType;
    width: string;
    sortKey?: SortKey;
    sortable?: boolean;
    defaultSort?: 'asc' | 'desc';
    align?: 'left' | 'right' | 'center';
    /** Для type === 'number' — какое поле брать из Store. */
    numberField?: 'avgWriteoff' | 'avgShrinkageCheck';
}
export declare const COLUMNS: ColumnDef[];
export declare const GRID_COLS: string;
//# sourceMappingURL=columns.d.ts.map