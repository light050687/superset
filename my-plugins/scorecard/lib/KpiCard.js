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
const styles_1 = require("./styles");
const DetailModal_1 = __importDefault(require("./DetailModal"));
const InfoHint_1 = require("./components/InfoHint");
/* ── Counter animation ──────────────────────────────────────────────
 * The integer part of the hero value counts up from 0 → target.
 * Easing: cubic-bezier(.4,0,.2,1) ≈ easeOutQuart.
 * ────────────────────────────────────────────────────────────────── */
const COUNTER_DELAY_MS = 350;
function easeOutQuart(t) {
    return 1 - (1 - t) ** 4;
}
function counterDuration(target) {
    // Замедленная версия: пользователь попросил визуально мягче — DS 2.0
    // hard-cap всё ещё 0.9s; для маленьких чисел минимум 500мс.
    return Math.min(900, 500 + target * 20);
}
function parseHeroInt(value) {
    const m = value.match(/^(.*?)(\d+)([\s\S]*)$/);
    if (!m)
        return null;
    return { prefix: m[1], num: parseInt(m[2], 10), suffix: m[3] };
}
function useCountUp(target, duration, delay) {
    const [current, setCurrent] = (0, react_1.useState)(0);
    const raf = (0, react_1.useRef)(0);
    (0, react_1.useEffect)(() => {
        if (target <= 0) {
            setCurrent(target);
            return undefined;
        }
        const timer = window.setTimeout(() => {
            const start = performance.now();
            const tick = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                setCurrent(Math.round(target * easeOutQuart(progress)));
                if (progress < 1) {
                    raf.current = requestAnimationFrame(tick);
                }
            };
            raf.current = requestAnimationFrame(tick);
        }, delay);
        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(raf.current);
        };
    }, [target, duration, delay]);
    return current;
}
function AnimatedHero({ value, skipAnimation }) {
    const parsed = parseHeroInt(value);
    const target = parsed?.num ?? 0;
    const dur = skipAnimation ? 0 : counterDuration(target);
    const count = useCountUp(target, dur, skipAnimation ? 0 : COUNTER_DELAY_MS);
    if (!parsed || target === 0) {
        return (0, jsx_runtime_1.jsx)(styles_1.HeroValue, { children: value });
    }
    // When animation is skipped, show target directly
    if (skipAnimation) {
        return (0, jsx_runtime_1.jsx)(styles_1.HeroValue, { children: value });
    }
    return ((0, jsx_runtime_1.jsxs)(styles_1.HeroValue, { children: [parsed.prefix, count, parsed.suffix] }));
}
/* ── Toggle slide transition ─────────────────────────────────────── */
function layerStyle(visible, direction) {
    if (visible) {
        return { opacity: 1, transform: 'translateX(0)', pointerEvents: 'auto' };
    }
    const tx = direction === 'left' ? '-16px' : '16px';
    return { opacity: 0, transform: `translateX(${tx})`, pointerEvents: 'none' };
}
/* ── Sub-components ────────────────────────────────────────────── */
function ComparisonRow({ item, skipAnimation, }) {
    return ((0, jsx_runtime_1.jsxs)(styles_1.ComparisonItem, { children: [(0, jsx_runtime_1.jsx)(styles_1.ComparisonLabel, { children: item.label }), (0, jsx_runtime_1.jsx)(styles_1.ComparisonValue, { children: item.value }), (0, jsx_runtime_1.jsx)(styles_1.DeltaPill, { status: item.status, skipAnimation: skipAnimation, children: item.delta })] }));
}
function ViewContent({ view, skipAnimation, trailingInComparison, }) {
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(AnimatedHero, { value: view.value, skipAnimation: skipAnimation }), view.subtitle && (0, jsx_runtime_1.jsx)(styles_1.Subtitle, { children: view.subtitle }), view.comparisons.length > 0 && ((0, jsx_runtime_1.jsxs)(styles_1.ComparisonSection, { skipAnimation: skipAnimation, children: [view.comparisons.map((cmp, i) => ((0, jsx_runtime_1.jsx)(ComparisonRow, { item: cmp, skipAnimation: skipAnimation }, `${cmp.label}-${i}`))), trailingInComparison] }))] }));
}
/* ── Main component ────────────────────────────────────────────── */
/**
 * Shallow compare for React.memo — skip function props (formatters)
 * which are recreated on every transformProps call.
 * This prevents Superset's framework from triggering full re-renders.
 */
function arePropsEqual(prev, next) {
    // Compare all non-function props
    const keys = Object.keys(next);
    for (const key of keys) {
        if (typeof next[key] === 'function')
            continue; // skip formatters
        if (key === 'theme')
            continue; // theme object changes reference often
        if (prev[key] !== next[key])
            return false;
    }
    return true;
}
const KpiCardMemo = react_1.default.memo(function KpiCardInner({ width, height, headerText, dataState, modeCount, toggleLabelA, toggleLabelB, modeAView, modeBView, colorScheme1A, colorScheme1B, colorScheme2A, colorScheme2B, deltaFormat1A, deltaFormat2A, deltaFormat1B, deltaFormat2B, formatComp1A, formatComp2A, formatDelta1A, formatDelta2A, formatComp1B, formatComp2B, formatDelta1B, formatDelta2B, detailColFact, detailColComp1, detailColDelta1, detailColComp2, detailColDelta2, enableComp1, enableComp2, comp1Label, comp2Label, showDelta1, showDelta2, hierarchyLabelPrimary, hierarchyLabelSecondary, isDarkMode, detailQueryParams, 
// aggregationType removed — always SUM-based logic
formatValueA, formatValueB, formatDelta, detailTopN, detailPageSize, mockModeEnabled, mockPreset, mockCustomJson, }) {
    const [activeMode, setActiveMode] = (0, react_1.useState)('a');
    const [isModalOpen, setIsModalOpen] = (0, react_1.useState)(false);
    const [hasAnimated, setHasAnimated] = (0, react_1.useState)(false);
    const rootRef = (0, react_1.useRef)(null);
    // ── Hide Superset dashboard chart wrapper (title, background, shadow) ──
    // NOTE: Этот эффект СНАЧАЛА жил здесь как per-instance DOM manipulation
    // (inject <style>, переместить ⋮ через ref). После того как universal
    // CSS-reset был добавлен в DashboardBuilder.tsx (для всех ext-* плагинов
    // через :has(div[data-test-viz-type^='ext-'])), эта инжекция стала
    // дублировать работу — оба правила пытались позиционировать .header-controls,
    // что приводило к двум видимым «троеточиям» на разных позициях.
    // Оставляем только cleanup для уже existing __kpiDotsCleanup рефов
    // (старые DOM listeners из прошлых mount'ов), без новой DOM-манипуляции.
    // Keep the three-dot menu (⋮) accessible but hide title text and wrapper chrome
    (0, react_1.useEffect)(() => {
        const el = rootRef.current;
        if (!el)
            return;
        // Inject global CSS once for all KPI Card instances.
        // RESTORED: Юзер хочет dot-menu СНАРУЖИ Card (top:6 right:-6),
        // как было до коммита dee3b0d. Universal CSS в DashboardBuilder.tsx
        // теперь exclude'ит ext-kpi-card из dot-menu правил, поэтому здесь
        // injected style снова рулит позиционированием для KPI индивидуально.
        const STYLE_ID = 'kpi-card-superset-wrapper-reset';
        if (!document.getElementById(STYLE_ID)) {
            const style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = `
        /* ── KPI Card: seamless dashboard integration ── */

        /* Remove background/shadow from ALL possible wrapper layers */
        div[data-test-viz-type="ext-kpi-card"],
        div[data-test-viz-type="ext-kpi-card"] .chart-container,
        div[data-test-viz-type="ext-kpi-card"] .dashboard-chart,
        div[data-test-viz-type="ext-kpi-card"] .chart-slice {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          overflow: visible !important;
        }

        /* Hide filter indicator badge — not needed on KPI cards */
        div[data-test-viz-type="ext-kpi-card"] .filter-counts {
          display: none !important;
        }

        /*
         * SliceHeader: height:0 + overflow:visible.
         * Superset measures headerHeight via offsetHeight which returns 0.
         * Dots button floats out via overflow:visible + position:absolute.
         */
        div[data-test-viz-type="ext-kpi-card"].chart-slice > div:first-child {
          height: 0 !important;
          min-height: 0 !important;
          max-height: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          overflow: visible !important;
          pointer-events: none !important;
        }

        /* chart-slice (SliceContainer): fill holder */
        div[data-test-viz-type="ext-kpi-card"].chart-slice {
          position: relative !important;
          overflow: visible !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* dashboard-chart wrapper: no extra spacing */
        div[data-test-viz-type="ext-kpi-card"] .dashboard-chart {
          overflow: visible !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Parent holder — transparent, no padding so card touches grid border */
        .dashboard-component-chart-holder:has(div[data-test-viz-type="ext-kpi-card"]),
        [data-test="dashboard-component-chart-holder"]:has(div[data-test-viz-type="ext-kpi-card"]) {
          background: transparent !important;
          box-shadow: none !important;
          overflow: visible !important;
          padding: 0 !important;
        }

        /* Ensure chart fills container edge-to-edge */
        div[data-test-viz-type="ext-kpi-card"] .slice-container {
          padding: 0 !important;
          margin: 0 !important;
        }
        div[data-test-viz-type="ext-kpi-card"] .superset-legacy-chart,
        div[data-test-viz-type="ext-kpi-card"] .chart-container > div {
          width: 100% !important;
          height: 100% !important;
        }
      `;
            document.head.appendChild(style);
        }
        // Fallback: direct DOM manipulation for browsers without :has()
        const chartSlice = el.closest('.chart-slice');
        if (chartSlice) {
            chartSlice.style.position = 'relative';
            chartSlice.style.overflow = 'visible';
            chartSlice.style.background = 'transparent';
            chartSlice.style.boxShadow = 'none';
            chartSlice.style.border = 'none';
            chartSlice.style.padding = '0';
            chartSlice.style.margin = '0';
            // SliceHeader: find dots button FIRST (before hiding), then hide.
            const header = chartSlice.querySelector(':scope > div:first-child');
            if (header) {
                // Find dots button BEFORE hiding
                const dotsBtn = header.querySelector('.ant-dropdown-trigger');
                // Hide header title but keep it in DOM flow at height 0
                // so React events still work on the dots button
                header.style.cssText = [
                    'height: 0 !important',
                    'min-height: 0 !important',
                    'max-height: 0 !important',
                    'padding: 0 !important',
                    'margin: 0 !important',
                    'border: none !important',
                    'overflow: visible !important',
                    'background: transparent !important',
                    'position: relative !important',
                    'pointer-events: none !important',
                ].join(';');
                // Hide all children
                Array.from(header.children).forEach(child => {
                    child.style.cssText = 'visibility:hidden!important;pointer-events:none!important;height:0!important;overflow:hidden!important;';
                });
                // Троеточие (dotsBtn) теперь скрыто глобально через
                // SliceHeaderControls visibility:hidden — RadialMenu по правому
                // клику заменяет его. Не показываем dots поверх KPI карточки,
                // чтобы поведение совпадало с остальными плагинами.
            }
            // Dashboard chart wrapper — stretch to fill holder height
            const dashChart = chartSlice.querySelector('.dashboard-chart');
            if (dashChart) {
                dashChart.style.overflow = 'visible';
                dashChart.style.background = 'transparent';
                dashChart.style.height = '100%';
            }
            // chart-container + slice_container + inner wrappers — full height chain
            const chartContainer = chartSlice.querySelector('.chart-container');
            if (chartContainer) {
                chartContainer.style.height = '100%';
                // Traverse inner divs to ensure height propagates to KpiCardRoot
                let inner = chartContainer;
                for (let depth = 0; depth < 4; depth++) {
                    const child = inner.querySelector(':scope > div');
                    if (!child)
                        break;
                    child.style.height = '100%';
                    inner = child;
                }
            }
        }
        // Parent holder — transparent, no padding, full height for card alignment
        const holder = el.closest('.dashboard-component-chart-holder');
        if (holder) {
            holder.style.cssText += ';background:transparent!important;box-shadow:none!important;overflow:visible!important;padding:0!important;';
        }
    }, []);
    // Disable entrance animations after initial render completes
    (0, react_1.useEffect)(() => {
        /* 1700ms покрывает весь каскад: kpi-card-in 0.85s + delta-pill delay
           0.95s + duration 0.6s = ~1.55s. Плюс buffer 150мс. */
        const timer = window.setTimeout(() => setHasAnimated(true), 1700);
        return () => clearTimeout(timer);
    }, []);
    const isA = activeMode === 'a';
    const isDual = modeCount === 'dual';
    const isPartial = dataState === 'partial';
    const isStale = dataState === 'stale';
    // ── Loading state — skeleton placeholder ──
    if (dataState === 'loading') {
        return ((0, jsx_runtime_1.jsxs)(styles_1.KpiCardRoot, { ref: rootRef, width: width, height: height, "data-theme": isDarkMode ? 'dark' : 'light', role: "figure", "aria-label": `${headerText}: загрузка`, "aria-busy": "true", children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { className: styles_1.CARD_CLASS, children: [(0, jsx_runtime_1.jsx)(styles_1.CardHead, { children: (0, jsx_runtime_1.jsx)(styles_1.CardTitle, { children: (0, jsx_runtime_1.jsx)(styles_1.SkeletonText, { children: '      ' }) }) }), (0, jsx_runtime_1.jsx)(styles_1.DataContainer, { children: (0, jsx_runtime_1.jsxs)(styles_1.DataLayer, { children: [(0, jsx_runtime_1.jsx)(styles_1.HeroValue, { children: (0, jsx_runtime_1.jsx)(styles_1.SkeletonText, { children: '—————' }) }), (0, jsx_runtime_1.jsx)(styles_1.Subtitle, { children: (0, jsx_runtime_1.jsx)(styles_1.SkeletonText, { children: '——————————' }) }), (0, jsx_runtime_1.jsx)(styles_1.ComparisonSection, { skipAnimation: true, children: (0, jsx_runtime_1.jsxs)(styles_1.ComparisonItem, { children: [(0, jsx_runtime_1.jsx)(styles_1.ComparisonLabel, { children: (0, jsx_runtime_1.jsx)(styles_1.SkeletonText, { children: '———' }) }), (0, jsx_runtime_1.jsx)(styles_1.ComparisonValue, { children: (0, jsx_runtime_1.jsx)(styles_1.SkeletonText, { children: '—————' }) }), (0, jsx_runtime_1.jsx)(styles_1.DeltaPill, { status: "neutral", skipAnimation: true, children: (0, jsx_runtime_1.jsx)(styles_1.SkeletonText, { children: '————' }) })] }) })] }) })] })] }));
    }
    // ── Error state — query or render failure ──
    if (dataState === 'error') {
        return ((0, jsx_runtime_1.jsxs)(styles_1.KpiCardRoot, { ref: rootRef, width: width, height: height, "data-theme": isDarkMode ? 'dark' : 'light', role: "figure", "aria-label": `${headerText}: ошибка`, children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { className: styles_1.CARD_CLASS, children: [(0, jsx_runtime_1.jsx)(styles_1.CardHead, { children: (0, jsx_runtime_1.jsx)(styles_1.CardTitle, { children: headerText }) }), (0, jsx_runtime_1.jsxs)(styles_1.EmptyStateWrap, { children: [(0, jsx_runtime_1.jsx)(styles_1.ErrorStateIcon, { "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)(styles_1.EmptyStateText, { children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445" })] })] })] }));
    }
    // ── Empty state — no data available ──
    if (dataState === 'empty') {
        return ((0, jsx_runtime_1.jsx)(styles_1.KpiCardRoot, { ref: rootRef, width: width, height: height, "data-theme": isDarkMode ? 'dark' : 'light', role: "figure", "aria-label": `${headerText}: нет данных`, children: (0, jsx_runtime_1.jsxs)(styles_1.Card, { className: styles_1.CARD_CLASS, children: [(0, jsx_runtime_1.jsx)(styles_1.CardHead, { children: (0, jsx_runtime_1.jsx)(styles_1.CardTitle, { children: headerText }) }), (0, jsx_runtime_1.jsxs)(styles_1.EmptyStateWrap, { children: [(0, jsx_runtime_1.jsx)(styles_1.EmptyStateIcon, { "aria-hidden": "true", children: "\u2014" }), (0, jsx_runtime_1.jsx)(styles_1.EmptyStateText, { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" })] })] }) }));
    }
    const hasGroupby = Boolean(detailQueryParams?.groupbyPrimary);
    // Filter comparisons, override labels, apply colorScheme inversion
    const processView = (view, scheme1, scheme2, fmtDelta1, fmtDelta2) => ({
        ...view,
        comparisons: view.comparisons
            .filter(cmp => {
            if (cmp.type === 'comp1' && !enableComp1)
                return false;
            if (cmp.type === 'comp2' && !enableComp2)
                return false;
            return true;
        })
            .map(cmp => {
            // Override labels with user-configured values
            let { label, delta } = cmp;
            if (cmp.type === 'comp1')
                label = comp1Label;
            if (cmp.type === 'comp2')
                label = comp2Label;
            // Hide delta pill if showDelta is false for this comparison
            const isDeltaVisible = cmp.type === 'comp2' ? showDelta2 : showDelta1;
            if (!isDeltaVisible) {
                return { ...cmp, label, delta: '', status: 'neutral' };
            }
            // Re-format delta from raw values using per-value formatter
            if (cmp.rawDiff != null) {
                const fmt = cmp.type === 'comp2' ? fmtDelta2 : fmtDelta1;
                delta = fmt(cmp.rawDiff);
            }
            // Apply per-comparison colorScheme
            const scheme = cmp.type === 'comp2' ? scheme2 : scheme1;
            if (scheme === 'green_up')
                return { ...cmp, label, delta };
            // green_down: growth is bad → invert up ↔ dn
            const inverted = cmp.status === 'up' ? 'dn' : cmp.status === 'dn' ? 'up' : cmp.status;
            return { ...cmp, label, delta, status: inverted };
        }),
    });
    const viewA = (0, react_1.useMemo)(() => processView(modeAView, colorScheme1A, colorScheme2A, formatDelta1A, formatDelta2A), [modeAView, colorScheme1A, colorScheme2A, deltaFormat1A, deltaFormat2A,
        formatValueA, formatDelta1A, formatDelta2A, enableComp1, enableComp2,
        comp1Label, comp2Label, showDelta1, showDelta2]);
    const viewB = (0, react_1.useMemo)(() => processView(modeBView, colorScheme1B, colorScheme2B, formatDelta1B, formatDelta2B), [modeBView, colorScheme1B, colorScheme2B, deltaFormat1B, deltaFormat2B,
        formatValueB, formatDelta1B, formatDelta2B, enableComp1, enableComp2,
        comp1Label, comp2Label, showDelta1, showDelta2]);
    // Detail modal only available when active mode has data
    const activeView = isA ? viewA : viewB;
    const activeModeEmpty = activeView.value === '' && activeView.comparisons.length === 0;
    const hasDetail = (hasGroupby && !activeModeEmpty) || mockModeEnabled;
    /* i-иконка передаётся в активный ViewContent как trailingInComparison,
       чтобы оказаться в той же flex-row что и ComparisonRow'ы (визуальное
       выравнивание справа на одной линии с "ПЛАН: ... / ПГ: ..."). */
    const hintCorner = ((0, jsx_runtime_1.jsx)(InfoHint_1.InfoHintCorner, { children: (0, jsx_runtime_1.jsxs)(InfoHint_1.InfoHint, { ariaLabel: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043F\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044E", children: [hasDetail && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "hi", children: (0, jsx_runtime_1.jsx)("span", { children: "Click \u2014 \u0434\u0435\u0442\u0430\u043B\u0438" }) }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" })] })), isDual && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { className: "hi", children: (0, jsx_runtime_1.jsxs)("span", { children: [toggleLabelA, " / ", toggleLabelB, " \u2014 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u044C"] }) }), (0, jsx_runtime_1.jsx)("span", { className: "hi-sep", "aria-hidden": "true" })] })), (0, jsx_runtime_1.jsx)("span", { className: "hi", children: (0, jsx_runtime_1.jsx)("span", { children: "Right Click \u2014 \u043C\u0435\u043D\u044E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439" }) })] }) }));
    return ((0, jsx_runtime_1.jsxs)(styles_1.KpiCardRoot, { ref: rootRef, width: width, height: height, "data-theme": isDarkMode ? 'dark' : 'light', role: "figure", "aria-label": `${headerText}: ${modeAView.value}`, children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { className: styles_1.CARD_CLASS, clickable: hasDetail, onClick: hasDetail ? () => setIsModalOpen(true) : undefined, "data-info-hint-container": "", children: [isStale && (0, jsx_runtime_1.jsx)(styles_1.RefreshBar, {}), (0, jsx_runtime_1.jsxs)(styles_1.CardHead, { children: [(0, jsx_runtime_1.jsxs)(styles_1.CardTitle, { children: [headerText, mockModeEnabled && (0, jsx_runtime_1.jsx)(styles_1.MockBadge, { children: "\u0422\u0415\u0421\u0422" })] }), isPartial && (0, jsx_runtime_1.jsx)(styles_1.PartialBadge, { children: "\u0427\u0430\u0441\u0442\u0438\u0447\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435" }), isDual && ((0, jsx_runtime_1.jsxs)(styles_1.ToggleGroup, { role: "tablist", "aria-label": "Toggle mode A / B", children: [(0, jsx_runtime_1.jsx)(styles_1.ToggleButton, { active: isA, role: "tab", "aria-selected": isA, onClick: e => {
                                            e.stopPropagation();
                                            setActiveMode('a');
                                        }, children: toggleLabelA }), (0, jsx_runtime_1.jsx)(styles_1.ToggleButton, { active: !isA, role: "tab", "aria-selected": !isA, onClick: e => {
                                            e.stopPropagation();
                                            setActiveMode('b');
                                        }, children: toggleLabelB })] }))] }), (0, jsx_runtime_1.jsxs)(styles_1.DataContainer, { children: [(0, jsx_runtime_1.jsx)(styles_1.DataLayer, { style: layerStyle(isA, 'left'), "aria-hidden": !isA, children: viewA.value ? ((0, jsx_runtime_1.jsx)(ViewContent, { view: viewA, skipAnimation: hasAnimated, trailingInComparison: isA ? hintCorner : null })) : ((0, jsx_runtime_1.jsxs)(styles_1.EmptyStateWrap, { children: [(0, jsx_runtime_1.jsx)(styles_1.EmptyStateIcon, { "aria-hidden": "true", children: "\u2014" }), (0, jsx_runtime_1.jsx)(styles_1.EmptyStateText, { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" })] })) }), isDual && ((0, jsx_runtime_1.jsx)(styles_1.DataLayer, { style: layerStyle(!isA, 'right'), "aria-hidden": isA, children: viewB.value ? ((0, jsx_runtime_1.jsx)(ViewContent, { view: viewB, skipAnimation: hasAnimated, trailingInComparison: !isA ? hintCorner : null })) : ((0, jsx_runtime_1.jsxs)(styles_1.EmptyStateWrap, { children: [(0, jsx_runtime_1.jsx)(styles_1.EmptyStateIcon, { "aria-hidden": "true", children: "\u2014" }), (0, jsx_runtime_1.jsx)(styles_1.EmptyStateText, { children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" })] })) }))] })] }), hasDetail && detailQueryParams && ((0, jsx_runtime_1.jsx)(DetailModal_1.default, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: headerText, headerValue: isA ? viewA.value : viewB.value, queryParams: detailQueryParams, activeMode: activeMode, aggregationType: 'SUM', colorScheme1: isA ? colorScheme1A : colorScheme1B, colorScheme2: isA ? colorScheme2A : colorScheme2B, deltaFormat1: isA ? deltaFormat1A : deltaFormat1B, deltaFormat2: isA ? deltaFormat2A : deltaFormat2B, formatValue: isA ? formatValueA : formatValueB, formatDelta: formatDelta, formatComp1: isA ? formatComp1A : formatComp1B, formatComp2: isA ? formatComp2A : formatComp2B, formatDelta1: isA ? formatDelta1A : formatDelta1B, formatDelta2: isA ? formatDelta2A : formatDelta2B, showDelta1: showDelta1, showDelta2: showDelta2, colFact: detailColFact, colComp1: detailColComp1, colDelta1: detailColDelta1, colComp2: detailColComp2, colDelta2: detailColDelta2, hierarchyLabelPrimary: hierarchyLabelPrimary, hierarchyLabelSecondary: hierarchyLabelSecondary, enableComp1: enableComp1, enableComp2: enableComp2, comp1Label: comp1Label, comp2Label: comp2Label, topN: detailTopN, pageSize: detailPageSize, isDarkMode: isDarkMode, mockModeEnabled: mockModeEnabled, mockPreset: mockPreset, mockCustomJson: mockCustomJson }))] }));
}, arePropsEqual);
class KpiCardErrorBoundary extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        // eslint-disable-next-line no-console
        console.error('[KPI Card] Render error:', error, info.componentStack);
    }
    render() {
        if (this.state.hasError) {
            const { width, height, headerText } = this.props;
            return ((0, jsx_runtime_1.jsxs)(styles_1.KpiCardRoot, { width: width, height: height, "data-theme": "light", role: "figure", "aria-label": `${headerText}: ошибка`, children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: styles_1.KEYFRAMES_CSS } }), (0, jsx_runtime_1.jsxs)(styles_1.Card, { className: styles_1.CARD_CLASS, children: [(0, jsx_runtime_1.jsx)(styles_1.CardHead, { children: (0, jsx_runtime_1.jsx)(styles_1.CardTitle, { children: headerText || 'KPI' }) }), (0, jsx_runtime_1.jsxs)(styles_1.EmptyStateWrap, { children: [(0, jsx_runtime_1.jsx)(styles_1.ErrorStateIcon, { "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)(styles_1.EmptyStateText, { children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F" })] })] })] }));
        }
        return (0, jsx_runtime_1.jsx)(KpiCardMemo, { ...this.props });
    }
}
// Superset expects a plain FunctionComponent, not MemoExoticComponent.
// ErrorBoundary wraps the memoized component to catch render crashes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const KpiCard = KpiCardErrorBoundary;
exports.default = KpiCard;
//# sourceMappingURL=KpiCard.js.map