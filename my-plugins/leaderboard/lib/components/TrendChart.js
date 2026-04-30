"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const catmullRom_1 = require("../utils/catmullRom");
const formatRussian_1 = require("../utils/formatRussian");
const styles_1 = require("../styles");
/** Большой SVG-график тренда с Catmull-Rom smooth + hover-overlay с tooltip. */
function TrendChartInner({ data, tokens }) {
    const gradId = `rs-trend-grad-${(0, react_1.useId)()}`;
    const overlayRef = (0, react_1.useRef)(null);
    const [hover, setHover] = (0, react_1.useState)(null);
    const { path, areaPath, pts, labels } = (0, react_1.useMemo)(() => {
        const w = 860;
        const h = 140;
        const padL = 10;
        const padR = 10;
        const padT = 14;
        const padB = 26;
        const min = Math.min(...data) * 0.9;
        const max = Math.max(...data) * 1.08;
        const range = max - min || 1;
        const sx = (i) => padL + (i / Math.max(1, data.length - 1)) * (w - padL - padR);
        const sy = (v) => h - padB - ((v - min) / range) * (h - padT - padB);
        const ptsArr = data.map((v, i) => ({ x: sx(i), y: sy(v), val: v, idx: i }));
        const p = (0, catmullRom_1.catmullRomSmoothPath)(ptsArr);
        const firstX = ptsArr[0]?.x.toFixed(1) ?? '0';
        const lastX = ptsArr[ptsArr.length - 1]?.x.toFixed(1) ?? '0';
        const area = `${p} L${lastX} ${(h - padB).toFixed(1)} L${firstX} ${(h - padB).toFixed(1)} Z`;
        const lbls = [];
        for (let i = 0; i < data.length; i += 2) {
            const weeksAgo = data.length - 1 - i;
            lbls.push({
                x: sx(i),
                label: weeksAgo === 0 ? 'сейчас' : `−${weeksAgo}н`,
            });
        }
        return { path: p, areaPath: area, pts: ptsArr, labels: lbls };
    }, [data]);
    const w = 860;
    const h = 140;
    const padT = 14;
    const padB = 26;
    const onMove = (e) => {
        const rect = overlayRef.current?.getBoundingClientRect();
        if (!rect)
            return;
        const xInSvg = ((e.clientX - rect.left) / rect.width) * w;
        let near = pts[0];
        let minDist = Math.abs(pts[0].x - xInSvg);
        for (let i = 1; i < pts.length; i += 1) {
            const d = Math.abs(pts[i].x - xInSvg);
            if (d < minDist) {
                minDist = d;
                near = pts[i];
            }
        }
        setHover({ idx: near.idx, x: near.x, y: near.y, val: near.val });
    };
    const hoverLabel = hover && (data.length - 1 - hover.idx === 0
        ? 'сейчас'
        : `${data.length - 1 - hover.idx} нед. назад`);
    return ((0, jsx_runtime_1.jsxs)(styles_1.MTrendCard, { children: [(0, jsx_runtime_1.jsxs)("svg", { width: "100%", height: h, viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none", overflow: "visible", children: [(0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsxs)("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "0%", stopColor: tokens.tangerine, stopOpacity: 0.35 }), (0, jsx_runtime_1.jsx)("stop", { offset: "100%", stopColor: tokens.tangerine, stopOpacity: 0.02 })] }) }), (0, jsx_runtime_1.jsx)("line", { x1: 10, y1: h - padB, x2: w - 10, y2: h - padB, stroke: tokens.g200, strokeWidth: 1 }), (0, jsx_runtime_1.jsx)("path", { d: areaPath, fill: `url(#${gradId})` }), (0, jsx_runtime_1.jsx)("path", { d: path, fill: "none", stroke: tokens.tangerine, strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }), pts.map((p, i) => {
                        const isLast = i === pts.length - 1;
                        return ((0, jsx_runtime_1.jsx)("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: isLast ? 3.5 : 2, fill: tokens.tangerine, stroke: tokens.g50, strokeWidth: isLast ? 2 : 1 }, i));
                    }), labels.map((l, i) => ((0, jsx_runtime_1.jsx)("text", { x: l.x, y: h - 7, fontFamily: tokens.fontMono, fontSize: "10", fontWeight: "500", fill: tokens.g500, textAnchor: "middle", children: l.label }, i))), hover && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("line", { x1: hover.x, y1: padT, x2: hover.x, y2: h - padB, stroke: tokens.g300, strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.8, pointerEvents: "none" }), (0, jsx_runtime_1.jsx)("circle", { cx: hover.x, cy: hover.y, r: 5.5, fill: tokens.tangerine, stroke: tokens.ink, strokeWidth: 1.5, pointerEvents: "none" })] })), (0, jsx_runtime_1.jsx)("rect", { ref: overlayRef, x: 0, y: 0, width: w, height: h, fill: "white", fillOpacity: 0.001, className: "trend-overlay", onMouseMove: onMove, onMouseLeave: () => setHover(null) })] }), hover && ((0, jsx_runtime_1.jsxs)("div", { style: {
                    position: 'absolute',
                    left: `calc(${(hover.x / w) * 100}% + 8px)`,
                    top: 6,
                    background: tokens.g100,
                    border: `1px solid ${tokens.g300}`,
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontFamily: tokens.fontMono,
                    pointerEvents: 'none',
                    boxShadow: '0 8px 20px rgba(0,0,0,.25)',
                }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                            fontSize: 9,
                            color: tokens.g500,
                            letterSpacing: '.06em',
                            textTransform: 'uppercase',
                            marginBottom: 3,
                        }, children: hoverLabel }), (0, jsx_runtime_1.jsxs)("div", { style: {
                            fontSize: 15,
                            fontWeight: 800,
                            color: tokens.tangerine,
                            letterSpacing: '-.01em',
                        }, children: [(0, formatRussian_1.nf2)(hover.val), " %"] })] }))] }));
}
exports.default = (0, react_1.memo)(TrendChartInner);
//# sourceMappingURL=TrendChart.js.map