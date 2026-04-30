"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const icons_1 = require("../utils/icons");
const formatRussian_1 = require("../utils/formatRussian");
const styles_1 = require("../styles");
const Sparkline_1 = __importDefault(require("./Sparkline"));
function isModifiedClick(evt) {
    return evt.ctrlKey || evt.metaKey;
}
/**
 * One rank row — icon + rank badge, name/sub, bar (+ ghost), sparkline,
 * main value, delta (± p.p.), share %.
 *
 * Events:
 *  - click (normal)    → cross-filter
 *  - click + Ctrl/Cmd  → drill-down modal
 *  - Enter / Space     → cross-filter
 *  - Ctrl + Enter      → drill-down
 *  - mouseenter/leave  → tooltip
 */
const RankRow = ({ row, index, maxValue, unit, invertDeltaGood, decimalsValue, decimalsDelta, decimalsShare, unitSuffixRub, showSparkline, showGhostPrevBar, filtered, onClick, onHoverStart, onHoverMove, onHoverEnd, }) => {
    const handleClick = (0, react_1.useCallback)((evt) => {
        onClick(row, isModifiedClick(evt));
    }, [row, onClick]);
    const handleKeyDown = (0, react_1.useCallback)((evt) => {
        if (evt.key === 'Enter' || evt.key === ' ') {
            evt.preventDefault();
            onClick(row, isModifiedClick(evt));
        }
    }, [row, onClick]);
    const handleEnter = (0, react_1.useCallback)((evt) => {
        onHoverStart?.(row, evt);
    }, [row, onHoverStart]);
    // ── Derived values ─────────────────────────────────────────────────────
    const colorVar = row.colorToken.startsWith('#')
        ? row.colorToken
        : `var(${row.colorToken})`;
    const iconBgVar = row.colorToken.startsWith('#')
        ? row.colorToken
        : `color-mix(in srgb, var(${row.colorToken}) 18%, transparent)`;
    // Bar fill: share of the visible maximum in the selected unit.
    const currentValue = unit === 'rub' ? row.value : row.sharePct;
    const barPct = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;
    // Ghost bar (previous-period reference): uses the same scale as the fill bar
    // so the two can be compared visually.
    //   - rub mode: draw valuePrev against the same `maxValue` (which is current-period max).
    //     This shows absolute movement rather than cross-period normalization.
    //   - pct mode: draw sharePrevPct against the same `maxValue` (which is current-period
    //     sharePct max). This shows how the share shifted between periods.
    const prevForBar = row.valuePrev == null
        ? null
        : unit === 'rub'
            ? row.valuePrev
            : row.sharePrevPct;
    const prevPct = prevForBar != null && maxValue > 0 ? (prevForBar / maxValue) * 100 : 0;
    const deltaStatus = (0, formatRussian_1.getDeltaStatus)(row.deltaPP, invertDeltaGood);
    const valueParts = unit === 'rub'
        ? (0, formatRussian_1.fmtRub)(row.value, decimalsValue, unitSuffixRub)
        : (0, formatRussian_1.fmtPct)(row.sharePct, decimalsValue);
    const deltaArrow = row.deltaPP > 0 ? ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 8 8", fill: "currentColor", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M4 1 L7 6 L1 6 Z" }) })) : row.deltaPP < 0 ? ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 8 8", fill: "currentColor", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M4 7 L7 2 L1 2 Z" }) })) : null;
    const ariaLabel = `${index + 1}. ${row.name}. ${valueParts.number}${valueParts.unit}. Доля ${(0, formatRussian_1.fmtCount)(row.sharePct)} процентов. Дельта ${(0, formatRussian_1.fmtDelta)(row.deltaPP, decimalsDelta)}.`;
    return ((0, jsx_runtime_1.jsxs)(styles_1.RankRowEl, { role: "listitem", tabIndex: 0, "aria-label": ariaLabel, "data-id": row.id, "data-filtered": filtered ? 'true' : 'false', "$catColor": colorVar, "$catBg": iconBgVar, "$filtered": filtered, onClick: handleClick, onKeyDown: handleKeyDown, onMouseEnter: handleEnter, onMouseMove: onHoverMove, onMouseLeave: onHoverEnd, children: [(0, jsx_runtime_1.jsxs)(styles_1.RankIcon, { children: [(0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: (0, icons_1.getIconBody)(row.iconName) }), (0, jsx_runtime_1.jsx)(styles_1.RankBadge, { "aria-hidden": "true", children: index + 1 })] }), (0, jsx_runtime_1.jsxs)(styles_1.RankName, { children: [(0, jsx_runtime_1.jsx)(styles_1.RankNameL, { children: row.name }), row.sub && (0, jsx_runtime_1.jsx)(styles_1.RankNameS, { children: row.sub })] }), (0, jsx_runtime_1.jsx)(styles_1.Bar, { className: "col-bar", children: (0, jsx_runtime_1.jsxs)(styles_1.BarTrack, { children: [showGhostPrevBar && prevForBar != null && ((0, jsx_runtime_1.jsx)(styles_1.BarPrev, { "$widthPct": prevPct, "aria-hidden": "true" })), (0, jsx_runtime_1.jsx)(styles_1.BarFill, { "$widthPct": barPct, "aria-hidden": "true" })] }) }), (0, jsx_runtime_1.jsx)(styles_1.SparkBox, { className: "col-spark", children: showSparkline && row.spark.length >= 2 && ((0, jsx_runtime_1.jsx)(Sparkline_1.default, { data: row.spark, color: colorVar })) }), (0, jsx_runtime_1.jsxs)(styles_1.Value, { children: [valueParts.number, (0, jsx_runtime_1.jsx)("span", { className: "u", children: valueParts.unit })] }), (0, jsx_runtime_1.jsxs)(styles_1.Delta, { "$status": deltaStatus, className: "col-delta", children: [deltaArrow, (0, jsx_runtime_1.jsx)("span", { children: (0, formatRussian_1.fmtDelta)(row.deltaPP, decimalsDelta) })] }), (0, jsx_runtime_1.jsxs)(styles_1.Share, { children: [(0, formatRussian_1.fmtCount)(Number(row.sharePct.toFixed(decimalsShare))), (0, jsx_runtime_1.jsx)("span", { className: "u", children: " %" })] })] }));
};
exports.default = (0, react_1.memo)(RankRow);
//# sourceMappingURL=RankRow.js.map