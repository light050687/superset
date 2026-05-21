import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import ReactECharts from 'echarts-for-react';
import { buildOption } from './chart/buildOption';
import { Root, Card, CardHead, TitleWrap, Title, Breadcrumb, BreadcrumbBack, Controls, IconButton, UnitToggleGroup, UnitButton, DropdownRoot, DropdownPanel, DropdownMenu, DropdownItem, DropdownItemIcon, ChartWrap, ChartInner, BrushButton, CardFooter, LegendRow, LegendItem, LegendMark, LegendLabel, LegendSeparator, FooterSpacer, SkeletonWrap, SkeletonBlock, EmptyStateWrap, EmptyStateIcon, EmptyStateText, ErrorStateWrap, ErrorStateIcon, ErrorStateText, MockBadge, PartialBadge, StaleBar, SrLive, KEYFRAMES_CSS, CARD_CLASS, } from './styles';
import { InfoHint, InfoHintTopRight } from './components/InfoHint';
import { ruMonthShort } from './utils/dateHelpers';
/* ──────────────── Icons ──────────────── */
const IconLine = () => (_jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: _jsx("path", { d: "M2 11 L6 7 L9 9 L14 3", strokeLinecap: "round", strokeLinejoin: "round" }) }));
const IconStackBar = () => (_jsxs("svg", { viewBox: "0 0 16 16", fill: "currentColor", children: [_jsx("rect", { x: "2", y: "8", width: "3", height: "6", rx: "0.5", opacity: "0.45" }), _jsx("rect", { x: "2", y: "4", width: "3", height: "4", rx: "0.5" }), _jsx("rect", { x: "7", y: "7", width: "3", height: "7", rx: "0.5", opacity: "0.45" }), _jsx("rect", { x: "7", y: "3", width: "3", height: "4", rx: "0.5" }), _jsx("rect", { x: "12", y: "9", width: "3", height: "5", rx: "0.5", opacity: "0.45" }), _jsx("rect", { x: "12", y: "5", width: "3", height: "4", rx: "0.5" })] }));
const IconStackArea = () => (_jsxs("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.2", children: [_jsx("path", { d: "M2 14 L2 9 L6 6 L10 8 L14 4 L14 14 Z", fill: "currentColor", fillOpacity: "0.35" }), _jsx("path", { d: "M2 9 L6 6 L10 8 L14 4", strokeLinecap: "round", strokeLinejoin: "round" })] }));
const IconYear = () => (_jsxs("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.3", children: [_jsx("rect", { x: "2", y: "3", width: "12", height: "11", rx: "1.5" }), _jsx("path", { d: "M2 6.5 L14 6.5", strokeLinecap: "round" }), _jsx("text", { x: "8", y: "12.2", textAnchor: "middle", fontSize: "6", fontFamily: "monospace", fontWeight: "700", stroke: "none", fill: "currentColor", children: "Y" })] }));
const IconMonth = () => (_jsxs("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.3", children: [_jsx("rect", { x: "2", y: "3", width: "12", height: "11", rx: "1.5" }), _jsx("path", { d: "M2 6.5 L14 6.5", strokeLinecap: "round" }), _jsx("path", { d: "M5 2 L5 4 M11 2 L11 4", strokeLinecap: "round" }), _jsx("rect", { x: "4.5", y: "8", width: "2.5", height: "2.5", fill: "currentColor", stroke: "none" })] }));
const IconWeek = () => (_jsxs("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.3", children: [_jsx("rect", { x: "2", y: "3", width: "12", height: "11", rx: "1.5" }), _jsx("path", { d: "M2 6.5 L14 6.5", strokeLinecap: "round" }), _jsx("path", { d: "M4 9 L12 9 M4 11.5 L12 11.5", strokeLinecap: "round" })] }));
const IconDay = () => (_jsxs("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.3", children: [_jsx("rect", { x: "2", y: "3", width: "12", height: "11", rx: "1.5" }), _jsx("path", { d: "M2 6.5 L14 6.5", strokeLinecap: "round" }), _jsx("circle", { cx: "8", cy: "10.3", r: "1.6", fill: "currentColor", stroke: "none" })] }));
const IconBrush = () => (_jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: _jsx("rect", { x: "2.5", y: "2.5", width: "11", height: "11", rx: "1", strokeDasharray: "2 2" }) }));
const IconClick = () => (_jsx("svg", { viewBox: "0 0 16 16", fill: "currentColor", children: _jsx("path", { d: "M3 2 L3 13 L6 10 L8 14 L10 13 L8 9 L12 9 Z" }) }));
const IconBack = () => (_jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M10 3 L5 8 L10 13" }) }));
function Dropdown({ value, options, onChange, ariaLabel, }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const active = options.find(o => o.value === value) ?? options[0];
    useEffect(() => {
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
    return (_jsx(DropdownRoot, { ref: rootRef, children: _jsxs(DropdownPanel, { open: open, "data-open": open, children: [_jsx(IconButton, { type: "button", "aria-haspopup": "listbox", "aria-expanded": open, "aria-label": ariaLabel, onClick: () => setOpen(o => !o), children: active.icon }), open && (_jsx(DropdownMenu, { role: "listbox", "aria-label": ariaLabel, children: options.map(opt => (_jsx(DropdownItem, { type: "button", active: opt.value === value, role: "option", "aria-selected": opt.value === value, "aria-label": opt.label, title: opt.label, onClick: () => {
                            onChange(opt.value);
                            setOpen(false);
                        }, children: _jsx(DropdownItemIcon, { children: opt.icon }) }, opt.value))) }))] }) }));
}
/* ──────────────── Legend helpers ──────────────── */
const LineMark = ({ color, type }) => {
    if (type === 'ring') {
        return (_jsxs("svg", { width: "22", height: "10", children: [_jsx("line", { x1: "0", y1: "5", x2: "22", y2: "5", stroke: color, strokeWidth: "1.5" }), _jsx("circle", { cx: "11", cy: "5", r: "3", fill: "var(--s)", stroke: color, strokeWidth: "1.5" })] }));
    }
    if (type === 'dashed') {
        return (_jsx("svg", { width: "22", height: "10", children: _jsx("line", { x1: "0", y1: "5", x2: "22", y2: "5", stroke: color, strokeWidth: "2", strokeDasharray: "6 5" }) }));
    }
    return (_jsxs("svg", { width: "22", height: "10", children: [_jsx("line", { x1: "0", y1: "5", x2: "22", y2: "5", stroke: color, strokeWidth: "2.5" }), _jsx("circle", { cx: "11", cy: "5", r: "2.5", fill: color })] }));
};
const SquareMark = ({ color }) => (_jsx("svg", { width: "14", height: "10", children: _jsx("rect", { x: "0", y: "1", width: "14", height: "8", rx: "2", fill: color }) }));
const GhostBarMark = ({ color }) => (_jsx("svg", { width: "22", height: "10", children: _jsx("rect", { x: "3", y: "2", width: "16", height: "7", rx: "1", fill: color, fillOpacity: "0.35", stroke: color, strokeWidth: "1", strokeDasharray: "2 2" }) }));
/* ──────────────── Main component ──────────────── */
function WriteoffsTimeseriesInner(props) {
    const { headerText, subtitleText, dataState, errorMessage, timePoints, categories, defaultMode, defaultGranularity, defaultUnit, showBrushButton, enableDrillDown, formatValue, formatAxis, formatPct, seriesLabels, isDarkMode, mockModeEnabled, } = props;
    const fmtPctAxisFn = useCallback((v) => {
        if (v == null)
            return '';
        return `${Math.round(v)}%`;
    }, []);
    // ── UI state ──
    const [mode, setMode] = useState(defaultMode);
    const [gran, setGran] = useState(defaultGranularity);
    const [unit, setUnit] = useState(defaultUnit);
    const [hidden, setHidden] = useState({
        fact: false,
        plan: false,
        py: false,
    });
    const [hiddenCats, setHiddenCats] = useState({});
    const [selection, setSelection] = useState({
        from: 0,
        to: Math.max(0, timePoints.length - 1),
    });
    const [brushActive, setBrushActive] = useState(false);
    // Sync selection when timePoints length changes (e.g. new query)
    useEffect(() => {
        setSelection({ from: 0, to: Math.max(0, timePoints.length - 1) });
    }, [timePoints.length]);
    // Reset UI state when defaults change (controlPanel renderTrigger)
    useEffect(() => setMode(defaultMode), [defaultMode]);
    useEffect(() => setGran(defaultGranularity), [defaultGranularity]);
    useEffect(() => setUnit(defaultUnit), [defaultUnit]);
    const echartsRef = useRef(null);
    /* Ref на основной Card div — нужен для IntersectionObserver (resilience-эффект ниже). */
    const cardContainerRef = useRef(null);
    /* Resize/resilience для echarts-for-react wrapper.
       Wrapper НЕ имеет встроенного ResizeObserver — без force-resize chart
       остаётся 0×0 если первый mount произошёл до CSS layout finalize.
       Также покрываем canvas context loss (long offscreen, tab switch). */
    useEffect(() => {
        const card = cardContainerRef.current;
        if (!card)
            return undefined;
        const safeResize = () => {
            const inst = echartsRef.current?.getEchartsInstance();
            if (!inst)
                return;
            const w = card.clientWidth;
            const h = card.clientHeight;
            if (w <= 0 || h <= 0)
                return;
            inst.resize();
        };
        /* ResizeObserver — основной механизм: container size меняется
           (CSS layout, window resize, drag-resize в dashboard) → resize.
           rAF throttle: дашборд может выдать burst resize-событий. */
        let ro = null;
        let rafId;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => {
                if (rafId !== undefined)
                    cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(safeResize);
            });
            ro.observe(card);
        }
        /* IO: при возврате в viewport (long offscreen → canvas context lost). */
        let io = null;
        if (typeof IntersectionObserver !== 'undefined') {
            io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting))
                safeResize(); }, { threshold: 0.01 });
            io.observe(card);
        }
        /* visibilitychange: при возврате tab-active (browser suspended). */
        const onVisibility = () => { if (!document.hidden)
            safeResize(); };
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            if (rafId !== undefined)
                cancelAnimationFrame(rafId);
            ro?.disconnect();
            io?.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);
    // ── Option build ──
    const { option, buckets } = useMemo(() => buildOption({
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
    const resetSelection = useCallback(() => {
        setSelection({ from: 0, to: Math.max(0, timePoints.length - 1) });
    }, [timePoints.length]);
    const drillToBucket = useCallback((bucketIdx) => {
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
    const drillToRange = useCallback((lo, hi) => {
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
    const toggleBrush = useCallback(() => {
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
    useEffect(() => {
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
    const onEvents = useMemo(() => ({
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
    const hierarchyText = useMemo(() => {
        if (gran === 'year')
            return 'Год';
        if (gran === 'month')
            return 'Год › Месяц';
        if (gran === 'week')
            return 'Месяц › Неделя';
        return 'Неделя › День';
    }, [gran]);
    const rangeText = useMemo(() => {
        if (!timePoints.length)
            return '';
        const a = timePoints[Math.max(0, Math.min(timePoints.length - 1, selection.from))];
        const b = timePoints[Math.max(0, Math.min(timePoints.length - 1, selection.to))];
        if (!a || !b)
            return '';
        const shortA = `${ruMonthShort(a.month)} ${a.year}`;
        const shortB = `${ruMonthShort(b.month)} ${b.year}`;
        return shortA === shortB ? shortA : `${shortA} – ${shortB}`;
    }, [timePoints, selection.from, selection.to]);
    // ── States ──
    if (dataState === 'loading') {
        return (_jsxs(Root, { width: props.width, height: props.height, "data-theme": isDarkMode ? 'dark' : 'light', className: CARD_CLASS, children: [_jsx("style", { children: KEYFRAMES_CSS }), _jsx(Card, { "data-no-anim": "", children: _jsxs(SkeletonWrap, { children: [_jsx(SkeletonBlock, { w: "40%", h: 14 }), _jsx(SkeletonBlock, { h: 200 }), _jsx(SkeletonBlock, { w: "60%", h: 12 })] }) })] }));
    }
    if (dataState === 'error') {
        return (_jsxs(Root, { width: props.width, height: props.height, "data-theme": isDarkMode ? 'dark' : 'light', className: CARD_CLASS, children: [_jsx("style", { children: KEYFRAMES_CSS }), _jsx(Card, { "data-no-anim": "", children: _jsxs(ErrorStateWrap, { children: [_jsx(ErrorStateIcon, {}), _jsx(ErrorStateText, { children: errorMessage || 'Ошибка отображения' })] }) })] }));
    }
    if (dataState === 'empty') {
        return (_jsxs(Root, { width: props.width, height: props.height, "data-theme": isDarkMode ? 'dark' : 'light', className: CARD_CLASS, children: [_jsx("style", { children: KEYFRAMES_CSS }), _jsx(SrLive, { "aria-live": "polite", children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445" }), _jsx(Card, { "data-no-anim": "", children: _jsxs(EmptyStateWrap, { children: [_jsx(EmptyStateIcon, { children: "\u2014" }), _jsxs(EmptyStateText, { children: ["\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434.", _jsx("br", {}), "\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B \u0438 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E\u0439 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D."] })] }) })] }));
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
    return (_jsxs(Root, { width: props.width, height: props.height, "data-theme": isDarkMode ? 'dark' : 'light', className: CARD_CLASS, role: "figure", "aria-label": headerText, children: [_jsx("style", { children: KEYFRAMES_CSS }), _jsx(SrLive, { "aria-live": "polite", "aria-atomic": "true", children: liveMessage }), _jsxs(Card, { "data-info-hint-container": "", ref: cardContainerRef, children: [isStale && _jsx(StaleBar, { "aria-hidden": "true" }), _jsxs(CardHead, { children: [_jsxs(TitleWrap, { children: [_jsxs(Title, { children: [headerText, mockModeEnabled && (_jsxs(_Fragment, { children: [' ', _jsx(MockBadge, { children: "\u0422\u0415\u0421\u0422" })] })), isPartial && (_jsxs(_Fragment, { children: [' ', _jsx(PartialBadge, { title: "\u0427\u0430\u0441\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0445 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430", children: "\u0427\u0430\u0441\u0442\u0438\u0447\u043D\u043E" })] }))] }), _jsxs(Breadcrumb, { children: [!isFullRange && (_jsx(BreadcrumbBack, { type: "button", "aria-label": "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A\u043E \u0432\u0441\u0435\u043C\u0443 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0443", title: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 (Esc)", onClick: resetSelection, children: "\u25C2" })), _jsxs("span", { children: [subtitleText && `${subtitleText} · `, hierarchyText, " \u00B7 ", rangeText] })] })] }), _jsxs(Controls, { children: [_jsx(Dropdown, { ariaLabel: "\u0413\u0440\u0430\u043D\u0443\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C", value: gran, onChange: (v) => {
                                            setGran(v);
                                            if (v === 'year' || v === 'month') {
                                                if (selection.from === selection.to) {
                                                    resetSelection();
                                                }
                                            }
                                        }, options: [
                                            { value: 'year', label: 'По годам', icon: _jsx(IconYear, {}) },
                                            { value: 'month', label: 'По месяцам', icon: _jsx(IconMonth, {}) },
                                            { value: 'week', label: 'По неделям', icon: _jsx(IconWeek, {}) },
                                            { value: 'day', label: 'По дням', icon: _jsx(IconDay, {}) },
                                        ] }), _jsx(Dropdown, { ariaLabel: "\u0420\u0435\u0436\u0438\u043C", value: mode, 
                                        // Dropdown.onChange is typed as (v: string) => void; narrow
                                        // back to the ChartMode literal union.
                                        onChange: (v) => setMode(v), options: [
                                            { value: 'line', label: 'Линия', icon: _jsx(IconLine, {}) },
                                            { value: 'stack-bar', label: 'Стек-бары', icon: _jsx(IconStackBar, {}) },
                                            { value: 'stack-area', label: 'Стек-площадь', icon: _jsx(IconStackArea, {}) },
                                        ] }), _jsxs(UnitToggleGroup, { role: "group", "aria-label": "\u0415\u0434\u0438\u043D\u0438\u0446\u044B \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u044F", children: [_jsx(UnitButton, { type: "button", active: unit === 'rub', "aria-pressed": unit === 'rub', onClick: () => setUnit('rub'), children: "\u20BD" }), _jsx(UnitButton, { type: "button", active: unit === 'pct', "aria-pressed": unit === 'pct', onClick: () => setUnit('pct'), children: "%" })] }), _jsx(InfoHintTopRight, { children: _jsxs(InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [!isFullRange ? (_jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "\u25C2" }), " \u0438\u043B\u0438 ", _jsx("kbd", { children: "Esc" }), " \u2014 \u043D\u0430\u0437\u0430\u0434"] })) : (_jsxs(_Fragment, { children: [gran === 'month' && enableDrillDown && (_jsxs(_Fragment, { children: [_jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "\u043A\u043B\u0438\u043A" }), " \u2014 \u043C\u0435\u0441\u044F\u0446"] }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" })] })), _jsx("span", { className: "hi", children: "\u0432\u044B\u0434\u0435\u043B\u0438\u0442\u044C \u2014 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D" })] })), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Right Click" }), " \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"] })] }) })] })] }), _jsxs(ChartWrap, { drillable: enableDrillDown && gran !== 'day' && mode === 'line' && !hidden.fact, brushActive: brushActive, children: [_jsx(ChartInner, { children: _jsx(ReactECharts, { ref: (inst) => {
                                        echartsRef.current = inst;
                                        /* Force initial resize когда wrapper готов.
                                           ReactECharts создаёт ECharts instance АСИНХРОННО после mount —
                                           мой useEffect наверху уже отработал, но в момент его выполнения
                                           getEchartsInstance() возвращал null. ResizeObserver fires только
                                           на изменение размера, не на ready-state. Без этого hooka после
                                           late mount (chart scrolled into view) ECharts инициализируется
                                           с 0×0 → canvas blank навсегда. rAF гарантирует layout finalized. */
                                        if (inst && cardContainerRef.current) {
                                            const chart = inst.getEchartsInstance();
                                            const c = cardContainerRef.current;
                                            if (chart) {
                                                requestAnimationFrame(() => {
                                                    if (c.clientWidth > 0 && c.clientHeight > 0) {
                                                        chart.resize();
                                                    }
                                                });
                                            }
                                        }
                                    }, option: option, notMerge: true, 
                                    /* lazyUpdate УБРАН: при mount с initial 0×0 container
                                       wrapper может skip setOption полностью → canvas blank. */
                                    onEvents: onEvents }) }), showBrushButton && (_jsx(BrushButton, { type: "button", active: brushActive, "aria-label": "\u0412\u044B\u0434\u0435\u043B\u0438\u0442\u044C \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D", "aria-pressed": brushActive, title: "\u0412\u044B\u0434\u0435\u043B\u0438\u0442\u044C \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D (Shift-drag)", onClick: toggleBrush, children: _jsx(IconBrush, {}) }))] }), _jsxs(CardFooter, { children: [_jsx(LegendRow, { children: mode === 'line' ? (_jsxs(_Fragment, { children: [_jsxs(LegendItem, { type: "button", off: hidden.fact, "aria-pressed": hidden.fact, onClick: () => toggleSeries('fact'), children: [_jsx(LegendMark, { children: _jsx(LineMark, { color: "var(--c-sky)", type: "solid" }) }), _jsx(LegendLabel, { children: seriesLabels.fact })] }), _jsxs(LegendItem, { type: "button", off: hidden.plan, "aria-pressed": hidden.plan, onClick: () => toggleSeries('plan'), children: [_jsx(LegendMark, { children: _jsx(LineMark, { color: "var(--g600)", type: "ring" }) }), _jsx(LegendLabel, { children: seriesLabels.plan })] }), _jsxs(LegendItem, { type: "button", off: hidden.py, "aria-pressed": hidden.py, onClick: () => toggleSeries('py'), children: [_jsx(LegendMark, { children: _jsx(LineMark, { color: "var(--c-violet)", type: "dashed" }) }), _jsx(LegendLabel, { children: seriesLabels.py })] })] })) : (_jsxs(_Fragment, { children: [categories.map(cat => (_jsxs(LegendItem, { type: "button", off: Boolean(hiddenCats[cat.id]), "aria-pressed": Boolean(hiddenCats[cat.id]), onClick: () => toggleCategory(cat.id), children: [_jsx(LegendMark, { children: _jsx(SquareMark, { color: `var(${cat.colorToken})` }) }), _jsx(LegendLabel, { children: cat.name })] }, cat.id))), _jsx(LegendSeparator, {}), _jsxs(LegendItem, { type: "button", off: hidden.plan, "aria-pressed": hidden.plan, onClick: () => toggleSeries('plan'), children: [_jsx(LegendMark, { children: _jsx(LineMark, { color: "var(--g600)", type: "ring" }) }), _jsx(LegendLabel, { children: seriesLabels.plan })] }), _jsxs(LegendItem, { type: "button", off: hidden.py, "aria-pressed": hidden.py, onClick: () => toggleSeries('py'), children: [_jsx(LegendMark, { children: mode === 'stack-bar' ? (_jsx(GhostBarMark, { color: "var(--c-violet)" })) : (_jsx(LineMark, { color: "var(--c-violet)", type: "dashed" })) }), _jsx(LegendLabel, { children: seriesLabels.py })] })] })) }), _jsx(FooterSpacer, {})] })] })] }));
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
const WriteoffsTimeseries = React.memo(WriteoffsTimeseriesInner, arePropsEqual);
export default WriteoffsTimeseries;
//# sourceMappingURL=WriteoffsTimeseries.js.map