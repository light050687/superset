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
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_dom_1 = require("react-dom");
const styles_1 = require("./styles");
const detailApi_1 = require("./utils/detailApi");
const format_1 = require("./utils/format");
const aggregation_1 = require("./utils/aggregation");
const PAGE_SIZE = 20;
function statusColor(s) {
    if (s === 'good')
        return 'var(--up)';
    if (s === 'bad')
        return 'var(--dn)';
    if (s === 'warn')
        return 'var(--wn)';
    return 'var(--g500)';
}
/* Numbered pagination helper — паттерн из scorecard DetailModal:
   <= 7 страниц: все. Иначе: первые/последние + текущая ± 1, ellipsis между. */
function getPageNumbers(current0, total) {
    if (total <= 7)
        return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set();
    pages.add(1);
    pages.add(total);
    pages.add(total - 1);
    pages.add(total - 2);
    const cur1 = current0 + 1;
    pages.add(cur1);
    if (cur1 > 1)
        pages.add(cur1 - 1);
    if (cur1 < total)
        pages.add(cur1 + 1);
    const sorted = [...pages]
        .filter(p => p >= 1 && p <= total)
        .sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1)
            result.push('...');
        result.push(sorted[i]);
    }
    return result;
}
const DetailModal = ({ row, scaleMax, direction, formatters, detailQueryParams, mockMode, onClose, rootEl, }) => {
    // ── Server-paged state (real-data режим) ──
    const [currentPage, setCurrentPage] = React.useState(0);
    const [stores, setStores] = React.useState([]);
    const [totalCount, setTotalCount] = React.useState(null);
    const [hasNextPage, setHasNextPage] = React.useState(false);
    const [isInitialLoading, setIsInitialLoading] = React.useState(!mockMode && !!detailQueryParams);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [fetchError, setFetchError] = React.useState(null);
    // Retry-токен для перезапуска useEffect при «Повторить» — без смены currentPage.
    const [retryNonce, setRetryNonce] = React.useState(0);
    // Mock-режим: локальная пагинация по storesList пресета.
    const allMockStores = React.useMemo(() => {
        if (!mockMode || !row.storesList)
            return [];
        return row.storesList.map(s => ({
            name: s.name,
            rate: s.rate,
            plan: s.plan,
            py: s.py,
            stores: null,
        }));
    }, [mockMode, row.storesList]);
    // AbortController: предотвращает race condition при быстром переключении страниц.
    const rowsAbortRef = React.useRef(null);
    const countAbortRef = React.useRef(null);
    const hasEverLoadedRef = React.useRef(false);
    /* ── Mock-режим: локальная пагинация slice по allMockStores ── */
    React.useEffect(() => {
        if (!mockMode)
            return;
        const total = allMockStores.length;
        setTotalCount(total);
        const start = currentPage * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const slice = allMockStores.slice(start, end);
        setStores(slice);
        setHasNextPage(end < total);
        setIsInitialLoading(false);
        setIsRefreshing(false);
        setFetchError(null);
        hasEverLoadedRef.current = true;
    }, [mockMode, allMockStores, currentPage]);
    /* ── Real-data: fetchDetailRows на смену страницы ── */
    React.useEffect(() => {
        if (mockMode || !detailQueryParams)
            return undefined;
        // Abort previous request — race-condition safety на быстром переключении.
        rowsAbortRef.current?.abort();
        const controller = new AbortController();
        rowsAbortRef.current = controller;
        // Stale-while-revalidate: spinner только на initial load,
        // на смене страницы — RefreshBar + dimmed list.
        if (!hasEverLoadedRef.current) {
            setIsInitialLoading(true);
        }
        else {
            setIsRefreshing(true);
        }
        setFetchError(null);
        (0, detailApi_1.fetchDetailRows)({
            ...detailQueryParams,
            categoryValue: row.name,
            page: currentPage,
            pageSize: PAGE_SIZE,
            signal: controller.signal,
        })
            .then(result => {
            setStores(result.rows);
            setHasNextPage(result.hasNextPage);
            hasEverLoadedRef.current = true;
            setIsInitialLoading(false);
            setIsRefreshing(false);
        })
            .catch((err) => {
            if (err instanceof Error && err.name === 'AbortError')
                return;
            const msg = err instanceof Error
                ? err.message
                : 'Не удалось загрузить детализацию';
            setFetchError(msg);
            setIsInitialLoading(false);
            setIsRefreshing(false);
        });
        return () => controller.abort();
    }, [mockMode, detailQueryParams, row.name, currentPage, retryNonce]);
    /* ── Real-data: fetchDetailCount (отдельный AbortController) ── */
    React.useEffect(() => {
        if (mockMode || !detailQueryParams)
            return undefined;
        countAbortRef.current?.abort();
        const controller = new AbortController();
        countAbortRef.current = controller;
        (0, detailApi_1.fetchDetailCount)({
            ...detailQueryParams,
            categoryValue: row.name,
            signal: controller.signal,
        })
            .then(count => setTotalCount(count))
            .catch((err) => {
            if (err instanceof Error && err.name === 'AbortError')
                return;
            setTotalCount(null);
        });
        return () => controller.abort();
        // categoryValue фиксирован за время открытия модалки,
        // currentPage НЕ влияет на count — pure category total.
    }, [mockMode, detailQueryParams, row.name]);
    /* ── Cleanup при unmount ── */
    React.useEffect(() => () => {
        rowsAbortRef.current?.abort();
        countAbortRef.current?.abort();
    }, []);
    /* ── Escape close ── */
    React.useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);
    /* ── Focus management ── */
    const modalRef = React.useRef(null);
    const closeRef = React.useRef(null);
    React.useEffect(() => {
        // Фокусируем сам Modal (как в scorecard), а не CloseButton — чтобы
        // visual focus-ring не оказался на крестике при открытии.
        modalRef.current?.focus();
    }, []);
    /* ── Focus trap (Tab loops внутри модалки) ── */
    const handleKeyDown = React.useCallback((e) => {
        if (e.key !== 'Tab')
            return;
        const focusable = modalRef.current?.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length)
            return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
        else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }, []);
    if (!rootEl)
        return null;
    /* ── Summary block (4 m-stat: Факт / План / Прошлый год / Хуже плана) ── */
    const deltaPlanStr = row.deltaPlan != null ? formatters.deltaPP(row.deltaPlan) : '—';
    const deltaPyStr = row.deltaPy != null ? formatters.deltaPP(row.deltaPy) : '—';
    const deltaTone = (delta) => {
        if (delta == null)
            return 'default';
        if (Math.abs(delta) <= 0.01)
            return 'wn';
        if (direction === 'less_is_better')
            return delta > 0 ? 'dn' : 'up';
        return delta > 0 ? 'up' : 'dn';
    };
    /* ── Сортировка current page по rate (худшие сверху для less_is_better) ──
       Это per-page client sort: server отдаёт уже отсортированный по fact desc,
       но direction === 'less_is_better' переворачивает порядок для UX («хуже всех — сверху»). */
    const sortedStores = React.useMemo(() => {
        const copy = [...stores];
        return copy.sort((a, b) => direction === 'less_is_better' ? b.rate - a.rate : a.rate - b.rate);
    }, [stores, direction]);
    /* ── Shared scale для mini-bullet: max по current page × 1.1, fallback scaleMax.
       Меняется между страницами — это OK, юзер видит relative comparison ВНУТРИ
       страницы (а не global), что соответствует UX «сравнение магазинов на этой странице». */
    const storeScale = React.useMemo(() => {
        if (!stores.length)
            return scaleMax;
        const all = stores.flatMap(s => [
            s.rate,
            ...(s.plan != null ? [s.plan] : []),
            ...(s.py != null ? [s.py] : []),
        ]);
        const m = Math.max(...all);
        return Number.isFinite(m) && m > 0 ? m * 1.1 : scaleMax;
    }, [stores, scaleMax]);
    const pct = (v) => Math.min(100, Math.max(0, (v / storeScale) * 100));
    /* ── «Хуже плана: N» — по current page (не по total). Помечаем «на этой странице»,
       если есть hasNextPage или page > 0 (не весь dataset виден). */
    const worseCount = stores.filter(s => {
        if (s.plan == null)
            return false;
        return direction === 'less_is_better' ? s.rate > s.plan : s.rate < s.plan;
    }).length;
    const isPartialView = hasNextPage || currentPage > 0;
    const worseSubtitle = stores.length === 0
        ? ''
        : isPartialView
            ? `из ${stores.length} на странице`
            : `из ${stores.length}`;
    const worsePct = stores.length > 0 ? Math.round((worseCount / stores.length) * 100) : 0;
    const worseTone = stores.length === 0
        ? 'default'
        : worsePct > 50
            ? 'dn'
            : worsePct > 30
                ? 'wn'
                : 'up';
    const rowStatusColor = statusColor(row.status);
    /* ── Pagination state ── */
    const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : null;
    const showPagination = totalPages != null && totalPages > 1;
    /* ── Header counter ── */
    const headerCount = totalCount != null
        ? `${totalCount}`
        : `${stores.length}${hasNextPage ? '+' : ''}`;
    /* ── Empty / loaded states ── */
    const isEmpty = !isInitialLoading && !fetchError && stores.length === 0;
    return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)(styles_1.ModalBg, { role: "presentation", onClick: onClose, children: (0, jsx_runtime_1.jsxs)(styles_1.ModalBox, { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "bc-modal-title", tabIndex: -1, onClick: (e) => e.stopPropagation(), onKeyDown: handleKeyDown, children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalTitles, { children: [(0, jsx_runtime_1.jsx)(styles_1.ModalTitle, { id: "bc-modal-title", children: row.name }), (0, jsx_runtime_1.jsx)(styles_1.ModalSub, { children: row.stores != null ? (0, format_1.formatStoresCount)(row.stores) : '' })] }), (0, jsx_runtime_1.jsx)(styles_1.ModalCloseBtn, { ref: closeRef, type: "button", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: onClose, children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalSummary, { children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalStat, { children: [(0, jsx_runtime_1.jsx)(styles_1.ModalStatL, { children: "\u0424\u0430\u043A\u0442" }), (0, jsx_runtime_1.jsx)(styles_1.ModalStatV, { style: { color: rowStatusColor }, children: formatters.value(row.rate) }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStatD, { tone: deltaTone(row.deltaPlan), children: [deltaPlanStr, " \u043A \u043F\u043B\u0430\u043D\u0443"] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStat, { children: [(0, jsx_runtime_1.jsx)(styles_1.ModalStatL, { children: "\u041F\u043B\u0430\u043D" }), (0, jsx_runtime_1.jsx)(styles_1.ModalStatV, { children: row.plan != null ? formatters.value(row.plan) : '—' }), (0, jsx_runtime_1.jsx)(styles_1.ModalStatD, { tone: "wn", children: "\u0446\u0435\u043B\u0435\u0432\u043E\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C" })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStat, { children: [(0, jsx_runtime_1.jsx)(styles_1.ModalStatL, { children: "\u041F\u0440\u043E\u0448\u043B\u044B\u0439 \u0433\u043E\u0434" }), (0, jsx_runtime_1.jsx)(styles_1.ModalStatV, { children: row.py != null ? formatters.value(row.py) : '—' }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStatD, { tone: deltaTone(row.deltaPy), children: [deltaPyStr, " \u043A \u041F\u0413"] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStat, { children: [(0, jsx_runtime_1.jsx)(styles_1.ModalStatL, { children: "\u0425\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430" }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStatV, { children: [worseCount, worseSubtitle && ((0, jsx_runtime_1.jsxs)("span", { className: "u", children: [" ", worseSubtitle] }))] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStatD, { tone: worseTone, children: [worsePct, "%"] })] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalSection, { children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalSectionL, { children: [(0, jsx_runtime_1.jsx)("span", { children: "\u0414\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F" }), (0, jsx_runtime_1.jsx)("span", { className: "count", children: isInitialLoading ? 'загрузка…' : headerCount })] }), fetchError ? ((0, jsx_runtime_1.jsx)(styles_1.DetailErrorBlock, { children: (0, jsx_runtime_1.jsxs)(styles_1.ErrorRowInner, { children: [(0, jsx_runtime_1.jsxs)("span", { children: ["\u041E\u0448\u0438\u0431\u043A\u0430: ", fetchError] }), (0, jsx_runtime_1.jsx)(styles_1.RetryButton, { type: "button", onClick: () => {
                                            setFetchError(null);
                                            setRetryNonce(n => n + 1);
                                        }, children: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" })] }) })) : null, !fetchError && ((0, jsx_runtime_1.jsxs)(styles_1.StoreListWrap, { children: [isRefreshing && (0, jsx_runtime_1.jsx)(styles_1.RefreshBar, { "aria-hidden": "true" }), isInitialLoading ? ((0, jsx_runtime_1.jsxs)(styles_1.LoaderRowInner, { children: [(0, jsx_runtime_1.jsx)(styles_1.InlineSpinnerLarge, { "aria-label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430" }), "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026"] })) : isEmpty ? ((0, jsx_runtime_1.jsx)(styles_1.LoaderRowInner, { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445" })) : ((0, jsx_runtime_1.jsx)(styles_1.StoreList, { style: {
                                        opacity: isRefreshing ? 0.45 : 1,
                                        transition: 'opacity 0.15s ease',
                                        pointerEvents: isRefreshing ? 'none' : 'auto',
                                    }, children: sortedStores.map((s, i) => {
                                        const d = s.plan != null ? s.rate - s.plan : null;
                                        const st = (0, aggregation_1.computeStatus)(s.rate, s.plan, direction);
                                        const color = statusColor(st);
                                        const globalRank = currentPage * PAGE_SIZE + i + 1;
                                        return ((0, jsx_runtime_1.jsxs)(styles_1.StoreRow, { children: [(0, jsx_runtime_1.jsx)("span", { className: "rank", children: String(globalRank).padStart(2, '0') }), (0, jsx_runtime_1.jsx)("span", { className: "name", title: s.name, children: s.name }), (0, jsx_runtime_1.jsxs)("div", { className: "mini-bullet", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("div", { className: "mini-bar", style: {
                                                                width: `${pct(s.rate)}%`,
                                                                background: color,
                                                            } }), s.plan != null ? ((0, jsx_runtime_1.jsx)("div", { className: "mini-target", style: {
                                                                left: `calc(${pct(s.plan)}% - 1px)`,
                                                            } })) : null] }), (0, jsx_runtime_1.jsx)("span", { className: "pct", style: { color }, children: formatters.value(s.rate) }), (0, jsx_runtime_1.jsx)("span", { className: 'delta ' +
                                                        (st === 'good'
                                                            ? 'up'
                                                            : st === 'bad'
                                                                ? 'dn'
                                                                : 'wn'), children: d != null ? formatters.deltaPP(d) : '—' })] }, `${s.name}-${i}`));
                                    }) }))] }))] }), showPagination && ((0, jsx_runtime_1.jsxs)(styles_1.PaginationWrap, { style: {
                        opacity: isRefreshing ? 0.5 : 1,
                        pointerEvents: isRefreshing ? 'none' : 'auto',
                        transition: 'opacity 0.15s ease',
                    }, "aria-label": "\u041D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F \u043F\u043E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430\u043C", children: [getPageNumbers(currentPage, totalPages).map((item, idx) => item === '...' ? ((0, jsx_runtime_1.jsx)(styles_1.PageEllipsis, { children: "\u2026" }, `e${idx}`)) : ((0, jsx_runtime_1.jsx)(styles_1.PageBtn, { type: "button", isActive: item === currentPage + 1, "aria-label": `Страница ${item}`, "aria-current": item === currentPage + 1 ? 'page' : undefined, onClick: () => setCurrentPage(item - 1), disabled: isRefreshing, children: item }, item))), totalPages > 7 && ((0, jsx_runtime_1.jsx)(styles_1.PageInput, { type: "number", min: 1, max: totalPages, placeholder: "\u2116", "aria-label": "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443", disabled: isRefreshing, onKeyDown: (e) => {
                                if (e.key === 'Enter') {
                                    const val = parseInt(e.target.value, 10);
                                    if (val >= 1 && val <= totalPages) {
                                        setCurrentPage(val - 1);
                                        e.target.value = '';
                                    }
                                }
                            } }))] }))] }) }), rootEl);
};
exports.default = DetailModal;
//# sourceMappingURL=DetailModal.js.map