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
 */
const TrendChart = ({ data, color, height = 90, labelBuilder = DEFAULT_LABEL, }) => {
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
        return {
            w,
            h,
            padB,
            linePath,
            areaPath,
            points: data.map((v, i) => ({
                x: sx(i).toFixed(1),
                y: sy(v).toFixed(1),
                last: i === data.length - 1,
            })),
            labels,
        };
    }, [data, height, labelBuilder]);
    if (!paths)
        return null;
    // Use a unique gradient id so two charts on the page don't clash.
    const gradId = react_1.default.useId();
    return ((0, jsx_runtime_1.jsxs)("svg", { width: "100%", height: paths.h, viewBox: `0 0 ${paths.w} ${paths.h}`, preserveAspectRatio: "none", overflow: "visible", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsxs)("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "0%", stopColor: color, stopOpacity: 0.3 }), (0, jsx_runtime_1.jsx)("stop", { offset: "100%", stopColor: color, stopOpacity: 0.02 })] }) }), (0, jsx_runtime_1.jsx)("line", { x1: 8, y1: paths.h - paths.padB, x2: paths.w - 8, y2: paths.h - paths.padB, stroke: "var(--g200)", strokeWidth: 1 }), (0, jsx_runtime_1.jsx)("path", { d: paths.areaPath, fill: `url(#${gradId})` }), (0, jsx_runtime_1.jsx)("path", { d: paths.linePath, fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }), paths.points.map((p, i) => ((0, jsx_runtime_1.jsx)("circle", { cx: p.x, cy: p.y, r: p.last ? 3.5 : 1.8, fill: color, stroke: "var(--s)", strokeWidth: p.last ? 1.5 : 1 }, i))), paths.labels.map((l, i) => ((0, jsx_runtime_1.jsx)("text", { x: l.x, y: paths.h - 4, fontFamily: "JetBrains Mono, monospace", fontSize: "9", fontWeight: "500", fill: "var(--g500)", textAnchor: "middle", letterSpacing: "0.5", children: l.label }, i)))] }));
};
exports.default = (0, react_1.memo)(TrendChart);
//# sourceMappingURL=TrendChart.js.map