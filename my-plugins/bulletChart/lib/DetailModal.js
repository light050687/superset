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
function statusColor(s) {
    if (s === 'good')
        return 'var(--up)';
    if (s === 'bad')
        return 'var(--dn)';
    if (s === 'warn')
        return 'var(--wn)';
    return 'var(--g500)';
}
const DetailModal = ({ row, scaleMax, direction, formatters, detailQueryParams, mockMode, onClose, rootEl, }) => {
    // Mock-режим: используем storesList из пресета (ref:553-612).
    const initialStores = React.useMemo(() => {
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
    const shouldFetch = !mockMode && !!detailQueryParams;
    const [loading, setLoading] = React.useState(shouldFetch);
    const [error, setError] = React.useState(null);
    const [stores, setStores] = React.useState(initialStores);
    React.useEffect(() => {
        if (!shouldFetch || !detailQueryParams)
            return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        (0, detailApi_1.fetchDetailRows)({ ...detailQueryParams, categoryValue: row.name })
            .then(rowsFromApi => {
            if (!cancelled) {
                setStores(rowsFromApi);
                setLoading(false);
            }
        })
            .catch((err) => {
            if (!cancelled) {
                const msg = err instanceof Error ? err.message : 'Не удалось загрузить детализацию';
                setError(msg);
                setLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [shouldFetch, detailQueryParams, row.name]);
    React.useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);
    const closeRef = React.useRef(null);
    React.useEffect(() => {
        closeRef.current?.focus();
    }, []);
    if (!rootEl)
        return null;
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
    // Сортировка по убыванию rate (ref:942) — худшие сверху для less_is_better.
    const sortedStores = React.useMemo(() => {
        const copy = [...stores];
        return copy.sort((a, b) => direction === 'less_is_better' ? b.rate - a.rate : a.rate - b.rate);
    }, [stores, direction]);
    // Shared scale для mini-bullet всех stores (ref:943).
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
    // % магазинов хуже плана.
    const worseCount = stores.filter(s => {
        if (s.plan == null)
            return false;
        return direction === 'less_is_better' ? s.rate > s.plan : s.rate < s.plan;
    }).length;
    const worsePct = stores.length > 0 ? Math.round((worseCount / stores.length) * 100) : 0;
    const worseTone = stores.length === 0
        ? 'default'
        : worsePct > 50
            ? 'dn'
            : worsePct > 30
                ? 'wn'
                : 'up';
    const rowStatusColor = statusColor(row.status);
    return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)(styles_1.ModalBg, { role: "presentation", onClick: onClose, children: (0, jsx_runtime_1.jsxs)(styles_1.ModalBox, { role: "dialog", "aria-modal": "true", "aria-labelledby": "bc-modal-title", onClick: (e) => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalTitles, { children: [(0, jsx_runtime_1.jsx)(styles_1.ModalTitle, { id: "bc-modal-title", children: row.name }), (0, jsx_runtime_1.jsx)(styles_1.ModalSub, { children: row.stores != null ? (0, format_1.formatStoresCount)(row.stores) : '' })] }), (0, jsx_runtime_1.jsx)(styles_1.ModalCloseBtn, { ref: closeRef, type: "button", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: onClose, children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalSummary, { children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalStat, { children: [(0, jsx_runtime_1.jsx)(styles_1.ModalStatL, { children: "\u0424\u0430\u043A\u0442" }), (0, jsx_runtime_1.jsx)(styles_1.ModalStatV, { style: { color: rowStatusColor }, children: formatters.value(row.rate) }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStatD, { tone: deltaTone(row.deltaPlan), children: [deltaPlanStr, " \u043A \u043F\u043B\u0430\u043D\u0443"] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStat, { children: [(0, jsx_runtime_1.jsx)(styles_1.ModalStatL, { children: "\u041F\u043B\u0430\u043D" }), (0, jsx_runtime_1.jsx)(styles_1.ModalStatV, { children: row.plan != null ? formatters.value(row.plan) : '—' }), (0, jsx_runtime_1.jsx)(styles_1.ModalStatD, { tone: "wn", children: "\u0446\u0435\u043B\u0435\u0432\u043E\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C" })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStat, { children: [(0, jsx_runtime_1.jsx)(styles_1.ModalStatL, { children: "\u041F\u0440\u043E\u0448\u043B\u044B\u0439 \u0433\u043E\u0434" }), (0, jsx_runtime_1.jsx)(styles_1.ModalStatV, { children: row.py != null ? formatters.value(row.py) : '—' }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStatD, { tone: deltaTone(row.deltaPy), children: [deltaPyStr, " \u043A \u041F\u0413"] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStat, { children: [(0, jsx_runtime_1.jsx)(styles_1.ModalStatL, { children: "\u0425\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430" }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStatV, { children: [worseCount, (0, jsx_runtime_1.jsxs)("span", { className: "u", children: [" \u0438\u0437 ", stores.length || '—'] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalStatD, { tone: worseTone, children: [worsePct, "%"] })] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalSection, { children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalSectionL, { children: [(0, jsx_runtime_1.jsx)("span", { children: "\u0414\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F" }), (0, jsx_runtime_1.jsx)("span", { className: "count", children: loading ? 'загрузка…' : `${stores.length}` })] }), error ? ((0, jsx_runtime_1.jsxs)(styles_1.DetailErrorBlock, { children: ["\u041E\u0448\u0438\u0431\u043A\u0430: ", error] })) : null, !error ? ((0, jsx_runtime_1.jsx)(styles_1.StoreList, { children: loading
                                ? Array.from({ length: 4 }).map((_, i) => ((0, jsx_runtime_1.jsxs)(styles_1.StoreRow, { style: { opacity: 0.5 }, children: [(0, jsx_runtime_1.jsx)("span", { className: "rank", children: "\u2014" }), (0, jsx_runtime_1.jsx)("span", { className: "name", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026" }), (0, jsx_runtime_1.jsx)("div", { className: "mini-bullet" }), (0, jsx_runtime_1.jsx)("span", { className: "pct", children: "\u2014" }), (0, jsx_runtime_1.jsx)("span", { className: "delta", children: "\u2014" })] }, `skel-${i}`)))
                                : sortedStores.map((s, i) => {
                                    const d = s.plan != null ? s.rate - s.plan : null;
                                    const st = (0, aggregation_1.computeStatus)(s.rate, s.plan, direction);
                                    const color = statusColor(st);
                                    return ((0, jsx_runtime_1.jsxs)(styles_1.StoreRow, { children: [(0, jsx_runtime_1.jsx)("span", { className: "rank", children: String(i + 1).padStart(2, '0') }), (0, jsx_runtime_1.jsx)("span", { className: "name", title: s.name, children: s.name }), (0, jsx_runtime_1.jsxs)("div", { className: "mini-bullet", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("div", { className: "mini-bar", style: { width: `${pct(s.rate)}%`, background: color } }), s.plan != null ? ((0, jsx_runtime_1.jsx)("div", { className: "mini-target", style: { left: `calc(${pct(s.plan)}% - 1px)` } })) : null] }), (0, jsx_runtime_1.jsx)("span", { className: "pct", style: { color }, children: formatters.value(s.rate) }), (0, jsx_runtime_1.jsx)("span", { className: 'delta ' +
                                                    (st === 'good' ? 'up' : st === 'bad' ? 'dn' : 'wn'), children: d != null ? formatters.deltaPP(d) : '—' })] }, `${s.name}-${i}`));
                                }) })) : null] })] }) }), rootEl);
};
exports.default = DetailModal;
//# sourceMappingURL=DetailModal.js.map