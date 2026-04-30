import React from 'react';
type Mode = 'rect' | 'lasso' | null;
interface ToolbarProps {
    selectMode: Mode;
    hasFilters: boolean;
    onAction: (action: 'rect' | 'lasso' | 'worst5' | 'bad') => void;
    onReset: () => void;
    onClear: () => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    searchMatchesCount: number;
    onSearchSelect: () => void;
}
declare const ToolbarBar: React.FC<ToolbarProps>;
export default ToolbarBar;
//# sourceMappingURL=Toolbar.d.ts.map