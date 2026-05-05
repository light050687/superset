import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cellStatus, STATUS_LABEL, totalsStatus } from './utils/thresholds';
/**
 * DS 2.0 §07 / WCAG 1.4.1: цвет ≠ единственный индикатор.
 * Иконка-символ в углу ячейки — второй канал кодирования статуса.
 */
function StatusIcon({ status }) {
    if (status === 'nd')
        return null;
    if (status === 'ok') {
        // ✓ Galочка — норма
        return (_jsx("svg", { className: "status-icon", viewBox: "0 0 8 8", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M1.5 4 L3.2 5.7 L6.5 2.3" }) }));
    }
    if (status === 'wn') {
        // △ Открытый треугольник — внимание
        return (_jsx("svg", { className: "status-icon", viewBox: "0 0 8 8", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M4 1 L7 7 L1 7 Z" }) }));
    }
    // dn: ▲ Заполненный треугольник — превышение
    return (_jsx("svg", { className: "status-icon", viewBox: "0 0 8 8", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M4 1 L7 7 L1 7 Z" }) }));
}
import { formatRussianInt, formatRussianPercent, formatRussianSmartEx, } from './utils/formatRussian';
import { Breadcrumbs, BreadcrumbBack, BreadcrumbCurrent, BreadcrumbDot, BreadcrumbPlus, BreadcrumbSel, Card, Cell, Chip, ColProfile, Controls, Footer, Header, HintBar, KEYFRAMES_CSS, Pivot, PivotWrap, ROOT_CLASS, Root, Scale, ScaleItem, SkeletonGrid, StateOverlay, Title, TitleBlock, Tooltip, Unit, UnitButton, PartialBadge, StaleBar, } from './styles';
import { DrillModal } from './DrillModal';
import { CompareModal } from './CompareModal';
function formatValue(cell, unit, suffix, decimals, auto) {
    if (!cell)
        return '—';
    if (unit === 'pct') {
        if (cell.pct == null)
            return '—';
        return formatRussianPercent(cell.pct, decimals);
    }
    if (auto)
        return formatRussianSmartEx(cell.value, decimals, suffix);
    return `${cell.value.toFixed(decimals)}${suffix ? ` ${suffix}` : ''}`;
}
function formatTotals(slice, unit, suffix, decimals, auto) {
    if (!slice)
        return '—';
    if (unit === 'pct') {
        if (slice.pct == null)
            return '—';
        return formatRussianPercent(slice.pct, decimals);
    }
    if (auto)
        return formatRussianSmartEx(slice.fact, decimals, suffix);
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
export default function HeatmapPivot(props) {
    const { width, height, rows: rowsRaw, cols, cells, rowTotals, colTotals, grandTotal, thresholds, defaultUnit, unitSuffix, decimals, autoFormatRussian, showTotalsDefault, headerText, headerSubtitle, emitFilter, setDataMask, drillQueryParams, mockMode, dataState, errorMessage, } = props;
    const rowAxisColName = drillQueryParams?.rowAxisCol ?? '';
    const colAxisColName = drillQueryParams?.colAxisCol ?? '';
    // ── Local state ──
    const [unit, setUnit] = useState(defaultUnit);
    const [showTotals, setShowTotals] = useState(showTotalsDefault);
    const [sortColId, setSortColId] = useState(null);
    const [sortDir, setSortDir] = useState('desc');
    // Filters (one-shot semantics: any new selection clears the others)
    const [rowFilter, setRowFilter] = useState(null);
    const [colFilter, setColFilter] = useState(null);
    const [cellFilter, setCellFilter] = useState(null);
    // Compare / Drill
    const [compareA, setCompareA] = useState(null);
    const [compareB, setCompareB] = useState(null);
    const [compareOpen, setCompareOpen] = useState(false);
    const [drillTarget, setDrillTarget] = useState(null);
    // Tooltip / popover
    const [tooltip, setTooltip] = useState(INITIAL_TOOLTIP);
    const [profile, setProfile] = useState(INITIAL_PROFILE);
    // Theme (follow Superset body attribute if present)
    const [theme, setTheme] = useState(() => {
        if (typeof document === 'undefined')
            return 'dark';
        return document.body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    });
    useEffect(() => {
        const obs = new MutationObserver(() => {
            const v = document.body.getAttribute('data-theme');
            setTheme(v === 'light' ? 'light' : 'dark');
        });
        obs.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
        return () => obs.disconnect();
    }, []);
    // ── Derived: sorted rows ──
    const rows = useMemo(() => {
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
    const [hoverRow, setHoverRow] = useState(null);
    const [hoverCol, setHoverCol] = useState(null);
    // ── Cross-filter emission ──
    const emitMask = useCallback((payload) => {
        if (!emitFilter || !setDataMask)
            return;
        if (!payload) {
            setDataMask({ extraFormData: { filters: [] }, filterState: { value: null } });
            return;
        }
        setDataMask(payload);
    }, [emitFilter, setDataMask]);
    const applyCellCrossFilter = useCallback((rowId, colId) => {
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
    const applyAxisCrossFilter = useCallback((axis, value) => {
        const col = axis === 'row' ? rowAxisColName : colAxisColName;
        if (!col)
            return;
        emitMask({
            extraFormData: { filters: [{ col, op: 'IN', val: [value] }] },
            filterState: { value, selectedValues: [value] },
        });
    }, [emitMask, rowAxisColName, colAxisColName]);
    // ── Actions ──
    const toggleSort = useCallback((colId) => {
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
    const addToCompare = useCallback((item) => {
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
    const closeCompare = useCallback(() => {
        setCompareOpen(false);
        setCompareA(null);
        setCompareB(null);
    }, []);
    const clearAllFilters = useCallback(() => {
        setRowFilter(null);
        setColFilter(null);
        setCellFilter(null);
        emitMask(null);
    }, [emitMask]);
    // ── Click handlers ──
    const onCellClick = useCallback((e, row, col) => {
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
    const onRowHeaderClick = useCallback((e, row) => {
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
    const onColHeaderClick = useCallback((e, col) => {
        if (e.shiftKey) {
            addToCompare({ type: 'col', colId: col.id });
            return;
        }
        toggleSort(col.id);
    }, [toggleSort, addToCompare]);
    const onColHeaderDblClick = useCallback((e, col) => {
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
    const positionNear = useCallback((x, y, pad = 8) => {
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
    const onCellEnter = useCallback((e, row, col) => {
        setHoverRow(row.id);
        setHoverCol(col.id);
        const cell = cells.get(`${row.id}|${col.id}`);
        if (!cell)
            return;
        const st = cellStatus(cell, thresholds);
        if (st === 'nd')
            return;
        const pos = positionNear(e.clientX, e.clientY);
        const rows = [
            { label: 'Факт', value: formatRussianSmartEx(cell.value, decimals, unitSuffix) },
        ];
        if (cell.pct != null) {
            rows.push({ label: '% от знаменателя', value: formatRussianPercent(cell.pct, decimals) });
        }
        if (cell.planPct != null) {
            rows.push({ label: 'План, %', value: formatRussianPercent(cell.planPct, decimals) });
        }
        rows.push({ label: 'Статус', value: STATUS_LABEL[st] });
        if (cell.shops != null) {
            rows.push({ label: 'Магазинов', value: formatRussianInt(cell.shops) });
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
    const onCellMove = useCallback((e) => {
        setTooltip((t) => {
            if (!t.show)
                return t;
            const pos = positionNear(e.clientX, e.clientY);
            return { ...t, x: pos.x, y: pos.y };
        });
    }, [positionNear]);
    const onCellLeave = useCallback(() => {
        setHoverRow(null);
        setHoverCol(null);
        setTooltip(INITIAL_TOOLTIP);
    }, []);
    // Col header hover = column profile
    const onColHeaderEnter = useCallback((e, col) => {
        const prof = colTotals.get(col.id);
        if (!prof || prof.fact === 0)
            return;
        const pos = positionNear(e.clientX, e.clientY, 14);
        const rows = [
            { label: 'Сумма', value: formatRussianSmartEx(prof.fact, decimals, unitSuffix) },
        ];
        if (prof.pct != null) {
            rows.push({ label: '% от знаменателя', value: formatRussianPercent(prof.pct, decimals) });
        }
        if (prof.ratio != null) {
            const st = totalsStatus(prof, thresholds);
            rows.push({
                label: 'Ratio факт/план',
                value: prof.ratio.toFixed(2),
                color: st === 'ok' ? 'var(--up)' : st === 'dn' ? 'var(--dn)' : st === 'wn' ? 'var(--wn)' : undefined,
            });
        }
        setProfile({ show: true, x: pos.x, y: pos.y, title: col.name, rows });
    }, [colTotals, decimals, unitSuffix, thresholds, positionNear]);
    const onRowHeaderEnter = useCallback((e, row) => {
        const prof = rowTotals.get(row.id);
        if (!prof || prof.fact === 0)
            return;
        const pos = positionNear(e.clientX, e.clientY, 14);
        const rows = [
            { label: 'Сумма', value: formatRussianSmartEx(prof.fact, decimals, unitSuffix) },
        ];
        if (prof.pct != null) {
            rows.push({ label: '% от знаменателя', value: formatRussianPercent(prof.pct, decimals) });
        }
        if (prof.ratio != null) {
            const st = totalsStatus(prof, thresholds);
            rows.push({
                label: 'Ratio факт/план',
                value: prof.ratio.toFixed(2),
                color: st === 'ok' ? 'var(--up)' : st === 'dn' ? 'var(--dn)' : st === 'wn' ? 'var(--wn)' : undefined,
            });
        }
        setProfile({ show: true, x: pos.x, y: pos.y, title: row.name, rows });
    }, [rowTotals, decimals, unitSuffix, thresholds, positionNear]);
    const onHeaderLeave = useCallback(() => {
        setProfile(INITIAL_PROFILE);
    }, []);
    const onHeaderMove = useCallback((e) => {
        setProfile((p) => {
            if (!p.show)
                return p;
            const pos = positionNear(e.clientX, e.clientY, 14);
            return { ...p, x: pos.x, y: pos.y };
        });
    }, [positionNear]);
    // ── Escape key cascade: modal → compare → filter ──
    useEffect(() => {
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
        return (_jsxs(Root, { "data-theme": theme, className: ROOT_CLASS, width: width, height: height, "aria-busy": "true", "aria-live": "polite", children: [_jsx("style", { children: KEYFRAMES_CSS }), _jsxs(Card, { children: [_jsx(Header, { children: _jsx(TitleBlock, { children: _jsx(Title, { children: headerText }) }) }), _jsxs(SkeletonGrid, { children: [_jsx("div", { className: "sk hdr" }), _jsx("div", { className: "sk hdr" }), _jsx("div", { className: "sk hdr" }), _jsx("div", { className: "sk hdr" }), _jsx("div", { className: "sk hdr" }), _jsx("div", { className: "sk hdr" }), Array.from({ length: 25 }).map((_, i) => _jsx("div", { className: "sk" }, i))] })] })] }));
    }
    if (dataState === 'error') {
        return (_jsxs(Root, { "data-theme": theme, className: ROOT_CLASS, width: width, height: height, children: [_jsx("style", { children: KEYFRAMES_CSS }), _jsx(Card, { children: _jsx(StateOverlay, { role: "alert", children: errorMessage ?? 'Произошла ошибка при загрузке данных' }) })] }));
    }
    if (dataState === 'empty' && cells.size === 0) {
        return (_jsxs(Root, { "data-theme": theme, className: ROOT_CLASS, width: width, height: height, children: [_jsx("style", { children: KEYFRAMES_CSS }), _jsxs(Card, { children: [_jsx(Header, { children: _jsx(TitleBlock, { children: _jsx(Title, { children: headerText }) }) }), _jsx(StateOverlay, { children: errorMessage ?? 'Нет данных за выбранный период' })] })] }));
    }
    // ── Render ──
    const isPartial = dataState === 'partial';
    const isStale = dataState === 'stale';
    return (_jsxs(Root, { "data-theme": theme, className: ROOT_CLASS, width: width, height: height, children: [_jsx("style", { children: KEYFRAMES_CSS }), _jsxs(Card, { style: { position: 'relative' }, children: [isStale && _jsx(StaleBar, { "aria-hidden": "true" }), _jsxs(Header, { children: [_jsxs(TitleBlock, { children: [_jsxs(Title, { children: [headerText, isPartial && (_jsx(PartialBadge, { title: "\u0427\u0430\u0441\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0445 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430", children: "\u0427\u0430\u0441\u0442\u0438\u0447\u043D\u043E" }))] }), _jsxs(Breadcrumbs, { role: "navigation", "aria-label": "\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0444\u0438\u043B\u044C\u0442\u0440\u043E\u0432", children: [_jsx(BreadcrumbCurrent, { children: headerSubtitle }), breadcrumbChips.length > 0 && (_jsxs(_Fragment, { children: [_jsx(BreadcrumbDot, { children: "\u00B7" }), _jsx(BreadcrumbCurrent, { children: "\u0424\u0438\u043B\u044C\u0442\u0440:" }), breadcrumbChips.map((chip, i) => (_jsxs("span", { children: [_jsx(BreadcrumbSel, { children: chip }), i < breadcrumbChips.length - 1 && (_jsx(BreadcrumbPlus, { children: "+" }))] }, chip))), _jsx(BreadcrumbBack, { type: "button", onClick: clearAllFilters, "aria-label": "\u0421\u043D\u044F\u0442\u044C \u0432\u0441\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B", title: "\u0421\u043D\u044F\u0442\u044C (Esc)", children: "\u00D7" })] }))] })] }), _jsxs(Controls, { children: [_jsxs(Unit, { role: "tablist", "aria-label": "\u0415\u0434\u0438\u043D\u0438\u0446\u044B \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u044F", children: [_jsx(UnitButton, { type: "button", on: unit === 'abs', onClick: () => setUnit('abs'), "aria-pressed": unit === 'abs', title: "\u0410\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435", children: unitSuffix.includes('₽') ? '₽' : 'Σ' }), _jsx(UnitButton, { type: "button", on: unit === 'pct', onClick: () => setUnit('pct'), "aria-pressed": unit === 'pct', title: "\u041F\u0440\u043E\u0446\u0435\u043D\u0442", children: "%" })] }), _jsxs(Chip, { type: "button", on: showTotals, onClick: () => setShowTotals((v) => !v), "aria-pressed": showTotals, title: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0441\u0442\u0440\u043E\u043A\u0443 \u0438 \u043A\u043E\u043B\u043E\u043D\u043A\u0443 \u0438\u0442\u043E\u0433\u043E\u0432", children: [_jsx("span", { className: "sigma", children: "\u03A3" }), _jsx("span", { children: "\u0418\u0442\u043E\u0433\u0438" })] })] })] }), _jsx(PivotWrap, { children: _jsxs(Pivot, { role: "grid", "aria-label": headerText, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "corner", scope: "col", "aria-label": "\u0424\u043E\u0440\u043C\u0430\u0442" }), cols.map((col) => {
                                                const sorted = col.id === sortColId;
                                                const arrow = sorted ? (sortDir === 'desc' ? '▾' : '▴') : '';
                                                const className = [
                                                    sorted ? 'sorted' : '',
                                                    col.id === colFilter ? 'filtered' : '',
                                                    col.id === hoverCol && !showTotals ? 'col-hl' : '',
                                                ].filter(Boolean).join(' ');
                                                return (_jsxs("th", { scope: "col", className: className, onClick: (e) => onColHeaderClick(e, col), onDoubleClick: (e) => onColHeaderDblClick(e, col), onMouseEnter: (e) => onColHeaderEnter(e, col), onMouseLeave: onHeaderLeave, onMouseMove: onHeaderMove, tabIndex: 0, title: "\u041A\u043B\u0438\u043A \u2014 \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430 \u00B7 \u0434\u0432. \u043A\u043B\u0438\u043A \u2014 \u0444\u0438\u043B\u044C\u0442\u0440 \u00B7 \u21E7 \u043A\u043B\u0438\u043A \u2014 \u0441\u0440\u0430\u0432\u043D\u0438\u0442\u044C", children: [col.name, arrow && _jsx("span", { className: "sort-arrow", children: arrow })] }, col.id));
                                            }), showTotals && (_jsx("th", { className: "totals-col", scope: "col", "aria-label": "\u0418\u0442\u043E\u0433\u043E", children: "\u03A3" }))] }) }), _jsxs("tbody", { children: [rows.map((row) => {
                                            const rowHl = hoverRow === row.id;
                                            return (_jsxs("tr", { className: rowHl ? 'row-hl' : '', children: [_jsx("th", { scope: "row", className: row.id === rowFilter ? 'filtered' : '', onClick: (e) => onRowHeaderClick(e, row), onMouseEnter: (e) => onRowHeaderEnter(e, row), onMouseLeave: onHeaderLeave, onMouseMove: onHeaderMove, tabIndex: 0, title: "\u041A\u043B\u0438\u043A \u2014 \u0444\u0438\u043B\u044C\u0442\u0440 \u00B7 \u21E7 \u2014 \u0441\u0440\u0430\u0432\u043D\u0438\u0442\u044C", children: row.name }), cols.map((col) => {
                                                        const cell = cells.get(`${row.id}|${col.id}`);
                                                        const st = cellStatus(cell, thresholds);
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
                                                        return (_jsx("td", { className: colHl ? 'col-hl' : '', onClick: (e) => onCellClick(e, row, col), onMouseEnter: (e) => onCellEnter(e, row, col), onMouseMove: onCellMove, onMouseLeave: onCellLeave, onMouseDown: (e) => { if (e.shiftKey)
                                                                e.preventDefault(); }, children: _jsxs(Cell, { className: cellCls, "aria-label": cell
                                                                    ? `${row.name} × ${col.name}: ${STATUS_LABEL[st]}`
                                                                    : `${row.name} × ${col.name}: нет данных`, children: [_jsx(StatusIcon, { status: st }), formatValue(cell, unit, unitSuffix, decimals, autoFormatRussian)] }) }, col.id));
                                                    }), showTotals && (() => {
                                                        const rtSt = totalsStatus(rowTotals.get(row.id), thresholds);
                                                        return (_jsx("td", { className: "totals-col", children: _jsxs(Cell, { className: rtSt, "aria-label": `Итого по строке: ${STATUS_LABEL[rtSt]}`, children: [_jsx(StatusIcon, { status: rtSt }), formatTotals(rowTotals.get(row.id), unit, unitSuffix, decimals, autoFormatRussian)] }) }));
                                                    })()] }, row.id));
                                        }), showTotals && (_jsxs("tr", { className: "totals-row", children: [_jsx("th", { scope: "row", children: "\u03A3" }), cols.map((col) => {
                                                    const ctSt = totalsStatus(colTotals.get(col.id), thresholds);
                                                    return (_jsx("td", { children: _jsxs(Cell, { className: ctSt, "aria-label": `Итого по колонке ${col.name}: ${STATUS_LABEL[ctSt]}`, children: [_jsx(StatusIcon, { status: ctSt }), formatTotals(colTotals.get(col.id), unit, unitSuffix, decimals, autoFormatRussian)] }) }, col.id));
                                                }), (() => {
                                                    const gSt = totalsStatus(grandTotal, thresholds);
                                                    return (_jsx("td", { className: "totals-col", children: _jsxs(Cell, { className: gSt, "aria-label": `Общий итог: ${STATUS_LABEL[gSt]}`, children: [_jsx(StatusIcon, { status: gSt }), formatTotals(grandTotal, unit, unitSuffix, decimals, autoFormatRussian)] }) }));
                                                })()] }))] })] }) }), _jsxs(Footer, { children: [_jsxs(Scale, { "aria-label": "\u0428\u043A\u0430\u043B\u0430 \u043F\u043E\u0440\u043E\u0433\u043E\u0432", children: [_jsxs(ScaleItem, { className: "ok", children: [_jsx("span", { className: "sw", "aria-hidden": "true" }), _jsxs("span", { className: "label", children: [STATUS_LABEL.ok, " \u00B7 ratio \u2264 ", thresholds.ok] })] }), _jsxs(ScaleItem, { className: "wn", children: [_jsx("span", { className: "sw", "aria-hidden": "true" }), _jsxs("span", { className: "label", children: [STATUS_LABEL.wn, " \u00B7 \u0434\u043E ", thresholds.wn] })] }), _jsxs(ScaleItem, { className: "dn", children: [_jsx("span", { className: "sw", "aria-hidden": "true" }), _jsxs("span", { className: "label", children: [STATUS_LABEL.dn, " \u00B7 \u0432\u044B\u0448\u0435 ", thresholds.wn] })] }), _jsxs(ScaleItem, { className: "nd", children: [_jsx("span", { className: "sw", "aria-hidden": "true" }), _jsx("span", { className: "label", children: STATUS_LABEL.nd })] })] }), _jsxs(HintBar, { children: [_jsx("span", { className: "hi", children: "\u043A\u043B\u0438\u043A \u2014 \u0444\u0438\u043B\u044C\u0442\u0440" }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsx("span", { className: "hi", children: "Ctrl+\u043A\u043B\u0438\u043A \u2014 \u0440\u0430\u0437\u043B\u043E\u0436\u0435\u043D\u0438\u0435" }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsx("span", { className: "hi", children: "\u21E7 \u043A\u043B\u0438\u043A \u2014 \u0441\u0440\u0430\u0432\u043D\u0438\u0442\u044C" })] })] })] }), _jsxs(Tooltip, { className: tooltip.show ? 'show' : '', style: { left: tooltip.x, top: tooltip.y }, role: "tooltip", "aria-hidden": !tooltip.show, children: [_jsxs("div", { className: "tt-title", children: [_jsx("span", { className: "dot", style: {
                                    background: tooltip.status === 'ok'
                                        ? 'var(--up)'
                                        : tooltip.status === 'dn' ? 'var(--dn)' : 'var(--wn)',
                                } }), tooltip.title] }), tooltip.rows.map((r) => (_jsxs("div", { className: "tt-row", children: [_jsx("span", { children: r.label }), _jsx("b", { style: r.color ? { color: r.color } : undefined, children: r.value })] }, r.label)))] }), _jsxs(ColProfile, { className: profile.show ? 'show' : '', style: { left: profile.x, top: profile.y }, role: "tooltip", "aria-hidden": !profile.show, children: [_jsx("div", { className: "cp-t", children: profile.title }), profile.rows.map((r) => (_jsxs("div", { className: "cp-r", children: [_jsx("span", { children: r.label }), _jsx("b", { style: r.color ? { color: r.color } : undefined, children: r.value })] }, r.label)))] }), drillTarget && (_jsx(DrillModal, { item: drillTarget, onClose: () => setDrillTarget(null), rows: rowsRaw, cols: cols, cells: cells, rowTotals: rowTotals, colTotals: colTotals, thresholds: thresholds, unitSuffix: unitSuffix, decimals: decimals, drillQueryParams: drillQueryParams, mockMode: mockMode })), compareOpen && compareA && compareB && (_jsx(CompareModal, { itemA: compareA, itemB: compareB, onClose: closeCompare, rows: rowsRaw, cols: cols, cells: cells, rowTotals: rowTotals, colTotals: colTotals, unitSuffix: unitSuffix, decimals: decimals, drillQueryParams: drillQueryParams, mockMode: mockMode }))] }));
}
//# sourceMappingURL=HeatmapPivot.js.map