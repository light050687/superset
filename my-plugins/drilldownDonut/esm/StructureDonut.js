import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { init, use } from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, GraphicComponent, LegendComponent, } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { LabelLayout } from 'echarts/features';
// Регистрация нужных ECharts-компонентов (идемпотентно —
// host Superset уже делает use(...) со всеми компонентами, но
// для standalone Storybook нужно продублировать).
use([
    PieChart,
    CanvasRenderer,
    TooltipComponent,
    GraphicComponent,
    LegendComponent,
    LabelLayout,
]);
import { Global, css } from '@emotion/react';
import { LIGHT_TOKENS, DARK_TOKENS } from './themeTokens';
import { Breadcrumb, Card, CardHead, ChartCanvas, ChartWrap, Controls, EmptyOverlay, ErrorOverlay, Footer, HeaderText, Hint, KEYFRAMES_CSS, Legend, LegendChip, PartialChip, SkeletonOverlay, StaleBadge, StructureDonutRoot, Title, UnitToggle, } from './styles';
import { buildOption, getCurrentItems, } from './utils/buildOption';
import { fmtRub } from './utils/formatRussian';
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
    return (_jsx("svg", { viewBox: "0 0 16 16", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { d: "M3 2 L3 13 L6 10 L8 14 L10 13 L8 9 L12 9 Z" }) }));
}
function IconDrill() {
    return (_jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M3 8 L13 8 M9 4 L13 8 L9 12" }) }));
}
function IconBack() {
    return (_jsx("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M10 3 L5 8 L10 13" }) }));
}
function StructureDonut(props) {
    const { width, height, headerText, subtitleText, dataState, errorMessage, categories, hasSubcategories, totalRevenue, padAngle, borderRadius, showOuterLabelsPct, isDarkMode, } = props;
    // ── Локальное состояние ──
    const [unit, setUnit] = useState('rub');
    const [level, setLevel] = useState('root');
    const [drilledId, setDrilledId] = useState(null);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [hidden, setHidden] = useState(new Set());
    // Сброс состояния при полной замене данных (другая выборка, другие категории)
    const categoriesKey = useMemo(() => categories.map((c) => c.id).join('|'), [categories]);
    useEffect(() => {
        setLevel('root');
        setDrilledId(null);
        setSelectedIdx(null);
        setHidden(new Set());
    }, [categoriesKey]);
    // Токены по теме
    const tokens = isDarkMode ? DARK_TOKENS : LIGHT_TOKENS;
    // ── ECharts init + resize ──
    const chartDivRef = useRef(null);
    const chartRef = useRef(null);
    useEffect(() => {
        const el = chartDivRef.current;
        if (!el)
            return;
        const instance = init(el);
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
    useEffect(() => {
        chartRef.current?.resize();
    }, [width, height]);
    // ── ECharts click handlers ──
    useEffect(() => {
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
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart)
            return;
        if (dataState === 'loading' || dataState === 'empty' || dataState === 'error')
            return;
        const option = buildOption({
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
    useEffect(() => {
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
    const drillDown = useCallback((id) => {
        setLevel('drilled');
        setDrilledId(id);
        setSelectedIdx(null);
    }, []);
    const drillUp = useCallback(() => {
        setLevel('root');
        setDrilledId(null);
        setSelectedIdx(null);
    }, []);
    const clearSelection = useCallback(() => setSelectedIdx(null), []);
    // ── Текущий срез для легенды (вычисляется до toggleHidden — нужен в его closure) ──
    const currentItems = useMemo(() => getCurrentItems({ categories, level, drilledId, hidden }), [categories, level, drilledId, hidden]);
    const toggleHidden = useCallback((id) => {
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
    const breadcrumbContent = useMemo(() => {
        if (level === 'drilled') {
            const parent = categories.find((c) => c.id === drilledId);
            return (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "bc-back", onClick: drillUp, "aria-label": "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A \u043A\u043E\u0440\u043D\u044E", title: "\u041D\u0430\u0437\u0430\u0434 (Esc)", children: "\u25C2" }), _jsxs("span", { className: "bc-cur", children: ["\u0421\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u203A ", _jsx("span", { className: "bc-sel", children: parent?.name ?? '—' })] })] }));
        }
        if (selectedIdx == null) {
            return (_jsxs("span", { className: "bc-cur", children: ["\u0412\u0441\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u00B7 ", subtitleText] }));
        }
        const sel = currentItems[selectedIdx];
        if (!sel)
            return _jsxs("span", { className: "bc-cur", children: ["\u0412\u0441\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u00B7 ", subtitleText] });
        const canDrill = hasSubcategories && level === 'root';
        const parent = categories.find((c) => c.id === sel.id);
        const hasChildren = !!parent && parent.children.length > 0;
        return (_jsxs(_Fragment, { children: [_jsx("span", { className: "bc-cur", children: "\u0412\u044B\u0431\u0440\u0430\u043D\u043E:" }), _jsx("span", { className: "bc-sel", children: sel.name }), canDrill && hasChildren && (_jsx("button", { type: "button", className: "bc-fwd", onClick: () => drillDown(sel.id), "aria-label": "\u0420\u0430\u0441\u043A\u0440\u044B\u0442\u044C \u043F\u043E\u0434\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438", title: "\u0412\u0433\u043B\u0443\u0431\u044C", children: "\u2192 \u0432\u0433\u043B\u0443\u0431\u044C" })), _jsx("button", { type: "button", className: "bc-back", onClick: clearSelection, "aria-label": "\u0421\u043D\u044F\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435", title: "\u0421\u043D\u044F\u0442\u044C (Esc)", children: "\u25C2" })] }));
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
    const hintContent = useMemo(() => {
        if (level === 'drilled') {
            return (_jsxs("span", { className: "hi", children: [_jsx(IconBack, {}), _jsx("span", { children: "Esc \u2014 \u043D\u0430\u0437\u0430\u0434" })] }));
        }
        if (selectedIdx != null) {
            return (_jsxs(_Fragment, { children: [hasSubcategories && (_jsxs("span", { className: "hi", children: [_jsx(IconDrill, {}), _jsx("span", { children: "\u2192 \u0432\u0433\u043B\u0443\u0431\u044C \u2014 \u043F\u043E\u0434\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438" })] })), _jsxs("span", { className: "hi", children: [_jsx(IconBack, {}), _jsx("span", { children: "Esc \u2014 \u0441\u043D\u044F\u0442\u044C" })] })] }));
        }
        return (_jsxs("span", { className: "hi", children: [_jsx(IconClick, {}), _jsx("span", { children: "\u043A\u043B\u0438\u043A \u2014 \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E" })] }));
    }, [level, selectedIdx, hasSubcategories]);
    const showChart = dataState === 'populated' || dataState === 'partial' || dataState === 'stale';
    return (_jsxs(StructureDonutRoot, { "data-theme": isDarkMode ? 'dark' : 'light', width: width, height: height, children: [_jsx(Global, { styles: css `${KEYFRAMES_CSS}` }), _jsxs(Card, { role: "region", "aria-labelledby": "sd-title", children: [_jsxs(CardHead, { children: [_jsxs(Title, { children: [_jsx(HeaderText, { id: "sd-title", children: headerText }), _jsx(Breadcrumb, { children: breadcrumbContent }), dataState === 'partial' && (_jsx(PartialChip, { role: "status", "aria-live": "polite", children: "\u26A0 \u041F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u0435\u0440\u0432\u044B\u0435 500 \u0441\u0442\u0440\u043E\u043A" })), dataState === 'stale' && (_jsx(StaleBadge, { role: "status", "aria-live": "polite", children: "\u21BB \u0414\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 \u043A\u044D\u0448\u0430" }))] }), _jsx(Controls, { children: _jsxs(UnitToggle, { role: "radiogroup", "aria-label": "\u0415\u0434\u0438\u043D\u0438\u0446\u044B \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u044F", children: [_jsx("button", { type: "button", role: "radio", className: unit === 'rub' ? 'on' : '', "aria-checked": unit === 'rub', onClick: () => setUnit('rub'), title: "\u0412 \u0440\u0443\u0431\u043B\u044F\u0445", children: "\u20BD" }), _jsx("button", { type: "button", role: "radio", className: unit === 'pct' ? 'on' : '', "aria-checked": unit === 'pct', onClick: () => setUnit('pct'), title: "\u041F\u0440\u043E\u0446\u0435\u043D\u0442 \u043E\u0442 \u043E\u0431\u043E\u0440\u043E\u0442\u0430", children: "%" })] }) })] }), dataState === 'loading' && _jsx(SkeletonOverlay, { role: "status", "aria-label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430" }), dataState === 'empty' && (_jsx(EmptyOverlay, { role: "status", children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" })), dataState === 'error' && (_jsxs(ErrorOverlay, { role: "alert", children: [_jsx("div", { children: "\u26A0 \u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445" }), _jsx("div", { className: "sd-error-sub", children: errorMessage ?? 'Проверьте настройки запроса' })] })), showChart && (_jsx(ChartWrap, { children: _jsx(ChartCanvas, { ref: chartDivRef, role: "img", "aria-label": `Структура потерь: ${fmtRub(categories.reduce((s, c) => s + c.rub, 0))} по ${categories.length} категориям` }) })), _jsxs(Footer, { children: [_jsx(Legend, { role: "group", "aria-label": "\u041B\u0435\u0433\u0435\u043D\u0434\u0430", children: currentItems.map((it) => (_jsxs(LegendChip, { className: hidden.has(it.id) ? 'off' : '', tabIndex: 0, role: "button", "aria-pressed": !hidden.has(it.id), "aria-label": `${hidden.has(it.id) ? 'Показать' : 'Скрыть'} ${it.name}`, onClick: () => toggleHidden(it.id), onKeyDown: (e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            toggleHidden(it.id);
                                        }
                                    }, children: [_jsx("span", { className: "lg-dot", style: { background: it.color } }), _jsx("span", { className: "lg-l", children: it.name })] }, it.id))) }), _jsx(Hint, { children: hintContent })] })] })] }));
}
export default StructureDonut;
//# sourceMappingURL=StructureDonut.js.map