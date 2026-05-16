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
function SegmentModalInner({ open, parentStore, segment, allStores, tokens, onClose, periodLabel, }) {
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
    /* Среднее по сети для этого сегмента */
    const networkAvg = (0, react_1.useMemo)(() => {
        if (!segment)
            return { value: 0, count: 0 };
        let sum = 0;
        let count = 0;
        allStores.forEach(store => {
            store.segmentsDist.forEach(sg => {
                if (sg.segmentId === segment.segmentId) {
                    sum += sg.writeoff;
                    count += 1;
                }
            });
        });
        return { value: count > 0 ? sum / count : 0, count };
    }, [segment, allStores]);
    /* Rank сегмента в магазине + доля в общих потерях */
    const rankInStore = (0, react_1.useMemo)(() => {
        if (!parentStore || !segment)
            return { rank: 0, total: 0, share: 0 };
        const sorted = [...parentStore.segmentsDist].sort((a, b) => b.lossCombined - a.lossCombined);
        const total = parentStore.segmentsDist.reduce((acc, x) => acc + x.lossCombined, 0) || 1;
        return {
            rank: sorted.findIndex(x => x.id === segment.id) + 1,
            total: sorted.length,
            share: (segment.lossCombined / total) * 100,
        };
    }, [parentStore, segment]);
    /* Синтетический тренд сегмента = spark магазина × scale. */
    const segTrend = (0, react_1.useMemo)(() => {
        if (!parentStore || !segment)
            return [];
        const storeEnd = parentStore.spark[11];
        const scale = storeEnd > 0 ? segment.writeoff / storeEnd : 1;
        return parentStore.spark.map(v => +(v * scale).toFixed(2));
    }, [parentStore, segment]);
    if (!open || !segment || !parentStore)
        return null;
    const seg = segment;
    const st = statusRules_1.STATUSES[seg.status];
    const stColor = (0, colorFromKey_1.colorFromKey)(st.colorKey, tokens);
    const dW = seg.writeoff - seg.planWriteoff;
    const dS = seg.shrinkage - seg.planShrinkage;
    const dWcls = (0, formatRussian_1.deltaClass)(dW, true);
    const dScls = (0, formatRussian_1.deltaClass)(dS, true);
    const trendDir = segTrend[11] > segTrend[0]
        ? '↗ растёт'
        : segTrend[11] < segTrend[0]
            ? '↘ снижается'
            : '→ стабильно';
    const isAboveAvg = seg.writeoff > networkAvg.value;
    return ((0, jsx_runtime_1.jsx)(styles_1.ModalBg, { "$open": open, onClick: e => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: (0, jsx_runtime_1.jsxs)(styles_1.Modal, { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "rs-seg-modal-title", tabIndex: -1, children: [(0, jsx_runtime_1.jsxs)(styles_1.MHead, { children: [(0, jsx_runtime_1.jsx)(styles_1.MStatusBar, { "$color": stColor }), (0, jsx_runtime_1.jsxs)(styles_1.MTitles, { children: [(0, jsx_runtime_1.jsx)(styles_1.MTitle, { id: "rs-seg-modal-title", children: seg.segmentId }), (0, jsx_runtime_1.jsxs)(styles_1.MSub, { children: [(0, jsx_runtime_1.jsx)("span", { className: "code", children: seg.code }), (0, jsx_runtime_1.jsx)("span", { children: "\u0422\u043E\u0432\u0430\u0440\u043D\u044B\u0439 \u0441\u0435\u0433\u043C\u0435\u043D\u0442" }), (0, jsx_runtime_1.jsx)("span", { className: "dot" }), (0, jsx_runtime_1.jsxs)("span", { children: [parentStore.code, " \u00B7 ", parentStore.name] }), (0, jsx_runtime_1.jsx)("span", { className: "dot" }), (0, jsx_runtime_1.jsx)("span", { children: parentStore.city }), periodLabel && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "dot" }), (0, jsx_runtime_1.jsx)("span", { children: periodLabel })] }))] })] }), (0, jsx_runtime_1.jsx)(styles_1.MClose, { type: "button", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: onClose, children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), (0, jsx_runtime_1.jsxs)(styles_1.MContextBc, { children: [(0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", style: { width: 11, height: 11, color: tokens.g500 }, children: [(0, jsx_runtime_1.jsx)("rect", { x: "2", y: "2", width: "8", height: "8", rx: "1" }), (0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "5", x2: "10", y2: "5" })] }), (0, jsx_runtime_1.jsx)("span", { className: "bc-item", children: parentStore.name }), (0, jsx_runtime_1.jsx)("span", { className: "bc-sep", children: "\u203A" }), (0, jsx_runtime_1.jsx)("span", { className: "bc-current", children: seg.segmentId })] }), (0, jsx_runtime_1.jsxs)(styles_1.MSummary, { children: [(0, jsx_runtime_1.jsxs)(styles_1.MStat, { children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "% \u0421\u043F\u0438\u0441\u0430\u043D\u0438\u0439 \u0441\u0435\u0433\u043C\u0435\u043D\u0442\u0430" }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat-v", style: { color: tokens.tangerine }, children: [(0, formatRussian_1.nf2)(seg.writeoff), (0, jsx_runtime_1.jsx)("span", { className: "u", children: "%" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `m-stat-d ${dWcls}`, children: [(0, formatRussian_1.fmtDelta)(dW), " \u043A \u043F\u043B\u0430\u043D\u0443"] })] }), (0, jsx_runtime_1.jsxs)(styles_1.MStat, { children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "% \u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0447 \u0441\u0435\u0433\u043C\u0435\u043D\u0442\u0430" }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat-v", style: { color: tokens.sky }, children: [(0, formatRussian_1.nf2)(seg.shrinkage), (0, jsx_runtime_1.jsx)("span", { className: "u", children: "%" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `m-stat-d ${dScls}`, children: [(0, formatRussian_1.fmtDelta)(dS), " \u043A \u043F\u043B\u0430\u043D\u0443"] })] }), (0, jsx_runtime_1.jsxs)(styles_1.MStat, { children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "\u0414\u043E\u043B\u044F \u0432 \u043F\u043E\u0442\u0435\u0440\u044F\u0445 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430" }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat-v", children: [(0, formatRussian_1.nf1)(rankInStore.share), (0, jsx_runtime_1.jsx)("span", { className: "u", children: "%" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat-d wn", children: ["#", rankInStore.rank, " \u0438\u0437 ", rankInStore.total] })] }), (0, jsx_runtime_1.jsxs)(styles_1.MStat, { children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: "\u0421\u0440\u0435\u0434\u043D\u0435\u0435 \u043F\u043E \u0441\u0435\u0442\u0438" }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat-v", children: [(0, formatRussian_1.nf2)(networkAvg.value), (0, jsx_runtime_1.jsx)("span", { className: "u", children: "%" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `m-stat-d ${isAboveAvg ? 'dn' : 'up'}`, children: [isAboveAvg ? 'выше' : 'ниже', " \u0441\u0440\u0435\u0434\u043D\u0435\u0433\u043E"] })] })] }), (0, jsx_runtime_1.jsxs)(styles_1.MTrendWrap, { children: [(0, jsx_runtime_1.jsxs)(styles_1.MSectionL, { as: "div", style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }, children: [(0, jsx_runtime_1.jsx)("span", { children: "\u0422\u0440\u0435\u043D\u0434 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439 \u0441\u0435\u0433\u043C\u0435\u043D\u0442\u0430 \u00B7 12 \u043D\u0435\u0434\u0435\u043B\u044C" }), (0, jsx_runtime_1.jsxs)(styles_1.MTrendLast, { children: [(0, formatRussian_1.nf2)(seg.writeoff), "% \u00B7 ", trendDir] })] }), (0, jsx_runtime_1.jsx)(TrendChart_1.default, { data: segTrend, tokens: tokens })] }), (0, jsx_runtime_1.jsxs)(styles_1.M3Col, { children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(styles_1.MSectionL, { children: "\u041F\u0440\u0438\u0447\u0438\u043D\u044B \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439" }), (0, jsx_runtime_1.jsx)(RankedBarList_1.default, { items: seg.causeDist.map(c => ({
                                        name: c.type.name,
                                        pct: c.pct,
                                        delta: c.delta,
                                        color: (0, colorFromKey_1.colorFromKey)(c.type.colorKey, tokens),
                                    })) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(styles_1.MSectionL, { children: "\u0412\u0438\u0434\u044B \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439" }), (0, jsx_runtime_1.jsx)(RankedBarList_1.default, { items: seg.woTypeDist.map(w => ({
                                        name: w.name,
                                        pct: w.pct,
                                        delta: w.delta,
                                        color: tokens.sky,
                                    })) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(styles_1.MSectionL, { children: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C" }), (0, jsx_runtime_1.jsxs)(styles_1.MProfile, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0421\u0435\u0433\u043C\u0435\u043D\u0442" }), (0, jsx_runtime_1.jsx)("span", { className: "m-pr-v", children: seg.code })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u041C\u0430\u0433\u0430\u0437\u0438\u043D" }), (0, jsx_runtime_1.jsx)("span", { className: "m-pr-v", children: parentStore.code })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0413\u043E\u0440\u043E\u0434" }), (0, jsx_runtime_1.jsx)("span", { className: "m-pr-v", children: parentStore.city })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0424\u043E\u0440\u043C\u0430\u0442" }), (0, jsx_runtime_1.jsx)("span", { className: "m-pr-v", children: parentStore.formatName })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0414\u0438\u0432\u0438\u0437\u0438\u043E\u043D" }), (0, jsx_runtime_1.jsx)("span", { className: "m-pr-v", children: parentStore.division })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0421\u043F\u0438\u0441\u0430\u043D\u0438\u044F / \u041F\u043B\u0430\u043D" }), (0, jsx_runtime_1.jsxs)("span", { className: "m-pr-v big mono", style: { color: tokens.tangerine }, children: [(0, formatRussian_1.nf2)(seg.writeoff), "% / ", (0, formatRussian_1.nf2)(seg.planWriteoff), "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0447\u0438 / \u041F\u043B\u0430\u043D" }), (0, jsx_runtime_1.jsxs)("span", { className: "m-pr-v big mono", style: { color: tokens.sky }, children: [(0, formatRussian_1.nf2)(seg.shrinkage), "% / ", (0, formatRussian_1.nf2)(seg.planShrinkage), "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-pr-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-pr-l", children: "\u0414\u043E\u043B\u044F \u0432 \u043F\u043E\u0442\u0435\u0440\u044F\u0445" }), (0, jsx_runtime_1.jsxs)("span", { className: "m-pr-v mono", children: [(0, formatRussian_1.nf1)(rankInStore.share), "%"] })] })] })] })] })] }) }));
}
exports.default = (0, react_1.memo)(SegmentModalInner);
//# sourceMappingURL=SegmentModal.js.map