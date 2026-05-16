import { DataState } from '../types';
export interface EmptyStateProps {
    state: Exclude<DataState, 'populated'>;
}
/** Загрузочные/пустые/ошибочные состояния по DS 2.0. */
export default function EmptyState({ state }: EmptyStateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=EmptyState.d.ts.map