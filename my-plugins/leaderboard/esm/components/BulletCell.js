import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { memo } from 'react';
import { BulletCellEl, Cell } from '../styles';
import { deltaClass, nf2 } from '../utils/formatRussian';
/**
 * Bullet chart с plan-маркером (столбец "Уровень потерь").
 * Цвет заливки определяется по дельте value-plan и правилу invertGood=true
 * (рост списаний это плохо).
 */
function BulletCellInner({ value, plan, globalMax, tokens }) {
    const dClass = deltaClass(value - plan, true);
    const color = dClass === 'dn' ? tokens.dn : dClass === 'up' ? tokens.up : tokens.wn;
    const max = Math.max(globalMax, plan, value, 0.01) * 1.05;
    const fillPct = Math.min(100, (value / max) * 100);
    const planPct = (plan / max) * 100;
    return (_jsx(Cell, { "$align": "right", children: _jsxs(BulletCellEl, { children: [_jsxs("span", { className: "bullet-val", style: { color }, children: [_jsxs("span", { children: [nf2(value), "%"] }), _jsxs("span", { className: "plan", children: ["\u043F\u043B\u0430\u043D ", nf2(plan), "%"] })] }), _jsxs("span", { className: "bullet-track", children: [_jsx("span", { className: "bullet-fill", style: { width: `${fillPct}%`, background: color } }), _jsx("span", { className: "bullet-target", style: { left: `calc(${planPct}% - 1px)` } })] })] }) }));
}
export default memo(BulletCellInner);
//# sourceMappingURL=BulletCell.js.map