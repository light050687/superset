"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const styles_1 = require("./styles");
const RankRow_1 = __importDefault(require("./components/RankRow"));
const SortDropdown_1 = __importDefault(require("./components/SortDropdown"));
const UnitToggle_1 = __importDefault(require("./components/UnitToggle"));
const Tooltip_1 = __importDefault(require("./components/Tooltip"));
const formatRussian_1 = require("./utils/formatRussian");
const DetailModal_1 = __importDefault(require("./components/DetailModal"));
const AllItemsModal_1 = __importDefault(require("./components/AllItemsModal"));
const tooltipContent_1 = require("./components/tooltipContent");
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
    const [sortBy, setSortBy] = (0, react_1.useState)(defaultSort);
    const [unit, setUnit] = (0, react_1.useState)(defaultUnit);
    const [drillRow, setDrillRow] = (0, react_1.useState)(null);
    const [allOpen, setAllOpen] = (0, react_1.useState)(false);
    const [tooltip, setTooltip] = (0, react_1.useState)(null);
    // Keep state in sync with controlPanel defaults if they change.
    (0, react_1.useEffect)(() => {
        setSortBy(defaultSort);
    }, [defaultSort]);
    (0, react_1.useEffect)(() => {
        setUnit(defaultUnit);
    }, [defaultUnit]);
    // ── Derived data ────────────────────────────────────────────────────────
    const sortedAll = (0, react_1.useMemo)(() => sortRows(rows, sortBy), [rows, sortBy]);
    const visible = (0, react_1.useMemo)(() => sortedAll.slice(0, topNVisible), [sortedAll, topNVisible]);
    /**
     * Bar scale: in rub mode we include previous-period values so the ghost bar
     * never overflows the track when `valuePrev > value`. In pct mode we include
     * `sharePrevPct` for the same reason. Only values from the dataset are used
     * — the caller's `topNVisible` window is ignored (all rows share one scale).
     */
    const maxValue = (0, react_1.useMemo)(() => {
        if (visible.length === 0)
            return 0;
        if (unit === 'rub') {
            return rows.reduce((m, r) => Math.max(m, r.value, r.valuePrev ?? 0), 0);
        }
        return rows.reduce((m, r) => Math.max(m, r.sharePct, r.sharePrevPct ?? 0), 0);
    }, [rows, visible.length, unit]);
    const activeIds = (0, react_1.useMemo)(() => {
        const raw = filterState?.value;
        if (Array.isArray(raw))
            return new Set(raw.map(String));
        return new Set();
    }, [filterState]);
    const hasFilter = activeIds.size > 0;
    // ── Handlers ────────────────────────────────────────────────────────────
    const handleRowClick = (0, react_1.useCallback)((row, modKey) => {
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
    const hoverRowRef = (0, react_1.useRef)(null);
    const handleHoverStart = (0, react_1.useCallback)((row, evt) => {
        if (!showHoverTooltip)
            return;
        hoverRowRef.current = row.id;
        setTooltip({
            element: (0, tooltipContent_1.buildTooltipContent)(row, {
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
    const handleHoverMove = (0, react_1.useCallback)((evt) => {
        setTooltip(prev => prev
            ? {
                ...prev,
                clientX: evt.clientX,
                clientY: evt.clientY,
            }
            : prev);
    }, []);
    const handleHoverEnd = (0, react_1.useCallback)(() => {
        hoverRowRef.current = null;
        setTooltip(null);
    }, []);
    const handleCloseDetail = (0, react_1.useCallback)(() => setDrillRow(null), []);
    const handleCloseAll = (0, react_1.useCallback)(() => setAllOpen(false), []);
    // Close modals on Escape (priority: detail > all)
    (0, react_1.useEffect)(() => {
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
        subtitleBits.push((0, jsx_runtime_1.jsx)("span", { children: dynamicPrefix }, "prefix"));
    }
    if (showTotalInHeader && totalSum > 0) {
        if (subtitleBits.length > 0) {
            subtitleBits.push((0, jsx_runtime_1.jsx)("span", { className: "dot" }, "dot1"));
        }
        const totalParts = (0, formatRussian_1.fmtRub)(totalSum, decimalsValue, unitSuffixRub);
        subtitleBits.push((0, jsx_runtime_1.jsxs)("span", { className: "total", children: [totalParts.number, totalParts.unit] }, "total"));
    }
    if (dataState === 'partial' && rows.length > 0) {
        if (subtitleBits.length > 0) {
            subtitleBits.push((0, jsx_runtime_1.jsx)("span", { className: "dot" }, "dot2"));
        }
        subtitleBits.push((0, jsx_runtime_1.jsx)("span", { className: "badge-partial", role: "status", children: "\u043D\u0435\u043F\u043E\u043B\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435" }, "partial"));
    }
    // ── Render states ───────────────────────────────────────────────────────
    const renderBody = () => {
        if (dataState === 'loading') {
            return ((0, jsx_runtime_1.jsx)(styles_1.RankList, { "$hasFilter": false, role: "list", "aria-busy": "true", children: Array.from({ length: topNVisible }).map((_, i) => ((0, jsx_runtime_1.jsxs)(styles_1.SkeletonRow, { children: [(0, jsx_runtime_1.jsx)("span", { className: "icon" }), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {})] }, i))) }));
        }
        if (dataState === 'error') {
            return ((0, jsx_runtime_1.jsxs)(styles_1.StateWrap, { role: "alert", children: [(0, jsx_runtime_1.jsxs)("svg", { width: "32", height: "32", viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "16", cy: "16", r: "12" }), (0, jsx_runtime_1.jsx)("path", { d: "M16 10 L16 17" }), (0, jsx_runtime_1.jsx)("path", { d: "M16 21 L16 22" })] }), (0, jsx_runtime_1.jsx)("div", { children: errorMessage || 'Ошибка загрузки данных' })] }));
        }
        if (dataState === 'empty' || visible.length === 0) {
            return ((0, jsx_runtime_1.jsxs)(styles_1.StateWrap, { children: [(0, jsx_runtime_1.jsxs)("svg", { width: "32", height: "32", viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("rect", { x: "4", y: "4", width: "24", height: "24", rx: "3" }), (0, jsx_runtime_1.jsx)("path", { d: "M10 16 L22 16" })] }), (0, jsx_runtime_1.jsx)("div", { children: errorMessage || 'Нет данных за выбранный период' })] }));
        }
        return ((0, jsx_runtime_1.jsx)(styles_1.RankList, { "$hasFilter": hasFilter, role: "list", children: visible.map((row, idx) => ((0, jsx_runtime_1.jsx)(RankRow_1.default, { row: row, index: idx, maxValue: maxValue, unit: unit, invertDeltaGood: invertDeltaGood, decimalsValue: decimalsValue, decimalsDelta: decimalsDelta, decimalsShare: decimalsShare, unitSuffixRub: unitSuffixRub, showSparkline: showSparkline, showGhostPrevBar: showGhostPrevBar, filtered: activeIds.has(row.id), onClick: handleRowClick, onHoverStart: handleHoverStart, onHoverMove: handleHoverMove, onHoverEnd: handleHoverEnd }, row.id))) }));
    };
    const totalRowsCount = rows.length;
    // DS 2.0 canonical: loading имеет свой раздельный return со своим CardRoot.
    // При переходе loading → loaded React unmount'ит loading-CardRoot и mount'ит
    // новый → cardInKf animation запускается ровно когда юзер видит контент.
    if (dataState === 'loading') {
        return ((0, jsx_runtime_1.jsxs)(styles_1.CardRoot, { "data-theme": themeMode, role: "region", "aria-labelledby": "rb-card-title", "aria-busy": "true", children: [(0, jsx_runtime_1.jsx)(styles_1.CardHead, { children: (0, jsx_runtime_1.jsx)(styles_1.TitleBlock, { children: (0, jsx_runtime_1.jsx)(styles_1.CardTitle, { id: "rb-card-title", children: headerText }) }) }), (0, jsx_runtime_1.jsx)(styles_1.RankList, { "$hasFilter": false, role: "list", "aria-busy": "true", children: Array.from({ length: topNVisible }).map((_, i) => ((0, jsx_runtime_1.jsxs)(styles_1.SkeletonRow, { children: [(0, jsx_runtime_1.jsx)("span", { className: "icon" }), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {}), (0, jsx_runtime_1.jsx)("span", {})] }, i))) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(styles_1.CardRoot, { "data-theme": themeMode, role: "region", "aria-labelledby": "rb-card-title", children: [dataState === 'stale' && (0, jsx_runtime_1.jsx)(styles_1.StaleBar, { "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)(styles_1.CardHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.TitleBlock, { children: [(0, jsx_runtime_1.jsx)(styles_1.CardTitle, { id: "rb-card-title", children: headerText }), subtitleBits.length > 0 && (0, jsx_runtime_1.jsx)(styles_1.CardSub, { children: subtitleBits })] }), (0, jsx_runtime_1.jsxs)(styles_1.Controls, { children: [(0, jsx_runtime_1.jsx)(SortDropdown_1.default, { value: sortBy, onChange: setSortBy, deltaDisabled: !hasPrevMetric }), (0, jsx_runtime_1.jsx)(UnitToggle_1.default, { value: unit, onChange: setUnit })] })] }), renderBody(), (0, jsx_runtime_1.jsxs)(styles_1.CardFooter, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "hint", children: [(0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("path", { d: "M3 4 L7 1 L11 4 L11 11 L3 11 Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M5 11 L5 7 L9 7 L9 11" })] }), (0, jsx_runtime_1.jsxs)("span", { children: ["\u041A\u043B\u0438\u043A \u2014 \u0444\u0438\u043B\u044C\u0442\u0440 \u00B7 ", (0, jsx_runtime_1.jsx)("kbd", { children: "Ctrl" }), "+\u043A\u043B\u0438\u043A \u2014 \u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F"] })] }), enableAllItemsModal && totalRowsCount > topNVisible && ((0, jsx_runtime_1.jsxs)("button", { type: "button", className: "more", onClick: () => setAllOpen(true), children: ["\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0432\u0441\u0435 ", totalRowsCount, " \u043F\u043E\u0437\u0438\u0446\u0438\u0439 \u2192"] }))] }), showHoverTooltip && (0, jsx_runtime_1.jsx)(Tooltip_1.default, { payload: tooltip }), enableDrillModal && drillRow && drillQueryParams && ((0, jsx_runtime_1.jsx)(DetailModal_1.default, { row: drillRow, queryParams: drillQueryParams, unitSuffixRub: unitSuffixRub, decimalsValue: decimalsValue, decimalsDelta: decimalsDelta, invertDeltaGood: invertDeltaGood, isMockMode: isMockMode, themeMode: themeMode, onClose: handleCloseDetail })), enableAllItemsModal && allOpen && ((0, jsx_runtime_1.jsx)(AllItemsModal_1.default, { rows: rows, totalRows: totalRowsCount, totalSum: totalSum, unit: unit, maxValue: maxValue, invertDeltaGood: invertDeltaGood, decimalsValue: decimalsValue, decimalsDelta: decimalsDelta, decimalsShare: decimalsShare, unitSuffixRub: unitSuffixRub, showSparkline: showSparkline, showGhostPrevBar: showGhostPrevBar, hasPrevMetric: hasPrevMetric, activeIds: activeIds, themeMode: themeMode, initialSort: sortBy, onRowClick: handleRowClick, onClose: handleCloseAll }))] }));
};
exports.default = RankedBars;
//# sourceMappingURL=RankedBars.js.map