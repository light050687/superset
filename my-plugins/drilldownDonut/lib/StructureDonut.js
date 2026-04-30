"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const core_1 = require("echarts/core");
const charts_1 = require("echarts/charts");
const components_1 = require("echarts/components");
const renderers_1 = require("echarts/renderers");
const features_1 = require("echarts/features");
// Регистрация нужных ECharts-компонентов (идемпотентно —
// host Superset уже делает use(...) со всеми компонентами, но
// для standalone Storybook нужно продублировать).
(0, core_1.use)([
    charts_1.PieChart,
    renderers_1.CanvasRenderer,
    components_1.TooltipComponent,
    components_1.GraphicComponent,
    components_1.LegendComponent,
    features_1.LabelLayout,
]);
const react_2 = require("@emotion/react");
const themeTokens_1 = require("./themeTokens");
const styles_1 = require("./styles");
const buildOption_1 = require("./utils/buildOption");
const formatRussian_1 = require("./utils/formatRussian");
/**
 * Главный компонент structure-donut. Воспроизводит прототип
 * `ref/structure-donut-prototype.html` один-в-один, но работает на
 * реальных данных из transformProps и на токенах useTheme().
 *
 * Локальное состояние (не из props):
 *   - unit: rub | pct
 *   - level: root | drilled
 *   - drilledId: id родителя при drilled
 *   - selectedIdx: индекс выбранного сегмента в текущем срезе
 *   - hidden: Set<id> скрытых через легенду
 *
 * Все взаимодействия — ЛОКАЛЬНЫЕ. Они не шлют запросы на сервер.
 */
/**
 * SVG-иконки для блока Hint. Определены как React-компоненты —
 * безопаснее и типобезопаснее, чем raw-HTML. Геометрия идентична прототипу.
 */
function IconClick() {
    return ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "currentColor", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M3 2 L3 13 L6 10 L8 14 L10 13 L8 9 L12 9 Z" }) }));
}
function IconDrill() {
    return ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M3 8 L13 8 M9 4 L13 8 L9 12" }) }));
}
function IconBack() {
    return ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { d: "M10 3 L5 8 L10 13" }) }));
}
function StructureDonut(props) {
    const { width, height, headerText, subtitleText, dataState, errorMessage, categories, hasSubcategories, totalRevenue, padAngle, borderRadius, showOuterLabelsPct, isDarkMode, } = props;
    // ── Локальное состояние ──
    const [unit, setUnit] = (0, react_1.useState)('rub');
    const [level, setLevel] = (0, react_1.useState)('root');
    const [drilledId, setDrilledId] = (0, react_1.useState)(null);
    const [selectedIdx, setSelectedIdx] = (0, react_1.useState)(null);
    const [hidden, setHidden] = (0, react_1.useState)(new Set());
    // Сброс состояния при полной замене данных (другая выборка, другие категории)
    const categoriesKey = (0, react_1.useMemo)(() => categories.map((c) => c.id).join('|'), [categories]);
    (0, react_1.useEffect)(() => {
        setLevel('root');
        setDrilledId(null);
        setSelectedIdx(null);
        setHidden(new Set());
    }, [categoriesKey]);
    // Токены по теме
    const tokens = isDarkMode ? themeTokens_1.DARK_TOKENS : themeTokens_1.LIGHT_TOKENS;
    // ── ECharts init + resize ──
    const chartDivRef = (0, react_1.useRef)(null);
    const chartRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const el = chartDivRef.current;
        if (!el)
            return;
        const instance = (0, core_1.init)(el);
        chartRef.current = instance;
        const ro = new ResizeObserver(() => {
            instance.resize();
        });
        ro.observe(el);
        return () => {
            ro.disconnect();
            instance.dispose();
            chartRef.current = null;
        };
    }, []);
    // Resize при изменении контейнера (width/height от Superset)
    (0, react_1.useEffect)(() => {
        chartRef.current?.resize();
    }, [width, height]);
    // ── ECharts click handlers ──
    (0, react_1.useEffect)(() => {
        const chart = chartRef.current;
        if (!chart)
            return;
        const onClick = (params) => {
            const p = params;
            if (p.componentType !== 'series' || p.seriesType !== 'pie')
                return;
            const idx = p.data?._idx;
            if (idx == null)
                return;
            setSelectedIdx((prev) => (prev === idx ? null : idx));
        };
        // Клик по пустому месту внутри donut
        const onZrClick = (e) => {
            if (e.target)
                return;
            setSelectedIdx((prev) => (prev != null ? null : prev));
        };
        chart.on('click', onClick);
        const zr = chart.getZr();
        zr.on('click', onZrClick);
        return () => {
            chart.off('click', onClick);
            zr.off('click', onZrClick);
        };
    }, []);
    // ── setOption при изменении любого state/prop ──
    (0, react_1.useEffect)(() => {
        const chart = chartRef.current;
        if (!chart)
            return;
        if (dataState === 'loading' || dataState === 'empty' || dataState === 'error')
            return;
        const option = (0, buildOption_1.buildOption)({
            state: {
                categories,
                hasSubcategories,
                totalRevenue,
                unit,
                level,
                drilledId,
                selectedIdx,
                hidden,
                padAngle,
                borderRadius,
                showOuterLabelsPct,
            },
            tokens,
        });
        chart.setOption(option, true);
    }, [
        categories,
        hasSubcategories,
        totalRevenue,
        unit,
        level,
        drilledId,
        selectedIdx,
        hidden,
        padAngle,
        borderRadius,
        showOuterLabelsPct,
        tokens,
        dataState,
    ]);
    // ── Keyboard: Escape ──
    (0, react_1.useEffect)(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape')
                return;
            if (level === 'drilled') {
                setLevel('root');
                setDrilledId(null);
                setSelectedIdx(null);
            }
            else if (selectedIdx != null) {
                setSelectedIdx(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [level, selectedIdx]);
    // ── Навигация ──
    const drillDown = (0, react_1.useCallback)((id) => {
        setLevel('drilled');
        setDrilledId(id);
        setSelectedIdx(null);
    }, []);
    const drillUp = (0, react_1.useCallback)(() => {
        setLevel('root');
        setDrilledId(null);
        setSelectedIdx(null);
    }, []);
    const clearSelection = (0, react_1.useCallback)(() => setSelectedIdx(null), []);
    // ── Текущий срез для легенды (вычисляется до toggleHidden — нужен в его closure) ──
    const currentItems = (0, react_1.useMemo)(() => (0, buildOption_1.getCurrentItems)({ categories, level, drilledId, hidden }), [categories, level, drilledId, hidden]);
    const toggleHidden = (0, react_1.useCallback)((id) => {
        // Определяем направление (hide vs show) внутри setHidden, чтобы
        // setHidden оперировал свежим prev, а не устаревшим closure `hidden`.
        let isHiding = false;
        setHidden((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                isHiding = false;
            }
            else {
                next.add(id);
                isHiding = true;
            }
            return next;
        });
        // Если скрываем ранее выбранный — снимаем selection в том же тике.
        if (isHiding && selectedIdx != null) {
            const selectedItem = currentItems[selectedIdx];
            if (selectedItem && selectedItem.id === id) {
                setSelectedIdx(null);
            }
        }
    }, [currentItems, selectedIdx]);
    // ── Breadcrumb rendering ──
    const breadcrumbContent = (0, react_1.useMemo)(() => {
        if (level === 'drilled') {
            const parent = categories.find((c) => c.id === drilledId);
            return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "bc-back", onClick: drillUp, "aria-label": "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A \u043A\u043E\u0440\u043D\u044E", title: "\u041D\u0430\u0437\u0430\u0434 (Esc)", children: "\u25C2" }), (0, jsx_runtime_1.jsxs)("span", { className: "bc-cur", children: ["\u0421\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u203A ", (0, jsx_runtime_1.jsx)("span", { className: "bc-sel", children: parent?.name ?? '—' })] })] }));
        }
        if (selectedIdx == null) {
            return ((0, jsx_runtime_1.jsxs)("span", { className: "bc-cur", children: ["\u0412\u0441\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u00B7 ", subtitleText] }));
        }
        const sel = currentItems[selectedIdx];
        if (!sel)
            return (0, jsx_runtime_1.jsxs)("span", { className: "bc-cur", children: ["\u0412\u0441\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u00B7 ", subtitleText] });
        const canDrill = hasSubcategories && level === 'root';
        const parent = categories.find((c) => c.id === sel.id);
        const hasChildren = !!parent && parent.children.length > 0;
        return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "bc-cur", children: "\u0412\u044B\u0431\u0440\u0430\u043D\u043E:" }), (0, jsx_runtime_1.jsx)("span", { className: "bc-sel", children: sel.name }), canDrill && hasChildren && ((0, jsx_runtime_1.jsx)("button", { type: "button", className: "bc-fwd", onClick: () => drillDown(sel.id), "aria-label": "\u0420\u0430\u0441\u043A\u0440\u044B\u0442\u044C \u043F\u043E\u0434\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438", title: "\u0412\u0433\u043B\u0443\u0431\u044C", children: "\u2192 \u0432\u0433\u043B\u0443\u0431\u044C" })), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "bc-back", onClick: clearSelection, "aria-label": "\u0421\u043D\u044F\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435", title: "\u0421\u043D\u044F\u0442\u044C (Esc)", children: "\u25C2" })] }));
    }, [
        level,
        drilledId,
        selectedIdx,
        currentItems,
        hasSubcategories,
        categories,
        subtitleText,
        drillDown,
        drillUp,
        clearSelection,
    ]);
    // ── Hint rendering ──
    const hintContent = (0, react_1.useMemo)(() => {
        if (level === 'drilled') {
            return ((0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)(IconBack, {}), (0, jsx_runtime_1.jsx)("span", { children: "Esc \u2014 \u043D\u0430\u0437\u0430\u0434" })] }));
        }
        if (selectedIdx != null) {
            return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [hasSubcategories && ((0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)(IconDrill, {}), (0, jsx_runtime_1.jsx)("span", { children: "\u2192 \u0432\u0433\u043B\u0443\u0431\u044C \u2014 \u043F\u043E\u0434\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438" })] })), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)(IconBack, {}), (0, jsx_runtime_1.jsx)("span", { children: "Esc \u2014 \u0441\u043D\u044F\u0442\u044C" })] })] }));
        }
        return ((0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)(IconClick, {}), (0, jsx_runtime_1.jsx)("span", { children: "\u043A\u043B\u0438\u043A \u2014 \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E" })] }));
    }, [level, selectedIdx, hasSubcategories]);
    const showChart = dataState === 'populated' || dataState === 'partial' || dataState === 'stale';
    return ((0, jsx_runtime_1.jsxs)(styles_1.StructureDonutRoot, { "data-theme": isDarkMode ? 'dark' : 'light', width: width, height: height, children: [(0, jsx_runtime_1.jsx)(react_2.Global, { styles: (0, react_2.css) `${styles_1.KEYFRAMES_CSS}` }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { role: "region", "aria-labelledby": "sd-title", children: [(0, jsx_runtime_1.jsxs)(styles_1.CardHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.Title, { children: [(0, jsx_runtime_1.jsx)(styles_1.HeaderText, { id: "sd-title", children: headerText }), (0, jsx_runtime_1.jsx)(styles_1.Breadcrumb, { children: breadcrumbContent }), dataState === 'partial' && ((0, jsx_runtime_1.jsx)(styles_1.PartialChip, { role: "status", "aria-live": "polite", children: "\u26A0 \u041F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u0435\u0440\u0432\u044B\u0435 500 \u0441\u0442\u0440\u043E\u043A" })), dataState === 'stale' && ((0, jsx_runtime_1.jsx)(styles_1.StaleBadge, { role: "status", "aria-live": "polite", children: "\u21BB \u0414\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 \u043A\u044D\u0448\u0430" }))] }), (0, jsx_runtime_1.jsx)(styles_1.Controls, { children: (0, jsx_runtime_1.jsxs)(styles_1.UnitToggle, { role: "radiogroup", "aria-label": "\u0415\u0434\u0438\u043D\u0438\u0446\u044B \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u044F", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", role: "radio", className: unit === 'rub' ? 'on' : '', "aria-checked": unit === 'rub', onClick: () => setUnit('rub'), title: "\u0412 \u0440\u0443\u0431\u043B\u044F\u0445", children: "\u20BD" }), (0, jsx_runtime_1.jsx)("button", { type: "button", role: "radio", className: unit === 'pct' ? 'on' : '', "aria-checked": unit === 'pct', onClick: () => setUnit('pct'), title: "\u041F\u0440\u043E\u0446\u0435\u043D\u0442 \u043E\u0442 \u043E\u0431\u043E\u0440\u043E\u0442\u0430", children: "%" })] }) })] }), dataState === 'loading' && (0, jsx_runtime_1.jsx)(styles_1.SkeletonOverlay, { role: "status", "aria-label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430" }), dataState === 'empty' && ((0, jsx_runtime_1.jsx)(styles_1.EmptyOverlay, { role: "status", children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" })), dataState === 'error' && ((0, jsx_runtime_1.jsxs)(styles_1.ErrorOverlay, { role: "alert", children: [(0, jsx_runtime_1.jsx)("div", { children: "\u26A0 \u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445" }), (0, jsx_runtime_1.jsx)("div", { className: "sd-error-sub", children: errorMessage ?? 'Проверьте настройки запроса' })] })), showChart && ((0, jsx_runtime_1.jsx)(styles_1.ChartWrap, { children: (0, jsx_runtime_1.jsx)(styles_1.ChartCanvas, { ref: chartDivRef, role: "img", "aria-label": `Структура потерь: ${(0, formatRussian_1.fmtRub)(categories.reduce((s, c) => s + c.rub, 0))} по ${categories.length} категориям` }) })), (0, jsx_runtime_1.jsxs)(styles_1.Footer, { children: [(0, jsx_runtime_1.jsx)(styles_1.Legend, { role: "group", "aria-label": "\u041B\u0435\u0433\u0435\u043D\u0434\u0430", children: currentItems.map((it) => ((0, jsx_runtime_1.jsxs)(styles_1.LegendChip, { className: hidden.has(it.id) ? 'off' : '', tabIndex: 0, role: "button", "aria-pressed": !hidden.has(it.id), "aria-label": `${hidden.has(it.id) ? 'Показать' : 'Скрыть'} ${it.name}`, onClick: () => toggleHidden(it.id), onKeyDown: (e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            toggleHidden(it.id);
                                        }
                                    }, children: [(0, jsx_runtime_1.jsx)("span", { className: "lg-dot", style: { background: it.color } }), (0, jsx_runtime_1.jsx)("span", { className: "lg-l", children: it.name })] }, it.id))) }), (0, jsx_runtime_1.jsx)(styles_1.Hint, { children: hintContent })] })] })] }));
}
exports.default = StructureDonut;
//# sourceMappingURL=StructureDonut.js.map