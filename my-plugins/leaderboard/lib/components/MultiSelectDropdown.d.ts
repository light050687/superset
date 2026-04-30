export interface DropdownOption {
    key: string;
    label: string;
    color?: string;
    count?: number;
}
interface Props {
    label: string;
    options: DropdownOption[];
    selected: Set<string>;
    onToggle: (key: string) => void;
    /** Для синхронизации — если родитель хочет закрыть меню. */
    externallyClosed?: boolean;
}
/**
 * Универсальный multi-select dropdown для Status/Format.
 * Закрывается кликом вне и Esc.
 */
declare function MultiSelectDropdownInner({ label, options, selected, onToggle, externallyClosed, }: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof MultiSelectDropdownInner>;
export default _default;
//# sourceMappingURL=MultiSelectDropdown.d.ts.map