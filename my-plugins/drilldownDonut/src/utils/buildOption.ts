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

export function buildOption(args: {
  state: BuildOptionState;
  tokens: Tokens;
}): EChartsCoreOption {
  const { state, tokens: t } = args;
  const items = getCurrentItems(state);

  // Итоги видимых
  const visible = items.filter((i) => !i.hidden);
  const totalRub = visible.reduce((s, i) => s + i.rub, 0);

  // Hero-число
  let heroValue: string;
  let heroLabel: string;
  const selected = state.selectedIdx != null ? items[state.selectedIdx] : undefined;
  if (selected && !selected.hidden) {
    heroValue =
      state.unit === 'rub'
        ? fmtRub(selected.rub)
        : fmtPctOfRev(selected.rub, state.totalRevenue, totalRub);
    heroLabel =
      state.unit === 'pct'
        ? `${selected.name.toUpperCase()} · ОТ ОБОРОТА`
        : selected.name.toUpperCase();
  } else {
    heroValue =
      state.unit === 'rub'
        ? fmtRub(totalRub)
        : fmtPctOfRev(totalRub, state.totalRevenue, totalRub);
    const base =
      state.level === 'drilled'
        ? state.categories.find((c) => c.id === state.drilledId)?.name.toUpperCase() ?? 'ВСЕГО'
        : 'ВСЕГО';
    heroLabel = state.unit === 'pct' ? `${base} · ОТ ОБОРОТА` : base;
  }

  // Данные серии
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

  return {
    animation: true,
    animationDuration: 450,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 400,
    animationEasingUpdate: 'cubicInOut',

    graphic: {
      elements: [
        {
          type: 'text',
          left: 'center',
          top: 'middle',
          z: 10,
          style: {
            text: `{v|${heroValue}}\n{l|${heroLabel}}`,
            textAlign: 'center',
            textVerticalAlign: 'middle',
            rich: {
              v: {
                fill: t.ink,
                fontFamily: FONTS.text,
                fontSize: 24,
                fontWeight: 800,
                lineHeight: 28,
                align: 'center',
              },
              l: {
                fill: t.g500,
                fontFamily: FONTS.mono,
                fontSize: 9,
                fontWeight: 600,
                lineHeight: 14,
                align: 'center',
                padding: [4, 0, 0, 0],
              },
            },
          },
        },
      ],
    },

    tooltip: {
      trigger: 'item',
      backgroundColor: t.ink,
      borderColor: 'transparent',
      borderWidth: 0,
      padding: [8, 12, 9, 12],
      extraCssText:
        'pointer-events:none;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.25);max-width:260px',
      textStyle: { color: t.s, fontFamily: FONTS.text, fontSize: 11 },
      formatter: (p: PieCallbackParams): string => {
        const item = p?.data?._item;
        if (!item || item.hidden) return '';
        const total = totalRub || 1;
        const rubStr = fmtRub(item.rub);
        const pctStr = fmtPct((item.rub / total) * 100);
        const cntStr = item.count == null ? null : fmtCnt(item.count);
        const dot = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${item.color};margin-right:6px;vertical-align:middle"></span>`;

        const lineStyle = `font:500 11px ${FONTS.mono};color:${t.s};line-height:1.6;display:flex;justify-content:space-between;gap:14px`;
        const cntLine = cntStr
          ? `<div style="${lineStyle}"><span>Операций</span><span style="font-variant-numeric:tabular-nums;font-weight:600">${cntStr}</span></div>`
          : '';

        return `
          <div style="font:600 12px ${FONTS.text};color:${t.s};margin-bottom:4px">${dot}${item.name}</div>
          <div style="${lineStyle}"><span>Сумма</span><span style="font-variant-numeric:tabular-nums;font-weight:600">${rubStr}</span></div>
          <div style="${lineStyle}"><span>Доля</span><span style="font-variant-numeric:tabular-nums;font-weight:600">${pctStr}</span></div>
          ${cntLine}
        `;
      },
    },

    series: [
      {
        type: 'pie',
        radius: state.unit === 'pct' ? ['48%', '68%'] : ['58%', '78%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        startAngle: 90,
        padAngle: state.padAngle,
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
          itemStyle: {
            shadowBlur: 16,
            shadowColor: 'rgba(0,0,0,0.3)',
          },
          label: { show: showOuterLabels },
        },
        data: pieData,
      },
    ],
  };
}
