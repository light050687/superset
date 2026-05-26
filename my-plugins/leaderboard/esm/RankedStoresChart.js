import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, } from 'react';
import { Global, css } from '@emotion/react';
import { Card, CardHead, CardSub, CardTitle, Controls, FilterResetBtn, FilterResetRow, Root, TableWrap, TitleBlock, KEYFRAMES_CSS, } from './styles';
import { useDsThemeTokens } from './hooks/useDsThemeTokens';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useDerivedRows } from './hooks/useDerivedRows';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { STATUSES } from './utils/statusRules';
import { buildDataMask } from './utils/crossFilter';
import { colorFromKey } from './utils/colorFromKey';
import TableHeader from './components/TableHeader';
import TableBody from './components/TableBody';
import MultiSelectDropdown from './components/MultiSelectDropdown';
import SearchInput from './components/SearchInput';
import FooterHints, { ControlsHint } from './components/FooterHints';
import EmptyState from './components/EmptyState';
import Tooltip from './components/Tooltip';
import MiniSparkline from './components/MiniSparkline';
import StoreModal from './components/StoreModal';
import SegmentModal from './components/SegmentModal';
import { deltaClass, nf2 } from './utils/formatRussian';
/* =================================================================
 * Reducer
 * ================================================================= */
function createInitialState(defaultSort) {
    return {
        sortBy: defaultSort,
        sortDir: 'desc',
        search: '',
        statusFilters: new Set(),
        formatFilters: new Set(),
        pinned: new Set(),
        expanded: new Set(),
        storeCross: new Set(),
        segmentCross: new Set(),
        lastClickedIdx: null,
        modal: { kind: null, storeId: null, segmentId: null },
        focusedRowId: null,
        page: 0,
    };
}
function reducer(state, action) {
    switch (action.type) {
        case 'TOGGLE_SORT': {
            /* DS: смена сортировки → возврат на первую страницу,
               иначе пользователь видит «пустоту» если был на 8-й странице. */
            if (state.sortBy === action.payload.sortKey) {
                return {
                    ...state,
                    sortDir: state.sortDir === 'asc' ? 'desc' : 'asc',
                    page: 0,
                };
            }
            return {
                ...state,
                sortBy: action.payload.sortKey,
                sortDir: action.payload.defaultDir ?? 'desc',
                page: 0,
            };
        }
        case 'SET_SEARCH':
            return { ...state, search: action.payload, page: 0 };
        case 'TOGGLE_STATUS': {
            const next = new Set(state.statusFilters);
            if (next.has(action.payload))
                next.delete(action.payload);
            else
                next.add(action.payload);
            return { ...state, statusFilters: next, page: 0 };
        }
        case 'TOGGLE_FORMAT': {
            const next = new Set(state.formatFilters);
            if (next.has(action.payload))
                next.delete(action.payload);
            else
                next.add(action.payload);
            return { ...state, formatFilters: next, page: 0 };
        }
        case 'TOGGLE_PIN': {
            const next = new Set(state.pinned);
            if (next.has(action.payload))
                next.delete(action.payload);
            else
                next.add(action.payload);
            return { ...state, pinned: next };
        }
        case 'TOGGLE_EXPAND': {
            const { id, segmentIds } = action.payload;
            const next = new Set(state.expanded);
            const nextSegCross = new Set(state.segmentCross);
            if (next.has(id)) {
                /* collapse — убираем все сегменты этого магазина из cross-filter */
                next.delete(id);
                segmentIds.forEach(sid => nextSegCross.delete(sid));
            }
            else {
                next.add(id);
            }
            return { ...state, expanded: next, segmentCross: nextSegCross };
        }
        case 'ROW_CLICK': {
            const next = new Set(state.storeCross);
            if (next.has(action.payload.id))
                next.delete(action.payload.id);
            else
                next.add(action.payload.id);
            return {
                ...state,
                storeCross: next,
                lastClickedIdx: action.payload.idx,
            };
        }
        case 'ROW_SHIFT_CLICK': {
            const next = new Set(state.storeCross);
            action.payload.range.forEach(id => next.add(id));
            return {
                ...state,
                storeCross: next,
                lastClickedIdx: action.payload.idx,
            };
        }
        case 'TOGGLE_SEGMENT_CROSS': {
            const next = new Set(state.segmentCross);
            if (next.has(action.payload))
                next.delete(action.payload);
            else
                next.add(action.payload);
            return { ...state, segmentCross: next };
        }
        case 'CLEAR_CROSS':
            return {
                ...state,
                storeCross: new Set(),
                segmentCross: new Set(),
            };
        case 'OPEN_STORE_MODAL':
            return {
                ...state,
                modal: { kind: 'store', storeId: action.payload, segmentId: null },
            };
        case 'OPEN_SEGMENT_MODAL':
            return {
                ...state,
                modal: {
                    kind: 'segment',
                    storeId: action.payload.storeId,
                    segmentId: action.payload.segmentId,
                },
            };
        case 'CLOSE_MODAL':
            return {
                ...state,
                modal: { kind: null, storeId: null, segmentId: null },
            };
        case 'RESET_FILTERS':
            return {
                ...state,
                search: '',
                statusFilters: new Set(),
                formatFilters: new Set(),
                page: 0,
            };
        case 'FOCUS_ROW':
            return { ...state, focusedRowId: action.payload };
        case 'SET_PAGE':
            return { ...state, page: Math.max(0, action.payload) };
        default:
            return state;
    }
}
/* =================================================================
 * Component
 * ================================================================= */
export default function RankedStoresChart(props) {
    const { width, height, stores, hooks, emitCrossFilters, periodLabel, defaultSort, pageSize, storeIdCol, segmentIdCol, } = props;
    const { tokens, cssVars, isDark } = useDsThemeTokens();
    const [state, dispatch] = useReducer(reducer, defaultSort, createInitialState);
    /* Sync когда пользователь меняет default_sort в controlPanel — но только
       если пользователь не выбрал свою сортировку (т.е. sortBy совпадает со
       старым defaultSort). Используем ref чтобы знать предыдущий defaultSort. */
    const prevDefaultSortRef = useRef(defaultSort);
    useEffect(() => {
        const prev = prevDefaultSortRef.current;
        if (prev !== defaultSort) {
            if (state.sortBy === prev) {
                dispatch({
                    type: 'TOGGLE_SORT',
                    payload: { sortKey: defaultSort, defaultDir: 'desc' },
                });
            }
            prevDefaultSortRef.current = defaultSort;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultSort]);
    const debouncedSearch = useDebouncedValue(state.search, 250);
    const { rankedStores, flatRows, shownCount, totalCount, pageCount, safePage, } = useDerivedRows({
        stores,
        debouncedSearch,
        statusFilters: state.statusFilters,
        formatFilters: state.formatFilters,
        pinned: state.pinned,
        expanded: state.expanded,
        sortBy: state.sortBy,
        sortDir: state.sortDir,
        page: state.page,
        pageSize,
    });
    /* ----------------- Cross-filter → setDataMask (через ref) -----------------
       hooks — новый объект в каждом рендере, если поместить setDataMask
       в dep-array напрямую, useEffect будет срабатывать в цикле. Храним в ref. */
    const setDataMaskRef = useRef(hooks.setDataMask);
    useEffect(() => {
        setDataMaskRef.current = hooks.setDataMask;
    }, [hooks]);
    useEffect(() => {
        if (!emitCrossFilters)
            return;
        const fn = setDataMaskRef.current;
        if (!fn)
            return;
        fn(buildDataMask({
            storeCross: state.storeCross,
            segmentCross: state.segmentCross,
            storeIdCol,
            segmentIdCol,
        }));
    }, [
        emitCrossFilters,
        state.storeCross,
        state.segmentCross,
        storeIdCol,
        segmentIdCol,
    ]);
    /* ----------------- Dropdown options (counts per status/format) ----------------- */
    const statusOptions = useMemo(() => {
        const counts = {
            ok: 0,
            writeoff: 0,
            shrinkage: 0,
            critical: 0,
        };
        stores.forEach(s => {
            counts[s.status] += 1;
        });
        return Object.keys(STATUSES).map(key => ({
            key,
            label: STATUSES[key].label,
            color: colorFromKey(STATUSES[key].colorKey, tokens),
            count: counts[key],
        }));
    }, [stores, tokens]);
    /* ----------------- Event handlers ----------------- */
    const handleSort = useCallback((sortKey, defaultDir) => {
        dispatch({ type: 'TOGGLE_SORT', payload: { sortKey, defaultDir } });
    }, []);
    const handleRowClick = useCallback((id, idx, e) => {
        const seg = stores
            .flatMap(s => s.segmentsDist)
            .find(x => x.id === id);
        if (seg) {
            if (e.ctrlKey || e.metaKey) {
                dispatch({
                    type: 'OPEN_SEGMENT_MODAL',
                    payload: { storeId: seg.storeId, segmentId: id },
                });
                return;
            }
            dispatch({ type: 'TOGGLE_SEGMENT_CROSS', payload: seg.segmentId });
            return;
        }
        if (e.ctrlKey || e.metaKey) {
            dispatch({ type: 'OPEN_STORE_MODAL', payload: id });
            return;
        }
        if (e.shiftKey && state.lastClickedIdx !== null) {
            const from = Math.min(state.lastClickedIdx, idx);
            const to = Math.max(state.lastClickedIdx, idx);
            const range = rankedStores.slice(from, to + 1).map(s => s.id);
            dispatch({ type: 'ROW_SHIFT_CLICK', payload: { id, idx, range } });
        }
        else {
            dispatch({ type: 'ROW_CLICK', payload: { id, idx } });
        }
    }, [stores, rankedStores, state.lastClickedIdx]);
    const handleRowDblClick = useCallback((id, parentStoreId) => {
        if (parentStoreId) {
            dispatch({
                type: 'OPEN_SEGMENT_MODAL',
                payload: { storeId: parentStoreId, segmentId: id },
            });
        }
        else {
            dispatch({ type: 'OPEN_STORE_MODAL', payload: id });
        }
    }, []);
    const handleToggleExpand = useCallback((id) => {
        const store = stores.find(s => s.id === id);
        const segmentIds = store
            ? store.segmentsDist.map(seg => seg.segmentId)
            : [];
        dispatch({ type: 'TOGGLE_EXPAND', payload: { id, segmentIds } });
    }, [stores]);
    const handleTogglePin = useCallback((id) => {
        dispatch({ type: 'TOGGLE_PIN', payload: id });
    }, []);
    /* ----------------- Tooltip ----------------- */
    const [tt, setTt] = useState({ store: null, pos: null });
    const handleRowMouseEnter = useCallback((id, e) => {
        const s = rankedStores.find(x => x.id === id);
        if (s)
            setTt({ store: s, pos: { x: e.clientX, y: e.clientY } });
    }, [rankedStores]);
    const handleRowMouseMove = useCallback((_id, e) => {
        setTt(prev => prev.store ? { store: prev.store, pos: { x: e.clientX, y: e.clientY } } : prev);
    }, []);
    const handleRowMouseLeave = useCallback(() => {
        setTt({ store: null, pos: null });
    }, []);
    /* ----------------- Active modal store/segment ----------------- */
    const activeModalStore = useMemo(() => state.modal.kind && state.modal.storeId
        ? stores.find(s => s.id === state.modal.storeId) ?? null
        : null, [state.modal, stores]);
    const activeModalSegment = useMemo(() => {
        if (state.modal.kind !== 'segment' || !activeModalStore)
            return null;
        return (activeModalStore.segmentsDist.find(x => x.id === state.modal.segmentId) ??
            null);
    }, [state.modal, activeModalStore]);
    /* ----------------- Flags ----------------- */
    const hasAnyFilter = state.statusFilters.size > 0 ||
        state.formatFilters.size > 0 ||
        state.search.length > 0;
    const rootRef = useRef(null);
    /* ----------------- Keyboard navigation ↑/↓/Enter/Esc ----------------- */
    const focusedIdx = useMemo(() => {
        if (!state.focusedRowId)
            return -1;
        return flatRows.findIndex(r => r.data.id === state.focusedRowId);
    }, [flatRows, state.focusedRowId]);
    useKeyboardNav({
        onArrowDown: () => {
            if (state.modal.kind)
                return;
            const next = focusedIdx < 0 ? 0 : Math.min(flatRows.length - 1, focusedIdx + 1);
            const r = flatRows[next];
            if (r)
                dispatch({ type: 'FOCUS_ROW', payload: r.data.id });
        },
        onArrowUp: () => {
            if (state.modal.kind)
                return;
            const prev = focusedIdx <= 0 ? 0 : focusedIdx - 1;
            const r = flatRows[prev];
            if (r)
                dispatch({ type: 'FOCUS_ROW', payload: r.data.id });
        },
        onEnter: () => {
            if (state.modal.kind)
                return;
            const r = flatRows[focusedIdx];
            if (!r)
                return;
            if (r.kind === 'segment') {
                dispatch({
                    type: 'OPEN_SEGMENT_MODAL',
                    payload: { storeId: r.parentStoreId, segmentId: r.data.id },
                });
            }
            else {
                dispatch({ type: 'OPEN_STORE_MODAL', payload: r.data.id });
            }
        },
        onEscape: () => {
            if (state.modal.kind) {
                dispatch({ type: 'CLOSE_MODAL' });
            }
            else if (hasAnyFilter) {
                dispatch({ type: 'RESET_FILTERS' });
            }
            else if (state.storeCross.size > 0 || state.segmentCross.size > 0) {
                dispatch({ type: 'CLEAR_CROSS' });
            }
        },
    }, rootRef);
    return (_jsxs(Root, { ref: rootRef, "$width": width, "$height": height, style: cssVars, className: "leaderboard-card", children: [_jsx(Global, { styles: css(KEYFRAMES_CSS) }), _jsxs(Card, { "data-info-hint-container": "", children: [_jsxs(CardHead, { children: [_jsxs(TitleBlock, { children: [_jsx(CardTitle, { children: "\u0420\u0435\u0439\u0442\u0438\u043D\u0433 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432" }), _jsxs(CardSub, { children: [_jsxs("span", { children: [totalCount, " \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432"] }), periodLabel && (_jsxs(_Fragment, { children: [_jsx("span", { className: "dot" }), _jsx("span", { children: periodLabel })] }))] })] }), _jsxs(Controls, { children: [_jsx(MultiSelectDropdown, { label: "\u0421\u0442\u0430\u0442\u0443\u0441", options: statusOptions, selected: state.statusFilters, onToggle: k => dispatch({ type: 'TOGGLE_STATUS', payload: k }) }), _jsx(SearchInput, { value: state.search, onChange: v => dispatch({ type: 'SET_SEARCH', payload: v }) }), _jsx(ControlsHint, {})] })] }), hasAnyFilter && (_jsx(FilterResetRow, { children: _jsx(FilterResetBtn, { type: "button", onClick: () => dispatch({ type: 'RESET_FILTERS' }), children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440\u044B" }) })), stores.length === 0 ? (_jsx(EmptyState, { title: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432", description: 'Включите «Режим проектирования» в настройках для тестовых данных, ' +
                            'либо настройте Сопоставление колонок под ваш dataset. Ожидаемые поля: ' +
                            'store_id, store_name, city, format, format_name, division, to_class, ' +
                            'writeoff_pct, shrinkage_pct, plan_writeoff_pct, plan_shrinkage_pct, ' +
                            'avg_writeoff_rub, avg_shrinkage_check_rub.' })) : (_jsxs(TableWrap, { role: "table", "aria-label": "\u0420\u0435\u0439\u0442\u0438\u043D\u0433 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432", children: [_jsx(TableHeader, { sortBy: state.sortBy, sortDir: state.sortDir, onSort: handleSort }), _jsx(TableBody, { rows: flatRows, allStores: stores, crossSelected: state.storeCross, segmentCrossSelected: state.segmentCross, pinned: state.pinned, expanded: state.expanded, focusedRowId: state.focusedRowId, tokens: tokens, onRowClick: handleRowClick, onRowDblClick: handleRowDblClick, onRowMouseEnter: handleRowMouseEnter, onRowMouseMove: handleRowMouseMove, onRowMouseLeave: handleRowMouseLeave, onToggleExpand: handleToggleExpand, onTogglePin: handleTogglePin })] })), _jsx(FooterHints, { shown: shownCount, total: totalCount, page: safePage, pageSize: pageSize, pageCount: pageCount, onPageChange: p => dispatch({ type: 'SET_PAGE', payload: p }) })] }), _jsx(Tooltip, { visible: tt.store !== null, pos: tt.pos, 
                /* Tooltip того же тона что Card surface (НЕ инверт). */
                ink: tokens.surface, surface: tokens.ink, border: tokens.g700, children: tt.store && (_jsx(TooltipContent, { store: tt.store, allStores: stores, tokens: tokens })) }), _jsx(StoreModal, { open: state.modal.kind === 'store', store: activeModalStore, allStores: stores, tokens: tokens, onClose: () => dispatch({ type: 'CLOSE_MODAL' }), periodLabel: periodLabel }), _jsx(SegmentModal, { open: state.modal.kind === 'segment', parentStore: activeModalStore, segment: activeModalSegment, allStores: stores, tokens: tokens, onClose: () => dispatch({ type: 'CLOSE_MODAL' }), periodLabel: periodLabel })] }));
}
function TooltipContent({ store, allStores, tokens }) {
    const st = STATUSES[store.status];
    const color = colorFromKey(st.colorKey, tokens);
    const dW = store.writeoff - store.planWriteoff;
    const dS = store.shrinkage - store.planShrinkage;
    const dWcls = deltaClass(dW, true);
    const dScls = deltaClass(dS, true);
    const fmtStores = allStores
        .filter(x => x.format === store.format)
        .sort((a, b) => b.lossCombined - a.lossCombined);
    const rank = fmtStores.findIndex(x => x.id === store.id) + 1;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "tt-head", children: [_jsx("div", { className: "tt-status", style: { background: color } }), _jsxs("div", { className: "tt-titles", children: [_jsx("div", { className: "tt-name", children: store.shortLabel }), _jsxs("div", { className: "tt-sub", children: [store.code, " \u00B7 ", store.city, " \u00B7 ", store.formatName] })] })] }), _jsxs("div", { className: "tt-trend", children: [_jsx("div", { className: "tt-trend-l", children: "\u0422\u0440\u0435\u043D\u0434 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439 (12 \u043D\u0435\u0434)" }), _jsx(MiniSparkline, { data: store.spark, color: tokens.tangerine, background: tokens.g100, width: 280, height: 36 })] }), _jsxs("div", { className: "tt-rows", children: [_jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: "\u0421\u043F\u0438\u0441\u0430\u043D\u0438\u044F / \u043F\u043B\u0430\u043D" }), _jsxs("span", { className: `tt-v ${dWcls}`, children: [nf2(store.writeoff), "%", ' ', _jsxs("span", { style: { color: 'var(--g500)', fontWeight: 500 }, children: ["/", nf2(store.planWriteoff), "%"] })] })] }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0447\u0438 / \u043F\u043B\u0430\u043D" }), _jsxs("span", { className: `tt-v ${dScls}`, children: [nf2(store.shrinkage), "%", ' ', _jsxs("span", { style: { color: 'var(--g500)', fontWeight: 500 }, children: ["/", nf2(store.planShrinkage), "%"] })] })] }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: "\u0420\u0430\u043D\u0433 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435" }), _jsxs("span", { className: "tt-v", children: ["#", rank, " \u0438\u0437 ", fmtStores.length] })] }), _jsxs("div", { className: "tt-row", children: [_jsx("span", { className: "tt-l", children: "\u0422\u041E" }), _jsxs("span", { className: "tt-v", children: [store.toClass, " \u043C\u043B\u043D \u20BD"] })] })] })] }));
}
//# sourceMappingURL=RankedStoresChart.js.map