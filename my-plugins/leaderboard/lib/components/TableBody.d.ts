import type { FlatRow, Store } from '../types';
import type { DsTokens } from '../themeTokens';
interface Props {
    rows: FlatRow[];
    /** Для scale в bullet-cells. */
    allStores: Store[];
    crossSelected: Set<string>;
    segmentCrossSelected: Set<string>;
    pinned: Set<string>;
    expanded: Set<string>;
    focusedRowId: string | null;
    tokens: DsTokens;
    onRowClick: (id: string, idx: number, e: React.MouseEvent) => void;
    onRowDblClick: (id: string, parentStoreId?: string) => void;
    onRowMouseEnter?: (id: string, e: React.MouseEvent) => void;
    onRowMouseMove?: (id: string, e: React.MouseEvent) => void;
    onRowMouseLeave?: () => void;
    onToggleExpand: (id: string) => void;
    onTogglePin: (id: string) => void;
}
declare function TableBodyInner(props: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof TableBodyInner>;
export default _default;
//# sourceMappingURL=TableBody.d.ts.map