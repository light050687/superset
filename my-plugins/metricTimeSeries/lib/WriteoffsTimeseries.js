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
const react_1 = __importStar(require("react"));
const echarts_for_react_1 = __importDefault(require("echarts-for-react"));
const buildOption_1 = require("./chart/buildOption");
const styles_1 = require("./styles");
const InfoHint_1 = require("./components/InfoHint");
const dateHelpers_1 = require("./utils/dateHelpers");
/* ──────────────── Icons ──────────────── */
const IconLine = () => ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: (0, jsx_runtime_1.jsx)("path", { d: "M2 11 L6 7 L9 9 L14 3", strokeLinecap: "round", strokeLinejoin: "round" }) }));
const IconStackBar = () => ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 16", fill: "currentColor", children: [(0, jsx_runtime_1.jsx)("rect", { x: "2", y: "8", width: "3", height: "6", rx: "0.5", opacity: "0.45" }), (0, jsx_runtime_1.jsx)("rect", { x: "2", y: "4", width: "3", height: "4", rx: "0.5" }), (0, jsx_runtime_1.jsx)("rect", { x: "7", y: "7", width: "3", height: "7", rx: "0.5", opacity: "0.45" }), (0, jsx_runtime_1.jsx)("rect", { x: "7", y: "3", width: "3", height: "4", rx: "0.5" }), (0, jsx_runtime_1.jsx)("rect", { x: "12", y: "9", width: "3", height: "5", rx: "0.5", opacity: "0.45" }), (0, jsx_runtime_1.jsx)("rect", { x: "12", y: "5", width: "3", height: "4", rx: "0.5" })] }));
const IconStackArea = () => ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.2", children: [(0, jsx_runtime_1.jsx)("path", { d: "M2 14 L2 9 L6 6 L10 8 L14 4 L14 14 Z", fill: "currentColor", fillOpacity: "0.35" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 9 L6 6 L10 8 L14 4", strokeLinecap: "round", strokeLinejoin: "round" })] }));
const IconYear = () => ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.3", children: [(0, jsx_runtime_1.jsx)("rect", { x: "2", y: "3", width: "12", height: "11", rx: "1.5" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 6.5 L14 6.5", strokeLinecap: "round" }), (0, jsx_runtime_1.jsx)("text", { x: "8", y: "12.2", textAnchor: "middle", fontSize: "6", fontFamily: "monospace", fontWeight: "700", stroke: "none", fill: "currentColor", children: "Y" })] }));
const IconMonth = () => ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.3", children: [(0, jsx_runtime_1.jsx)("rect", { x: "2", y: "3", width: "12", height: "11", rx: "1.5" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 6.5 L14 6.5", strokeLinecap: "round" }), (0, jsx_runtime_1.jsx)("path", { d: "M5 2 L5 4 M11 2 L11 4", strokeLinecap: "round" }), (0, jsx_runtime_1.jsx)("rect", { x: "4.5", y: "8", width: "2.5", height: "2.5", fill: "currentColor", stroke: "none" })] }));
const IconWeek = () => ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.3", children: [(0, jsx_runtime_1.jsx)("rect", { x: "2", y: "3", width: "12", height: "11", rx: "1.5" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 6.5 L14 6.5", strokeLinecap: "round" }), (0, jsx_runtime_1.jsx)("path", { d: "M4 9 L12 9 M4 11.5 L12 11.5", strokeLinecap: "round" })] }));
const IconDay = () => ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.3", children: [(0, jsx_runtime_1.jsx)("rect", { x: "2", y: "3", width: "12", height: "11", rx: "1.5" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 6.5 L14 6.5", strokeLinecap: "round" }), (0, jsx_runtime_1.jsx)("circle", { cx: "8", cy: "10.3", r: "1.6", fill: "currentColor", stroke: "none" })] }));
const IconBrush = () => ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: (0, jsx_runtime_1.jsx)("rect", { x: "2.5", y: "2.5", width: "11", height: "11", rx: "1", strokeDasharray: "2 2" }) }));
const IconClick = () => ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { d: "M3 2 L3 13 L6 10 L8 14 L10 13 L8 9 L12 9 Z" }) }));
const IconBack = () => ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M10 3 L5 8 L10 13" }) }));
function Dropdown({ value, options, onChange, ariaLabel, }) {
    const [open, setOpen] = (0, react_1.useState)(false);
    const rootRef = (0, react_1.useRef)(null);
    const active = options.find(o => o.value === value) ?? options[0];
    (0, react_1.useEffect)(() => {
        if (!open)
            return undefined;
        const onDown = (e) => {
            if (!rootRef.current)
                return;
            if (!rootRef.current.contains(e.target))
                setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') {
                // Close the dropdown and stop propagation so the global ESC handler
                // (which resets the selection) doesn't also fire.
                setOpen(false);
                e.stopPropagation();
            }
        };
        document.addEventListener('mousedown', onDown);
        // Capture phase so we see ESC before the selection-reset handler.
        document.addEventListener('keydown', onKey, true);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey, true);
        };
    }, [open]);
    return ((0, jsx_runtime_1.jsx)(styles_1.DropdownRoot, { ref: rootRef, children: (0, jsx_runtime_1.jsxs)(styles_1.DropdownPanel, { open: open, "data-open": open, children: [(0, jsx_runtime_1.jsx)(styles_1.IconButton, { type: "button", "aria-haspopup": "listbox", "aria-expanded": open, "aria-label": ariaLabel, onClick: () => setOpen(o => !o), children: active.icon }), open && ((0, jsx_runtime_1.jsx)(styles_1.DropdownMenu, { role: "listbox", "aria-label": ariaLabel, children: options.map(opt => ((0, jsx_runtime_1.jsx)(styles_1.DropdownItem, { type: "button", active: opt.value === value, role: "option", "aria-selected": opt.value === value, "aria-label": opt.label, title: opt.label, onClick: () => {
                            onChange(opt.value);
                            setOpen(false);
                        }, children: (0, jsx_runtime_1.jsx)(styles_1.DropdownItemIcon, { children: opt.icon }) }, opt.value))) }))] }) }));
}
/* ──────────────── Legend helpers ──────────────── */
const LineMark = ({ color, type }) => {
    if (type === 'ring') {
        return ((0, jsx_runtime_1.jsxs)("svg", { width: "22", height: "10", children: [(0, jsx_runtime_1.jsx)("line", { x1: "0", y1: "5", x2: "22", y2: "5", stroke: color, strokeWidth: "1.5" }), (0, jsx_runtime_1.jsx)("circle", { cx: "11", cy: "5", r: "3", fill: "var(--s)", stroke: color, strokeWidth: "1.5" })] }));
    }
    if (type === 'dashed') {
        return ((0, jsx_runtime_1.jsx)("svg", { width: "22", height: "10", children: (0, jsx_runtime_1.jsx)("line", { x1: "0", y1: "5", x2: "22", y2: "5", stroke: color, strokeWidth: "2", strokeDasharray: "6 5" }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("svg", { width: "22", height: "10", children: [(0, jsx_runtime_1.jsx)("line", { x1: "0", y1: "5", x2: "22", y2: "5", stroke: color, strokeWidth: "2.5" }), (0, jsx_runtime_1.jsx)("circle", { cx: "11", cy: "5", r: "2.5", fill: color })] }));
};
const SquareMark = ({ color }) => ((0, jsx_runtime_1.jsx)("svg", { width: "14", height: "10", children: (0, jsx_runtime_1.jsx)("rect", { x: "0", y: "1", width: "14", height: "8", rx: "2", fill: color }) }));
const GhostBarMark = ({ color }) => ((0, jsx_runtime_1.jsx)("svg", { width: "22", height: "10", children: (0, jsx_runtime_1.jsx)("rect", { x: "3", y: "2", width: "16", height: "7", rx: "1", fill: color, fillOpacity: "0.35", stroke: color, strokeWidth: "1", strokeDasharray: "2 2" }) }));
/* ──────────────── Main component ──────────────── */
function WriteoffsTimeseriesInner(props) {
    const { headerText, subtitleText, dataState, errorMessage, timePoints, categories, defaultMode, defaultGranularity, defaultUnit, showBrushButton, enableDrillDown, formatValue, formatAxis, formatPct, seriesLabels, isDarkMode, mockModeEnabled, } = props;
    const fmtPctAxisFn = (0, react_1.useCallback)((v) => {
        if (v == null)
            return '';
        return `${Math.round(v)}%`;
    }, []);
    // ── UI state ──
    const [mode, setMode] = (0, react_1.useState)(defaultMode);
    const [gran, setGran] = (0, react_1.useState)(defaultGranularity);
    const [unit, setUnit] = (0, react_1.useState)(defaultUnit);
    const [hidden, setHidden] = (0, react_1.useState)({
        fact: false,
        plan: false,
        py: false,
    });
    const [hiddenCats, setHiddenCats] = (0, react_1.useState)({});
    const [selection, setSelection] = (0, react_1.useState)({
        from: 0,
        to: Math.max(0, timePoints.length - 1),
    });
    const [brushActive, setBrushActive] = (0, react_1.useState)(false);
    // Sync selection when timePoints length changes (e.g. new query)
    (0, react_1.useEffect)(() => {
        setSelection({ from: 0, to: Math.max(0, timePoints.length - 1) });
    }, [timePoints.length]);
    // Reset UI state when defaults change (controlPanel renderTrigger)
    (0, react_1.useEffect)(() => setMode(defaultMode), [defaultMode]);
    (0, react_1.useEffect)(() => setGran(defaultGranularity), [defaultGranularity]);
    (0, react_1.useEffect)(() => setUnit(defaultUnit), [defaultUnit]);
    const echartsRef = (0, react_1.useRef)(null);
    // ── Option build ──
    const { option, buckets } = (0, react_1.useMemo)(() => (0, buildOption_1.buildOption)({
        timePoints,
        categories,
        mode,
        gran,
        unit,
        hidden,
        hiddenCats,
        selection,
        isDarkMode,
        formatters: {
            formatValue,
            formatAxis,
            formatPct,
            formatPctAxis: fmtPctAxisFn,
        },
        seriesLabels,
    }), [
        timePoints,
        categories,
        mode,
        gran,
        unit,
        hidden,
        hiddenCats,
        selection,
        isDarkMode,
        formatValue,
        formatAxis,
        formatPct,
        fmtPctAxisFn,
        seriesLabels,
    ]);
    const isFullRange = selection.from === 0 && selection.to === timePoints.length - 1;
    // ── Actions ──
    const resetSelection = (0, react_1.useCallback)(() => {
        setSelection({ from: 0, to: Math.max(0, timePoints.length - 1) });
    }, [timePoints.length]);
    const drillToBucket = (0, react_1.useCallback)((bucketIdx) => {
        if (!enableDrillDown)
            return;
        const bucket = buckets[bucketIdx];
        if (!bucket)
            return;
        setSelection({ from: bucket.firstPointIdx, to: bucket.lastPointIdx });
        // Drill one level down the granularity
        if (gran === 'year')
            setGran('month');
        else if (gran === 'month')
            setGran('week');
        else if (gran === 'week')
            setGran('day');
    }, [buckets, enableDrillDown, gran]);
    const drillToRange = (0, react_1.useCallback)((lo, hi) => {
        const a = buckets[Math.max(0, Math.min(buckets.length - 1, lo))];
        const b = buckets[Math.max(0, Math.min(buckets.length - 1, hi))];
        if (!a || !b)
            return;
        setSelection({
            from: Math.min(a.firstPointIdx, b.firstPointIdx),
            to: Math.max(a.lastPointIdx, b.lastPointIdx),
        });
        if (gran === 'year')
            setGran('month');
        else if (gran === 'month')
            setGran('week');
        else if (gran === 'week')
            setGran('day');
    }, [buckets, gran]);
    const toggleBrush = (0, react_1.useCallback)(() => {
        setBrushActive(active => {
            const chart = echartsRef.current?.getEchartsInstance();
            if (!chart)
                return active;
            const next = !active;
            if (next) {
                chart.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'brush',
                    brushOption: { brushType: 'lineX', brushMode: 'single' },
                });
            }
            else {
                chart.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'brush',
                    brushOption: { brushType: false },
                });
                chart.dispatchAction({ type: 'brush', areas: [] });
            }
            return next;
        });
    }, []);
    // Keyboard: Esc resets selection; Shift activates brush mode while held
    (0, react_1.useEffect)(() => {
        const onDown = (e) => {
            if (e.key === 'Escape' && !isFullRange) {
                resetSelection();
            }
            if (e.key === 'Shift' && !brushActive) {
                toggleBrush();
            }
        };
        const onUp = (e) => {
            if (e.key === 'Shift' && brushActive) {
                toggleBrush();
            }
        };
        const onBlur = () => {
            if (brushActive)
                toggleBrush();
        };
        document.addEventListener('keydown', onDown);
        document.addEventListener('keyup', onUp);
        window.addEventListener('blur', onBlur);
        return () => {
            document.removeEventListener('keydown', onDown);
            document.removeEventListener('keyup', onUp);
            window.removeEventListener('blur', onBlur);
        };
    }, [brushActive, isFullRange, resetSelection, toggleBrush]);
    const onEvents = (0, react_1.useMemo)(() => ({
        click: (params) => {
            if (!enableDrillDown)
                return;
            if (params.componentType !== 'series')
                return;
            if (params.dataIndex == null)
                return;
            drillToBucket(params.dataIndex);
        },
        brushEnd: (params) => {
            const areas = params.areas ?? [];
            if (!areas.length) {
                if (brushActive)
                    toggleBrush();
                return;
            }
            const area = areas[0];
            if (!area?.coordRange) {
                if (brushActive)
                    toggleBrush();
                return;
            }
            const [a, b] = area.coordRange.map(v => Math.round(v));
            const lo = Math.min(a, b);
            const hi = Math.max(a, b);
            if (lo === hi)
                drillToBucket(lo);
            else
                drillToRange(lo, hi);
            if (brushActive)
                toggleBrush();
        },
    }), [brushActive, drillToBucket, drillToRange, enableDrillDown, toggleBrush]);
    // ── Legend interactions ──
    const toggleSeries = (k) => setHidden(prev => ({ ...prev, [k]: !prev[k] }));
    const toggleCategory = (id) => setHiddenCats(prev => ({ ...prev, [id]: !prev[id] }));
    // ── Breadcrumb text ──
    const hierarchyText = (0, react_1.useMemo)(() => {
        if (gran === 'year')
            return 'Год';
        if (gran === 'month')
            return 'Год › Месяц';
        if (gran === 'week')
            return 'Месяц › Неделя';
        return 'Неделя › День';
    }, [gran]);
    const rangeText = (0, react_1.useMemo)(() => {
        if (!timePoints.length)
            return '';
        const a = timePoints[Math.max(0, Math.min(timePoints.length - 1, selection.from))];
        const b = timePoints[Math.max(0, Math.min(timePoints.length - 1, selection.to))];
        if (!a || !b)
            return '';
        const shortA = `${(0, dateHelpers_1.ruMonthShort)(a.month)} ${a.year}`;
        const shortB = `${(0, dateHelpers_1.ruMonthShort)(b.month)} ${b.year}`;
        return shortA === shortB ? shortA : `${shortA} – ${shortB}`;
    }, [timePoints, selection.from, selection.to]);
    // ── States ──
    if (dataState === 'loading') {
        return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { width: props.width, height: props.height, "data-theme": isDarkMode ? 'dark' : 'light', className: styles_1.CARD_CLASS, children: [(0, jsx_runtime_1.jsx)("style", { children: styles_1.KEYFRAMES_CSS }), (0, jsx_runtime_1.jsx)(styles_1.Card, { "data-no-anim": "", children: (0, jsx_runtime_1.jsxs)(styles_1.SkeletonWrap, { children: [(0, jsx_runtime_1.jsx)(styles_1.SkeletonBlock, { w: "40%", h: 14 }), (0, jsx_runtime_1.jsx)(styles_1.SkeletonBlock, { h: 200 }), (0, jsx_runtime_1.jsx)(styles_1.SkeletonBlock, { w: "60%", h: 12 })] }) })] }));
    }
    if (dataState === 'error') {
        return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { width: props.width, height: props.height, "data-theme": isDarkMode ? 'dark' : 'light', className: styles_1.CARD_CLASS, children: [(0, jsx_runtime_1.jsx)("style", { children: styles_1.KEYFRAMES_CSS }), (0, jsx_runtime_1.jsx)(styles_1.Card, { "data-no-anim": "", children: (0, jsx_runtime_1.jsxs)(styles_1.ErrorStateWrap, { children: [(0, jsx_runtime_1.jsx)(styles_1.ErrorStateIcon, {}), (0, jsx_runtime_1.jsx)(styles_1.ErrorStateText, { children: errorMessage || 'Ошибка отображения' })] }) })] }));
    }
    if (dataState === 'empty') {
        return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { width: props.width, height: props.height, "data-theme": isDarkMode ? 'dark' : 'light', className: styles_1.CARD_CLASS, children: [(0, jsx_runtime_1.jsx)("style", { children: styles_1.KEYFRAMES_CSS }), (0, jsx_runtime_1.jsx)(styles_1.SrLive, { "aria-live": "polite", children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445" }), (0, jsx_runtime_1.jsx)(styles_1.Card, { "data-no-anim": "", children: (0, jsx_runtime_1.jsxs)(styles_1.EmptyStateWrap, { children: [(0, jsx_runtime_1.jsx)(styles_1.EmptyStateIcon, { children: "\u2014" }), (0, jsx_runtime_1.jsxs)(styles_1.EmptyStateText, { children: ["\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434.", (0, jsx_runtime_1.jsx)("br", {}), "\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B \u0438 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E\u0439 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D."] })] }) })] }));
    }
    const isPartial = dataState === 'partial';
    const isStale = dataState === 'stale';
    const liveMessage = dataState === 'populated'
        ? ''
        : isPartial
            ? 'Часть данных недоступна'
            : isStale
                ? 'Данные устарели'
                : '';
    return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { width: props.width, height: props.height, "data-theme": isDarkMode ? 'dark' : 'light', className: styles_1.CARD_CLASS, role: "figure", "aria-label": headerText, children: [(0, jsx_runtime_1.jsx)("style", { children: styles_1.KEYFRAMES_CSS }), (0, jsx_runtime_1.jsx)(styles_1.SrLive, { "aria-live": "polite", "aria-atomic": "true", children: liveMessage }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { "data-info-hint-container": "", children: [isStale && (0, jsx_runtime_1.jsx)(styles_1.StaleBar, { "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)(styles_1.CardHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.TitleWrap, { children: [(0, jsx_runtime_1.jsxs)(styles_1.Title, { children: [headerText, mockModeEnabled && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [' ', (0, jsx_runtime_1.jsx)(styles_1.MockBadge, { children: "\u0422\u0415\u0421\u0422" })] })), isPartial && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [' ', (0, jsx_runtime_1.jsx)(styles_1.PartialBadge, { title: "\u0427\u0430\u0441\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0445 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430", children: "\u0427\u0430\u0441\u0442\u0438\u0447\u043D\u043E" })] }))] }), (0, jsx_runtime_1.jsxs)(styles_1.Breadcrumb, { children: [!isFullRange && ((0, jsx_runtime_1.jsx)(styles_1.BreadcrumbBack, { type: "button", "aria-label": "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A\u043E \u0432\u0441\u0435\u043C\u0443 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0443", title: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 (Esc)", onClick: resetSelection, children: "\u25C2" })), (0, jsx_runtime_1.jsxs)("span", { children: [subtitleText && `${subtitleText} · `, hierarchyText, " \u00B7 ", rangeText] })] })] }), (0, jsx_runtime_1.jsxs)(styles_1.Controls, { children: [(0, jsx_runtime_1.jsx)(Dropdown, { ariaLabel: "\u0413\u0440\u0430\u043D\u0443\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C", value: gran, onChange: (v) => {
                                            setGran(v);
                                            if (v === 'year' || v === 'month') {
                                                if (selection.from === selection.to) {
                                                    resetSelection();
                                                }
                                            }
                                        }, options: [
                                            { value: 'year', label: 'По годам', icon: (0, jsx_runtime_1.jsx)(IconYear, {}) },
                                            { value: 'month', label: 'По месяцам', icon: (0, jsx_runtime_1.jsx)(IconMonth, {}) },
                                            { value: 'week', label: 'По неделям', icon: (0, jsx_runtime_1.jsx)(IconWeek, {}) },
                                            { value: 'day', label: 'По дням', icon: (0, jsx_runtime_1.jsx)(IconDay, {}) },
                                        ] }), (0, jsx_runtime_1.jsx)(Dropdown, { ariaLabel: "\u0420\u0435\u0436\u0438\u043C", value: mode, 
                                        // Dropdown.onChange is typed as (v: string) => void; narrow
                                        // back to the ChartMode literal union.
                                        onChange: (v) => setMode(v), options: [
                                            { value: 'line', label: 'Линия', icon: (0, jsx_runtime_1.jsx)(IconLine, {}) },
                                            { value: 'stack-bar', label: 'Стек-бары', icon: (0, jsx_runtime_1.jsx)(IconStackBar, {}) },
                                            { value: 'stack-area', label: 'Стек-площадь', icon: (0, jsx_runtime_1.jsx)(IconStackArea, {}) },
                                        ] }), (0, jsx_runtime_1.jsxs)(styles_1.UnitToggleGroup, { role: "group", "aria-label": "\u0415\u0434\u0438\u043D\u0438\u0446\u044B \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u044F", children: [(0, jsx_runtime_1.jsx)(styles_1.UnitButton, { type: "button", active: unit === 'rub', "aria-pressed": unit === 'rub', onClick: () => setUnit('rub'), children: "\u20BD" }), (0, jsx_runtime_1.jsx)(styles_1.UnitButton, { type: "button", active: unit === 'pct', "aria-pressed": unit === 'pct', onClick: () => setUnit('pct'), children: "%" })] }), (0, jsx_runtime_1.jsx)(InfoHint_1.InfoHintTopRight, { children: (0, jsx_runtime_1.jsxs)(InfoHint_1.InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [!isFullRange ? ((0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "\u25C2" }), " \u0438\u043B\u0438 ", (0, jsx_runtime_1.jsx)("kbd", { children: "Esc" }), " \u2014 \u043D\u0430\u0437\u0430\u0434"] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [gran === 'month' && enableDrillDown && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "\u043A\u043B\u0438\u043A" }), " \u2014 \u043C\u0435\u0441\u044F\u0446"] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" })] })), (0, jsx_runtime_1.jsx)("span", { className: "hi", children: "\u0432\u044B\u0434\u0435\u043B\u0438\u0442\u044C \u2014 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D" })] })), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Right Click" }), " \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"] })] }) })] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ChartWrap, { drillable: enableDrillDown && gran !== 'day' && mode === 'line' && !hidden.fact, brushActive: brushActive, children: [(0, jsx_runtime_1.jsx)(styles_1.ChartInner, { children: (0, jsx_runtime_1.jsx)(echarts_for_react_1.default, { ref: (inst) => {
                                        echartsRef.current = inst;
                                    }, option: option, notMerge: true, lazyUpdate: true, onEvents: onEvents }) }), showBrushButton && ((0, jsx_runtime_1.jsx)(styles_1.BrushButton, { type: "button", active: brushActive, "aria-label": "\u0412\u044B\u0434\u0435\u043B\u0438\u0442\u044C \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D", "aria-pressed": brushActive, title: "\u0412\u044B\u0434\u0435\u043B\u0438\u0442\u044C \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D (Shift-drag)", onClick: toggleBrush, children: (0, jsx_runtime_1.jsx)(IconBrush, {}) }))] }), (0, jsx_runtime_1.jsxs)(styles_1.CardFooter, { children: [(0, jsx_runtime_1.jsx)(styles_1.LegendRow, { children: mode === 'line' ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { type: "button", off: hidden.fact, "aria-pressed": hidden.fact, onClick: () => toggleSeries('fact'), children: [(0, jsx_runtime_1.jsx)(styles_1.LegendMark, { children: (0, jsx_runtime_1.jsx)(LineMark, { color: "var(--c-sky)", type: "solid" }) }), (0, jsx_runtime_1.jsx)(styles_1.LegendLabel, { children: seriesLabels.fact })] }), (0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { type: "button", off: hidden.plan, "aria-pressed": hidden.plan, onClick: () => toggleSeries('plan'), children: [(0, jsx_runtime_1.jsx)(styles_1.LegendMark, { children: (0, jsx_runtime_1.jsx)(LineMark, { color: "var(--g600)", type: "ring" }) }), (0, jsx_runtime_1.jsx)(styles_1.LegendLabel, { children: seriesLabels.plan })] }), (0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { type: "button", off: hidden.py, "aria-pressed": hidden.py, onClick: () => toggleSeries('py'), children: [(0, jsx_runtime_1.jsx)(styles_1.LegendMark, { children: (0, jsx_runtime_1.jsx)(LineMark, { color: "var(--c-violet)", type: "dashed" }) }), (0, jsx_runtime_1.jsx)(styles_1.LegendLabel, { children: seriesLabels.py })] })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [categories.map(cat => ((0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { type: "button", off: Boolean(hiddenCats[cat.id]), "aria-pressed": Boolean(hiddenCats[cat.id]), onClick: () => toggleCategory(cat.id), children: [(0, jsx_runtime_1.jsx)(styles_1.LegendMark, { children: (0, jsx_runtime_1.jsx)(SquareMark, { color: `var(${cat.colorToken})` }) }), (0, jsx_runtime_1.jsx)(styles_1.LegendLabel, { children: cat.name })] }, cat.id))), (0, jsx_runtime_1.jsx)(styles_1.LegendSeparator, {}), (0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { type: "button", off: hidden.plan, "aria-pressed": hidden.plan, onClick: () => toggleSeries('plan'), children: [(0, jsx_runtime_1.jsx)(styles_1.LegendMark, { children: (0, jsx_runtime_1.jsx)(LineMark, { color: "var(--g600)", type: "ring" }) }), (0, jsx_runtime_1.jsx)(styles_1.LegendLabel, { children: seriesLabels.plan })] }), (0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { type: "button", off: hidden.py, "aria-pressed": hidden.py, onClick: () => toggleSeries('py'), children: [(0, jsx_runtime_1.jsx)(styles_1.LegendMark, { children: mode === 'stack-bar' ? ((0, jsx_runtime_1.jsx)(GhostBarMark, { color: "var(--c-violet)" })) : ((0, jsx_runtime_1.jsx)(LineMark, { color: "var(--c-violet)", type: "dashed" })) }), (0, jsx_runtime_1.jsx)(styles_1.LegendLabel, { children: seriesLabels.py })] })] })) }), (0, jsx_runtime_1.jsx)(styles_1.FooterSpacer, {})] })] })] }));
}
/** Shallow comparison that skips functions (formatters are recreated each transformProps call). */
function arePropsEqual(prev, next) {
    const keys = Object.keys(next);
    for (const key of keys) {
        if (typeof next[key] === 'function')
            continue;
        if (key === 'theme')
            continue;
        if (prev[key] !== next[key])
            return false;
    }
    return true;
}
const WriteoffsTimeseries = react_1.default.memo(WriteoffsTimeseriesInner, arePropsEqual);
exports.default = WriteoffsTimeseries;
//# sourceMappingURL=WriteoffsTimeseries.js.map