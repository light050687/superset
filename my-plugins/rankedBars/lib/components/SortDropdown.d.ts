import React from 'react';
import type { SortMode } from '../types';
interface SortDropdownProps {
    value: SortMode;
    onChange: (next: SortMode) => void;
    /** Disable the "delta" option when no previous-period metric is configured. */
    deltaDisabled?: boolean;
}
declare const _default: React.NamedExoticComponent<SortDropdownProps>;
export default _default;
//# sourceMappingURL=SortDropdown.d.ts.map