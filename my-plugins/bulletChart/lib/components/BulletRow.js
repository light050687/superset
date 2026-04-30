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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const styles_1 = require("../styles");
const BulletBar_1 = __importDefault(require("./BulletBar"));
const Sparkline_1 = __importDefault(require("./Sparkline"));
const format_1 = require("../utils/format");
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
const ArrowTriangle = ({ sign }) => ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 8 8", width: 9, height: 9, fill: "currentColor", "aria-hidden": "true", children: sign === 'up' ? ((0, jsx_runtime_1.jsx)("path", { d: "M4 1 L7 6 L1 6 Z" })) : ((0, jsx_runtime_1.jsx)("path", { d: "M4 7 L7 2 L1 2 Z" })) }));
// Иконка домика перед количеством магазинов (ref:815-818).
const StoresIcon = () => ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 12 12", width: 9, height: 9, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("path", { d: "M2 5 L2 10 L10 10 L10 5" }), (0, jsx_runtime_1.jsx)("path", { d: "M1 5 L6 1 L11 5" })] }));
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
    return ((0, jsx_runtime_1.jsxs)(styles_1.BRow, { role: "listitem", tabIndex: 0, filtered: filtered, dimmed: dimmed, statusColor: statusColor, onClick: handleClick, onKeyDown: handleKeyDown, onMouseEnter: handleMouseEnter, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave, "aria-label": `${row.name}: факт ${formatters.value(row.rate)}${row.plan != null ? `, план ${formatters.value(row.plan)}` : ''}`, children: [(0, jsx_runtime_1.jsxs)(styles_1.BTop, { children: [(0, jsx_runtime_1.jsxs)(styles_1.BNameWrap, { children: [(0, jsx_runtime_1.jsx)(styles_1.BName, { children: row.name }), row.stores != null ? ((0, jsx_runtime_1.jsxs)(styles_1.BMeta, { children: [(0, jsx_runtime_1.jsx)(StoresIcon, {}), (0, format_1.formatStoresCount)(row.stores)] })) : null] }), (0, jsx_runtime_1.jsxs)(styles_1.BMain, { children: [(0, jsx_runtime_1.jsx)(styles_1.BVal, { children: formatters.value(row.rate) }), arrowSign != null ? ((0, jsx_runtime_1.jsxs)(styles_1.BArrow, { children: [(0, jsx_runtime_1.jsx)(ArrowTriangle, { sign: arrowSign }), (0, jsx_runtime_1.jsx)("span", { children: deltaPlanStr })] })) : null] })] }), (0, jsx_runtime_1.jsx)(BulletBar_1.default, { value: row.rate, target: row.plan, scaleMax: scaleMax, direction: direction }), (0, jsx_runtime_1.jsxs)(styles_1.BMetaRow, { children: [(0, jsx_runtime_1.jsxs)(styles_1.BMetaCell, { children: [(0, jsx_runtime_1.jsx)(styles_1.BMetaL, { children: "\u041F\u043B\u0430\u043D" }), (0, jsx_runtime_1.jsx)(styles_1.BMetaV, { tone: "default", children: row.plan != null ? formatters.value(row.plan) : '—' })] }), (0, jsx_runtime_1.jsxs)(styles_1.BMetaCell, { children: [(0, jsx_runtime_1.jsx)(styles_1.BMetaL, { children: "\u041F\u0440\u043E\u0448\u043B. \u0433\u043E\u0434" }), (0, jsx_runtime_1.jsx)(styles_1.BMetaV, { tone: "default", children: row.py != null ? formatters.value(row.py) : '—' })] }), (0, jsx_runtime_1.jsxs)(styles_1.BMetaCell, { children: [(0, jsx_runtime_1.jsx)(styles_1.BMetaL, { children: "\u0394 \u043A \u043F\u043B\u0430\u043D\u0443" }), (0, jsx_runtime_1.jsx)(styles_1.BMetaV, { tone: deltaTone(row.deltaPlan, direction), children: deltaPlanStr })] }), (0, jsx_runtime_1.jsxs)(styles_1.BMetaCell, { children: [(0, jsx_runtime_1.jsx)(styles_1.BMetaL, { children: "\u0394 \u043A \u041F\u0413" }), (0, jsx_runtime_1.jsx)(styles_1.BMetaV, { tone: deltaTone(row.deltaPy, direction), children: deltaPyStr })] }), (0, jsx_runtime_1.jsx)(styles_1.BSpark, { children: (0, jsx_runtime_1.jsx)(Sparkline_1.default, { points: row.spark, color: statusColor, width: 70, height: 18 }) })] })] }));
};
exports.default = React.memo(BulletRow);
//# sourceMappingURL=BulletRow.js.map