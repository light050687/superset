"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HeatmapPivot;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const thresholds_1 = require("./utils/thresholds");
/**
 * DS 2.0 §07 / WCAG 1.4.1: цвет ≠ единственный индикатор.
 * Иконка-символ в углу ячейки — второй канал кодирования статуса.
 */
function StatusIcon({ status }) {
    if (status === 'nd')
        return null;
    if (status === 'ok') {
        // ✓ Galочка — норма
        return ((0, jsx_runtime_1.jsx)("svg", { className: "status-icon", viewBox: "0 0 8 8", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M1.5 4 L3.2 5.7 L6.5 2.3" }) }));
    }
    if (status === 'wn') {
        // △ Открытый треугольник — внимание
        return ((0, jsx_runtime_1.jsx)("svg", { className: "status-icon", viewBox: "0 0 8 8", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M4 1 L7 7 L1 7 Z" }) }));
    }
    // dn: ▲ Заполненный треугольник — превышение
    return ((0, jsx_runtime_1.jsx)("svg", { className: "status-icon", viewBox: "0 0 8 8", fill: "currentColor", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M4 1 L7 7 L1 7 Z" }) }));
}
const formatRussian_1 = require("./utils/formatRussian");
const styles_1 = require("./styles");
const DrillModal_1 = require("./DrillModal");
const CompareModal_1 = require("./CompareModal");
function formatValue(cell, unit, suffix, decimals, auto) {
    if (!cell)
        return '—';
    if (unit === 'pct') {
        if (cell.pct == null)
            return '—';
        return (0, formatRussian_1.formatRussianPercent)(cell.pct, decimals);
    }
    if (auto)
        return (0, formatRussian_1.formatRussianSmartEx)(cell.value, decimals, suffix);
    return `${cell.value.toFixed(decimals)}${suffix ? ` ${suffix}` : ''}`;
}
function formatTotals(slice, unit, suffix, decimals, auto) {
    if (!slice)
        return '—';
    if (unit === 'pct') {
        if (slice.pct == null)
            return '—';
        return (0, formatRussian_1.formatRussianPercent)(slice.pct, decimals);
    }
    if (auto)
        return (0, formatRussian_1.formatRussianSmartEx)(slice.fact, decimals, suffix);
    return `${slice.fact.toFixed(decimals)}${suffix ? ` ${suffix}` : ''}`;
}
const INITIAL_TOOLTIP = {
    show: false,
    x: 0,
    y: 0,
    title: '',
    status: 'ok',
    rows: [],
};
const INITIAL_PROFILE = {
    show: false,
    x: 0,
    y: 0,
    title: '',
    rows: [],
};
function HeatmapPivot(props) {
    const { width, height, rows: rowsRaw, cols, cells, rowTotals, colTotals, grandTotal, thresholds, defaultUnit, unitSuffix, decimals, autoFormatRussian, showTotalsDefault, headerText, headerSubtitle, emitFilter, setDataMask, drillQueryParams, mockMode, dataState, errorMessage, } = props;
    const rowAxisColName = drillQueryParams?.rowAxisCol ?? '';
    const colAxisColName = drillQueryParams?.colAxisCol ?? '';
    // ── Local state ──
    const [unit, setUnit] = (0, react_1.useState)(defaultUnit);
    const [showTotals, setShowTotals] = (0, react_1.useState)(showTotalsDefault);
    const [sortColId, setSortColId] = (0, react_1.useState)(null);
    const [sortDir, setSortDir] = (0, react_1.useState)('desc');
    // Filters (one-shot semantics: any new selection clears the others)
    const [rowFilter, setRowFilter] = (0, react_1.useState)(null);
    const [colFilter, setColFilter] = (0, react_1.useState)(null);
    const [cellFilter, setCellFilter] = (0, react_1.useState)(null);
    // Compare / Drill
    const [compareA, setCompareA] = (0, react_1.useState)(null);
    const [compareB, setCompareB] = (0, react_1.useState)(null);
    const [compareOpen, setCompareOpen] = (0, react_1.useState)(false);
    const [drillTarget, setDrillTarget] = (0, react_1.useState)(null);
    // Tooltip / popover
    const [tooltip, setTooltip] = (0, react_1.useState)(INITIAL_TOOLTIP);
    const [profile, setProfile] = (0, react_1.useState)(INITIAL_PROFILE);
    // Theme (follow Superset body attribute if present)
    const [theme, setTheme] = (0, react_1.useState)(() => {
        if (typeof document === 'undefined')
            return 'dark';
        return document.body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    });
    (0, react_1.useEffect)(() => {
        const obs = new MutationObserver(() => {
            const v = document.body.getAttribute('data-theme');
            setTheme(v === 'light' ? 'light' : 'dark');
        });
        obs.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
        return () => obs.disconnect();
    }, []);
    // ── Derived: sorted rows ──
    const rows = (0, react_1.useMemo)(() => {
        if (!sortColId)
            return rowsRaw;
        const out = [...rowsRaw];
        out.sort((a, b) => {
            const ca = cells.get(`${a.id}|${sortColId}`);
            const cb = cells.get(`${b.id}|${sortColId}`);
            if (!ca && !cb)
                return 0;
            if (!ca)
                return 1;
            if (!cb)
                return -1;
            const va = unit === 'pct' ? (ca.pct ?? 0) : ca.value;
            const vb = unit === 'pct' ? (cb.pct ?? 0) : cb.value;
            return sortDir === 'asc' ? va - vb : vb - va;
        });
        return out;
    }, [rowsRaw, sortColId, sortDir, unit, cells]);
    // ── Row/col hover highlight state ──
    const [hoverRow, setHoverRow] = (0, react_1.useState)(null);
    const [hoverCol, setHoverCol] = (0, react_1.useState)(null);
    // ── Cross-filter emission ──
    const emitMask = (0, react_1.useCallback)((payload) => {
        if (!emitFilter || !setDataMask)
            return;
        if (!payload) {
            setDataMask({ extraFormData: { filters: [] }, filterState: { value: null } });
            return;
        }
        setDataMask(payload);
    }, [emitFilter, setDataMask]);
    const applyCellCrossFilter = (0, react_1.useCallback)((rowId, colId) => {
        if (!rowAxisColName || !colAxisColName)
            return;
        emitMask({
            extraFormData: {
                filters: [
                    { col: rowAxisColName, op: 'IN', val: [rowId] },
                    { col: colAxisColName, op: 'IN', val: [colId] },
                ],
            },
            filterState: {
                value: `${rowId}|${colId}`,
                selectedValues: [rowId, colId],
            },
        });
    }, [emitMask, rowAxisColName, colAxisColName]);
    const applyAxisCrossFilter = (0, react_1.useCallback)((axis, value) => {
        const col = axis === 'row' ? rowAxisColName : colAxisColName;
        if (!col)
            return;
        emitMask({
            extraFormData: { filters: [{ col, op: 'IN', val: [value] }] },
            filterState: { value, selectedValues: [value] },
        });
    }, [emitMask, rowAxisColName, colAxisColName]);
    // ── Actions ──
    const toggleSort = (0, react_1.useCallback)((colId) => {
        if (sortColId === colId) {
            if (sortDir === 'desc')
                setSortDir('asc');
            else {
                setSortColId(null);
                setSortDir('desc');
            }
        }
        else {
            setSortColId(colId);
            setSortDir('desc');
        }
    }, [sortColId, sortDir]);
    const addToCompare = (0, react_1.useCallback)((item) => {
        const same = (x, y) => {
            if (!x || x.type !== y.type)
                return false;
            if (y.type === 'cell')
                return x.rowId === y.rowId && x.colId === y.colId;
            if (y.type === 'row')
                return x.rowId === y.rowId;
            if (y.type === 'col')
                return x.colId === y.colId;
            return false;
        };
        if (compareA && compareA.type !== item.type) {
            setCompareA(item);
            setCompareB(null);
            return;
        }
        if (!compareA) {
            setCompareA(item);
            return;
        }
        if (same(compareA, item)) {
            setCompareA(compareB);
            setCompareB(null);
            return;
        }
        if (!compareB) {
            setCompareB(item);
            setCompareOpen(true);
            return;
        }
        if (same(compareB, item)) {
            setCompareB(null);
            return;
        }
        setCompareA(item);
        setCompareB(null);
    }, [compareA, compareB]);
    const closeCompare = (0, react_1.useCallback)(() => {
        setCompareOpen(false);
        setCompareA(null);
        setCompareB(null);
    }, []);
    const clearAllFilters = (0, react_1.useCallback)(() => {
        setRowFilter(null);
        setColFilter(null);
        setCellFilter(null);
        emitMask(null);
    }, [emitMask]);
    // ── Click handlers ──
    const onCellClick = (0, react_1.useCallback)((e, row, col) => {
        const cell = cells.get(`${row.id}|${col.id}`);
        if (!cell)
            return;
        if (e.ctrlKey || e.metaKey) {
            setDrillTarget({ type: 'cell', rowId: row.id, colId: col.id });
            return;
        }
        if (e.shiftKey) {
            addToCompare({ type: 'cell', rowId: row.id, colId: col.id });
            return;
        }
        const same = cellFilter && cellFilter.rowId === row.id && cellFilter.colId === col.id;
        if (same) {
            setCellFilter(null);
            emitMask(null);
        }
        else {
            setCellFilter({ rowId: row.id, colId: col.id });
            setRowFilter(null);
            setColFilter(null);
            applyCellCrossFilter(row.id, col.id);
        }
    }, [cells, cellFilter, addToCompare, applyCellCrossFilter, emitMask]);
    const onRowHeaderClick = (0, react_1.useCallback)((e, row) => {
        if (e.shiftKey) {
            addToCompare({ type: 'row', rowId: row.id });
            return;
        }
        if (rowFilter === row.id) {
            setRowFilter(null);
            emitMask(null);
        }
        else {
            setRowFilter(row.id);
            setColFilter(null);
            setCellFilter(null);
            applyAxisCrossFilter('row', row.id);
        }
    }, [rowFilter, addToCompare, applyAxisCrossFilter, emitMask]);
    const onColHeaderClick = (0, react_1.useCallback)((e, col) => {
        if (e.shiftKey) {
            addToCompare({ type: 'col', colId: col.id });
            return;
        }
        toggleSort(col.id);
    }, [toggleSort, addToCompare]);
    const onColHeaderDblClick = (0, react_1.useCallback)((e, col) => {
        e.preventDefault();
        if (colFilter === col.id) {
            setColFilter(null);
            emitMask(null);
        }
        else {
            setColFilter(col.id);
            setRowFilter(null);
            setCellFilter(null);
            applyAxisCrossFilter('col', col.id);
        }
    }, [colFilter, applyAxisCrossFilter, emitMask]);
    // ── Tooltip / Popover positioning ──
    // DS 2.0 §08: «Offset: 8px от курсора»
    const positionNear = (0, react_1.useCallback)((x, y, pad = 8) => {
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
        const w = 260;
        const h = 180;
        let nx = x + pad;
        let ny = y + pad;
        if (nx + w > vw - 8)
            nx = x - w - pad;
        if (ny + h > vh - 8)
            ny = y - h - pad;
        return { x: nx, y: ny };
    }, []);
    const onCellEnter = (0, react_1.useCallback)((e, row, col) => {
        setHoverRow(row.id);
        setHoverCol(col.id);
        const cell = cells.get(`${row.id}|${col.id}`);
        if (!cell)
            return;
        const st = (0, thresholds_1.cellStatus)(cell, thresholds);
        if (st === 'nd')
            return;
        const pos = positionNear(e.clientX, e.clientY);
        const rows = [
            { label: 'Факт', value: (0, formatRussian_1.formatRussianSmartEx)(cell.value, decimals, unitSuffix) },
        ];
        if (cell.pct != null) {
            rows.push({ label: '% от знаменателя', value: (0, formatRussian_1.formatRussianPercent)(cell.pct, decimals) });
        }
        if (cell.planPct != null) {
            rows.push({ label: 'План, %', value: (0, formatRussian_1.formatRussianPercent)(cell.planPct, decimals) });
        }
        rows.push({ label: 'Статус', value: thresholds_1.STATUS_LABEL[st] });
        if (cell.shops != null) {
            rows.push({ label: 'Магазинов', value: (0, formatRussian_1.formatRussianInt)(cell.shops) });
        }
        setTooltip({
            show: true,
            x: pos.x,
            y: pos.y,
            title: `${row.name} · ${col.name}`,
            status: st,
            rows,
        });
    }, [cells, thresholds, decimals, unitSuffix, positionNear]);
    const onCellMove = (0, react_1.useCallback)((e) => {
        setTooltip((t) => {
            if (!t.show)
                return t;
            const pos = positionNear(e.clientX, e.clientY);
            return { ...t, x: pos.x, y: pos.y };
        });
    }, [positionNear]);
    const onCellLeave = (0, react_1.useCallback)(() => {
        setHoverRow(null);
        setHoverCol(null);
        setTooltip(INITIAL_TOOLTIP);
    }, []);
    // Col header hover = column profile
    const onColHeaderEnter = (0, react_1.useCallback)((e, col) => {
        const prof = colTotals.get(col.id);
        if (!prof || prof.fact === 0)
            return;
        const pos = positionNear(e.clientX, e.clientY, 14);
        const rows = [
            { label: 'Сумма', value: (0, formatRussian_1.formatRussianSmartEx)(prof.fact, decimals, unitSuffix) },
        ];
        if (prof.pct != null) {
            rows.push({ label: '% от знаменателя', value: (0, formatRussian_1.formatRussianPercent)(prof.pct, decimals) });
        }
        if (prof.ratio != null) {
            const st = (0, thresholds_1.totalsStatus)(prof, thresholds);
            rows.push({
                label: 'Ratio факт/план',
                value: prof.ratio.toFixed(2),
                color: st === 'ok' ? 'var(--up)' : st === 'dn' ? 'var(--dn)' : st === 'wn' ? 'var(--wn)' : undefined,
            });
        }
        setProfile({ show: true, x: pos.x, y: pos.y, title: col.name, rows });
    }, [colTotals, decimals, unitSuffix, thresholds, positionNear]);
    const onRowHeaderEnter = (0, react_1.useCallback)((e, row) => {
        const prof = rowTotals.get(row.id);
        if (!prof || prof.fact === 0)
            return;
        const pos = positionNear(e.clientX, e.clientY, 14);
        const rows = [
            { label: 'Сумма', value: (0, formatRussian_1.formatRussianSmartEx)(prof.fact, decimals, unitSuffix) },
        ];
        if (prof.pct != null) {
            rows.push({ label: '% от знаменателя', value: (0, formatRussian_1.formatRussianPercent)(prof.pct, decimals) });
        }
        if (prof.ratio != null) {
            const st = (0, thresholds_1.totalsStatus)(prof, thresholds);
            rows.push({
                label: 'Ratio факт/план',
                value: prof.ratio.toFixed(2),
                color: st === 'ok' ? 'var(--up)' : st === 'dn' ? 'var(--dn)' : st === 'wn' ? 'var(--wn)' : undefined,
            });
        }
        setProfile({ show: true, x: pos.x, y: pos.y, title: row.name, rows });
    }, [rowTotals, decimals, unitSuffix, thresholds, positionNear]);
    const onHeaderLeave = (0, react_1.useCallback)(() => {
        setProfile(INITIAL_PROFILE);
    }, []);
    const onHeaderMove = (0, react_1.useCallback)((e) => {
        setProfile((p) => {
            if (!p.show)
                return p;
            const pos = positionNear(e.clientX, e.clientY, 14);
            return { ...p, x: pos.x, y: pos.y };
        });
    }, [positionNear]);
    // ── Escape key cascade: modal → compare → filter ──
    (0, react_1.useEffect)(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape')
                return;
            if (drillTarget) {
                setDrillTarget(null);
                return;
            }
            if (compareOpen) {
                closeCompare();
                return;
            }
            if (compareA || compareB) {
                setCompareA(null);
                setCompareB(null);
                return;
            }
            if (rowFilter || colFilter || cellFilter) {
                clearAllFilters();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [drillTarget, compareOpen, compareA, compareB, rowFilter, colFilter, cellFilter, clearAllFilters, closeCompare]);
    // ── Breadcrumbs ──
    const breadcrumbChips = [];
    if (rowFilter) {
        const r = rowsRaw.find((x) => x.id === rowFilter);
        if (r)
            breadcrumbChips.push(r.name);
    }
    if (colFilter) {
        const c = cols.find((x) => x.id === colFilter);
        if (c)
            breadcrumbChips.push(c.name);
    }
    if (cellFilter) {
        const r = rowsRaw.find((x) => x.id === cellFilter.rowId);
        const c = cols.find((x) => x.id === cellFilter.colId);
        if (r && c)
            breadcrumbChips.push(`${r.name} × ${c.name}`);
    }
    // ── Early returns for non-populated states ──
    if (dataState === 'loading') {
        /* DS 2.0 §08: aria-busy="true" + skeleton */
        return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { "data-theme": theme, className: styles_1.ROOT_CLASS, width: width, height: height, "aria-busy": "true", "aria-live": "polite", children: [(0, jsx_runtime_1.jsx)("style", { children: styles_1.KEYFRAMES_CSS }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { children: [(0, jsx_runtime_1.jsx)(styles_1.Header, { children: (0, jsx_runtime_1.jsx)(styles_1.TitleBlock, { children: (0, jsx_runtime_1.jsx)(styles_1.Title, { children: headerText }) }) }), (0, jsx_runtime_1.jsxs)(styles_1.SkeletonGrid, { children: [(0, jsx_runtime_1.jsx)("div", { className: "sk hdr" }), (0, jsx_runtime_1.jsx)("div", { className: "sk hdr" }), (0, jsx_runtime_1.jsx)("div", { className: "sk hdr" }), (0, jsx_runtime_1.jsx)("div", { className: "sk hdr" }), (0, jsx_runtime_1.jsx)("div", { className: "sk hdr" }), (0, jsx_runtime_1.jsx)("div", { className: "sk hdr" }), Array.from({ length: 25 }).map((_, i) => (0, jsx_runtime_1.jsx)("div", { className: "sk" }, i))] })] })] }));
    }
    if (dataState === 'error') {
        return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { "data-theme": theme, className: styles_1.ROOT_CLASS, width: width, height: height, children: [(0, jsx_runtime_1.jsx)("style", { children: styles_1.KEYFRAMES_CSS }), (0, jsx_runtime_1.jsx)(styles_1.Card, { children: (0, jsx_runtime_1.jsx)(styles_1.StateOverlay, { role: "alert", children: errorMessage ?? 'Произошла ошибка при загрузке данных' }) })] }));
    }
    if (dataState === 'empty' && cells.size === 0) {
        return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { "data-theme": theme, className: styles_1.ROOT_CLASS, width: width, height: height, children: [(0, jsx_runtime_1.jsx)("style", { children: styles_1.KEYFRAMES_CSS }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { children: [(0, jsx_runtime_1.jsx)(styles_1.Header, { children: (0, jsx_runtime_1.jsx)(styles_1.TitleBlock, { children: (0, jsx_runtime_1.jsx)(styles_1.Title, { children: headerText }) }) }), (0, jsx_runtime_1.jsx)(styles_1.StateOverlay, { children: errorMessage ?? 'Нет данных за выбранный период' })] })] }));
    }
    // ── Render ──
    const isPartial = dataState === 'partial';
    const isStale = dataState === 'stale';
    return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { "data-theme": theme, className: styles_1.ROOT_CLASS, width: width, height: height, children: [(0, jsx_runtime_1.jsx)("style", { children: styles_1.KEYFRAMES_CSS }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { style: { position: 'relative' }, children: [isStale && (0, jsx_runtime_1.jsx)(styles_1.StaleBar, { "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)(styles_1.Header, { children: [(0, jsx_runtime_1.jsxs)(styles_1.TitleBlock, { children: [(0, jsx_runtime_1.jsxs)(styles_1.Title, { children: [headerText, isPartial && ((0, jsx_runtime_1.jsx)(styles_1.PartialBadge, { title: "\u0427\u0430\u0441\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0445 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430", children: "\u0427\u0430\u0441\u0442\u0438\u0447\u043D\u043E" }))] }), (0, jsx_runtime_1.jsxs)(styles_1.Breadcrumbs, { role: "navigation", "aria-label": "\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0444\u0438\u043B\u044C\u0442\u0440\u043E\u0432", children: [(0, jsx_runtime_1.jsx)(styles_1.BreadcrumbCurrent, { children: headerSubtitle }), breadcrumbChips.length > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(styles_1.BreadcrumbDot, { children: "\u00B7" }), (0, jsx_runtime_1.jsx)(styles_1.BreadcrumbCurrent, { children: "\u0424\u0438\u043B\u044C\u0442\u0440:" }), breadcrumbChips.map((chip, i) => ((0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)(styles_1.BreadcrumbSel, { children: chip }), i < breadcrumbChips.length - 1 && ((0, jsx_runtime_1.jsx)(styles_1.BreadcrumbPlus, { children: "+" }))] }, chip))), (0, jsx_runtime_1.jsx)(styles_1.BreadcrumbBack, { type: "button", onClick: clearAllFilters, "aria-label": "\u0421\u043D\u044F\u0442\u044C \u0432\u0441\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B", title: "\u0421\u043D\u044F\u0442\u044C (Esc)", children: "\u00D7" })] }))] })] }), (0, jsx_runtime_1.jsxs)(styles_1.Controls, { children: [(0, jsx_runtime_1.jsxs)(styles_1.Unit, { role: "tablist", "aria-label": "\u0415\u0434\u0438\u043D\u0438\u0446\u044B \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u044F", children: [(0, jsx_runtime_1.jsx)(styles_1.UnitButton, { type: "button", on: unit === 'abs', onClick: () => setUnit('abs'), "aria-pressed": unit === 'abs', title: "\u0410\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435", children: unitSuffix.includes('₽') ? '₽' : 'Σ' }), (0, jsx_runtime_1.jsx)(styles_1.UnitButton, { type: "button", on: unit === 'pct', onClick: () => setUnit('pct'), "aria-pressed": unit === 'pct', title: "\u041F\u0440\u043E\u0446\u0435\u043D\u0442", children: "%" })] }), (0, jsx_runtime_1.jsxs)(styles_1.Chip, { type: "button", on: showTotals, onClick: () => setShowTotals((v) => !v), "aria-pressed": showTotals, title: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0441\u0442\u0440\u043E\u043A\u0443 \u0438 \u043A\u043E\u043B\u043E\u043D\u043A\u0443 \u0438\u0442\u043E\u0433\u043E\u0432", children: [(0, jsx_runtime_1.jsx)("span", { className: "sigma", children: "\u03A3" }), (0, jsx_runtime_1.jsx)("span", { children: "\u0418\u0442\u043E\u0433\u0438" })] })] })] }), (0, jsx_runtime_1.jsx)(styles_1.PivotWrap, { children: (0, jsx_runtime_1.jsxs)(styles_1.Pivot, { role: "grid", "aria-label": headerText, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "corner", scope: "col", "aria-label": "\u0424\u043E\u0440\u043C\u0430\u0442" }), cols.map((col) => {
                                                const sorted = col.id === sortColId;
                                                const arrow = sorted ? (sortDir === 'desc' ? '▾' : '▴') : '';
                                                const className = [
                                                    sorted ? 'sorted' : '',
                                                    col.id === colFilter ? 'filtered' : '',
                                                    col.id === hoverCol && !showTotals ? 'col-hl' : '',
                                                ].filter(Boolean).join(' ');
                                                return ((0, jsx_runtime_1.jsxs)("th", { scope: "col", className: className, onClick: (e) => onColHeaderClick(e, col), onDoubleClick: (e) => onColHeaderDblClick(e, col), onMouseEnter: (e) => onColHeaderEnter(e, col), onMouseLeave: onHeaderLeave, onMouseMove: onHeaderMove, tabIndex: 0, title: "\u041A\u043B\u0438\u043A \u2014 \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430 \u00B7 \u0434\u0432. \u043A\u043B\u0438\u043A \u2014 \u0444\u0438\u043B\u044C\u0442\u0440 \u00B7 \u21E7 \u043A\u043B\u0438\u043A \u2014 \u0441\u0440\u0430\u0432\u043D\u0438\u0442\u044C", children: [col.name, arrow && (0, jsx_runtime_1.jsx)("span", { className: "sort-arrow", children: arrow })] }, col.id));
                                            }), showTotals && ((0, jsx_runtime_1.jsx)("th", { className: "totals-col", scope: "col", "aria-label": "\u0418\u0442\u043E\u0433\u043E", children: "\u03A3" }))] }) }), (0, jsx_runtime_1.jsxs)("tbody", { children: [rows.map((row) => {
                                            const rowHl = hoverRow === row.id;
                                            return ((0, jsx_runtime_1.jsxs)("tr", { className: rowHl ? 'row-hl' : '', children: [(0, jsx_runtime_1.jsx)("th", { scope: "row", className: row.id === rowFilter ? 'filtered' : '', onClick: (e) => onRowHeaderClick(e, row), onMouseEnter: (e) => onRowHeaderEnter(e, row), onMouseLeave: onHeaderLeave, onMouseMove: onHeaderMove, tabIndex: 0, title: "\u041A\u043B\u0438\u043A \u2014 \u0444\u0438\u043B\u044C\u0442\u0440 \u00B7 \u21E7 \u2014 \u0441\u0440\u0430\u0432\u043D\u0438\u0442\u044C", children: row.name }), cols.map((col) => {
                                                        const cell = cells.get(`${row.id}|${col.id}`);
                                                        const st = (0, thresholds_1.cellStatus)(cell, thresholds);
                                                        const isCellFiltered = cellFilter
                                                            && cellFilter.rowId === row.id
                                                            && cellFilter.colId === col.id;
                                                        const matchesFilter = (rowFilter == null || row.id === rowFilter) &&
                                                            (colFilter == null || col.id === colFilter) &&
                                                            (cellFilter == null || isCellFiltered);
                                                        const dimmed = !matchesFilter;
                                                        const isCmpA = compareA?.type === 'cell'
                                                            && compareA.rowId === row.id
                                                            && compareA.colId === col.id;
                                                        const isCmpB = compareB?.type === 'cell'
                                                            && compareB.rowId === row.id
                                                            && compareB.colId === col.id;
                                                        const cellCls = [
                                                            st,
                                                            isCmpA ? 'cmp-a' : '',
                                                            isCmpB ? 'cmp-b' : '',
                                                            isCellFiltered ? 'cell-filt' : '',
                                                            dimmed ? 'dimmed' : '',
                                                        ].filter(Boolean).join(' ');
                                                        const colHl = hoverCol === col.id && !showTotals;
                                                        return ((0, jsx_runtime_1.jsx)("td", { className: colHl ? 'col-hl' : '', onClick: (e) => onCellClick(e, row, col), onMouseEnter: (e) => onCellEnter(e, row, col), onMouseMove: onCellMove, onMouseLeave: onCellLeave, onMouseDown: (e) => { if (e.shiftKey)
                                                                e.preventDefault(); }, children: (0, jsx_runtime_1.jsxs)(styles_1.Cell, { className: cellCls, "aria-label": cell
                                                                    ? `${row.name} × ${col.name}: ${thresholds_1.STATUS_LABEL[st]}`
                                                                    : `${row.name} × ${col.name}: нет данных`, children: [(0, jsx_runtime_1.jsx)(StatusIcon, { status: st }), formatValue(cell, unit, unitSuffix, decimals, autoFormatRussian)] }) }, col.id));
                                                    }), showTotals && (() => {
                                                        const rtSt = (0, thresholds_1.totalsStatus)(rowTotals.get(row.id), thresholds);
                                                        return ((0, jsx_runtime_1.jsx)("td", { className: "totals-col", children: (0, jsx_runtime_1.jsxs)(styles_1.Cell, { className: rtSt, "aria-label": `Итого по строке: ${thresholds_1.STATUS_LABEL[rtSt]}`, children: [(0, jsx_runtime_1.jsx)(StatusIcon, { status: rtSt }), formatTotals(rowTotals.get(row.id), unit, unitSuffix, decimals, autoFormatRussian)] }) }));
                                                    })()] }, row.id));
                                        }), showTotals && ((0, jsx_runtime_1.jsxs)("tr", { className: "totals-row", children: [(0, jsx_runtime_1.jsx)("th", { scope: "row", children: "\u03A3" }), cols.map((col) => {
                                                    const ctSt = (0, thresholds_1.totalsStatus)(colTotals.get(col.id), thresholds);
                                                    return ((0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)(styles_1.Cell, { className: ctSt, "aria-label": `Итого по колонке ${col.name}: ${thresholds_1.STATUS_LABEL[ctSt]}`, children: [(0, jsx_runtime_1.jsx)(StatusIcon, { status: ctSt }), formatTotals(colTotals.get(col.id), unit, unitSuffix, decimals, autoFormatRussian)] }) }, col.id));
                                                }), (() => {
                                                    const gSt = (0, thresholds_1.totalsStatus)(grandTotal, thresholds);
                                                    return ((0, jsx_runtime_1.jsx)("td", { className: "totals-col", children: (0, jsx_runtime_1.jsxs)(styles_1.Cell, { className: gSt, "aria-label": `Общий итог: ${thresholds_1.STATUS_LABEL[gSt]}`, children: [(0, jsx_runtime_1.jsx)(StatusIcon, { status: gSt }), formatTotals(grandTotal, unit, unitSuffix, decimals, autoFormatRussian)] }) }));
                                                })()] }))] })] }) }), (0, jsx_runtime_1.jsxs)(styles_1.Footer, { children: [(0, jsx_runtime_1.jsxs)(styles_1.Scale, { "aria-label": "\u0428\u043A\u0430\u043B\u0430 \u043F\u043E\u0440\u043E\u0433\u043E\u0432", children: [(0, jsx_runtime_1.jsxs)(styles_1.ScaleItem, { className: "ok", children: [(0, jsx_runtime_1.jsx)("span", { className: "sw", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "label", children: [thresholds_1.STATUS_LABEL.ok, " \u00B7 ratio \u2264 ", thresholds.ok] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ScaleItem, { className: "wn", children: [(0, jsx_runtime_1.jsx)("span", { className: "sw", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "label", children: [thresholds_1.STATUS_LABEL.wn, " \u00B7 \u0434\u043E ", thresholds.wn] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ScaleItem, { className: "dn", children: [(0, jsx_runtime_1.jsx)("span", { className: "sw", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "label", children: [thresholds_1.STATUS_LABEL.dn, " \u00B7 \u0432\u044B\u0448\u0435 ", thresholds.wn] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ScaleItem, { className: "nd", children: [(0, jsx_runtime_1.jsx)("span", { className: "sw", "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { className: "label", children: thresholds_1.STATUS_LABEL.nd })] })] }), (0, jsx_runtime_1.jsxs)(styles_1.HintBar, { children: [(0, jsx_runtime_1.jsx)("span", { className: "hi", children: "\u043A\u043B\u0438\u043A \u2014 \u0444\u0438\u043B\u044C\u0442\u0440" }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { className: "hi", children: "Ctrl+\u043A\u043B\u0438\u043A \u2014 \u0440\u0430\u0437\u043B\u043E\u0436\u0435\u043D\u0438\u0435" }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { className: "hi", children: "\u21E7 \u043A\u043B\u0438\u043A \u2014 \u0441\u0440\u0430\u0432\u043D\u0438\u0442\u044C" })] })] })] }), (0, jsx_runtime_1.jsxs)(styles_1.Tooltip, { className: tooltip.show ? 'show' : '', style: { left: tooltip.x, top: tooltip.y }, role: "tooltip", "aria-hidden": !tooltip.show, children: [(0, jsx_runtime_1.jsxs)("div", { className: "tt-title", children: [(0, jsx_runtime_1.jsx)("span", { className: "dot", style: {
                                    background: tooltip.status === 'ok'
                                        ? 'var(--up)'
                                        : tooltip.status === 'dn' ? 'var(--dn)' : 'var(--wn)',
                                } }), tooltip.title] }), tooltip.rows.map((r) => ((0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { children: r.label }), (0, jsx_runtime_1.jsx)("b", { style: r.color ? { color: r.color } : undefined, children: r.value })] }, r.label)))] }), (0, jsx_runtime_1.jsxs)(styles_1.ColProfile, { className: profile.show ? 'show' : '', style: { left: profile.x, top: profile.y }, role: "tooltip", "aria-hidden": !profile.show, children: [(0, jsx_runtime_1.jsx)("div", { className: "cp-t", children: profile.title }), profile.rows.map((r) => ((0, jsx_runtime_1.jsxs)("div", { className: "cp-r", children: [(0, jsx_runtime_1.jsx)("span", { children: r.label }), (0, jsx_runtime_1.jsx)("b", { style: r.color ? { color: r.color } : undefined, children: r.value })] }, r.label)))] }), drillTarget && ((0, jsx_runtime_1.jsx)(DrillModal_1.DrillModal, { item: drillTarget, onClose: () => setDrillTarget(null), rows: rowsRaw, cols: cols, cells: cells, rowTotals: rowTotals, colTotals: colTotals, thresholds: thresholds, unitSuffix: unitSuffix, decimals: decimals, drillQueryParams: drillQueryParams, mockMode: mockMode })), compareOpen && compareA && compareB && ((0, jsx_runtime_1.jsx)(CompareModal_1.CompareModal, { itemA: compareA, itemB: compareB, onClose: closeCompare, rows: rowsRaw, cols: cols, cells: cells, rowTotals: rowTotals, colTotals: colTotals, unitSuffix: unitSuffix, decimals: decimals, drillQueryParams: drillQueryParams, mockMode: mockMode }))] }));
}
//# sourceMappingURL=HeatmapPivot.js.map