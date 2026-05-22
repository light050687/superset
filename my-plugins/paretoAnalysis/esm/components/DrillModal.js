import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ModalOverlay, ModalCard, ModalHead, ModalTitle, ModalClose, ModalBody, DrillSummaryGrid, DrillContext, DrillSectionTitle, DrillBars, } from '../styles/styled';
import { zoneColor, zoneLabel } from '../utils/zoneColors';
import { formatMetricValue, formatPct1, formatPct2, formatSignedPct1, } from '../utils/paretoFormat';
import { breakdownColor } from '../styles/tokens';
import { getBreakdown } from '../mocks/presets';
/**
 * Drill-модалка: summary grid + контекстный блок + «Разложение причин».
 * Через createPortal в document.body; обёртка ставит тот же data-theme,
 * чтобы CSS-переменные резолвились в корректной теме.
 */
export default function DrillModal({ item, computed, tokens, metricLabel, metricUnit, breakdownTitle, isDarkMode, onClose, }) {
    // Escape → close.
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);
    const zCol = zoneColor(item.zone, tokens);
    const zClass = item.zone === 'A' ? 'zone-a' : item.zone === 'B' ? 'zone-b' : 'zone-c';
    // Breakdown: берём из item.breakdown, иначе из mock-helpers.
    const breakdown = item.breakdown && item.breakdown.length > 0
        ? item.breakdown
        : getBreakdown(item.id, item.value);
    const maxRub = Math.max(...breakdown.map(b => b.rub), 0.0001);
    // «Потери от выручки %» mini-bar.
    const lossPct = item.lossPctOfRevenue;
    const allLossPct = computed.items
        .map(p => p.lossPctOfRevenue)
        .filter((v) => v != null);
    const maxLossPct = allLossPct.length ? Math.max(...allLossPct) : 1;
    const lossBarW = lossPct != null ? Math.round((lossPct / maxLossPct) * 100) : 0;
    const avgLossPct = allLossPct.length
        ? allLossPct.reduce((s, v) => s + v, 0) / allLossPct.length
        : 0;
    const lossStatus = lossPct == null
        ? ''
        : lossPct > avgLossPct * 1.2
            ? 'bad'
            : lossPct < avgLossPct * 0.8
                ? 'good'
                : '';
    // Δ к прошлому периоду.
    const prev = item.valuePrev;
    const deltaPct = prev != null && prev !== 0 ? ((item.value - prev) / prev) * 100 : null;
    const deltaClass = deltaPct == null ? '' : deltaPct > 0.5 ? 'bad' : deltaPct < -0.5 ? 'good' : '';
    // Движение ранга — теперь 5-я hero-метрика в DrillSummaryGrid.
    // Stream «#11 → #12»: разбито на spans для vertical alignment стрелки.
    const rankDeltaNode = item.rankPrev == null ? ('—') : item.rankDelta === 0 ? ('без изм.') : (_jsxs(_Fragment, { children: [_jsxs("span", { children: ["#", item.rankPrev] }), _jsx("span", { className: "arr", "aria-hidden": "true", children: "\u2192" }), _jsxs("span", { children: ["#", item.rank] })] }));
    const rankDeltaClass = item.rankDelta == null || item.rankDelta === 0
        ? ''
        : item.rankDelta > 0
            ? 'bad'
            : 'good';
    const rankDeltaTip = item.rankPrev == null
        ? 'Нет данных за прошлый период'
        : item.rankDelta === 0
            ? `Ранг не изменился: #${item.rank}`
            : item.rankDelta > 0
                ? `Опустилась с #${item.rankPrev} на #${item.rank} (хуже)`
                : `Поднялась с #${item.rankPrev} на #${item.rank} (лучше)`;
    const content = (_jsxs(ModalOverlay, { "data-theme": isDarkMode ? 'dark' : 'light', role: "dialog", "aria-modal": "true", "aria-label": `Детализация: ${item.name}`, children: [_jsx("div", { className: "backdrop", onClick: onClose }), _jsxs(ModalCard, { children: [_jsxs(ModalHead, { children: [_jsxs(ModalTitle, { children: [_jsxs("div", { className: "m-eyebrow", children: [zoneLabel(item.zone), item.isNewInA ? ' · ★ впервые в A' : ''] }), _jsxs("div", { className: "m-h", children: [_jsx("span", { className: "dot", style: { background: zCol } }), _jsx("span", { children: item.name })] })] }), _jsx(ModalClose, { "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: onClose, type: "button", children: _jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": true, children: _jsx("path", { d: "M3 3 L13 13 M13 3 L3 13" }) }) })] }), _jsxs(ModalBody, { children: [_jsxs(DrillSummaryGrid, { children: [_jsxs("div", { title: `Позиция в Парето: ${item.rank} из ${computed.items.length}`, children: [_jsx("div", { className: "s-l", children: "\u0420\u0430\u043D\u0433" }), _jsxs("div", { className: `s-v ${zClass}`, children: ["#", item.rank] })] }), _jsxs("div", { title: `${metricLabel} за период: абсолютная величина`, children: [_jsx("div", { className: "s-l", children: metricLabel }), _jsx("div", { className: `s-v ${zClass}`, children: formatMetricValue(item.value, metricUnit) })] }), _jsxs("div", { title: "% \u044D\u0442\u043E\u0439 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u043E\u0442 \u043E\u0431\u0449\u0435\u0439 \u0441\u0443\u043C\u043C\u044B", children: [_jsx("div", { className: "s-l", children: "\u0414\u043E\u043B\u044F" }), _jsx("div", { className: "s-v", children: formatPct2(item.share) })] }), _jsxs("div", { title: "\u0421 \u043D\u0430\u0440\u0430\u0441\u0442\u0430\u044E\u0449\u0438\u043C \u0438\u0442\u043E\u0433\u043E\u043C \u2014 \u0432\u0441\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u0434\u043E \u044D\u0442\u043E\u0439 \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u043E", children: [_jsx("div", { className: "s-l", children: "\u041A\u0443\u043C\u0443\u043B\u044F\u0442\u0438\u0432\u043D\u043E" }), _jsx("div", { className: "s-v", children: formatPct1(item.cumPct) })] }), _jsxs("div", { title: rankDeltaTip, children: [_jsx("div", { className: "s-l", children: "\u0414\u0432\u0438\u0436\u0435\u043D\u0438\u0435" }), _jsx("div", { className: `s-v rank-delta ${rankDeltaClass}`, children: rankDeltaNode })] })] }), _jsxs(DrillContext, { children: [_jsxs("div", { className: "ctx-row", children: [_jsx("div", { className: "ctx-l", children: _jsx("span", { className: "ctx-label", children: "\u041F\u043E\u0442\u0435\u0440\u0438 \u043E\u0442 \u0432\u044B\u0440\u0443\u0447\u043A\u0438 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438" }) }), _jsxs("div", { className: "ctx-bar-wrap", children: [_jsx("div", { className: "ctx-bar", children: _jsx("div", { className: `ctx-bar-fill ${lossStatus}`, style: { width: `${lossBarW}%` } }) }), _jsx("div", { className: "ctx-bar-avg", style: {
                                                            left: `${Math.round((avgLossPct / maxLossPct) * 100)}%`,
                                                        }, title: `Среднее по категориям: ${formatPct2(avgLossPct)}` }), _jsxs("span", { className: "ctx-hint ctx-hint-under", children: [formatMetricValue(item.value, metricUnit), " \u0438\u0437", ' ', formatMetricValue(item.revenueRub ?? null, metricUnit)] })] }), _jsx("div", { className: `ctx-v ${lossStatus}`, children: formatPct2(lossPct) })] }), _jsxs("div", { className: "ctx-row", children: [_jsx("div", { className: "ctx-l", children: _jsx("span", { className: "ctx-label", children: "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u043A \u043F\u0440\u043E\u0448\u043B\u043E\u043C\u0443 \u043F\u0435\u0440\u0438\u043E\u0434\u0443" }) }), _jsx("div", { className: "ctx-bar-wrap", children: _jsxs("span", { className: "ctx-hint ctx-hint-under", children: ["\u0431\u044B\u043B\u043E ", formatMetricValue(prev ?? null, metricUnit), " \u2192 \u0441\u0442\u0430\u043B\u043E", ' ', formatMetricValue(item.value, metricUnit)] }) }), _jsx("div", { className: `ctx-v ${deltaClass}`, children: formatSignedPct1(deltaPct) })] })] }), _jsx(DrillSectionTitle, { children: breakdownTitle }), _jsx(DrillBars, { children: breakdown.map((b, idx) => {
                                    const w = Math.round((b.rub / maxRub) * 100);
                                    const pctOfTotal = item.value > 0 ? (b.rub / item.value) * 100 : 0;
                                    // Tooltip: полное название + сумма + % — hover показывает full
                                    // info, даже если name обрезан или столбик визуально маленький.
                                    const tip = `${b.name}: ${formatMetricValue(b.rub, metricUnit)} (${formatPct1(pctOfTotal)})`;
                                    return (_jsxs("div", { className: "dbf", title: tip, children: [_jsx("div", { className: "dbf-l", children: b.name }), _jsx("div", { className: "dbf-bar", children: _jsx("div", { className: "dbf-bar-fill", style: {
                                                        width: `${w}%`,
                                                        background: breakdownColor(idx, tokens),
                                                    } }) }), _jsxs("div", { className: "dbf-v", children: [formatMetricValue(b.rub, metricUnit), _jsx("span", { className: "pct", children: formatPct1(pctOfTotal) })] })] }, b.name));
                                }) })] })] })] }));
    if (typeof document === 'undefined')
        return null;
    return createPortal(content, document.body);
}
//# sourceMappingURL=DrillModal.js.map