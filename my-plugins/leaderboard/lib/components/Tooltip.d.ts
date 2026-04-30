import { ReactNode } from 'react';
export interface TooltipPos {
    x: number;
    y: number;
}
interface Props {
    visible: boolean;
    pos: TooltipPos | null;
    children: ReactNode;
}
/** Portal-tooltip. Позиционируется относительно курсора, «прилипает» к границам окна. */
declare function TooltipInner({ visible, pos, children }: Props): import("react").ReactPortal;
declare const _default: import("react").MemoExoticComponent<typeof TooltipInner>;
export default _default;
//# sourceMappingURL=Tooltip.d.ts.map