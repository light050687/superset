import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { Cell, DualBulletEl } from '../styles';
import { nf2 } from '../utils/formatRussian';
/** Стекованные bullets: СП (tangerine) + НД (sky) с планом. */
function DualBulletInner({ writeoff, shrinkage, planWriteoff, planShrinkage, maxWriteoff, maxShrinkage, tokens, }) {
    const maxW = Math.max(maxWriteoff, 0.01) * 1.05;
    const maxS = Math.max(maxShrinkage, 0.01) * 1.05;
    const wFill = Math.min(100, (writeoff / maxW) * 100);
    const wTarget = (planWriteoff / maxW) * 100;
    const sFill = Math.min(100, (Math.max(0, shrinkage) / maxS) * 100);
    const sTarget = (planShrinkage / maxS) * 100;
    return (_jsx(Cell, { "$align": "right", children: _jsxs(DualBulletEl, { children: [_jsxs("span", { className: "db-row", style: { color: tokens.tangerine }, children: [_jsx("span", { className: "db-label", children: "\u0421\u041F" }), _jsxs("span", { className: "db-track", children: [_jsx("span", { className: "db-fill", style: { width: `${wFill}%`, background: tokens.tangerine } }), _jsx("span", { className: "db-target", style: { left: `calc(${wTarget}% - 1px)` } })] }), _jsxs("span", { className: "db-val", children: [nf2(writeoff), "%"] })] }), _jsxs("span", { className: "db-row", style: { color: tokens.sky }, children: [_jsx("span", { className: "db-label", children: "\u041D\u0414" }), _jsxs("span", { className: "db-track", children: [_jsx("span", { className: "db-fill", style: { width: `${sFill}%`, background: tokens.sky } }), _jsx("span", { className: "db-target", style: { left: `calc(${sTarget}% - 1px)` } })] }), _jsxs("span", { className: "db-val", children: [nf2(shrinkage), "%"] })] })] }) }));
}
export default memo(DualBulletInner);
//# sourceMappingURL=DualBulletCell.js.map