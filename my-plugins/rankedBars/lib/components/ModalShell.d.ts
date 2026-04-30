import React from 'react';
interface ModalShellProps {
    open: boolean;
    onClose: () => void;
    wide?: boolean;
    themeMode: 'light' | 'dark';
    zIndex?: number;
    labelledBy?: string;
    children: React.ReactNode;
}
/**
 * Common modal wrapper: portal-mounted backdrop + box with shared styling.
 * Handles click-outside-to-close and ensures CSS custom properties exist in the
 * portal subtree via `rootCss` + `data-theme`.
 *
 * Focus trap/restore is intentionally minimal: we set initial focus on the
 * first focusable child and listen to Tab to prevent escaping. `Escape`
 * handling is done by the RankedBars parent (priority-aware for stacked
 * modals).
 */
declare const ModalShell: React.FC<ModalShellProps>;
export default ModalShell;
//# sourceMappingURL=ModalShell.d.ts.map