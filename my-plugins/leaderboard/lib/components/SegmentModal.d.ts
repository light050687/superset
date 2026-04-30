import type { Segment, Store } from '../types';
import type { DsTokens } from '../themeTokens';
interface Props {
    open: boolean;
    parentStore: Store | null;
    segment: Segment | null;
    allStores: Store[];
    tokens: DsTokens;
    onClose: () => void;
    periodLabel?: string;
}
declare function SegmentModalInner({ open, parentStore, segment, allStores, tokens, onClose, periodLabel, }: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof SegmentModalInner>;
export default _default;
//# sourceMappingURL=SegmentModal.d.ts.map