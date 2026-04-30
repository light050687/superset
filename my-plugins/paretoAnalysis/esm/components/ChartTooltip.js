import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { TooltipEl } from '../styles/styled';
import { zoneColor, zoneLabel, toRgba } from '../utils/zoneColors';
import { formatMetricValue, formatPct1, formatPct2, formatSignedPct1 } from '../utils/paretoFormat';
/**
 * DOM-tooltip поверх ECharts canvas. Позиционируется offsetX/Y внутри
 * родителя с `position:relative`. Не использует порталы, чтобы наследовать
 * overflow/clip карточки и автоматически ехать при scroll дашборда.
 */
export default function ChartTooltip({ item, x, y, tokens, metricLabel, metricUnit, showPrev, }) {
    const zCol = zoneColor(item.zone, tokens);
    const zLab = zoneLabel(item.zone);
    const zBg = toRgba(zCol, 0.18);
    const rankRow = showPrev && item.rankPrev != null && item.rankDelta !== 0 ? (_jsxs("div", { className: "tt-row", children: [_jsx("span", { children: "\u0420\u0430\u043D\u0433" }), _jsxs("b", { className: (item.rankDelta ?? 0) > 0 ? 'dn' : 'up', children: ["#", item.rankPrev, " \u2192 #", item.rank] })] })) : (_jsxs("div", { className: "tt-row", children: [_jsx("span", { children: "\u0420\u0430\u043D\u0433" }), _jsxs("b", { children: ["#", item.rank] })] }));
    let prevBlock = null;
    if (showPrev && item.valuePrev != null) {
        const prev = item.valuePrev;
        const deltaPct = prev !== 0 ? ((item.value - prev) / prev) * 100 : null;
        const deltaCls = deltaPct == null ? '' : deltaPct > 0.5 ? 'dn' : deltaPct < -0.5 ? 'up' : '';
        prevBlock = (_jsxs(_Fragment, { children: [_jsx("div", { className: "tt-divider" }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { children: "\u041F\u0440\u043E\u0448\u043B\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" }), _jsx("b", { children: formatMetricValue(prev, metricUnit) })] }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { children: "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435" }), _jsx("b", { className: deltaCls, children: formatSignedPct1(deltaPct) })] })] }));
    }
    // Смещение от курсора; clamp внутри box будет делать браузер за счёт overflow.
    const style = {
        left: x + 12,
        top: y + 12,
    };
    return (_jsxs(TooltipEl, { style: style, role: "tooltip", children: [_jsxs("div", { className: "tt-title", children: [_jsx("span", { className: "dot", style: { background: zCol } }), _jsx("span", { children: item.name }), _jsx("span", { className: "zone", style: { background: zBg, color: zCol }, children: zLab })] }), rankRow, _jsxs("div", { className: "tt-row", children: [_jsx("span", { children: metricLabel }), _jsx("b", { children: formatMetricValue(item.value, metricUnit) })] }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { children: "\u0414\u043E\u043B\u044F" }), _jsx("b", { children: formatPct2(item.share) })] }), _jsx("div", { className: "tt-divider" }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { children: "\u041A\u0443\u043C\u0443\u043B\u044F\u0442\u0438\u0432\u043D\u043E" }), _jsx("b", { children: formatPct1(item.cumPct) })] }), prevBlock] }));
}
//# sourceMappingURL=ChartTooltip.js.map