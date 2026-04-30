"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ModalShell_1 = __importDefault(require("./ModalShell"));
const TrendChart_1 = __importDefault(require("./TrendChart"));
const icons_1 = require("../utils/icons");
const formatRussian_1 = require("../utils/formatRussian");
const detailApi_1 = require("../utils/detailApi");
const styles_1 = require("../styles");
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
    const [state, setState] = (0, react_1.useState)({ status: 'loading' });
    (0, react_1.useEffect)(() => {
        if (isMockMode) {
            setState({ status: 'success', data: buildMockDrill(row) });
            return undefined;
        }
        const controller = new AbortController();
        setState({ status: 'loading' });
        (0, detailApi_1.fetchDrillData)(queryParams, row.id, controller.signal)
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
    const sumParts = (0, formatRussian_1.fmtRub)(row.value, decimalsValue, unitSuffixRub);
    const deltaStatus = (0, formatRussian_1.getDeltaStatus)(row.deltaPP, invertDeltaGood);
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
    const trendDirection = (0, react_1.useMemo)(() => {
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
    return ((0, jsx_runtime_1.jsxs)(ModalShell_1.default, { open: true, onClose: onClose, themeMode: themeMode, zIndex: 1100, labelledBy: "rb-detail-title", children: [(0, jsx_runtime_1.jsxs)(styles_1.ModalHead, { children: [(0, jsx_runtime_1.jsx)(styles_1.ModalHeadIcon, { className: "m-icon", "$bg": iconBg, children: (0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: colorVar, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: (0, icons_1.getIconBody)(row.iconName) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "m-titles", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-title", id: "rb-detail-title", children: row.name }), row.sub && (0, jsx_runtime_1.jsx)("div", { className: "m-sub", children: row.sub })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "m-close", onClick: onClose, "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalSummaryGrid, { children: [(0, jsx_runtime_1.jsxs)(styles_1.StatBox, { children: [(0, jsx_runtime_1.jsx)("div", { className: "l", children: "\u0421\u0443\u043C\u043C\u0430" }), (0, jsx_runtime_1.jsxs)("div", { className: "v", children: [sumParts.number, (0, jsx_runtime_1.jsx)("span", { className: "u", children: sumParts.unit })] }), row.valuePrev != null && ((0, jsx_runtime_1.jsxs)("div", { className: `d ${sumDeltaCls}`, children: [sumDeltaPct > 0 ? '+' : sumDeltaPct < 0 ? '−' : '', Math.abs(sumDeltaPct).toFixed(1), "% \u043A \u041F\u041F"] }))] }), (0, jsx_runtime_1.jsxs)(styles_1.StatBox, { children: [(0, jsx_runtime_1.jsx)("div", { className: "l", children: "\u0414\u043E\u043B\u044F \u043E\u0442 \u0438\u0442\u043E\u0433\u0430" }), (0, jsx_runtime_1.jsxs)("div", { className: "v", children: [row.sharePct.toFixed(1), (0, jsx_runtime_1.jsx)("span", { className: "u", children: " %" })] }), (0, jsx_runtime_1.jsx)("div", { className: `d ${deltaStatus}`, children: (0, formatRussian_1.fmtDelta)(row.deltaPP, decimalsDelta) })] }), (0, jsx_runtime_1.jsxs)(styles_1.StatBox, { children: [(0, jsx_runtime_1.jsx)("div", { className: "l", children: "\u0422\u043E\u043F-\u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432" }), (0, jsx_runtime_1.jsx)("div", { className: "v", children: state.status === 'success'
                                    ? (0, formatRussian_1.fmtCount)(state.data.stores.length)
                                    : '—' }), (0, jsx_runtime_1.jsx)("div", { className: "d wn", children: "\u0432 \u0440\u0435\u0439\u0442\u0438\u043D\u0433\u0435" })] }), (0, jsx_runtime_1.jsxs)(styles_1.StatBox, { children: [(0, jsx_runtime_1.jsx)("div", { className: "l", children: "\u0422\u0440\u0435\u043D\u0434" }), (0, jsx_runtime_1.jsx)("div", { className: "v", children: trendDirection === 'up'
                                    ? '↗'
                                    : trendDirection === 'down'
                                        ? '↘'
                                        : '→' }), (0, jsx_runtime_1.jsx)("div", { className: `d ${trendDirection === 'up' ? (invertDeltaGood ? 'dn' : 'up') : trendDirection === 'down' ? (invertDeltaGood ? 'up' : 'dn') : 'wn'}`, children: trendDirection === 'up'
                                    ? 'растёт'
                                    : trendDirection === 'down'
                                        ? 'снижается'
                                        : 'стабильно' })] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalSection, { children: [(0, jsx_runtime_1.jsx)("div", { className: "l", children: "\u0422\u0440\u0435\u043D\u0434 \u043F\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438" }), (0, jsx_runtime_1.jsxs)(styles_1.TrendBox, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "head", children: [(0, jsx_runtime_1.jsx)("span", { className: "l", children: "\u0421\u0443\u043C\u043C\u0430 \u043F\u043E \u043F\u0435\u0440\u0438\u043E\u0434\u0430\u043C" }), (0, jsx_runtime_1.jsx)("span", { className: "r", children: state.status === 'success' && state.data.trend.length > 0
                                            ? `${state.data.trend[state.data.trend.length - 1].toFixed(1)}${sumParts.unit} · посл. период`
                                            : '' })] }), state.status === 'loading' && (0, jsx_runtime_1.jsx)(Skeleton, { height: 90 }), state.status === 'error' && ((0, jsx_runtime_1.jsx)(ErrorLine, { message: state.message })), state.status === 'success' &&
                                (state.data.trend.length >= 2 ? ((0, jsx_runtime_1.jsx)(TrendChart_1.default, { data: state.data.trend, color: colorVar })) : ((0, jsx_runtime_1.jsx)(EmptyLine, { text: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u0442\u0440\u0435\u043D\u0434\u0430" })))] })] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalSection, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "l", children: ["\u0422\u043E\u043F-", queryParams.detailTopN, ' ', queryParams.storeDim ? 'магазинов по сумме' : 'магазинов'] }), renderTopList(state, 'stores', colorVar, sumParts.unit, queryParams.storeDim == null)] }), (0, jsx_runtime_1.jsxs)(styles_1.ModalSection, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "l", children: ["\u0422\u043E\u043F-", queryParams.detailTopN, ' ', queryParams.skuDim ? 'SKU по сумме' : 'SKU'] }), renderTopList(state, 'skus', colorVar, sumParts.unit, queryParams.skuDim == null)] })] }));
};
// ── Small helpers scoped to this module ────────────────────────────────────
const Skeleton = ({ height }) => ((0, jsx_runtime_1.jsx)(styles_1.InlineSkeleton, { "$height": height, "aria-hidden": "true" }));
const EmptyLine = ({ text }) => ((0, jsx_runtime_1.jsx)(styles_1.InlineEmpty, { children: text }));
const ErrorLine = ({ message }) => ((0, jsx_runtime_1.jsx)(styles_1.InlineError, { role: "alert", children: message }));
function renderTopList(state, kind, colorVar, unitSuffix, disabled) {
    if (disabled) {
        return ((0, jsx_runtime_1.jsx)(EmptyLine, { text: "\u0418\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u0435 \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u043E \u2014 \u0437\u0430\u0434\u0430\u0439\u0442\u0435 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0447\u0430\u0440\u0442\u0430." }));
    }
    if (state.status === 'loading') {
        return ((0, jsx_runtime_1.jsx)(styles_1.TopList, { children: Array.from({ length: 5 }).map((_, i) => ((0, jsx_runtime_1.jsx)(Skeleton, { height: 32 }, i))) }));
    }
    if (state.status === 'error') {
        return (0, jsx_runtime_1.jsx)(ErrorLine, { message: state.message });
    }
    const rows = state.data[kind];
    if (rows.length === 0) {
        return (0, jsx_runtime_1.jsx)(EmptyLine, { text: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445" });
    }
    const max = Math.max(...rows.map(r => r.value));
    return ((0, jsx_runtime_1.jsx)(styles_1.TopList, { children: rows.map((r, i) => ((0, jsx_runtime_1.jsxs)(styles_1.TopRow, { "$catColor": colorVar, children: [(0, jsx_runtime_1.jsx)("div", { className: "rank", children: String(i + 1).padStart(2, '0') }), (0, jsx_runtime_1.jsx)("div", { className: "name", children: r.name }), (0, jsx_runtime_1.jsx)("div", { className: "bar", children: (0, jsx_runtime_1.jsx)(styles_1.TopBarFill, { className: "bar-fill", "$widthPct": max > 0 ? (r.value / max) * 100 : 0, "aria-hidden": "true" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "val", children: [r.value.toFixed(1), unitSuffix] })] }, r.name + i))) }));
}
exports.default = DetailModal;
//# sourceMappingURL=DetailModal.js.map