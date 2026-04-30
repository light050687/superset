import type { Segment, Store } from '../types';
import type { DsTokens } from '../themeTokens';
interface Props {
    data: Store | Segment;
    tokens: DsTokens;
}
/** Ячейка «Основные драйверы» — 3 строки для store, 2 для сегмента. */
declare function DriversCellInner({ data, tokens }: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof DriversCellInner>;
export default _default;
//# sourceMappingURL=DriversCell.d.ts.map