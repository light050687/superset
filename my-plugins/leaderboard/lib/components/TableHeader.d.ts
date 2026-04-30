import type { SortDir, SortKey } from '../types';
interface Props {
    sortBy: SortKey;
    sortDir: SortDir;
    onSort: (sortKey: SortKey, defaultDir: SortDir) => void;
}
declare function TableHeaderInner({ sortBy, sortDir, onSort }: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof TableHeaderInner>;
export default _default;
//# sourceMappingURL=TableHeader.d.ts.map