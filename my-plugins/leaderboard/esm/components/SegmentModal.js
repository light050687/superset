import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useEffect, useMemo, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { MClose, MContextBc, MHead, MProfile, MSectionL, MStat, MStatusBar, MSub, MSummary, MTitle, MTitles, MTrendLast, MTrendWrap, M3Col, Modal, ModalBg, } from '../styles';
import { STATUSES } from '../utils/statusRules';
import { colorFromKey } from '../utils/colorFromKey';
import { deltaClass, fmtDelta, nf1, nf2 } from '../utils/formatRussian';
import RankedBarList from './RankedBarList';
import TrendChart from './TrendChart';
function SegmentModalInner({ open, parentStore, segment, allStores, tokens, onClose, periodLabel, }) {
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
    /* Среднее по сети для этого сегмента */
    const networkAvg = useMemo(() => {
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
    const rankInStore = useMemo(() => {
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
    const segTrend = useMemo(() => {
        if (!parentStore || !segment)
            return [];
        const storeEnd = parentStore.spark[11];
        const scale = storeEnd > 0 ? segment.writeoff / storeEnd : 1;
        return parentStore.spark.map(v => +(v * scale).toFixed(2));
    }, [parentStore, segment]);
    if (!open || !segment || !parentStore)
        return null;
    const seg = segment;
    const st = STATUSES[seg.status];
    const stColor = colorFromKey(st.colorKey, tokens);
    const dW = seg.writeoff - seg.planWriteoff;
    const dS = seg.shrinkage - seg.planShrinkage;
    const dWcls = deltaClass(dW, true);
    const dScls = deltaClass(dS, true);
    const trendDir = segTrend[11] > segTrend[0]
        ? '↗ растёт'
        : segTrend[11] < segTrend[0]
            ? '↘ снижается'
            : '→ стабильно';
    const isAboveAvg = seg.writeoff > networkAvg.value;
    return (_jsx(ModalBg, { "$open": open, onClick: e => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs(Modal, { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "rs-seg-modal-title", tabIndex: -1, children: [_jsxs(MHead, { children: [_jsx(MStatusBar, { "$color": stColor }), _jsxs(MTitles, { children: [_jsx(MTitle, { id: "rs-seg-modal-title", children: seg.segmentId }), _jsxs(MSub, { children: [_jsx("span", { className: "code", children: seg.code }), _jsx("span", { children: "\u0422\u043E\u0432\u0430\u0440\u043D\u044B\u0439 \u0441\u0435\u0433\u043C\u0435\u043D\u0442" }), _jsx("span", { className: "dot" }), _jsxs("span", { children: [parentStore.code, " \u00B7 ", parentStore.name] }), _jsx("span", { className: "dot" }), _jsx("span", { children: parentStore.city }), periodLabel && (_jsxs(_Fragment, { children: [_jsx("span", { className: "dot" }), _jsx("span", { children: periodLabel })] }))] })] }), _jsx(MClose, { type: "button", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: onClose, children: _jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", children: [_jsx("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), _jsxs(MContextBc, { children: [_jsxs("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", style: { width: 11, height: 11, color: tokens.g500 }, children: [_jsx("rect", { x: "2", y: "2", width: "8", height: "8", rx: "1" }), _jsx("line", { x1: "2", y1: "5", x2: "10", y2: "5" })] }), _jsx("span", { className: "bc-item", children: parentStore.name }), _jsx("span", { className: "bc-sep", children: "\u203A" }), _jsx("span", { className: "bc-current", children: seg.segmentId })] }), _jsxs(MSummary, { children: [_jsxs(MStat, { children: [_jsx("div", { className: "m-stat-l", children: "% \u0421\u043F\u0438\u0441\u0430\u043D\u0438\u0439 \u0441\u0435\u0433\u043C\u0435\u043D\u0442\u0430" }), _jsxs("div", { className: "m-stat-v", style: { color: tokens.tangerine }, children: [nf2(seg.writeoff), _jsx("span", { className: "u", children: "%" })] }), _jsxs("div", { className: `m-stat-d ${dWcls}`, children: [fmtDelta(dW), " \u043A \u043F\u043B\u0430\u043D\u0443"] })] }), _jsxs(MStat, { children: [_jsx("div", { className: "m-stat-l", children: "% \u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0447 \u0441\u0435\u0433\u043C\u0435\u043D\u0442\u0430" }), _jsxs("div", { className: "m-stat-v", style: { color: tokens.sky }, children: [nf2(seg.shrinkage), _jsx("span", { className: "u", children: "%" })] }), _jsxs("div", { className: `m-stat-d ${dScls}`, children: [fmtDelta(dS), " \u043A \u043F\u043B\u0430\u043D\u0443"] })] }), _jsxs(MStat, { children: [_jsx("div", { className: "m-stat-l", children: "\u0414\u043E\u043B\u044F \u0432 \u043F\u043E\u0442\u0435\u0440\u044F\u0445 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0430" }), _jsxs("div", { className: "m-stat-v", children: [nf1(rankInStore.share), _jsx("span", { className: "u", children: "%" })] }), _jsxs("div", { className: "m-stat-d wn", children: ["#", rankInStore.rank, " \u0438\u0437 ", rankInStore.total] })] }), _jsxs(MStat, { children: [_jsx("div", { className: "m-stat-l", children: "\u0421\u0440\u0435\u0434\u043D\u0435\u0435 \u043F\u043E \u0441\u0435\u0442\u0438" }), _jsxs("div", { className: "m-stat-v", children: [nf2(networkAvg.value), _jsx("span", { className: "u", children: "%" })] }), _jsxs("div", { className: `m-stat-d ${isAboveAvg ? 'dn' : 'up'}`, children: [isAboveAvg ? 'выше' : 'ниже', " \u0441\u0440\u0435\u0434\u043D\u0435\u0433\u043E"] })] })] }), _jsxs(MTrendWrap, { children: [_jsxs(MSectionL, { as: "div", style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }, children: [_jsx("span", { children: "\u0422\u0440\u0435\u043D\u0434 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439 \u0441\u0435\u0433\u043C\u0435\u043D\u0442\u0430 \u00B7 12 \u043D\u0435\u0434\u0435\u043B\u044C" }), _jsxs(MTrendLast, { children: [nf2(seg.writeoff), "% \u00B7 ", trendDir] })] }), _jsx(TrendChart, { data: segTrend, tokens: tokens })] }), _jsxs(M3Col, { children: [_jsxs("div", { children: [_jsx(MSectionL, { children: "\u041F\u0440\u0438\u0447\u0438\u043D\u044B \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439" }), _jsx(RankedBarList, { items: seg.causeDist.map(c => ({
                                        name: c.type.name,
                                        pct: c.pct,
                                        delta: c.delta,
                                        color: colorFromKey(c.type.colorKey, tokens),
                                    })) })] }), _jsxs("div", { children: [_jsx(MSectionL, { children: "\u0412\u0438\u0434\u044B \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0439" }), _jsx(RankedBarList, { items: seg.woTypeDist.map(w => ({
                                        name: w.name,
                                        pct: w.pct,
                                        delta: w.delta,
                                        color: tokens.sky,
                                    })) })] }), _jsxs("div", { children: [_jsx(MSectionL, { children: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C" }), _jsxs(MProfile, { children: [_jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0421\u0435\u0433\u043C\u0435\u043D\u0442" }), _jsx("span", { className: "m-pr-v", children: seg.code })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u041C\u0430\u0433\u0430\u0437\u0438\u043D" }), _jsx("span", { className: "m-pr-v", children: parentStore.code })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0413\u043E\u0440\u043E\u0434" }), _jsx("span", { className: "m-pr-v", children: parentStore.city })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0424\u043E\u0440\u043C\u0430\u0442" }), _jsx("span", { className: "m-pr-v", children: parentStore.formatName })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0414\u0438\u0432\u0438\u0437\u0438\u043E\u043D" }), _jsx("span", { className: "m-pr-v", children: parentStore.division })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0421\u043F\u0438\u0441\u0430\u043D\u0438\u044F / \u041F\u043B\u0430\u043D" }), _jsxs("span", { className: "m-pr-v big mono", style: { color: tokens.tangerine }, children: [nf2(seg.writeoff), "% / ", nf2(seg.planWriteoff), "%"] })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0447\u0438 / \u041F\u043B\u0430\u043D" }), _jsxs("span", { className: "m-pr-v big mono", style: { color: tokens.sky }, children: [nf2(seg.shrinkage), "% / ", nf2(seg.planShrinkage), "%"] })] }), _jsxs("div", { className: "m-pr-row", children: [_jsx("span", { className: "m-pr-l", children: "\u0414\u043E\u043B\u044F \u0432 \u043F\u043E\u0442\u0435\u0440\u044F\u0445" }), _jsxs("span", { className: "m-pr-v mono", children: [nf1(rankInStore.share), "%"] })] })] })] })] })] }) }));
}
export default memo(SegmentModalInner);
//# sourceMappingURL=SegmentModal.js.map