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
const InfoHint_1 = require("./components/InfoHint");
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
function DonutChartInner({ width, height, dataState, categories, hasSubcategories, totalRevenue, padAngle, borderRadius, showOuterLabelsPct, rubDecimals, unit, level, drilledId, selectedIdx, hidden, tokens, ariaLabel, onSelect, onDrill, }) {
    const chartDivRef = (0, react_1.useRef)(null);
    const chartRef = (0, react_1.useRef)(null);
    const isFirstSetOptRef = (0, react_1.useRef)(true);
    // init useEffect: создаёт chart + ResizeObserver. Запускается раз при
    // mount этого компонента. На смену level/drilledId parent заменит key
    // → component unmount → cleanup dispose → fresh mount.
    (0, react_1.useEffect)(() => {
        const el = chartDivRef.current;
        if (!el) {
            console.debug('[donut] init: chartDivRef.current is null, skipping');
            return undefined;
        }
        console.debug('[donut] init: mounting ECharts', 'level=', level, 'drilledId=', drilledId, 'el dims=', el.clientWidth, 'x', el.clientHeight);
        const instance = (0, core_1.init)(el, null, { renderer: 'canvas' });
        chartRef.current = instance;
        /* Debug: log animation lifecycle events. */
        instance.on('finished', () => {
            console.debug('[donut] ECharts animation FINISHED');
        });
        instance.on('rendered', () => {
            console.debug('[donut] ECharts rendered (frame)');
        });
        const w0 = el.clientWidth;
        const h0 = el.clientHeight;
        if (w0 > 0 && h0 > 0) {
            instance.resize({ width: w0, height: h0 });
            console.debug('[donut] init: resize done', w0, 'x', h0);
        }
        else {
            console.warn('[donut] init: el has 0 dimensions, animation may not play');
        }
        let isFirstRO = true;
        let prevW = w0;
        let prevH = h0;
        let debounceId;
        const ro = new ResizeObserver(() => {
            if (isFirstRO) {
                isFirstRO = false;
                return;
            }
            if (debounceId !== undefined)
                cancelAnimationFrame(debounceId);
            debounceId = requestAnimationFrame(() => {
                const inst = chartRef.current;
                const elNow = chartDivRef.current;
                if (!inst || !elNow)
                    return;
                const w = elNow.clientWidth;
                const h = elNow.clientHeight;
                if (w <= 0 || h <= 0)
                    return;
                if (w === prevW && h === prevH)
                    return;
                prevW = w;
                prevH = h;
                inst.resize({ width: w, height: h });
            });
        });
        ro.observe(el);
        return () => {
            console.debug('[donut] cleanup: disposing ECharts instance', 'level=', level);
            if (debounceId !== undefined)
                cancelAnimationFrame(debounceId);
            ro.disconnect();
            instance.dispose();
            chartRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // re-resize при drag-resize карточки / fullscreen
    (0, react_1.useLayoutEffect)(() => {
        const el = chartDivRef.current;
        const inst = chartRef.current;
        if (!el || !inst)
            return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w > 0 && h > 0) {
            inst.resize({ width: w, height: h });
        }
    }, [width, height]);
    // Click handlers: select / drill (Ctrl+Click) / clear (empty space)
    (0, react_1.useEffect)(() => {
        const chart = chartRef.current;
        if (!chart)
            return undefined;
        const onClick = (params) => {
            const p = params;
            if (p.componentType !== 'series' || p.seriesType !== 'pie')
                return;
            const idx = p.data?._idx;
            if (idx == null)
                return;
            const native = p.event?.event;
            const isCtrl = !!native && (native.ctrlKey || native.metaKey);
            if (isCtrl) {
                const id = p.data?._item?.id;
                if (id != null && level === 'root') {
                    const parent = categories.find((c) => c.id === id);
                    if (parent && parent.children.length > 0) {
                        onDrill(id);
                        return;
                    }
                }
            }
            onSelect((prev) => (prev === idx ? null : idx));
        };
        const onZrClick = (e) => {
            if (e.target)
                return;
            onSelect((prev) => (prev != null ? null : prev));
        };
        chart.on('click', onClick);
        const zr = chart.getZr();
        zr.on('click', onZrClick);
        return () => {
            chart.off('click', onClick);
            zr.off('click', onZrClick);
        };
    }, [level, categories, onSelect, onDrill]);
    // setOption при изменении state/props. Первый вызов — notMerge=true.
    (0, react_1.useEffect)(() => {
        const chart = chartRef.current;
        if (!chart)
            return;
        if (dataState === 'loading' ||
            dataState === 'empty' ||
            dataState === 'error')
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
        console.debug('[donut] setOption', 'isFirst=', isFirstSetOptRef.current, 'level=', level, 'drilledId=', drilledId, 'sectors=', option.series?.[0]?.data?.length);
        chart.setOption(option, isFirstSetOptRef.current);
        isFirstSetOptRef.current = false;
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
    /* revealing — true пока идёт SVG reveal animation. ECharts canvas
       hidden through visibility:hidden, после animation flip → ECharts
       visible, SVG unmounts. Это предотвращает double-render (SVG +
       ECharts блюрят друг друга через alpha-blending в fade transition). */
    const [revealing, setRevealing] = (0, react_1.useState)(true);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(styles_1.ChartCanvas, { ref: chartDivRef, role: "img", "aria-label": ariaLabel, style: { visibility: revealing ? 'hidden' : 'visible' } }), revealing && ((0, jsx_runtime_1.jsx)(RevealSvgOverlay, { categories: categories, hidden: hidden, level: level, drilledId: drilledId, onComplete: () => setRevealing(false) }))] }));
}
function RevealSvgOverlay({ categories, hidden, level, drilledId, onComplete, }) {
    const svgRef = (0, react_1.useRef)(null);
    /* Compute sectors for visible categories in current level. */
    const items = (0, react_1.useMemo)(() => {
        if (level === 'drilled') {
            const parent = categories.find((c) => c.id === drilledId);
            const children = parent?.children ?? [];
            return children
                .filter((c) => !hidden.has(c.id))
                .map((c) => ({ id: c.id, color: c.color, rub: c.rub }));
        }
        return categories
            .filter((c) => !hidden.has(c.id))
            .map((c) => ({ id: c.id, color: c.color, rub: c.rub }));
    }, [categories, hidden, level, drilledId]);
    /* SVG geometry 1:1 с ECharts radius ['62%','80%']:
       - viewBox 200×200 centered at 100,100
       - outer radius 80 (=80% of viewBox half), inner 62 (=62%)
       - stroke center 71, stroke width 18 */
    const VB = 200;
    const CX = 100;
    const CY = 100;
    const OUTER_R = 80;
    const INNER_R = 62;
    const STROKE_R = (OUTER_R + INNER_R) / 2; // 71
    const STROKE_W = OUTER_R - INNER_R; // 18
    const CIRCUMFERENCE = 2 * Math.PI * STROKE_R;
    /* Gap между sectors (имитирует ECharts padAngle:1.5 + borderWidth:2).
       1.5deg в circumference units: (1.5/360) * C ≈ 1.86. */
    const GAP = (1.5 / 360) * CIRCUMFERENCE;
    const total = items.reduce((s, it) => s + it.rub, 0) || 1;
    const sectors = (0, react_1.useMemo)(() => {
        let accumulated = 0;
        return items.map((it) => {
            const fullLength = (it.rub / total) * CIRCUMFERENCE;
            const visibleLength = Math.max(0, fullLength - GAP);
            const offset = -accumulated - GAP / 2;
            accumulated += fullLength;
            return { ...it, length: visibleLength, offset };
        });
    }, [items, total, CIRCUMFERENCE, GAP]);
    /* Animation: Web Animation API per circle, stagger 80ms, 0.45s
       cubicOut (1:1 с мокапом ECharts animationDuration:450). После
       completion → onComplete callback → parent flip revealing=false →
       ECharts canvas appears, SVG unmounts (без fade overlap).
       Если sectors пустой — instant onComplete (ECharts должен показаться). */
    (0, react_1.useEffect)(() => {
        if (sectors.length === 0) {
            onComplete();
            return undefined;
        }
        if (!svgRef.current)
            return undefined;
        const circles = svgRef.current.querySelectorAll('.sector');
        const animations = [];
        circles.forEach((circle, i) => {
            const len = parseFloat(circle.dataset.length ?? '0');
            const anim = circle.animate([
                { strokeDasharray: `0 ${CIRCUMFERENCE}` },
                { strokeDasharray: `${len} ${CIRCUMFERENCE - len}` },
            ], {
                duration: 450,
                delay: i * 80,
                easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
                fill: 'forwards',
            });
            animations.push(anim);
        });
        /* Total time: last delay + duration. NB: no buffer — instant flip
           к ECharts экономит alpha-blend overlap. */
        const totalMs = (sectors.length - 1) * 80 + 450;
        const timer = window.setTimeout(onComplete, totalMs);
        return () => {
            window.clearTimeout(timer);
            animations.forEach((a) => a.cancel());
        };
    }, [sectors.length, CIRCUMFERENCE, onComplete]);
    if (sectors.length === 0)
        return null;
    return ((0, jsx_runtime_1.jsx)(styles_1.SvgOverlayWrapper, { "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("svg", { ref: svgRef, viewBox: `0 0 ${VB} ${VB}`, preserveAspectRatio: "xMidYMid meet", children: (0, jsx_runtime_1.jsx)("g", { transform: `rotate(-90 ${CX} ${CY})`, children: sectors.map((s) => ((0, jsx_runtime_1.jsx)("circle", { className: "sector", cx: CX, cy: CY, r: STROKE_R, fill: "none", stroke: s.color, strokeWidth: STROKE_W, strokeDasharray: `0 ${CIRCUMFERENCE}`, strokeDashoffset: s.offset, "data-length": s.length }, s.id))) }) }) }));
}
function StructureDonut(props) {
    const { width, height, headerText, subtitleText, dataState, errorMessage, categories, hasSubcategories, totalRevenue, padAngle, borderRadius, showOuterLabelsPct, rubDecimals, isDarkMode, mockModeEnabled, } = props;
    // ── Локальное состояние ──
    const [unit, setUnit] = (0, react_1.useState)('rub');
    const [level, setLevel] = (0, react_1.useState)('root');
    const [drilledId, setDrilledId] = (0, react_1.useState)(null);
    const [selectedIdx, setSelectedIdx] = (0, react_1.useState)(null);
    const [hidden, setHidden] = (0, react_1.useState)(new Set());
    const infoHintRef = (0, react_1.useRef)(null);
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
    // Drill handler — bumped из ECharts click через DonutChartInner callback.
    const handleDrill = (0, react_1.useCallback)((id) => {
        setLevel('drilled');
        setDrilledId(id);
        setSelectedIdx(null);
    }, []);
    const donutAriaLabel = `Структура потерь: ${(0, formatRussian_1.fmtRub)(categories.reduce((s, c) => s + c.rub, 0))} по ${categories.length} категориям`;
    // ── Keyboard: Escape ──
    // InfoHint имеет свой Escape (closeOnEscape), но мы opt-out (closeOnEscape={false})
    // и проксируем через infoHintRef, чтобы сохранить приоритет: hint закрывается
    // раньше чем срабатывает return-to-root / clear-selection логика донат-чарта.
    // Tap-away для tooltip обрабатывается внутри InfoHint, дублировать не нужно.
    (0, react_1.useEffect)(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape')
                return;
            if (infoHintRef.current?.isOpen()) {
                infoHintRef.current.close();
                return;
            }
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
        /* Right-click hint показываем во всех 3 вариантах — это новая
           глобальная фича дашборда (radial menu вместо AntD Dropdown). */
        const rightClickHint = ((0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Right Click" }), " \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"] }));
        if (level === 'drilled') {
            // Drilled: «◂ или Esc — назад» (стрелка в breadcrumb тоже работает).
            // Символ ◂ обёрнут в .hi-arrow — крупнее остального текста (18px).
            return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)(IconBack, {}), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("kbd", { children: "\u25C2" }), " \u0438\u043B\u0438 ", (0, jsx_runtime_1.jsx)("kbd", { children: "Esc" }), " \u2014 \u043D\u0430\u0437\u0430\u0434"] })] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), rightClickHint] }));
        }
        if (selectedIdx != null) {
            // Selected (на root): подсказка про Ctrl+Click для drill'а.
            // Между хинтами — вертикальный разделитель .hi-sep (не SVG).
            return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [hasSubcategories && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Ctrl" }), "+", (0, jsx_runtime_1.jsx)("kbd", { children: "Click" }), " \u2014 \u0432\u0433\u043B\u0443\u0431\u044C"] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" })] })), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)(IconBack, {}), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Esc" }), " \u2014 \u0441\u043D\u044F\u0442\u044C"] })] }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), rightClickHint] }));
        }
        // Root, ничего не выбрано: дополнительно про Ctrl+Click.
        return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)(IconClick, {}), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("kbd", { children: "\u043A\u043B\u0438\u043A" }), " \u2014 \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E"] })] }), hasSubcategories && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("span", { className: "hi", children: [(0, jsx_runtime_1.jsx)("kbd", { children: "Ctrl" }), "+", (0, jsx_runtime_1.jsx)("kbd", { children: "Click" }), " \u2014 \u0432\u0433\u043B\u0443\u0431\u044C"] })] })), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" }), rightClickHint] }));
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
        return ((0, jsx_runtime_1.jsxs)(styles_1.StructureDonutRoot, { "data-theme": isDarkMode ? 'dark' : 'light', width: width, height: height, children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { role: "region", "aria-labelledby": "sd-title-loading", "aria-busy": "true", "data-no-anim": "", children: [(0, jsx_runtime_1.jsx)(styles_1.CardHead, { children: (0, jsx_runtime_1.jsx)(styles_1.Title, { children: (0, jsx_runtime_1.jsxs)(styles_1.HeaderText, { id: "sd-title-loading", children: [headerText, mockModeEnabled && (0, jsx_runtime_1.jsx)(styles_1.MockBadge, { children: "\u0422\u0415\u0421\u0422" })] }) }) }), (0, jsx_runtime_1.jsx)(styles_1.SkeletonOverlay, { role: "status", "aria-label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430" })] })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(styles_1.StructureDonutRoot, { "data-theme": isDarkMode ? 'dark' : 'light', width: width, height: height, children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { role: "region", "aria-labelledby": "sd-title", "data-info-hint-container": "", children: [(0, jsx_runtime_1.jsxs)(styles_1.CardHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.Title, { children: [(0, jsx_runtime_1.jsxs)(styles_1.HeaderText, { id: "sd-title", children: [headerText, mockModeEnabled && (0, jsx_runtime_1.jsx)(styles_1.MockBadge, { children: "\u0422\u0415\u0421\u0422" })] }), (0, jsx_runtime_1.jsx)(styles_1.Breadcrumb, { children: breadcrumbContent }), dataState === 'partial' && ((0, jsx_runtime_1.jsx)(styles_1.PartialChip, { role: "status", "aria-live": "polite", children: "\u26A0 \u041F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u0435\u0440\u0432\u044B\u0435 500 \u0441\u0442\u0440\u043E\u043A" })), dataState === 'stale' && ((0, jsx_runtime_1.jsx)(styles_1.StaleBadge, { role: "status", "aria-live": "polite", children: "\u21BB \u0414\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 \u043A\u044D\u0448\u0430" }))] }), (0, jsx_runtime_1.jsxs)(styles_1.Controls, { children: [(0, jsx_runtime_1.jsxs)(styles_1.UnitToggle, { role: "radiogroup", "aria-label": "\u0415\u0434\u0438\u043D\u0438\u0446\u044B \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u044F", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", role: "radio", className: unit === 'rub' ? 'on' : '', "aria-checked": unit === 'rub', onClick: () => setUnit('rub'), title: "\u0412 \u0440\u0443\u0431\u043B\u044F\u0445", children: "\u20BD" }), (0, jsx_runtime_1.jsx)("button", { type: "button", role: "radio", className: unit === 'pct' ? 'on' : '', "aria-checked": unit === 'pct', onClick: () => setUnit('pct'), title: "\u041F\u0440\u043E\u0446\u0435\u043D\u0442 \u043E\u0442 \u043E\u0431\u043E\u0440\u043E\u0442\u0430", children: "%" })] }), (0, jsx_runtime_1.jsx)(InfoHint_1.InfoHintTopRight, { children: (0, jsx_runtime_1.jsx)(InfoHint_1.InfoHint, { ref: infoHintRef, closeOnEscape: false, ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: hintContent }) })] })] }), dataState === 'empty' && ((0, jsx_runtime_1.jsx)(styles_1.EmptyOverlay, { role: "status", children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" })), dataState === 'error' && ((0, jsx_runtime_1.jsxs)(styles_1.ErrorOverlay, { role: "alert", children: [(0, jsx_runtime_1.jsx)("div", { children: "\u26A0 \u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445" }), (0, jsx_runtime_1.jsx)("div", { className: "sd-error-sub", children: errorMessage ?? 'Проверьте настройки запроса' })] })), showChart && (
                    /* key на ChartWrap → React unmount'ит весь ChartWrap (canvas +
                       hero) на drill/back → donutRevealKf CSS animation re-fires
                       на mount. Это Plan C из debug doc — guaranteed visible
                       expansion animation вместо нестабильной ECharts internal. */
                    (0, jsx_runtime_1.jsxs)(styles_1.ChartWrap, { children: [(0, jsx_runtime_1.jsx)(DonutChartInner, { width: width, height: height, dataState: dataState, categories: categories, hasSubcategories: hasSubcategories, totalRevenue: totalRevenue, padAngle: padAngle, borderRadius: borderRadius, showOuterLabelsPct: showOuterLabelsPct, rubDecimals: rubDecimals, unit: unit, level: level, drilledId: drilledId, selectedIdx: selectedIdx, hidden: hidden, tokens: tokens, ariaLabel: donutAriaLabel, onSelect: setSelectedIdx, onDrill: handleDrill }, `donut-${level}-${drilledId ?? 'root'}`), (0, jsx_runtime_1.jsx)(styles_1.HeroOverlay, { "aria-hidden": "true", children: (() => {
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
                                })() })] }, `chart-${level}-${drilledId ?? 'root'}`)), (0, jsx_runtime_1.jsx)(styles_1.Footer, { children: (0, jsx_runtime_1.jsx)(styles_1.Legend, { role: "group", "aria-label": "\u041B\u0435\u0433\u0435\u043D\u0434\u0430", children: currentItems.map((it) => ((0, jsx_runtime_1.jsxs)(styles_1.LegendChip, { className: hidden.has(it.id) ? 'off' : '', tabIndex: 0, role: "button", "aria-pressed": !hidden.has(it.id), "aria-label": `${hidden.has(it.id) ? 'Показать' : 'Скрыть'} ${it.name}`, onClick: () => toggleHidden(it.id), onKeyDown: (e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        toggleHidden(it.id);
                                    }
                                }, children: [(0, jsx_runtime_1.jsx)("span", { className: "lg-dot", style: { background: it.color } }), (0, jsx_runtime_1.jsx)("span", { className: "lg-l", children: it.name })] }, it.id))) }) })] })] }));
}
exports.default = StructureDonut;
//# sourceMappingURL=StructureDonut.js.map