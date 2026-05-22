import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState, } from 'react';
import { Global, css } from '@emotion/react';
import { ParetoCardRoot, Card, CardHead, CardTitleGroup, CardTitle, CardSubtitle, ControlsRow, ChartBox, CardFooter, MockBadge, PartialBadge, StaleBar, SkeletonBlock, StateCenter, PARETO_CARD_CLASS, } from './styles/styled';
import { PARETO_KEYFRAMES_CSS } from './styles/keyframes';
import { useParetoState } from './hooks/useParetoState';
import { useSupersetWrapper } from './hooks/useSupersetWrapper';
import { computePareto } from './echarts/computePareto';
import { buildEChartsOption } from './echarts/buildOption';
import { getActiveTokens } from './styles/tokens';
import Breadcrumb from './components/Breadcrumb';
import RuntimeControls from './components/RuntimeControls';
import VitalFewSummary from './components/VitalFewSummary';
import ZoneLegend from './components/ZoneLegend';
import HintRow from './components/HintRow';
import EmptyState from './components/EmptyState';
import ChartCanvas from './components/ChartCanvas';
import ChartTooltip from './components/ChartTooltip';
import DrillModal from './components/DrillModal';
/**
 * Custom React.memo comparator — по kpiCard/patterns_superset_viz_plugin.md §1.
 * Superset ChartRenderer передаёт inline function props (formatters), которые
 * меняют ссылку при каждом render. Без этого comparator'а каждый setState тригерит
 * полный re-render всего дерева.
 */
function arePropsEqual(prev, next) {
    const keys = Object.keys(next);
    for (const key of keys) {
        if (typeof next[key] === 'function')
            continue;
        if (key === 'theme')
            continue;
        if (prev[key] !== next[key])
            return false;
    }
    return true;
}
function ParetoCardInner(props) {
    const { width, height, items: rawItems, headerText, subtitleText, metricLabel, metricUnit, metricGenitive, defaultThreshold, chartAriaLabel, breakdownTitle, dataState, isDarkMode, mockModeEnabled, } = props;
    const [state, dispatch] = useParetoState(defaultThreshold);
    const [hover, setHover] = useState(null);
    const rootRef = useRef(null);
    // Скрывает SliceHeader, делает holder прозрачным, оставляет троеточие через hover.
    useSupersetWrapper(rootRef);
    // Tokens пересчитываются при смене темы — они нужны в hex-виде
    // для ECharts canvas (который не резолвит CSS переменные).
    const tokens = useMemo(() => getActiveTokens(isDarkMode), [isDarkMode]);
    // Есть ли данные для prev overlay.
    const hasPrevData = useMemo(() => rawItems.some(i => i.valuePrev != null), [rawItems]);
    // Computed Pareto + опция ECharts.
    const computed = useMemo(() => computePareto(rawItems, state.threshold), [rawItems, state.threshold]);
    const option = useMemo(() => buildEChartsOption({ computed, state, tokens }), [computed, state, tokens]);
    // Esc — сброс filter'ов (drill закрывает модалка отдельным listener'ом).
    useEffect(() => {
        const handler = (e) => {
            if (e.key !== 'Escape')
                return;
            if (state.drillId)
                return; // drill закроется сам
            if (state.selectedId || state.zoneFilter) {
                dispatch({ type: 'resetFilters' });
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [dispatch, state.drillId, state.selectedId, state.zoneFilter]);
    // Handlers.
    const onItemClick = useCallback((item, ctrlKey) => {
        if (ctrlKey) {
            dispatch({ type: 'openDrill', id: item.id });
        }
        else {
            dispatch({ type: 'toggleSelected', id: item.id });
        }
    }, [dispatch]);
    const onBackgroundClick = useCallback(() => {
        if (state.selectedId || state.zoneFilter) {
            dispatch({ type: 'resetFilters' });
        }
    }, [dispatch, state.selectedId, state.zoneFilter]);
    const drillItem = state.drillId
        ? computed.items.find(i => i.id === state.drillId) ?? null
        : null;
    // Уникальный id для aria-labelledby — иначе несколько карточек на дашборде
    // будут ссылаться на один и тот же element id.
    const titleId = useId();
    // DS 2.0 canonical: loading имеет свой раздельный return со своим <Card>.
    // При переходе loading → loaded React unmount'ит loading-Card и mount'ит
    // новый → cardInKf animation запускается ровно когда юзер видит реальный
    // контент (см. styled.ts:cardInKf и canonical donut StructureDonut.tsx).
    if (dataState === 'loading') {
        return (_jsxs(ParetoCardRoot, { ref: rootRef, width: width, height: height, "data-theme": isDarkMode ? 'dark' : 'light', className: PARETO_CARD_CLASS, children: [_jsx(Global, { styles: css `${PARETO_KEYFRAMES_CSS}` }), _jsxs(Card, { role: "region", "aria-labelledby": titleId, "aria-busy": "true", "data-no-anim": "", children: [_jsx(CardHead, { children: _jsxs(CardTitleGroup, { children: [_jsxs(CardTitle, { id: titleId, children: [headerText, mockModeEnabled && _jsx(MockBadge, { children: "\u0422\u0415\u0421\u0422" })] }), subtitleText && _jsx(CardSubtitle, { children: subtitleText })] }) }), _jsxs(StateCenter, { role: "status", "aria-label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430", children: [_jsx(SkeletonBlock, { w: "60%", h: "18px" }), _jsx(SkeletonBlock, { w: "100%", h: "220px" })] })] })] }));
    }
    return (_jsxs(ParetoCardRoot, { ref: rootRef, width: width, height: height, "data-theme": isDarkMode ? 'dark' : 'light', className: PARETO_CARD_CLASS, children: [_jsx(Global, { styles: css `${PARETO_KEYFRAMES_CSS}` }), _jsxs(Card, { role: "region", "aria-labelledby": titleId, "data-info-hint-container": "", children: [dataState === 'stale' && _jsx(StaleBar, { "aria-hidden": "true" }), _jsxs(CardHead, { children: [_jsxs(CardTitleGroup, { children: [_jsxs(CardTitle, { id: titleId, children: [headerText, mockModeEnabled && _jsx(MockBadge, { children: "\u0422\u0415\u0421\u0422" }), dataState === 'partial' && (_jsx(PartialBadge, { title: "\u0427\u0430\u0441\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0445 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430", children: "\u0427\u0430\u0441\u0442\u0438\u0447\u043D\u043E" }))] }), subtitleText && _jsx(CardSubtitle, { children: subtitleText }), _jsx(Breadcrumb, { state: state, items: computed.items, onReset: () => dispatch({ type: 'resetFilters' }) })] }), _jsxs(ControlsRow, { children: [_jsx(RuntimeControls, { state: state, hasPrevData: hasPrevData, onUnitChange: unit => dispatch({ type: 'setUnit', value: unit }), onThresholdChange: v => dispatch({ type: 'setThreshold', value: v }), onToggleTopA: () => dispatch({ type: 'toggleTopA' }), onTogglePrev: () => dispatch({ type: 'togglePrev' }) }), _jsx(HintRow, {})] })] }), _jsx(VitalFewSummary, { vitalFew: computed.vitalFew, metricGenitive: metricGenitive, metricUnit: metricUnit }), _jsx(ChartBox, { role: "img", "aria-label": chartAriaLabel, children: dataState === 'empty' || dataState === 'error' ? (_jsx(EmptyState, { state: dataState })) : (_jsxs(_Fragment, { children: [_jsx(ChartCanvas, { option: option, width: width, height: height, items: computed.items, onHoverItem: setHover, onItemClick: onItemClick, onBackgroundClick: onBackgroundClick }), hover && (_jsx(ChartTooltip, { item: hover.item, x: hover.x, y: hover.y, tokens: tokens, metricLabel: metricLabel, metricUnit: metricUnit, showPrev: state.prevOverlay }))] })) }), _jsx(CardFooter, { children: _jsx(ZoneLegend, { state: state, tokens: tokens, metricLabel: metricLabel, onToggleZone: zone => dispatch({ type: 'toggleZone', zone }), onToggleSeries: kind => dispatch({
                                type: 'setSeries',
                                kind,
                                visible: !state.seriesVisible[kind],
                            }) }) })] }), drillItem && (_jsx(DrillModal, { item: drillItem, computed: computed, tokens: tokens, metricLabel: metricLabel, metricUnit: metricUnit, breakdownTitle: breakdownTitle, isDarkMode: isDarkMode, onClose: () => dispatch({ type: 'closeDrill' }) }))] }));
}
const ParetoCardMemo = React.memo(ParetoCardInner, arePropsEqual);
// Superset ожидает FunctionComponent, не MemoExoticComponent.
// Cast через unknown, чтобы сохранить type-safety для consumer'ов.
const ParetoCard = ParetoCardMemo;
export default ParetoCard;
//# sourceMappingURL=ParetoCard.js.map