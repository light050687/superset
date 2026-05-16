"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentItems = getCurrentItems;
exports.applyChildShades = applyChildShades;
exports.computeHero = computeHero;
exports.buildOption = buildOption;
const themeTokens_1 = require("../themeTokens");
const toRgba_1 = require("./toRgba");
const formatRussian_1 = require("./formatRussian");
/** Выбор видимого среза данных: root или drilled children */
function getCurrentItems(state) {
    if (state.level === 'root') {
        return state.categories.map((c, i) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            rub: c.rub,
            count: c.count,
            hidden: state.hidden.has(c.id),
            origIdx: i,
        }));
    }
    const parent = state.categories.find((c) => c.id === state.drilledId);
    if (!parent)
        return [];
    return parent.children.map((ch, i) => ({
        id: ch.id,
        name: ch.name,
        color: ch.color,
        rub: ch.rub,
        count: ch.count,
        hidden: state.hidden.has(ch.id),
        origIdx: i,
    }));
}
/**
 * Шейды детей вычисляются на основе цвета родителя: альфа от 1.0 до 0.45.
 * Вызывается из transformProps после того, как родительские цвета уже резолвлены.
 */
function applyChildShades(category) {
    const n = category.children.length;
    category.children.forEach((ch, i) => {
        ch.color = (0, toRgba_1.toRgba)(category.color, 1 - (i / Math.max(1, n)) * 0.55);
    });
}
function computeHero(state) {
    const items = getCurrentItems(state);
    const visible = items.filter((i) => !i.hidden);
    const totalRub = visible.reduce((s, i) => s + i.rub, 0);
    const dec = typeof state.rubDecimals === 'number' ? state.rubDecimals : 2;
    const selected = state.selectedIdx != null ? items[state.selectedIdx] : undefined;
    if (selected && !selected.hidden) {
        return {
            value: state.unit === 'rub'
                ? (0, formatRussian_1.fmtRub)(selected.rub, dec)
                : (0, formatRussian_1.fmtPctOfRev)(selected.rub, state.totalRevenue, totalRub),
            label: state.unit === 'pct'
                ? `${selected.name.toUpperCase()} · ОТ ОБОРОТА`
                : selected.name.toUpperCase(),
        };
    }
    const base = state.level === 'drilled'
        ? state.categories.find((c) => c.id === state.drilledId)?.name.toUpperCase() ?? 'ВСЕГО'
        : 'ВСЕГО';
    return {
        value: state.unit === 'rub'
            ? (0, formatRussian_1.fmtRub)(totalRub, dec)
            : (0, formatRussian_1.fmtPctOfRev)(totalRub, state.totalRevenue, totalRub),
        label: state.unit === 'pct' ? `${base} · ОТ ОБОРОТА` : base,
    };
}
function buildOption(args) {
    const { state, tokens: t } = args;
    const items = getCurrentItems(state);
    // Итоги видимых
    const visible = items.filter((i) => !i.hidden);
    const totalRub = visible.reduce((s, i) => s + i.rub, 0);
    const pieData = items.map((it) => {
        const isDimmed = state.selectedIdx != null && state.selectedIdx !== it.origIdx && !it.hidden;
        return {
            name: it.name,
            value: it.hidden ? 0 : it.rub,
            itemStyle: {
                color: it.hidden ? 'transparent' : it.color,
                opacity: isDimmed ? 0.28 : 1,
                borderColor: t.s,
                borderWidth: 2,
                borderRadius: state.borderRadius,
            },
            label: { show: false },
            _item: it,
            _idx: it.origIdx,
        };
    });
    const showOuterLabels = state.unit === 'pct' && state.showOuterLabelsPct;
    /* Note: prefers-reduced-motion check здесь убран. Windows 11 имеет
       system setting «Animation effects» default OFF → reduce-motion
       matches → ECharts animation отключалась на большинстве систем.
       Также убрали @media (prefers-reduced-motion: reduce) rules из
       styles.ts и RadialMenu (см. debug doc entry 6 — root cause).
       Наши animations subtle (1s scale, 0.55s fade-in) — безопасны
       даже для motion-sensitive users. */
    return {
        // Длительности 1:1 с ref/structure-donut-prototype.html (init 450 / update 400).
        // animationThreshold:0 — не отключать animation для большого N (default 2000).
        animation: true,
        animationDuration: 450,
        animationEasing: 'cubicOut',
        animationDurationUpdate: 400,
        animationEasingUpdate: 'cubicInOut',
        animationThreshold: 0,
        // graphic убран — hero-число рендерится HTML overlay'ем поверх canvas
        // (см. StructureDonut.tsx) с CSS-переменными --fs-hero/--fs-meta как
        // в KPI scorecard. Это даёт fluid sizing через Container Queries вместо
        // hardcoded fontSize.
        tooltip: {
            trigger: 'item',
            backgroundColor: t.ink,
            borderColor: 'transparent',
            borderWidth: 0,
            padding: [8, 12, 9, 12],
            extraCssText: 'pointer-events:none;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.25);max-width:260px',
            textStyle: { color: t.s, fontFamily: themeTokens_1.FONTS.text, fontSize: 11 },
            formatter: (p) => {
                const item = p?.data?._item;
                if (!item || item.hidden)
                    return '';
                const total = totalRub || 1;
                const rubStr = (0, formatRussian_1.fmtRub)(item.rub);
                const pctStr = (0, formatRussian_1.fmtPct)((item.rub / total) * 100);
                const cntStr = item.count == null ? null : (0, formatRussian_1.fmtCnt)(item.count);
                const dot = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${item.color};margin-right:6px;vertical-align:middle"></span>`;
                const lineStyle = `font:500 11px ${themeTokens_1.FONTS.mono};color:${t.s};line-height:1.6;display:flex;justify-content:space-between;gap:14px`;
                const cntLine = cntStr
                    ? `<div style="${lineStyle}"><span>Операций</span><span style="font-variant-numeric:tabular-nums;font-weight:600">${cntStr}</span></div>`
                    : '';
                return `
          <div style="font:600 12px ${themeTokens_1.FONTS.text};color:${t.s};margin-bottom:4px">${dot}${item.name}</div>
          <div style="${lineStyle}"><span>Сумма</span><span style="font-variant-numeric:tabular-nums;font-weight:600">${rubStr}</span></div>
          <div style="${lineStyle}"><span>Доля</span><span style="font-variant-numeric:tabular-nums;font-weight:600">${pctStr}</span></div>
          ${cntLine}
        `;
            },
        },
        series: [
            {
                type: 'pie',
                radius: state.unit === 'pct' ? ['52%', '70%'] : ['62%', '80%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: true,
                startAngle: 90,
                padAngle: state.padAngle,
                // ECharts animation выключена — Plan D: reveal анимация
                // реализована через кастомный SVG overlay в StructureDonut.tsx
                // (RevealSvgOverlay). Pie появляется мгновенно в финальном виде
                // (final state ECharts canvas сразу готов). Поверх него SVG
                // overlay с stroke-dasharray анимацией сначала рисует sectors
                // последовательно, затем fade out → ECharts остаётся снизу
                // для tooltip/click/hover.
                animation: false,
                itemStyle: { borderRadius: state.borderRadius },
                label: {
                    show: showOuterLabels,
                    position: 'outside',
                    overflow: 'truncate',
                    formatter: (p) => {
                        const item = p?.data?._item;
                        if (!item || item.hidden)
                            return '';
                        return (0, formatRussian_1.fmtPctOfRev)(item.rub, state.totalRevenue, totalRub);
                    },
                    color: t.g500,
                    fontFamily: themeTokens_1.FONTS.mono,
                    fontSize: 10,
                    fontWeight: 600,
                    padding: [2, 0, 0, 0],
                },
                labelLine: {
                    show: showOuterLabels,
                    length: 10,
                    length2: 8,
                    smooth: false,
                    lineStyle: { color: t.g300, width: 1 },
                },
                emphasis: {
                    scale: true,
                    scaleSize: 6,
                    /* DS 2.0: тени убраны (юзер требование). При наведении только
                       scale-эффект, без shadowBlur/shadowColor. */
                    label: { show: showOuterLabels },
                },
                data: pieData,
            },
        ],
    };
}
//# sourceMappingURL=buildOption.js.map