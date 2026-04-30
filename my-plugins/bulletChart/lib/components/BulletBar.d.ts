import * as React from 'react';
import type { Direction } from '../types';
interface BulletBarProps {
    /** Фактическое значение */
    value: number;
    /** Целевое значение (план). Если null — target не рисуется и зоны делят шкалу на 3 равные части. */
    target: number | null;
    /** Общий максимум шкалы — единый для всех строк, чтобы бары были сравнимы. */
    scaleMax: number;
    /** Направление «хорошо»: влияет на расположение качественных зон. */
    direction: Direction;
}
declare const _default: React.NamedExoticComponent<BulletBarProps>;
export default _default;
//# sourceMappingURL=BulletBar.d.ts.map