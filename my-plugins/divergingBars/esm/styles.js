import { styled } from '@superset-ui/core';
import { keyframes } from '@emotion/react';
import { LIGHT_TOKENS as L, DARK_TOKENS as D, FONTS } from './themeTokens';
/*
 * Design System v2.0 tokens + прототип velocity-diverging-prototype.html
 * переписаны в Emotion-стиль. Все цвета — через CSS custom properties;
 * переключение темы — атрибутом data-theme="dark|light" на корне.
 *
 * Стиль соответствует kpiCard/src/styles.ts: styled-root с CSS-переменными
 * и вложенные классовые селекторы для дочерних элементов. Это позволяет
 * рендерить сложные таблицы и SVG без Emotion-обёрток на каждый узел.
 *
 * Анимации инжектируются отдельным <style> в VelocityDiverging.tsx
 * (см. KEYFRAMES_CSS).
 */
/** DS 2.0 §08: стандартный easing для всех переходов и анимаций. */
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
export const ROOT_CLASS = 'velocity-diverging';
// DS 2.0 canonical card mount animation. Через emotion keyframes() helper —
// race-condition-free относительно <style dangerouslySetInnerHTML> или
// `document.createElement('style')`-injection (см. donut StructureDonut.tsx).
/* Только opacity — transform убран намеренно: Superset dashboard drag-drop
   управляет transform на chart-cell ancestor'е. Конфликт двух transform
   приводил к тому что после перестановки чарт оставался смещённым/невидимым
   до hard refresh. */
const cardInKf = keyframes `
  from { opacity: 0; }
  to   { opacity: 1; }
`;
export const KEYFRAMES_CSS = `
@keyframes vd-dd-fade{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
@keyframes vd-tt-fade{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}
@keyframes vd-m-fade{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes vd-overlay-in{from{opacity:0}to{opacity:1}}
@keyframes vd-skeleton-pulse{0%{opacity:.12}50%{opacity:.22}100%{opacity:.12}}
@keyframes vd-fade-in{from{opacity:0}to{opacity:1}}
@keyframes vd-cascade-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
`;
/**
 * Корневой контейнер с переменными DS 2.0.
 * width / height — приходят из Superset ChartProps.
 */
/* InfoHintCell упразднён → shared <InfoHintCorner> из components/InfoHint. */
export const VelocityRoot = styled.div `
  --bg: ${L.bg};
  --s: ${L.s};
  --ink: ${L.ink};
  --g50: ${L.g50};
  --g100: ${L.g100};
  --g200: ${L.g200};
  --g300: ${L.g300};
  --g400: ${L.g400};
  --g500: ${L.g500};
  --g600: ${L.g600};
  --g700: ${L.g700};
  --up: ${L.up};
  --dn: ${L.dn};
  --wn: ${L.wn};
  --up-b: ${L.upBg};
  --dn-b: ${L.dnBg};
  --wn-b: ${L.wnBg};
  --c-sky: ${L.cSky};
  --c-violet: ${L.cViolet};
  --c-tangerine: ${L.cTangerine};
  --c-fuchsia: ${L.cFuchsia};
  --c-amber: ${L.cAmber};
  --on-accent: ${L.onAccent};
  --f: ${FONTS.text};
  --m: ${FONTS.mono};
  --sh: 0 1px 2px rgba(15, 17, 20, 0.08);

  &[data-theme='dark'] {
    --bg: ${D.bg};
    --s: ${D.s};
    --ink: ${D.ink};
    --g50: ${D.g50};
    --g100: ${D.g100};
    --g200: ${D.g200};
    --g300: ${D.g300};
    --g400: ${D.g400};
    --g500: ${D.g500};
    --g600: ${D.g600};
    --g700: ${D.g700};
    --up: ${D.up};
    --dn: ${D.dn};
    --wn: ${D.wn};
    --up-b: ${D.upBg};
    --dn-b: ${D.dnBg};
    --wn-b: ${D.wnBg};
    --c-sky: ${D.cSky};
    --c-violet: ${D.cViolet};
    --c-tangerine: ${D.cTangerine};
    --c-fuchsia: ${D.cFuchsia};
    --c-amber: ${D.cAmber};
    --sh: 0 1px 2px rgba(0, 0, 0, 0.4);
  }

  width: 100%;
  height: 100%;
  /* DS v2.0: container query для fluid типографики */
  container-type: inline-size;
  container-name: diverging;
  box-sizing: border-box;
  font-family: var(--f);
  background: transparent;
  color: var(--ink);
  font-feature-settings: 'tnum' 1;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  overflow: auto;
  padding: 0;
  margin: 0;

  * {
    box-sizing: border-box;
  }

  /* ── Карточка (DS 2.0 §06: radius 10, padding 16×20, gap 12) ── */
  .vd-card {
    position: relative;
    background: var(--s);
    border: 1px solid var(--g200);
    border-radius: 10px;
    padding: 16px 20px;
    box-shadow: var(--sh);
    display: flex;
    flex-direction: column;
    gap: 12px;
    /* DS 2.0 mount animation. Эмоция keyframes() гарантирует, что
       animation-name доступен ДО commit'а — без race condition. При
       переходе loading → loaded React unmount'ит loading-Card и mount'ит
       новый → animation запускается ровно когда юзер видит контент. */
    animation: ${cardInKf} 0.5s ${EASE} both;
    &[data-no-anim] { animation: none; }
  }
  /* Dashboard drag: animation re-trigger при remount → плагин невидим.
     ВАЖНО: .dashboard--editing убран — он убивает animation на весь edit mode. */
  .dragdroppable--dragging & .vd-card {
    animation: none !important;
    opacity: 1 !important;
  }

  .vd-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    /* Cascade enter — header 0.1s. */
    animation: vd-cascade-in 0.4s ${EASE} 0.1s both;
  }
  .vd-title-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  /* DS 2.0 §02 fluid: --fs-micro UPPER моно для секции */
  .vd-title {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.06em;
    line-height: 1.4;
    text-transform: uppercase;
    color: var(--ink);
    margin: 0;
  }
  /* DS 2.0 §02 fluid: --fs-micro моно для метаданных */
  .vd-sub {
    font-size: var(--fs-micro);
    font-weight: 500;
    line-height: 1.5;
    color: var(--g600);
    font-family: var(--m);
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .vd-sub .vd-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--g400);
  }

  /* ── Controls row ───────────────────────────────────── */
  .vd-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  /* DS 2.0 §06: Контрол min-height 32px, radius 6, 11px моно UPPERCASE. */
  .vd-seg {
    display: inline-flex;
    background: var(--g100);
    border: 1px solid var(--g200);
    border-radius: 6px;
    padding: 3px;
    gap: 1px;
    height: 32px;
  }
  .vd-seg button {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: transparent;
    border: none;
    padding: 0 10px;
    border-radius: 4px;
    color: var(--g600);
    cursor: pointer;
    transition: color 0.15s ${EASE}, background 0.15s ${EASE};
    white-space: nowrap;
    height: 100%;
    min-width: 32px;
  }
  .vd-seg button:hover {
    color: var(--ink);
  }
  .vd-seg button.on,
  .vd-seg button[aria-pressed='true'] {
    background: var(--c-sky);
    color: var(--on-accent);
  }
  .vd-seg button:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }

  .vd-search {
    position: relative;
    display: flex;
    align-items: center;
    width: 200px;
  }
  .vd-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    color: var(--g600);
    pointer-events: none;
  }
  .vd-search input {
    width: 100%;
    background: var(--g100);
    border: 1px solid var(--g200);
    border-radius: 6px;
    padding: 7px 26px 7px 28px;
    height: 32px;
    color: var(--ink);
    font-family: var(--f);
    font-size: var(--fs-interactive);
    font-weight: 500;
    line-height: 1.5;
    outline: none;
    transition: border-color 0.15s ${EASE};
  }
  .vd-search input:hover {
    border-color: var(--g300);
  }
  .vd-search input:focus {
    border-color: var(--c-sky);
  }
  .vd-search input::placeholder {
    color: var(--g600);
  }
  .vd-search-clear {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--g600);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }
  .vd-search-clear svg {
    width: 9px;
    height: 9px;
  }
  .vd-search-clear:hover {
    color: var(--ink);
    background: var(--g200);
  }
  .vd-search-clear[hidden] {
    display: none;
  }

  .vd-dd-wrap {
    position: relative;
  }
  .vd-dd-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--g100);
    border: 1px solid var(--g200);
    border-radius: 6px;
    padding: 6px 10px;
    height: 32px;
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--g600);
    cursor: pointer;
    transition: color 0.15s ${EASE}, border-color 0.15s ${EASE};
  }
  .vd-dd-trigger:hover {
    border-color: var(--g300);
    color: var(--ink);
  }
  .vd-dd-trigger:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  .vd-dd-trigger svg {
    width: 10px;
    height: 10px;
    opacity: 0.7;
  }
  /* DS v2.0 fluid: --fs-nano UPPER для бейджа */
  .vd-count-badge {
    background: var(--c-sky);
    color: var(--on-accent);
    border-radius: 10px;
    padding: 2px 6px;
    font-family: var(--m);
    font-size: var(--fs-nano);
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    min-width: 20px;
    text-align: center;
  }
  .vd-dd-menu {
    display: none;
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: var(--s);
    border: 1px solid var(--g300);
    border-radius: 10px;
    padding: 4px;
    min-width: 220px;
    box-shadow: 0 10px 28px rgba(15, 17, 20, 0.15);
    z-index: 200;
  }
  &[data-theme='dark'] .vd-dd-menu {
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
  }
  .vd-dd-menu[data-open='true'] {
    display: block;
    animation: vd-dd-fade 0.12s ${EASE};
  }
  .vd-dd-item {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    min-height: 32px;
    padding: 7px 10px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-family: var(--f);
    font-size: var(--fs-interactive);
    font-weight: 500;
    line-height: 1.5;
    color: var(--ink);
    text-align: left;
    transition: background 0.15s ${EASE};
  }
  .vd-dd-item:hover {
    background: var(--g100);
  }
  .vd-dd-check {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1.5px solid var(--g400);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: 0.12s;
  }
  .vd-dd-check svg {
    display: none;
  }
  .vd-dd-item.on .vd-dd-check,
  .vd-dd-item[aria-checked='true'] .vd-dd-check {
    background: var(--c-sky);
    border-color: var(--c-sky);
  }
  .vd-dd-item.on .vd-dd-check svg,
  .vd-dd-item[aria-checked='true'] .vd-dd-check svg {
    width: 9px;
    height: 9px;
    color: var(--on-accent);
    display: block;
  }
  .vd-dd-item-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .vd-dd-item-label {
    flex: 1;
  }
  .vd-dd-item-count {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    color: var(--g600);
  }

  .vd-export-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--g100);
    border: 1px solid var(--g200);
    color: var(--g600);
    cursor: pointer;
    transition: color 0.15s ${EASE}, border-color 0.15s ${EASE};
    padding: 0;
  }
  .vd-export-btn:hover {
    color: var(--c-sky);
    border-color: var(--g300);
  }
  .vd-export-btn:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  .vd-export-btn svg {
    width: 13px;
    height: 13px;
  }

  /* ── Filter row ─────────────────────────────────────── */
  .vd-filter-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 10px 12px;
    background: var(--g50);
    border: 1px solid var(--g200);
    border-radius: 10px;
  }
  /* DS 2.0 §02 fluid: --fs-micro UPPER моно для filter-label */
  .vd-filter-label {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.06em;
    line-height: 1.4;
    text-transform: uppercase;
    color: var(--g600);
    margin-right: 2px;
  }
  /* DS 2.0: фильтр-чип — интерактивный (min 11px), min-height 36 по §12. */
  .vd-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    background: var(--g100);
    border: 1px solid var(--g300);
    border-radius: 16px;
    padding: 5px 12px 5px 10px;
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--g700);
    cursor: pointer;
    transition: color 0.15s ${EASE}, border-color 0.15s ${EASE}, background 0.15s ${EASE};
    user-select: none;
  }
  .vd-chip:hover {
    color: var(--ink);
    border-color: var(--g400);
  }
  .vd-chip:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  .vd-chip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--vd-chip-color, var(--g400));
  }
  .vd-chip.on,
  .vd-chip[aria-pressed='true'] {
    background: var(--vd-chip-color, var(--g400));
    border-color: var(--vd-chip-color, var(--g400));
    color: var(--on-accent);
  }
  .vd-chip.on .vd-chip-dot,
  .vd-chip[aria-pressed='true'] .vd-chip-dot {
    background: var(--on-accent);
  }
  .vd-filter-reset {
    margin-left: auto;
    background: none;
    border: none;
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--c-sky);
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 6px;
    min-height: 32px;
  }
  .vd-filter-reset:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  .vd-filter-reset:hover {
    color: var(--ink);
  }
  .vd-filter-reset:disabled {
    color: var(--g600);
    cursor: not-allowed;
  }

  /* ── Summary strip ──────────────────────────────────── */
  .vd-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 900px) {
    .vd-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  /* DS 2.0 §06: карточка-сводка — radius 10, padding 12×16 (меньше хоста). */
  .vd-sm {
    background: var(--g50);
    border: 1px solid var(--g200);
    border-radius: 10px;
    padding: 12px 16px;
  }
  /* DS 2.0 §02 fluid: --fs-micro UPPER моно для KPI label */
  .vd-sm-l {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    color: var(--g600);
    letter-spacing: 0.06em;
    line-height: 1.4;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  /* DS v2.0 P0: hero KPI 22px → fluid clamp(28-56) через --fs-hero.
     Минимум 28px, на 4K растёт до 56px через cqi. */
  .vd-sm-v {
    font-family: var(--f);
    font-size: var(--fs-hero);
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.02em;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  .vd-sm-v .vd-u {
    font-family: var(--m);
    font-size: var(--fs-meta);
    color: var(--g600);
    font-weight: 500;
    margin-left: 4px;
  }
  .vd-sm-v.dn {
    color: var(--dn);
  }
  .vd-sm-v.up {
    color: var(--up);
  }
  /* DS 2.0 §02 fluid: --fs-micro моно для описания KPI */
  .vd-sm-d {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--g600);
    margin-top: 6px;
    letter-spacing: 0.01em;
    line-height: 1.4;
  }

  /* ── Table (DS 2.0 §07: числа моно tabular-nums, заголовки 11px/600) ── */
  .vd-table-wrap {
    border: 1px solid var(--g200);
    border-radius: 10px;
    overflow: hidden;
    background: var(--s);
    /* Cascade enter — body 0.25s. */
    animation: vd-cascade-in 0.5s ${EASE} 0.25s both;
  }
  .vd-table-head,
  .vd-row {
    display: grid;
    grid-template-columns: 36px minmax(180px, 1.4fr) 96px minmax(240px, 2.2fr) 96px 120px minmax(120px, 150px);
    gap: 12px;
    align-items: center;
  }
  /* DS 2.0 §02 fluid: --fs-micro UPPER моно для table-header */
  .vd-table-head {
    padding: 12px 16px;
    background: var(--g50);
    border-bottom: 1px solid var(--g200);
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1.4;
    text-transform: uppercase;
    color: var(--g600);
    position: sticky;
    top: 0;
    z-index: 5;
  }
  .vd-th {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    user-select: none;
    transition: color 0.12s;
    background: transparent;
    border: none;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    padding: 0;
    text-align: left;
  }
  .vd-th.sortable {
    cursor: pointer;
  }
  .vd-th.sortable:hover {
    color: var(--ink);
  }
  .vd-th.sorted {
    color: var(--c-sky);
  }
  .vd-th:not(.sortable) {
    cursor: default;
  }
  .vd-th.right {
    justify-content: flex-end;
  }
  .vd-th.center {
    justify-content: center;
  }
  .vd-th svg.vd-sort-arrow {
    width: 10px;
    height: 10px;
    opacity: 0.8;
  }
  .vd-th:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }

  .vd-table-body {
    display: flex;
    flex-direction: column;
    max-height: 700px;
    overflow-y: auto;
  }
  .vd-table-body::-webkit-scrollbar {
    width: 10px;
  }
  .vd-table-body::-webkit-scrollbar-track {
    background: var(--g50);
  }
  .vd-table-body::-webkit-scrollbar-thumb {
    background: var(--g300);
    border-radius: 5px;
  }
  .vd-table-body::-webkit-scrollbar-thumb:hover {
    background: var(--g400);
  }

  /* DS 2.0 §07: hover строки --g50, переход 0.1s. */
  .vd-row {
    padding: 12px 16px;
    border-bottom: 1px solid var(--g200);
    transition: background 0.1s ${EASE}, opacity 0.15s ${EASE};
    cursor: pointer;
    position: relative;
    background: transparent;
    border-left: none;
    border-right: none;
    text-align: left;
    font: inherit;
    color: inherit;
    width: 100%;
  }
  .vd-row:last-child {
    border-bottom: none;
  }
  .vd-row:hover {
    background: var(--g50);
  }
  .vd-row.selected {
    background: var(--g100);
  }
  .vd-row.selected::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--c-sky);
  }
  .vd-row.dimmed {
    opacity: 0.4;
  }
  .vd-row.dimmed:hover {
    opacity: 0.85;
  }
  .vd-row:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }

  /* DS v2.0 fluid: --fs-micro моно для rank-cell */
  .vd-rank-cell {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    color: var(--g600);
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .vd-store-cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  /* DS v2.0 fluid: --fs-interactive (13-15) для имени */
  .vd-store-name {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-family: var(--f);
    font-size: var(--fs-interactive);
    font-weight: 600;
    line-height: 1.4;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* DS v2.0 fluid: --fs-meta для бейджа-кода магазина */
  .vd-store-name .vd-code {
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 600;
    color: var(--g600);
    background: var(--g100);
    border-radius: 4px;
    padding: 2px 6px;
    flex-shrink: 0;
    letter-spacing: 0.01em;
  }
  /* DS v2.0 fluid: --fs-micro моно для мелкой метки */
  .vd-store-meta {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--g600);
    letter-spacing: 0.01em;
    line-height: 1.4;
  }
  /* DS v2.0 fluid: --fs-interactive моно для числовой ячейки */
  .vd-period-cell {
    font-family: var(--m);
    font-size: var(--fs-interactive);
    font-weight: 600;
    color: var(--ink);
    letter-spacing: -0.005em;
    text-align: right;
    font-variant-numeric: tabular-nums;
    line-height: 1.4;
  }
  .vd-period-cell .vd-sub-text {
    display: block;
    font-size: var(--fs-meta);
    font-weight: 500;
    color: var(--g600);
    letter-spacing: 0.01em;
    margin-top: 3px;
    font-variant-numeric: normal;
  }

  /* ── Diverging bar ──────────────────────────────────── */
  .vd-bar-wrap {
    position: relative;
    height: 26px;
    width: 100%;
  }
  .vd-bar-bg {
    position: absolute;
    inset: 0;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
  }
  .vd-bar-bg-left {
    flex: 1;
    background: rgba(52, 211, 153, 0.04);
  }
  .vd-bar-bg-right {
    flex: 1;
    background: rgba(248, 113, 113, 0.04);
  }
  &[data-theme='light'] .vd-bar-bg-left {
    background: rgba(22, 163, 74, 0.06);
  }
  &[data-theme='light'] .vd-bar-bg-right {
    background: rgba(220, 38, 38, 0.06);
  }
  .vd-bar-center {
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1.5px;
    background: var(--g400);
    border-radius: 1px;
    z-index: 2;
    transform: translateX(-50%);
  }
  .vd-bar-fill {
    position: absolute;
    top: 3px;
    bottom: 3px;
    border-radius: 3px;
    z-index: 1;
    transition: all 0.25s ${EASE};
  }

  /* ── Tempo cell ─────────────────────────────────────── */
  .vd-tempo-cell {
    font-family: var(--m);
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: 3px;
    align-items: flex-end;
    font-variant-numeric: tabular-nums;
  }
  /* DS v2.0 fluid: --fs-body для tempo (14-17) */
  .vd-tempo-main {
    font-size: var(--fs-body);
    font-weight: 700;
    letter-spacing: -0.005em;
    line-height: 1.3;
    font-variant-numeric: tabular-nums;
  }
  .vd-tempo-main.dn {
    color: var(--dn);
  }
  .vd-tempo-main.up {
    color: var(--up);
  }
  .vd-tempo-main.wn {
    color: var(--g700);
  }
  /* DS v2.0 fluid: --fs-micro моно для tempo % */
  .vd-tempo-pct {
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1.4;
    font-variant-numeric: tabular-nums;
  }
  .vd-tempo-pct.dn {
    color: var(--dn);
  }
  .vd-tempo-pct.up {
    color: var(--up);
  }
  .vd-tempo-pct.wn {
    color: var(--g600);
  }

  /* ── Spark ──────────────────────────────────────────── */
  .vd-spark-cell {
    width: 100%;
    height: 30px;
  }
  .vd-spark-cell svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  /* ── Cumulative view ────────────────────────────────── */
  .vd-cum-wrap {
    background: var(--g50);
    border: 1px solid var(--g200);
    border-radius: 10px;
    padding: 16px 20px 12px;
    display: none;
  }
  .vd-cum-wrap.visible {
    display: block;
  }
  /* DS v2.0 fluid: --fs-micro UPPER моно для section title */
  .vd-cum-title {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    color: var(--g600);
    letter-spacing: 0.06em;
    line-height: 1.4;
    text-transform: uppercase;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .vd-cum-title .vd-right {
    color: var(--g700);
    font-weight: 600;
    text-transform: none;
    letter-spacing: 0;
    font-size: var(--fs-micro);
  }
  .vd-cum-chart svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  /* ── Footer ─────────────────────────────────────────── */
  .vd-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--g200);
    /* Cascade enter — footer 0.5s. */
    animation: vd-cascade-in 0.4s ${EASE} 0.5s both;
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 500;
    line-height: 1.5;
    color: var(--g600);
    letter-spacing: 0.01em;
    flex-wrap: wrap;
  }
  .vd-footer .vd-hint {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .vd-footer .vd-hint-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .vd-footer .vd-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .vd-footer .vd-sw {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }
  /* DS v2.0 fluid: --fs-nano UPPER моно для kbd */
  .vd-footer kbd {
    display: inline-block;
    background: var(--g100);
    border: 1px solid var(--g300);
    border-radius: 4px;
    padding: 2px 6px;
    font-family: var(--m);
    font-size: var(--fs-nano);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--g700);
    line-height: 1.2;
    vertical-align: baseline;
  }
  .vd-total-right {
    color: var(--g700);
    font-weight: 600;
  }

  /* ── Empty / Error / Loading / Stale / Partial states (DS 2.0 §08) ── */
  .vd-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 24px;
    text-align: center;
    color: var(--g600);
    font-family: var(--f);
    font-size: var(--fs-interactive);
    font-weight: 500;
    line-height: 1.5;
  }
  .vd-state.error {
    color: var(--dn);
  }
  .vd-state-icon {
    width: 48px;
    height: 48px;
    color: var(--g300);
    flex-shrink: 0;
  }
  .vd-state.error .vd-state-icon {
    color: var(--dn);
    opacity: 0.6;
  }
  .vd-state-message {
    max-width: 420px;
    color: var(--g600);
  }
  .vd-state-hint {
    font-family: var(--m);
    font-size: var(--fs-micro);
    color: var(--g600);
    letter-spacing: 0.01em;
  }
  .vd-state-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    padding: 6px 14px;
    background: var(--g100);
    border: 1px solid var(--g300);
    border-radius: 6px;
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink);
    cursor: pointer;
    transition: background 0.15s ${EASE}, border-color 0.15s ${EASE};
  }
  .vd-state-action:hover {
    background: var(--g200);
    border-color: var(--g400);
  }
  .vd-state-action:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }

  /* Stale-badge (DS 2.0 §08: метка свежести на каждом компоненте). */
  .vd-stale-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 24px;
    padding: 4px 8px;
    background: var(--wn-b);
    border: 1px solid var(--wn);
    border-radius: 6px;
    font-family: var(--m);
    font-size: var(--fs-nano);
    font-weight: 700;
    color: var(--wn);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* Mock-mode badge «ТЕСТ» в шапке карточки. 1:1 с scorecard MockBadge:
     --fs-nano UPPER mono, оранжевый wn-tint фон, superscript-эффект. */
  .vd-mock-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--wn-b);
    color: var(--wn);
    font-family: var(--m);
    font-size: var(--fs-nano);
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-left: 6px;
    vertical-align: super;
    position: relative;
    top: -2px;
    user-select: none;
  }

  /* Partial-badge (inline warning). */
  .vd-partial-badge {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    background: var(--wn-b);
    border: 1px solid var(--wn);
    border-radius: 8px;
    font-family: var(--f);
    font-size: var(--fs-meta);
    font-weight: 500;
    color: var(--g700);
    line-height: 1.5;
  }
  .vd-partial-badge svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: var(--wn);
  }

  .vd-skeleton {
    background: var(--g100);
    border-radius: 6px;
    animation: vd-skeleton-pulse 0.8s ease-in-out infinite;
  }

  /* DS 2.0 §08: prefers-reduced-motion отключает все анимации. */
  @media (prefers-reduced-motion: never-match) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
/**
 * Tooltip и Modal — рендерятся в portal (document.body), поэтому
 * у них отдельные styled-корни с инжекцией тех же переменных DS 2.0.
 */
export const TooltipRoot = styled.div `
  --bg: ${L.bg};
  --s: ${L.s};
  --ink: ${L.ink};
  --g100: ${L.g100};
  --g200: ${L.g200};
  --g300: ${L.g300};
  --g400: ${L.g400};
  --g500: ${L.g500};
  --up: ${L.up};
  --dn: ${L.dn};
  --wn: ${L.wn};
  --f: ${FONTS.text};
  --m: ${FONTS.mono};

  &[data-theme='dark'] {
    --bg: ${D.bg};
    --s: ${D.s};
    --ink: ${D.ink};
    --g100: ${D.g100};
    --g200: ${D.g200};
    --g300: ${D.g300};
    --g400: ${D.g400};
    --g500: ${D.g500};
    --up: ${D.up};
    --dn: ${D.dn};
    --wn: ${D.wn};
  }

  /* DS 2.1 §08 «Тултипы»: tooltip того же тона что Card surface (НЕ инверт). */
  position: fixed;
  background: var(--s);
  color: var(--ink);
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 12px 32px rgba(15, 17, 20, 0.18);
  font-family: var(--f);
  font-size: 11px;
  pointer-events: none;
  z-index: 2000;
  max-width: 240px;
  display: none;
  font-variant-numeric: tabular-nums;

  &[data-theme='dark'] {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
  }

  &[data-visible='true'] {
    display: block;
    animation: vd-tt-fade 0.1s ${EASE};
  }

  .tt-head {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(128, 128, 128, 0.25);
  }
  .tt-status {
    width: 4px;
    border-radius: 2px;
    flex-shrink: 0;
    align-self: stretch;
  }
  .tt-titles { flex: 1; min-width: 0; }
  /* Header 13px Manrope 700 — крупнее DS-минимума для читаемости. */
  .tt-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.3;
    margin-bottom: 1px;
  }
  .tt-sub {
    font-size: 11px;
    font-weight: 400;
    color: var(--g500);
    font-family: var(--m);
    line-height: 1.4;
  }
  .tt-rows { display: flex; flex-direction: column; gap: 4px; }
  .tt-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    font-family: var(--m);
  }
  .tt-l {
    font-size: 11px;
    font-weight: 600;
    color: var(--g500);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .tt-v {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .tt-v.dn {
    color: var(--dn);
  }
  .tt-v.up {
    color: var(--up);
  }

  @media (prefers-reduced-motion: never-match) {
    &[data-visible='true'] {
      animation: none;
    }
  }
`;
export const ModalOverlay = styled.div `
  --bg: ${L.bg};
  --s: ${L.s};
  --ink: ${L.ink};
  --g50: ${L.g50};
  --g100: ${L.g100};
  --g200: ${L.g200};
  --g300: ${L.g300};
  --g400: ${L.g400};
  --g500: ${L.g500};
  --g600: ${L.g600};
  --g700: ${L.g700};
  --up: ${L.up};
  --dn: ${L.dn};
  --wn: ${L.wn};
  --c-sky: ${L.cSky};
  --f: ${FONTS.text};
  --m: ${FONTS.mono};

  &[data-theme='dark'] {
    --bg: ${D.bg};
    --s: ${D.s};
    --ink: ${D.ink};
    --g50: ${D.g50};
    --g100: ${D.g100};
    --g200: ${D.g200};
    --g300: ${D.g300};
    --g400: ${D.g400};
    --g500: ${D.g500};
    --g600: ${D.g600};
    --g700: ${D.g700};
    --up: ${D.up};
    --dn: ${D.dn};
    --wn: ${D.wn};
    --c-sky: ${D.cSky};
  }

  position: fixed;
  inset: 0;
  /* Scrim 0.65 + blur — canonical (увеличено с 0.4 для фокуса на модалке). */
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40px 20px;
  overflow-y: auto;
  font-variant-numeric: tabular-nums;
  animation: vd-overlay-in 0.18s ${EASE};

  &[data-theme='dark'] {
    background: rgba(15, 17, 20, 0.72);
  }

  /* DS 2.0 §06: карточка — radius 10, padding 16×20. */
  .vd-modal {
    background: var(--s);
    border: 1px solid var(--g300);
    border-radius: 10px;
    max-width: 900px;
    width: 100%;
    padding: 20px 24px;
    box-shadow: 0 24px 64px rgba(15, 17, 20, 0.25);
    animation: vd-m-fade 0.22s ${EASE};
    font-family: var(--f);
    color: var(--ink);
  }
  &[data-theme='dark'] .vd-modal {
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
  }
  .m-head {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--g200);
  }
  .m-status {
    width: 4px;
    border-radius: 2px;
    align-self: stretch;
    flex-shrink: 0;
  }
  .m-titles {
    flex: 1;
    min-width: 0;
  }
  /* DS v2.0 fluid: --fs-title (20-28) для заголовка модалки */
  .m-title {
    font-size: var(--fs-title);
    font-weight: 800;
    line-height: 1.3;
    letter-spacing: -0.02em;
    margin: 0 0 4px 0;
  }
  /* DS v2.0 fluid: --fs-micro моно для подзаголовка модалки */
  .m-sub {
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--g600);
    font-family: var(--m);
    line-height: 1.5;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .m-sub .m-code {
    background: var(--g100);
    border-radius: 4px;
    padding: 2px 6px;
    font-weight: 600;
    color: var(--g700);
  }
  .m-sub .m-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--g400);
  }
  /* DS 2.0 §06: контрол 32×32, radius 6. */
  .m-close {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--g100);
    border: 1px solid var(--g200);
    color: var(--g600);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ${EASE}, color 0.15s ${EASE};
    flex-shrink: 0;
  }
  .m-close:hover {
    background: var(--g200);
    color: var(--ink);
  }
  .m-close:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  .m-close svg {
    width: 12px;
    height: 12px;
  }
  .m-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }
  @media (max-width: 700px) {
    .m-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .m-stat {
    background: var(--g50);
    border: 1px solid var(--g200);
    border-radius: 10px;
    padding: 12px 16px;
  }
  /* DS v2.0 fluid: --fs-micro UPPER моно для KPI label */
  .m-stat-l {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    color: var(--g600);
    letter-spacing: 0.06em;
    line-height: 1.4;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  /* DS v2.0: hero KPI в модалке — fluid 28→56 */
  .m-stat-v {
    font-family: var(--f);
    font-size: var(--fs-hero);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }
  .m-stat-v .u {
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 500;
    color: var(--g600);
    margin-left: 4px;
  }
  .m-stat-d {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 500;
    margin-top: 6px;
    color: var(--g600);
    line-height: 1.4;
  }
  .m-stat-d.dn {
    color: var(--dn);
  }
  .m-stat-d.up {
    color: var(--up);
  }
  .m-trend-wrap {
    margin-bottom: 8px;
  }
  /* DS v2.0 fluid: --fs-micro UPPER моно для section header */
  .m-section-l {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1.4;
    text-transform: uppercase;
    color: var(--g600);
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--g200);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .m-section-l .right {
    color: var(--g700);
    font-weight: 600;
    text-transform: none;
    letter-spacing: 0;
    font-size: var(--fs-micro);
  }
  .m-trend-card {
    background: var(--g50);
    border: 1px solid var(--g200);
    border-radius: 10px;
    padding: 14px 16px;
  }
  .m-trend-card svg {
    display: block;
    width: 100%;
    height: auto;
  }

  @media (prefers-reduced-motion: never-match) {
    animation: none;
    .vd-modal {
      animation: none;
    }
  }
`;
/* Skeleton block — heights vary by variant per DS 2.0 §08 (skeleton 0.8s pulse). */
export const SkeletonBlock = styled.div `
  background: var(--g100);
  border-radius: 6px;
  animation: vd-skeleton-pulse 0.8s ease-in-out infinite;
  width: ${({ variant }) => (variant === 'title' ? '40%' : '100%')};
  height: ${({ variant }) => variant === 'title' ? '18px' : variant === 'header' ? '58px' : '42px'};

  @media (prefers-reduced-motion: never-match) {
    animation: none;
  }
`;
/* Bar cell — relative positioning anchor for the absolute fill bar. */
export const BarCell = styled.div `
  position: relative;
`;
//# sourceMappingURL=styles.js.map