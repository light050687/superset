"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const core_1 = require("@superset-ui/core");
const styles_1 = require("./styles");
const InfoHint_1 = require("./components/InfoHint");
const themeTokens_1 = require("./themeTokens");
const computeTempo_1 = require("./utils/computeTempo");
const formatRussian_1 = require("./utils/formatRussian");
const DetailModal_1 = __importDefault(require("./DetailModal"));
/* Инжектируем keyframes один раз на весь документ, как в kpiCard. */
const STYLE_ID = 'velocity-diverging-keyframes';
function ensureKeyframes() {
    if (typeof document === 'undefined')
        return;
    if (document.getElementById(STYLE_ID))
        return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = styles_1.KEYFRAMES_CSS;
    document.head.appendChild(style);
}
function buildPalette(isDarkMode) {
    const T = isDarkMode ? themeTokens_1.DARK_TOKENS : themeTokens_1.LIGHT_TOKENS;
    return {
        up: T.up,
        dn: T.dn,
        wn: T.wn,
        g50: T.g50,
        g200: T.g200,
        g300: T.g300,
        g400: T.g400,
        g500: T.g500,
        g600: T.g600,
        g700: T.g700,
        s: T.s,
        cSky: T.cSky,
        cViolet: T.cViolet,
        cTangerine: T.cTangerine,
        cFuchsia: T.cFuchsia,
        cAmber: T.cAmber,
        fontText: "'Manrope', system-ui, sans-serif",
        fontMono: "'JetBrains Mono', monospace",
    };
}
const DIR_CHIPS = [
    { id: 'all', label: 'Все', colorKey: 'g400' },
    { id: 'grow', label: 'Рост', colorKey: 'dn' },
    { id: 'shrink', label: 'Снижение', colorKey: 'up' },
    { id: 'flat', label: 'Стабильные', colorKey: 'g500' },
];
const ALL_HORIZONS = [
    { id: 'wow', label: 'WoW' },
    { id: '4w', label: '4W vs 4W' },
    { id: 'mom', label: 'MoM' },
    { id: 'cum', label: 'Кумулят.' },
];
/** Возвращает читаемую метку периода для заданного горизонта. */
function getHorizonPeriodLabel(horizon) {
    switch (horizon) {
        case 'wow':
            return 'WoW · последняя неделя';
        case '4w':
            return '4W vs 4W · текущий месяц';
        case 'mom':
            return 'MoM · месяц vs месяц';
        case 'cum':
        default:
            return 'Кумулятивно · текущий период';
    }
}
function hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i += 1)
        h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
}
/**
 * Мини-спарклайн 12 недель — чистый SVG, использует прямые цвета из palette
 * (не читает CSS-переменные при рендере).
 */
const MiniSpark = ({ data, color, surfaceColor }) => {
    const w = 120;
    const h = 30;
    const padT = 3;
    const padB = 3;
    if (!data.length)
        return (0, jsx_runtime_1.jsx)("svg", { viewBox: `0 0 ${w} ${h}` });
    const min = Math.min(...data) * 0.85;
    const max = Math.max(...data) * 1.1;
    const range = max - min || 1;
    const sx = (i) => (i / (data.length - 1)) * w;
    const sy = (v) => h - padB - ((v - min) / range) * (h - padT - padB);
    const pts = data.map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
    const lastX = sx(data.length - 1);
    const lastY = sy(data[data.length - 1]);
    const gradId = `vd-mini-${Math.abs(hashString(`${color}:${data.join(',')}`))}`;
    return ((0, jsx_runtime_1.jsxs)("svg", { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsxs)("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "0%", stopColor: color, stopOpacity: "0.25" }), (0, jsx_runtime_1.jsx)("stop", { offset: "100%", stopColor: color, stopOpacity: "0.02" })] }) }), (0, jsx_runtime_1.jsx)("polygon", { points: `${pts} ${lastX},${h - padB} 0,${h - padB}`, fill: `url(#${gradId})` }), (0, jsx_runtime_1.jsx)("polyline", { points: pts, fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), (0, jsx_runtime_1.jsx)("circle", { cx: lastX, cy: lastY, r: "2", fill: color, stroke: surfaceColor, strokeWidth: "1" })] }));
};
/* ── SVG-иконки для состояний (DS 2.0 §08) ──────────────── */
const IconEmpty = () => ((0, jsx_runtime_1.jsxs)("svg", { className: "vd-state-icon", viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("rect", { x: "8", y: "10", width: "32", height: "28", rx: "3" }), (0, jsx_runtime_1.jsx)("line", { x1: "8", y1: "18", x2: "40", y2: "18" }), (0, jsx_runtime_1.jsx)("line", { x1: "16", y1: "26", x2: "32", y2: "26" }), (0, jsx_runtime_1.jsx)("line", { x1: "16", y1: "32", x2: "26", y2: "32" })] }));
const IconError = () => ((0, jsx_runtime_1.jsxs)("svg", { className: "vd-state-icon", viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "24", cy: "24", r: "18" }), (0, jsx_runtime_1.jsx)("line", { x1: "24", y1: "14", x2: "24", y2: "26" }), (0, jsx_runtime_1.jsx)("circle", { cx: "24", cy: "32", r: "1.5", fill: "currentColor" })] }));
const IconWarning = () => ((0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("path", { d: "M8 1 L15 14 L1 14 Z" }), (0, jsx_runtime_1.jsx)("line", { x1: "8", y1: "6", x2: "8", y2: "10" }), (0, jsx_runtime_1.jsx)("circle", { cx: "8", cy: "12", r: "0.8", fill: "currentColor" })] }));
/**
 * Главный компонент.
 */
const VelocityDiverging = ({ width, height, headerText, subtitleText, dataState, partialWarning, errorMessage, stores: inputStores, formats: inputFormats, defaultHorizon, defaultMetric, showCumulativeView, showDetailModal, showCsvExport, showSummaryStrip, isDarkMode, mockModeEnabled, }) => {
    const theme = isDarkMode ? 'dark' : 'light';
    const rootRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        ensureKeyframes();
    }, []);
    /** Палитра DS 2.0 — пересчитывается только при смене темы. */
    const palette = (0, react_1.useMemo)(() => buildPalette(isDarkMode), [isDarkMode]);
    const [metric, setMetric] = (0, react_1.useState)(defaultMetric);
    const [horizon, setHorizon] = (0, react_1.useState)(defaultHorizon);
    const [sortBy, setSortBy] = (0, react_1.useState)('tempo');
    const [sortDir, setSortDir] = (0, react_1.useState)('desc');
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [dirFilter, setDirFilter] = (0, react_1.useState)('all');
    const [formatFilters, setFormatFilters] = (0, react_1.useState)(new Set());
    const [crossFilter, setCrossFilter] = (0, react_1.useState)(new Set());
    const [fmtDdOpen, setFmtDdOpen] = (0, react_1.useState)(false);
    const [tooltip, setTooltip] = (0, react_1.useState)(null);
    const [detailStoreId, setDetailStoreId] = (0, react_1.useState)(null);
    /* Доступные горизонты с учётом настройки. */
    const availableHorizons = (0, react_1.useMemo)(() => {
        const all = ['wow', '4w', 'mom', 'cum'];
        return showCumulativeView ? all : all.filter(h => h !== 'cum');
    }, [showCumulativeView]);
    (0, react_1.useEffect)(() => {
        if (!availableHorizons.includes(horizon)) {
            setHorizon(availableHorizons[1] ?? availableHorizons[0] ?? '4w');
        }
    }, [availableHorizons, horizon]);
    /* Форматы для dropdown. */
    const formats = (0, react_1.useMemo)(() => {
        if (inputFormats && inputFormats.length)
            return inputFormats;
        const uniq = new Map();
        inputStores.forEach(s => {
            if (!uniq.has(s.format)) {
                uniq.set(s.format, {
                    id: s.format,
                    name: s.formatName || s.format,
                    color: 'c-sky',
                });
            }
        });
        return Array.from(uniq.values());
    }, [inputFormats, inputStores]);
    const formatCounts = (0, react_1.useMemo)(() => {
        const counts = {};
        formats.forEach(f => {
            counts[f.id] = 0;
        });
        inputStores.forEach(s => {
            counts[s.format] = (counts[s.format] ?? 0) + 1;
        });
        return counts;
    }, [formats, inputStores]);
    /* Фильтры + сортировка. */
    const filteredStores = (0, react_1.useMemo)(() => {
        const q = searchQuery.trim().toLowerCase();
        let arr = inputStores.map(s => {
            const tr = (0, computeTempo_1.computeTempo)(s, horizon, metric);
            return { store: s, ...tr };
        });
        arr = arr.filter(x => {
            const s = x.store;
            if (formatFilters.size > 0 && !formatFilters.has(s.format))
                return false;
            if (q &&
                !(s.name.toLowerCase().includes(q) ||
                    s.city.toLowerCase().includes(q) ||
                    s.code.toLowerCase().includes(q)))
                return false;
            const dir = (0, computeTempo_1.tempoDirection)(x.tempo);
            if (dirFilter === 'grow' && dir !== 'grow')
                return false;
            if (dirFilter === 'shrink' && dir !== 'shrink')
                return false;
            if (dirFilter === 'flat' && dir !== 'flat')
                return false;
            return true;
        });
        arr.sort((a, b) => {
            const mul = sortDir === 'asc' ? 1 : -1;
            if (sortBy === 'name')
                return mul * a.store.name.localeCompare(b.store.name, 'ru');
            if (sortBy === 'absDelta')
                return mul * (a.absDelta - b.absDelta);
            return mul * (a.tempo - b.tempo);
        });
        return arr;
    }, [inputStores, horizon, metric, searchQuery, formatFilters, dirFilter, sortBy, sortDir]);
    const summary = (0, react_1.useMemo)(() => {
        const totalPrev = filteredStores.reduce((s, x) => s + x.prev, 0);
        const totalCurr = filteredStores.reduce((s, x) => s + x.curr, 0);
        const netTempo = totalPrev > 0 ? totalCurr / totalPrev : 1;
        const growCount = filteredStores.filter(x => x.tempo > 1.5).length;
        return {
            totalPrev,
            totalCurr,
            netTempo,
            growCount,
            storesCount: filteredStores.length,
        };
    }, [filteredStores]);
    const barScale = (0, react_1.useMemo)(() => {
        if (!filteredStores.length)
            return { maxScale: 2.5 };
        const maxTempo = Math.max(...filteredStores.map(x => x.tempo), 2);
        const minTempo = Math.min(...filteredStores.map(x => x.tempo), 0.5);
        const maxScale = Math.max(maxTempo, 1 / Math.max(minTempo, 0.001), 2.5);
        return { maxScale };
    }, [filteredStores]);
    const tempoToPct = (0, react_1.useCallback)((t0) => {
        const { maxScale } = barScale;
        if (t0 >= 1)
            return 50 + ((t0 - 1) / (maxScale - 1)) * 50;
        return 50 - ((1 - t0) / (1 - 1 / maxScale)) * 50;
    }, [barScale]);
    /* Активная метка периода — зависит от текущего horizon (J2 fix). */
    const activePeriodLabel = (0, react_1.useMemo)(() => getHorizonPeriodLabel(horizon), [horizon]);
    /* Топ-10 магазинов для кумулятивного вида — вычисляем всегда
       (Rules of Hooks: не внутри условных веток). */
    const cumulativeStores = (0, react_1.useMemo)(() => {
        if (!showCumulativeView || horizon !== 'cum')
            return [];
        return filteredStores
            .slice()
            .sort((a, b) => b.tempo - a.tempo)
            .slice(0, 10)
            .map(x => x.store);
    }, [filteredStores, horizon, showCumulativeView]);
    /* Сброс фильтров. */
    const hasActiveFilters = dirFilter !== 'all' || formatFilters.size > 0 || searchQuery.length > 0;
    const resetFilters = (0, react_1.useCallback)(() => {
        setDirFilter('all');
        setFormatFilters(new Set());
        setSearchQuery('');
    }, []);
    /* Сортировка. */
    const toggleSort = (0, react_1.useCallback)((key, defaultDir = 'desc') => {
        setSortBy(prev => {
            if (prev === key) {
                setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
                return prev;
            }
            setSortDir(defaultDir);
            return key;
        });
    }, []);
    const toggleRowCross = (0, react_1.useCallback)((id) => {
        setCrossFilter(prev => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    }, []);
    const toggleFormat = (0, react_1.useCallback)((id) => {
        setFormatFilters(prev => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    }, []);
    const exportCSV = (0, react_1.useCallback)(() => {
        const isRub = metric === 'rub';
        const fmtVal = (v) => isRub ? formatRussian_1.nf0.format(v) : formatRussian_1.nf2.format(v);
        const headers = [
            '№',
            'Код',
            'Магазин',
            'Город',
            'Формат',
            'Было',
            'Стало',
            'Темп (×)',
            'Изменение %',
            'Абс. разница',
        ];
        const rows = filteredStores.map((x, i) => [
            i + 1,
            x.store.code,
            x.store.name,
            x.store.city,
            x.store.formatName,
            fmtVal(x.prev),
            fmtVal(x.curr),
            formatRussian_1.nf2.format(x.tempo),
            formatRussian_1.nf1.format(x.pctChange),
            fmtVal(x.absDelta),
        ]);
        const esc = (v) => {
            const str = String(v);
            return /[";\n,]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        };
        const csv = [headers, ...rows].map(r => r.map(esc).join(';')).join('\r\n');
        const blob = new Blob([`\uFEFF${csv}`], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const d = new Date();
        const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = `samberi-скорость-потерь-${ymd}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [filteredStores, metric]);
    /* Escape — закрывает dropdown. */
    (0, react_1.useEffect)(() => {
        const h = (e) => {
            if (e.key === 'Escape') {
                setFmtDdOpen(false);
            }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);
    (0, react_1.useEffect)(() => {
        if (!fmtDdOpen)
            return undefined;
        const h = (e) => {
            const target = e.target;
            if (!target)
                return;
            if (!target.closest('.vd-dd-wrap'))
                setFmtDdOpen(false);
        };
        document.addEventListener('click', h);
        return () => document.removeEventListener('click', h);
    }, [fmtDdOpen]);
    /* Tooltip для ряда. */
    const showRowTooltip = (0, react_1.useCallback)((e, store) => {
        const tr = (0, computeTempo_1.computeTempo)(store, horizon, metric);
        const tCls = tr.tempo > 1.05 ? 'dn' : tr.tempo < 0.95 ? 'up' : '';
        const statusColor = tr.tempo > 1.05
            ? palette.dn
            : tr.tempo < 0.95
                ? palette.up
                : palette.g600;
        const fv = (v) => (0, formatRussian_1.fmtByMetric)(v, metric);
        const node = ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "tt-head", children: [(0, jsx_runtime_1.jsx)("div", { className: "tt-status", style: { background: statusColor } }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-titles", children: [(0, jsx_runtime_1.jsx)("div", { className: "tt-name", children: store.shortLabel }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-sub", children: [store.code, " \u00B7 ", store.city, " \u00B7 ", store.formatName] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-rows", children: [(0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: (0, core_1.t)('Было') }), (0, jsx_runtime_1.jsx)("span", { className: "tt-v", children: fv(tr.prev) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: (0, core_1.t)('Стало') }), (0, jsx_runtime_1.jsx)("span", { className: "tt-v", children: fv(tr.curr) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: (0, core_1.t)('Темп') }), (0, jsx_runtime_1.jsx)("span", { className: `tt-v ${tCls}`, children: (0, formatRussian_1.fmtTempoText)(tr.tempo) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: (0, core_1.t)('Изменение') }), (0, jsx_runtime_1.jsx)("span", { className: `tt-v ${tCls}`, children: (0, formatRussian_1.fmtSignedPct)(tr.pctChange) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: (0, core_1.t)('Формат план') }), (0, jsx_runtime_1.jsxs)("span", { className: "tt-v", children: [formatRussian_1.nf2.format(store.plan), "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: (0, core_1.t)('ТО') }), (0, jsx_runtime_1.jsxs)("span", { className: "tt-v", children: [store.to, " ", (0, core_1.t)('млн ₽')] })] })] })] }));
        setTooltip({
            html: node,
            theme,
            status: statusColor,
            x: e.clientX + 14,
            y: e.clientY + 14,
        });
    }, [horizon, metric, theme, palette]);
    const moveTooltip = (0, react_1.useCallback)((e) => {
        setTooltip(prev => prev ? { ...prev, x: e.clientX + 14, y: e.clientY + 14 } : prev);
    }, []);
    const hideTooltip = (0, react_1.useCallback)(() => setTooltip(null), []);
    const handleRowClick = (0, react_1.useCallback)((e, store) => {
        if (showDetailModal && (e.ctrlKey || e.metaKey)) {
            setDetailStoreId(store.id);
            hideTooltip();
            return;
        }
        toggleRowCross(store.id);
    }, [showDetailModal, toggleRowCross, hideTooltip]);
    const handleRowKey = (0, react_1.useCallback)((e, store) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if ((e.ctrlKey || e.metaKey) && showDetailModal) {
                setDetailStoreId(store.id);
            }
            else {
                toggleRowCross(store.id);
            }
        }
    }, [showDetailModal, toggleRowCross]);
    /* ── Render state-helpers ───────────────────────────── */
    const rootProps = {
        ref: rootRef,
        width,
        height,
        className: styles_1.ROOT_CLASS,
        'data-theme': theme,
    };
    /* Error state (DS 2.0 §08: иконка + текст + кнопка «Повторить»). */
    if (dataState === 'error') {
        return ((0, jsx_runtime_1.jsx)(styles_1.VelocityRoot, { ...rootProps, children: (0, jsx_runtime_1.jsx)("div", { className: "vd-card", "data-info-hint-container": "", "data-no-anim": "", children: (0, jsx_runtime_1.jsxs)("div", { className: "vd-state error", role: "alert", "aria-live": "assertive", children: [(0, jsx_runtime_1.jsx)(IconError, {}), (0, jsx_runtime_1.jsx)("div", { className: "vd-state-message", children: errorMessage || (0, core_1.t)('Не удалось загрузить данные.') }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "vd-state-action", onClick: () => window.location.reload(), children: (0, core_1.t)('Повторить') })] }) }) }));
    }
    /* Loading state (DS 2.0 §08: skeleton 0.8s, aria-busy). */
    if (dataState === 'loading') {
        return ((0, jsx_runtime_1.jsx)(styles_1.VelocityRoot, { ...rootProps, children: (0, jsx_runtime_1.jsxs)("div", { className: "vd-card", "data-info-hint-container": "", "data-no-anim": "", "aria-busy": "true", "aria-live": "polite", children: [(0, jsx_runtime_1.jsx)(styles_1.SkeletonBlock, { variant: "title" }), (0, jsx_runtime_1.jsx)(styles_1.SkeletonBlock, { variant: "header" }), (0, jsx_runtime_1.jsx)(styles_1.SkeletonBlock, { variant: "row" }), (0, jsx_runtime_1.jsx)(styles_1.SkeletonBlock, { variant: "row" }), (0, jsx_runtime_1.jsx)(styles_1.SkeletonBlock, { variant: "row" }), (0, jsx_runtime_1.jsx)(styles_1.SkeletonBlock, { variant: "row" })] }) }));
    }
    /* Empty state (DS 2.0 §08: иконка 48×48 --g300 + текст + предложение). */
    if (dataState === 'empty') {
        return ((0, jsx_runtime_1.jsx)(styles_1.VelocityRoot, { ...rootProps, children: (0, jsx_runtime_1.jsxs)("div", { className: "vd-card", "data-info-hint-container": "", "data-no-anim": "", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "vd-title", children: [headerText, mockModeEnabled && (0, jsx_runtime_1.jsx)("span", { className: "vd-mock-badge", children: "\u0422\u0415\u0421\u0422" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-state", role: "status", children: [(0, jsx_runtime_1.jsx)(IconEmpty, {}), (0, jsx_runtime_1.jsx)("div", { className: "vd-state-message", children: (0, core_1.t)('Нет данных для отображения.') }), (0, jsx_runtime_1.jsx)("div", { className: "vd-state-hint", children: (0, core_1.t)('Попробуйте изменить фильтры или расширить диапазон дат.') })] })] }) }));
    }
    const netCls = summary.netTempo > 1.05 ? 'dn' : summary.netTempo < 0.95 ? 'up' : '';
    const netTempoText = (0, formatRussian_1.fmtTempoText)(summary.netTempo);
    const netPctChange = (summary.netTempo - 1) * 100;
    const netPctText = `${(0, formatRussian_1.signPrefix)(netPctChange)}${formatRussian_1.nf1.format(Math.abs(netPctChange))}%`;
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(styles_1.VelocityRoot, { ...rootProps, role: "region", "aria-label": headerText, children: (0, jsx_runtime_1.jsxs)("div", { className: "vd-card", "data-info-hint-container": "", children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-head", children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-title-block", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "vd-title", children: [headerText, mockModeEnabled && (0, jsx_runtime_1.jsx)("span", { className: "vd-mock-badge", children: "\u0422\u0415\u0421\u0422" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-sub", children: [subtitleText && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { children: subtitleText }), (0, jsx_runtime_1.jsx)("span", { className: "vd-dot", "aria-hidden": "true" })] })), (0, jsx_runtime_1.jsxs)("span", { "aria-live": "polite", children: [summary.storesCount, " ", (0, core_1.t)('из'), " ", inputStores.length, " ", (0, core_1.t)('магазинов')] }), (0, jsx_runtime_1.jsx)("span", { className: "vd-dot", "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { children: activePeriodLabel }), (0, jsx_runtime_1.jsx)("span", { className: "vd-dot", "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { children: (0, core_1.t)('Ранжирование по темпу') })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-controls", children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-seg", role: "group", "aria-label": (0, core_1.t)('Метрика'), children: ['rub', 'pct'].map(m => ((0, jsx_runtime_1.jsx)("button", { type: "button", "aria-pressed": metric === m, className: metric === m ? 'on' : undefined, onClick: () => setMetric(m), children: m === 'rub' ? (0, core_1.t)('₽ Суммы') : (0, core_1.t)('% к ТО') }, m))) }), (0, jsx_runtime_1.jsx)("div", { className: "vd-seg", role: "group", "aria-label": (0, core_1.t)('Горизонт'), children: ALL_HORIZONS.filter(h => availableHorizons.includes(h.id)).map(h => ((0, jsx_runtime_1.jsx)("button", { type: "button", "aria-pressed": horizon === h.id, className: horizon === h.id ? 'on' : undefined, onClick: () => setHorizon(h.id), children: h.label }, h.id))) }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-dd-wrap", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", className: "vd-dd-trigger", "aria-haspopup": "true", "aria-expanded": fmtDdOpen, onClick: () => setFmtDdOpen(v => !v), children: [(0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M2 4 L6 8 L10 4" }) }), (0, jsx_runtime_1.jsx)("span", { children: (0, core_1.t)('Форматы') }), formatFilters.size > 0 && ((0, jsx_runtime_1.jsx)("span", { className: "vd-count-badge", children: formatFilters.size }))] }), (0, jsx_runtime_1.jsx)("div", { className: "vd-dd-menu", "data-open": fmtDdOpen, role: "menu", "aria-label": (0, core_1.t)('Форматы магазинов'), children: formats.map(f => {
                                                        const on = formatFilters.has(f.id);
                                                        return ((0, jsx_runtime_1.jsxs)("button", { type: "button", role: "menuitemcheckbox", "aria-checked": on, className: `vd-dd-item${on ? ' on' : ''}`, onClick: () => toggleFormat(f.id), children: [(0, jsx_runtime_1.jsx)("span", { className: "vd-dd-check", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: (0, jsx_runtime_1.jsx)("path", { d: "M2 5 L4 7 L8 3" }) }) }), (0, jsx_runtime_1.jsx)("span", { className: "vd-dd-item-dot", style: { background: `var(--${f.color})` } }), (0, jsx_runtime_1.jsx)("span", { className: "vd-dd-item-label", children: f.name }), (0, jsx_runtime_1.jsx)("span", { className: "vd-dd-item-count", children: formatCounts[f.id] ?? 0 })] }, f.id));
                                                    }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-search", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "vd-search-icon", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "6", cy: "6", r: "4" }), (0, jsx_runtime_1.jsx)("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: searchQuery, onChange: e => setSearchQuery(e.target.value), placeholder: (0, core_1.t)('Поиск…'), autoComplete: "off", "aria-label": (0, core_1.t)('Поиск по магазину, городу или коду') }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "vd-search-clear", hidden: searchQuery.length === 0, "aria-label": (0, core_1.t)('Очистить поиск'), onClick: () => setSearchQuery(''), children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "8", y2: "8" }), (0, jsx_runtime_1.jsx)("line", { x1: "8", y1: "2", x2: "2", y2: "8" })] }) })] }), showCsvExport && ((0, jsx_runtime_1.jsx)("button", { type: "button", className: "vd-export-btn", title: (0, core_1.t)('Экспорт в CSV'), "aria-label": (0, core_1.t)('Экспорт в CSV'), onClick: exportCSV, children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M7 1 L7 9 M4 6 L7 9 L10 6 M2 11 L12 11 L12 13 L2 13 Z" }) }) })), (0, jsx_runtime_1.jsx)(InfoHint_1.InfoHintTopRight, { children: (0, jsx_runtime_1.jsxs)(InfoHint_1.InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [(0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Click" }), " \u2014 \u043A\u0440\u043E\u0441\u0441-\u0444\u0438\u043B\u044C\u0442\u0440"] }), showDetailModal && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Ctrl" }), "+", (0, jsx_runtime_1.jsx)("kbd", { children: "Click" }), " \u2014 \u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F"] })] })), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Esc" }), " \u2014 \u0437\u0430\u043A\u0440\u044B\u0442\u044C"] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Right Click" }), " \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"] })] }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-filter-row", role: "group", "aria-label": (0, core_1.t)('Фильтр по направлению темпа'), children: [(0, jsx_runtime_1.jsx)("span", { className: "vd-filter-label", children: (0, core_1.t)('Направление') }), DIR_CHIPS.map(c => {
                                    const color = palette[c.colorKey];
                                    // CSS custom property ("--vd-chip-color") — React's CSSProperties
                                    // doesn't model custom props, so build the object via computed key
                                    // and assert through `unknown` to bridge the index-signature gap.
                                    const chipStyle = {
                                        '--vd-chip-color': color,
                                    };
                                    return ((0, jsx_runtime_1.jsxs)("button", { type: "button", className: `vd-chip${dirFilter === c.id ? ' on' : ''}`, "aria-pressed": dirFilter === c.id, style: chipStyle, onClick: () => setDirFilter(c.id), children: [(0, jsx_runtime_1.jsx)("span", { className: "vd-chip-dot", "aria-hidden": "true" }), c.label] }, c.id));
                                }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "vd-filter-reset", disabled: !hasActiveFilters, onClick: resetFilters, children: (0, core_1.t)('Сбросить') })] }), dataState === 'stale' && ((0, jsx_runtime_1.jsx)("div", { role: "status", "aria-live": "polite", children: (0, jsx_runtime_1.jsxs)("span", { className: "vd-stale-badge", children: [(0, jsx_runtime_1.jsxs)("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "5", cy: "5", r: "3.5" }), (0, jsx_runtime_1.jsx)("path", { d: "M5 3 L5 5 L6.5 6" })] }), (0, core_1.t)('Данные устарели, обновите страницу')] }) })), dataState === 'partial' && partialWarning && ((0, jsx_runtime_1.jsxs)("div", { className: "vd-partial-badge", role: "status", "aria-live": "polite", children: [(0, jsx_runtime_1.jsx)(IconWarning, {}), (0, jsx_runtime_1.jsx)("span", { children: partialWarning.message })] })), showSummaryStrip && ((0, jsx_runtime_1.jsxs)("div", { className: "vd-summary", role: "group", "aria-label": (0, core_1.t)('Сводка'), children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-sm-l", children: (0, core_1.t)('Текущий период') }), (0, jsx_runtime_1.jsx)("div", { className: "vd-sm-v", children: (0, formatRussian_1.fmtByMetric)(summary.totalCurr, metric) }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-sm-d", children: [summary.storesCount, " ", (0, core_1.t)('магазинов')] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-sm-l", children: (0, core_1.t)('Прошлый период') }), (0, jsx_runtime_1.jsx)("div", { className: "vd-sm-v", children: (0, formatRussian_1.fmtByMetric)(summary.totalPrev, metric) }), (0, jsx_runtime_1.jsx)("div", { className: "vd-sm-d", children: (0, core_1.t)('для сравнения') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-sm-l", children: (0, core_1.t)('Темп сети') }), (0, jsx_runtime_1.jsx)("div", { className: `vd-sm-v ${netCls}`, children: netTempoText }), (0, jsx_runtime_1.jsx)("div", { className: "vd-sm-d", children: netPctText })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-sm-l", children: (0, core_1.t)('Магазинов ×>1.5') }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-sm-v dn", children: [summary.growCount, (0, jsx_runtime_1.jsx)("span", { className: "vd-u", children: (0, core_1.t)('маг.') })] }), (0, jsx_runtime_1.jsx)("div", { className: "vd-sm-d", children: (0, core_1.t)('потери выросли в 1.5+ раз') })] })] })), horizon === 'cum' && showCumulativeView ? ((0, jsx_runtime_1.jsx)(CumulativeView, { stores: cumulativeStores, metric: metric, palette: palette })) : ((0, jsx_runtime_1.jsxs)("div", { className: "vd-table-wrap", role: "table", "aria-label": (0, core_1.t)('Таблица магазинов по темпу'), children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-table-head", role: "row", children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-th center", role: "columnheader", children: "\u2116" }), (0, jsx_runtime_1.jsxs)("button", { type: "button", className: `vd-th sortable${sortBy === 'name' ? ' sorted' : ''}`, role: "columnheader", "aria-sort": sortBy === 'name'
                                                ? sortDir === 'asc'
                                                    ? 'ascending'
                                                    : 'descending'
                                                : 'none', onClick: () => toggleSort('name', 'asc'), children: [(0, core_1.t)('Магазин'), sortBy === 'name' && (0, jsx_runtime_1.jsx)(SortArrow, { dir: sortDir })] }), (0, jsx_runtime_1.jsx)("div", { className: "vd-th right", role: "columnheader", children: (0, core_1.t)('Было') }), (0, jsx_runtime_1.jsx)("div", { className: "vd-th center", role: "columnheader", children: (0, core_1.t)('Изменение (темп)') }), (0, jsx_runtime_1.jsx)("div", { className: "vd-th right", role: "columnheader", children: (0, core_1.t)('Стало') }), (0, jsx_runtime_1.jsxs)("button", { type: "button", className: `vd-th right sortable${sortBy === 'tempo' ? ' sorted' : ''}`, role: "columnheader", "aria-sort": sortBy === 'tempo'
                                                ? sortDir === 'asc'
                                                    ? 'ascending'
                                                    : 'descending'
                                                : 'none', onClick: () => toggleSort('tempo', 'desc'), children: [(0, core_1.t)('Темп'), sortBy === 'tempo' && (0, jsx_runtime_1.jsx)(SortArrow, { dir: sortDir })] }), (0, jsx_runtime_1.jsx)("div", { className: "vd-th", role: "columnheader", children: (0, core_1.t)('Тренд 12 нед') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-table-body", children: [filteredStores.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "vd-state", role: "status", children: [(0, jsx_runtime_1.jsx)(IconEmpty, {}), (0, jsx_runtime_1.jsx)("div", { className: "vd-state-message", children: (0, core_1.t)('Ничего не найдено по заданным фильтрам.') })] })), filteredStores.map((x, i) => ((0, jsx_runtime_1.jsx)(TableRow, { index: i, x: x, metric: metric, tempoToPct: tempoToPct, palette: palette, isCrossSelected: crossFilter.has(x.store.id), isDimmed: crossFilter.size > 0 && !crossFilter.has(x.store.id), onClick: e => handleRowClick(e, x.store), onDoubleClick: () => {
                                                if (showDetailModal)
                                                    setDetailStoreId(x.store.id);
                                            }, onKeyDown: e => handleRowKey(e, x.store), onMouseEnter: e => showRowTooltip(e, x.store), onMouseMove: moveTooltip, onMouseLeave: hideTooltip, onFocus: e => {
                                                const rect = e.target.getBoundingClientRect();
                                                showRowTooltip({
                                                    clientX: rect.left + 40,
                                                    clientY: rect.top + rect.height / 2,
                                                }, x.store);
                                            }, onBlur: hideTooltip }, x.store.id)))] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "vd-footer", children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-hint", children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-legend-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "vd-sw", style: { background: palette.dn }, "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { children: (0, core_1.t)('рост потерь') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-legend-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "vd-sw", style: { background: palette.up }, "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { children: (0, core_1.t)('снижение') })] })] }), (0, jsx_runtime_1.jsxs)("div", { "aria-live": "polite", children: [(0, core_1.t)('Показано'), ' ', (0, jsx_runtime_1.jsx)("span", { className: "vd-total-right", children: filteredStores.length }), ' ', (0, core_1.t)('из'), ' ', (0, jsx_runtime_1.jsx)("span", { className: "vd-total-right", children: inputStores.length })] })] })] }) }), tooltip && typeof document !== 'undefined' &&
                (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)(styles_1.TooltipRoot, { "data-theme": tooltip.theme, "data-visible": "true", style: { left: tooltip.x, top: tooltip.y }, children: tooltip.html }), document.body), showDetailModal && detailStoreId && typeof document !== 'undefined' &&
                (() => {
                    const store = inputStores.find(s => s.id === detailStoreId);
                    if (!store)
                        return null;
                    return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)(DetailModal_1.default, { store: store, metric: metric, horizon: horizon, theme: theme, palette: palette, onClose: () => setDetailStoreId(null) }), document.body);
                })()] }));
};
const SortArrow = ({ dir }) => ((0, jsx_runtime_1.jsx)("svg", { className: "vd-sort-arrow", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", "aria-hidden": "true", children: dir === 'desc' ? ((0, jsx_runtime_1.jsx)("path", { d: "M5 2 L5 8 M2.5 6 L5 8 L7.5 6" })) : ((0, jsx_runtime_1.jsx)("path", { d: "M5 8 L5 2 M2.5 4 L5 2 L7.5 4" })) }));
const TableRow = ({ index, x, metric, tempoToPct, palette, isCrossSelected, isDimmed, onClick, onDoubleClick, onKeyDown, onMouseEnter, onMouseMove, onMouseLeave, onFocus, onBlur, }) => {
    const { store, prev, curr, tempo, pctChange } = x;
    const dir = (0, computeTempo_1.tempoDirection)(tempo);
    const barColor = dir === 'grow' ? palette.dn : dir === 'shrink' ? palette.up : palette.g400;
    const sparkColor = tempo > 1.1 ? palette.dn : tempo < 0.9 ? palette.up : palette.g600;
    const tCls = dir === 'grow' ? 'dn' : dir === 'shrink' ? 'up' : 'wn';
    const barPct = tempoToPct(tempo);
    let barLeft;
    let barWidth;
    if (tempo >= 1) {
        barLeft = 50;
        barWidth = barPct - 50;
    }
    else {
        barLeft = barPct;
        barWidth = 50 - barPct;
    }
    const barOpacity = Math.min(1, 0.4 + Math.abs(tempo - 1) * 0.7);
    const weeks = metric === 'rub' ? store.weeksRub : store.weeksPct;
    const fv = (v) => (0, formatRussian_1.fmtByMetric)(v, metric);
    const rowCls = ['vd-row'];
    if (isCrossSelected)
        rowCls.push('selected');
    if (isDimmed)
        rowCls.push('dimmed');
    return ((0, jsx_runtime_1.jsxs)("div", { role: "row", tabIndex: 0, className: rowCls.join(' '), onClick: onClick, onDoubleClick: onDoubleClick, onKeyDown: onKeyDown, onMouseEnter: onMouseEnter, onMouseMove: onMouseMove, onMouseLeave: onMouseLeave, onFocus: onFocus, onBlur: onBlur, "aria-selected": isCrossSelected, children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-rank-cell", role: "cell", children: index + 1 }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-store-cell", role: "cell", children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-store-name", children: [(0, jsx_runtime_1.jsx)("span", { className: "vd-code", children: store.code }), store.shortLabel] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-store-meta", children: [store.city, " \u00B7 ", store.formatName] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-period-cell", role: "cell", children: [fv(prev), (0, jsx_runtime_1.jsx)("span", { className: "vd-sub-text", children: (0, core_1.t)('пред.') })] }), (0, jsx_runtime_1.jsx)(styles_1.BarCell, { role: "cell", children: (0, jsx_runtime_1.jsxs)("div", { className: "vd-bar-wrap", children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-bar-bg", children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-bar-bg-left" }), (0, jsx_runtime_1.jsx)("div", { className: "vd-bar-bg-right" })] }), (0, jsx_runtime_1.jsx)("div", { className: "vd-bar-center" }), (0, jsx_runtime_1.jsx)("div", { className: "vd-bar-fill", style: {
                                left: `${barLeft}%`,
                                width: `${barWidth}%`,
                                background: barColor,
                                opacity: barOpacity,
                            } })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-period-cell", role: "cell", children: [fv(curr), (0, jsx_runtime_1.jsx)("span", { className: "vd-sub-text", children: (0, core_1.t)('текущ.') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-tempo-cell", role: "cell", children: [(0, jsx_runtime_1.jsx)("span", { className: `vd-tempo-main ${tCls}`, children: (0, formatRussian_1.fmtTempoText)(tempo) }), (0, jsx_runtime_1.jsx)("span", { className: `vd-tempo-pct ${tCls}`, children: (0, formatRussian_1.fmtSignedPct)(pctChange) })] }), (0, jsx_runtime_1.jsx)("div", { className: "vd-spark-cell", role: "cell", children: (0, jsx_runtime_1.jsx)(MiniSpark, { data: weeks, color: sparkColor, surfaceColor: palette.s }) })] }));
};
const CumulativeView = ({ stores, metric, palette }) => {
    const w = 900;
    const h = 220;
    const padL = 60;
    const padR = 20;
    const padT = 18;
    const padB = 28;
    const lineColors = [
        palette.dn,
        palette.cTangerine,
        palette.cAmber,
        palette.cFuchsia,
        palette.cSky,
        palette.cViolet,
        palette.g600,
        palette.up,
        palette.cFuchsia,
        palette.cViolet,
    ];
    const cumData = stores.map(s => {
        const weeks = metric === 'rub' ? s.weeksRub : s.weeksPct;
        let sum = 0;
        return weeks.map(v => {
            sum += v;
            return sum;
        });
    });
    const allMax = Math.max(1, ...cumData.flat()) * 1.05;
    const sx = (i) => padL + (i / 11) * (w - padL - padR);
    const sy = (v) => h - padB - (v / allMax) * (h - padT - padB);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "vd-cum-wrap visible", children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-cum-title", children: [(0, jsx_runtime_1.jsx)("span", { children: (0, core_1.t)('Кумулятивные потери с начала периода') }), (0, jsx_runtime_1.jsx)("span", { className: "vd-right", children: stores.length
                            ? `${(0, core_1.t)('Топ')}-${stores.length} ${(0, core_1.t)('магазинов')}`
                            : '' })] }), (0, jsx_runtime_1.jsx)("div", { className: "vd-cum-chart", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "xMidYMid meet", width: "100%", height: h, role: "img", "aria-label": (0, core_1.t)('Кумулятивные потери по топ-10 магазинам'), children: [(0, jsx_runtime_1.jsx)("line", { x1: padL, y1: h - padB, x2: w - padR, y2: h - padB, stroke: palette.g200, strokeWidth: "1" }), (0, jsx_runtime_1.jsx)("line", { x1: padL, y1: padT, x2: padL, y2: h - padB, stroke: palette.g200, strokeWidth: "1" }), [0, 2, 4, 6, 8, 10].map(i => ((0, jsx_runtime_1.jsxs)("text", { x: sx(i), y: h - 10, fontFamily: palette.fontMono, fontSize: "11", fill: palette.g600, textAnchor: "middle", children: ["\u041D", i + 1] }, i))), cumData.map((cum, si) => {
                            const color = lineColors[si % lineColors.length];
                            const pts = cum
                                .map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`)
                                .join(' ');
                            const lx = sx(11);
                            const ly = sy(cum[cum.length - 1]);
                            const rawLabel = stores[si]?.name ?? '';
                            const label = rawLabel.length > 12 ? `${rawLabel.slice(0, 11)}…` : rawLabel;
                            return ((0, jsx_runtime_1.jsxs)("g", { children: [(0, jsx_runtime_1.jsx)("polyline", { points: pts, fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), (0, jsx_runtime_1.jsx)("circle", { cx: lx, cy: ly, r: "3", fill: color, stroke: palette.s, strokeWidth: "1.5" }), (0, jsx_runtime_1.jsx)("text", { x: lx + 8, y: ly + 4, fontFamily: palette.fontMono, fontSize: "11", fontWeight: "600", fill: color, children: label })] }, stores[si]?.id ?? si));
                        })] }) })] }));
};
exports.default = VelocityDiverging;
//# sourceMappingURL=VelocityDiverging.js.map