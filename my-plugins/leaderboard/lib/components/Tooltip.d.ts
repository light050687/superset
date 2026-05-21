import { ReactNode } from 'react';
export interface TooltipPos {
    x: number;
    y: number;
}
interface Props {
    visible: boolean;
    pos: TooltipPos | null;
    children: ReactNode;
    /** ink/s/g700 цвета для tooltip — нужны inline т.к. portal вне CSS-vars
        scope CardRoot и cascade переменных не работает. */
    ink: string;
    surface: string;
    border: string;
}
/** Portal-tooltip. Позиционируется относительно курсора, «прилипает» к границам окна. */
declare function TooltipInner({ visible, pos, children, ink, surface, border }: Props): import("react").ReactPortal;
declare const _default: import("react").MemoExoticComponent<typeof TooltipInner>;
export default _default;
//# sourceMappingURL=Tooltip.d.ts.map