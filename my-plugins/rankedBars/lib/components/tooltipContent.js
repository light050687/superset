"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTooltipContent = buildTooltipContent;
const jsx_runtime_1 = require("react/jsx-runtime");
const styled_1 = __importDefault(require("@emotion/styled"));
const icons_1 = require("../utils/icons");
const formatRussian_1 = require("../utils/formatRussian");
const TTIcon = styled_1.default.div `
  width: 24px;
  height: 24px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $bg }) => $bg};
`;
/**
 * Build tooltip body for a row — 4 rows of stats + trend indicator + footer hint.
 * Runs for hover preview only; DetailModal has its own layout.
 */
function buildTooltipContent(row, cfg) {
    const colorVar = row.colorToken.startsWith('#')
        ? row.colorToken
        : `var(${row.colorToken})`;
    const iconBg = row.colorToken.startsWith('#')
        ? row.colorToken
        : `color-mix(in srgb, var(${row.colorToken}) 18%, transparent)`;
    const valueParts = (0, formatRussian_1.fmtRub)(row.value, cfg.decimalsValue, cfg.unitSuffixRub);
    const deltaStatus = (0, formatRussian_1.getDeltaStatus)(row.deltaPP, cfg.invertDeltaGood);
    const deltaText = (0, formatRussian_1.fmtDelta)(row.deltaPP, cfg.decimalsDelta);
    const shareText = (0, formatRussian_1.fmtCount)(Number(row.sharePct.toFixed(cfg.decimalsShare)));
    const trendDirection = row.spark.length >= 2
        ? row.spark[row.spark.length - 1] > row.spark[0]
            ? 'up'
            : row.spark[row.spark.length - 1] < row.spark[0]
                ? 'down'
                : 'flat'
        : 'flat';
    const trendIcon = trendDirection === 'up' ? '↗' : trendDirection === 'down' ? '↘' : '→';
    const trendText = trendDirection === 'up'
        ? 'растёт'
        : trendDirection === 'down'
            ? 'снижается'
            : 'стабильно';
    const trendCls = trendDirection === 'up'
        ? cfg.invertDeltaGood
            ? 'dn'
            : 'up'
        : trendDirection === 'down'
            ? cfg.invertDeltaGood
                ? 'up'
                : 'dn'
            : 'wn';
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "tt-head", children: [(0, jsx_runtime_1.jsx)(TTIcon, { className: "tt-icon", "$bg": iconBg, children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: colorVar, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: (0, icons_1.getIconBody)(row.iconName) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-titles", children: [(0, jsx_runtime_1.jsx)("div", { className: "tt-name", children: row.name }), row.sub && (0, jsx_runtime_1.jsx)("div", { className: "tt-sub", children: row.sub })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-rows", children: [(0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: "\u0421\u0443\u043C\u043C\u0430" }), (0, jsx_runtime_1.jsxs)("span", { className: "tt-v", children: [valueParts.number, valueParts.unit] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: "\u0394 \u043A \u041F\u041F" }), (0, jsx_runtime_1.jsx)("span", { className: `tt-v ${deltaStatus}`, children: deltaText })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: "\u0414\u043E\u043B\u044F" }), (0, jsx_runtime_1.jsxs)("span", { className: "tt-v", children: [shareText, " %"] })] }), row.spark.length >= 2 && ((0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: "\u0422\u0440\u0435\u043D\u0434" }), (0, jsx_runtime_1.jsxs)("span", { className: `tt-v ${trendCls}`, children: [trendIcon, " ", trendText] })] }))] })] }));
}
//# sourceMappingURL=tooltipContent.js.map