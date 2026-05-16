import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useCallback } from 'react';
import { getIconBody } from '../utils/icons';
import { fmtCount, fmtDelta, fmtPct, fmtRub, getDeltaStatus, } from '../utils/formatRussian';
import { Bar, BarFill, BarPrev, BarTrack, Delta, RankBadge, RankIcon, RankName, RankNameL, RankNameS, RankRowEl, Share, SparkBox, Value, } from '../styles';
import Sparkline from './Sparkline';
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
    const handleClick = useCallback((evt) => {
        onClick(row, isModifiedClick(evt));
    }, [row, onClick]);
    const handleKeyDown = useCallback((evt) => {
        if (evt.key === 'Enter' || evt.key === ' ') {
            evt.preventDefault();
            onClick(row, isModifiedClick(evt));
        }
    }, [row, onClick]);
    const handleEnter = useCallback((evt) => {
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
    const deltaStatus = getDeltaStatus(row.deltaPP, invertDeltaGood);
    const valueParts = unit === 'rub'
        ? fmtRub(row.value, decimalsValue, unitSuffixRub)
        : fmtPct(row.sharePct, decimalsValue);
    const deltaArrow = row.deltaPP > 0 ? (_jsx("svg", { viewBox: "0 0 8 8", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M4 1 L7 6 L1 6 Z" }) })) : row.deltaPP < 0 ? (_jsx("svg", { viewBox: "0 0 8 8", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M4 7 L7 2 L1 2 Z" }) })) : null;
    const ariaLabel = `${index + 1}. ${row.name}. ${valueParts.number}${valueParts.unit}. Доля ${fmtCount(row.sharePct)} процентов. Дельта ${fmtDelta(row.deltaPP, decimalsDelta)}.`;
    return (_jsxs(RankRowEl, { role: "listitem", tabIndex: 0, "aria-label": ariaLabel, "data-id": row.id, "data-filtered": filtered ? 'true' : 'false', "$catColor": colorVar, "$catBg": iconBgVar, "$filtered": filtered, onClick: handleClick, onKeyDown: handleKeyDown, onMouseEnter: handleEnter, onMouseMove: onHoverMove, onMouseLeave: onHoverEnd, children: [_jsxs(RankIcon, { children: [_jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: getIconBody(row.iconName) }), _jsx(RankBadge, { "aria-hidden": "true", children: index + 1 })] }), _jsxs(RankName, { children: [_jsx(RankNameL, { children: row.name }), row.sub && _jsx(RankNameS, { children: row.sub })] }), _jsx(Bar, { className: "col-bar", children: _jsxs(BarTrack, { children: [showGhostPrevBar && prevForBar != null && (_jsx(BarPrev, { "$widthPct": prevPct, "aria-hidden": "true" })), _jsx(BarFill, { "$widthPct": barPct, "aria-hidden": "true" })] }) }), _jsx(SparkBox, { className: "col-spark", children: showSparkline && row.spark.length >= 2 && (_jsx(Sparkline, { data: row.spark, color: colorVar })) }), _jsxs(Value, { children: [valueParts.number, _jsx("span", { className: "u", children: valueParts.unit })] }), _jsxs(Delta, { "$status": deltaStatus, className: "col-delta", children: [deltaArrow, _jsx("span", { children: fmtDelta(row.deltaPP, decimalsDelta) })] }), _jsxs(Share, { children: [fmtCount(Number(row.sharePct.toFixed(decimalsShare))), _jsx("span", { className: "u", children: " %" })] })] }));
};
export default memo(RankRow);
//# sourceMappingURL=RankRow.js.map