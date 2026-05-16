import type { Segment, Store } from '../types';
import type { DsTokens } from '../themeTokens';
interface Props {
    data: Store | Segment;
    level: 0 | 1;
    displayIdx: number;
    selected: boolean;
    dimmed: boolean;
    pinned: boolean;
    expanded: boolean;
    expandable: boolean;
    focused: boolean;
    tokens: DsTokens;
    globalMaxWriteoff: number;
    globalMaxShrinkage: number;
    onRowClick?: (e: React.MouseEvent) => void;
    onRowDblClick?: () => void;
    onRowMouseEnter?: (e: React.MouseEvent) => void;
    onRowMouseLeave?: () => void;
    onRowMouseMove?: (e: React.MouseEvent) => void;
    onToggleExpand?: () => void;
    onTogglePin?: () => void;
}
declare function StoreRowInner(props: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof StoreRowInner>;
export default _default;
//# sourceMappingURL=StoreRow.d.ts.map