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
    searchMatchesCount: number;
    onSearchSelect: () => void;
}
/** Toolbar: Reset · dropdown (6 icon-only actions) · Clear · Search */
declare const ToolbarBar: React.FC<ToolbarProps>;
export default ToolbarBar;
//# sourceMappingURL=Toolbar.d.ts.map