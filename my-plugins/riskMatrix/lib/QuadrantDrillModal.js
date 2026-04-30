"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const quadrants_1 = require("./utils/quadrants");
const styles_1 = require("./styles");
const useFocusTrap_1 = require("./utils/useFocusTrap");
const LIMIT = 50;
const QuadrantDrillModal = ({ quadrantKey, quadrants, thresholds, stores, allStoresTotal, formatColorMap, formatX, formatY, formatLoss, formatCount, xShort, yShort, onClose, onOpenStore, }) => {
    const [q, setQ] = (0, react_1.useState)('');
    const qDef = quadrants[quadrantKey];
    const inQuadrant = (0, react_1.useMemo)(() => stores.filter((s) => (0, quadrants_1.getQuadrant)(s, thresholds) === quadrantKey), [stores, thresholds, quadrantKey]);
    const totalLoss = (0, react_1.useMemo)(() => inQuadrant.reduce((sum, s) => sum + (s.sumLoss ?? 0), 0), [inQuadrant]);
    const filtered = (0, react_1.useMemo)(() => {
        const query = q.trim().toLowerCase();
        const list = query
            ? inQuadrant.filter((s) => s.name.toLowerCase().includes(query) ||
                (s.city?.toLowerCase().includes(query) ?? false))
            : inQuadrant;
        return [...list].sort((a, b) => (0, quadrants_1.storeBadness)(b) - (0, quadrants_1.storeBadness)(a)).slice(0, LIMIT);
    }, [inQuadrant, q]);
    const maxX = (0, react_1.useMemo)(() => (inQuadrant.length > 0 ? Math.max(...inQuadrant.map((s) => s.x)) * 1.1 : 1), [inQuadrant]);
    const maxY = (0, react_1.useMemo)(() => inQuadrant.length > 0
        ? Math.max(...inQuadrant.map((s) => Math.max(0, s.y)), 0.1) * 1.1
        : 1, [inQuadrant]);
    const onBgClick = (e) => {
        if (e.target === e.currentTarget)
            onClose();
    };
    const lossPct = allStoresTotal > 0 ? (inQuadrant.length / allStoresTotal) * 100 : 0;
    const trapRef = (0, useFocusTrap_1.useFocusTrap)(true);
    return ((0, jsx_runtime_1.jsx)(styles_1.ModalBg, { "data-open": "true", onClick: onBgClick, children: (0, jsx_runtime_1.jsxs)(styles_1.Modal, { role: "dialog", "aria-modal": "true", "aria-labelledby": "sr-quad-title", ref: trapRef, children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-head", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-status", style: { background: qDef.color } }), (0, jsx_runtime_1.jsxs)("div", { className: "m-titles", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-title", id: "sr-quad-title", children: qDef.label.replace(/\s[⚠✓]$/, '') }), (0, jsx_runtime_1.jsx)("div", { className: "m-sub", children: qDef.description })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "m-close", onClick: onClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-summary", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "\u041E\u0431\u044A\u0435\u043A\u0442\u043E\u0432" }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", children: formatCount(inQuadrant.length) }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat-d wn", children: [lossPct.toFixed(1), "% \u043E\u0442 \u0432\u0441\u0435\u0445"] })] }), totalLoss > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "\u0421\u0443\u043C\u043C\u0430 \u043F\u043E\u0442\u0435\u0440\u044C" }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", style: { color: qDef.color }, children: formatLoss(totalLoss) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-stat-l", children: ["\u0421\u0440\u0435\u0434. ", xShort] }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", children: formatX(inQuadrant.length > 0
                                        ? inQuadrant.reduce((s, x) => s + x.x, 0) / inQuadrant.length
                                        : 0) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-stat-l", children: ["\u0421\u0440\u0435\u0434. ", yShort] }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", children: formatY(inQuadrant.length > 0
                                        ? inQuadrant.reduce((s, x) => s + x.y, 0) / inQuadrant.length
                                        : 0) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-section", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-section-l", children: [(0, jsx_runtime_1.jsx)("span", { children: "\u041E\u0431\u044A\u0435\u043A\u0442\u044B \u043A\u0432\u0430\u0434\u0440\u0430\u043D\u0442\u0430" }), (0, jsx_runtime_1.jsx)("span", { className: "count", children: q.trim()
                                        ? `${filtered.length} из ${inQuadrant.length} найдено`
                                        : `${inQuadrant.length} всего · показано ${filtered.length}` })] }), (0, jsx_runtime_1.jsx)("div", { style: { marginBottom: 10 }, children: (0, jsx_runtime_1.jsxs)(styles_1.SearchWrap, { className: q.length > 0 ? 'has-value' : '', style: { width: '100%' }, children: [(0, jsx_runtime_1.jsxs)("svg", { className: "search-icon", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("circle", { cx: "6", cy: "6", r: "4" }), (0, jsx_runtime_1.jsx)("line", { x1: "9.5", y1: "9.5", x2: "12.5", y2: "12.5" })] }), (0, jsx_runtime_1.jsx)(styles_1.SearchInput, { type: "text", placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0438\u043C\u0435\u043D\u0438 \u0438\u043B\u0438 \u0433\u043E\u0440\u043E\u0434\u0443\u2026", autoComplete: "off", value: q, onChange: (e) => setQ(e.target.value), "aria-label": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043E\u0431\u044A\u0435\u043A\u0442\u0430\u043C \u043A\u0432\u0430\u0434\u0440\u0430\u043D\u0442\u0430" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "search-clear", onClick: () => setQ(''), "aria-label": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "8", y2: "8" }), (0, jsx_runtime_1.jsx)("line", { x1: "8", y1: "2", x2: "2", y2: "8" })] }) })] }) }), filtered.length === 0 ? ((0, jsx_runtime_1.jsxs)(styles_1.EmptyBlock, { children: ["\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E", q.trim() ? ` по запросу «${q}»` : ''] })) : ((0, jsx_runtime_1.jsxs)("div", { style: {
                                display: 'grid',
                                gridTemplateColumns: '24px minmax(0,1fr) 60px minmax(120px, 180px) 60px minmax(120px, 180px)',
                                alignItems: 'center',
                                gap: 10,
                                padding: '6px 12px',
                                fontFamily: 'var(--m)',
                                fontSize: 8.5,
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: 'var(--g500)',
                                borderBottom: '1px solid var(--g200)',
                                marginBottom: 6,
                            }, children: [(0, jsx_runtime_1.jsx)("span", { style: { textAlign: 'center' }, children: "#" }), (0, jsx_runtime_1.jsx)("span", { children: "\u041E\u0431\u044A\u0435\u043A\u0442" }), (0, jsx_runtime_1.jsx)("span", { style: { textAlign: 'right' }, children: xShort }), (0, jsx_runtime_1.jsx)("span", { style: { textAlign: 'center', opacity: 0.7 }, children: "\u0444\u0430\u043A\u0442 vs \u043F\u043B\u0430\u043D" }), (0, jsx_runtime_1.jsx)("span", { style: { textAlign: 'right' }, children: yShort }), (0, jsx_runtime_1.jsx)("span", { style: { textAlign: 'center', opacity: 0.7 }, children: "\u0444\u0430\u043A\u0442 vs \u043F\u043B\u0430\u043D" })] })), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', flexDirection: 'column', gap: 4 }, children: filtered.map((s, i) => {
                                const dx = s.planX && s.planX !== 0 ? (s.x - s.planX) / s.planX : 0;
                                const dy = s.planY && s.planY !== 0 ? (s.y - s.planY) / s.planY : 0;
                                const dxCls = dx > 0.03 ? 'dn' : dx < -0.03 ? 'up' : 'wn';
                                const dyCls = dy > 0.03 ? 'dn' : dy < -0.03 ? 'up' : 'wn';
                                const xBarPct = (s.x / maxX) * 100;
                                const xTargetPct = s.planX != null ? (s.planX / maxX) * 100 : 0;
                                const yBarPct = (Math.max(0, s.y) / maxY) * 100;
                                const yTargetPct = s.planY != null ? (s.planY / maxY) * 100 : 0;
                                return ((0, jsx_runtime_1.jsxs)(styles_1.StoreRow, { onClick: () => onOpenStore(s.id), title: `${s.name} · ${xShort}: ${formatX(s.x)} · ${yShort}: ${formatY(s.y)}`, role: "button", tabIndex: 0, onKeyDown: (e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onOpenStore(s.id);
                                        }
                                    }, children: [(0, jsx_runtime_1.jsx)("div", { className: "rank", children: String(i + 1).padStart(2, '0') }), (0, jsx_runtime_1.jsxs)("div", { className: "name", children: [s.name, s.city && (0, jsx_runtime_1.jsx)("span", { className: "city", children: s.city })] }), (0, jsx_runtime_1.jsx)("div", { className: `cell-v ${dxCls}`, children: formatX(s.x) }), (0, jsx_runtime_1.jsxs)("div", { className: "mini-bullet", children: [(0, jsx_runtime_1.jsx)("div", { className: "mini-bar", style: { width: `${xBarPct}%`, background: 'var(--c-tangerine)' } }), s.planX != null && ((0, jsx_runtime_1.jsx)("div", { className: "mini-target", style: { left: `calc(${xTargetPct}% - 1px)` } }))] }), (0, jsx_runtime_1.jsx)("div", { className: `cell-v ${dyCls}`, children: formatY(s.y) }), (0, jsx_runtime_1.jsxs)("div", { className: "mini-bullet", children: [(0, jsx_runtime_1.jsx)("div", { className: "mini-bar", style: { width: `${yBarPct}%`, background: 'var(--c-sky)' } }), s.planY != null && ((0, jsx_runtime_1.jsx)("div", { className: "mini-target", style: { left: `calc(${yTargetPct}% - 1px)` } }))] })] }, s.id));
                            }) })] })] }) }));
};
exports.default = QuadrantDrillModal;
//# sourceMappingURL=QuadrantDrillModal.js.map