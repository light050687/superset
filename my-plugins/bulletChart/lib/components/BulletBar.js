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
const styles_1 = require("../styles");
/**
 * Bullet-бар в стиле Stephen Few с 3 качественными зонами, основным баром и маркером цели.
 *
 * Зоны строятся относительно target (plan) по формуле из прототипа (ref:793-796):
 *   band1 (g100, «приемлемо») — вся ширина scaleMax
 *   band2 (g200, «хорошо»)    — до plan
 *   band3 (g300, «отлично»)   — до 0.8 × plan
 *
 * Для `more_is_better` зоны отражены: «отлично» справа от 1.2×plan, «хорошо» — от plan.
 */
const BulletBar = ({ value, target, scaleMax, direction, }) => {
    const safeScale = scaleMax > 0 ? scaleMax : 1;
    const pct = (v) => Math.min(100, Math.max(0, (v / safeScale) * 100));
    const barWidth = pct(value);
    const targetLeft = target != null ? pct(target) : null;
    // Построение 3 зон.
    // less_is_better: малые значения → хорошо → рисуем «good» узкой слева.
    // more_is_better: большие значения → хорошо → рисуем «good» широкой, «bad» узкой слева.
    const bandsLess = target != null
        ? [
            { w: 100, kind: 'bad' }, // band1 — весь фон
            { w: pct(target), kind: 'warn' }, // band2 — до плана
            { w: pct(target * 0.8), kind: 'good' }, // band3 — до 80% плана
        ]
        : [
            { w: 100, kind: 'bad' },
            { w: 66.6, kind: 'warn' },
            { w: 33.3, kind: 'good' },
        ];
    const bandsMore = target != null
        ? [
            { w: 100, kind: 'bad' }, // band1 — весь фон = плохо
            { w: pct(target * 1.2), kind: 'warn' }, // band2 — до 120% плана
            { w: pct(target), kind: 'good' }, // band3 — до плана (inverted)
        ]
        : bandsLess;
    const bands = direction === 'less_is_better' ? bandsLess : bandsMore;
    return ((0, jsx_runtime_1.jsxs)(styles_1.BChart, { role: "img", "aria-label": target != null ? `Значение ${value}, цель ${target}` : `Значение ${value}`, children: [bands.map((b, i) => ((0, jsx_runtime_1.jsx)(styles_1.BBand, { bg: b.kind, style: { width: `${b.w}%` }, "aria-hidden": "true" }, i))), (0, jsx_runtime_1.jsx)(styles_1.BBar, { widthPct: barWidth }), targetLeft != null ? (0, jsx_runtime_1.jsx)(styles_1.BTarget, { leftPct: targetLeft }) : null] }));
};
exports.default = React.memo(BulletBar);
//# sourceMappingURL=BulletBar.js.map