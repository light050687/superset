import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useEffect, useMemo, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { MClose, MHead, MSectionL, MStat, MStatusBar, MSub, MSummary, MTitle, MTitles, MTrendLast, MTrendWrap, M3Col, Modal, ModalBg, MProfile, } from '../styles';
import { STATUSES } from '../utils/statusRules';
import { colorFromKey } from '../utils/colorFromKey';
import { deltaClass, fmtDelta, nf0, nf2 } from '../utils/formatRussian';
import RankedBarList from './RankedBarList';
import TrendChart from './TrendChart';
function StoreModalInner({ open, store, allStores, tokens, onClose, periodLabel, }) {
    const modalRef = useRef(null);
    useFocusTrap(open, modalRef);
    useEffect(() => {
        if (!open)
            return undefined;
        const onEsc = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
    }, [open, onClose]);
    const rankInFmt = useMemo(() => {
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
    const st = STATUSES[s.status];
    const stColor = colorFromKey(st.colorKey, tokens);
    const dW = s.writeoff - s.planWriteoff;
    const dS = s.shrinkage - s.planShrinkage;
    const dWcls = deltaClass(dW, true);
    const dScls = deltaClass(dS, true);
    const trendDir = s.spark[11] > s.spark[0]
        ? '↗ растёт'
        : s.spark[11] < s.spark[0]
            ? '↘ снижается'
            : '→ стабильно';
    return (_jsx(ModalBg, { "$open": open, onClick: e => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs(Modal, { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "rs-modal-title", tabIndex: -1, children: [_jsxs(MHead, { children: [_jsx(MStatusBar, { "$color": stColor }), _jsxs(MTitles, { children: [_jsx(MTitle, { id: "rs-modal-title", children: s.name }), _jsxs(MSub, { children: [_jsx("span", { className: "code", children: s.code }), _jsx("span", { children: s.city }), _jsx("span", { className: "dot" }), _jsx("span", { children: s.formatName }), _jsx("span", { className: "dot" }), _jsxs("span", { children: ["\u0422\u041E ", s.toClass, " \u043C\u043B\u043D \u20BD"] }), periodLabel && (_jsxs(_Fragment, { children: [_jsx("span", { className: "dot" }), _jsx("span", { children: periodLabel })] }))] })] }), _jsx(MClose, { type: "button", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: onClose, children: _jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", children: [_jsx("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), _jsxs(MSummary, { children: [_jsxs(MStat, { children: [_jsx("div", { className: "m-stat-l", children: "% \u0421\u043F\u0438\u0441\u0430\u043D\u0438\u0439" }), _jsxs("div", { className: "m-stat-v", style: { color: tokens.tangerine }, children: [nf2(s.writeoff), _jsx("span", { className: "u", children: "%" })] }), _jsxs("div", { className: `m-stat-d ${dWcls}`, children: [fmtDelta(dW), " \u043A \u043F\u043B\u0430\u043D\u0443"] })] }), _jsxs(MStat, { children: [_jsx("div", { className: "m-stat-l", children: "% \u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0447" }), _jsxs("div", { className: "m-stat-v", style: { color: tokens.sky }, children: [nf2(s.shrinkage), _jsx("span", { className: "u", children: "%" })] }), _jsxs("div", { className: `m-stat-d ${dScls}`, children: [fmtDelta(dS), " \u043A \u043F\u043B\u0430\u043D\u0443"] })] }), _jsxs(MStat, { children: [_jsx("div", { className: "m-stat-l", children: "\u0420\u0430\u043D\u0433 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435" }), _jsxs("div", { className: "m-stat-v", children: ["#", rankInFmt.rank, _jsxs("span", { className: "u", children: ["\u0438\u0437 ", rankInFmt.total] })] }), _jsx("div", { className: "m-stat-d wn", children: s.formatName })] }), _jsxs(MStat, { children: [_jsx("div", { className: "m-stat-l", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("div", { className: "m-stat-v", style: { color: stColor, fontSize: 17 }, children: st.label }), _jsx("div", { className: "m-stat-d wn", children: st.description })] })] }), _jsxs(MTrendWrap, { children: [_jsxs(MSectionL, { as: "div", style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }, children: [_jsx("span", { children: "\u0422\u0440\u0435\u043D\u0434 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439 \u00B7 12 \u043D\u0435\u0434\u0435\u043B\u044C" }), _jsxs(MTrendLast, { children: [nf2(s.writeoff), "% \u00B7 ", trendDir] })] }), _jsx(TrendChart, { data: s.spark, tokens: tokens })] }), _jsxs(M3Col, { children: [_jsxs("div", { children: [_jsx(MSectionL, { children: "\u041F\u0440\u0438\u0447\u0438\u043D\u044B \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439" }), _jsx(RankedBarList, { items: s.causeDist.map(c => ({
                                        name: c.type.name,
                                        pct: c.pct,
                                        delta: c.delta,
                                        color: colorFromKey(c.type.colorKey, tokens),
                                    })) })] }), _jsxs("div", { children: [_jsx(MSectionL, { children: "\u0412\u0438\u0434\u044B \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439" }), _jsx(RankedBarList, { items: s.woTypeDist.map(w => ({
                                        name: w.name,
                                        pct: w.pct,
                                        delta: w.delta,
                                        color: tokens.sky,
                                    })) })] }), _jsxs("div", { children: [_jsx(MSectionL, { children: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C" }), _jsxs(MProfile, { children: [_jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0424\u043E\u0440\u043C\u0430\u0442" }), _jsx("span", { className: "m-pr-v", children: s.formatName })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0413\u043E\u0440\u043E\u0434" }), _jsx("span", { className: "m-pr-v", children: s.city })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0414\u0438\u0432\u0438\u0437\u0438\u043E\u043D" }), _jsx("span", { className: "m-pr-v", children: s.division })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0422\u041E" }), _jsxs("span", { className: "m-pr-v mono", children: [s.toClass, " \u043C\u043B\u043D \u20BD"] })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0421\u0440. \u0441\u0443\u043C\u043C\u0430 \u0441\u043F\u0438\u0441." }), _jsxs("span", { className: "m-pr-v mono", children: [nf0(s.avgWriteoff), " \u20BD"] })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0421\u0440. \u0447\u0435\u043A \u043D\u0435\u0434\u043E\u0441\u0442." }), _jsxs("span", { className: "m-pr-v mono", children: [nf0(s.avgShrinkageCheck), " \u20BD"] })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0423\u0440\u043E\u0432\u0435\u043D\u044C \u043F\u043E\u0442\u0435\u0440\u044C / \u041F\u043B\u0430\u043D" }), _jsxs("span", { className: "m-pr-v big mono", style: { color: tokens.tangerine }, children: [nf2(s.writeoff), "% / ", nf2(s.planWriteoff), "%"] })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0421\u043F\u0438\u0441. / \u041D\u0435\u0434." }), _jsxs("span", { className: "m-pr-v big mono", children: [nf2(s.writeoff), "% / ", nf2(s.shrinkage), "%"] })] })] })] })] })] }) }));
}
export default memo(StoreModalInner);
//# sourceMappingURL=StoreModal.js.map