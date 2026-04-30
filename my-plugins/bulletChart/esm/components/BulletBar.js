import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { BBand, BBar, BChart, BTarget } from '../styles';
/**
 * Bullet-бар в стиле Stephen Few с 3 качественными зонами, основным баром и маркером цели.
 *
 * Зоны строятся относительно target (plan) по формуле из прототипа (ref:793-796):
 *   band1 (g100, «приемлемо») — вся ширина scaleMax
 *   band2 (g200, «хорошо»)    — до plan
 *   band3 (g300, «отлично»)   — до 0.8 × plan
 *
 * Для `more_is_better` зоны отражены: «отлично» справа от 1.2×plan, «хорошо» — от plan.
 */
const BulletBar = ({ value, target, scaleMax, direction, }) => {
    const safeScale = scaleMax > 0 ? scaleMax : 1;
    const pct = (v) => Math.min(100, Math.max(0, (v / safeScale) * 100));
    const barWidth = pct(value);
    const targetLeft = target != null ? pct(target) : null;
    // Построение 3 зон.
    // less_is_better: малые значения → хорошо → рисуем «good» узкой слева.
    // more_is_better: большие значения → хорошо → рисуем «good» широкой, «bad» узкой слева.
    const bandsLess = target != null
        ? [
            { w: 100, kind: 'bad' }, // band1 — весь фон
            { w: pct(target), kind: 'warn' }, // band2 — до плана
            { w: pct(target * 0.8), kind: 'good' }, // band3 — до 80% плана
        ]
        : [
            { w: 100, kind: 'bad' },
            { w: 66.6, kind: 'warn' },
            { w: 33.3, kind: 'good' },
        ];
    const bandsMore = target != null
        ? [
            { w: 100, kind: 'bad' }, // band1 — весь фон = плохо
            { w: pct(target * 1.2), kind: 'warn' }, // band2 — до 120% плана
            { w: pct(target), kind: 'good' }, // band3 — до плана (inverted)
        ]
        : bandsLess;
    const bands = direction === 'less_is_better' ? bandsLess : bandsMore;
    return (_jsxs(BChart, { role: "img", "aria-label": target != null ? `Значение ${value}, цель ${target}` : `Значение ${value}`, children: [bands.map((b, i) => (_jsx(BBand, { bg: b.kind, style: { width: `${b.w}%` }, "aria-hidden": "true" }, i))), _jsx(BBar, { widthPct: barWidth }), targetLeft != null ? _jsx(BTarget, { leftPct: targetLeft }) : null] }));
};
export default React.memo(BulletBar);
//# sourceMappingURL=BulletBar.js.map