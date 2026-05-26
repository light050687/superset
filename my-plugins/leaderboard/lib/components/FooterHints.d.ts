interface FooterProps {
    /** Кол-во магазинов после фильтров (для расчёта диапазона страницы). */
    shown: number;
    /** Общее число магазинов до фильтров (для подсказки «отфильтровано из»). */
    total: number;
    /** Текущая страница (0-indexed, уже clamped в [0..pageCount-1]). */
    page: number;
    /** Размер страницы. */
    pageSize: number;
    /** Общее число страниц (минимум 1). */
    pageCount: number;
    /** Колбек смены страницы — компонент сам валидирует границы. */
    onPageChange: (page: number) => void;
}
declare function FooterHintsInner({ shown, total, page, pageSize, pageCount, onPageChange, }: FooterProps): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof FooterHintsInner>;
export default _default;
/** ControlsHint — i-кнопка для размещения в CardHead Controls. */
declare function ControlsHintInner(): import("react/jsx-runtime").JSX.Element;
export declare const ControlsHint: import("react").MemoExoticComponent<typeof ControlsHintInner>;
//# sourceMappingURL=FooterHints.d.ts.map