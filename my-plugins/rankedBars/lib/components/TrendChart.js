"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const DEFAULT_LABEL = (weeksAgo) => weeksAgo === 0 ? 'сейчас' : `−${weeksAgo}н`;
/**
 * Area + line chart for the 12-week trend shown inside DetailModal.
 * Renders responsive (`preserveAspectRatio="none"`), matching the ref prototype.
 *
 * Hover: подсвечивает ближайшую точку через прозрачный overlay-rect на каждый
 * слот данных. При hover рисуется vertical guide, ring вокруг точки и
 * SVG-tooltip "value · период". Координаты tooltip flip'ятся к левому краю
 * для крайней правой точки, чтобы не уходить за границу chart.
 */
const TrendChart = ({ data, color, height = 90, labelBuilder = DEFAULT_LABEL, unitSuffix = '', }) => {
    const [hoverIdx, setHoverIdx] = (0, react_1.useState)(null);
    const paths = (0, react_1.useMemo)(() => {
        if (!data || data.length < 2)
            return null;
        const w = 700;
        const h = height;
        const padL = 8;
        const padR = 8;
        const padT = 10;
        const padB = 18;
        const min = Math.min(...data) * 0.9;
        const max = Math.max(...data) * 1.05;
        const range = max - min || 1;
        const sx = (i) => padL + (i / (data.length - 1)) * (w - padL - padR);
        const sy = (v) => h - padB - ((v - min) / range) * (h - padT - padB);
        const linePath = data
            .map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`)
            .join(' ');
        const areaPath = linePath +
            ` L${sx(data.length - 1).toFixed(1)} ${h - padB} L${sx(0).toFixed(1)} ${h - padB} Z`;
        const labels = [];
        const step = Math.max(1, Math.floor(data.length / 5));
        for (let i = 0; i < data.length; i += step) {
            const weeksAgo = data.length - 1 - i;
            labels.push({ x: sx(i), label: labelBuilder(weeksAgo) });
        }
        if (labels[labels.length - 1].x < sx(data.length - 1) - 10) {
            labels.push({ x: sx(data.length - 1), label: labelBuilder(0) });
        }
        const points = data.map((v, i) => ({
            x: sx(i),
            y: sy(v),
            v,
            weeksAgo: data.length - 1 - i,
            last: i === data.length - 1,
        }));
        // Hit-slot width — половина расстояния до соседних точек, с overflow
        // на крайних. Используется для прозрачного <rect> hover-target'а.
        const slotW = (w - padL - padR) / Math.max(1, data.length - 1);
        return { w, h, padB, padL, padR, padT, linePath, areaPath, labels, points, slotW };
    }, [data, height, labelBuilder]);
    if (!paths)
        return null;
    // Use a unique gradient id so two charts on the page don't clash.
    const gradId = react_1.default.useId();
    const hover = hoverIdx != null ? paths.points[hoverIdx] : null;
    // Tooltip text + flip к левому краю если точка близко к правой границе.
    const tooltipText = hover
        ? `${hover.v.toFixed(1)}${unitSuffix} · ${labelBuilder(hover.weeksAgo)}`
        : '';
    const tooltipPad = 8;
    const tooltipApproxW = Math.max(60, tooltipText.length * 7 + tooltipPad * 2);
    const tooltipH = 22;
    const tooltipFlipRight = hover ? hover.x + tooltipApproxW / 2 + 4 > paths.w : false;
    const tooltipFlipLeft = hover ? hover.x - tooltipApproxW / 2 - 4 < 0 : false;
    const tooltipX = hover
        ? tooltipFlipRight
            ? hover.x - tooltipApproxW - 6
            : tooltipFlipLeft
                ? hover.x + 6
                : hover.x - tooltipApproxW / 2
        : 0;
    /* Tooltip всегда строго над точкой с фиксированным gap. overflow:visible
       на SVG позволяет выйти за верхнюю границу для высоких точек — это OK,
       ModalSection дает достаточно места. */
    const TOOLTIP_GAP = 14;
    const tooltipY = hover ? hover.y - tooltipH - TOOLTIP_GAP : 0;
    return ((0, jsx_runtime_1.jsxs)("svg", { width: "100%", height: paths.h, viewBox: `0 0 ${paths.w} ${paths.h}`, preserveAspectRatio: "none", overflow: "visible", role: "img", "aria-label": "\u0422\u0440\u0435\u043D\u0434 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434", children: [(0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsxs)("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "0%", stopColor: color, stopOpacity: 0.3 }), (0, jsx_runtime_1.jsx)("stop", { offset: "100%", stopColor: color, stopOpacity: 0.02 })] }) }), (0, jsx_runtime_1.jsx)("line", { x1: 8, y1: paths.h - paths.padB, x2: paths.w - 8, y2: paths.h - paths.padB, stroke: "var(--g200)", strokeWidth: 1 }), (0, jsx_runtime_1.jsx)("path", { d: paths.areaPath, fill: `url(#${gradId})` }), (0, jsx_runtime_1.jsx)("path", { d: paths.linePath, fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }), paths.points.map((p, i) => ((0, jsx_runtime_1.jsx)("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: p.last ? 3.5 : 1.8, fill: color, stroke: "var(--s)", strokeWidth: p.last ? 1.5 : 1 }, i))), paths.labels.map((l, i) => ((0, jsx_runtime_1.jsx)("text", { x: l.x, y: paths.h - 4, fontFamily: "JetBrains Mono, monospace", fontSize: "9", fontWeight: "500", fill: "var(--g500)", textAnchor: "middle", letterSpacing: "0.5", children: l.label }, i))), paths.points.map((p, i) => ((0, jsx_runtime_1.jsx)("rect", { x: p.x - paths.slotW / 2, y: 0, width: paths.slotW, height: paths.h - paths.padB, fill: "transparent", style: { cursor: 'crosshair' }, onMouseEnter: () => setHoverIdx(i), onMouseLeave: () => setHoverIdx(prev => (prev === i ? null : prev)) }, `hit-${i}`))), hover && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("line", { x1: hover.x, y1: paths.padT, x2: hover.x, y2: paths.h - paths.padB, stroke: color, strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.55, pointerEvents: "none" }), (0, jsx_runtime_1.jsx)("circle", { cx: hover.x, cy: hover.y, r: 4.5, fill: color, stroke: "var(--s)", strokeWidth: 1.5, pointerEvents: "none" }), (0, jsx_runtime_1.jsxs)("g", { pointerEvents: "none", children: [(0, jsx_runtime_1.jsx)("rect", { x: tooltipX, y: tooltipY, width: tooltipApproxW, height: tooltipH, rx: 5, ry: 5, fill: "var(--ink)", opacity: 0.92 }), (0, jsx_runtime_1.jsx)("text", { x: tooltipX + tooltipApproxW / 2, y: tooltipY + tooltipH / 2 + 4, fontFamily: "JetBrains Mono, monospace", fontSize: "10", fontWeight: "600", fill: "var(--s)", textAnchor: "middle", letterSpacing: "0.3", children: tooltipText })] })] }))] }));
};
exports.default = (0, react_1.memo)(TrendChart);
//# sourceMappingURL=TrendChart.js.map