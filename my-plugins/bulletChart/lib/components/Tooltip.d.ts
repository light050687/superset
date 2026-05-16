import * as React from 'react';
import type { FormatRow, Formatters } from '../types';
interface TooltipProps {
    row: FormatRow;
    direction: 'less_is_better' | 'more_is_better';
    formatters: Formatters;
    statusColor: string;
    x: number;
    y: number;
    rootEl: HTMLElement | null;
    showDetailHint: boolean;
}
declare const BulletTooltip: React.FC<TooltipProps>;
export default BulletTooltip;
//# sourceMappingURL=Tooltip.d.ts.map