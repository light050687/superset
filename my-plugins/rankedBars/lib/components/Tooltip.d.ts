import React from 'react';
export interface TooltipPayload {
    element: React.ReactNode;
    clientX: number;
    clientY: number;
    /** Theme mode passed from parent so portal root gets the same CSS vars. */
    themeMode: 'light' | 'dark';
}
interface TooltipProps {
    payload: TooltipPayload | null;
}
/**
 * Singleton tooltip rendered through a portal so z-index and clipping work
 * independently of the card DOM. Auto-flips near viewport edges.
 *
 * The portal host duplicates `data-theme` so CSS custom properties resolve
 * correctly even when rendered outside the plugin root.
 */
declare const Tooltip: React.FC<TooltipProps>;
export default Tooltip;
//# sourceMappingURL=Tooltip.d.ts.map