"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DrillModal;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const styled_1 = require("../styles/styled");
const zoneColors_1 = require("../utils/zoneColors");
const paretoFormat_1 = require("../utils/paretoFormat");
const tokens_1 = require("../styles/tokens");
const presets_1 = require("../mocks/presets");
/**
 * Drill-модалка: summary grid + контекстный блок + «Разложение причин».
 * Через createPortal в document.body; обёртка ставит тот же data-theme,
 * чтобы CSS-переменные резолвились в корректной теме.
 */
function DrillModal({ item, computed, tokens, metricLabel, metricUnit, breakdownTitle, isDarkMode, onClose, }) {
    // Escape → close.
    (0, react_1.useEffect)(() => {
        const handler = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);
    const zCol = (0, zoneColors_1.zoneColor)(item.zone, tokens);
    const zClass = item.zone === 'A' ? 'zone-a' : item.zone === 'B' ? 'zone-b' : 'zone-c';
    // Breakdown: берём из item.breakdown, иначе из mock-helpers.
    const breakdown = item.breakdown && item.breakdown.length > 0
        ? item.breakdown
        : (0, presets_1.getBreakdown)(item.id, item.value);
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
    // Движение ранга.
    const rankDeltaTxt = item.rankPrev == null
        ? '—'
        : item.rankDelta === 0
            ? `#${item.rank} (без изменений)`
            : `#${item.rankPrev} → #${item.rank}`;
    const rankDeltaClass = item.rankDelta == null || item.rankDelta === 0
        ? ''
        : item.rankDelta > 0
            ? 'bad'
            : 'good';
    const content = ((0, jsx_runtime_1.jsxs)(styled_1.ModalOverlay, { "data-theme": isDarkMode ? 'dark' : 'light', role: "dialog", "aria-modal": "true", "aria-label": `Разложение: ${item.name}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "backdrop", onClick: onClose }), (0, jsx_runtime_1.jsxs)(styled_1.ModalCard, { children: [(0, jsx_runtime_1.jsxs)(styled_1.ModalHead, { children: [(0, jsx_runtime_1.jsxs)(styled_1.ModalTitle, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-eyebrow", children: ["\u0420\u0430\u0437\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u00B7 ", (0, zoneColors_1.zoneLabel)(item.zone), item.isNewInA ? ' · ★ впервые в A' : ''] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-h", children: [(0, jsx_runtime_1.jsx)("span", { className: "dot", style: { background: zCol } }), (0, jsx_runtime_1.jsx)("span", { children: item.name })] })] }), (0, jsx_runtime_1.jsx)(styled_1.ModalClose, { "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: onClose, type: "button", children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": true, children: (0, jsx_runtime_1.jsx)("path", { d: "M3 3 L13 13 M13 3 L3 13" }) }) })] }), (0, jsx_runtime_1.jsxs)(styled_1.ModalBody, { children: [(0, jsx_runtime_1.jsxs)(styled_1.DrillSummaryGrid, { children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "s-l", children: "\u0420\u0430\u043D\u0433" }), (0, jsx_runtime_1.jsxs)("div", { className: `s-v ${zClass}`, children: ["#", item.rank] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "s-l", children: metricLabel }), (0, jsx_runtime_1.jsx)("div", { className: `s-v ${zClass}`, children: (0, paretoFormat_1.formatMetricValue)(item.value, metricUnit) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "s-l", children: "\u0414\u043E\u043B\u044F" }), (0, jsx_runtime_1.jsx)("div", { className: "s-v", children: (0, paretoFormat_1.formatPct2)(item.share) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "s-l", children: "\u041A\u0443\u043C\u0443\u043B\u044F\u0442\u0438\u0432\u043D\u043E" }), (0, jsx_runtime_1.jsx)("div", { className: "s-v", children: (0, paretoFormat_1.formatPct1)(item.cumPct) })] })] }), (0, jsx_runtime_1.jsxs)(styled_1.DrillContext, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "ctx-row", children: [(0, jsx_runtime_1.jsxs)("div", { className: "ctx-l", children: [(0, jsx_runtime_1.jsx)("span", { className: "ctx-label", children: "\u041F\u043E\u0442\u0435\u0440\u0438 \u043E\u0442 \u0432\u044B\u0440\u0443\u0447\u043A\u0438 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438" }), (0, jsx_runtime_1.jsxs)("span", { className: "ctx-hint", children: [(0, paretoFormat_1.formatMetricValue)(item.value, metricUnit), " \u0438\u0437", ' ', (0, paretoFormat_1.formatMetricValue)(item.revenueRub ?? null, metricUnit)] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "ctx-bar-wrap", children: [(0, jsx_runtime_1.jsx)("div", { className: "ctx-bar", children: (0, jsx_runtime_1.jsx)("div", { className: `ctx-bar-fill ${lossStatus}`, style: { width: `${lossBarW}%` } }) }), (0, jsx_runtime_1.jsx)("div", { className: "ctx-bar-avg", style: {
                                                            left: `${Math.round((avgLossPct / maxLossPct) * 100)}%`,
                                                        }, title: `Среднее по категориям: ${(0, paretoFormat_1.formatPct2)(avgLossPct)}` })] }), (0, jsx_runtime_1.jsx)("div", { className: `ctx-v ${lossStatus}`, children: (0, paretoFormat_1.formatPct2)(lossPct) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "ctx-row", children: [(0, jsx_runtime_1.jsxs)("div", { className: "ctx-l", children: [(0, jsx_runtime_1.jsx)("span", { className: "ctx-label", children: "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u043A \u043F\u0440\u043E\u0448\u043B\u043E\u043C\u0443 \u043F\u0435\u0440\u0438\u043E\u0434\u0443" }), (0, jsx_runtime_1.jsxs)("span", { className: "ctx-hint", children: ["\u0431\u044B\u043B\u043E ", (0, paretoFormat_1.formatMetricValue)(prev ?? null, metricUnit), " \u2192 \u0441\u0442\u0430\u043B\u043E", ' ', (0, paretoFormat_1.formatMetricValue)(item.value, metricUnit)] })] }), (0, jsx_runtime_1.jsx)("div", { className: "ctx-bar-wrap" }), (0, jsx_runtime_1.jsx)("div", { className: `ctx-v ${deltaClass}`, children: (0, paretoFormat_1.formatSignedPct1)(deltaPct) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "ctx-row", children: [(0, jsx_runtime_1.jsxs)("div", { className: "ctx-l", children: [(0, jsx_runtime_1.jsx)("span", { className: "ctx-label", children: "\u0414\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u043F\u043E \u0440\u0430\u043D\u0433\u0443" }), (0, jsx_runtime_1.jsx)("span", { className: "ctx-hint", children: "\u043F\u043E\u0437\u0438\u0446\u0438\u044F \u0432 \u041F\u0430\u0440\u0435\u0442\u043E" })] }), (0, jsx_runtime_1.jsx)("div", { className: "ctx-bar-wrap" }), (0, jsx_runtime_1.jsx)("div", { className: `ctx-v ${rankDeltaClass}`, children: rankDeltaTxt })] })] }), (0, jsx_runtime_1.jsx)(styled_1.DrillSectionTitle, { children: breakdownTitle }), (0, jsx_runtime_1.jsx)(styled_1.DrillBars, { children: breakdown.map((b, idx) => {
                                    const w = Math.round((b.rub / maxRub) * 100);
                                    const pctOfTotal = item.value > 0 ? (b.rub / item.value) * 100 : 0;
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: "dbf", children: [(0, jsx_runtime_1.jsx)("div", { className: "dbf-l", children: b.name }), (0, jsx_runtime_1.jsx)("div", { className: "dbf-bar", children: (0, jsx_runtime_1.jsx)("div", { className: "dbf-bar-fill", style: {
                                                        width: `${w}%`,
                                                        background: (0, tokens_1.breakdownColor)(idx, tokens),
                                                    } }) }), (0, jsx_runtime_1.jsxs)("div", { className: "dbf-v", children: [(0, paretoFormat_1.formatMetricValue)(b.rub, metricUnit), (0, jsx_runtime_1.jsx)("span", { className: "pct", children: (0, paretoFormat_1.formatPct1)(pctOfTotal) })] })] }, b.name));
                                }) })] })] })] }));
    if (typeof document === 'undefined')
        return null;
    return (0, react_dom_1.createPortal)(content, document.body);
}
//# sourceMappingURL=DrillModal.js.map