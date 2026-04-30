"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_dom_1 = require("react-dom");
const styles_1 = require("../styles");
const format_1 = require("../utils/format");
function statusLabel(status, direction) {
    if (status === 'good')
        return direction === 'less_is_better' ? '✓ В норме — лучше плана' : '✓ В норме — выше плана';
    if (status === 'bad')
        return direction === 'less_is_better'
            ? '✕ Хуже плана — требует внимания'
            : '✕ Ниже плана — требует внимания';
    if (status === 'warn')
        return '~ Около плана — нейтрально';
    return '—';
}
function tone(s) {
    return s === 'good' ? 'up' : s === 'bad' ? 'dn' : s === 'warn' ? 'wn' : 'default';
}
function deltaTone(delta, direction) {
    if (delta == null)
        return 'default';
    if (Math.abs(delta) <= 0.01)
        return 'wn';
    if (direction === 'less_is_better')
        return delta > 0 ? 'dn' : 'up';
    return delta > 0 ? 'up' : 'dn';
}
/** Направление тренда по sparkline (first vs last). */
function computeTrend(spark, direction) {
    if (!spark || spark.length < 2)
        return null;
    const first = spark[0];
    const last = spark[spark.length - 1];
    if (first === last)
        return { icon: '→', text: 'стабильно', tone: 'wn' };
    const rising = last > first;
    // Для less_is_better рост = плохо (dn), падение = хорошо (up).
    const upIsBad = direction === 'less_is_better';
    const trendTone = rising
        ? upIsBad ? 'dn' : 'up'
        : upIsBad ? 'up' : 'dn';
    return {
        icon: rising ? '↗' : '↘',
        text: rising ? 'растёт' : 'снижается',
        tone: trendTone,
    };
}
const BulletTooltip = ({ row, direction, formatters, statusColor, x, y, rootEl, showDetailHint, }) => {
    if (!rootEl)
        return null;
    // Смещение — вниз-вправо от курсора, с коррекцией у края экрана.
    const OFFSET = 14;
    const W = 280;
    const H = 240;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const left = x + OFFSET + W > vw - 8 ? x - W - OFFSET : x + OFFSET;
    const top = y + OFFSET + H > vh - 8 ? y - H - OFFSET : y + OFFSET;
    const trend = computeTrend(row.spark, direction);
    // % магазинов хуже плана (только если есть storesList в mock-режиме).
    const storesList = row.storesList;
    let badStores = null;
    if (storesList && storesList.length > 0) {
        const worse = storesList.filter(s => {
            if (s.plan == null)
                return false;
            return direction === 'less_is_better' ? s.rate > s.plan : s.rate < s.plan;
        }).length;
        badStores = {
            count: worse,
            total: storesList.length,
            pct: Math.round((worse / storesList.length) * 100),
        };
    }
    const badTone = !badStores
        ? 'wn'
        : badStores.pct > 50
            ? 'dn'
            : badStores.pct > 30
                ? 'wn'
                : 'up';
    return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsxs)(styles_1.Tooltip, { role: "tooltip", style: { left, top }, statusColor: statusColor, children: [(0, jsx_runtime_1.jsxs)(styles_1.TtHead, { children: [(0, jsx_runtime_1.jsx)(styles_1.TtStatus, {}), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [(0, jsx_runtime_1.jsx)(styles_1.TtName, { children: row.name }), row.stores != null ? ((0, jsx_runtime_1.jsx)(styles_1.TtSub, { children: (0, format_1.formatStoresCount)(row.stores) })) : null] })] }), (0, jsx_runtime_1.jsxs)(styles_1.TtRows, { children: [(0, jsx_runtime_1.jsxs)(styles_1.TtRow, { children: [(0, jsx_runtime_1.jsx)(styles_1.TtL, { children: "\u0424\u0430\u043A\u0442" }), (0, jsx_runtime_1.jsx)(styles_1.TtV, { tone: tone(row.status), children: formatters.value(row.rate) })] }), row.plan != null ? ((0, jsx_runtime_1.jsxs)(styles_1.TtRow, { children: [(0, jsx_runtime_1.jsx)(styles_1.TtL, { children: "\u041F\u043B\u0430\u043D (\u0446\u0435\u043B\u044C)" }), (0, jsx_runtime_1.jsx)(styles_1.TtV, { tone: "default", children: formatters.value(row.plan) })] })) : null, row.py != null ? ((0, jsx_runtime_1.jsxs)(styles_1.TtRow, { children: [(0, jsx_runtime_1.jsx)(styles_1.TtL, { children: "\u041F\u0440\u043E\u0448\u043B\u044B\u0439 \u0433\u043E\u0434" }), (0, jsx_runtime_1.jsx)(styles_1.TtV, { tone: "default", children: formatters.value(row.py) })] })) : null, row.deltaPlan != null ? ((0, jsx_runtime_1.jsxs)(styles_1.TtRow, { children: [(0, jsx_runtime_1.jsx)(styles_1.TtL, { children: "\u0394 \u043A \u043F\u043B\u0430\u043D\u0443" }), (0, jsx_runtime_1.jsx)(styles_1.TtV, { tone: deltaTone(row.deltaPlan, direction), children: formatters.deltaPP(row.deltaPlan) })] })) : null, row.deltaPy != null ? ((0, jsx_runtime_1.jsxs)(styles_1.TtRow, { children: [(0, jsx_runtime_1.jsx)(styles_1.TtL, { children: "\u0394 \u043A \u041F\u0413" }), (0, jsx_runtime_1.jsx)(styles_1.TtV, { tone: deltaTone(row.deltaPy, direction), children: formatters.deltaPP(row.deltaPy) })] })) : null, trend != null ? ((0, jsx_runtime_1.jsxs)(styles_1.TtRow, { children: [(0, jsx_runtime_1.jsx)(styles_1.TtL, { children: "\u0422\u0440\u0435\u043D\u0434" }), (0, jsx_runtime_1.jsxs)(styles_1.TtV, { tone: trend.tone, children: [trend.icon, " ", trend.text] })] })) : null, badStores != null ? ((0, jsx_runtime_1.jsxs)(styles_1.TtRow, { children: [(0, jsx_runtime_1.jsx)(styles_1.TtL, { children: "\u0425\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430" }), (0, jsx_runtime_1.jsxs)(styles_1.TtV, { tone: badTone, children: [badStores.count, " \u0438\u0437 ", badStores.total, " (", badStores.pct, "%)"] })] })) : null] }), (0, jsx_runtime_1.jsx)(styles_1.TtStatusText, { children: statusLabel(row.status, direction) }), showDetailHint ? ((0, jsx_runtime_1.jsxs)(styles_1.TtFoot, { children: [(0, jsx_runtime_1.jsx)(styles_1.Kbd, { children: "Click" }), (0, jsx_runtime_1.jsx)("span", { children: "\u0444\u0438\u043B\u044C\u0442\u0440" }), (0, jsx_runtime_1.jsx)("span", { style: { color: 'var(--g400)' }, children: "\u00B7" }), (0, jsx_runtime_1.jsx)(styles_1.Kbd, { children: "Ctrl" }), (0, jsx_runtime_1.jsx)("span", { children: "+" }), (0, jsx_runtime_1.jsx)(styles_1.Kbd, { children: "Click" }), (0, jsx_runtime_1.jsx)("span", { children: "\u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F" })] })) : null] }), rootEl);
};
exports.default = BulletTooltip;
//# sourceMappingURL=Tooltip.js.map