import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { Card, CardFooter, CardHead, CardSub, CardTitle, Controls, ErrorCaption, FilterPill, FootDot, FootHint, FootLegend, HintCaption, Kbd, KEYFRAMES_CSS, LegendBand, LegendBar, LegendItem, LegendTarget, BulletList, Root, ROOT_CLASS, Skeleton, StateOverlay, TitleBlock, PartialBadge, StaleBar, } from './styles';
import BulletRow from './components/BulletRow';
import SortMenu from './components/SortMenu';
import BulletTooltip from './components/Tooltip';
import DetailModal from './DetailModal';
import { InfoHint, InfoHintCorner } from './components/InfoHint';
import { sortRows } from './utils/sorting';
import { formatStoresCount } from './utils/format';
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
            return (_jsxs(StateOverlay, { role: "alert", children: [_jsx(ErrorCaption, { children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u0440\u0438\u0441\u043E\u0432\u043A\u0438 bullet-\u0447\u0430\u0440\u0442\u0430" }), _jsx(HintCaption, { children: this.state.message })] }));
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
    const sorted = React.useMemo(() => sortRows(rows, sortBy), [rows, sortBy]);
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
        return (_jsxs(Root, { ref: rootRef, className: ROOT_CLASS, isDarkMode: isDarkMode, widthPx: width, heightPx: height, "data-theme": isDarkMode ? 'dark' : 'light', children: [_jsx("style", { dangerouslySetInnerHTML: { __html: KEYFRAMES_CSS } }), _jsxs(Card, { role: "region", "aria-label": headerText, "aria-busy": "true", "data-no-anim": "", children: [_jsx(CardHead, { children: _jsx(TitleBlock, { children: _jsx(CardTitle, { children: headerText }) }) }), _jsxs(StateOverlay, { "aria-busy": "true", children: [_jsx(Skeleton, { widthPct: 100 }), _jsx(Skeleton, { widthPct: 95 }), _jsx(Skeleton, { widthPct: 90 })] })] })] }));
    }
    return (_jsxs(Root, { ref: rootRef, className: ROOT_CLASS, isDarkMode: isDarkMode, widthPx: width, heightPx: height, "data-theme": isDarkMode ? 'dark' : 'light', children: [_jsx("style", { dangerouslySetInnerHTML: { __html: KEYFRAMES_CSS } }), _jsxs(Card, { role: "region", "aria-label": headerText, "data-info-hint-container": "", children: [dataState === 'stale' && _jsx(StaleBar, { "aria-hidden": "true" }), _jsxs(CardHead, { children: [_jsxs(TitleBlock, { children: [_jsxs(CardTitle, { children: [headerText, dataState === 'partial' && (_jsx(PartialBadge, { title: "\u0427\u0430\u0441\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0445 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430", children: "\u0427\u0430\u0441\u0442\u0438\u0447\u043D\u043E" }))] }), _jsxs(CardSub, { children: [subheaderText ? _jsx("span", { children: subheaderText }) : null, totalStores != null ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "dot" }), _jsx("span", { className: "strong", children: formatStoresCount(totalStores) })] })) : null, mockModeEnabled ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "dot" }), _jsx("span", { children: "\u0420\u0435\u0436\u0438\u043C \u043F\u0440\u043E\u0435\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F" })] })) : null] })] }), rows.length > 0 ? (_jsxs(Controls, { children: [_jsx(SortMenu, { value: sortBy, onChange: setSortBy }), _jsxs(FilterPill, { type: "button", active: filterBad, "aria-pressed": filterBad, onClick: () => setFilterBad(v => !v), title: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0445\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430", children: [_jsxs("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("path", { d: "M7 2 L13 12 L1 12 Z" }), _jsx("line", { x1: "7", y1: "6", x2: "7", y2: "9" }), _jsx("line", { x1: "7", y1: "11", x2: "7", y2: "11.5" })] }), _jsx("span", { children: "\u0425\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430" })] })] })) : null] }), dataState === 'loading' ? (_jsxs(StateOverlay, { "aria-busy": "true", children: [_jsx(Skeleton, { widthPct: 100 }), _jsx(Skeleton, { widthPct: 95 }), _jsx(Skeleton, { widthPct: 90 })] })) : null, dataState === 'error' ? (_jsx(StateOverlay, { role: "alert", children: _jsx(ErrorCaption, { children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445" }) })) : null, dataState === 'empty' ? (_jsxs(StateOverlay, { children: [_jsx("span", { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F" }), _jsx(HintCaption, { children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435 \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u0435 \u0438 \u043C\u0435\u0442\u0440\u0438\u043A\u0443 \u0444\u0430\u043A\u0442\u0430" })] })) : null, (dataState === 'populated' ||
                        dataState === 'partial' ||
                        dataState === 'stale') && rows.length > 0 ? (_jsx(BulletList, { role: "list", children: visibleRows.length === 0 && filterBad ? (_jsx(StateOverlay, { children: _jsx("span", { children: "\u041D\u0435\u0442 \u0441\u0442\u0440\u043E\u043A \u00AB\u0445\u0443\u0436\u0435 \u043F\u043B\u0430\u043D\u0430\u00BB \u2014 \u0432\u0441\u0435 \u0432 \u043F\u0440\u0435\u0434\u0435\u043B\u0430\u0445 \u0446\u0435\u043B\u0438" }) })) : (visibleRows.map(row => {
                            const color = statusColorVar(row.status);
                            const isActive = activeCategoryIds.has(row.id);
                            const dimmed = hasActiveFilter && !isActive;
                            return (_jsx(BulletRow, { row: row, scaleMax: scaleMax, direction: direction, filtered: isActive, dimmed: dimmed, statusColor: color, formatters: formatters, handlers: {
                                    onClick: handleRowClick,
                                    onHover: handleRowHover,
                                } }, row.id));
                        })) })) : null, _jsxs(CardFooter, { children: [rows.length > 0 && (_jsxs(_Fragment, { children: [_jsxs(FootHint, { children: [_jsx(Kbd, { children: "Click" }), _jsx("span", { children: "\u0444\u0438\u043B\u044C\u0442\u0440" }), enableDetailModal ? (_jsxs(_Fragment, { children: [_jsx(FootDot, { children: "\u00B7" }), _jsx(Kbd, { children: "Ctrl" }), _jsx("span", { children: "+" }), _jsx(Kbd, { children: "Click" }), _jsx("span", { children: "\u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F" })] })) : null] }), _jsxs(FootLegend, { children: [_jsxs(LegendItem, { children: [_jsx(LegendBar, {}), _jsx("span", { children: "\u0444\u0430\u043A\u0442" })] }), _jsxs(LegendItem, { children: [_jsx(LegendTarget, {}), _jsx("span", { children: "\u0446\u0435\u043B\u044C" })] }), _jsxs(LegendItem, { children: [_jsx(LegendBand, {}), _jsx("span", { children: "\u0437\u043E\u043D\u0430" })] })] })] })), _jsx(InfoHintCorner, { children: _jsxs(InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [enableDetailModal && (_jsxs(_Fragment, { children: [_jsx("span", { className: "hi", children: _jsx("span", { children: "Click bar \u2014 \u0434\u0435\u0442\u0430\u043B\u0438" }) }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" })] })), _jsx("span", { className: "hi", children: _jsx("span", { children: "Sort / Filter \u2014 controls \u0441\u0432\u0435\u0440\u0445\u0443" }) }), _jsx("span", { className: "hi-sep", "aria-hidden": "true" }), _jsx("span", { className: "hi", children: _jsx("span", { children: "Right Click \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439" }) })] }) })] })] }), tooltipState ? (_jsx(BulletTooltip, { row: tooltipState.row, direction: direction, formatters: formatters, statusColor: statusColorVar(tooltipState.row.status), x: tooltipState.x, y: tooltipState.y, rootEl: rootRef.current, showDetailHint: enableDetailModal })) : null, modalRow ? (_jsx(DetailModal, { row: modalRow, scaleMax: scaleMax, direction: direction, formatters: formatters, detailQueryParams: detailQueryParams, mockMode: mockModeEnabled, onClose: closeModal, rootEl: rootRef.current })) : null] }));
};
/** Корневой компонент, обёрнут в ErrorBoundary. */
const BulletChart = props => (_jsx(BulletErrorBoundary, { children: _jsx(BulletChartInner, { ...props }) }));
export default BulletChart;
//# sourceMappingURL=BulletChart.js.map