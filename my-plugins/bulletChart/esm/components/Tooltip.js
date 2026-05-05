import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createPortal } from 'react-dom';
import { Kbd, Tooltip as TooltipBox, TtDot, TtFoot, TtHead, TtHeadBody, TtL, TtName, TtRow, TtRows, TtStatus, TtStatusText, TtSub, TtV, } from '../styles';
import { formatStoresCount } from '../utils/format';
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
    return createPortal(_jsxs(TooltipBox, { role: "tooltip", style: { left, top }, statusColor: statusColor, children: [_jsxs(TtHead, { children: [_jsx(TtStatus, {}), _jsxs(TtHeadBody, { children: [_jsx(TtName, { children: row.name }), row.stores != null ? (_jsx(TtSub, { children: formatStoresCount(row.stores) })) : null] })] }), _jsxs(TtRows, { children: [_jsxs(TtRow, { children: [_jsx(TtL, { children: "\u0424\u0430\u043A\u0442" }), _jsx(TtV, { tone: tone(row.status), children: formatters.value(row.rate) })] }), row.plan != null ? (_jsxs(TtRow, { children: [_jsx(TtL, { children: "\u041F\u043B\u0430\u043D (\u0446\u0435\u043B\u044C)" }), _jsx(TtV, { tone: "default", children: formatters.value(row.plan) })] })) : null, row.py != null ? (_jsxs(TtRow, { children: [_jsx(TtL, { children: "\u041F\u0440\u043E\u0448\u043B\u044B\u0439 \u0433\u043E\u0434" }), _jsx(TtV, { tone: "default", children: formatters.value(row.py) })] })) : null, row.deltaPlan != null ? (_jsxs(TtRow, { children: [_jsx(TtL, { children: "\u0394 \u043A \u043F\u043B\u0430\u043D\u0443" }), _jsx(TtV, { tone: deltaTone(row.deltaPlan, direction), children: formatters.deltaPP(row.deltaPlan) })] })) : null, row.deltaPy != null ? (_jsxs(TtRow, { children: [_jsx(TtL, { children: "\u0394 \u043A \u041F\u0413" }), _jsx(TtV, { tone: deltaTone(row.deltaPy, direction), children: formatters.deltaPP(row.deltaPy) })] })) : null, trend != null ? (_jsxs(TtRow, { children: [_jsx(TtL, { children: "\u0422\u0440\u0435\u043D\u0434" }), _jsxs(TtV, { tone: trend.tone, children: [trend.icon, " ", trend.text] })] })) : null, badStores != null ? (_jsxs(TtRow, { children: [_jsx(TtL, { children: "\u0425\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430" }), _jsxs(TtV, { tone: badTone, children: [badStores.count, " \u0438\u0437 ", badStores.total, " (", badStores.pct, "%)"] })] })) : null] }), _jsx(TtStatusText, { children: statusLabel(row.status, direction) }), showDetailHint ? (_jsxs(TtFoot, { children: [_jsx(Kbd, { children: "Click" }), _jsx("span", { children: "\u0444\u0438\u043B\u044C\u0442\u0440" }), _jsx(TtDot, { children: "\u00B7" }), _jsx(Kbd, { children: "Ctrl" }), _jsx("span", { children: "+" }), _jsx(Kbd, { children: "Click" }), _jsx("span", { children: "\u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F" })] })) : null] }), rootEl);
};
export default BulletTooltip;
//# sourceMappingURL=Tooltip.js.map