import React from 'react';
type Mode = 'rect' | 'lasso' | null;
export type SelectAction = 'rect' | 'lasso' | 'worst5' | 'best5' | 'bad' | 'good';
interface ToolbarProps {
    selectMode: Mode;
    hasFilters: boolean;
    onAction: (action: SelectAction) => void;
    onReset: () => void;
    onClear: () => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
}
/** Toolbar: 3 видимых капсулы — Reset, Mode-Select dropdown (rect/lasso),
    Focus dropdown (worst5/best5/bad/good). Clear появляется условно как 4-я.
    Dropdown pattern из metricTimeSeries: trigger+options в одной капсуле,
    Panel расширяется вниз absolute. */
declare const ToolbarBar: React.FC<ToolbarProps>;
export default ToolbarBar;
//# sourceMappingURL=Toolbar.d.ts.map