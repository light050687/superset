"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChartTooltip;
const jsx_runtime_1 = require("react/jsx-runtime");
const styled_1 = require("../styles/styled");
const zoneColors_1 = require("../utils/zoneColors");
const paretoFormat_1 = require("../utils/paretoFormat");
/**
 * DOM-tooltip поверх ECharts canvas. Позиционируется offsetX/Y внутри
 * родителя с `position:relative`. Не использует порталы, чтобы наследовать
 * overflow/clip карточки и автоматически ехать при scroll дашборда.
 */
function ChartTooltip({ item, x, y, tokens, metricLabel, metricUnit, showPrev, }) {
    const zCol = (0, zoneColors_1.zoneColor)(item.zone, tokens);
    const zLab = (0, zoneColors_1.zoneLabel)(item.zone);
    const zBg = (0, zoneColors_1.toRgba)(zCol, 0.18);
    const rankRow = showPrev && item.rankPrev != null && item.rankDelta !== 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { children: "\u0420\u0430\u043D\u0433" }), (0, jsx_runtime_1.jsxs)("b", { className: (item.rankDelta ?? 0) > 0 ? 'dn' : 'up', children: ["#", item.rankPrev, " \u2192 #", item.rank] })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { children: "\u0420\u0430\u043D\u0433" }), (0, jsx_runtime_1.jsxs)("b", { children: ["#", item.rank] })] }));
    let prevBlock = null;
    if (showPrev && item.valuePrev != null) {
        const prev = item.valuePrev;
        const deltaPct = prev !== 0 ? ((item.value - prev) / prev) * 100 : null;
        const deltaCls = deltaPct == null ? '' : deltaPct > 0.5 ? 'dn' : deltaPct < -0.5 ? 'up' : '';
        prevBlock = ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "tt-divider" }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { children: "\u041F\u0440\u043E\u0448\u043B\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" }), (0, jsx_runtime_1.jsx)("b", { children: (0, paretoFormat_1.formatMetricValue)(prev, metricUnit) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { children: "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435" }), (0, jsx_runtime_1.jsx)("b", { className: deltaCls, children: (0, paretoFormat_1.formatSignedPct1)(deltaPct) })] })] }));
    }
    // Смещение от курсора; clamp внутри box будет делать браузер за счёт overflow.
    const style = {
        left: x + 12,
        top: y + 12,
    };
    return ((0, jsx_runtime_1.jsxs)(styled_1.TooltipEl, { style: style, role: "tooltip", children: [(0, jsx_runtime_1.jsxs)("div", { className: "tt-title", children: [(0, jsx_runtime_1.jsx)("span", { className: "dot", style: { background: zCol } }), (0, jsx_runtime_1.jsx)("span", { children: item.name }), (0, jsx_runtime_1.jsx)("span", { className: "zone", style: { background: zBg, color: zCol }, children: zLab })] }), rankRow, (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { children: metricLabel }), (0, jsx_runtime_1.jsx)("b", { children: (0, paretoFormat_1.formatMetricValue)(item.value, metricUnit) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { children: "\u0414\u043E\u043B\u044F" }), (0, jsx_runtime_1.jsx)("b", { children: (0, paretoFormat_1.formatPct2)(item.share) })] }), (0, jsx_runtime_1.jsx)("div", { className: "tt-divider" }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { children: "\u041A\u0443\u043C\u0443\u043B\u044F\u0442\u0438\u0432\u043D\u043E" }), (0, jsx_runtime_1.jsx)("b", { children: (0, paretoFormat_1.formatPct1)(item.cumPct) })] }), prevBlock] }));
}
//# sourceMappingURL=ChartTooltip.js.map