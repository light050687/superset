"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const styles_1 = require("./styles");
const BulletRow_1 = __importDefault(require("./components/BulletRow"));
const SortMenu_1 = __importDefault(require("./components/SortMenu"));
const Tooltip_1 = __importDefault(require("./components/Tooltip"));
const DetailModal_1 = __importDefault(require("./DetailModal"));
const InfoHint_1 = require("./components/InfoHint");
const sorting_1 = require("./utils/sorting");
const format_1 = require("./utils/format");
/** Цвет статуса через CSS-переменные. */
function statusColorVar(s) {
    if (s === 'good')
        return 'var(--up)';
    if (s === 'bad')
        return 'var(--dn)';
    if (s === 'warn')
        return 'var(--wn)';
    return 'var(--g500)';
}
/**
 * Ловит ошибки рендера и показывает fallback UI, чтобы весь дашборд не падал
 * из-за одной карточки (PRODUCTION_CHECKLIST §3.1).
 */
class BulletErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, message: '' };
    }
    static getDerivedStateFromError(error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка рендера';
        return { hasError: true, message };
    }
    componentDidCatch(error, info) {
        // Structured-лог, чтобы уведомить о проблеме (без PII).
        // eslint-disable-next-line no-console
        console.error(JSON.stringify({
            level: 'error',
            service: 'superset-plugin-chart-bullet',
            event: 'render_crash',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            info,
        }));
    }
    render() {
        if (this.state.hasError) {
            return ((0, jsx_runtime_1.jsxs)(styles_1.StateOverlay, { role: "alert", children: [(0, jsx_runtime_1.jsx)(styles_1.ErrorCaption, { children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u0440\u0438\u0441\u043E\u0432\u043A\u0438 bullet-\u0447\u0430\u0440\u0442\u0430" }), (0, jsx_runtime_1.jsx)(styles_1.HintCaption, { children: this.state.message })] }));
        }
        return this.props.children;
    }
}
// ═══════════════════════════════════════
// Inner component
// ═══════════════════════════════════════
const BulletChartInner = props => {
    const { width, height, dataState, headerText, subheaderText, rows, scaleMax, direction, defaultSort, filterWorseThanPlanDefault, enableCrossFilter, enableDetailModal, formatters, isDarkMode, detailQueryParams, mockModeEnabled, } = props;
    // ── State ──
    const [sortBy, setSortBy] = React.useState(defaultSort);
    const [filterBad, setFilterBad] = React.useState(filterWorseThanPlanDefault);
    // Cross-filter: множественный выбор (ref:621 — activeFilters: Set).
    const [activeCategoryIds, setActiveCategoryIds] = React.useState(() => new Set());
    const [modalRow, setModalRow] = React.useState(null);
    const [tooltipState, setTooltipState] = React.useState(null);
    const rootRef = React.useRef(null);
    React.useEffect(() => {
        setSortBy(defaultSort);
    }, [defaultSort]);
    React.useEffect(() => {
        setFilterBad(filterWorseThanPlanDefault);
    }, [filterWorseThanPlanDefault]);
    // ── Derived ──
    const sorted = React.useMemo(() => (0, sorting_1.sortRows)(rows, sortBy), [rows, sortBy]);
    const visibleRows = React.useMemo(() => {
        if (!filterBad)
            return sorted;
        return sorted.filter(r => r.status === 'bad');
    }, [sorted, filterBad]);
    const totalStores = React.useMemo(() => {
        const sum = rows.reduce((s, r) => s + (r.stores ?? 0), 0);
        return sum > 0 ? sum : null;
    }, [rows]);
    const hasActiveFilter = activeCategoryIds.size > 0;
    // ── Handlers ──
    const handleRowClick = React.useCallback((row, ctrlKey) => {
        if (ctrlKey && enableDetailModal) {
            setModalRow(row);
            setTooltipState(null);
            return;
        }
        if (!enableCrossFilter)
            return;
        setActiveCategoryIds(prev => {
            const next = new Set(prev);
            if (next.has(row.id))
                next.delete(row.id);
            else
                next.add(row.id);
            return next;
        });
    }, [enableCrossFilter, enableDetailModal]);
    const handleRowHover = React.useCallback((row, x, y) => {
        setTooltipState(row ? { row, x, y } : null);
    }, []);
    const closeModal = React.useCallback(() => setModalRow(null), []);
    // ── Render ──
    // DS 2.0 canonical: loading имеет свой раздельный return со своим Card.
    // При переходе loading → loaded React unmount'ит loading-Card и mount'ит
    // новый → cardInKf animation запускается ровно когда юзер видит контент.
    if (dataState === 'loading') {
        return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { ref: rootRef, className: styles_1.ROOT_CLASS, isDarkMode: isDarkMode, widthPx: width, heightPx: height, "data-theme": isDarkMode ? 'dark' : 'light', children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { role: "region", "aria-label": headerText, "aria-busy": "true", "data-no-anim": "", children: [(0, jsx_runtime_1.jsx)(styles_1.CardHead, { children: (0, jsx_runtime_1.jsx)(styles_1.TitleBlock, { children: (0, jsx_runtime_1.jsx)(styles_1.CardTitle, { children: headerText }) }) }), (0, jsx_runtime_1.jsxs)(styles_1.StateOverlay, { "aria-busy": "true", children: [(0, jsx_runtime_1.jsx)(styles_1.Skeleton, { widthPct: 100 }), (0, jsx_runtime_1.jsx)(styles_1.Skeleton, { widthPct: 95 }), (0, jsx_runtime_1.jsx)(styles_1.Skeleton, { widthPct: 90 })] })] })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { ref: rootRef, className: styles_1.ROOT_CLASS, isDarkMode: isDarkMode, widthPx: width, heightPx: height, "data-theme": isDarkMode ? 'dark' : 'light', children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { role: "region", "aria-label": headerText, "data-info-hint-container": "", children: [dataState === 'stale' && (0, jsx_runtime_1.jsx)(styles_1.StaleBar, { "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)(styles_1.CardHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.TitleBlock, { children: [(0, jsx_runtime_1.jsxs)(styles_1.CardTitle, { children: [headerText, dataState === 'partial' && ((0, jsx_runtime_1.jsx)(styles_1.PartialBadge, { title: "\u0427\u0430\u0441\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0445 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430", children: "\u0427\u0430\u0441\u0442\u0438\u0447\u043D\u043E" }))] }), (0, jsx_runtime_1.jsxs)(styles_1.CardSub, { children: [subheaderText ? (0, jsx_runtime_1.jsx)("span", { children: subheaderText }) : null, totalStores != null ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "dot" }), (0, jsx_runtime_1.jsx)("span", { className: "strong", children: (0, format_1.formatStoresCount)(totalStores) })] })) : null, mockModeEnabled ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "dot" }), (0, jsx_runtime_1.jsx)("span", { children: "\u0420\u0435\u0436\u0438\u043C \u043F\u0440\u043E\u0435\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F" })] })) : null] })] }), rows.length > 0 ? ((0, jsx_runtime_1.jsxs)(styles_1.Controls, { children: [(0, jsx_runtime_1.jsx)(SortMenu_1.default, { value: sortBy, onChange: setSortBy }), (0, jsx_runtime_1.jsxs)(styles_1.FilterPill, { type: "button", active: filterBad, "aria-pressed": filterBad, onClick: () => setFilterBad(v => !v), title: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0445\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430", children: [(0, jsx_runtime_1.jsxs)("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("path", { d: "M7 2 L13 12 L1 12 Z" }), (0, jsx_runtime_1.jsx)("line", { x1: "7", y1: "6", x2: "7", y2: "9" }), (0, jsx_runtime_1.jsx)("line", { x1: "7", y1: "11", x2: "7", y2: "11.5" })] }), (0, jsx_runtime_1.jsx)("span", { children: "\u0425\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430" })] })] })) : null] }), dataState === 'loading' ? ((0, jsx_runtime_1.jsxs)(styles_1.StateOverlay, { "aria-busy": "true", children: [(0, jsx_runtime_1.jsx)(styles_1.Skeleton, { widthPct: 100 }), (0, jsx_runtime_1.jsx)(styles_1.Skeleton, { widthPct: 95 }), (0, jsx_runtime_1.jsx)(styles_1.Skeleton, { widthPct: 90 })] })) : null, dataState === 'error' ? ((0, jsx_runtime_1.jsx)(styles_1.StateOverlay, { role: "alert", children: (0, jsx_runtime_1.jsx)(styles_1.ErrorCaption, { children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445" }) })) : null, dataState === 'empty' ? ((0, jsx_runtime_1.jsxs)(styles_1.StateOverlay, { children: [(0, jsx_runtime_1.jsx)("span", { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F" }), (0, jsx_runtime_1.jsx)(styles_1.HintCaption, { children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435 \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u0435 \u0438 \u043C\u0435\u0442\u0440\u0438\u043A\u0443 \u0444\u0430\u043A\u0442\u0430" })] })) : null, (dataState === 'populated' ||
                        dataState === 'partial' ||
                        dataState === 'stale') && rows.length > 0 ? ((0, jsx_runtime_1.jsx)(styles_1.BulletList, { role: "list", children: visibleRows.length === 0 && filterBad ? ((0, jsx_runtime_1.jsx)(styles_1.StateOverlay, { children: (0, jsx_runtime_1.jsx)("span", { children: "\u041D\u0435\u0442 \u0441\u0442\u0440\u043E\u043A \u00AB\u0445\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430\u00BB \u2014 \u0432\u0441\u0435 \u0432 \u043F\u0440\u0435\u0434\u0435\u043B\u0430\u0445 \u0446\u0435\u043B\u0438" }) })) : (visibleRows.map(row => {
                            const color = statusColorVar(row.status);
                            const isActive = activeCategoryIds.has(row.id);
                            const dimmed = hasActiveFilter && !isActive;
                            return ((0, jsx_runtime_1.jsx)(BulletRow_1.default, { row: row, scaleMax: scaleMax, direction: direction, filtered: isActive, dimmed: dimmed, statusColor: color, formatters: formatters, handlers: {
                                    onClick: handleRowClick,
                                    onHover: handleRowHover,
                                } }, row.id));
                        })) })) : null, (0, jsx_runtime_1.jsxs)(styles_1.CardFooter, { children: [rows.length > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(styles_1.FootHint, { children: [(0, jsx_runtime_1.jsx)(styles_1.Kbd, { children: "Click" }), (0, jsx_runtime_1.jsx)("span", { children: "\u0444\u0438\u043B\u044C\u0442\u0440" }), enableDetailModal ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(styles_1.FootDot, { children: "\u00B7" }), (0, jsx_runtime_1.jsx)(styles_1.Kbd, { children: "Ctrl" }), (0, jsx_runtime_1.jsx)("span", { children: "+" }), (0, jsx_runtime_1.jsx)(styles_1.Kbd, { children: "Click" }), (0, jsx_runtime_1.jsx)("span", { children: "\u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F" })] })) : null] }), (0, jsx_runtime_1.jsxs)(styles_1.FootLegend, { children: [(0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { children: [(0, jsx_runtime_1.jsx)(styles_1.LegendBar, {}), (0, jsx_runtime_1.jsx)("span", { children: "\u0444\u0430\u043A\u0442" })] }), (0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { children: [(0, jsx_runtime_1.jsx)(styles_1.LegendTarget, {}), (0, jsx_runtime_1.jsx)("span", { children: "\u0446\u0435\u043B\u044C" })] }), (0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { children: [(0, jsx_runtime_1.jsx)(styles_1.LegendBand, {}), (0, jsx_runtime_1.jsx)("span", { children: "\u0437\u043E\u043D\u0430" })] })] })] })), (0, jsx_runtime_1.jsx)(InfoHint_1.InfoHintCorner, { children: (0, jsx_runtime_1.jsxs)(InfoHint_1.InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [enableDetailModal && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "hi", children: (0, jsx_runtime_1.jsx)("span", { children: "Click bar \u2014 \u0434\u0435\u0442\u0430\u043B\u0438" }) }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" })] })), (0, jsx_runtime_1.jsx)("span", { className: "hi", children: (0, jsx_runtime_1.jsx)("span", { children: "Sort / Filter \u2014 controls \u0441\u0432\u0435\u0440\u0445\u0443" }) }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { className: "hi", children: (0, jsx_runtime_1.jsx)("span", { children: "Right Click \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439" }) })] }) })] })] }), tooltipState ? ((0, jsx_runtime_1.jsx)(Tooltip_1.default, { row: tooltipState.row, direction: direction, formatters: formatters, statusColor: statusColorVar(tooltipState.row.status), x: tooltipState.x, y: tooltipState.y, rootEl: rootRef.current, showDetailHint: enableDetailModal })) : null, modalRow ? ((0, jsx_runtime_1.jsx)(DetailModal_1.default, { row: modalRow, scaleMax: scaleMax, direction: direction, formatters: formatters, detailQueryParams: detailQueryParams, mockMode: mockModeEnabled, onClose: closeModal, rootEl: rootRef.current })) : null] }));
};
/** Корневой компонент, обёрнут в ErrorBoundary. */
const BulletChart = props => ((0, jsx_runtime_1.jsx)(BulletErrorBoundary, { children: (0, jsx_runtime_1.jsx)(BulletChartInner, { ...props }) }));
exports.default = BulletChart;
//# sourceMappingURL=BulletChart.js.map