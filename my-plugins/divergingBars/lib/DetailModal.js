"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const echarts_for_react_1 = __importDefault(require("echarts-for-react"));
const core_1 = require("@superset-ui/core");
const styles_1 = require("./styles");
const computeTempo_1 = require("./utils/computeTempo");
const formatRussian_1 = require("./utils/formatRussian");
/** Человекочитаемая подпись режима сравнения. */
function comparisonModeLabel(mode) {
    switch (mode) {
        case 'prev_period':
            return 'предыдущий период';
        case 'prev_week':
            return 'прошлая неделя';
        case 'prev_month':
            return 'прошлый месяц';
        case 'prev_quarter':
            return 'прошлый квартал';
        case 'prev_year':
            return 'прошлый год';
        case 'custom':
            return 'вручную выбранный период';
        default:
            return 'предыдущий период';
    }
}
/**
 * Тренд по main-периоду — на ECharts.
 *
 * Длина по х-оси = длина массива trend (определяется backend'ом).
 * Лейблы по х-оси берутся из trendLabels (если есть) или Н1..НN.
 * Animation: 700ms cubicOut (синхронизация с card-mount cascade DS 2.1).
 * Цвет: tempo > 1.1 → dn (рост потерь), < 0.9 → up (снижение), else g600.
 */
function buildTrendOption(data, labels, tempo, metric, palette) {
    const lineColor = tempo > 1.1 ? palette.dn : tempo < 0.9 ? palette.up : palette.g600;
    const xLabels = labels.length === data.length
        ? labels
        : data.map((_, i) => (i === data.length - 1 ? (0, core_1.t)('сейчас') : `Н${i + 1}`));
    const fmtVal = (v) => (0, formatRussian_1.fmtByMetric)(v, metric);
    return {
        animation: true,
        /* DS canonical: ECharts series animation 700ms cubicOut — синхронизировано
           с card-mount cascade. */
        animationDuration: 700,
        animationEasing: 'cubicOut',
        animationDurationUpdate: 0,
        animationEasingUpdate: 'linear',
        grid: { left: 10, right: 12, top: 12, bottom: 26, containLabel: true },
        tooltip: {
            trigger: 'axis',
            backgroundColor: palette.s,
            borderColor: 'rgba(128,128,128,0.25)',
            borderWidth: 1,
            padding: [8, 12, 8, 12],
            extraCssText: 'pointer-events:none;border-radius:6px;border:1px solid #d4d8de;max-width:240px',
            textStyle: {
                color: palette.ink,
                fontFamily: palette.fontText,
                fontSize: 13,
            },
            axisPointer: {
                type: 'line',
                lineStyle: { color: palette.g200, width: 1, type: [2, 3] },
                z: 0,
            },
            formatter: (params) => {
                const arr = Array.isArray(params) ? params : [params];
                const p = arr[0];
                const idx = p?.dataIndex ?? 0;
                const v = typeof p?.value === 'number' ? p.value : p?.data;
                const prevV = idx > 0 ? data[idx - 1] : null;
                const deltaPctRaw = prevV != null && prevV !== 0 ? ((v - prevV) / prevV) * 100 : 0;
                const deltaPct = prevV != null && prevV !== 0 ? (0, formatRussian_1.fmtSignedPct)(deltaPctRaw) : '—';
                const weekLabel = xLabels[idx] ?? '';
                return (`<div style="font-family:${palette.fontMono};line-height:1.5;min-width:120px">` +
                    `<div style="color:${palette.g600};text-transform:uppercase;letter-spacing:.06em;font-size:11px;margin-bottom:4px">${weekLabel}</div>` +
                    `<div style="color:${palette.g600};font-size:12px">${(0, core_1.t)('Потери')}</div>` +
                    `<div style="color:${palette.ink};font-weight:700;font-size:17px;margin:4px 0">${fmtVal(v)}</div>` +
                    `<div style="color:${palette.g600};font-size:12px">${(0, core_1.t)('к пред.')}: ${deltaPct}</div>` +
                    `</div>`);
            },
        },
        xAxis: {
            type: 'category',
            data: xLabels,
            axisLine: { lineStyle: { color: palette.g200 } },
            axisTick: { show: false },
            axisLabel: {
                color: palette.g600,
                fontFamily: palette.fontMono,
                fontSize: 11,
                interval: data.length > 12 ? 'auto' : 1,
            },
            boundaryGap: false,
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: palette.g100, type: [2, 3] } },
            axisLabel: {
                color: palette.g600,
                fontFamily: palette.fontMono,
                fontSize: 11,
                formatter: (v) => fmtVal(v),
            },
        },
        series: [
            {
                type: 'line',
                smooth: true,
                data,
                symbol: 'circle',
                symbolSize: 6,
                showAllSymbol: true,
                lineStyle: { color: lineColor, width: 2.2 },
                itemStyle: { color: lineColor, borderColor: palette.g50, borderWidth: 1 },
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        color: lineColor,
                        borderColor: palette.s,
                        borderWidth: 2,
                        shadowBlur: 6,
                        shadowColor: lineColor,
                    },
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: `${lineColor}4D` /* 0.30 alpha */ },
                            { offset: 1, color: `${lineColor}05` /* 0.02 alpha */ },
                        ],
                    },
                },
                z: 2,
            },
        ],
    };
}
const DetailModal = ({ store, metric, comparisonMode, theme, palette, onClose, }) => {
    const overlayRef = (0, react_1.useRef)(null);
    const closeBtnRef = (0, react_1.useRef)(null);
    const previousFocus = (0, react_1.useRef)(null);
    const prev = metric === 'rub' ? store.prevValueRub : store.prevValuePct;
    const curr = metric === 'rub' ? store.currValueRub : store.currValuePct;
    const tr = (0, computeTempo_1.computeTempo)(prev, curr);
    const dir = (0, computeTempo_1.tempoDirection)(tr.tempo);
    const color = dir === 'grow' ? palette.dn : dir === 'shrink' ? palette.up : palette.g600;
    const tCls = dir === 'grow' ? 'dn' : dir === 'shrink' ? 'up' : 'wn';
    /* Escape + focus trap (DS 2.0 §10 + CLAUDE.md a11y). */
    (0, react_1.useEffect)(() => {
        previousFocus.current = document.activeElement;
        closeBtnRef.current?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
                return;
            }
            if (e.key === 'Tab' && overlayRef.current) {
                const focusables = overlayRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (!focusables.length)
                    return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
                else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        window.addEventListener('keydown', onKey, true);
        return () => {
            window.removeEventListener('keydown', onKey, true);
            const prevFocus = previousFocus.current;
            if (prevFocus instanceof HTMLElement)
                prevFocus.focus();
        };
    }, [onClose]);
    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current)
            onClose();
    };
    /* Trend данные — опциональны (backend может не отдать). */
    const trendData = (metric === 'rub' ? store.trendRub : store.trendPct) ?? [];
    const trendLabels = store.trendLabels ?? [];
    const hasTrend = trendData.length > 1;
    const fv = (v) => (0, formatRussian_1.fmtByMetric)(v, metric);
    const signed = tr.pctChange > 0 ? '+' : tr.pctChange < 0 ? '−' : '';
    const trendNote = `${(0, formatRussian_1.fmtTempoText)(tr.tempo)} · ${(0, formatRussian_1.fmtSignedPct)(tr.pctChange)}`;
    const option = (0, react_1.useMemo)(() => buildTrendOption(trendData, trendLabels, tr.tempo, metric, palette), [trendData, trendLabels, tr.tempo, metric, palette]);
    return ((0, jsx_runtime_1.jsx)(styles_1.ModalOverlay, { ref: overlayRef, "data-theme": theme, role: "dialog", "aria-modal": "true", "aria-label": `${(0, core_1.t)('Детализация магазина')} ${store.name}`, onClick: handleOverlayClick, children: (0, jsx_runtime_1.jsxs)("div", { className: "vd-modal", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-head", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-status", style: { background: color } }), (0, jsx_runtime_1.jsxs)("div", { className: "m-titles", children: [(0, jsx_runtime_1.jsx)("h3", { className: "m-title", children: store.name }), (0, jsx_runtime_1.jsxs)("div", { className: "m-sub", children: [(0, jsx_runtime_1.jsx)("span", { className: "m-code", children: store.code }), (0, jsx_runtime_1.jsx)("span", { children: store.city }), (0, jsx_runtime_1.jsx)("span", { className: "m-dot", "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { children: store.formatName }), (0, jsx_runtime_1.jsx)("span", { className: "m-dot", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, core_1.t)('ТО'), " ", store.to, " ", (0, core_1.t)('млн ₽')] })] })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", ref: closeBtnRef, className: "m-close", "aria-label": (0, core_1.t)('Закрыть'), onClick: onClose, children: (0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("line", { x1: "2", y1: "2", x2: "12", y2: "12" }), (0, jsx_runtime_1.jsx)("line", { x1: "12", y1: "2", x2: "2", y2: "12" })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-summary", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: (0, core_1.t)('Было') }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", children: fv(tr.prev) }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-d", children: (0, core_1.t)('прошлый период') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: (0, core_1.t)('Стало') }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", children: fv(tr.curr) }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-d", children: (0, core_1.t)('текущий период') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: (0, core_1.t)('Темп') }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-v", style: { color }, children: (0, formatRussian_1.fmtTempoText)(tr.tempo) }), (0, jsx_runtime_1.jsx)("div", { className: `m-stat-d ${tCls}`, children: (0, formatRussian_1.fmtSignedPct)(tr.pctChange) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat", children: [(0, jsx_runtime_1.jsx)("div", { className: "m-stat-l", children: (0, core_1.t)('Абс. разница') }), (0, jsx_runtime_1.jsxs)("div", { className: "m-stat-v", style: { color }, children: [signed, fv(Math.abs(tr.absDelta))] }), (0, jsx_runtime_1.jsx)("div", { className: "m-stat-d", children: dir === 'grow'
                                        ? (0, core_1.t)('прирост')
                                        : dir === 'shrink'
                                            ? (0, core_1.t)('снижение')
                                            : (0, core_1.t)('без изменений') })] })] }), hasTrend ? ((0, jsx_runtime_1.jsxs)("div", { className: "m-trend-wrap", children: [(0, jsx_runtime_1.jsxs)("div", { className: "m-section-l", children: [(0, jsx_runtime_1.jsxs)("span", { children: [(0, core_1.t)('Тренд потерь'), " \u00B7 ", trendData.length, " ", (0, core_1.t)('точек')] }), (0, jsx_runtime_1.jsx)("span", { className: "right", children: trendNote })] }), (0, jsx_runtime_1.jsx)("div", { className: "m-trend-card", children: (0, jsx_runtime_1.jsx)("div", { className: "m-trend-chart", children: (0, jsx_runtime_1.jsx)(echarts_for_react_1.default, { option: option, notMerge: true, style: { width: '100%', height: '100%' }, opts: { renderer: 'canvas' } }) }) })] })) : ((0, jsx_runtime_1.jsx)("div", { style: {
                        padding: '16px 12px',
                        fontSize: 12,
                        color: palette.g600,
                        fontFamily: palette.fontText,
                        fontStyle: 'italic',
                    }, children: (0, core_1.t)('Тренд недоступен — для графика добавьте колонку «Неделя» ' +
                        'в настройках чарта.') }))] }) }));
};
exports.default = DetailModal;
//# sourceMappingURL=DetailModal.js.map