import React from 'react';
import type { RankedRow } from '../types';
interface TooltipConfig {
    invertDeltaGood: boolean;
    decimalsValue: number;
    decimalsDelta: number;
    decimalsShare: number;
    unitSuffixRub: string;
}
/**
 * Build tooltip body for a row — 4 rows of stats + trend indicator + footer hint.
 * Runs for hover preview only; DetailModal has its own layout.
 */
export declare function buildTooltipContent(row: RankedRow, cfg: TooltipConfig): React.ReactNode;
export {};
//# sourceMappingURL=tooltipContent.d.ts.map