"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RankedStoresChart;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("@emotion/react");
const styles_1 = require("./styles");
const useDsThemeTokens_1 = require("./hooks/useDsThemeTokens");
const useDebouncedValue_1 = require("./hooks/useDebouncedValue");
const useDerivedRows_1 = require("./hooks/useDerivedRows");
const useKeyboardNav_1 = require("./hooks/useKeyboardNav");
const statusRules_1 = require("./utils/statusRules");
const rankedStoresMock_1 = require("./mocks/rankedStoresMock");
const crossFilter_1 = require("./utils/crossFilter");
const colorFromKey_1 = require("./utils/colorFromKey");
const TableHeader_1 = __importDefault(require("./components/TableHeader"));
const TableBody_1 = __importDefault(require("./components/TableBody"));
const MultiSelectDropdown_1 = __importDefault(require("./components/MultiSelectDropdown"));
const SearchInput_1 = __importDefault(require("./components/SearchInput"));
const CsvExportButton_1 = __importDefault(require("./components/CsvExportButton"));
const FooterHints_1 = __importDefault(require("./components/FooterHints"));
const EmptyState_1 = __importDefault(require("./components/EmptyState"));
const Tooltip_1 = __importDefault(require("./components/Tooltip"));
const MiniSparkline_1 = __importDefault(require("./components/MiniSparkline"));
const StoreModal_1 = __importDefault(require("./components/StoreModal"));
const SegmentModal_1 = __importDefault(require("./components/SegmentModal"));
const formatRussian_1 = require("./utils/formatRussian");
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
    };
}
function reducer(state, action) {
    switch (action.type) {
        case 'TOGGLE_SORT': {
            if (state.sortBy === action.payload.sortKey) {
                return {
                    ...state,
                    sortDir: state.sortDir === 'asc' ? 'desc' : 'asc',
                };
            }
            return {
                ...state,
                sortBy: action.payload.sortKey,
                sortDir: action.payload.defaultDir ?? 'desc',
            };
        }
        case 'SET_SEARCH':
            return { ...state, search: action.payload };
        case 'TOGGLE_STATUS': {
            const next = new Set(state.statusFilters);
            if (next.has(action.payload))
                next.delete(action.payload);
            else
                next.add(action.payload);
            return { ...state, statusFilters: next };
        }
        case 'TOGGLE_FORMAT': {
            const next = new Set(state.formatFilters);
            if (next.has(action.payload))
                next.delete(action.payload);
            else
                next.add(action.payload);
            return { ...state, formatFilters: next };
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
            };
        case 'FOCUS_ROW':
            return { ...state, focusedRowId: action.payload };
        default:
            return state;
    }
}
/* =================================================================
 * Component
 * ================================================================= */
function RankedStoresChart(props) {
    const { width, height, stores, hooks, emitCrossFilters, periodLabel, defaultSort, storeIdCol, segmentIdCol, } = props;
    const { tokens, cssVars } = (0, useDsThemeTokens_1.useDsThemeTokens)();
    const [state, dispatch] = (0, react_1.useReducer)(reducer, defaultSort, createInitialState);
    /* Sync когда пользователь меняет default_sort в controlPanel — но только
       если пользователь не выбрал свою сортировку (т.е. sortBy совпадает со
       старым defaultSort). Используем ref чтобы знать предыдущий defaultSort. */
    const prevDefaultSortRef = (0, react_1.useRef)(defaultSort);
    (0, react_1.useEffect)(() => {
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
    const debouncedSearch = (0, useDebouncedValue_1.useDebouncedValue)(state.search, 250);
    const { rankedStores, flatRows, shownCount, totalCount, } = (0, useDerivedRows_1.useDerivedRows)({
        stores,
        debouncedSearch,
        statusFilters: state.statusFilters,
        formatFilters: state.formatFilters,
        pinned: state.pinned,
        expanded: state.expanded,
        sortBy: state.sortBy,
        sortDir: state.sortDir,
    });
    /* ----------------- Cross-filter → setDataMask (через ref) -----------------
       hooks — новый объект в каждом рендере, если поместить setDataMask
       в dep-array напрямую, useEffect будет срабатывать в цикле. Храним в ref. */
    const setDataMaskRef = (0, react_1.useRef)(hooks.setDataMask);
    (0, react_1.useEffect)(() => {
        setDataMaskRef.current = hooks.setDataMask;
    }, [hooks]);
    (0, react_1.useEffect)(() => {
        if (!emitCrossFilters)
            return;
        const fn = setDataMaskRef.current;
        if (!fn)
            return;
        fn((0, crossFilter_1.buildDataMask)({
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
    const statusOptions = (0, react_1.useMemo)(() => {
        const counts = {
            ok: 0,
            writeoff: 0,
            shrinkage: 0,
            critical: 0,
        };
        stores.forEach(s => {
            counts[s.status] += 1;
        });
        return Object.keys(statusRules_1.STATUSES).map(key => ({
            key,
            label: statusRules_1.STATUSES[key].label,
            color: (0, colorFromKey_1.colorFromKey)(statusRules_1.STATUSES[key].colorKey, tokens),
            count: counts[key],
        }));
    }, [stores, tokens]);
    const formatOptions = (0, react_1.useMemo)(() => {
        const counts = {
            express: 0,
            minimarket: 0,
            super: 0,
            home: 0,
            superstore: 0,
        };
        stores.forEach(s => {
            counts[s.format] += 1;
        });
        return rankedStoresMock_1.FORMAT_ORDER.map(code => ({
            key: code,
            label: rankedStoresMock_1.FORMATS_META[code].name,
            color: (0, colorFromKey_1.colorFromKey)(rankedStoresMock_1.FORMATS_META[code].colorKey, tokens),
            count: counts[code],
        }));
    }, [stores, tokens]);
    /* ----------------- Event handlers ----------------- */
    const handleSort = (0, react_1.useCallback)((sortKey, defaultDir) => {
        dispatch({ type: 'TOGGLE_SORT', payload: { sortKey, defaultDir } });
    }, []);
    const handleRowClick = (0, react_1.useCallback)((id, idx, e) => {
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
    const handleRowDblClick = (0, react_1.useCallback)((id, parentStoreId) => {
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
    const handleToggleExpand = (0, react_1.useCallback)((id) => {
        const store = stores.find(s => s.id === id);
        const segmentIds = store
            ? store.segmentsDist.map(seg => seg.segmentId)
            : [];
        dispatch({ type: 'TOGGLE_EXPAND', payload: { id, segmentIds } });
    }, [stores]);
    const handleTogglePin = (0, react_1.useCallback)((id) => {
        dispatch({ type: 'TOGGLE_PIN', payload: id });
    }, []);
    /* ----------------- Tooltip ----------------- */
    const [tt, setTt] = (0, react_1.useState)({ store: null, pos: null });
    const handleRowMouseEnter = (0, react_1.useCallback)((id, e) => {
        const s = rankedStores.find(x => x.id === id);
        if (s)
            setTt({ store: s, pos: { x: e.clientX, y: e.clientY } });
    }, [rankedStores]);
    const handleRowMouseMove = (0, react_1.useCallback)((_id, e) => {
        setTt(prev => prev.store ? { store: prev.store, pos: { x: e.clientX, y: e.clientY } } : prev);
    }, []);
    const handleRowMouseLeave = (0, react_1.useCallback)(() => {
        setTt({ store: null, pos: null });
    }, []);
    /* ----------------- Active modal store/segment ----------------- */
    const activeModalStore = (0, react_1.useMemo)(() => state.modal.kind && state.modal.storeId
        ? stores.find(s => s.id === state.modal.storeId) ?? null
        : null, [state.modal, stores]);
    const activeModalSegment = (0, react_1.useMemo)(() => {
        if (state.modal.kind !== 'segment' || !activeModalStore)
            return null;
        return (activeModalStore.segmentsDist.find(x => x.id === state.modal.segmentId) ??
            null);
    }, [state.modal, activeModalStore]);
    /* ----------------- Flags ----------------- */
    const hasAnyFilter = state.statusFilters.size > 0 ||
        state.formatFilters.size > 0 ||
        state.search.length > 0;
    const rootRef = (0, react_1.useRef)(null);
    /* ----------------- Keyboard navigation ↑/↓/Enter/Esc ----------------- */
    const focusedIdx = (0, react_1.useMemo)(() => {
        if (!state.focusedRowId)
            return -1;
        return flatRows.findIndex(r => r.data.id === state.focusedRowId);
    }, [flatRows, state.focusedRowId]);
    (0, useKeyboardNav_1.useKeyboardNav)({
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
    return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { ref: rootRef, "$width": width, "$height": height, style: cssVars, className: "leaderboard-card", children: [(0, jsx_runtime_1.jsx)(react_2.Global, { styles: (0, react_2.css)(styles_1.KEYFRAMES_CSS) }), (0, jsx_runtime_1.jsx)(styles_1.Wrap, { children: (0, jsx_runtime_1.jsxs)(styles_1.Card, { children: [(0, jsx_runtime_1.jsxs)(styles_1.CardHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.TitleBlock, { children: [(0, jsx_runtime_1.jsx)(styles_1.CardTitle, { children: "\u0420\u0435\u0439\u0442\u0438\u043D\u0433 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432" }), (0, jsx_runtime_1.jsxs)(styles_1.CardSub, { children: [(0, jsx_runtime_1.jsxs)("span", { children: [totalCount, " \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432"] }), periodLabel && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "dot" }), (0, jsx_runtime_1.jsx)("span", { children: periodLabel })] })), (0, jsx_runtime_1.jsx)("span", { className: "dot" }), (0, jsx_runtime_1.jsxs)("span", { children: ["\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430 \u2014 ", sortLabel(state.sortBy)] })] })] }), (0, jsx_runtime_1.jsxs)(styles_1.Controls, { children: [(0, jsx_runtime_1.jsx)(MultiSelectDropdown_1.default, { label: "\u0421\u0442\u0430\u0442\u0443\u0441", options: statusOptions, selected: state.statusFilters, onToggle: k => dispatch({ type: 'TOGGLE_STATUS', payload: k }) }), (0, jsx_runtime_1.jsx)(MultiSelectDropdown_1.default, { label: "\u0424\u043E\u0440\u043C\u0430\u0442\u044B", options: formatOptions, selected: state.formatFilters, onToggle: k => dispatch({ type: 'TOGGLE_FORMAT', payload: k }) }), (0, jsx_runtime_1.jsx)(SearchInput_1.default, { value: state.search, onChange: v => dispatch({ type: 'SET_SEARCH', payload: v }) }), (0, jsx_runtime_1.jsx)(CsvExportButton_1.default, { stores: rankedStores })] })] }), hasAnyFilter && ((0, jsx_runtime_1.jsx)(styles_1.FilterResetRow, { children: (0, jsx_runtime_1.jsx)(styles_1.FilterResetBtn, { type: "button", onClick: () => dispatch({ type: 'RESET_FILTERS' }), children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440\u044B" }) })), stores.length === 0 ? ((0, jsx_runtime_1.jsx)(EmptyState_1.default, { title: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432", description: 'Включите «Режим проектирования» в настройках для тестовых данных, ' +
                                'либо настройте Сопоставление колонок под ваш dataset. Ожидаемые поля: ' +
                                'store_id, store_name, city, format, format_name, division, to_class, ' +
                                'writeoff_pct, shrinkage_pct, plan_writeoff_pct, plan_shrinkage_pct, ' +
                                'avg_writeoff_rub, avg_shrinkage_check_rub.' })) : ((0, jsx_runtime_1.jsxs)(styles_1.TableWrap, { role: "table", "aria-label": "\u0420\u0435\u0439\u0442\u0438\u043D\u0433 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432", children: [(0, jsx_runtime_1.jsx)(TableHeader_1.default, { sortBy: state.sortBy, sortDir: state.sortDir, onSort: handleSort }), (0, jsx_runtime_1.jsx)(TableBody_1.default, { rows: flatRows, allStores: stores, crossSelected: state.storeCross, segmentCrossSelected: state.segmentCross, pinned: state.pinned, expanded: state.expanded, focusedRowId: state.focusedRowId, tokens: tokens, onRowClick: handleRowClick, onRowDblClick: handleRowDblClick, onRowMouseEnter: handleRowMouseEnter, onRowMouseMove: handleRowMouseMove, onRowMouseLeave: handleRowMouseLeave, onToggleExpand: handleToggleExpand, onTogglePin: handleTogglePin })] })), (0, jsx_runtime_1.jsx)(FooterHints_1.default, { shown: shownCount, total: totalCount })] }) }), (0, jsx_runtime_1.jsx)(Tooltip_1.default, { visible: tt.store !== null, pos: tt.pos, children: tt.store && ((0, jsx_runtime_1.jsx)(TooltipContent, { store: tt.store, allStores: stores, tokens: tokens })) }), (0, jsx_runtime_1.jsx)(StoreModal_1.default, { open: state.modal.kind === 'store', store: activeModalStore, allStores: stores, tokens: tokens, onClose: () => dispatch({ type: 'CLOSE_MODAL' }), periodLabel: periodLabel }), (0, jsx_runtime_1.jsx)(SegmentModal_1.default, { open: state.modal.kind === 'segment', parentStore: activeModalStore, segment: activeModalSegment, allStores: stores, tokens: tokens, onClose: () => dispatch({ type: 'CLOSE_MODAL' }), periodLabel: periodLabel })] }));
}
/* =================================================================
 * Tooltip content
 * ================================================================= */
function sortLabel(sortBy) {
    switch (sortBy) {
        case 'lossCombined':
            return 'по уровню потерь';
        case 'writeoff':
            return 'по % списаний';
        case 'shrinkage':
            return 'по % недостач';
        case 'avgWriteoff':
            return 'по ср. сумме списаний';
        case 'avgShrinkageCheck':
            return 'по ср. чеку недостач';
        case 'statusRank':
            return 'по статусу';
        case 'name':
            return 'по имени';
        default:
            return '';
    }
}
function TooltipContent({ store, allStores, tokens }) {
    const st = statusRules_1.STATUSES[store.status];
    const color = (0, colorFromKey_1.colorFromKey)(st.colorKey, tokens);
    const dW = store.writeoff - store.planWriteoff;
    const dS = store.shrinkage - store.planShrinkage;
    const dWcls = (0, formatRussian_1.deltaClass)(dW, true);
    const dScls = (0, formatRussian_1.deltaClass)(dS, true);
    const fmtStores = allStores
        .filter(x => x.format === store.format)
        .sort((a, b) => b.lossCombined - a.lossCombined);
    const rank = fmtStores.findIndex(x => x.id === store.id) + 1;
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "tt-head", children: [(0, jsx_runtime_1.jsx)("div", { className: "tt-status", style: { background: color } }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-titles", children: [(0, jsx_runtime_1.jsx)("div", { className: "tt-name", children: store.shortLabel }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-sub", children: [store.code, " \u00B7 ", store.city, " \u00B7 ", store.formatName] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-trend", children: [(0, jsx_runtime_1.jsx)("div", { className: "tt-trend-l", children: "\u0422\u0440\u0435\u043D\u0434 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439 (12 \u043D\u0435\u0434)" }), (0, jsx_runtime_1.jsx)(MiniSparkline_1.default, { data: store.spark, color: tokens.tangerine, background: tokens.g100, width: 280, height: 36 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-rows", children: [(0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: "\u0421\u043F\u0438\u0441\u0430\u043D\u0438\u044F / \u043F\u043B\u0430\u043D" }), (0, jsx_runtime_1.jsxs)("span", { className: `tt-v ${dWcls}`, children: [(0, formatRussian_1.nf2)(store.writeoff), "%", ' ', (0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--g500)', fontWeight: 500 }, children: ["/", (0, formatRussian_1.nf2)(store.planWriteoff), "%"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0447\u0438 / \u043F\u043B\u0430\u043D" }), (0, jsx_runtime_1.jsxs)("span", { className: `tt-v ${dScls}`, children: [(0, formatRussian_1.nf2)(store.shrinkage), "%", ' ', (0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--g500)', fontWeight: 500 }, children: ["/", (0, formatRussian_1.nf2)(store.planShrinkage), "%"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: "\u0420\u0430\u043D\u0433 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435" }), (0, jsx_runtime_1.jsxs)("span", { className: "tt-v", children: ["#", rank, " \u0438\u0437 ", fmtStores.length] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tt-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "tt-l", children: "\u0422\u041E" }), (0, jsx_runtime_1.jsxs)("span", { className: "tt-v", children: [store.toClass, " \u043C\u043B\u043D \u20BD"] })] })] })] }));
}
//# sourceMappingURL=RankedStoresChart.js.map