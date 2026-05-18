import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { CardFooter, CardHead, CardRoot, CardSub, CardTitle, Controls, RankList, SkeletonRow, StaleBar, StateWrap, TitleBlock, } from './styles';
import RankRow from './components/RankRow';
import SortDropdown from './components/SortDropdown';
import UnitToggle from './components/UnitToggle';
import Tooltip from './components/Tooltip';
import { fmtRub } from './utils/formatRussian';
import DetailModal from './components/DetailModal';
import AllItemsModal from './components/AllItemsModal';
import { buildTooltipContent } from './components/tooltipContent';
import { InfoHint, InfoHintTopRight } from './components/InfoHint';
// ── Sorting helpers ─────────────────────────────────────────────────────────
function sortRows(rows, by) {
    const copy = [...rows];
    switch (by) {
        case 'sum':
            copy.sort((a, b) => b.value - a.value);
            break;
        case 'share':
            copy.sort((a, b) => b.sharePct - a.sharePct);
            break;
        case 'delta':
            copy.sort((a, b) => b.deltaPP - a.deltaPP);
            break;
    }
    return copy;
}
/**
 * Derive a human-readable subtitle prefix for the current sort mode.
 * Matches the phrasing used throughout DS 2.0 prototypes.
 */
function subtitleForSort(sortBy, userPrefix) {
    switch (sortBy) {
        case 'delta':
            return 'Топ по дельте';
        case 'share':
            return 'Топ по доле';
        case 'sum':
        default:
            return userPrefix || 'Топ по сумме';
    }
}
// ── Cross-filter plumbing ───────────────────────────────────────────────────
function applyFilter(props, groupbyCol, nextIds) {
    const setDataMask = props.setDataMask;
    if (!setDataMask)
        return;
    if (nextIds.length === 0) {
        setDataMask({
            filterState: { value: null, selectedValues: null },
            extraFormData: { filters: [] },
        });
        return;
    }
    setDataMask({
        filterState: { value: nextIds, selectedValues: nextIds },
        extraFormData: {
            filters: [{ col: groupbyCol, op: 'IN', val: nextIds }],
        },
    });
}
// ── Main component ─────────────────────────────────────────────────────────
const RankedBars = props => {
    const { dataState, errorMessage, rows, totalSum, headerText, headerSubtitlePrefix, showTotalInHeader, showSparkline, showGhostPrevBar, showHoverTooltip, invertDeltaGood, defaultSort, defaultUnit, topNVisible, unitSuffixRub, decimalsValue, decimalsDelta, decimalsShare, enableDrillModal, enableAllItemsModal, enableCrossFilter, hasPrevMetric, drillQueryParams, filterState, isMockMode, themeMode, } = props;
    // ── Local state ─────────────────────────────────────────────────────────
    const [sortBy, setSortBy] = useState(defaultSort);
    const [unit, setUnit] = useState(defaultUnit);
    const [drillRow, setDrillRow] = useState(null);
    const [allOpen, setAllOpen] = useState(false);
    const [tooltip, setTooltip] = useState(null);
    // Keep state in sync with controlPanel defaults if they change.
    useEffect(() => {
        setSortBy(defaultSort);
    }, [defaultSort]);
    useEffect(() => {
        setUnit(defaultUnit);
    }, [defaultUnit]);
    // ── Derived data ────────────────────────────────────────────────────────
    const sortedAll = useMemo(() => sortRows(rows, sortBy), [rows, sortBy]);
    const visible = useMemo(() => sortedAll.slice(0, topNVisible), [sortedAll, topNVisible]);
    /**
     * Bar scale: in rub mode we include previous-period values so the ghost bar
     * never overflows the track when `valuePrev > value`. In pct mode we include
     * `sharePrevPct` for the same reason. Only values from the dataset are used
     * — the caller's `topNVisible` window is ignored (all rows share one scale).
     */
    const maxValue = useMemo(() => {
        if (visible.length === 0)
            return 0;
        if (unit === 'rub') {
            return rows.reduce((m, r) => Math.max(m, r.value, r.valuePrev ?? 0), 0);
        }
        return rows.reduce((m, r) => Math.max(m, r.sharePct, r.sharePrevPct ?? 0), 0);
    }, [rows, visible.length, unit]);
    const activeIds = useMemo(() => {
        const raw = filterState?.value;
        if (Array.isArray(raw))
            return new Set(raw.map(String));
        return new Set();
    }, [filterState]);
    const hasFilter = activeIds.size > 0;
    // ── Handlers ────────────────────────────────────────────────────────────
    const handleRowClick = useCallback((row, modKey) => {
        if (modKey) {
            if (enableDrillModal) {
                setDrillRow(row);
                setTooltip(null);
            }
            return;
        }
        if (!enableCrossFilter)
            return;
        if (isMockMode || !drillQueryParams)
            return;
        const next = new Set(activeIds);
        if (next.has(row.id)) {
            next.delete(row.id);
        }
        else {
            next.add(row.id);
        }
        applyFilter(props, drillQueryParams.groupbyCol, Array.from(next));
    }, [
        activeIds,
        drillQueryParams,
        enableCrossFilter,
        enableDrillModal,
        isMockMode,
        props,
    ]);
    const hoverRowRef = useRef(null);
    const handleHoverStart = useCallback((row, evt) => {
        if (!showHoverTooltip)
            return;
        hoverRowRef.current = row.id;
        setTooltip({
            element: buildTooltipContent(row, {
                invertDeltaGood,
                decimalsValue,
                decimalsDelta,
                decimalsShare,
                unitSuffixRub,
            }),
            clientX: evt.clientX,
            clientY: evt.clientY,
            themeMode,
        });
    }, [
        decimalsDelta,
        decimalsShare,
        decimalsValue,
        invertDeltaGood,
        showHoverTooltip,
        themeMode,
        unitSuffixRub,
    ]);
    const handleHoverMove = useCallback((evt) => {
        setTooltip(prev => prev
            ? {
                ...prev,
                clientX: evt.clientX,
                clientY: evt.clientY,
            }
            : prev);
    }, []);
    const handleHoverEnd = useCallback(() => {
        hoverRowRef.current = null;
        setTooltip(null);
    }, []);
    const handleCloseDetail = useCallback(() => setDrillRow(null), []);
    const handleCloseAll = useCallback(() => setAllOpen(false), []);
    // Close modals on Escape (priority: detail > all)
    useEffect(() => {
        if (!drillRow && !allOpen)
            return undefined;
        function handleKey(evt) {
            if (evt.key !== 'Escape')
                return;
            if (drillRow) {
                setDrillRow(null);
            }
            else if (allOpen) {
                setAllOpen(false);
            }
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [drillRow, allOpen]);
    // ── Header subtitle ─────────────────────────────────────────────────────
    const subtitleBits = [];
    const dynamicPrefix = subtitleForSort(sortBy, headerSubtitlePrefix);
    if (dynamicPrefix) {
        subtitleBits.push(_jsx("span", { children: dynamicPrefix }, "prefix"));
    }
    if (showTotalInHeader && totalSum > 0) {
        if (subtitleBits.length > 0) {
            subtitleBits.push(_jsx("span", { className: "dot" }, "dot1"));
        }
        const totalParts = fmtRub(totalSum, decimalsValue, unitSuffixRub);
        subtitleBits.push(_jsxs("span", { className: "total", children: [totalParts.number, totalParts.unit] }, "total"));
    }
    if (dataState === 'partial' && rows.length > 0) {
        if (subtitleBits.length > 0) {
            subtitleBits.push(_jsx("span", { className: "dot" }, "dot2"));
        }
        subtitleBits.push(_jsx("span", { className: "badge-partial", role: "status", children: "\u043D\u0435\u043F\u043E\u043B\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435" }, "partial"));
    }
    // ── Render states ───────────────────────────────────────────────────────
    const renderBody = () => {
        if (dataState === 'loading') {
            return (_jsx(RankList, { "$hasFilter": false, role: "list", "aria-busy": "true", children: Array.from({ length: topNVisible }).map((_, i) => (_jsxs(SkeletonRow, { children: [_jsx("span", { className: "icon" }), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }, i))) }));
        }
        if (dataState === 'error') {
            return (_jsxs(StateWrap, { role: "alert", children: [_jsxs("svg", { width: "32", height: "32", viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "16", cy: "16", r: "12" }), _jsx("path", { d: "M16 10 L16 17" }), _jsx("path", { d: "M16 21 L16 22" })] }), _jsx("div", { children: errorMessage || 'Ошибка загрузки данных' })] }));
        }
        if (dataState === 'empty' || visible.length === 0) {
            return (_jsxs(StateWrap, { children: [_jsxs("svg", { width: "32", height: "32", viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("rect", { x: "4", y: "4", width: "24", height: "24", rx: "3" }), _jsx("path", { d: "M10 16 L22 16" })] }), _jsx("div", { children: errorMessage || 'Нет данных за выбранный период' })] }));
        }
        return (_jsx(RankList, { "$hasFilter": hasFilter, role: "list", children: visible.map((row, idx) => (_jsx(RankRow, { row: row, index: idx, maxValue: maxValue, unit: unit, invertDeltaGood: invertDeltaGood, decimalsValue: decimalsValue, decimalsDelta: decimalsDelta, decimalsShare: decimalsShare, unitSuffixRub: unitSuffixRub, showSparkline: showSparkline, showGhostPrevBar: showGhostPrevBar, filtered: activeIds.has(row.id), onClick: handleRowClick, onHoverStart: handleHoverStart, onHoverMove: handleHoverMove, onHoverEnd: handleHoverEnd }, row.id))) }));
    };
    const totalRowsCount = rows.length;
    // DS 2.0 canonical: loading имеет свой раздельный return со своим CardRoot.
    // При переходе loading → loaded React unmount'ит loading-CardRoot и mount'ит
    // новый → cardInKf animation запускается ровно когда юзер видит контент.
    if (dataState === 'loading') {
        return (_jsxs(CardRoot, { "data-theme": themeMode, role: "region", "aria-labelledby": "rb-card-title", "aria-busy": "true", "data-no-anim": "", children: [_jsx(CardHead, { children: _jsx(TitleBlock, { children: _jsx(CardTitle, { id: "rb-card-title", children: headerText }) }) }), _jsx(RankList, { "$hasFilter": false, role: "list", "aria-busy": "true", children: Array.from({ length: topNVisible }).map((_, i) => (_jsxs(SkeletonRow, { children: [_jsx("span", { className: "icon" }), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }, i))) })] }));
    }
    return (_jsxs(CardRoot, { "data-theme": themeMode, role: "region", "aria-labelledby": "rb-card-title", "data-info-hint-container": "", children: [dataState === 'stale' && _jsx(StaleBar, { "aria-hidden": "true" }), _jsxs(CardHead, { children: [_jsxs(TitleBlock, { children: [_jsx(CardTitle, { id: "rb-card-title", children: headerText }), subtitleBits.length > 0 && _jsx(CardSub, { children: subtitleBits })] }), _jsxs(Controls, { children: [_jsx(SortDropdown, { value: sortBy, onChange: setSortBy, deltaDisabled: !hasPrevMetric }), _jsx(UnitToggle, { value: unit, onChange: setUnit }), _jsx(InfoHintTopRight, { children: _jsxs(InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [_jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "\u041A\u043B\u0438\u043A" }), " \u2014 \u0444\u0438\u043B\u044C\u0442\u0440"] }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Ctrl" }), "+", _jsx("kbd", { children: "\u043A\u043B\u0438\u043A" }), " \u2014 \u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F"] }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Right Click" }), " \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"] })] }) })] })] }), renderBody(), _jsx(CardFooter, { children: enableAllItemsModal && totalRowsCount > topNVisible && (_jsxs("button", { type: "button", className: "more", onClick: () => setAllOpen(true), children: ["\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0432\u0441\u0435 ", totalRowsCount, " \u043F\u043E\u0437\u0438\u0446\u0438\u0439 \u2192"] })) }), showHoverTooltip && _jsx(Tooltip, { payload: tooltip }), enableDrillModal && drillRow && drillQueryParams && (_jsx(DetailModal, { row: drillRow, queryParams: drillQueryParams, unitSuffixRub: unitSuffixRub, decimalsValue: decimalsValue, decimalsDelta: decimalsDelta, invertDeltaGood: invertDeltaGood, isMockMode: isMockMode, themeMode: themeMode, onClose: handleCloseDetail })), enableAllItemsModal && allOpen && (_jsx(AllItemsModal, { rows: rows, totalRows: totalRowsCount, totalSum: totalSum, unit: unit, maxValue: maxValue, invertDeltaGood: invertDeltaGood, decimalsValue: decimalsValue, decimalsDelta: decimalsDelta, decimalsShare: decimalsShare, unitSuffixRub: unitSuffixRub, showSparkline: showSparkline, showGhostPrevBar: showGhostPrevBar, hasPrevMetric: hasPrevMetric, activeIds: activeIds, themeMode: themeMode, initialSort: sortBy, onRowClick: handleRowClick, onClose: handleCloseAll }))] }));
};
export default RankedBars;
//# sourceMappingURL=RankedBars.js.map