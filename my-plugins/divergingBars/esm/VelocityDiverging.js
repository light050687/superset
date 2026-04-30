import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { createPortal } from 'react-dom';
import { t } from '@superset-ui/core';
import { KEYFRAMES_CSS, ROOT_CLASS, TooltipRoot, VelocityRoot, } from './styles';
import { DARK_TOKENS, LIGHT_TOKENS } from './themeTokens';
import { computeTempo, tempoDirection } from './utils/computeTempo';
import { fmtByMetric, fmtSignedPct, fmtTempoText, nf0, nf1, nf2, signPrefix, } from './utils/formatRussian';
import DetailModal from './DetailModal';
/* Инжектируем keyframes один раз на весь документ, как в kpiCard. */
const STYLE_ID = 'velocity-diverging-keyframes';
function ensureKeyframes() {
    if (typeof document === 'undefined')
        return;
    if (document.getElementById(STYLE_ID))
        return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = KEYFRAMES_CSS;
    document.head.appendChild(style);
}
function buildPalette(isDarkMode) {
    const T = isDarkMode ? DARK_TOKENS : LIGHT_TOKENS;
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
        return _jsx("svg", { viewBox: `0 0 ${w} ${h}` });
    const min = Math.min(...data) * 0.85;
    const max = Math.max(...data) * 1.1;
    const range = max - min || 1;
    const sx = (i) => (i / (data.length - 1)) * w;
    const sy = (v) => h - padB - ((v - min) / range) * (h - padT - padB);
    const pts = data.map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
    const lastX = sx(data.length - 1);
    const lastY = sy(data[data.length - 1]);
    const gradId = `vd-mini-${Math.abs(hashString(`${color}:${data.join(',')}`))}`;
    return (_jsxs("svg", { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none", "aria-hidden": "true", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: color, stopOpacity: "0.25" }), _jsx("stop", { offset: "100%", stopColor: color, stopOpacity: "0.02" })] }) }), _jsx("polygon", { points: `${pts} ${lastX},${h - padB} 0,${h - padB}`, fill: `url(#${gradId})` }), _jsx("polyline", { points: pts, fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("circle", { cx: lastX, cy: lastY, r: "2", fill: color, stroke: surfaceColor, strokeWidth: "1" })] }));
};
/* ── SVG-иконки для состояний (DS 2.0 §08) ──────────────── */
const IconEmpty = () => (_jsxs("svg", { className: "vd-state-icon", viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("rect", { x: "8", y: "10", width: "32", height: "28", rx: "3" }), _jsx("line", { x1: "8", y1: "18", x2: "40", y2: "18" }), _jsx("line", { x1: "16", y1: "26", x2: "32", y2: "26" }), _jsx("line", { x1: "16", y1: "32", x2: "26", y2: "32" })] }));
const IconError = () => (_jsxs("svg", { className: "vd-state-icon", viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "24", cy: "24", r: "18" }), _jsx("line", { x1: "24", y1: "14", x2: "24", y2: "26" }), _jsx("circle", { cx: "24", cy: "32", r: "1.5", fill: "currentColor" })] }));
const IconWarning = () => (_jsxs("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("path", { d: "M8 1 L15 14 L1 14 Z" }), _jsx("line", { x1: "8", y1: "6", x2: "8", y2: "10" }), _jsx("circle", { cx: "8", cy: "12", r: "0.8", fill: "currentColor" })] }));
/**
 * Главный компонент.
 */
const VelocityDiverging = ({ width, height, headerText, dataState, partialWarning, errorMessage, stores: inputStores, formats: inputFormats, defaultHorizon, defaultMetric, showCumulativeView, showDetailModal, showCsvExport, showSummaryStrip, isDarkMode, }) => {
    const theme = isDarkMode ? 'dark' : 'light';
    const rootRef = useRef(null);
    useEffect(() => {
        ensureKeyframes();
    }, []);
    /** Палитра DS 2.0 — пересчитывается только при смене темы. */
    const palette = useMemo(() => buildPalette(isDarkMode), [isDarkMode]);
    const [metric, setMetric] = useState(defaultMetric);
    const [horizon, setHorizon] = useState(defaultHorizon);
    const [sortBy, setSortBy] = useState('tempo');
    const [sortDir, setSortDir] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [dirFilter, setDirFilter] = useState('all');
    const [formatFilters, setFormatFilters] = useState(new Set());
    const [crossFilter, setCrossFilter] = useState(new Set());
    const [fmtDdOpen, setFmtDdOpen] = useState(false);
    const [tooltip, setTooltip] = useState(null);
    const [detailStoreId, setDetailStoreId] = useState(null);
    /* Доступные горизонты с учётом настройки. */
    const availableHorizons = useMemo(() => {
        const all = ['wow', '4w', 'mom', 'cum'];
        return showCumulativeView ? all : all.filter(h => h !== 'cum');
    }, [showCumulativeView]);
    useEffect(() => {
        if (!availableHorizons.includes(horizon)) {
            setHorizon(availableHorizons[1] ?? availableHorizons[0] ?? '4w');
        }
    }, [availableHorizons, horizon]);
    /* Форматы для dropdown. */
    const formats = useMemo(() => {
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
    const formatCounts = useMemo(() => {
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
    const filteredStores = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        let arr = inputStores.map(s => {
            const tr = computeTempo(s, horizon, metric);
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
            const dir = tempoDirection(x.tempo);
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
    const summary = useMemo(() => {
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
    const barScale = useMemo(() => {
        if (!filteredStores.length)
            return { maxScale: 2.5 };
        const maxTempo = Math.max(...filteredStores.map(x => x.tempo), 2);
        const minTempo = Math.min(...filteredStores.map(x => x.tempo), 0.5);
        const maxScale = Math.max(maxTempo, 1 / Math.max(minTempo, 0.001), 2.5);
        return { maxScale };
    }, [filteredStores]);
    const tempoToPct = useCallback((t0) => {
        const { maxScale } = barScale;
        if (t0 >= 1)
            return 50 + ((t0 - 1) / (maxScale - 1)) * 50;
        return 50 - ((1 - t0) / (1 - 1 / maxScale)) * 50;
    }, [barScale]);
    /* Активная метка периода — зависит от текущего horizon (J2 fix). */
    const activePeriodLabel = useMemo(() => getHorizonPeriodLabel(horizon), [horizon]);
    /* Топ-10 магазинов для кумулятивного вида — вычисляем всегда
       (Rules of Hooks: не внутри условных веток). */
    const cumulativeStores = useMemo(() => {
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
    const resetFilters = useCallback(() => {
        setDirFilter('all');
        setFormatFilters(new Set());
        setSearchQuery('');
    }, []);
    /* Сортировка. */
    const toggleSort = useCallback((key, defaultDir = 'desc') => {
        setSortBy(prev => {
            if (prev === key) {
                setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
                return prev;
            }
            setSortDir(defaultDir);
            return key;
        });
    }, []);
    const toggleRowCross = useCallback((id) => {
        setCrossFilter(prev => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    }, []);
    const toggleFormat = useCallback((id) => {
        setFormatFilters(prev => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    }, []);
    const exportCSV = useCallback(() => {
        const isRub = metric === 'rub';
        const fmtVal = (v) => isRub ? nf0.format(v) : nf2.format(v);
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
            nf2.format(x.tempo),
            nf1.format(x.pctChange),
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
    useEffect(() => {
        const h = (e) => {
            if (e.key === 'Escape') {
                setFmtDdOpen(false);
            }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);
    useEffect(() => {
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
    const showRowTooltip = useCallback((e, store) => {
        const tr = computeTempo(store, horizon, metric);
        const tCls = tr.tempo > 1.05 ? 'dn' : tr.tempo < 0.95 ? 'up' : '';
        const statusColor = tr.tempo > 1.05
            ? palette.dn
            : tr.tempo < 0.95
                ? palette.up
                : palette.g600;
        const fv = (v) => fmtByMetric(v, metric);
        const node = (_jsxs(_Fragment, { children: [_jsxs("div", { className: "tt-head", children: [_jsx("div", { className: "tt-status", style: { background: statusColor } }), _jsxs("div", { className: "tt-titles", children: [_jsx("div", { className: "tt-name", children: store.shortLabel }), _jsxs("div", { className: "tt-sub", children: [store.code, " \u00B7 ", store.city, " \u00B7 ", store.formatName] })] })] }), _jsxs("div", { className: "tt-rows", children: [_jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: t('Было') }), _jsx("span", { className: "tt-v", children: fv(tr.prev) })] }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: t('Стало') }), _jsx("span", { className: "tt-v", children: fv(tr.curr) })] }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: t('Темп') }), _jsx("span", { className: `tt-v ${tCls}`, children: fmtTempoText(tr.tempo) })] }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: t('Изменение') }), _jsx("span", { className: `tt-v ${tCls}`, children: fmtSignedPct(tr.pctChange) })] }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: t('Формат план') }), _jsxs("span", { className: "tt-v", children: [nf2.format(store.plan), "%"] })] }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: t('ТО') }), _jsxs("span", { className: "tt-v", children: [store.to, " ", t('млн ₽')] })] })] })] }));
        setTooltip({
            html: node,
            theme,
            status: statusColor,
            x: e.clientX + 14,
            y: e.clientY + 14,
        });
    }, [horizon, metric, theme, palette]);
    const moveTooltip = useCallback((e) => {
        setTooltip(prev => prev ? { ...prev, x: e.clientX + 14, y: e.clientY + 14 } : prev);
    }, []);
    const hideTooltip = useCallback(() => setTooltip(null), []);
    const handleRowClick = useCallback((e, store) => {
        if (showDetailModal && (e.ctrlKey || e.metaKey)) {
            setDetailStoreId(store.id);
            hideTooltip();
            return;
        }
        toggleRowCross(store.id);
    }, [showDetailModal, toggleRowCross, hideTooltip]);
    const handleRowKey = useCallback((e, store) => {
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
        className: ROOT_CLASS,
        'data-theme': theme,
    };
    /* Error state (DS 2.0 §08: иконка + текст + кнопка «Повторить»). */
    if (dataState === 'error') {
        return (_jsx(VelocityRoot, { ...rootProps, children: _jsx("div", { className: "vd-card", children: _jsxs("div", { className: "vd-state error", role: "alert", "aria-live": "assertive", children: [_jsx(IconError, {}), _jsx("div", { className: "vd-state-message", children: errorMessage || t('Не удалось загрузить данные.') }), _jsx("button", { type: "button", className: "vd-state-action", onClick: () => window.location.reload(), children: t('Повторить') })] }) }) }));
    }
    /* Loading state (DS 2.0 §08: skeleton 0.8s, aria-busy). */
    if (dataState === 'loading') {
        return (_jsx(VelocityRoot, { ...rootProps, children: _jsxs("div", { className: "vd-card", "aria-busy": "true", "aria-live": "polite", children: [_jsx("div", { className: "vd-skeleton", style: { height: 18, width: '40%' } }), _jsx("div", { className: "vd-skeleton", style: { height: 58, width: '100%' } }), _jsx("div", { className: "vd-skeleton", style: { height: 42, width: '100%' } }), _jsx("div", { className: "vd-skeleton", style: { height: 42, width: '100%' } }), _jsx("div", { className: "vd-skeleton", style: { height: 42, width: '100%' } }), _jsx("div", { className: "vd-skeleton", style: { height: 42, width: '100%' } })] }) }));
    }
    /* Empty state (DS 2.0 §08: иконка 48×48 --g300 + текст + предложение). */
    if (dataState === 'empty') {
        return (_jsx(VelocityRoot, { ...rootProps, children: _jsxs("div", { className: "vd-card", children: [_jsx("h2", { className: "vd-title", children: headerText }), _jsxs("div", { className: "vd-state", role: "status", children: [_jsx(IconEmpty, {}), _jsx("div", { className: "vd-state-message", children: t('Нет данных для отображения.') }), _jsx("div", { className: "vd-state-hint", children: t('Попробуйте изменить фильтры или расширить диапазон дат.') })] })] }) }));
    }
    const netCls = summary.netTempo > 1.05 ? 'dn' : summary.netTempo < 0.95 ? 'up' : '';
    const netTempoText = fmtTempoText(summary.netTempo);
    const netPctChange = (summary.netTempo - 1) * 100;
    const netPctText = `${signPrefix(netPctChange)}${nf1.format(Math.abs(netPctChange))}%`;
    return (_jsxs(_Fragment, { children: [_jsx(VelocityRoot, { ...rootProps, role: "region", "aria-label": headerText, children: _jsxs("div", { className: "vd-card", children: [_jsxs("div", { className: "vd-head", children: [_jsxs("div", { className: "vd-title-block", children: [_jsx("h2", { className: "vd-title", children: headerText }), _jsxs("div", { className: "vd-sub", children: [_jsxs("span", { "aria-live": "polite", children: [summary.storesCount, " ", t('из'), " ", inputStores.length, " ", t('магазинов')] }), _jsx("span", { className: "vd-dot", "aria-hidden": "true" }), _jsx("span", { children: activePeriodLabel }), _jsx("span", { className: "vd-dot", "aria-hidden": "true" }), _jsx("span", { children: t('Ранжирование по темпу') })] })] }), _jsxs("div", { className: "vd-controls", children: [_jsx("div", { className: "vd-seg", role: "group", "aria-label": t('Метрика'), children: ['rub', 'pct'].map(m => (_jsx("button", { type: "button", "aria-pressed": metric === m, className: metric === m ? 'on' : undefined, onClick: () => setMetric(m), children: m === 'rub' ? t('₽ Суммы') : t('% к ТО') }, m))) }), _jsx("div", { className: "vd-seg", role: "group", "aria-label": t('Горизонт'), children: ALL_HORIZONS.filter(h => availableHorizons.includes(h.id)).map(h => (_jsx("button", { type: "button", "aria-pressed": horizon === h.id, className: horizon === h.id ? 'on' : undefined, onClick: () => setHorizon(h.id), children: h.label }, h.id))) }), _jsxs("div", { className: "vd-dd-wrap", children: [_jsxs("button", { type: "button", className: "vd-dd-trigger", "aria-haspopup": "true", "aria-expanded": fmtDdOpen, onClick: () => setFmtDdOpen(v => !v), children: [_jsx("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M2 4 L6 8 L10 4" }) }), _jsx("span", { children: t('Форматы') }), formatFilters.size > 0 && (_jsx("span", { className: "vd-count-badge", children: formatFilters.size }))] }), _jsx("div", { className: "vd-dd-menu", "data-open": fmtDdOpen, role: "menu", "aria-label": t('Форматы магазинов'), children: formats.map(f => {
                                                        const on = formatFilters.has(f.id);
                                                        return (_jsxs("button", { type: "button", role: "menuitemcheckbox", "aria-checked": on, className: `vd-dd-item${on ? ' on' : ''}`, onClick: () => toggleFormat(f.id), children: [_jsx("span", { className: "vd-dd-check", "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M2 5 L4 7 L8 3" }) }) }), _jsx("span", { className: "vd-dd-item-dot", style: { background: `var(--${f.color})` } }), _jsx("span", { className: "vd-dd-item-label", children: f.name }), _jsx("span", { className: "vd-dd-item-count", children: formatCounts[f.id] ?? 0 })] }, f.id));
                                                    }) })] }), _jsxs("div", { className: "vd-search", children: [_jsxs("svg", { className: "vd-search-icon", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "6", cy: "6", r: "4" }), _jsx("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), _jsx("input", { type: "text", value: searchQuery, onChange: e => setSearchQuery(e.target.value), placeholder: t('Поиск…'), autoComplete: "off", "aria-label": t('Поиск по магазину, городу или коду') }), _jsx("button", { type: "button", className: "vd-search-clear", hidden: searchQuery.length === 0, "aria-label": t('Очистить поиск'), onClick: () => setSearchQuery(''), children: _jsxs("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [_jsx("line", { x1: "2", y1: "2", x2: "8", y2: "8" }), _jsx("line", { x1: "8", y1: "2", x2: "2", y2: "8" })] }) })] }), showCsvExport && (_jsx("button", { type: "button", className: "vd-export-btn", title: t('Экспорт в CSV'), "aria-label": t('Экспорт в CSV'), onClick: exportCSV, children: _jsx("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M7 1 L7 9 M4 6 L7 9 L10 6 M2 11 L12 11 L12 13 L2 13 Z" }) }) }))] })] }), _jsxs("div", { className: "vd-filter-row", role: "group", "aria-label": t('Фильтр по направлению темпа'), children: [_jsx("span", { className: "vd-filter-label", children: t('Направление') }), DIR_CHIPS.map(c => {
                                    const color = palette[c.colorKey];
                                    // CSS custom property ("--vd-chip-color") — React's CSSProperties
                                    // doesn't model custom props, so build the object via computed key
                                    // and assert through `unknown` to bridge the index-signature gap.
                                    const chipStyle = {
                                        '--vd-chip-color': color,
                                    };
                                    return (_jsxs("button", { type: "button", className: `vd-chip${dirFilter === c.id ? ' on' : ''}`, "aria-pressed": dirFilter === c.id, style: chipStyle, onClick: () => setDirFilter(c.id), children: [_jsx("span", { className: "vd-chip-dot", "aria-hidden": "true" }), c.label] }, c.id));
                                }), _jsx("button", { type: "button", className: "vd-filter-reset", disabled: !hasActiveFilters, onClick: resetFilters, children: t('Сбросить') })] }), dataState === 'stale' && (_jsx("div", { role: "status", "aria-live": "polite", children: _jsxs("span", { className: "vd-stale-badge", children: [_jsxs("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "5", cy: "5", r: "3.5" }), _jsx("path", { d: "M5 3 L5 5 L6.5 6" })] }), t('Данные устарели, обновите страницу')] }) })), dataState === 'partial' && partialWarning && (_jsxs("div", { className: "vd-partial-badge", role: "status", "aria-live": "polite", children: [_jsx(IconWarning, {}), _jsx("span", { children: partialWarning.message })] })), showSummaryStrip && (_jsxs("div", { className: "vd-summary", role: "group", "aria-label": t('Сводка'), children: [_jsxs("div", { className: "vd-sm", children: [_jsx("div", { className: "vd-sm-l", children: t('Текущий период') }), _jsx("div", { className: "vd-sm-v", children: fmtByMetric(summary.totalCurr, metric) }), _jsxs("div", { className: "vd-sm-d", children: [summary.storesCount, " ", t('магазинов')] })] }), _jsxs("div", { className: "vd-sm", children: [_jsx("div", { className: "vd-sm-l", children: t('Прошлый период') }), _jsx("div", { className: "vd-sm-v", children: fmtByMetric(summary.totalPrev, metric) }), _jsx("div", { className: "vd-sm-d", children: t('для сравнения') })] }), _jsxs("div", { className: "vd-sm", children: [_jsx("div", { className: "vd-sm-l", children: t('Темп сети') }), _jsx("div", { className: `vd-sm-v ${netCls}`, children: netTempoText }), _jsx("div", { className: "vd-sm-d", children: netPctText })] }), _jsxs("div", { className: "vd-sm", children: [_jsx("div", { className: "vd-sm-l", children: t('Магазинов ×>1.5') }), _jsxs("div", { className: "vd-sm-v dn", children: [summary.growCount, _jsx("span", { className: "vd-u", children: t('маг.') })] }), _jsx("div", { className: "vd-sm-d", children: t('потери выросли в 1.5+ раз') })] })] })), horizon === 'cum' && showCumulativeView ? (_jsx(CumulativeView, { stores: cumulativeStores, metric: metric, palette: palette })) : (_jsxs("div", { className: "vd-table-wrap", role: "table", "aria-label": t('Таблица магазинов по темпу'), children: [_jsxs("div", { className: "vd-table-head", role: "row", children: [_jsx("div", { className: "vd-th center", role: "columnheader", children: "\u2116" }), _jsxs("button", { type: "button", className: `vd-th sortable${sortBy === 'name' ? ' sorted' : ''}`, role: "columnheader", "aria-sort": sortBy === 'name'
                                                ? sortDir === 'asc'
                                                    ? 'ascending'
                                                    : 'descending'
                                                : 'none', onClick: () => toggleSort('name', 'asc'), children: [t('Магазин'), sortBy === 'name' && _jsx(SortArrow, { dir: sortDir })] }), _jsx("div", { className: "vd-th right", role: "columnheader", children: t('Было') }), _jsx("div", { className: "vd-th center", role: "columnheader", children: t('Изменение (темп)') }), _jsx("div", { className: "vd-th right", role: "columnheader", children: t('Стало') }), _jsxs("button", { type: "button", className: `vd-th right sortable${sortBy === 'tempo' ? ' sorted' : ''}`, role: "columnheader", "aria-sort": sortBy === 'tempo'
                                                ? sortDir === 'asc'
                                                    ? 'ascending'
                                                    : 'descending'
                                                : 'none', onClick: () => toggleSort('tempo', 'desc'), children: [t('Темп'), sortBy === 'tempo' && _jsx(SortArrow, { dir: sortDir })] }), _jsx("div", { className: "vd-th", role: "columnheader", children: t('Тренд 12 нед') })] }), _jsxs("div", { className: "vd-table-body", children: [filteredStores.length === 0 && (_jsxs("div", { className: "vd-state", role: "status", children: [_jsx(IconEmpty, {}), _jsx("div", { className: "vd-state-message", children: t('Ничего не найдено по заданным фильтрам.') })] })), filteredStores.map((x, i) => (_jsx(TableRow, { index: i, x: x, metric: metric, tempoToPct: tempoToPct, palette: palette, isCrossSelected: crossFilter.has(x.store.id), isDimmed: crossFilter.size > 0 && !crossFilter.has(x.store.id), onClick: e => handleRowClick(e, x.store), onDoubleClick: () => {
                                                if (showDetailModal)
                                                    setDetailStoreId(x.store.id);
                                            }, onKeyDown: e => handleRowKey(e, x.store), onMouseEnter: e => showRowTooltip(e, x.store), onMouseMove: moveTooltip, onMouseLeave: hideTooltip, onFocus: e => {
                                                const rect = e.target.getBoundingClientRect();
                                                showRowTooltip({
                                                    clientX: rect.left + 40,
                                                    clientY: rect.top + rect.height / 2,
                                                }, x.store);
                                            }, onBlur: hideTooltip }, x.store.id)))] })] })), _jsxs("div", { className: "vd-footer", children: [_jsxs("div", { className: "vd-hint", children: [_jsxs("div", { className: "vd-legend-item", children: [_jsx("span", { className: "vd-sw", style: { background: palette.dn }, "aria-hidden": "true" }), _jsx("span", { children: t('рост потерь') })] }), _jsxs("div", { className: "vd-legend-item", children: [_jsx("span", { className: "vd-sw", style: { background: palette.up }, "aria-hidden": "true" }), _jsx("span", { children: t('снижение') })] }), _jsxs("div", { className: "vd-hint-item", children: [_jsx("kbd", { children: "Click" }), " \u2014 ", t('кросс-фильтр')] }), showDetailModal && (_jsxs("div", { className: "vd-hint-item", children: [_jsx("kbd", { children: "Ctrl" }), "+", _jsx("kbd", { children: "Click" }), " \u2014 ", t('детализация')] })), _jsxs("div", { className: "vd-hint-item", children: [_jsx("kbd", { children: "Esc" }), " \u2014 ", t('закрыть')] })] }), _jsxs("div", { "aria-live": "polite", children: [t('Показано'), ' ', _jsx("span", { className: "vd-total-right", children: filteredStores.length }), ' ', t('из'), ' ', _jsx("span", { className: "vd-total-right", children: inputStores.length })] })] })] }) }), tooltip && typeof document !== 'undefined' &&
                createPortal(_jsx(TooltipRoot, { "data-theme": tooltip.theme, "data-visible": "true", style: { left: tooltip.x, top: tooltip.y }, children: tooltip.html }), document.body), showDetailModal && detailStoreId && typeof document !== 'undefined' &&
                (() => {
                    const store = inputStores.find(s => s.id === detailStoreId);
                    if (!store)
                        return null;
                    return createPortal(_jsx(DetailModal, { store: store, metric: metric, horizon: horizon, theme: theme, palette: palette, onClose: () => setDetailStoreId(null) }), document.body);
                })()] }));
};
const SortArrow = ({ dir }) => (_jsx("svg", { className: "vd-sort-arrow", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", "aria-hidden": "true", children: dir === 'desc' ? (_jsx("path", { d: "M5 2 L5 8 M2.5 6 L5 8 L7.5 6" })) : (_jsx("path", { d: "M5 8 L5 2 M2.5 4 L5 2 L7.5 4" })) }));
const TableRow = ({ index, x, metric, tempoToPct, palette, isCrossSelected, isDimmed, onClick, onDoubleClick, onKeyDown, onMouseEnter, onMouseMove, onMouseLeave, onFocus, onBlur, }) => {
    const { store, prev, curr, tempo, pctChange } = x;
    const dir = tempoDirection(tempo);
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
    const fv = (v) => fmtByMetric(v, metric);
    const rowCls = ['vd-row'];
    if (isCrossSelected)
        rowCls.push('selected');
    if (isDimmed)
        rowCls.push('dimmed');
    return (_jsxs("div", { role: "row", tabIndex: 0, className: rowCls.join(' '), onClick: onClick, onDoubleClick: onDoubleClick, onKeyDown: onKeyDown, onMouseEnter: onMouseEnter, onMouseMove: onMouseMove, onMouseLeave: onMouseLeave, onFocus: onFocus, onBlur: onBlur, "aria-selected": isCrossSelected, children: [_jsx("div", { className: "vd-rank-cell", role: "cell", children: index + 1 }), _jsxs("div", { className: "vd-store-cell", role: "cell", children: [_jsxs("div", { className: "vd-store-name", children: [_jsx("span", { className: "vd-code", children: store.code }), store.shortLabel] }), _jsxs("div", { className: "vd-store-meta", children: [store.city, " \u00B7 ", store.formatName] })] }), _jsxs("div", { className: "vd-period-cell", role: "cell", children: [fv(prev), _jsx("span", { className: "vd-sub-text", children: t('пред.') })] }), _jsx("div", { role: "cell", style: { position: 'relative' }, children: _jsxs("div", { className: "vd-bar-wrap", children: [_jsxs("div", { className: "vd-bar-bg", children: [_jsx("div", { className: "vd-bar-bg-left" }), _jsx("div", { className: "vd-bar-bg-right" })] }), _jsx("div", { className: "vd-bar-center" }), _jsx("div", { className: "vd-bar-fill", style: {
                                left: `${barLeft}%`,
                                width: `${barWidth}%`,
                                background: barColor,
                                opacity: barOpacity,
                            } })] }) }), _jsxs("div", { className: "vd-period-cell", role: "cell", children: [fv(curr), _jsx("span", { className: "vd-sub-text", children: t('текущ.') })] }), _jsxs("div", { className: "vd-tempo-cell", role: "cell", children: [_jsx("span", { className: `vd-tempo-main ${tCls}`, children: fmtTempoText(tempo) }), _jsx("span", { className: `vd-tempo-pct ${tCls}`, children: fmtSignedPct(pctChange) })] }), _jsx("div", { className: "vd-spark-cell", role: "cell", children: _jsx(MiniSpark, { data: weeks, color: sparkColor, surfaceColor: palette.s }) })] }));
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
    return (_jsxs("div", { className: "vd-cum-wrap visible", children: [_jsxs("div", { className: "vd-cum-title", children: [_jsx("span", { children: t('Кумулятивные потери с начала периода') }), _jsx("span", { className: "vd-right", children: stores.length
                            ? `${t('Топ')}-${stores.length} ${t('магазинов')}`
                            : '' })] }), _jsx("div", { className: "vd-cum-chart", children: _jsxs("svg", { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "xMidYMid meet", width: "100%", height: h, role: "img", "aria-label": t('Кумулятивные потери по топ-10 магазинам'), children: [_jsx("line", { x1: padL, y1: h - padB, x2: w - padR, y2: h - padB, stroke: palette.g200, strokeWidth: "1" }), _jsx("line", { x1: padL, y1: padT, x2: padL, y2: h - padB, stroke: palette.g200, strokeWidth: "1" }), [0, 2, 4, 6, 8, 10].map(i => (_jsxs("text", { x: sx(i), y: h - 10, fontFamily: palette.fontMono, fontSize: "11", fill: palette.g600, textAnchor: "middle", children: ["\u041D", i + 1] }, i))), cumData.map((cum, si) => {
                            const color = lineColors[si % lineColors.length];
                            const pts = cum
                                .map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`)
                                .join(' ');
                            const lx = sx(11);
                            const ly = sy(cum[cum.length - 1]);
                            const rawLabel = stores[si]?.name ?? '';
                            const label = rawLabel.length > 12 ? `${rawLabel.slice(0, 11)}…` : rawLabel;
                            return (_jsxs("g", { children: [_jsx("polyline", { points: pts, fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("circle", { cx: lx, cy: ly, r: "3", fill: color, stroke: palette.s, strokeWidth: "1.5" }), _jsx("text", { x: lx + 8, y: ly + 4, fontFamily: palette.fontMono, fontSize: "11", fontWeight: "600", fill: color, children: label })] }, stores[si]?.id ?? si));
                        })] }) })] }));
};
export default VelocityDiverging;
//# sourceMappingURL=VelocityDiverging.js.map