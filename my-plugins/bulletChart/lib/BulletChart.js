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
const react_dom_1 = require("react-dom");
const styles_1 = require("./styles");
const BulletRow_1 = __importDefault(require("./components/BulletRow"));
const SortMenu_1 = __importDefault(require("./components/SortMenu"));
const Tooltip_1 = __importDefault(require("./components/Tooltip"));
const DetailModal_1 = __importDefault(require("./DetailModal"));
const themeTokens_1 = require("./themeTokens");
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
    const [statusFilter, setStatusFilter] = React.useState(filterWorseThanPlanDefault ? 'bad' : 'all');
    const [statusDdOpen, setStatusDdOpen] = React.useState(false);
    const statusTriggerRef = React.useRef(null);
    const [statusMenuPos, setStatusMenuPos] = React.useState({ top: 0, right: 0 });
    React.useEffect(() => {
        if (!statusDdOpen)
            return undefined;
        const update = () => {
            const r = statusTriggerRef.current?.getBoundingClientRect();
            if (!r)
                return;
            setStatusMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
        };
        update();
        const closeOnOutside = (e) => {
            const t = e.target;
            if (!t)
                return;
            if (!t.closest('.bc-status-dd-portal') && !t.closest('.bc-status-dd-trigger')) {
                setStatusDdOpen(false);
            }
        };
        const closeOnEscape = (e) => {
            if (e.key === 'Escape')
                setStatusDdOpen(false);
        };
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        document.addEventListener('click', closeOnOutside);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
            document.removeEventListener('click', closeOnOutside);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [statusDdOpen]);
    // Legacy bridge — для обратной совместимости с visibleRows useMemo / empty messages.
    const filterBad = statusFilter === 'bad';
    const filterGood = statusFilter === 'good';
    // Cross-filter: множественный выбор (ref:621 — activeFilters: Set).
    const [activeCategoryIds, setActiveCategoryIds] = React.useState(() => new Set());
    const [modalRow, setModalRow] = React.useState(null);
    const [tooltipState, setTooltipState] = React.useState(null);
    const rootRef = React.useRef(null);
    React.useEffect(() => {
        setSortBy(defaultSort);
    }, [defaultSort]);
    React.useEffect(() => {
        setStatusFilter(filterWorseThanPlanDefault ? 'bad' : 'all');
    }, [filterWorseThanPlanDefault]);
    // ── Derived ──
    const sorted = React.useMemo(() => (0, sorting_1.sortRows)(rows, sortBy), [rows, sortBy]);
    const visibleRows = React.useMemo(() => {
        // Если ни один toggle не активен — показываем всё.
        if (!filterBad && !filterGood)
            return sorted;
        return sorted.filter(r => {
            if (filterBad && r.status === 'bad')
                return true;
            if (filterGood && r.status === 'good')
                return true;
            return false;
        });
    }, [sorted, filterBad, filterGood]);
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
        return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { ref: rootRef, className: styles_1.ROOT_CLASS, isDarkMode: isDarkMode, widthPx: width, heightPx: height, "data-theme": isDarkMode ? 'dark' : 'light', children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { role: "region", "aria-label": headerText, "aria-busy": "true", "data-no-anim": "", children: [(0, jsx_runtime_1.jsx)(styles_1.CardHead, { children: (0, jsx_runtime_1.jsx)(styles_1.TitleBlock, { children: (0, jsx_runtime_1.jsxs)(styles_1.CardTitle, { children: [headerText, mockModeEnabled && (0, jsx_runtime_1.jsx)(styles_1.MockBadge, { children: "\u0422\u0415\u0421\u0422" })] }) }) }), (0, jsx_runtime_1.jsxs)(styles_1.StateOverlay, { "aria-busy": "true", children: [(0, jsx_runtime_1.jsx)(styles_1.Skeleton, { widthPct: 100 }), (0, jsx_runtime_1.jsx)(styles_1.Skeleton, { widthPct: 95 }), (0, jsx_runtime_1.jsx)(styles_1.Skeleton, { widthPct: 90 })] })] })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(styles_1.Root, { ref: rootRef, className: styles_1.ROOT_CLASS, isDarkMode: isDarkMode, widthPx: width, heightPx: height, "data-theme": isDarkMode ? 'dark' : 'light', children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { role: "region", "aria-label": headerText, "data-info-hint-container": "", children: [dataState === 'stale' && (0, jsx_runtime_1.jsx)(styles_1.StaleBar, { "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)(styles_1.CardHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.TitleBlock, { children: [(0, jsx_runtime_1.jsxs)(styles_1.CardTitle, { children: [headerText, mockModeEnabled && (0, jsx_runtime_1.jsx)(styles_1.MockBadge, { children: "\u0422\u0415\u0421\u0422" }), dataState === 'partial' && ((0, jsx_runtime_1.jsx)(styles_1.PartialBadge, { title: "\u0427\u0430\u0441\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0445 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430", children: "\u0427\u0430\u0441\u0442\u0438\u0447\u043D\u043E" }))] }), (0, jsx_runtime_1.jsxs)(styles_1.CardSub, { children: [subheaderText ? (0, jsx_runtime_1.jsx)("span", { children: subheaderText }) : null, totalStores != null ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "dot" }), (0, jsx_runtime_1.jsx)("span", { className: "strong", children: (0, format_1.formatStoresCount)(totalStores) })] })) : null] })] }), (0, jsx_runtime_1.jsxs)(styles_1.Controls, { children: [rows.length > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(SortMenu_1.default, { value: sortBy, onChange: setSortBy }), (() => {
                                                const opts = [
                                                    { id: 'all', label: 'Все', tone: 'neutral' },
                                                    { id: 'bad', label: 'Хуже плана', tone: 'bad' },
                                                    { id: 'good', label: 'Лучше плана', tone: 'good' },
                                                ];
                                                const cur = opts.find(o => o.id === statusFilter) ?? opts[0];
                                                const dotColor = cur.tone === 'bad' ? 'var(--dn)' : cur.tone === 'good' ? 'var(--up)' : 'var(--g400)';
                                                const borderColor = cur.tone === 'neutral' ? 'var(--g200)' : (cur.tone === 'bad' ? 'var(--dn)' : 'var(--up)');
                                                return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("button", { ref: statusTriggerRef, type: "button", className: "bc-status-dd-trigger", "aria-haspopup": "listbox", "aria-expanded": statusDdOpen, "aria-label": `Фильтр по статусу: ${cur.label}`, title: "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u0441\u0442\u0430\u0442\u0443\u0441\u0443", onClick: () => setStatusDdOpen(v => !v), style: {
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                minHeight: 30,
                                                                padding: '4px 9px',
                                                                background: 'var(--bg)',
                                                                border: `1px solid ${borderColor}`,
                                                                borderRadius: 8,
                                                                color: 'var(--ink)',
                                                                fontFamily: 'var(--m)',
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                            }, children: [(0, jsx_runtime_1.jsx)("span", { "aria-hidden": "true", style: { width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 } }), (0, jsx_runtime_1.jsx)("span", { children: cur.label }), (0, jsx_runtime_1.jsx)("svg", { width: "9", height: "6", viewBox: "0 0 10 6", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M1 1 L5 5 L9 1" }) })] }), statusDdOpen && (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)("div", { className: "bc-status-dd-portal", role: "listbox", "aria-label": "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u0441\u0442\u0430\u0442\u0443\u0441\u0443", style: {
                                                                position: 'fixed',
                                                                top: statusMenuPos.top,
                                                                right: statusMenuPos.right,
                                                                zIndex: 10000,
                                                                minWidth: 180,
                                                                background: '#ffffff',
                                                                border: '1px solid #D1D5DB',
                                                                borderRadius: 10,
                                                                padding: 4,
                                                                boxShadow: '0 10px 28px rgba(15, 17, 20, 0.15)',
                                                            }, children: opts.map(o => {
                                                                const isOn = statusFilter === o.id;
                                                                const oDot = o.tone === 'bad' ? 'var(--dn)' : o.tone === 'good' ? 'var(--up)' : 'var(--g400)';
                                                                return ((0, jsx_runtime_1.jsxs)("button", { type: "button", role: "option", "aria-selected": isOn, onClick: () => {
                                                                        setStatusFilter(o.id);
                                                                        setStatusDdOpen(false);
                                                                    }, style: {
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 10,
                                                                        width: '100%',
                                                                        minHeight: 34,
                                                                        padding: '7px 10px',
                                                                        background: isOn ? '#F3F4F6' : 'transparent',
                                                                        border: 'none',
                                                                        borderRadius: 6,
                                                                        color: '#0F1114',
                                                                        fontFamily: 'inherit',
                                                                        fontSize: 12,
                                                                        fontWeight: isOn ? 600 : 500,
                                                                        textAlign: 'left',
                                                                        cursor: 'pointer',
                                                                    }, onMouseEnter: e => { if (!isOn)
                                                                        e.currentTarget.style.background = '#F9FAFB'; }, onMouseLeave: e => { if (!isOn)
                                                                        e.currentTarget.style.background = 'transparent'; }, children: [(0, jsx_runtime_1.jsx)("span", { "aria-hidden": "true", style: { width: 10, height: 10, borderRadius: '50%', background: oDot, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)' } }), (0, jsx_runtime_1.jsx)("span", { children: o.label })] }, o.id));
                                                            }) }), document.body)] }));
                                            })()] })), (0, jsx_runtime_1.jsx)(InfoHint_1.InfoHintTopRight, { children: (0, jsx_runtime_1.jsxs)(InfoHint_1.InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [enableDetailModal && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Click" }), " bar \u2014 \u0434\u0435\u0442\u0430\u043B\u0438"] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" })] })), (0, jsx_runtime_1.jsx)("span", { className: "hi", children: "Sort / Filter \u2014 controls \u0441\u0432\u0435\u0440\u0445\u0443" }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Right Click" }), " \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"] })] }) })] })] }), dataState === 'error' ? ((0, jsx_runtime_1.jsx)(styles_1.StateOverlay, { role: "alert", children: (0, jsx_runtime_1.jsx)(styles_1.ErrorCaption, { children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445" }) })) : null, dataState === 'empty' ? ((0, jsx_runtime_1.jsxs)(styles_1.StateOverlay, { children: [(0, jsx_runtime_1.jsx)("span", { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F" }), (0, jsx_runtime_1.jsx)(styles_1.HintCaption, { children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435 \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u0435 \u0438 \u043C\u0435\u0442\u0440\u0438\u043A\u0443 \u0444\u0430\u043A\u0442\u0430" })] })) : null, (dataState === 'populated' ||
                        dataState === 'partial' ||
                        dataState === 'stale') && rows.length > 0 ? ((0, jsx_runtime_1.jsx)(styles_1.BulletList, { role: "list", children: visibleRows.length === 0 && (filterBad || filterGood) ? ((0, jsx_runtime_1.jsx)(styles_1.StateOverlay, { children: (0, jsx_runtime_1.jsx)("span", { children: filterBad && filterGood
                                    ? 'Нет строк «хуже» или «лучше плана» — все в пределах цели'
                                    : filterBad
                                        ? 'Нет строк «хуже плана» — все в пределах цели'
                                        : 'Нет строк «лучше плана» — все в пределах цели или хуже' }) })) : (visibleRows.map(row => {
                            const color = statusColorVar(row.status);
                            const isActive = activeCategoryIds.has(row.id);
                            const dimmed = hasActiveFilter && !isActive;
                            return ((0, jsx_runtime_1.jsx)(BulletRow_1.default, { row: row, scaleMax: scaleMax, direction: direction, filtered: isActive, dimmed: dimmed, statusColor: color, formatters: formatters, handlers: {
                                    onClick: handleRowClick,
                                    onHover: handleRowHover,
                                } }, row.id));
                        })) })) : null, (0, jsx_runtime_1.jsx)(styles_1.CardFooter, { children: rows.length > 0 && ((0, jsx_runtime_1.jsxs)(styles_1.FootLegend, { "aria-label": "\u0423\u0441\u043B\u043E\u0432\u043D\u044B\u0435 \u043E\u0431\u043E\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F", children: [(0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { children: [(0, jsx_runtime_1.jsx)(styles_1.LegendBar, {}), (0, jsx_runtime_1.jsx)("span", { children: "\u0444\u0430\u043A\u0442" })] }), (0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { children: [(0, jsx_runtime_1.jsx)(styles_1.LegendTarget, {}), (0, jsx_runtime_1.jsx)("span", { children: "\u0446\u0435\u043B\u044C" })] }), (0, jsx_runtime_1.jsxs)(styles_1.LegendItem, { children: [(0, jsx_runtime_1.jsx)(styles_1.LegendBand, {}), (0, jsx_runtime_1.jsx)("span", { children: "\u0437\u043E\u043D\u0430" })] })] })) })] }), tooltipState ? ((0, jsx_runtime_1.jsx)(Tooltip_1.default, { row: tooltipState.row, direction: direction, formatters: formatters, statusColor: statusColorVar(tooltipState.row.status), x: tooltipState.x, y: tooltipState.y, rootEl: rootRef.current, showDetailHint: enableDetailModal, 
                /* Tooltip того же тона что Card surface (НЕ инверт).
                   Передаём theme-aware tokens: bg=surface, text=ink. */
                ink: isDarkMode ? themeTokens_1.DARK_TOKENS.s : themeTokens_1.LIGHT_TOKENS.s, surface: isDarkMode ? themeTokens_1.DARK_TOKENS.ink : themeTokens_1.LIGHT_TOKENS.ink, border: isDarkMode ? themeTokens_1.DARK_TOKENS.g700 : themeTokens_1.LIGHT_TOKENS.g300 })) : null, modalRow ? ((0, jsx_runtime_1.jsx)(DetailModal_1.default, { row: modalRow, scaleMax: scaleMax, direction: direction, formatters: formatters, detailQueryParams: detailQueryParams, mockMode: mockModeEnabled, onClose: closeModal, rootEl: rootRef.current })) : null] }));
};
/** Корневой компонент, обёрнут в ErrorBoundary. */
const BulletChart = props => ((0, jsx_runtime_1.jsx)(BulletErrorBoundary, { children: (0, jsx_runtime_1.jsx)(BulletChartInner, { ...props }) }));
exports.default = BulletChart;
//# sourceMappingURL=BulletChart.js.map