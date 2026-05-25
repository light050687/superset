import type { EChartsCoreOption } from 'echarts/core';
import { BuildOptionState, CategoryNode, SubcategoryNode } from '../types';
import { Tokens, FONTS } from '../themeTokens';
import { toRgba } from './toRgba';
import { fmtRub, fmtPct, fmtCnt, fmtPctOfRev } from './formatRussian';

/**
 * Минимальная форма CallbackDataParams от ECharts, которая нам нужна.
 * Полный тип `echarts` не экспортирует в public API; дублировать из
 * `echarts/types/dist/shared` нестабильно между мажорами.
 */
interface PieCallbackParams {
  data?: {
    _item?: DisplayItem;
    _idx?: number;
    value?: number;
  };
}

/**
 * Чистая функция: (state, tokens) → ECharts donut option.
 * Повторяет `buildOption()` из `ref/structure-donut-prototype.html` (строки 367–521)
 * с корректировками под Superset-рантайм (токены передаются из React, а не css var()).
 */

export interface DisplayItem {
  id: string;
  name: string;
  color: string;
  rub: number;
  count: number | null;
  hidden: boolean;
  origIdx: number;
}

/** Выбор видимого среза данных: root или drilled children */
export function getCurrentItems(
  state: Pick<BuildOptionState, 'categories' | 'level' | 'drilledId' | 'hidden'>,
): DisplayItem[] {
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
  if (!parent) return [];
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
export function applyChildShades(category: CategoryNode): void {
  const n = category.children.length;
  category.children.forEach((ch: SubcategoryNode, i: number) => {
    ch.color = toRgba(category.color, 1 - (i / Math.max(1, n)) * 0.55);
  });
}

/**
 * Hero-text для центра donut (рендерится HTML overlay'ем поверх canvas,
 * НЕ через ECharts graphic — позволяет использовать CSS Container Queries
 * --fs-hero (clamp 28-56px) как в KPI scorecard, вместо hardcoded fontSize.
 */
export interface HeroText {
  value: string;
  label: string;
}

export function computeHero(state: BuildOptionState): HeroText {
  const items = getCurrentItems(state);
  const visible = items.filter((i) => !i.hidden);
  const totalRub = visible.reduce((s, i) => s + i.rub, 0);
  const dec = typeof state.rubDecimals === 'number' ? state.rubDecimals : 2;
  const selected = state.selectedIdx != null ? items[state.selectedIdx] : undefined;
  if (selected && !selected.hidden) {
    return {
      value:
        state.unit === 'rub'
          ? fmtRub(selected.rub, dec)
          : fmtPctOfRev(selected.rub, state.totalRevenue, totalRub),
      label:
        state.unit === 'pct'
          ? `${selected.name.toUpperCase()} · ОТ ОБОРОТА`
          : selected.name.toUpperCase(),
    };
  }
  const base =
    state.level === 'drilled'
      ? state.categories.find((c) => c.id === state.drilledId)?.name.toUpperCase() ?? 'ВСЕГО'
      : 'ВСЕГО';
  return {
    value:
      state.unit === 'rub'
        ? fmtRub(totalRub, dec)
        : fmtPctOfRev(totalRub, state.totalRevenue, totalRub),
    label: state.unit === 'pct' ? `${base} · ОТ ОБОРОТА` : base,
  };
}

export function buildOption(args: {
  state: BuildOptionState;
  tokens: Tokens;
}): EChartsCoreOption {
  const { state, tokens: t } = args;
  const items = getCurrentItems(state);

  // Итоги видимых
  const visible = items.filter((i) => !i.hidden);
  const totalRub = visible.reduce((s, i) => s + i.rub, 0);

  const pieData = items.map((it) => {
    const isDimmed =
      state.selectedIdx != null && state.selectedIdx !== it.origIdx && !it.hidden;
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
    // ECharts animation полностью выключена — Plan D: visual reveal делается
    // через SVG overlay в DonutChartInner (см. RevealSvgOverlay в
    // StructureDonut.tsx). animationDurationUpdate: 0 + animation: false:
    //   - animation: false → нет initial animation cycle при mount
    //   - animationDurationUpdate: 0 → нет update animation при resize/
    //     setOption (на SPA-navigation Superset присылает обновлённые
    //     width/height через ParentSize → useLayoutEffect → resize() →
    //     ECharts по умолчанию играет update animation 300мс, что
    //     визуально выглядит как «второй expansion» после SVG reveal).
    // См. docs/debug/donut-animation.md (попытка №7).
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0,
    animationEasing: 'linear',
    animationEasingUpdate: 'linear',

    // graphic убран — hero-число рендерится HTML overlay'ем поверх canvas
    // (см. StructureDonut.tsx) с CSS-переменными --fs-hero/--fs-meta как
    // в KPI scorecard. Это даёт fluid sizing через Container Queries вместо
    // hardcoded fontSize.

    tooltip: {
      trigger: 'item',
      /* DS 2.1 §08 «Тултипы»: tooltip того же тона что Card surface
         (НЕ инверт). В light theme — white, в dark — dark. */
      backgroundColor: t.s,
      borderColor: 'rgba(128,128,128,0.25)',
      borderWidth: 1,
      padding: [8, 12, 8, 12],
      extraCssText:
        'pointer-events:none;border-radius:6px;border:1px solid #d4d8de;max-width:240px',
      textStyle: { color: t.ink, fontFamily: FONTS.text, fontSize: 11 },
      formatter: (p: PieCallbackParams): string => {
        const item = p?.data?._item;
        if (!item || item.hidden) return '';
        const total = totalRub || 1;
        const rubStr = fmtRub(item.rub);
        const pctStr = fmtPct((item.rub / total) * 100);
        const cntStr = item.count == null ? null : fmtCnt(item.count);
        const dot = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${item.color};margin-right:6px;vertical-align:middle"></span>`;
        const headerStyle = `font:700 13px ${FONTS.text};color:${t.ink};margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(128,128,128,0.25);line-height:1.3`;
        const rowStyle = `font-family:${FONTS.mono};line-height:1.5;display:flex;justify-content:space-between;gap:12px`;
        const labelStyle = `font-size:11px;font-weight:600;color:${t.g500};letter-spacing:0.06em;text-transform:uppercase`;
        const valueStyle = `font-size:12px;font-weight:600;color:${t.ink};font-variant-numeric:tabular-nums`;
        const cntLine = cntStr
          ? `<div style="${rowStyle}"><span style="${labelStyle}">Операций</span><span style="${valueStyle}">${cntStr}</span></div>`
          : '';
        return `
          <div style="${headerStyle}">${dot}${item.name}</div>
          <div style="${rowStyle}"><span style="${labelStyle}">Сумма</span><span style="${valueStyle}">${rubStr}</span></div>
          <div style="${rowStyle}"><span style="${labelStyle}">Доля</span><span style="${valueStyle}">${pctStr}</span></div>
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
        animationDuration: 0,
        animationDurationUpdate: 0,
        animationEasing: 'linear',
        animationEasingUpdate: 'linear',
        itemStyle: { borderRadius: state.borderRadius },
        label: {
          show: showOuterLabels,
          position: 'outside',
          overflow: 'truncate',
          formatter: (p: PieCallbackParams): string => {
            const item = p?.data?._item;
            if (!item || item.hidden) return '';
            return fmtPctOfRev(item.rub, state.totalRevenue, totalRub);
          },
          color: t.g500,
          fontFamily: FONTS.mono,
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
