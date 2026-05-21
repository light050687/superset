import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import styled from '@emotion/styled';
import { getIconBody } from '../utils/icons';
import { fmtCount, fmtDelta, fmtRub, getDeltaStatus, } from '../utils/formatRussian';
const TTIcon = styled.div `
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
export function buildTooltipContent(row, cfg) {
    const colorVar = row.colorToken.startsWith('#')
        ? row.colorToken
        : `var(${row.colorToken})`;
    const iconBg = row.colorToken.startsWith('#')
        ? row.colorToken
        : `color-mix(in srgb, var(${row.colorToken}) 18%, transparent)`;
    const valueParts = fmtRub(row.value, cfg.decimalsValue, cfg.unitSuffixRub);
    const deltaStatus = getDeltaStatus(row.deltaPP, cfg.invertDeltaGood);
    const deltaText = fmtDelta(row.deltaPP, cfg.decimalsDelta);
    const shareText = fmtCount(Number(row.sharePct.toFixed(cfg.decimalsShare)));
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
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "tt-head", children: [_jsx(TTIcon, { className: "tt-icon", "$bg": iconBg, children: _jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: colorVar, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: getIconBody(row.iconName) }) }), _jsxs("div", { className: "tt-titles", children: [_jsx("div", { className: "tt-name", children: row.name }), row.sub && _jsx("div", { className: "tt-sub", children: row.sub })] })] }), _jsxs("div", { className: "tt-rows", children: [_jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: "\u0421\u0443\u043C\u043C\u0430" }), _jsxs("span", { className: "tt-v", children: [valueParts.number, valueParts.unit] })] }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: "\u0394 \u043A \u041F\u041F" }), _jsx("span", { className: `tt-v ${deltaStatus}`, children: deltaText })] }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: "\u0414\u043E\u043B\u044F" }), _jsxs("span", { className: "tt-v", children: [shareText, " %"] })] }), row.spark.length >= 2 && (_jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: "\u0422\u0440\u0435\u043D\u0434" }), _jsxs("span", { className: `tt-v ${trendCls}`, children: [trendIcon, " ", trendText] })] }))] })] }));
}
//# sourceMappingURL=tooltipContent.js.map