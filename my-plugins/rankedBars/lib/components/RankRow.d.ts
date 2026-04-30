import React from 'react';
import type { RankedRow, UnitMode } from '../types';
interface RankRowProps {
    row: RankedRow;
    /** 0-based visible index — rendered as `i + 1` in the badge. */
    index: number;
    /**
     * Max metric value across the full dataset, used as the denominator for
     * bar width. Must already match the currently selected unit:
     *   - rub: max of row.value
     *   - pct: max of row.sharePct
     */
    maxValue: number;
    unit: UnitMode;
    invertDeltaGood: boolean;
    decimalsValue: number;
    decimalsDelta: number;
    decimalsShare: number;
    unitSuffixRub: string;
    showSparkline: boolean;
    showGhostPrevBar: boolean;
    filtered: boolean;
    onClick: (row: RankedRow, modKey: boolean) => void;
    onHoverStart?: (row: RankedRow, evt: React.MouseEvent) => void;
    onHoverMove?: (evt: React.MouseEvent) => void;
    onHoverEnd?: () => void;
}
declare const _default: React.NamedExoticComponent<RankRowProps>;
export default _default;
//# sourceMappingURL=RankRow.d.ts.map