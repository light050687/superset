import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import ModalShell from './ModalShell';
import TrendChart from './TrendChart';
import { getIconBody } from '../utils/icons';
import { fmtCount, fmtDelta, fmtRub, getDeltaStatus, } from '../utils/formatRussian';
import { fetchDrillData } from '../utils/detailApi';
import { InlineEmpty, InlineError, InlineSkeleton, ModalHead, ModalHeadIcon, ModalSection, ModalSummaryGrid, StatBox, TopBarFill, TopList, TopRow, TrendBox, } from '../styles';
/** Generate deterministic mock drill data so Design Mode renders a reasonable picture. */
function buildMockDrill(row) {
    const storesSeed = [
        'Самбери Хабаровск Центр',
        'Самбери Уссурийск №3',
        'Самбери Владивосток Чуркин',
        'Самбери Находка',
        'Самбери Артём',
    ];
    const skusSeed = [
        `${row.name} · товар A`,
        `${row.name} · товар B`,
        `${row.name} · товар C`,
        `${row.name} · товар D`,
        `${row.name} · товар E`,
    ];
    const stores = storesSeed.map((name, i) => ({
        name,
        value: +(row.value * (0.14 - i * 0.02)).toFixed(2),
    }));
    const skus = skusSeed.map((name, i) => ({
        name,
        value: +(row.value * (0.1 - i * 0.015)).toFixed(2),
    }));
    const trend = [];
    const start = row.spark[0] ?? row.value;
    for (let i = 0; i < 4; i++) {
        trend.push(+(start * (0.85 + Math.random() * 0.15)).toFixed(2));
    }
    trend.push(...row.spark);
    return { stores, skus, trend };
}
const DetailModal = ({ row, queryParams, unitSuffixRub, decimalsValue, decimalsDelta, invertDeltaGood, isMockMode, themeMode, onClose, }) => {
    const [state, setState] = useState({ status: 'loading' });
    useEffect(() => {
        if (isMockMode) {
            setState({ status: 'success', data: buildMockDrill(row) });
            return undefined;
        }
        const controller = new AbortController();
        setState({ status: 'loading' });
        fetchDrillData(queryParams, row.id, controller.signal)
            .then(data => {
            if (!controller.signal.aborted) {
                setState({ status: 'success', data });
            }
        })
            .catch((err) => {
            if (controller.signal.aborted)
                return;
            const message = err instanceof Error ? err.message : 'Ошибка загрузки деталей';
            setState({ status: 'error', message });
        });
        return () => controller.abort();
    }, [isMockMode, queryParams, row]);
    const colorVar = row.colorToken.startsWith('#')
        ? row.colorToken
        : `var(${row.colorToken})`;
    const iconBg = row.colorToken.startsWith('#')
        ? row.colorToken
        : `color-mix(in srgb, var(${row.colorToken}) 18%, transparent)`;
    const sumParts = fmtRub(row.value, decimalsValue, unitSuffixRub);
    const deltaStatus = getDeltaStatus(row.deltaPP, invertDeltaGood);
    const sumDeltaPct = row.valuePrev && row.valuePrev !== 0
        ? ((row.value - row.valuePrev) / row.valuePrev) * 100
        : 0;
    const sumDeltaCls = sumDeltaPct > 0
        ? invertDeltaGood
            ? 'dn'
            : 'up'
        : sumDeltaPct < 0
            ? invertDeltaGood
                ? 'up'
                : 'dn'
            : 'wn';
    const trendDirection = useMemo(() => {
        if (state.status !== 'success')
            return 'flat';
        const t = state.data.trend;
        if (t.length < 2)
            return 'flat';
        if (t[t.length - 1] > t[0])
            return 'up';
        if (t[t.length - 1] < t[0])
            return 'down';
        return 'flat';
    }, [state]);
    return (_jsxs(ModalShell, { open: true, onClose: onClose, themeMode: themeMode, zIndex: 1100, labelledBy: "rb-detail-title", children: [_jsxs(ModalHead, { children: [_jsx(ModalHeadIcon, { className: "m-icon", "$bg": iconBg, children: _jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: colorVar, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: getIconBody(row.iconName) }) }), _jsxs("div", { className: "m-titles", children: [_jsx("div", { className: "m-title", id: "rb-detail-title", children: row.name }), row.sub && _jsx("div", { className: "m-sub", children: row.sub })] }), _jsx("button", { type: "button", className: "m-close", onClick: onClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: _jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), _jsxs(ModalSummaryGrid, { children: [_jsxs(StatBox, { children: [_jsx("div", { className: "l", children: "\u0421\u0443\u043C\u043C\u0430" }), _jsxs("div", { className: "v", children: [sumParts.number, _jsx("span", { className: "u", children: sumParts.unit })] }), row.valuePrev != null && (_jsxs("div", { className: `d ${sumDeltaCls}`, children: [sumDeltaPct > 0 ? '+' : sumDeltaPct < 0 ? '−' : '', Math.abs(sumDeltaPct).toFixed(1), "% \u043A \u041F\u041F"] }))] }), _jsxs(StatBox, { children: [_jsx("div", { className: "l", children: "\u0414\u043E\u043B\u044F \u043E\u0442 \u0438\u0442\u043E\u0433\u0430" }), _jsxs("div", { className: "v", children: [row.sharePct.toFixed(1), _jsx("span", { className: "u", children: " %" })] }), _jsx("div", { className: `d ${deltaStatus}`, children: fmtDelta(row.deltaPP, decimalsDelta) })] }), _jsxs(StatBox, { children: [_jsx("div", { className: "l", children: "\u0422\u043E\u043F-\u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432" }), _jsx("div", { className: "v", children: state.status === 'success'
                                    ? fmtCount(state.data.stores.length)
                                    : '—' }), _jsx("div", { className: "d wn", children: "\u0432 \u0440\u0435\u0439\u0442\u0438\u043D\u0433\u0435" })] }), _jsxs(StatBox, { children: [_jsx("div", { className: "l", children: "\u0422\u0440\u0435\u043D\u0434" }), _jsx("div", { className: "v", children: trendDirection === 'up'
                                    ? '↗'
                                    : trendDirection === 'down'
                                        ? '↘'
                                        : '→' }), _jsx("div", { className: `d ${trendDirection === 'up' ? (invertDeltaGood ? 'dn' : 'up') : trendDirection === 'down' ? (invertDeltaGood ? 'up' : 'dn') : 'wn'}`, children: trendDirection === 'up'
                                    ? 'растёт'
                                    : trendDirection === 'down'
                                        ? 'снижается'
                                        : 'стабильно' })] })] }), _jsxs(ModalSection, { children: [_jsx("div", { className: "l", children: "\u0422\u0440\u0435\u043D\u0434 \u043F\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438" }), _jsxs(TrendBox, { children: [_jsxs("div", { className: "head", children: [_jsx("span", { className: "l", children: "\u0421\u0443\u043C\u043C\u0430 \u043F\u043E \u043F\u0435\u0440\u0438\u043E\u0434\u0430\u043C" }), _jsx("span", { className: "r", children: state.status === 'success' && state.data.trend.length > 0
                                            ? `${state.data.trend[state.data.trend.length - 1].toFixed(1)}${sumParts.unit} · посл. период`
                                            : '' })] }), state.status === 'loading' && _jsx(Skeleton, { height: 90 }), state.status === 'error' && (_jsx(ErrorLine, { message: state.message })), state.status === 'success' &&
                                (state.data.trend.length >= 2 ? (_jsx(TrendChart, { data: state.data.trend, color: colorVar })) : (_jsx(EmptyLine, { text: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u0442\u0440\u0435\u043D\u0434\u0430" })))] })] }), _jsxs(ModalSection, { children: [_jsxs("div", { className: "l", children: ["\u0422\u043E\u043F-", queryParams.detailTopN, ' ', queryParams.storeDim ? 'магазинов по сумме' : 'магазинов'] }), renderTopList(state, 'stores', colorVar, sumParts.unit, queryParams.storeDim == null)] }), _jsxs(ModalSection, { children: [_jsxs("div", { className: "l", children: ["\u0422\u043E\u043F-", queryParams.detailTopN, ' ', queryParams.skuDim ? 'SKU по сумме' : 'SKU'] }), renderTopList(state, 'skus', colorVar, sumParts.unit, queryParams.skuDim == null)] })] }));
};
// ── Small helpers scoped to this module ────────────────────────────────────
const Skeleton = ({ height }) => (_jsx(InlineSkeleton, { "$height": height, "aria-hidden": "true" }));
const EmptyLine = ({ text }) => (_jsx(InlineEmpty, { children: text }));
const ErrorLine = ({ message }) => (_jsx(InlineError, { role: "alert", children: message }));
function renderTopList(state, kind, colorVar, unitSuffix, disabled) {
    if (disabled) {
        return (_jsx(EmptyLine, { text: "\u0418\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u0435 \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u043E \u2014 \u0437\u0430\u0434\u0430\u0439\u0442\u0435 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0447\u0430\u0440\u0442\u0430." }));
    }
    if (state.status === 'loading') {
        return (_jsx(TopList, { children: Array.from({ length: 5 }).map((_, i) => (_jsx(Skeleton, { height: 32 }, i))) }));
    }
    if (state.status === 'error') {
        return _jsx(ErrorLine, { message: state.message });
    }
    const rows = state.data[kind];
    if (rows.length === 0) {
        return _jsx(EmptyLine, { text: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445" });
    }
    const max = Math.max(...rows.map(r => r.value));
    return (_jsx(TopList, { children: rows.map((r, i) => (_jsxs(TopRow, { "$catColor": colorVar, children: [_jsx("div", { className: "rank", children: String(i + 1).padStart(2, '0') }), _jsx("div", { className: "name", children: r.name }), _jsx("div", { className: "bar", children: _jsx(TopBarFill, { className: "bar-fill", "$widthPct": max > 0 ? (r.value / max) * 100 : 0, "aria-hidden": "true" }) }), _jsxs("div", { className: "val", children: [r.value.toFixed(1), unitSuffix] })] }, r.name + i))) }));
}
export default DetailModal;
//# sourceMappingURL=DetailModal.js.map