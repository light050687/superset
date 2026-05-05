"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const core_1 = require("echarts/core");
const charts_1 = require("echarts/charts");
const components_1 = require("echarts/components");
const renderers_1 = require("echarts/renderers");
const features_1 = require("echarts/features");
(0, core_1.use)([
    charts_1.PieChart,
    renderers_1.CanvasRenderer,
    components_1.TooltipComponent,
    components_1.GraphicComponent,
    components_1.LegendComponent,
    features_1.LabelLayout,
]);
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
    const { width, height, headerText, subtitleText, dataState, errorMessage, categories, hasSubcategories, totalRevenue, padAngle, borderRadius, showOuterLabelsPct, rubDecimals, isDarkMode, mockModeEnabled, } = props;
    // ── Локальное состояние ──
    const [unit, setUnit] = (0, react_1.useState)('rub');
    const [level, setLevel] = (0, react_1.useState)('root');
    const [drilledId, setDrilledId] = (0, react_1.useState)(null);
    const [selectedIdx, setSelectedIdx] = (0, react_1.useState)(null);
    const [hidden, setHidden] = (0, react_1.useState)(new Set());
    /* Card mount animation теперь через emotion keyframes helper в
       styles.ts (см. cardInKf). Это canonical solution от emotion:
       keyframes гарантированно injected в stylesheet ДО commit'а Card.
       React-driven cardMounted+RAF подход больше не нужен. */
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
    /* resizeFromDom — мерим actual DOM container и явно передаём
       width/height в ECharts. props.width/height приходят от Chart.jsx
       и НЕ учитывают Card chrome (header + footer + padding внутри Card),
       поэтому canvas получался больше визуально доступного ChartWrap →
       центр donut'а смещался относительно видимой области.
       Используем clientWidth/clientHeight (= padded content area), а не
       getBoundingClientRect (включает border + padding). */
    const resizeFromDom = () => {
        const el = chartDivRef.current;
        const inst = chartRef.current;
        if (!el || !inst)
            return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w > 0 && h > 0) {
            inst.resize({ width: w, height: h });
        }
    };
    // init useEffect: создаёт chart instance + ResizeObserver на ChartCanvas
    // для синхронизации canvas с DOM на каждое изменение размера
    // (window resize, row stretch, drag handle).
    (0, react_1.useEffect)(() => {
        const el = chartDivRef.current;
        if (!el)
            return;
        const instance = (0, core_1.init)(el, null, { renderer: 'canvas' });
        chartRef.current = instance;
        /* Initial resize: defer через RAF чтобы flex layout завершился. */
        requestAnimationFrame(() => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            if (w > 0 && h > 0) {
                instance.resize({ width: w, height: h });
            }
        });
        /* ResizeObserver — следим за изменением размера контейнера
           (row stretch, drag handle, window resize, post-data flex re-layout).
           Debounce через RAF — против drill-down animation jitter
           (memory note: без RO drill анимация была интактной, но canvas
           не перерисовался при изменении размера ChartWrap'а через flex). */
        let debounceId;
        const ro = new ResizeObserver(() => {
            if (debounceId !== undefined)
                cancelAnimationFrame(debounceId);
            debounceId = requestAnimationFrame(() => {
                const inst = chartRef.current;
                const elNow = chartDivRef.current;
                if (!inst || !elNow)
                    return;
                const w = elNow.clientWidth;
                const h = elNow.clientHeight;
                if (w > 0 && h > 0) {
                    inst.resize({ width: w, height: h });
                }
            });
        });
        ro.observe(el);
        return () => {
            if (debounceId !== undefined)
                cancelAnimationFrame(debounceId);
            ro.disconnect();
            instance.dispose();
            chartRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    /* useLayoutEffect — re-resize при смене props.width/height (drag-resize
       в edit mode, fullscreen toggle). RO покрывает большинство случаев,
       но useLayoutEffect — fallback гарантия. */
    (0, react_1.useLayoutEffect)(() => {
        resizeFromDom();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            // Ctrl/Cmd + Click — drill down (на root level и если есть children).
            // Обычный click — toggle selection.
            const native = p.event?.event;
            const isCtrl = !!native && (native.ctrlKey || native.metaKey);
            if (isCtrl) {
                const id = p.data?._item?.id;
                if (id != null && level === 'root') {
                    const parent = categories.find((c) => c.id === id);
                    if (parent && parent.children.length > 0) {
                        setLevel('drilled');
                        setDrilledId(id);
                        setSelectedIdx(null);
                        return;
                    }
                }
            }
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
    }, [level, categories]);
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
                rubDecimals,
            },
            tokens,
        });
        // 1:1 с Superset host: setOption(opt, true). Без drill detection,
        // без chart.clear, без CSS hacks. ResizeObserver удалён → animation
        // не прерывается layout shifts при React re-render во время drill.
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
        rubDecimals,
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
        /* Кнопка «→ вглубь» удалена — drill теперь через Ctrl/Cmd + Click на
           сегменте donut'а. Кнопка ◂ тоже убрана — клик в любое пустое
           место donut'а уже снимает selection. */
        return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "bc-cur", children: "\u0412\u044B\u0431\u0440\u0430\u043D\u043E:" }), (0, jsx_runtime_1.jsx)("span", { className: "bc-sel", children: sel.name })] }));
    }, [
        level,
        drilledId,
        selectedIdx,
        currentItems,
        categories,
        subtitleText,
        drillUp,
    ]);
    // ── Hint rendering ──
    const hintContent = (0, react_1.useMemo)(() => {
        if (level === 'drilled') {
            // Drilled: «◂ или Esc — назад» (стрелка в breadcrumb тоже работает).
            // Символ ◂ обёрнут в .hi-arrow — крупнее остального текста (18px).
            return ((0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)(IconBack, {}), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("span", { className: "hi-arrow", "aria-hidden": "true", children: "\u25C2" }), " \u0438\u043B\u0438 Esc \u2014 \u043D\u0430\u0437\u0430\u0434"] })] }));
        }
        if (selectedIdx != null) {
            // Selected (на root): подсказка про Ctrl+Click для drill'а.
            // Между хинтами — вертикальный разделитель .hi-sep (не SVG).
            return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [hasSubcategories && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "hi", children: (0, jsx_runtime_1.jsx)("span", { children: "Ctrl+Click \u2014 \u0432\u0433\u043B\u0443\u0431\u044C" }) }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" })] })), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)(IconBack, {}), (0, jsx_runtime_1.jsx)("span", { children: "Esc \u2014 \u0441\u043D\u044F\u0442\u044C" })] })] }));
        }
        // Root, ничего не выбрано: дополнительно про Ctrl+Click.
        return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)(IconClick, {}), (0, jsx_runtime_1.jsx)("span", { children: "\u043A\u043B\u0438\u043A \u2014 \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E" })] }), hasSubcategories && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { className: "hi", children: (0, jsx_runtime_1.jsx)("span", { children: "Ctrl+Click \u2014 \u0432\u0433\u043B\u0443\u0431\u044C" }) })] }))] }));
    }, [level, selectedIdx, hasSubcategories]);
    const showChart = dataState === 'populated' || dataState === 'partial' || dataState === 'stale';
    /* Loading state — отдельный return со своим Card.
       При переходе loading → loaded React unmount'ит этот Card и
       mount'ит loaded Card в main return ниже. Animation cardInKf
       запускается на mount loaded Card → юзер видит её РОВНО когда
       данные пришли (а не во время скрытого loading state).
       Это 1:1 с подходом scorecard KpiCard.tsx где для каждого
       dataState (loading/error/empty/populated) свой return с своим
       Card — каждое появление контента сопровождается animation. */
    if (dataState === 'loading') {
        return ((0, jsx_runtime_1.jsxs)(styles_1.StructureDonutRoot, { "data-theme": isDarkMode ? 'dark' : 'light', width: width, height: height, children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { role: "region", "aria-labelledby": "sd-title-loading", "aria-busy": "true", children: [(0, jsx_runtime_1.jsx)(styles_1.CardHead, { children: (0, jsx_runtime_1.jsx)(styles_1.Title, { children: (0, jsx_runtime_1.jsxs)(styles_1.HeaderText, { id: "sd-title-loading", children: [headerText, mockModeEnabled && (0, jsx_runtime_1.jsx)(styles_1.MockBadge, { children: "\u0422\u0415\u0421\u0422" })] }) }) }), (0, jsx_runtime_1.jsx)(styles_1.SkeletonOverlay, { role: "status", "aria-label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430" })] })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(styles_1.StructureDonutRoot, { "data-theme": isDarkMode ? 'dark' : 'light', width: width, height: height, children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { role: "region", "aria-labelledby": "sd-title", children: [(0, jsx_runtime_1.jsxs)(styles_1.CardHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.Title, { children: [(0, jsx_runtime_1.jsxs)(styles_1.HeaderText, { id: "sd-title", children: [headerText, mockModeEnabled && (0, jsx_runtime_1.jsx)(styles_1.MockBadge, { children: "\u0422\u0415\u0421\u0422" })] }), (0, jsx_runtime_1.jsx)(styles_1.Breadcrumb, { children: breadcrumbContent }), dataState === 'partial' && ((0, jsx_runtime_1.jsx)(styles_1.PartialChip, { role: "status", "aria-live": "polite", children: "\u26A0 \u041F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u0435\u0440\u0432\u044B\u0435 500 \u0441\u0442\u0440\u043E\u043A" })), dataState === 'stale' && ((0, jsx_runtime_1.jsx)(styles_1.StaleBadge, { role: "status", "aria-live": "polite", children: "\u21BB \u0414\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 \u043A\u044D\u0448\u0430" }))] }), (0, jsx_runtime_1.jsx)(styles_1.Controls, { children: (0, jsx_runtime_1.jsxs)(styles_1.UnitToggle, { role: "radiogroup", "aria-label": "\u0415\u0434\u0438\u043D\u0438\u0446\u044B \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u044F", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", role: "radio", className: unit === 'rub' ? 'on' : '', "aria-checked": unit === 'rub', onClick: () => setUnit('rub'), title: "\u0412 \u0440\u0443\u0431\u043B\u044F\u0445", children: "\u20BD" }), (0, jsx_runtime_1.jsx)("button", { type: "button", role: "radio", className: unit === 'pct' ? 'on' : '', "aria-checked": unit === 'pct', onClick: () => setUnit('pct'), title: "\u041F\u0440\u043E\u0446\u0435\u043D\u0442 \u043E\u0442 \u043E\u0431\u043E\u0440\u043E\u0442\u0430", children: "%" })] }) })] }), dataState === 'empty' && ((0, jsx_runtime_1.jsx)(styles_1.EmptyOverlay, { role: "status", children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" })), dataState === 'error' && ((0, jsx_runtime_1.jsxs)(styles_1.ErrorOverlay, { role: "alert", children: [(0, jsx_runtime_1.jsx)("div", { children: "\u26A0 \u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445" }), (0, jsx_runtime_1.jsx)("div", { className: "sd-error-sub", children: errorMessage ?? 'Проверьте настройки запроса' })] })), showChart && ((0, jsx_runtime_1.jsxs)(styles_1.ChartWrap, { children: [(0, jsx_runtime_1.jsx)(styles_1.ChartCanvas, { ref: chartDivRef, role: "img", "aria-label": `Структура потерь: ${(0, formatRussian_1.fmtRub)(categories.reduce((s, c) => s + c.rub, 0))} по ${categories.length} категориям` }), (0, jsx_runtime_1.jsx)(styles_1.HeroOverlay, { "aria-hidden": "true", children: (() => {
                                    const h = (0, buildOption_1.computeHero)({
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
                                        rubDecimals,
                                    });
                                    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(styles_1.HeroValue, { children: h.value }), (0, jsx_runtime_1.jsx)(styles_1.HeroLabel, { children: h.label })] }));
                                })() })] })), (0, jsx_runtime_1.jsxs)(styles_1.Footer, { children: [(0, jsx_runtime_1.jsx)(styles_1.Legend, { role: "group", "aria-label": "\u041B\u0435\u0433\u0435\u043D\u0434\u0430", children: currentItems.map((it) => ((0, jsx_runtime_1.jsxs)(styles_1.LegendChip, { className: hidden.has(it.id) ? 'off' : '', tabIndex: 0, role: "button", "aria-pressed": !hidden.has(it.id), "aria-label": `${hidden.has(it.id) ? 'Показать' : 'Скрыть'} ${it.name}`, onClick: () => toggleHidden(it.id), onKeyDown: (e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            toggleHidden(it.id);
                                        }
                                    }, children: [(0, jsx_runtime_1.jsx)("span", { className: "lg-dot", style: { background: it.color } }), (0, jsx_runtime_1.jsx)("span", { className: "lg-l", children: it.name })] }, it.id))) }), (0, jsx_runtime_1.jsx)(styles_1.Hint, { children: hintContent })] })] })] }));
}
exports.default = StructureDonut;
//# sourceMappingURL=StructureDonut.js.map