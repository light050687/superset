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
const React = __importStar(require("react"));
/**
 * Лёгкий SVG sparkline (polyline) без внешних библиотек.
 * Порт buildSparkline() из bullet-formats-prototype.html:650.
 */
const Sparkline = ({ points, width = 70, height = 18, color, strokeWidth = 1.5, }) => {
    if (!points.length) {
        return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: `0 0 ${width} ${height}`, "aria-hidden": "true" }));
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const padding = 2;
    const w = width - padding * 2;
    const h = height - padding * 2;
    if (points.length === 1) {
        const cx = width / 2;
        const cy = height / 2;
        return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: `0 0 ${width} ${height}`, "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("circle", { cx: cx, cy: cy, r: 1.5, fill: color }) }));
    }
    const coords = points
        .map((v, i) => {
        const x = padding + (i / (points.length - 1)) * w;
        const y = padding + h - ((v - min) / range) * h;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
        .join(' ');
    // Последняя точка — акцент
    const lastIdx = points.length - 1;
    const lastX = padding + w;
    const lastY = padding + h - ((points[lastIdx] - min) / range) * h;
    return ((0, jsx_runtime_1.jsxs)("svg", { width: width, height: height, viewBox: `0 0 ${width} ${height}`, "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("polyline", { points: coords, fill: "none", stroke: color, strokeWidth: strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", opacity: 0.95 }), (0, jsx_runtime_1.jsx)("circle", { cx: lastX, cy: lastY, r: 2, fill: color, stroke: "var(--s)", strokeWidth: 1 })] }));
};
exports.default = React.memo(Sparkline);
//# sourceMappingURL=Sparkline.js.map