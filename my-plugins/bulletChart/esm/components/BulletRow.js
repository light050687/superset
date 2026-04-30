import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { BArrow, BMain, BMeta, BMetaCell, BMetaL, BMetaRow, BMetaV, BName, BNameWrap, BRow, BSpark, BTop, BVal, } from '../styles';
import BulletBar from './BulletBar';
import Sparkline from './Sparkline';
import { formatStoresCount } from '../utils/format';
function deltaTone(delta, direction, tolerance = 0.01) {
    if (delta == null)
        return 'default';
    if (Math.abs(delta) <= tolerance)
        return 'wn';
    if (direction === 'less_is_better')
        return delta > 0 ? 'dn' : 'up';
    return delta > 0 ? 'up' : 'dn';
}
// ── SVG-иконки ──
// Треугольник для дельты к плану: острием в направлении знака (ref:803-807).
const ArrowTriangle = ({ sign }) => (_jsx("svg", { viewBox: "0 0 8 8", width: 9, height: 9, fill: "currentColor", "aria-hidden": "true", children: sign === 'up' ? (_jsx("path", { d: "M4 1 L7 6 L1 6 Z" })) : (_jsx("path", { d: "M4 7 L7 2 L1 2 Z" })) }));
// Иконка домика перед количеством магазинов (ref:815-818).
const StoresIcon = () => (_jsxs("svg", { viewBox: "0 0 12 12", width: 9, height: 9, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("path", { d: "M2 5 L2 10 L10 10 L10 5" }), _jsx("path", { d: "M1 5 L6 1 L11 5" })] }));
const BulletRow = ({ row, scaleMax, direction, filtered, dimmed, statusColor, formatters, handlers, }) => {
    const handleClick = React.useCallback((e) => {
        handlers.onClick(row, e.ctrlKey || e.metaKey);
    }, [handlers, row]);
    const handleKeyDown = React.useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlers.onClick(row, e.ctrlKey || e.metaKey);
        }
    }, [handlers, row]);
    const handleMouseEnter = React.useCallback((e) => {
        handlers.onHover(row, e.clientX, e.clientY);
    }, [handlers, row]);
    const handleMouseMove = React.useCallback((e) => {
        handlers.onHover(row, e.clientX, e.clientY);
    }, [handlers, row]);
    const handleMouseLeave = React.useCallback(() => {
        handlers.onHover(null, 0, 0);
    }, [handlers]);
    const deltaPlanStr = row.deltaPlan != null ? formatters.deltaPP(row.deltaPlan) : '—';
    const deltaPyStr = row.deltaPy != null ? formatters.deltaPP(row.deltaPy) : '—';
    // Стрелка направления по знаку дельты (для less_is_better: + рост = плохо ⇒ ▲).
    const arrowSign = row.deltaPlan == null || Math.abs(row.deltaPlan) <= 0.01
        ? null
        : row.deltaPlan > 0
            ? 'up'
            : 'down';
    return (_jsxs(BRow, { role: "listitem", tabIndex: 0, filtered: filtered, dimmed: dimmed, statusColor: statusColor, onClick: handleClick, onKeyDown: handleKeyDown, onMouseEnter: handleMouseEnter, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave, "aria-label": `${row.name}: факт ${formatters.value(row.rate)}${row.plan != null ? `, план ${formatters.value(row.plan)}` : ''}`, children: [_jsxs(BTop, { children: [_jsxs(BNameWrap, { children: [_jsx(BName, { children: row.name }), row.stores != null ? (_jsxs(BMeta, { children: [_jsx(StoresIcon, {}), formatStoresCount(row.stores)] })) : null] }), _jsxs(BMain, { children: [_jsx(BVal, { children: formatters.value(row.rate) }), arrowSign != null ? (_jsxs(BArrow, { children: [_jsx(ArrowTriangle, { sign: arrowSign }), _jsx("span", { children: deltaPlanStr })] })) : null] })] }), _jsx(BulletBar, { value: row.rate, target: row.plan, scaleMax: scaleMax, direction: direction }), _jsxs(BMetaRow, { children: [_jsxs(BMetaCell, { children: [_jsx(BMetaL, { children: "\u041F\u043B\u0430\u043D" }), _jsx(BMetaV, { tone: "default", children: row.plan != null ? formatters.value(row.plan) : '—' })] }), _jsxs(BMetaCell, { children: [_jsx(BMetaL, { children: "\u041F\u0440\u043E\u0448\u043B. \u0433\u043E\u0434" }), _jsx(BMetaV, { tone: "default", children: row.py != null ? formatters.value(row.py) : '—' })] }), _jsxs(BMetaCell, { children: [_jsx(BMetaL, { children: "\u0394 \u043A \u043F\u043B\u0430\u043D\u0443" }), _jsx(BMetaV, { tone: deltaTone(row.deltaPlan, direction), children: deltaPlanStr })] }), _jsxs(BMetaCell, { children: [_jsx(BMetaL, { children: "\u0394 \u043A \u041F\u0413" }), _jsx(BMetaV, { tone: deltaTone(row.deltaPy, direction), children: deltaPyStr })] }), _jsx(BSpark, { children: _jsx(Sparkline, { points: row.spark, color: statusColor, width: 70, height: 18 }) })] })] }));
};
export default React.memo(BulletRow);
//# sourceMappingURL=BulletRow.js.map