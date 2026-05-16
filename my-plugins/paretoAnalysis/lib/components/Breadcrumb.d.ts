import { ComputedParetoItem, ParetoState } from '../types';
export interface BreadcrumbProps {
    state: ParetoState;
    items: ComputedParetoItem[];
    /** Дефолтная подпись, когда активных фильтров нет. */
    defaultCaption?: string;
    onReset: () => void;
}
export default function Breadcrumb({ state, items, defaultCaption, onReset, }: BreadcrumbProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Breadcrumb.d.ts.map