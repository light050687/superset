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
    /** ink/s/g300 цвета для tooltip — нужны inline т.к. portal вне CSS-vars
        scope CardRoot и cascade переменных не работает. */
    ink: string;
    surface: string;
    border: string;
}
declare const BulletTooltip: React.FC<TooltipProps>;
export default BulletTooltip;
//# sourceMappingURL=Tooltip.d.ts.map