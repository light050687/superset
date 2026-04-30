import * as React from 'react';
import type { Direction, FormatRow, Formatters } from '../types';
export interface BulletRowHandlers {
    onClick: (row: FormatRow, ctrlKey: boolean) => void;
    onHover: (row: FormatRow | null, x: number, y: number) => void;
}
interface BulletRowProps {
    row: FormatRow;
    scaleMax: number;
    direction: Direction;
    filtered: boolean;
    dimmed: boolean;
    statusColor: string;
    formatters: Formatters;
    handlers: BulletRowHandlers;
}
declare const _default: React.NamedExoticComponent<BulletRowProps>;
export default _default;
//# sourceMappingURL=BulletRow.d.ts.map