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
const react_1 = __importStar(require("react"));
const react_2 = require("@emotion/react");
const styled_1 = require("./styles/styled");
const keyframes_1 = require("./styles/keyframes");
const useParetoState_1 = require("./hooks/useParetoState");
const useSupersetWrapper_1 = require("./hooks/useSupersetWrapper");
const computePareto_1 = require("./echarts/computePareto");
const buildOption_1 = require("./echarts/buildOption");
const tokens_1 = require("./styles/tokens");
const Breadcrumb_1 = __importDefault(require("./components/Breadcrumb"));
const RuntimeControls_1 = __importDefault(require("./components/RuntimeControls"));
const VitalFewSummary_1 = __importDefault(require("./components/VitalFewSummary"));
const ZoneLegend_1 = __importDefault(require("./components/ZoneLegend"));
const HintRow_1 = __importDefault(require("./components/HintRow"));
const EmptyState_1 = __importDefault(require("./components/EmptyState"));
const ChartCanvas_1 = __importDefault(require("./components/ChartCanvas"));
const ChartTooltip_1 = __importDefault(require("./components/ChartTooltip"));
const DrillModal_1 = __importDefault(require("./components/DrillModal"));
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
    const { width, height, items: rawItems, headerText, subtitleText, metricLabel, metricUnit, metricGenitive, defaultThreshold, chartAriaLabel, breakdownTitle, dataState, isDarkMode, } = props;
    const [state, dispatch] = (0, useParetoState_1.useParetoState)(defaultThreshold);
    const [hover, setHover] = (0, react_1.useState)(null);
    const rootRef = (0, react_1.useRef)(null);
    // Скрывает SliceHeader, делает holder прозрачным, оставляет троеточие через hover.
    (0, useSupersetWrapper_1.useSupersetWrapper)(rootRef);
    // Tokens пересчитываются при смене темы — они нужны в hex-виде
    // для ECharts canvas (который не резолвит CSS переменные).
    const tokens = (0, react_1.useMemo)(() => (0, tokens_1.getActiveTokens)(isDarkMode), [isDarkMode]);
    // Есть ли данные для prev overlay.
    const hasPrevData = (0, react_1.useMemo)(() => rawItems.some(i => i.valuePrev != null), [rawItems]);
    // Computed Pareto + опция ECharts.
    const computed = (0, react_1.useMemo)(() => (0, computePareto_1.computePareto)(rawItems, state.threshold), [rawItems, state.threshold]);
    const option = (0, react_1.useMemo)(() => (0, buildOption_1.buildEChartsOption)({ computed, state, tokens }), [computed, state, tokens]);
    // Esc — сброс filter'ов (drill закрывает модалка отдельным listener'ом).
    (0, react_1.useEffect)(() => {
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
    const onItemClick = (0, react_1.useCallback)((item, ctrlKey) => {
        if (ctrlKey) {
            dispatch({ type: 'openDrill', id: item.id });
        }
        else {
            dispatch({ type: 'toggleSelected', id: item.id });
        }
    }, [dispatch]);
    const onBackgroundClick = (0, react_1.useCallback)(() => {
        if (state.selectedId || state.zoneFilter) {
            dispatch({ type: 'resetFilters' });
        }
    }, [dispatch, state.selectedId, state.zoneFilter]);
    const drillItem = state.drillId
        ? computed.items.find(i => i.id === state.drillId) ?? null
        : null;
    // Уникальный id для aria-labelledby — иначе несколько карточек на дашборде
    // будут ссылаться на один и тот же element id.
    const titleId = (0, react_1.useId)();
    // DS 2.0 canonical: loading имеет свой раздельный return со своим <Card>.
    // При переходе loading → loaded React unmount'ит loading-Card и mount'ит
    // новый → cardInKf animation запускается ровно когда юзер видит реальный
    // контент (см. styled.ts:cardInKf и canonical donut StructureDonut.tsx).
    if (dataState === 'loading') {
        return ((0, jsx_runtime_1.jsxs)(styled_1.ParetoCardRoot, { ref: rootRef, width: width, height: height, "data-theme": isDarkMode ? 'dark' : 'light', className: styled_1.PARETO_CARD_CLASS, children: [(0, jsx_runtime_1.jsx)(react_2.Global, { styles: (0, react_2.css) `${keyframes_1.PARETO_KEYFRAMES_CSS}` }), (0, jsx_runtime_1.jsxs)(styled_1.Card, { role: "region", "aria-labelledby": titleId, "aria-busy": "true", "data-no-anim": "", children: [(0, jsx_runtime_1.jsx)(styled_1.CardHead, { children: (0, jsx_runtime_1.jsxs)(styled_1.CardTitleGroup, { children: [(0, jsx_runtime_1.jsx)(styled_1.CardTitle, { id: titleId, children: headerText }), subtitleText && (0, jsx_runtime_1.jsx)(styled_1.CardSubtitle, { children: subtitleText })] }) }), (0, jsx_runtime_1.jsxs)(styled_1.StateCenter, { role: "status", "aria-label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430", children: [(0, jsx_runtime_1.jsx)(styled_1.SkeletonBlock, { w: "60%", h: "18px" }), (0, jsx_runtime_1.jsx)(styled_1.SkeletonBlock, { w: "100%", h: "220px" })] })] })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(styled_1.ParetoCardRoot, { ref: rootRef, width: width, height: height, "data-theme": isDarkMode ? 'dark' : 'light', className: styled_1.PARETO_CARD_CLASS, children: [(0, jsx_runtime_1.jsx)(react_2.Global, { styles: (0, react_2.css) `${keyframes_1.PARETO_KEYFRAMES_CSS}` }), (0, jsx_runtime_1.jsxs)(styled_1.Card, { role: "region", "aria-labelledby": titleId, "data-info-hint-container": "", children: [(0, jsx_runtime_1.jsxs)(styled_1.CardHead, { children: [(0, jsx_runtime_1.jsxs)(styled_1.CardTitleGroup, { children: [(0, jsx_runtime_1.jsx)(styled_1.CardTitle, { id: titleId, children: headerText }), subtitleText && (0, jsx_runtime_1.jsx)(styled_1.CardSubtitle, { children: subtitleText }), (0, jsx_runtime_1.jsx)(Breadcrumb_1.default, { state: state, items: computed.items, onReset: () => dispatch({ type: 'resetFilters' }) })] }), (0, jsx_runtime_1.jsx)(styled_1.ControlsRow, { children: (0, jsx_runtime_1.jsx)(RuntimeControls_1.default, { state: state, hasPrevData: hasPrevData, onUnitChange: unit => dispatch({ type: 'setUnit', value: unit }), onThresholdChange: v => dispatch({ type: 'setThreshold', value: v }), onToggleTopA: () => dispatch({ type: 'toggleTopA' }), onTogglePrev: () => dispatch({ type: 'togglePrev' }) }) })] }), (0, jsx_runtime_1.jsx)(VitalFewSummary_1.default, { vitalFew: computed.vitalFew, metricGenitive: metricGenitive, metricUnit: metricUnit }), (0, jsx_runtime_1.jsx)(styled_1.ChartBox, { role: "img", "aria-label": chartAriaLabel, children: dataState !== 'populated' ? ((0, jsx_runtime_1.jsx)(EmptyState_1.default, { state: dataState })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(ChartCanvas_1.default, { option: option, width: width, height: height, onHoverItem: setHover, onItemClick: onItemClick, onBackgroundClick: onBackgroundClick }), hover && ((0, jsx_runtime_1.jsx)(ChartTooltip_1.default, { item: hover.item, x: hover.x, y: hover.y, tokens: tokens, metricLabel: metricLabel, metricUnit: metricUnit, showPrev: state.prevOverlay }))] })) }), (0, jsx_runtime_1.jsxs)(styled_1.CardFooter, { children: [(0, jsx_runtime_1.jsx)(ZoneLegend_1.default, { state: state, tokens: tokens, metricLabel: metricLabel, onToggleZone: zone => dispatch({ type: 'toggleZone', zone }), onToggleSeries: kind => dispatch({
                                    type: 'setSeries',
                                    kind,
                                    visible: !state.seriesVisible[kind],
                                }) }), (0, jsx_runtime_1.jsx)(HintRow_1.default, {})] })] }), drillItem && ((0, jsx_runtime_1.jsx)(DrillModal_1.default, { item: drillItem, computed: computed, tokens: tokens, metricLabel: metricLabel, metricUnit: metricUnit, breakdownTitle: breakdownTitle, isDarkMode: isDarkMode, onClose: () => dispatch({ type: 'closeDrill' }) }))] }));
}
const ParetoCardMemo = react_1.default.memo(ParetoCardInner, arePropsEqual);
// Superset ожидает FunctionComponent, не MemoExoticComponent.
// Cast через unknown, чтобы сохранить type-safety для consumer'ов.
const ParetoCard = ParetoCardMemo;
exports.default = ParetoCard;
//# sourceMappingURL=ParetoCard.js.map