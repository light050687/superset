import type { Store } from '../types';
import type { DsTokens } from '../themeTokens';
interface Props {
    open: boolean;
    store: Store | null;
    allStores: Store[];
    tokens: DsTokens;
    onClose: () => void;
    periodLabel?: string;
}
declare function StoreModalInner({ open, store, allStores, tokens, onClose, periodLabel, }: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof StoreModalInner>;
export default _default;
//# sourceMappingURL=StoreModal.d.ts.map