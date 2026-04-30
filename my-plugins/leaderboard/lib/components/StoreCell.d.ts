import type { Segment, Store } from '../types';
interface Props {
    data: Store | Segment;
    pinned?: boolean;
    onTogglePin?: () => void;
}
declare function StoreCellInner({ data, pinned, onTogglePin }: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof StoreCellInner>;
export default _default;
//# sourceMappingURL=StoreCell.d.ts.map