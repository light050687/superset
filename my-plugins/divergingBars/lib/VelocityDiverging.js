"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const core_1 = require("@superset-ui/core");
const sanitizeCsvCell_1 = require("./sanitizeCsvCell");
// @ts-ignore — subpath resolves в runtime через Superset webpack aliases.
// Подмена на 'antd' ломает runtime потому что antd не зарегистрирован как dep плагина.
// @ts-ignore — antd доступен через peerDep `@superset-ui/core` в Superset frontend.
const antd_1 = require("antd");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RangePicker = antd_1.DatePicker?.RangePicker;
// @ts-ignore — dayjs не зарегистрирован как deps плагина, но доступен в bundle
// через Superset (peerDep antd). Используется здесь только для конвертации
// строк ISO → Dayjs объекты для RangePicker'а.
const dayjs_1 = __importDefault(require("dayjs"));
// @ts-ignore — русский локаль для dayjs (использует RangePicker).
require("dayjs/locale/ru");
dayjs_1.default.locale('ru');
// @ts-ignore — antd ruRU locale доступен через peerDep antd в Superset.
const ru_RU_1 = __importDefault(require("antd/locale/ru_RU"));
const styles_1 = require("./styles");
const InfoHint_1 = require("./components/InfoHint");
const themeTokens_1 = require("./themeTokens");
const computeTempo_1 = require("./utils/computeTempo");
/* RangePicker — отдельный named export из того же subpath. */
const formatRussian_1 = require("./utils/formatRussian");
const detailApi_1 = require("./utils/detailApi");
const rowsToStores_1 = require("./utils/rowsToStores");
const resolveRange_1 = require("./utils/resolveRange");
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
const VelocityDiverging = ({ width, height, headerText, subtitleText, dataState, partialWarning, errorMessage, stores: inputStores, formats: inputFormats, defaultComparisonMode, customCurrentRange, customPreviousRange, defaultMetric, showCumulativeView, showDetailModal, showCsvExport, showSummaryStrip, isDarkMode, mockModeEnabled, pageSize, queryParams, }) => {
    const theme = isDarkMode ? 'dark' : 'light';
    const rootRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        ensureKeyframes();
    }, []);
    /** Палитра DS 2.0 — пересчитывается только при смене темы. */
    const palette = (0, react_1.useMemo)(() => buildPalette(isDarkMode), [isDarkMode]);
    const [metric, setMetric] = (0, react_1.useState)(defaultMetric);
    /* Default ВСЕГДА = prev_period. Переключается на 'custom' при manual override. */
    const [comparisonMode, setComparisonMode] = (0, react_1.useState)('prev_period');
    /* Locally applied custom-диапазоны (после нажатия «Применить» в панели).
       При comparisonMode = 'custom' они идут в payload как customCurrent/Previous.
       В остальных режимах их наличие == manual override (mode переключится
       в 'custom' при Apply). */
    const [customRange, setCustomRange] = (0, react_1.useState)({
        current: customCurrentRange,
        previous: customPreviousRange,
    });
    /* Manual-override panel: pending draft + open state. Применяется в
       customRange ТОЛЬКО при нажатии «Применить». При «Отмена» — игнор. */
    const [panelOpen, setPanelOpen] = (0, react_1.useState)(false);
    const [pendingCurrent, setPendingCurrent] = (0, react_1.useState)(undefined);
    const [pendingPrevious, setPendingPrevious] = (0, react_1.useState)(undefined);
    const [cmpDdOpen, setCmpDdOpen] = (0, react_1.useState)(false);
    const [sortBy, setSortBy] = (0, react_1.useState)('tempo');
    const [sortDir, setSortDir] = (0, react_1.useState)('desc');
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [dirFilter, setDirFilter] = (0, react_1.useState)('all');
    const [formatFilters, setFormatFilters] = (0, react_1.useState)(new Set());
    const [crossFilter, setCrossFilter] = (0, react_1.useState)(new Set());
    const [fmtDdOpen, setFmtDdOpen] = (0, react_1.useState)(false);
    /* Direction-filter dropdown: badge-trigger в .vd-controls вместо
       старого filter-row с 4 chips. Outside-click и Escape ниже в effects. */
    const [dirDdOpen, setDirDdOpen] = (0, react_1.useState)(false);
    /* Trigger ref + computed position для portal menu. VelocityRoot имеет
       overflow:auto + container-type:inline-size — absolute menu обрезается.
       Portal в body + position:fixed решает. */
    const dirTriggerRef = (0, react_1.useRef)(null);
    const [dirMenuPos, setDirMenuPos] = (0, react_1.useState)({ top: 0, right: 0 });
    (0, react_1.useEffect)(() => {
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
    const [tooltip, setTooltip] = (0, react_1.useState)(null);
    const [detailStoreId, setDetailStoreId] = (0, react_1.useState)(null);
    /* ── Серверная пагинация (mockOff). При mockOn все 400 магазинов уже в
       inputStores, пагинация локальная. ── */
    const [currentPage, setCurrentPage] = (0, react_1.useState)(0);
    const [serverStores, setServerStores] = (0, react_1.useState)(inputStores);
    const [serverHasNext, setServerHasNext] = (0, react_1.useState)(false);
    const [serverTotalCount, setServerTotalCount] = (0, react_1.useState)(null);
    const [isInitialLoading, setIsInitialLoading] = (0, react_1.useState)(false);
    const [isRefreshing, setIsRefreshing] = (0, react_1.useState)(false);
    const [fetchError, setFetchError] = (0, react_1.useState)(null);
    const fetchAbortRef = (0, react_1.useRef)(null);
    const countAbortRef = (0, react_1.useRef)(null);
    const hasEverLoaded = (0, react_1.useRef)(false);
    /* ── Resolved дата-диапазоны для UI-подсказки «Текущий: dd.MM – dd.MM
       vs dd.MM – dd.MM». Резолвим текущий через fetchTimeRange (или
       синхронно если уже ISO), а comparison — локально через dayjs. ── */
    const [resolvedCurrent, setResolvedCurrent] = (0, react_1.useState)(null);
    const [isResolvingCurrent, setIsResolvingCurrent] = (0, react_1.useState)(false);
    const resolveAbortRef = (0, react_1.useRef)(null);
    /* Debounce поиска для серверной пагинации. */
    const [debouncedSearch, setDebouncedSearch] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);
    /* Сброс currentPage при изменении выборки (вне sort/search — те уже сами
       сбрасывают). comparisonMode/metric — затрагивают tempo → ранжирование меняется,
       pageSize — окно. */
    (0, react_1.useEffect)(() => {
        setCurrentPage(0);
    }, [comparisonMode, metric, pageSize, dirFilter]);
    /* Отдельный useState-cumulative для показа дополнительного блока «Топ-10
       накопленных потерь». Не привязан к comparison-mode (раньше cum было одним
       из 4 горизонтов). По умолчанию выключен — пользователь включает кнопкой. */
    const [showCumulativeBlock, setShowCumulativeBlock] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (!showCumulativeView)
            setShowCumulativeBlock(false);
    }, [showCumulativeView]);
    /* formatFilters: тот же сброс, но Set нужно сериализовать. */
    const formatFiltersKey = (0, react_1.useMemo)(() => Array.from(formatFilters).sort().join('|'), [formatFilters]);
    (0, react_1.useEffect)(() => {
        setCurrentPage(0);
    }, [formatFiltersKey]);
    /* ── Server-side pagination fetch (только когда real data + есть queryParams).
       При mock — пользуемся inputStores в локальной пагинации (см. ниже). ── */
    const isServerPagingActive = !mockModeEnabled && Boolean(queryParams);
    /* formatsMap нужен для rowsToStores на стороне клиента. */
    const formatsMapServer = (0, react_1.useMemo)(() => {
        const m = new Map();
        inputFormats?.forEach(f => m.set(f.id, f));
        return m;
    }, [inputFormats]);
    (0, react_1.useEffect)(() => {
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
        const payload = (0, detailApi_1.buildStoresPayload)({
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
        core_1.SupersetClient.post({
            endpoint: 'api/v1/chart/data',
            jsonPayload: payload,
            signal: controller.signal,
        })
            .then(({ json }) => {
            const rows = (0, detailApi_1.extractApiRows)(json);
            const compRows = comparisonMode === 'custom' ? (0, detailApi_1.extractApiCompRows)(json) : undefined;
            const parsed = (0, rowsToStores_1.rowsToStores)(rows, { ...queryParams, comparisonMode }, formatsMapServer, compRows);
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
    (0, react_1.useEffect)(() => {
        if (!isServerPagingActive || !queryParams)
            return undefined;
        countAbortRef.current?.abort();
        const controller = new AbortController();
        countAbortRef.current = controller;
        const payload = (0, detailApi_1.buildStoresCountPayload)({
            queryParams,
            searchQuery: debouncedSearch,
        });
        core_1.SupersetClient.post({
            endpoint: 'api/v1/chart/data',
            jsonPayload: payload,
            signal: controller.signal,
        })
            .then(({ json }) => {
            const rows = (0, detailApi_1.extractApiRows)(json);
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
    (0, react_1.useEffect)(() => {
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
        (0, resolveRange_1.resolveTimeRangeAsync)(tr, controller.signal).then(range => {
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
    const resolvedPrevious = (0, react_1.useMemo)(() => {
        if (!resolvedCurrent)
            return null;
        const customPrev = customRange.previous &&
            customRange.previous[0] &&
            customRange.previous[1]
            ? { start: customRange.previous[0], end: customRange.previous[1] }
            : undefined;
        return (0, resolveRange_1.resolveComparisonRange)(resolvedCurrent.start, resolvedCurrent.end, comparisonMode, customPrev);
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
    /* Активный набор магазинов: либо server-paged (real data), либо
       полный inputStores (mock-режим). */
    const activeStores = isServerPagingActive ? serverStores : inputStores;
    /* Фильтры + сортировка. Применяются к activeStores. В server-mode фильтры
       dir / format и поиск выполняют локальную пост-фильтрацию (на 1 странице)
       — это компромисс ради простоты; при включении dir-filter / format-filter
       в server-mode пользователь увидит "меньше pageSize" если эти фильтры
       активны. Searching уходит на сервер через debouncedSearch. */
    const filteredStores = (0, react_1.useMemo)(() => {
        const q = searchQuery.trim().toLowerCase();
        let arr = activeStores.map(s => {
            const prev = metric === 'rub' ? s.prevValueRub : s.prevValuePct;
            const curr = metric === 'rub' ? s.currValueRub : s.currValuePct;
            const tr = (0, computeTempo_1.computeTempo)(prev, curr);
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
    const totalLocalPages = (0, react_1.useMemo)(() => {
        if (isServerPagingActive)
            return 0; // не используется в server-mode
        return Math.max(1, Math.ceil(filteredStores.length / pageSize));
    }, [isServerPagingActive, filteredStores.length, pageSize]);
    const pagedStores = (0, react_1.useMemo)(() => {
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
    (0, react_1.useEffect)(() => {
        if (isServerPagingActive)
            return;
        if (currentPage >= totalLocalPages)
            setCurrentPage(0);
    }, [currentPage, totalLocalPages, isServerPagingActive]);
    /* Суммарные данные — в mock-mode по всему filteredStores (всем магазинам),
       в server-mode по current page (filteredStores уже = одна страница). */
    const summary = (0, react_1.useMemo)(() => {
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
    const barScale = (0, react_1.useMemo)(() => {
        if (!pagedStores.length)
            return { maxScale: 2.5 };
        const maxTempo = Math.max(...pagedStores.map(x => x.tempo), 2);
        const minTempo = Math.min(...pagedStores.map(x => x.tempo), 0.5);
        const maxScale = Math.max(maxTempo, 1 / Math.max(minTempo, 0.001), 2.5);
        return { maxScale };
    }, [pagedStores]);
    const tempoToPct = (0, react_1.useCallback)((t0) => {
        const { maxScale } = barScale;
        if (t0 >= 1)
            return 50 + ((t0 - 1) / (maxScale - 1)) * 50;
        return 50 - ((1 - t0) / (1 - 1 / maxScale)) * 50;
    }, [barScale]);
    /* Активная метка периода — зависит от текущего comparison-режима. */
    const activePeriodLabel = (0, react_1.useMemo)(() => getComparisonPeriodLabel(comparisonMode), [comparisonMode]);
    /* Топ-10 магазинов для кумулятивного вида — вычисляем всегда
       (Rules of Hooks: не внутри условных веток). Cumulative — отдельный
       режим показа (toggle), независимый от comparisonMode. */
    const cumulativeStores = (0, react_1.useMemo)(() => {
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
    const resetFilters = (0, react_1.useCallback)(() => {
        setDirFilter('all');
        setFormatFilters(new Set());
        setSearchQuery('');
        setCurrentPage(0);
    }, []);
    /* Сортировка. Любая смена sort → сбрасываем currentPage. */
    const toggleSort = (0, react_1.useCallback)((key, defaultDir = 'desc') => {
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
    /* ── Управление range-panel («Изменить даты»). Pending state — draft;
       применяется только при «Применить». Открытие из любого режима
       инициализирует pending от текущих resolved-дат. ── */
    const openRangePanel = (0, react_1.useCallback)(() => {
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
    const closeRangePanel = (0, react_1.useCallback)(() => {
        setPanelOpen(false);
        setPendingCurrent(undefined);
        setPendingPrevious(undefined);
    }, []);
    const applyRangePanel = (0, react_1.useCallback)(() => {
        // Сохраняем pending → customRange; mode → 'custom'.
        setCustomRange({ current: pendingCurrent, previous: pendingPrevious });
        setComparisonMode('custom');
        setPanelOpen(false);
        setCurrentPage(0);
    }, [pendingCurrent, pendingPrevious]);
    const resetRangePanel = (0, react_1.useCallback)(() => {
        // Сбрасываем custom-override → возврат к prev_period (auto).
        setCustomRange({ current: undefined, previous: undefined });
        setComparisonMode('prev_period');
        setPanelOpen(false);
        setPendingCurrent(undefined);
        setPendingPrevious(undefined);
        setCurrentPage(0);
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
            const str = (0, sanitizeCsvCell_1.sanitizeCsvCell)(v);
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
                setDirDdOpen(false);
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
    /* Outside-click для direction-dropdown. Используем отдельный класс
       `.vd-dir-dd-wrap` чтобы клик внутри другого `.vd-dd-wrap` (форматы)
       не закрывал его молча. */
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
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
    const showRowTooltip = (0, react_1.useCallback)((e, store) => {
        const prev = metric === 'rub' ? store.prevValueRub : store.prevValuePct;
        const curr = metric === 'rub' ? store.currValueRub : store.currValuePct;
        const tr = (0, computeTempo_1.computeTempo)(prev, curr);
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
    }, [metric, theme, palette]);
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
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(styles_1.VelocityRoot, { ...rootProps, role: "region", "aria-label": headerText, children: (0, jsx_runtime_1.jsxs)("div", { className: "vd-card", "data-info-hint-container": "", children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-head", children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-title-block", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "vd-title", children: [headerText, mockModeEnabled && (0, jsx_runtime_1.jsx)("span", { className: "vd-mock-badge", children: "\u0422\u0415\u0421\u0422" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-sub", children: [subtitleText && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { children: subtitleText }), (0, jsx_runtime_1.jsx)("span", { className: "vd-dot", "aria-hidden": "true" })] })), (0, jsx_runtime_1.jsx)("span", { "aria-live": "polite", children: (() => {
                                                        const total = isServerPagingActive
                                                            ? serverTotalCount ?? `${serverHasNext ? '≥' : ''}${(currentPage + 1) * pageSize}`
                                                            : inputStores.length;
                                                        const shown = isServerPagingActive
                                                            ? pagedStores.length
                                                            : summary.storesCount;
                                                        return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [shown, " ", (0, core_1.t)('из'), " ", total, " ", (0, core_1.t)('магазинов')] }));
                                                    })() })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-controls", children: [showCumulativeView && ((0, jsx_runtime_1.jsx)("button", { type: "button", className: `vd-dd-trigger${showCumulativeBlock ? ' on' : ''}`, "aria-pressed": showCumulativeBlock, onClick: () => setShowCumulativeBlock(v => !v), title: (0, core_1.t)('Кумулятивные потери — топ-10 магазинов'), style: showCumulativeBlock
                                                ? {
                                                    background: 'var(--c-sky)',
                                                    color: 'var(--on-accent)',
                                                    borderColor: 'var(--c-sky)',
                                                }
                                                : undefined, children: (0, core_1.t)('Кумулят.') })), (0, jsx_runtime_1.jsxs)("div", { className: "vd-search", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "vd-search-icon", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "6", cy: "6", r: "4" }), (0, jsx_runtime_1.jsx)("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: searchQuery, onChange: e => setSearchQuery(e.target.value), placeholder: (0, core_1.t)('Поиск…'), autoComplete: "off", "aria-label": (0, core_1.t)('Поиск по магазину, городу или коду') }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "vd-search-clear", hidden: searchQuery.length === 0, "aria-label": (0, core_1.t)('Очистить поиск'), onClick: () => setSearchQuery(''), children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "8", y2: "8" }), (0, jsx_runtime_1.jsx)("line", { x1: "8", y1: "2", x2: "2", y2: "8" })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-dd-wrap vd-dir-dd-wrap", children: [(() => {
                                                    const cur = DIR_CHIPS.find(c => c.id === dirFilter) ?? DIR_CHIPS[0];
                                                    const curColor = palette[cur.colorKey];
                                                    const triggerStyle = {
                                                        '--vd-chip-color': curColor,
                                                    };
                                                    return ((0, jsx_runtime_1.jsxs)("button", { ref: dirTriggerRef, type: "button", className: `vd-dd-trigger vd-dir-dd-trigger${dirDdOpen ? ' open' : ''}${dirFilter !== 'all' ? ' on' : ''}`, "aria-haspopup": "listbox", "aria-expanded": dirDdOpen, "aria-label": (0, core_1.t)('Направление темпа: %s', cur.label), title: (0, core_1.t)('Фильтр по направлению темпа'), style: triggerStyle, onClick: () => setDirDdOpen(v => !v), children: [(0, jsx_runtime_1.jsx)("span", { className: "vd-dir-dd-trigger-dot", "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { className: "vd-dir-dd-trigger-label", children: (0, core_1.t)(cur.label) }), (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 10 6", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M1 1 L5 5 L9 1" }) })] }));
                                                })(), dirDdOpen && (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)("div", { role: "listbox", "aria-label": (0, core_1.t)('Фильтр по направлению темпа'), style: {
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
                                                        return ((0, jsx_runtime_1.jsxs)("button", { type: "button", role: "option", "aria-selected": isOn, onClick: () => {
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
                                                            }, children: [(0, jsx_runtime_1.jsx)("span", { "aria-hidden": "true", style: {
                                                                        width: 10,
                                                                        height: 10,
                                                                        borderRadius: '50%',
                                                                        background: color,
                                                                        flexShrink: 0,
                                                                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
                                                                    } }), (0, jsx_runtime_1.jsx)("span", { children: (0, core_1.t)(c.label) })] }, c.id));
                                                    }) }), document.body)] }), hasActiveFilters && ((0, jsx_runtime_1.jsx)("button", { type: "button", className: "vd-filter-reset vd-filter-reset-inline", "aria-label": (0, core_1.t)('Сбросить фильтры'), title: (0, core_1.t)('Сбросить фильтры'), onClick: resetFilters, children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("path", { d: "M2.5 7 a4.5 4.5 0 1 0 1.32-3.18" }), (0, jsx_runtime_1.jsx)("path", { d: "M2 2 L2 4.5 L4.5 4.5" })] }) })), (0, jsx_runtime_1.jsx)("div", { className: "vd-seg", role: "group", "aria-label": (0, core_1.t)('Метрика'), children: ['rub', 'pct'].map(m => ((0, jsx_runtime_1.jsx)("button", { type: "button", "aria-pressed": metric === m, className: metric === m ? 'on' : undefined, onClick: () => setMetric(m), children: m === 'rub' ? '₽' : '%' }, m))) }), (0, jsx_runtime_1.jsx)(InfoHint_1.InfoHintTopRight, { children: (0, jsx_runtime_1.jsxs)(InfoHint_1.InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [(0, jsx_runtime_1.jsxs)("div", { className: "hint-section", children: [(0, jsx_runtime_1.jsx)("div", { className: "hint-section-title", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0442\u0430\u0431\u043B\u0438\u0446\u0435\u0439" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Click" }), " \u2014 \u043A\u0440\u043E\u0441\u0441-\u0444\u0438\u043B\u044C\u0442\u0440"] }), showDetailModal && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Ctrl" }), "+", (0, jsx_runtime_1.jsx)("kbd", { children: "Click" }), " \u2014 \u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F"] })] })), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Esc" }), " \u2014 \u0437\u0430\u043A\u0440\u044B\u0442\u044C"] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Right Click" }), " \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "hint-section", children: [(0, jsx_runtime_1.jsx)("div", { className: "hint-section-title", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435\u043C" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("strong", { children: "\u00AB\u0421\u0440\u0430\u0432\u043D\u0438\u0442\u044C \u0441: \u2026\u00BB" }), " \u2014 \u0432\u044B\u0431\u043E\u0440 \u043F\u0440\u0435\u0441\u0435\u0442\u0430 (\u043F\u0440\u043E\u0448\u043B\u0430\u044F \u043D\u0435\u0434\u0435\u043B\u044F/\u043C\u0435\u0441\u044F\u0446/\u043A\u0432\u0430\u0440\u0442\u0430\u043B/\u0433\u043E\u0434 \u0438\u043B\u0438 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u043F\u0435\u0440\u0438\u043E\u0434 \u0442\u0430\u043A\u043E\u0439 \u0436\u0435 \u0434\u043B\u0438\u043D\u044B)."] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("strong", { children: "\u00AB\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0434\u0430\u0442\u044B\u00BB" }), " \u2014 \u0440\u0443\u0447\u043D\u043E\u0439 override: \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0434\u0432\u0430 RangePicker'\u0430 \u0434\u043B\u044F current/previous \u043F\u0435\u0440\u0438\u043E\u0434\u043E\u0432. \u041F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u0440\u0435\u0436\u0438\u043C \u0432 \u00ABCustom\u00BB."] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { className: "hi", children: "\u041F\u043E\u0434 dropdown'\u043E\u043C \u0432\u0441\u0435\u0433\u0434\u0430 \u0432\u0438\u0434\u043D\u0430 \u0441\u0442\u0440\u043E\u043A\u0430 \u0441 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u043C\u0438 \u0434\u0430\u0442\u0430\u043C\u0438 \u0442\u0435\u043A\u0443\u0449\u0435\u0433\u043E \u0438 \u0441\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u0435\u043C\u043E\u0433\u043E \u043F\u0435\u0440\u0438\u043E\u0434\u043E\u0432." })] })] }) })] })] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", className: `vd-compare-info${panelOpen ? ' on' : ''}${isManualOverride ? ' override' : ''}`, "aria-expanded": panelOpen, "aria-controls": "vd-range-panel", onClick: () => (panelOpen ? closeRangePanel() : openRangePanel()), title: (0, core_1.t)('Нажмите чтобы изменить даты'), children: [(0, jsx_runtime_1.jsx)("span", { className: "vd-compare-info-cal", "aria-hidden": "true", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [(0, jsx_runtime_1.jsx)("rect", { x: "2", y: "3.5", width: "12", height: "10", rx: "1.5" }), (0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "6.5", x2: "14", y2: "6.5" }), (0, jsx_runtime_1.jsx)("line", { x1: "5.5", y1: "2", x2: "5.5", y2: "4.5" }), (0, jsx_runtime_1.jsx)("line", { x1: "10.5", y1: "2", x2: "10.5", y2: "4.5" })] }) }), (0, jsx_runtime_1.jsxs)("span", { className: "vd-compare-info-line", children: [(0, jsx_runtime_1.jsxs)("span", { className: "vd-compare-info-label", children: [(0, core_1.t)('Текущий'), ":"] }), (0, jsx_runtime_1.jsx)("span", { className: "vd-compare-info-dates", children: resolvedCurrent ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, resolveRange_1.formatRangeDateRu)(resolvedCurrent.start), ' – ', (0, resolveRange_1.formatRangeDateRu)(resolvedCurrent.end)] })) : ('—') }), resolvedCurrent && ((0, jsx_runtime_1.jsxs)("span", { className: "vd-compare-info-dur", children: ["(", (0, resolveRange_1.rangeDurationDays)(resolvedCurrent), " ", (0, core_1.t)('дн'), ")"] }))] }), (0, jsx_runtime_1.jsxs)("span", { className: "vd-compare-info-line", children: [(0, jsx_runtime_1.jsx)("span", { className: "vd-compare-info-label", children: "vs" }), (0, jsx_runtime_1.jsx)("span", { className: "vd-compare-info-dates", children: resolvedPrevious ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, resolveRange_1.formatRangeDateRu)(resolvedPrevious.start), ' – ', (0, resolveRange_1.formatRangeDateRu)(resolvedPrevious.end)] })) : ('—') }), resolvedPrevious && ((0, jsx_runtime_1.jsxs)("span", { className: "vd-compare-info-dur", children: ["(", (0, resolveRange_1.rangeDurationDays)(resolvedPrevious), " ", (0, core_1.t)('дн'), ")"] }))] }), isResolvingCurrent && ((0, jsx_runtime_1.jsx)("span", { className: "vd-compare-info-loading", "aria-label": (0, core_1.t)('Резолв периода'), children: (0, jsx_runtime_1.jsx)(styles_1.InlineSpinnerLarge, { style: { width: 12, height: 12 }, "aria-hidden": "true" }) })), isManualOverride && ((0, jsx_runtime_1.jsxs)("span", { className: "vd-compare-info-locked", "aria-label": (0, core_1.t)('Локальная настройка чарта'), children: [(0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("rect", { x: "3", y: "6", width: "6", height: "4.5", rx: "0.8" }), (0, jsx_runtime_1.jsx)("path", { d: "M4.2 6 V4.5 a1.8 1.8 0 0 1 3.6 0 V6" })] }), (0, core_1.t)('Ручной выбор')] }))] }), panelOpen && RangePicker && (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)("div", { role: "presentation", onClick: (e) => {
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
                            }, children: (0, jsx_runtime_1.jsxs)("div", { id: "vd-range-panel", role: "dialog", "aria-modal": "true", "aria-label": (0, core_1.t)('Выбор диапазонов для сравнения'), onClick: (e) => e.stopPropagation(), style: {
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.2)',
                                    width: '100%',
                                    maxWidth: 480,
                                    maxHeight: '90vh',
                                    overflow: 'auto',
                                    padding: '16px 18px 18px',
                                    color: '#0F1114',
                                }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: 14,
                                        }, children: [(0, jsx_runtime_1.jsx)("h3", { style: {
                                                    fontFamily: 'Inter, system-ui, sans-serif',
                                                    fontSize: 16,
                                                    fontWeight: 700,
                                                    color: '#0F1114',
                                                    margin: 0,
                                                }, children: (0, core_1.t)('Период сравнения') }), (0, jsx_runtime_1.jsx)("button", { type: "button", "aria-label": (0, core_1.t)('Закрыть'), onClick: closeRangePanel, style: {
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
                                                }, children: (0, jsx_runtime_1.jsxs)("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'grid', gridTemplateColumns: '1fr', gap: 12 }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: 13, fontWeight: 600, color: '#0F1114' }, children: (0, core_1.t)('Текущий период') }), (0, jsx_runtime_1.jsx)(RangePicker, { value: pendingCurrent
                                                            ? [
                                                                (0, dayjs_1.default)(pendingCurrent[0]),
                                                                (0, dayjs_1.default)(pendingCurrent[1]),
                                                            ]
                                                            : null, onChange: (dates) => {
                                                            const arr = dates;
                                                            setPendingCurrent(arr
                                                                ? [
                                                                    arr[0].format('YYYY-MM-DD'),
                                                                    arr[1].format('YYYY-MM-DD'),
                                                                ]
                                                                : undefined);
                                                        }, format: "DD.MM.YYYY", popupClassName: "vd-rp-single", popupStyle: { zIndex: 10001 }, locale: ru_RU_1.default.DatePicker, allowClear: true })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: 13, fontWeight: 600, color: '#0F1114' }, children: (0, core_1.t)('Период для сравнения') }), (0, jsx_runtime_1.jsx)(RangePicker, { value: pendingPrevious
                                                            ? [
                                                                (0, dayjs_1.default)(pendingPrevious[0]),
                                                                (0, dayjs_1.default)(pendingPrevious[1]),
                                                            ]
                                                            : null, onChange: (dates) => {
                                                            const arr = dates;
                                                            setPendingPrevious(arr
                                                                ? [
                                                                    arr[0].format('YYYY-MM-DD'),
                                                                    arr[1].format('YYYY-MM-DD'),
                                                                ]
                                                                : undefined);
                                                        }, format: "DD.MM.YYYY", popupClassName: "vd-rp-single", popupStyle: { zIndex: 10001 }, locale: ru_RU_1.default.DatePicker, allowClear: true })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            gap: 8,
                                            marginTop: 16,
                                            paddingTop: 14,
                                            borderTop: '1px solid #E5E7EB',
                                        }, children: [isManualOverride && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: resetRangePanel, style: {
                                                    minHeight: 36,
                                                    padding: '0 14px',
                                                    background: 'transparent',
                                                    border: '1px solid #FCA5A5',
                                                    borderRadius: 8,
                                                    color: '#DC2626',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }, children: (0, core_1.t)('Сбросить') })), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: closeRangePanel, style: {
                                                    minHeight: 36,
                                                    padding: '0 14px',
                                                    background: 'transparent',
                                                    border: '1px solid #D1D5DB',
                                                    borderRadius: 8,
                                                    color: '#374151',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }, children: (0, core_1.t)('Отмена') }), (0, jsx_runtime_1.jsx)("button", { type: "button", disabled: !pendingCurrent || !pendingPrevious, onClick: applyRangePanel, style: {
                                                    minHeight: 36,
                                                    padding: '0 16px',
                                                    background: (!pendingCurrent || !pendingPrevious) ? '#9CA3AF' : '#2563EB',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    color: '#FFFFFF',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: (!pendingCurrent || !pendingPrevious) ? 'not-allowed' : 'pointer',
                                                }, children: (0, core_1.t)('Применить') })] })] }) }), document.body), dataState === 'stale' && ((0, jsx_runtime_1.jsx)("div", { role: "status", "aria-live": "polite", children: (0, jsx_runtime_1.jsxs)("span", { className: "vd-stale-badge", children: [(0, jsx_runtime_1.jsxs)("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "5", cy: "5", r: "3.5" }), (0, jsx_runtime_1.jsx)("path", { d: "M5 3 L5 5 L6.5 6" })] }), (0, core_1.t)('Данные устарели, обновите страницу')] }) })), dataState === 'partial' && partialWarning && ((0, jsx_runtime_1.jsxs)("div", { className: "vd-partial-badge", role: "status", "aria-live": "polite", children: [(0, jsx_runtime_1.jsx)(IconWarning, {}), (0, jsx_runtime_1.jsx)("span", { children: partialWarning.message })] })), showSummaryStrip && ((0, jsx_runtime_1.jsxs)("div", { className: "vd-summary", role: "group", "aria-label": (0, core_1.t)('Сводка'), children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-sm-l", children: (0, core_1.t)('Текущий период') }), (0, jsx_runtime_1.jsx)("div", { className: "vd-sm-v", children: (0, formatRussian_1.fmtByMetric)(summary.totalCurr, metric) }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-sm-d", children: [summary.storesCount, " ", (0, core_1.t)('магазинов')] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-sm-l", children: (0, core_1.t)('Прошлый период') }), (0, jsx_runtime_1.jsx)("div", { className: "vd-sm-v", children: (0, formatRussian_1.fmtByMetric)(summary.totalPrev, metric) }), (0, jsx_runtime_1.jsx)("div", { className: "vd-sm-d", children: (0, core_1.t)('для сравнения') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-sm-l", children: (0, core_1.t)('Темп сети') }), (0, jsx_runtime_1.jsx)("div", { className: `vd-sm-v ${netCls}`, children: netTempoText }), (0, jsx_runtime_1.jsx)("div", { className: "vd-sm-d", children: netPctText })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-sm-l", children: (0, core_1.t)('Магазинов ×>1.5') }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-sm-v dn", children: [summary.growCount, (0, jsx_runtime_1.jsx)("span", { className: "vd-u", children: (0, core_1.t)('маг.') })] }), (0, jsx_runtime_1.jsx)("div", { className: "vd-sm-d", children: (0, core_1.t)('потери выросли в 1.5+ раз') })] })] })), showCumulativeBlock && showCumulativeView ? ((0, jsx_runtime_1.jsx)(CumulativeView, { stores: cumulativeStores, metric: metric, palette: palette })) : ((0, jsx_runtime_1.jsxs)("div", { className: "vd-table-wrap", role: "table", "aria-label": (0, core_1.t)('Таблица магазинов по темпу'), style: { position: 'relative' }, children: [isRefreshing && (0, jsx_runtime_1.jsx)(styles_1.RefreshBar, {}), (0, jsx_runtime_1.jsxs)("div", { className: "vd-table-head", role: "row", children: [(0, jsx_runtime_1.jsx)("div", { className: "vd-th center", role: "columnheader", children: "\u2116" }), (0, jsx_runtime_1.jsxs)("button", { type: "button", className: `vd-th sortable${sortBy === 'name' ? ' sorted' : ''}`, role: "columnheader", "aria-sort": sortBy === 'name'
                                                ? sortDir === 'asc'
                                                    ? 'ascending'
                                                    : 'descending'
                                                : 'none', onClick: () => toggleSort('name', 'asc'), children: [(0, core_1.t)('Магазин'), sortBy === 'name' && (0, jsx_runtime_1.jsx)(SortArrow, { dir: sortDir })] }), (0, jsx_runtime_1.jsx)("div", { className: "vd-th right", role: "columnheader", children: (0, core_1.t)('Было') }), (0, jsx_runtime_1.jsx)("div", { className: "vd-th center", role: "columnheader", children: (0, core_1.t)('Изменение (темп)') }), (0, jsx_runtime_1.jsx)("div", { className: "vd-th right", role: "columnheader", children: (0, core_1.t)('Стало') }), (0, jsx_runtime_1.jsxs)("button", { type: "button", className: `vd-th right sortable${sortBy === 'tempo' ? ' sorted' : ''}`, role: "columnheader", "aria-sort": sortBy === 'tempo'
                                                ? sortDir === 'asc'
                                                    ? 'ascending'
                                                    : 'descending'
                                                : 'none', onClick: () => toggleSort('tempo', 'desc'), children: [(0, core_1.t)('Темп'), sortBy === 'tempo' && (0, jsx_runtime_1.jsx)(SortArrow, { dir: sortDir })] }), (0, jsx_runtime_1.jsx)("div", { className: "vd-th", role: "columnheader", children: (0, core_1.t)('Тренд 12 нед') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-table-body", style: {
                                        opacity: isRefreshing ? 0.55 : 1,
                                        transition: 'opacity 0.15s ease',
                                        pointerEvents: isRefreshing ? 'none' : 'auto',
                                    }, children: [isInitialLoading && ((0, jsx_runtime_1.jsxs)("div", { className: "vd-state", role: "status", "aria-live": "polite", children: [(0, jsx_runtime_1.jsx)(styles_1.InlineSpinnerLarge, { "aria-label": (0, core_1.t)('Загрузка') }), (0, jsx_runtime_1.jsx)("div", { className: "vd-state-message", children: (0, core_1.t)('Загрузка…') })] })), !isInitialLoading && fetchError && ((0, jsx_runtime_1.jsxs)("div", { className: "vd-state error", role: "alert", children: [(0, jsx_runtime_1.jsx)(IconError, {}), (0, jsx_runtime_1.jsx)("div", { className: "vd-state-message", children: fetchError }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "vd-state-action", onClick: () => setCurrentPage(p => p), children: (0, core_1.t)('Повторить') })] })), !isInitialLoading && !fetchError && pagedStores.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "vd-state", role: "status", children: [(0, jsx_runtime_1.jsx)(IconEmpty, {}), (0, jsx_runtime_1.jsx)("div", { className: "vd-state-message", children: (0, core_1.t)('Ничего не найдено по заданным фильтрам.') })] })), !isInitialLoading && !fetchError && pagedStores.map((x, i) => ((0, jsx_runtime_1.jsx)(TableRow, { index: currentPage * pageSize + i, x: x, metric: metric, tempoToPct: tempoToPct, palette: palette, isCrossSelected: crossFilter.has(x.store.id), isDimmed: crossFilter.size > 0 && !crossFilter.has(x.store.id), onClick: e => handleRowClick(e, x.store), onDoubleClick: () => {
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
                            return ((0, jsx_runtime_1.jsxs)(styles_1.PaginationWrap, { style: {
                                    opacity: isRefreshing ? 0.5 : 1,
                                    pointerEvents: isRefreshing ? 'none' : 'auto',
                                    transition: 'opacity 0.15s ease',
                                }, role: "navigation", "aria-label": (0, core_1.t)('Постраничная навигация'), children: [(0, jsx_runtime_1.jsx)(styles_1.PageBtn, { type: "button", "aria-label": (0, core_1.t)('Предыдущая страница'), disabled: isRefreshing || currentPage === 0, onClick: () => setCurrentPage(p => Math.max(0, p - 1)), children: "\u2039" }), totalPages != null
                                        ? getPageNumbers(currentPage, totalPages).map((item, idx) => item === '...' ? ((0, jsx_runtime_1.jsx)(styles_1.PageEllipsis, { children: "\u2026" }, `e${idx}`)) : ((0, jsx_runtime_1.jsx)(styles_1.PageBtn, { type: "button", isActive: item === cur1, "aria-label": `${(0, core_1.t)('Страница')} ${item}`, "aria-current": item === cur1 ? 'page' : undefined, disabled: isRefreshing, onClick: () => setCurrentPage(item - 1), children: item }, item)))
                                        : /* server-mode без exact count: показываем «N+». */
                                            [
                                                (0, jsx_runtime_1.jsx)(styles_1.PageBtn, { type: "button", isActive: true, "aria-current": "page", disabled: isRefreshing, children: cur1 }, "cur"),
                                                (0, jsx_runtime_1.jsx)(styles_1.PageEllipsis, { children: "\u2026" }, "ell"),
                                            ], (0, jsx_runtime_1.jsx)(styles_1.PageBtn, { type: "button", "aria-label": (0, core_1.t)('Следующая страница'), disabled: isRefreshing ||
                                            (totalPages != null
                                                ? currentPage >= totalPages - 1
                                                : !serverHasNext), onClick: () => setCurrentPage(p => p + 1), children: "\u203A" }), totalPages != null && totalPages > 7 && ((0, jsx_runtime_1.jsx)(styles_1.PageInput, { type: "number", min: 1, max: totalPages, placeholder: "\u2116", "aria-label": (0, core_1.t)('Перейти на страницу'), disabled: isRefreshing, onKeyDown: (e) => {
                                            if (e.key === 'Enter') {
                                                const val = parseInt(e.target.value, 10);
                                                if (val >= 1 && val <= totalPages) {
                                                    setCurrentPage(val - 1);
                                                    e.target.value = '';
                                                }
                                            }
                                        } }))] }));
                        })(), (0, jsx_runtime_1.jsx)("div", { className: "vd-footer", children: (0, jsx_runtime_1.jsxs)("div", { className: "vd-hint", children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-legend-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "vd-sw", style: { background: palette.dn }, "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { children: (0, core_1.t)('рост потерь') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "vd-legend-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "vd-sw", style: { background: palette.up }, "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { children: (0, core_1.t)('снижение') })] })] }) })] }) }), tooltip && typeof document !== 'undefined' &&
                (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)(styles_1.TooltipRoot, { "data-theme": tooltip.theme, "data-visible": "true", style: { left: tooltip.x, top: tooltip.y }, children: tooltip.html }), document.body), showDetailModal && detailStoreId && typeof document !== 'undefined' &&
                (() => {
                    // В server-mode искать сначала в serverStores (current page), потом
                    // в inputStores (mock/initial). В mock-mode наоборот.
                    const store = (isServerPagingActive
                        ? serverStores.find(s => s.id === detailStoreId)
                        : inputStores.find(s => s.id === detailStoreId)) ??
                        inputStores.find(s => s.id === detailStoreId);
                    if (!store)
                        return null;
                    return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)(DetailModal_1.default, { store: store, metric: metric, comparisonMode: comparisonMode, theme: theme, palette: palette, onClose: () => setDetailStoreId(null) }), document.body);
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
    /* Тренд опционален: backend может не отдать (если weekCol не задан). */
    const weeks = (metric === 'rub' ? store.trendRub : store.trendPct) ?? [];
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
    return ((0, jsx_runtime_1.jsxs)("div", { className: "vd-cum-wrap visible", children: [(0, jsx_runtime_1.jsxs)("div", { className: "vd-cum-title", children: [(0, jsx_runtime_1.jsx)("span", { children: (0, core_1.t)('Кумулятивные потери с начала периода') }), (0, jsx_runtime_1.jsx)("span", { className: "vd-right", children: stores.length
                            ? `${(0, core_1.t)('Топ')}-${stores.length} ${(0, core_1.t)('магазинов')}`
                            : '' })] }), (0, jsx_runtime_1.jsx)("div", { className: "vd-cum-chart", children: !hasTrend ? ((0, jsx_runtime_1.jsx)("div", { style: {
                        padding: '24px',
                        textAlign: 'center',
                        color: palette.g600,
                        fontFamily: palette.fontText,
                        fontSize: 13,
                    }, children: (0, core_1.t)('Тренд недоступен — добавьте колонку «Неделя» в настройках чарта, ' +
                        'чтобы увидеть накопленные потери по периодам.') })) : ((0, jsx_runtime_1.jsxs)("svg", { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "xMidYMid meet", width: "100%", height: h, role: "img", "aria-label": (0, core_1.t)('Кумулятивные потери по топ-10 магазинам'), children: [(0, jsx_runtime_1.jsx)("line", { x1: padL, y1: h - padB, x2: w - padR, y2: h - padB, stroke: palette.g200, strokeWidth: "1" }), (0, jsx_runtime_1.jsx)("line", { x1: padL, y1: padT, x2: padL, y2: h - padB, stroke: palette.g200, strokeWidth: "1" }), Array.from({ length: Math.min(6, trendLen) }, (_, k) => {
                            const step = (trendLen - 1) / Math.max(1, Math.min(5, trendLen - 1));
                            return Math.round(k * step);
                        }).map(i => ((0, jsx_runtime_1.jsxs)("text", { x: sx(i), y: h - 10, fontFamily: palette.fontMono, fontSize: "11", fill: palette.g600, textAnchor: "middle", children: ["\u041D", i + 1] }, i))), cumData.map((cum, si) => {
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
                            return ((0, jsx_runtime_1.jsxs)("g", { children: [(0, jsx_runtime_1.jsx)("polyline", { points: pts, fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), (0, jsx_runtime_1.jsx)("circle", { cx: lx, cy: ly, r: "3", fill: color, stroke: palette.s, strokeWidth: "1.5" }), (0, jsx_runtime_1.jsx)("text", { x: lx + 8, y: ly + 4, fontFamily: palette.fontMono, fontSize: "11", fontWeight: "600", fill: color, children: label })] }, stores[si]?.id ?? si));
                        })] })) })] }));
};
exports.default = VelocityDiverging;
//# sourceMappingURL=VelocityDiverging.js.map