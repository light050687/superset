export interface RankedBarItem {
    name: string;
    pct: number;
    delta: number;
    color: string;
}
interface Props {
    items: RankedBarItem[];
}
/** Список горизонтальных bar-rows (причины/виды списаний в модалке). */
declare function RankedBarListInner({ items }: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof RankedBarListInner>;
export default _default;
//# sourceMappingURL=RankedBarList.d.ts.map