import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { createPortal } from 'react-dom';
import { SupersetClient, t } from '@superset-ui/core';
// @ts-ignore — subpath resolves в runtime через Superset webpack aliases.
// Подмена на 'antd' ломает runtime потому что antd не зарегистрирован как dep плагина.
// @ts-ignore — antd доступен через peerDep `@superset-ui/core` в Superset frontend.
import { DatePicker as _AntdDP } from 'antd';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RangePicker = _AntdDP?.RangePicker;
// @ts-ignore — dayjs не зарегистрирован как deps плагина, но доступен в bundle
// через Superset (peerDep antd). Используется здесь только для конвертации
// строк ISO → Dayjs объекты для RangePicker'а.
import dayjs from 'dayjs';
// @ts-ignore — русский локаль для dayjs (использует RangePicker).
import 'dayjs/locale/ru';
dayjs.locale('ru');
// @ts-ignore — antd ruRU locale доступен через peerDep antd в Superset.
import ruRU from 'antd/locale/ru_RU';
import { BarCell, InlineSpinnerLarge, KEYFRAMES_CSS, PageBtn, PageEllipsis, PageInput, PaginationWrap, RefreshBar, ROOT_CLASS, SkeletonBlock, TooltipRoot, VelocityRoot, } from './styles';
import { InfoHint, InfoHintTopRight } from './components/InfoHint';
import { DARK_TOKENS, LIGHT_TOKENS } from './themeTokens';
import { computeTempo, tempoDirection } from './utils/computeTempo';
/* RangePicker — отдельный named export из того же subpath. */
import { fmtByMetric, fmtSignedPct, fmtTempoText, nf0, nf1, nf2, signPrefix, } from './utils/formatRussian';
import { buildStoresCountPayload, buildStoresPayload, extractApiCompRows, extractApiRows, } from './utils/detailApi';
import { rowsToStores } from './utils/rowsToStores';
import { formatRangeDateRu, rangeDurationDays, resolveComparisonRange, resolveTimeRangeAsync, } from './utils/resolveRange';
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
        g100: T.g100,
        g200: T.g200,
        g300: T.g300,
        g400: T.g400,
        g500: T.g500,
        g600: T.g600,
        g700: T.g700,
        s: T.s,
        ink: T.ink,
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
/** Опции для dropdown «Сравнить с» — порядок имеет значение для UI. */
const COMPARISON_OPTIONS = [
    { id: 'prev_period', label: 'Предыдущий период', short: 'Пред. период' },
    { id: 'prev_week', label: 'Прошлая неделя', short: 'Прош. неделя' },
    { id: 'prev_month', label: 'Прошлый месяц', short: 'Прош. месяц' },
    { id: 'prev_quarter', label: 'Прошлый квартал', short: 'Прош. квартал' },
    { id: 'prev_year', label: 'Прошлый год', short: 'Прош. год' },
    { id: 'custom', label: 'Выбрать вручную', short: 'Вручную' },
];
/** Возвращает читаемую метку периода для текущего comparison-режима. */
function getComparisonPeriodLabel(mode) {
    const opt = COMPARISON_OPTIONS.find(o => o.id === mode);
    return opt ? `Сравнение · ${opt.label.toLowerCase()}` : 'Сравнение периодов';
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
const VelocityDiverging = ({ width, height, headerText, subtitleText, dataState, partialWarning, errorMessage, stores: inputStores, formats: inputFormats, defaultComparisonMode, customCurrentRange, customPreviousRange, defaultMetric, showCumulativeView, showDetailModal, showCsvExport, showSummaryStrip, isDarkMode, mockModeEnabled, pageSize, queryParams, }) => {
    const theme = isDarkMode ? 'dark' : 'light';
    const rootRef = useRef(null);
    useEffect(() => {
        ensureKeyframes();
    }, []);
    /** Палитра DS 2.0 — пересчитывается только при смене темы. */
    const palette = useMemo(() => buildPalette(isDarkMode), [isDarkMode]);
    const [metric, setMetric] = useState(defaultMetric);
    /* Default ВСЕГДА = prev_period. Переключается на 'custom' при manual override. */
    const [comparisonMode, setComparisonMode] = useState('prev_period');
    /* Locally applied custom-диапазоны (после нажатия «Применить» в панели).
       При comparisonMode = 'custom' они идут в payload как customCurrent/Previous.
       В остальных режимах их наличие == manual override (mode переключится
       в 'custom' при Apply). */
    const [customRange, setCustomRange] = useState({
        current: customCurrentRange,
        previous: customPreviousRange,
    });
    /* Manual-override panel: pending draft + open state. Применяется в
       customRange ТОЛЬКО при нажатии «Применить». При «Отмена» — игнор. */
    const [panelOpen, setPanelOpen] = useState(false);
    const [pendingCurrent, setPendingCurrent] = useState(undefined);
    const [pendingPrevious, setPendingPrevious] = useState(undefined);
    const [cmpDdOpen, setCmpDdOpen] = useState(false);
    const [sortBy, setSortBy] = useState('tempo');
    const [sortDir, setSortDir] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [dirFilter, setDirFilter] = useState('all');
    const [formatFilters, setFormatFilters] = useState(new Set());
    const [crossFilter, setCrossFilter] = useState(new Set());
    const [fmtDdOpen, setFmtDdOpen] = useState(false);
    /* Direction-filter dropdown: badge-trigger в .vd-controls вместо
       старого filter-row с 4 chips. Outside-click и Escape ниже в effects. */
    const [dirDdOpen, setDirDdOpen] = useState(false);
    /* Trigger ref + computed position для portal menu. VelocityRoot имеет
       overflow:auto + container-type:inline-size — absolute menu обрезается.
       Portal в body + position:fixed решает. */
    const dirTriggerRef = useRef(null);
    const [dirMenuPos, setDirMenuPos] = useState({ top: 0, right: 0 });
    useEffect(() => {
        if (!dirDdOpen)
            return undefined;
        const update = () => {
            const r = dirTriggerRef.current?.getBoundingClientRect();
            if (!r)
                return;
            setDirMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
        };
        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [dirDdOpen]);
    const [tooltip, setTooltip] = useState(null);
    const [detailStoreId, setDetailStoreId] = useState(null);
    /* ── Серверная пагинация (mockOff). При mockOn все 400 магазинов уже в
       inputStores, пагинация локальная. ── */
    const [currentPage, setCurrentPage] = useState(0);
    const [serverStores, setServerStores] = useState(inputStores);
    const [serverHasNext, setServerHasNext] = useState(false);
    const [serverTotalCount, setServerTotalCount] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const fetchAbortRef = useRef(null);
    const countAbortRef = useRef(null);
    const hasEverLoaded = useRef(false);
    /* ── Resolved дата-диапазоны для UI-подсказки «Текущий: dd.MM – dd.MM
       vs dd.MM – dd.MM». Резолвим текущий через fetchTimeRange (или
       синхронно если уже ISO), а comparison — локально через dayjs. ── */
    const [resolvedCurrent, setResolvedCurrent] = useState(null);
    const [isResolvingCurrent, setIsResolvingCurrent] = useState(false);
    const resolveAbortRef = useRef(null);
    /* Debounce поиска для серверной пагинации. */
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);
    /* Сброс currentPage при изменении выборки (вне sort/search — те уже сами
       сбрасывают). comparisonMode/metric — затрагивают tempo → ранжирование меняется,
       pageSize — окно. */
    useEffect(() => {
        setCurrentPage(0);
    }, [comparisonMode, metric, pageSize, dirFilter]);
    /* Отдельный useState-cumulative для показа дополнительного блока «Топ-10
       накопленных потерь». Не привязан к comparison-mode (раньше cum было одним
       из 4 горизонтов). По умолчанию выключен — пользователь включает кнопкой. */
    const [showCumulativeBlock, setShowCumulativeBlock] = useState(false);
    useEffect(() => {
        if (!showCumulativeView)
            setShowCumulativeBlock(false);
    }, [showCumulativeView]);
    /* formatFilters: тот же сброс, но Set нужно сериализовать. */
    const formatFiltersKey = useMemo(() => Array.from(formatFilters).sort().join('|'), [formatFilters]);
    useEffect(() => {
        setCurrentPage(0);
    }, [formatFiltersKey]);
    /* ── Server-side pagination fetch (только когда real data + есть queryParams).
       При mock — пользуемся inputStores в локальной пагинации (см. ниже). ── */
    const isServerPagingActive = !mockModeEnabled && Boolean(queryParams);
    /* formatsMap нужен для rowsToStores на стороне клиента. */
    const formatsMapServer = useMemo(() => {
        const m = new Map();
        inputFormats?.forEach(f => m.set(f.id, f));
        return m;
    }, [inputFormats]);
    useEffect(() => {
        if (!isServerPagingActive || !queryParams)
            return undefined;
        if (dataState === 'error' || dataState === 'loading' || dataState === 'empty') {
            return undefined;
        }
        // Abort prev
        fetchAbortRef.current?.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;
        if (!hasEverLoaded.current) {
            setIsInitialLoading(true);
        }
        else {
            setIsRefreshing(true);
        }
        setFetchError(null);
        const payload = buildStoresPayload({
            queryParams,
            page: currentPage,
            pageSize,
            sortBy,
            sortAsc: sortDir === 'asc',
            searchQuery: debouncedSearch,
            comparisonMode,
            customCurrentRange: customRange.current,
            customPreviousRange: customRange.previous,
        });
        SupersetClient.post({
            endpoint: 'api/v1/chart/data',
            jsonPayload: payload,
            signal: controller.signal,
        })
            .then(({ json }) => {
            const rows = extractApiRows(json);
            const compRows = comparisonMode === 'custom' ? extractApiCompRows(json) : undefined;
            const parsed = rowsToStores(rows, { ...queryParams, comparisonMode }, formatsMapServer, compRows);
            // Page-cursor: pageSize+1 уникальных. Если больше → hasNext.
            const hasNext = parsed.length > pageSize;
            const displayed = hasNext ? parsed.slice(0, pageSize) : parsed;
            setServerStores(displayed);
            setServerHasNext(hasNext);
            hasEverLoaded.current = true;
            setIsInitialLoading(false);
            setIsRefreshing(false);
        })
            .catch((err) => {
            if (err.name !== 'AbortError') {
                setFetchError(err.message || 'Ошибка загрузки данных');
                setIsInitialLoading(false);
                setIsRefreshing(false);
            }
        });
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isServerPagingActive,
        currentPage,
        pageSize,
        sortBy,
        sortDir,
        debouncedSearch,
        queryParams?.datasourceId,
        comparisonMode,
        customRange.current?.[0],
        customRange.current?.[1],
        customRange.previous?.[0],
        customRange.previous?.[1],
    ]);
    /* Total-count fetch (один раз на изменение поиска). */
    useEffect(() => {
        if (!isServerPagingActive || !queryParams)
            return undefined;
        countAbortRef.current?.abort();
        const controller = new AbortController();
        countAbortRef.current = controller;
        const payload = buildStoresCountPayload({
            queryParams,
            searchQuery: debouncedSearch,
        });
        SupersetClient.post({
            endpoint: 'api/v1/chart/data',
            jsonPayload: payload,
            signal: controller.signal,
        })
            .then(({ json }) => {
            const rows = extractApiRows(json);
            setServerTotalCount(rows.length);
        })
            .catch((err) => {
            if (err.name !== 'AbortError') {
                setServerTotalCount(null);
            }
        });
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isServerPagingActive, debouncedSearch, queryParams?.datasourceId]);
    /* ── Резолв текущего периода для отображения «Текущий: dd.MM.YYYY – dd.MM.YYYY».
       Если comparisonMode = 'custom' с заданным customRange.current — используем его.
       Иначе — берём queryParams.timeRange и резолвим через Superset API
       (для preset-строк типа 'Last 7 days'). ── */
    useEffect(() => {
        resolveAbortRef.current?.abort();
        const controller = new AbortController();
        resolveAbortRef.current = controller;
        // Приоритет 1: custom-current задан (mode=custom или manual override) —
        // используем его как есть, без API запроса.
        if (comparisonMode === 'custom' &&
            customRange.current &&
            customRange.current[0] &&
            customRange.current[1]) {
            setResolvedCurrent({
                start: customRange.current[0],
                end: customRange.current[1],
            });
            setIsResolvingCurrent(false);
            return undefined;
        }
        // Приоритет 2: queryParams.timeRange (real-data path).
        const tr = queryParams?.timeRange;
        if (!tr) {
            setResolvedCurrent(null);
            setIsResolvingCurrent(false);
            return undefined;
        }
        setIsResolvingCurrent(true);
        resolveTimeRangeAsync(tr, controller.signal).then(range => {
            if (controller.signal.aborted)
                return;
            setResolvedCurrent(range);
            setIsResolvingCurrent(false);
        });
        return () => controller.abort();
    }, [
        queryParams?.timeRange,
        comparisonMode,
        customRange.current?.[0],
        customRange.current?.[1],
    ]);
    /* Resolved comparison-range — вычисляем локально из resolvedCurrent. */
    const resolvedPrevious = useMemo(() => {
        if (!resolvedCurrent)
            return null;
        const customPrev = customRange.previous &&
            customRange.previous[0] &&
            customRange.previous[1]
            ? { start: customRange.previous[0], end: customRange.previous[1] }
            : undefined;
        return resolveComparisonRange(resolvedCurrent.start, resolvedCurrent.end, comparisonMode, customPrev);
    }, [
        resolvedCurrent,
        comparisonMode,
        customRange.previous?.[0],
        customRange.previous?.[1],
    ]);
    /* ── Manual override active? — иконка-замок рядом с resolved-датами.
       Override считается активным когда mode='custom' и у пользователя
       заданы кастомные диапазоны. ── */
    const isManualOverride = comparisonMode === 'custom' &&
        Boolean(customRange.current) &&
        Boolean(customRange.previous);
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
    /* Активный набор магазинов: либо server-paged (real data), либо
       полный inputStores (mock-режим). */
    const activeStores = isServerPagingActive ? serverStores : inputStores;
    /* Фильтры + сортировка. Применяются к activeStores. В server-mode фильтры
       dir / format и поиск выполняют локальную пост-фильтрацию (на 1 странице)
       — это компромисс ради простоты; при включении dir-filter / format-filter
       в server-mode пользователь увидит "меньше pageSize" если эти фильтры
       активны. Searching уходит на сервер через debouncedSearch. */
    const filteredStores = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        let arr = activeStores.map(s => {
            const prev = metric === 'rub' ? s.prevValueRub : s.prevValuePct;
            const curr = metric === 'rub' ? s.currValueRub : s.currValuePct;
            const tr = computeTempo(prev, curr);
            return { store: s, ...tr };
        });
        arr = arr.filter(x => {
            const s = x.store;
            if (formatFilters.size > 0 && !formatFilters.has(s.format))
                return false;
            // В server-mode фильтр по тексту делает сервер (через debouncedSearch),
            // локально игнорим чтобы не вычитать с current page больше.
            if (!isServerPagingActive &&
                q &&
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
    }, [
        activeStores,
        metric,
        searchQuery,
        formatFilters,
        dirFilter,
        sortBy,
        sortDir,
        isServerPagingActive,
    ]);
    /* Локальная пагинация для mock-mode или fallback (server-mode уже разделил
       данные на странице). */
    const totalLocalPages = useMemo(() => {
        if (isServerPagingActive)
            return 0; // не используется в server-mode
        return Math.max(1, Math.ceil(filteredStores.length / pageSize));
    }, [isServerPagingActive, filteredStores.length, pageSize]);
    const pagedStores = useMemo(() => {
        if (isServerPagingActive) {
            // server-mode: serverStores уже = текущая страница, filteredStores
            // фильтрует/сортирует её локально.
            return filteredStores;
        }
        const start = currentPage * pageSize;
        return filteredStores.slice(start, start + pageSize);
    }, [isServerPagingActive, filteredStores, currentPage, pageSize]);
    /* Если currentPage стал out-of-bounds (например фильтры сократили N) —
       откатываем на 0 (только локально). */
    useEffect(() => {
        if (isServerPagingActive)
            return;
        if (currentPage >= totalLocalPages)
            setCurrentPage(0);
    }, [currentPage, totalLocalPages, isServerPagingActive]);
    /* Суммарные данные — в mock-mode по всему filteredStores (всем магазинам),
       в server-mode по current page (filteredStores уже = одна страница). */
    const summary = useMemo(() => {
        const totalPrev = filteredStores.reduce((s, x) => s + x.prev, 0);
        const totalCurr = filteredStores.reduce((s, x) => s + x.curr, 0);
        const netTempo = totalPrev > 0 ? totalCurr / totalPrev : 1;
        const growCount = filteredStores.filter(x => x.tempo > 1.5).length;
        // В server-mode showcount предпочитаем серверное (если знаем)
        const storesCount = isServerPagingActive
            ? serverTotalCount ?? filteredStores.length
            : filteredStores.length;
        return {
            totalPrev,
            totalCurr,
            netTempo,
            growCount,
            storesCount,
        };
    }, [filteredStores, isServerPagingActive, serverTotalCount]);
    /* barScale рассчитываем по pagedStores: масштаб бара меняется по странице,
       зрительно проще читать «рост N1 = 3× против N2». */
    const barScale = useMemo(() => {
        if (!pagedStores.length)
            return { maxScale: 2.5 };
        const maxTempo = Math.max(...pagedStores.map(x => x.tempo), 2);
        const minTempo = Math.min(...pagedStores.map(x => x.tempo), 0.5);
        const maxScale = Math.max(maxTempo, 1 / Math.max(minTempo, 0.001), 2.5);
        return { maxScale };
    }, [pagedStores]);
    const tempoToPct = useCallback((t0) => {
        const { maxScale } = barScale;
        if (t0 >= 1)
            return 50 + ((t0 - 1) / (maxScale - 1)) * 50;
        return 50 - ((1 - t0) / (1 - 1 / maxScale)) * 50;
    }, [barScale]);
    /* Активная метка периода — зависит от текущего comparison-режима. */
    const activePeriodLabel = useMemo(() => getComparisonPeriodLabel(comparisonMode), [comparisonMode]);
    /* Топ-10 магазинов для кумулятивного вида — вычисляем всегда
       (Rules of Hooks: не внутри условных веток). Cumulative — отдельный
       режим показа (toggle), независимый от comparisonMode. */
    const cumulativeStores = useMemo(() => {
        if (!showCumulativeView || !showCumulativeBlock)
            return [];
        return filteredStores
            .slice()
            .sort((a, b) => b.tempo - a.tempo)
            .slice(0, 10)
            .map(x => x.store);
    }, [filteredStores, showCumulativeView, showCumulativeBlock]);
    /* Сброс фильтров. */
    const hasActiveFilters = dirFilter !== 'all' || formatFilters.size > 0 || searchQuery.length > 0;
    const resetFilters = useCallback(() => {
        setDirFilter('all');
        setFormatFilters(new Set());
        setSearchQuery('');
        setCurrentPage(0);
    }, []);
    /* Сортировка. Любая смена sort → сбрасываем currentPage. */
    const toggleSort = useCallback((key, defaultDir = 'desc') => {
        setSortBy(prev => {
            if (prev === key) {
                setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
                return prev;
            }
            setSortDir(defaultDir);
            return key;
        });
        setCurrentPage(0);
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
    /* ── Управление range-panel («Изменить даты»). Pending state — draft;
       применяется только при «Применить». Открытие из любого режима
       инициализирует pending от текущих resolved-дат. ── */
    const openRangePanel = useCallback(() => {
        // Pre-fill pending значениями текущих resolved-периодов
        // (если уже есть customRange — берём его как стартовую точку).
        const cur = customRange.current ??
            (resolvedCurrent
                ? [resolvedCurrent.start, resolvedCurrent.end]
                : undefined);
        const prev = customRange.previous ??
            (resolvedPrevious
                ? [resolvedPrevious.start, resolvedPrevious.end]
                : undefined);
        setPendingCurrent(cur);
        setPendingPrevious(prev);
        setPanelOpen(true);
    }, [customRange, resolvedCurrent, resolvedPrevious]);
    const closeRangePanel = useCallback(() => {
        setPanelOpen(false);
        setPendingCurrent(undefined);
        setPendingPrevious(undefined);
    }, []);
    const applyRangePanel = useCallback(() => {
        // Сохраняем pending → customRange; mode → 'custom'.
        setCustomRange({ current: pendingCurrent, previous: pendingPrevious });
        setComparisonMode('custom');
        setPanelOpen(false);
        setCurrentPage(0);
    }, [pendingCurrent, pendingPrevious]);
    const resetRangePanel = useCallback(() => {
        // Сбрасываем custom-override → возврат к prev_period (auto).
        setCustomRange({ current: undefined, previous: undefined });
        setComparisonMode('prev_period');
        setPanelOpen(false);
        setPendingCurrent(undefined);
        setPendingPrevious(undefined);
        setCurrentPage(0);
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
                setDirDdOpen(false);
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
    /* Outside-click для direction-dropdown. Используем отдельный класс
       `.vd-dir-dd-wrap` чтобы клик внутри другого `.vd-dd-wrap` (форматы)
       не закрывал его молча. */
    useEffect(() => {
        if (!dirDdOpen)
            return undefined;
        const h = (e) => {
            const target = e.target;
            if (!target)
                return;
            if (!target.closest('.vd-dir-dd-wrap'))
                setDirDdOpen(false);
        };
        document.addEventListener('click', h);
        return () => document.removeEventListener('click', h);
    }, [dirDdOpen]);
    /* Escape closes range-panel (но не если открыт AntD календарь). */
    useEffect(() => {
        const h = (e) => {
            if (e.key === 'Escape') {
                if (panelOpen) {
                    // Не закрываем если AntD календарь открыт — он сам ловит Escape.
                    const calOpen = document.querySelector('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
                    if (!calOpen)
                        closeRangePanel();
                }
            }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [panelOpen, closeRangePanel]);
    /* Tooltip для ряда. */
    const showRowTooltip = useCallback((e, store) => {
        const prev = metric === 'rub' ? store.prevValueRub : store.prevValuePct;
        const curr = metric === 'rub' ? store.currValueRub : store.currValuePct;
        const tr = computeTempo(prev, curr);
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
    }, [metric, theme, palette]);
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
        return (_jsx(VelocityRoot, { ...rootProps, children: _jsx("div", { className: "vd-card", "data-info-hint-container": "", "data-no-anim": "", children: _jsxs("div", { className: "vd-state error", role: "alert", "aria-live": "assertive", children: [_jsx(IconError, {}), _jsx("div", { className: "vd-state-message", children: errorMessage || t('Не удалось загрузить данные.') }), _jsx("button", { type: "button", className: "vd-state-action", onClick: () => window.location.reload(), children: t('Повторить') })] }) }) }));
    }
    /* Loading state (DS 2.0 §08: skeleton 0.8s, aria-busy). */
    if (dataState === 'loading') {
        return (_jsx(VelocityRoot, { ...rootProps, children: _jsxs("div", { className: "vd-card", "data-info-hint-container": "", "data-no-anim": "", "aria-busy": "true", "aria-live": "polite", children: [_jsx(SkeletonBlock, { variant: "title" }), _jsx(SkeletonBlock, { variant: "header" }), _jsx(SkeletonBlock, { variant: "row" }), _jsx(SkeletonBlock, { variant: "row" }), _jsx(SkeletonBlock, { variant: "row" }), _jsx(SkeletonBlock, { variant: "row" })] }) }));
    }
    /* Empty state (DS 2.0 §08: иконка 48×48 --g300 + текст + предложение). */
    if (dataState === 'empty') {
        return (_jsx(VelocityRoot, { ...rootProps, children: _jsxs("div", { className: "vd-card", "data-info-hint-container": "", "data-no-anim": "", children: [_jsxs("h2", { className: "vd-title", children: [headerText, mockModeEnabled && _jsx("span", { className: "vd-mock-badge", children: "\u0422\u0415\u0421\u0422" })] }), _jsxs("div", { className: "vd-state", role: "status", children: [_jsx(IconEmpty, {}), _jsx("div", { className: "vd-state-message", children: t('Нет данных для отображения.') }), _jsx("div", { className: "vd-state-hint", children: t('Попробуйте изменить фильтры или расширить диапазон дат.') })] })] }) }));
    }
    const netCls = summary.netTempo > 1.05 ? 'dn' : summary.netTempo < 0.95 ? 'up' : '';
    const netTempoText = fmtTempoText(summary.netTempo);
    const netPctChange = (summary.netTempo - 1) * 100;
    const netPctText = `${signPrefix(netPctChange)}${nf1.format(Math.abs(netPctChange))}%`;
    return (_jsxs(_Fragment, { children: [_jsx(VelocityRoot, { ...rootProps, role: "region", "aria-label": headerText, children: _jsxs("div", { className: "vd-card", "data-info-hint-container": "", children: [_jsxs("div", { className: "vd-head", children: [_jsxs("div", { className: "vd-title-block", children: [_jsxs("h2", { className: "vd-title", children: [headerText, mockModeEnabled && _jsx("span", { className: "vd-mock-badge", children: "\u0422\u0415\u0421\u0422" })] }), _jsxs("div", { className: "vd-sub", children: [subtitleText && (_jsxs(_Fragment, { children: [_jsx("span", { children: subtitleText }), _jsx("span", { className: "vd-dot", "aria-hidden": "true" })] })), _jsx("span", { "aria-live": "polite", children: (() => {
                                                        const total = isServerPagingActive
                                                            ? serverTotalCount ?? `${serverHasNext ? '≥' : ''}${(currentPage + 1) * pageSize}`
                                                            : inputStores.length;
                                                        const shown = isServerPagingActive
                                                            ? pagedStores.length
                                                            : summary.storesCount;
                                                        return (_jsxs(_Fragment, { children: [shown, " ", t('из'), " ", total, " ", t('магазинов')] }));
                                                    })() })] })] }), _jsxs("div", { className: "vd-controls", children: [showCumulativeView && (_jsx("button", { type: "button", className: `vd-dd-trigger${showCumulativeBlock ? ' on' : ''}`, "aria-pressed": showCumulativeBlock, onClick: () => setShowCumulativeBlock(v => !v), title: t('Кумулятивные потери — топ-10 магазинов'), style: showCumulativeBlock
                                                ? {
                                                    background: 'var(--c-sky)',
                                                    color: 'var(--on-accent)',
                                                    borderColor: 'var(--c-sky)',
                                                }
                                                : undefined, children: t('Кумулят.') })), _jsxs("div", { className: "vd-search", children: [_jsxs("svg", { className: "vd-search-icon", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "6", cy: "6", r: "4" }), _jsx("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), _jsx("input", { type: "text", value: searchQuery, onChange: e => setSearchQuery(e.target.value), placeholder: t('Поиск…'), autoComplete: "off", "aria-label": t('Поиск по магазину, городу или коду') }), _jsx("button", { type: "button", className: "vd-search-clear", hidden: searchQuery.length === 0, "aria-label": t('Очистить поиск'), onClick: () => setSearchQuery(''), children: _jsxs("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [_jsx("line", { x1: "2", y1: "2", x2: "8", y2: "8" }), _jsx("line", { x1: "8", y1: "2", x2: "2", y2: "8" })] }) })] }), _jsxs("div", { className: "vd-dd-wrap vd-dir-dd-wrap", children: [(() => {
                                                    const cur = DIR_CHIPS.find(c => c.id === dirFilter) ?? DIR_CHIPS[0];
                                                    const curColor = palette[cur.colorKey];
                                                    const triggerStyle = {
                                                        '--vd-chip-color': curColor,
                                                    };
                                                    return (_jsxs("button", { ref: dirTriggerRef, type: "button", className: `vd-dd-trigger vd-dir-dd-trigger${dirDdOpen ? ' open' : ''}${dirFilter !== 'all' ? ' on' : ''}`, "aria-haspopup": "listbox", "aria-expanded": dirDdOpen, "aria-label": t('Направление темпа: %s', cur.label), title: t('Фильтр по направлению темпа'), style: triggerStyle, onClick: () => setDirDdOpen(v => !v), children: [_jsx("span", { className: "vd-dir-dd-trigger-dot", "aria-hidden": "true" }), _jsx("span", { className: "vd-dir-dd-trigger-label", children: t(cur.label) }), _jsx("svg", { viewBox: "0 0 10 6", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M1 1 L5 5 L9 1" }) })] }));
                                                })(), dirDdOpen && createPortal(_jsx("div", { role: "listbox", "aria-label": t('Фильтр по направлению темпа'), style: {
                                                        position: 'fixed',
                                                        top: dirMenuPos.top,
                                                        right: dirMenuPos.right,
                                                        zIndex: 10000,
                                                        minWidth: 180,
                                                        background: '#ffffff',
                                                        border: '1px solid #D1D5DB',
                                                        borderRadius: 10,
                                                        padding: 4,
                                                        boxShadow: '0 10px 28px rgba(15, 17, 20, 0.15)',
                                                        animation: 'vd-dd-fade 0.18s ease',
                                                    }, children: DIR_CHIPS.map(c => {
                                                        const color = palette[c.colorKey];
                                                        const isOn = dirFilter === c.id;
                                                        return (_jsxs("button", { type: "button", role: "option", "aria-selected": isOn, onClick: () => {
                                                                setDirFilter(c.id);
                                                                setDirDdOpen(false);
                                                            }, style: {
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 10,
                                                                width: '100%',
                                                                minHeight: 34,
                                                                padding: '7px 10px',
                                                                background: isOn ? '#F3F4F6' : 'transparent',
                                                                border: 'none',
                                                                borderRadius: 6,
                                                                color: '#0F1114',
                                                                fontFamily: 'inherit',
                                                                fontSize: 12,
                                                                fontWeight: isOn ? 600 : 500,
                                                                textAlign: 'left',
                                                                cursor: 'pointer',
                                                            }, onMouseEnter: e => {
                                                                if (!isOn)
                                                                    e.currentTarget.style.background = '#F9FAFB';
                                                            }, onMouseLeave: e => {
                                                                if (!isOn)
                                                                    e.currentTarget.style.background = 'transparent';
                                                            }, children: [_jsx("span", { "aria-hidden": "true", style: {
                                                                        width: 10,
                                                                        height: 10,
                                                                        borderRadius: '50%',
                                                                        background: color,
                                                                        flexShrink: 0,
                                                                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
                                                                    } }), _jsx("span", { children: t(c.label) })] }, c.id));
                                                    }) }), document.body)] }), hasActiveFilters && (_jsx("button", { type: "button", className: "vd-filter-reset vd-filter-reset-inline", "aria-label": t('Сбросить фильтры'), title: t('Сбросить фильтры'), onClick: resetFilters, children: _jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("path", { d: "M2.5 7 a4.5 4.5 0 1 0 1.32-3.18" }), _jsx("path", { d: "M2 2 L2 4.5 L4.5 4.5" })] }) })), _jsx("div", { className: "vd-seg", role: "group", "aria-label": t('Метрика'), children: ['rub', 'pct'].map(m => (_jsx("button", { type: "button", "aria-pressed": metric === m, className: metric === m ? 'on' : undefined, onClick: () => setMetric(m), children: m === 'rub' ? '₽' : '%' }, m))) }), _jsx(InfoHintTopRight, { children: _jsxs(InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [_jsxs("div", { className: "hint-section", children: [_jsx("div", { className: "hint-section-title", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0442\u0430\u0431\u043B\u0438\u0446\u0435\u0439" }), _jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Click" }), " \u2014 \u043A\u0440\u043E\u0441\u0441-\u0444\u0438\u043B\u044C\u0442\u0440"] }), showDetailModal && (_jsxs(_Fragment, { children: [_jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Ctrl" }), "+", _jsx("kbd", { children: "Click" }), " \u2014 \u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F"] })] })), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Esc" }), " \u2014 \u0437\u0430\u043A\u0440\u044B\u0442\u044C"] }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsxs("span", { className: "hi", children: [_jsx("kbd", { children: "Right Click" }), " \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"] })] }), _jsxs("div", { className: "hint-section", children: [_jsx("div", { className: "hint-section-title", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435\u043C" }), _jsxs("span", { className: "hi", children: [_jsx("strong", { children: "\u00AB\u0421\u0440\u0430\u0432\u043D\u0438\u0442\u044C \u0441: \u2026\u00BB" }), " \u2014 \u0432\u044B\u0431\u043E\u0440 \u043F\u0440\u0435\u0441\u0435\u0442\u0430 (\u043F\u0440\u043E\u0448\u043B\u0430\u044F \u043D\u0435\u0434\u0435\u043B\u044F/\u043C\u0435\u0441\u044F\u0446/\u043A\u0432\u0430\u0440\u0442\u0430\u043B/\u0433\u043E\u0434 \u0438\u043B\u0438 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u043F\u0435\u0440\u0438\u043E\u0434 \u0442\u0430\u043A\u043E\u0439 \u0436\u0435 \u0434\u043B\u0438\u043D\u044B)."] }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsxs("span", { className: "hi", children: [_jsx("strong", { children: "\u00AB\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0434\u0430\u0442\u044B\u00BB" }), " \u2014 \u0440\u0443\u0447\u043D\u043E\u0439 override: \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0434\u0432\u0430 RangePicker'\u0430 \u0434\u043B\u044F current/previous \u043F\u0435\u0440\u0438\u043E\u0434\u043E\u0432. \u041F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u0440\u0435\u0436\u0438\u043C \u0432 \u00ABCustom\u00BB."] }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsx("span", { className: "hi", children: "\u041F\u043E\u0434 dropdown'\u043E\u043C \u0432\u0441\u0435\u0433\u0434\u0430 \u0432\u0438\u0434\u043D\u0430 \u0441\u0442\u0440\u043E\u043A\u0430 \u0441 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u043C\u0438 \u0434\u0430\u0442\u0430\u043C\u0438 \u0442\u0435\u043A\u0443\u0449\u0435\u0433\u043E \u0438 \u0441\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u0435\u043C\u043E\u0433\u043E \u043F\u0435\u0440\u0438\u043E\u0434\u043E\u0432." })] })] }) })] })] }), _jsxs("button", { type: "button", className: `vd-compare-info${panelOpen ? ' on' : ''}${isManualOverride ? ' override' : ''}`, "aria-expanded": panelOpen, "aria-controls": "vd-range-panel", onClick: () => (panelOpen ? closeRangePanel() : openRangePanel()), title: t('Нажмите чтобы изменить даты'), children: [_jsx("span", { className: "vd-compare-info-cal", "aria-hidden": "true", children: _jsxs("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "2", y: "3.5", width: "12", height: "10", rx: "1.5" }), _jsx("line", { x1: "2", y1: "6.5", x2: "14", y2: "6.5" }), _jsx("line", { x1: "5.5", y1: "2", x2: "5.5", y2: "4.5" }), _jsx("line", { x1: "10.5", y1: "2", x2: "10.5", y2: "4.5" })] }) }), _jsxs("span", { className: "vd-compare-info-line", children: [_jsxs("span", { className: "vd-compare-info-label", children: [t('Текущий'), ":"] }), _jsx("span", { className: "vd-compare-info-dates", children: resolvedCurrent ? (_jsxs(_Fragment, { children: [formatRangeDateRu(resolvedCurrent.start), ' – ', formatRangeDateRu(resolvedCurrent.end)] })) : ('—') }), resolvedCurrent && (_jsxs("span", { className: "vd-compare-info-dur", children: ["(", rangeDurationDays(resolvedCurrent), " ", t('дн'), ")"] }))] }), _jsxs("span", { className: "vd-compare-info-line", children: [_jsx("span", { className: "vd-compare-info-label", children: "vs" }), _jsx("span", { className: "vd-compare-info-dates", children: resolvedPrevious ? (_jsxs(_Fragment, { children: [formatRangeDateRu(resolvedPrevious.start), ' – ', formatRangeDateRu(resolvedPrevious.end)] })) : ('—') }), resolvedPrevious && (_jsxs("span", { className: "vd-compare-info-dur", children: ["(", rangeDurationDays(resolvedPrevious), " ", t('дн'), ")"] }))] }), isResolvingCurrent && (_jsx("span", { className: "vd-compare-info-loading", "aria-label": t('Резолв периода'), children: _jsx(InlineSpinnerLarge, { style: { width: 12, height: 12 }, "aria-hidden": "true" }) })), isManualOverride && (_jsxs("span", { className: "vd-compare-info-locked", "aria-label": t('Локальная настройка чарта'), children: [_jsxs("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", children: [_jsx("rect", { x: "3", y: "6", width: "6", height: "4.5", rx: "0.8" }), _jsx("path", { d: "M4.2 6 V4.5 a1.8 1.8 0 0 1 3.6 0 V6" })] }), t('Ручной выбор')] }))] }), panelOpen && RangePicker && createPortal(_jsx("div", { role: "presentation", onClick: (e) => {
                                if (e.target === e.currentTarget)
                                    closeRangePanel();
                            }, style: {
                                position: 'fixed',
                                inset: 0,
                                zIndex: 10000,
                                background: 'rgba(0, 0, 0, 0.45)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 16,
                                animation: 'vd-overlay-in 0.18s ease',
                            }, children: _jsxs("div", { id: "vd-range-panel", role: "dialog", "aria-modal": "true", "aria-label": t('Выбор диапазонов для сравнения'), onClick: (e) => e.stopPropagation(), style: {
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.2)',
                                    width: '100%',
                                    maxWidth: 480,
                                    maxHeight: '90vh',
                                    overflow: 'auto',
                                    padding: '16px 18px 18px',
                                    color: '#0F1114',
                                }, children: [_jsxs("div", { style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: 14,
                                        }, children: [_jsx("h3", { style: {
                                                    fontFamily: 'Inter, system-ui, sans-serif',
                                                    fontSize: 16,
                                                    fontWeight: 700,
                                                    color: '#0F1114',
                                                    margin: 0,
                                                }, children: t('Период сравнения') }), _jsx("button", { type: "button", "aria-label": t('Закрыть'), onClick: closeRangePanel, style: {
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 32,
                                                    height: 32,
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    color: '#6B7280',
                                                    cursor: 'pointer',
                                                }, children: _jsxs("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr', gap: 12 }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 600, color: '#0F1114' }, children: t('Текущий период') }), _jsx(RangePicker, { value: pendingCurrent
                                                            ? [
                                                                dayjs(pendingCurrent[0]),
                                                                dayjs(pendingCurrent[1]),
                                                            ]
                                                            : null, onChange: (dates) => {
                                                            const arr = dates;
                                                            setPendingCurrent(arr
                                                                ? [
                                                                    arr[0].format('YYYY-MM-DD'),
                                                                    arr[1].format('YYYY-MM-DD'),
                                                                ]
                                                                : undefined);
                                                        }, format: "DD.MM.YYYY", popupClassName: "vd-rp-single", popupStyle: { zIndex: 10001 }, locale: ruRU.DatePicker, allowClear: true })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 600, color: '#0F1114' }, children: t('Период для сравнения') }), _jsx(RangePicker, { value: pendingPrevious
                                                            ? [
                                                                dayjs(pendingPrevious[0]),
                                                                dayjs(pendingPrevious[1]),
                                                            ]
                                                            : null, onChange: (dates) => {
                                                            const arr = dates;
                                                            setPendingPrevious(arr
                                                                ? [
                                                                    arr[0].format('YYYY-MM-DD'),
                                                                    arr[1].format('YYYY-MM-DD'),
                                                                ]
                                                                : undefined);
                                                        }, format: "DD.MM.YYYY", popupClassName: "vd-rp-single", popupStyle: { zIndex: 10001 }, locale: ruRU.DatePicker, allowClear: true })] })] }), _jsxs("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            gap: 8,
                                            marginTop: 16,
                                            paddingTop: 14,
                                            borderTop: '1px solid #E5E7EB',
                                        }, children: [isManualOverride && (_jsx("button", { type: "button", onClick: resetRangePanel, style: {
                                                    minHeight: 36,
                                                    padding: '0 14px',
                                                    background: 'transparent',
                                                    border: '1px solid #FCA5A5',
                                                    borderRadius: 8,
                                                    color: '#DC2626',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }, children: t('Сбросить') })), _jsx("button", { type: "button", onClick: closeRangePanel, style: {
                                                    minHeight: 36,
                                                    padding: '0 14px',
                                                    background: 'transparent',
                                                    border: '1px solid #D1D5DB',
                                                    borderRadius: 8,
                                                    color: '#374151',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }, children: t('Отмена') }), _jsx("button", { type: "button", disabled: !pendingCurrent || !pendingPrevious, onClick: applyRangePanel, style: {
                                                    minHeight: 36,
                                                    padding: '0 16px',
                                                    background: (!pendingCurrent || !pendingPrevious) ? '#9CA3AF' : '#2563EB',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    color: '#FFFFFF',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: (!pendingCurrent || !pendingPrevious) ? 'not-allowed' : 'pointer',
                                                }, children: t('Применить') })] })] }) }), document.body), dataState === 'stale' && (_jsx("div", { role: "status", "aria-live": "polite", children: _jsxs("span", { className: "vd-stale-badge", children: [_jsxs("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "5", cy: "5", r: "3.5" }), _jsx("path", { d: "M5 3 L5 5 L6.5 6" })] }), t('Данные устарели, обновите страницу')] }) })), dataState === 'partial' && partialWarning && (_jsxs("div", { className: "vd-partial-badge", role: "status", "aria-live": "polite", children: [_jsx(IconWarning, {}), _jsx("span", { children: partialWarning.message })] })), showSummaryStrip && (_jsxs("div", { className: "vd-summary", role: "group", "aria-label": t('Сводка'), children: [_jsxs("div", { className: "vd-sm", children: [_jsx("div", { className: "vd-sm-l", children: t('Текущий период') }), _jsx("div", { className: "vd-sm-v", children: fmtByMetric(summary.totalCurr, metric) }), _jsxs("div", { className: "vd-sm-d", children: [summary.storesCount, " ", t('магазинов')] })] }), _jsxs("div", { className: "vd-sm", children: [_jsx("div", { className: "vd-sm-l", children: t('Прошлый период') }), _jsx("div", { className: "vd-sm-v", children: fmtByMetric(summary.totalPrev, metric) }), _jsx("div", { className: "vd-sm-d", children: t('для сравнения') })] }), _jsxs("div", { className: "vd-sm", children: [_jsx("div", { className: "vd-sm-l", children: t('Темп сети') }), _jsx("div", { className: `vd-sm-v ${netCls}`, children: netTempoText }), _jsx("div", { className: "vd-sm-d", children: netPctText })] }), _jsxs("div", { className: "vd-sm", children: [_jsx("div", { className: "vd-sm-l", children: t('Магазинов ×>1.5') }), _jsxs("div", { className: "vd-sm-v dn", children: [summary.growCount, _jsx("span", { className: "vd-u", children: t('маг.') })] }), _jsx("div", { className: "vd-sm-d", children: t('потери выросли в 1.5+ раз') })] })] })), showCumulativeBlock && showCumulativeView ? (_jsx(CumulativeView, { stores: cumulativeStores, metric: metric, palette: palette })) : (_jsxs("div", { className: "vd-table-wrap", role: "table", "aria-label": t('Таблица магазинов по темпу'), style: { position: 'relative' }, children: [isRefreshing && _jsx(RefreshBar, {}), _jsxs("div", { className: "vd-table-head", role: "row", children: [_jsx("div", { className: "vd-th center", role: "columnheader", children: "\u2116" }), _jsxs("button", { type: "button", className: `vd-th sortable${sortBy === 'name' ? ' sorted' : ''}`, role: "columnheader", "aria-sort": sortBy === 'name'
                                                ? sortDir === 'asc'
                                                    ? 'ascending'
                                                    : 'descending'
                                                : 'none', onClick: () => toggleSort('name', 'asc'), children: [t('Магазин'), sortBy === 'name' && _jsx(SortArrow, { dir: sortDir })] }), _jsx("div", { className: "vd-th right", role: "columnheader", children: t('Было') }), _jsx("div", { className: "vd-th center", role: "columnheader", children: t('Изменение (темп)') }), _jsx("div", { className: "vd-th right", role: "columnheader", children: t('Стало') }), _jsxs("button", { type: "button", className: `vd-th right sortable${sortBy === 'tempo' ? ' sorted' : ''}`, role: "columnheader", "aria-sort": sortBy === 'tempo'
                                                ? sortDir === 'asc'
                                                    ? 'ascending'
                                                    : 'descending'
                                                : 'none', onClick: () => toggleSort('tempo', 'desc'), children: [t('Темп'), sortBy === 'tempo' && _jsx(SortArrow, { dir: sortDir })] }), _jsx("div", { className: "vd-th", role: "columnheader", children: t('Тренд 12 нед') })] }), _jsxs("div", { className: "vd-table-body", style: {
                                        opacity: isRefreshing ? 0.55 : 1,
                                        transition: 'opacity 0.15s ease',
                                        pointerEvents: isRefreshing ? 'none' : 'auto',
                                    }, children: [isInitialLoading && (_jsxs("div", { className: "vd-state", role: "status", "aria-live": "polite", children: [_jsx(InlineSpinnerLarge, { "aria-label": t('Загрузка') }), _jsx("div", { className: "vd-state-message", children: t('Загрузка…') })] })), !isInitialLoading && fetchError && (_jsxs("div", { className: "vd-state error", role: "alert", children: [_jsx(IconError, {}), _jsx("div", { className: "vd-state-message", children: fetchError }), _jsx("button", { type: "button", className: "vd-state-action", onClick: () => setCurrentPage(p => p), children: t('Повторить') })] })), !isInitialLoading && !fetchError && pagedStores.length === 0 && (_jsxs("div", { className: "vd-state", role: "status", children: [_jsx(IconEmpty, {}), _jsx("div", { className: "vd-state-message", children: t('Ничего не найдено по заданным фильтрам.') })] })), !isInitialLoading && !fetchError && pagedStores.map((x, i) => (_jsx(TableRow, { index: currentPage * pageSize + i, x: x, metric: metric, tempoToPct: tempoToPct, palette: palette, isCrossSelected: crossFilter.has(x.store.id), isDimmed: crossFilter.size > 0 && !crossFilter.has(x.store.id), onClick: e => handleRowClick(e, x.store), onDoubleClick: () => {
                                                if (showDetailModal)
                                                    setDetailStoreId(x.store.id);
                                            }, onKeyDown: e => handleRowKey(e, x.store), onMouseEnter: e => showRowTooltip(e, x.store), onMouseMove: moveTooltip, onMouseLeave: hideTooltip, onFocus: e => {
                                                const rect = e.target.getBoundingClientRect();
                                                showRowTooltip({
                                                    clientX: rect.left + 40,
                                                    clientY: rect.top + rect.height / 2,
                                                }, x.store);
                                            }, onBlur: hideTooltip }, x.store.id)))] })] })), (() => {
                            const isCumulative = showCumulativeBlock && showCumulativeView;
                            if (isCumulative)
                                return null;
                            let totalPages;
                            if (isServerPagingActive) {
                                if (serverTotalCount != null) {
                                    totalPages = Math.ceil(serverTotalCount / pageSize);
                                }
                                else if (serverHasNext) {
                                    // exact count неизвестен — рисуем «N+» режим: текущая + еще
                                    totalPages = null;
                                }
                                else {
                                    totalPages = currentPage + 1;
                                }
                            }
                            else {
                                totalPages = totalLocalPages;
                            }
                            if (totalPages != null && totalPages <= 1)
                                return null;
                            const cur1 = currentPage + 1;
                            // Helper для генерации [1, ..., n-1, n] видимых страниц
                            const getPageNumbers = (current0, total) => {
                                if (total <= 7)
                                    return Array.from({ length: total }, (_, i) => i + 1);
                                const pages = new Set();
                                pages.add(1);
                                pages.add(total);
                                pages.add(total - 1);
                                pages.add(total - 2);
                                const cur = current0 + 1;
                                pages.add(cur);
                                if (cur > 1)
                                    pages.add(cur - 1);
                                if (cur < total)
                                    pages.add(cur + 1);
                                const sorted = [...pages]
                                    .filter(p => p >= 1 && p <= total)
                                    .sort((a, b) => a - b);
                                const result = [];
                                for (let i = 0; i < sorted.length; i += 1) {
                                    if (i > 0 && sorted[i] - sorted[i - 1] > 1)
                                        result.push('...');
                                    result.push(sorted[i]);
                                }
                                return result;
                            };
                            return (_jsxs(PaginationWrap, { style: {
                                    opacity: isRefreshing ? 0.5 : 1,
                                    pointerEvents: isRefreshing ? 'none' : 'auto',
                                    transition: 'opacity 0.15s ease',
                                }, role: "navigation", "aria-label": t('Постраничная навигация'), children: [_jsx(PageBtn, { type: "button", "aria-label": t('Предыдущая страница'), disabled: isRefreshing || currentPage === 0, onClick: () => setCurrentPage(p => Math.max(0, p - 1)), children: "\u2039" }), totalPages != null
                                        ? getPageNumbers(currentPage, totalPages).map((item, idx) => item === '...' ? (_jsx(PageEllipsis, { children: "\u2026" }, `e${idx}`)) : (_jsx(PageBtn, { type: "button", isActive: item === cur1, "aria-label": `${t('Страница')} ${item}`, "aria-current": item === cur1 ? 'page' : undefined, disabled: isRefreshing, onClick: () => setCurrentPage(item - 1), children: item }, item)))
                                        : /* server-mode без exact count: показываем «N+». */
                                            [
                                                _jsx(PageBtn, { type: "button", isActive: true, "aria-current": "page", disabled: isRefreshing, children: cur1 }, "cur"),
                                                _jsx(PageEllipsis, { children: "\u2026" }, "ell"),
                                            ], _jsx(PageBtn, { type: "button", "aria-label": t('Следующая страница'), disabled: isRefreshing ||
                                            (totalPages != null
                                                ? currentPage >= totalPages - 1
                                                : !serverHasNext), onClick: () => setCurrentPage(p => p + 1), children: "\u203A" }), totalPages != null && totalPages > 7 && (_jsx(PageInput, { type: "number", min: 1, max: totalPages, placeholder: "\u2116", "aria-label": t('Перейти на страницу'), disabled: isRefreshing, onKeyDown: (e) => {
                                            if (e.key === 'Enter') {
                                                const val = parseInt(e.target.value, 10);
                                                if (val >= 1 && val <= totalPages) {
                                                    setCurrentPage(val - 1);
                                                    e.target.value = '';
                                                }
                                            }
                                        } }))] }));
                        })(), _jsx("div", { className: "vd-footer", children: _jsxs("div", { className: "vd-hint", children: [_jsxs("div", { className: "vd-legend-item", children: [_jsx("span", { className: "vd-sw", style: { background: palette.dn }, "aria-hidden": "true" }), _jsx("span", { children: t('рост потерь') })] }), _jsxs("div", { className: "vd-legend-item", children: [_jsx("span", { className: "vd-sw", style: { background: palette.up }, "aria-hidden": "true" }), _jsx("span", { children: t('снижение') })] })] }) })] }) }), tooltip && typeof document !== 'undefined' &&
                createPortal(_jsx(TooltipRoot, { "data-theme": tooltip.theme, "data-visible": "true", style: { left: tooltip.x, top: tooltip.y }, children: tooltip.html }), document.body), showDetailModal && detailStoreId && typeof document !== 'undefined' &&
                (() => {
                    // В server-mode искать сначала в serverStores (current page), потом
                    // в inputStores (mock/initial). В mock-mode наоборот.
                    const store = (isServerPagingActive
                        ? serverStores.find(s => s.id === detailStoreId)
                        : inputStores.find(s => s.id === detailStoreId)) ??
                        inputStores.find(s => s.id === detailStoreId);
                    if (!store)
                        return null;
                    return createPortal(_jsx(DetailModal, { store: store, metric: metric, comparisonMode: comparisonMode, theme: theme, palette: palette, onClose: () => setDetailStoreId(null) }), document.body);
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
    /* Тренд опционален: backend может не отдать (если weekCol не задан). */
    const weeks = (metric === 'rub' ? store.trendRub : store.trendPct) ?? [];
    const fv = (v) => fmtByMetric(v, metric);
    const rowCls = ['vd-row'];
    if (isCrossSelected)
        rowCls.push('selected');
    if (isDimmed)
        rowCls.push('dimmed');
    return (_jsxs("div", { role: "row", tabIndex: 0, className: rowCls.join(' '), onClick: onClick, onDoubleClick: onDoubleClick, onKeyDown: onKeyDown, onMouseEnter: onMouseEnter, onMouseMove: onMouseMove, onMouseLeave: onMouseLeave, onFocus: onFocus, onBlur: onBlur, "aria-selected": isCrossSelected, children: [_jsx("div", { className: "vd-rank-cell", role: "cell", children: index + 1 }), _jsxs("div", { className: "vd-store-cell", role: "cell", children: [_jsxs("div", { className: "vd-store-name", children: [_jsx("span", { className: "vd-code", children: store.code }), store.shortLabel] }), _jsxs("div", { className: "vd-store-meta", children: [store.city, " \u00B7 ", store.formatName] })] }), _jsxs("div", { className: "vd-period-cell", role: "cell", children: [fv(prev), _jsx("span", { className: "vd-sub-text", children: t('пред.') })] }), _jsx(BarCell, { role: "cell", children: _jsxs("div", { className: "vd-bar-wrap", children: [_jsxs("div", { className: "vd-bar-bg", children: [_jsx("div", { className: "vd-bar-bg-left" }), _jsx("div", { className: "vd-bar-bg-right" })] }), _jsx("div", { className: "vd-bar-center" }), _jsx("div", { className: "vd-bar-fill", style: {
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
    /* Trend данных может не быть (backend не задал weekCol). В таком случае
       показываем «нет данных для тренда» вместо падения. */
    const cumData = stores.map(s => {
        const weeks = (metric === 'rub' ? s.trendRub : s.trendPct) ?? [];
        let sum = 0;
        return weeks.map(v => {
            sum += v;
            return sum;
        });
    });
    const trendLen = Math.max(0, ...cumData.map(arr => arr.length));
    const hasTrend = trendLen > 1;
    const allMax = Math.max(1, ...cumData.flat()) * 1.05;
    const sx = (i) => padL + (trendLen > 1 ? i / (trendLen - 1) : 0) * (w - padL - padR);
    const sy = (v) => h - padB - (v / allMax) * (h - padT - padB);
    return (_jsxs("div", { className: "vd-cum-wrap visible", children: [_jsxs("div", { className: "vd-cum-title", children: [_jsx("span", { children: t('Кумулятивные потери с начала периода') }), _jsx("span", { className: "vd-right", children: stores.length
                            ? `${t('Топ')}-${stores.length} ${t('магазинов')}`
                            : '' })] }), _jsx("div", { className: "vd-cum-chart", children: !hasTrend ? (_jsx("div", { style: {
                        padding: '24px',
                        textAlign: 'center',
                        color: palette.g600,
                        fontFamily: palette.fontText,
                        fontSize: 13,
                    }, children: t('Тренд недоступен — добавьте колонку «Неделя» в настройках чарта, ' +
                        'чтобы увидеть накопленные потери по периодам.') })) : (_jsxs("svg", { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "xMidYMid meet", width: "100%", height: h, role: "img", "aria-label": t('Кумулятивные потери по топ-10 магазинам'), children: [_jsx("line", { x1: padL, y1: h - padB, x2: w - padR, y2: h - padB, stroke: palette.g200, strokeWidth: "1" }), _jsx("line", { x1: padL, y1: padT, x2: padL, y2: h - padB, stroke: palette.g200, strokeWidth: "1" }), Array.from({ length: Math.min(6, trendLen) }, (_, k) => {
                            const step = (trendLen - 1) / Math.max(1, Math.min(5, trendLen - 1));
                            return Math.round(k * step);
                        }).map(i => (_jsxs("text", { x: sx(i), y: h - 10, fontFamily: palette.fontMono, fontSize: "11", fill: palette.g600, textAnchor: "middle", children: ["\u041D", i + 1] }, i))), cumData.map((cum, si) => {
                            if (cum.length === 0)
                                return null;
                            const color = lineColors[si % lineColors.length];
                            const pts = cum
                                .map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`)
                                .join(' ');
                            const lx = sx(cum.length - 1);
                            const ly = sy(cum[cum.length - 1]);
                            const rawLabel = stores[si]?.name ?? '';
                            const label = rawLabel.length > 12 ? `${rawLabel.slice(0, 11)}…` : rawLabel;
                            return (_jsxs("g", { children: [_jsx("polyline", { points: pts, fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("circle", { cx: lx, cy: ly, r: "3", fill: color, stroke: palette.s, strokeWidth: "1.5" }), _jsx("text", { x: lx + 8, y: ly + 4, fontFamily: palette.fontMono, fontSize: "11", fontWeight: "600", fill: color, children: label })] }, stores[si]?.id ?? si));
                        })] })) })] }));
};
export default VelocityDiverging;
//# sourceMappingURL=VelocityDiverging.js.map