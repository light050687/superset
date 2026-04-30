"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const useFocusTrap_1 = require("../hooks/useFocusTrap");
const styles_1 = require("../styles");
const statusRules_1 = require("../utils/statusRules");
const colorFromKey_1 = require("../utils/colorFromKey");
const formatRussian_1 = require("../utils/formatRussian");
const RankedBarList_1 = __importDefault(require("./RankedBarList"));
const TrendChart_1 = __importDefault(require("./TrendChart"));
function StoreModalInner({ open, store, allStores, tokens, onClose, periodLabel, }) {
    const modalRef = (0, react_1.useRef)(null);
    (0, useFocusTrap_1.useFocusTrap)(open, modalRef);
    (0, react_1.useEffect)(() => {
        if (!open)
            return undefined;
        const onEsc = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
    }, [open, onClose]);
    const rankInFmt = (0, react_1.useMemo)(() => {
        if (!store)
            return { rank: 0, total: 0 };
        const fmtStores = allStores
            .filter(x => x.format === store.format)
            .sort((a, b) => b.lossCombined - a.lossCombined);
        return {
            rank: fmtStores.findIndex(x => x.id === store.id) + 1,
            total: fmtStores.length,
        };
    }, [store, allStores]);
    if (!open || !store)
        return null;
    const s = store;
    const st = statusRules_1.STATUSES[s.status];
    const stColor = (0, colorFromKey_1.colorFromKey)(st.colorKey, tokens);
    const dW = s.writeoff - s.planWriteoff;
    const dS = s.shrinkage - s.planShrinkage;
    const dWcls = (0, formatRussian_1.deltaClass)(dW, true);
    const dScls = (0, formatRussian_1.deltaClass)(dS, true);
    const trendDir = s.spark[11] > s.spark[0]
        ? '↗ растёт'
        : s.spark[11] < s.spark[0]
            ? '↘ снижается'
            : '→ стабильно';
    return ((0, jsx_runtime_1.jsx)(styles_1.ModalBg, { "$open": open, onClick: e => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: (0, jsx_runtime_1.jsxs)(styles_1.Modal, { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "rs-modal-title", tabIndex: -1, children: [(0, jsx_runtime_1.jsxs)(styles_1.MHead, { children: [(0, jsx_runtime_1.jsx)(styles_1.MStatusBar, { "$color": stColor }), (0, jsx_runtime_1.jsxs)(styles_1.MTitles, { children: [(0, jsx_runtime_1.jsx)(styles_1.MTitle, { id: "rs-modal-title", children: s.name }), (0, jsx_runtime_1.jsxs)(styles_1.MSub, { children: [(0, jsx_runtime_1.jsx)("span", { className: "code", children: s.code }), (0, jsx_runtime_1.jsx)("span", { children: s.city }), (0, jsx_runtime_1.jsx)("span", { className: "dot" }), (0, jsx_runtime_1.jsx)("span", { children: s.formatName }), (0, jsx_runtime_1.jsx)("span", { className: "dot" }), (0, jsx_runtime_1.jsxs)("span", { children: ["\u0422\u041E ", s.toClass, " \u043C\u043B\u043D \u20BD"] }), periodLabel && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "dot" }), (0, jsx_runtime_1.jsx)("span", { children: periodLabel })] }))] })] }), (0, jsx_runtime_1.jsx)(styles_1.MClose, { type: "button", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: onClose, children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), (0, jsx_runtime_1.jsxs)(styles_1.MSummary, { children: [(0, jsx_runtime_1.jsxs)(styles_1.MStat, { children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "% \u0421\u043F\u0438\u0441\u0430\u043D\u0438\u0439" }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat-v", style: { color: tokens.tangerine }, children: [(0, formatRussian_1.nf2)(s.writeoff), (0, jsx_runtime_1.jsx)("span", { className: "u", children: "%" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `m-stat-d ${dWcls}`, children: [(0, formatRussian_1.fmtDelta)(dW), " \u043A \u043F\u043B\u0430\u043D\u0443"] })] }), (0, jsx_runtime_1.jsxs)(styles_1.MStat, { children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "% \u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0447" }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat-v", style: { color: tokens.sky }, children: [(0, formatRussian_1.nf2)(s.shrinkage), (0, jsx_runtime_1.jsx)("span", { className: "u", children: "%" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `m-stat-d ${dScls}`, children: [(0, formatRussian_1.fmtDelta)(dS), " \u043A \u043F\u043B\u0430\u043D\u0443"] })] }), (0, jsx_runtime_1.jsxs)(styles_1.MStat, { children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "\u0420\u0430\u043D\u0433 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435" }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat-v", children: ["#", rankInFmt.rank, (0, jsx_runtime_1.jsxs)("span", { className: "u", children: ["\u0438\u0437 ", rankInFmt.total] })] }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-d wn", children: s.formatName })] }), (0, jsx_runtime_1.jsxs)(styles_1.MStat, { children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", style: { color: stColor, fontSize: 17 }, children: st.label }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-d wn", children: st.description })] })] }), (0, jsx_runtime_1.jsxs)(styles_1.MTrendWrap, { children: [(0, jsx_runtime_1.jsxs)(styles_1.MSectionL, { as: "div", style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }, children: [(0, jsx_runtime_1.jsx)("span", { children: "\u0422\u0440\u0435\u043D\u0434 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439 \u00B7 12 \u043D\u0435\u0434\u0435\u043B\u044C" }), (0, jsx_runtime_1.jsxs)(styles_1.MTrendLast, { children: [(0, formatRussian_1.nf2)(s.writeoff), "% \u00B7 ", trendDir] })] }), (0, jsx_runtime_1.jsx)(TrendChart_1.default, { data: s.spark, tokens: tokens })] }), (0, jsx_runtime_1.jsxs)(styles_1.M3Col, { children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(styles_1.MSectionL, { children: "\u041F\u0440\u0438\u0447\u0438\u043D\u044B \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439" }), (0, jsx_runtime_1.jsx)(RankedBarList_1.default, { items: s.causeDist.map(c => ({
                                        name: c.type.name,
                                        pct: c.pct,
                                        delta: c.delta,
                                        color: (0, colorFromKey_1.colorFromKey)(c.type.colorKey, tokens),
                                    })) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(styles_1.MSectionL, { children: "\u0412\u0438\u0434\u044B \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439" }), (0, jsx_runtime_1.jsx)(RankedBarList_1.default, { items: s.woTypeDist.map(w => ({
                                        name: w.name,
                                        pct: w.pct,
                                        delta: w.delta,
                                        color: tokens.sky,
                                    })) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(styles_1.MSectionL, { children: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C" }), (0, jsx_runtime_1.jsxs)(styles_1.MProfile, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0424\u043E\u0440\u043C\u0430\u0442" }), (0, jsx_runtime_1.jsx)("span", { className: "m-pr-v", children: s.formatName })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0413\u043E\u0440\u043E\u0434" }), (0, jsx_runtime_1.jsx)("span", { className: "m-pr-v", children: s.city })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0414\u0438\u0432\u0438\u0437\u0438\u043E\u043D" }), (0, jsx_runtime_1.jsx)("span", { className: "m-pr-v", children: s.division })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0422\u041E" }), (0, jsx_runtime_1.jsxs)("span", { className: "m-pr-v mono", children: [s.toClass, " \u043C\u043B\u043D \u20BD"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0421\u0440. \u0441\u0443\u043C\u043C\u0430 \u0441\u043F\u0438\u0441." }), (0, jsx_runtime_1.jsxs)("span", { className: "m-pr-v mono", children: [(0, formatRussian_1.nf0)(s.avgWriteoff), " \u20BD"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0421\u0440. \u0447\u0435\u043A \u043D\u0435\u0434\u043E\u0441\u0442." }), (0, jsx_runtime_1.jsxs)("span", { className: "m-pr-v mono", children: [(0, formatRussian_1.nf0)(s.avgShrinkageCheck), " \u20BD"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0423\u0440\u043E\u0432\u0435\u043D\u044C \u043F\u043E\u0442\u0435\u0440\u044C / \u041F\u043B\u0430\u043D" }), (0, jsx_runtime_1.jsxs)("span", { className: "m-pr-v big mono", style: { color: tokens.tangerine }, children: [(0, formatRussian_1.nf2)(s.writeoff), "% / ", (0, formatRussian_1.nf2)(s.planWriteoff), "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0421\u043F\u0438\u0441. / \u041D\u0435\u0434." }), (0, jsx_runtime_1.jsxs)("span", { className: "m-pr-v big mono", children: [(0, formatRussian_1.nf2)(s.writeoff), "% / ", (0, formatRussian_1.nf2)(s.shrinkage), "%"] })] })] })] })] })] }) }));
}
exports.default = (0, react_1.memo)(StoreModalInner);
//# sourceMappingURL=StoreModal.js.map