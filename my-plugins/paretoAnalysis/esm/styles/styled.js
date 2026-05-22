/**
 * Все styled-компоненты Pareto Card — на базе @superset-ui/core styled (Emotion).
 * CSS-переменные DS 2.0 живут на корневом контейнере и переключаются
 * через атрибут data-theme (light | dark).
 */
import { styled } from '@superset-ui/core';
import { keyframes } from '@emotion/react';
import { LIGHT_TOKENS as L, DARK_TOKENS as D } from './tokens';
import { EASE } from './keyframes';
export const PARETO_CARD_CLASS = 'pareto-card';
// DS 2.0 canonical card mount animation. Через emotion keyframes() helper —
// race-condition-free относительно <style dangerouslySetInnerHTML> (см. donut).
/* Только opacity — transform убран намеренно: Superset dashboard drag-drop
   управляет transform на chart-cell ancestor'е. Конфликт двух transform
   приводил к тому что после перестановки чарт оставался смещённым/невидимым
   до hard refresh. */
const cardInKf = keyframes `
  from { opacity: 0; }
  to   { opacity: 1; }
`;
// ═══════════════════════════════════════
// Root — CSS-vars light/dark
// ═══════════════════════════════════════
export const ParetoCardRoot = styled.div `
  /* light (default) */
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
  /* DS §06: семантические тинты статусов (rgba) для бейджей/pill */
  --up-b: ${L.upBg};
  --dn-b: ${L.dnBg};
  --wn-b: ${L.wnBg};
  --c-sky: ${L.cSky};
  --c-violet: ${L.cViolet};
  --c-tangerine: ${L.cTangerine};
  --c-fuchsia: ${L.cFuchsia};
  --c-amber: ${L.cAmber};
  --on-accent: ${L.onAccent};
  --f: ${L.fontSans};
  --m: ${L.fontMono};
  --sh: 0 1px 3px rgba(15, 17, 20, 0.06);
  --modal-scrim: rgba(0, 0, 0, 0.55);
  /* DS §06 типографическая шкала + §05 адаптивная (broad screens).
     Размеры подняты до canonical (как scorecard/metricTimeSeries визуально):
     nano 11 (статус-бейдж), micro 12 (мета mono UPPER), meta 13 (body inline),
     interactive 14 (controls), body 16 (заголовок секции, hero-числа).
     @container queries ниже уменьшают на узких карточках. */
  --fs-nano: 11px;
  --fs-micro: 12px;
  --fs-meta: 13px;
  --fs-interactive: 14px;
  --fs-body: 16px;
  --fs-subtitle: 17px;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);

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
    --sh: 0 1px 3px rgba(0, 0, 0, 0.3);
    --modal-scrim: rgba(0, 0, 0, 0.7);
  }

  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  /* DS v2.0: container query для fluid типографики (cqi растёт с шириной карточки) */
  container-type: inline-size;
  container-name: pareto;
  font-family: var(--f);
  color: var(--ink);
  /* DS v2.0 §02 «Числа»: tabular-nums ВСЕГДА (наследуется на легенду, цифры
     в карточке выровнены по ширине). */
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`;
// ═══════════════════════════════════════
// Card shell
// ═══════════════════════════════════════
export const Card = styled.div `
  position: relative;
  background: var(--s);
  border: 1px solid var(--g200);
  /* DS v2.1 §06 Контейнер: radius 10px, padding space-4 × space-6 (16×20px). */
  border-radius: 10px;
  padding: 16px 20px;
  box-shadow: var(--sh);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* DS 2.0 mount animation. fill-mode both — initial state мгновенно. При
     переходе loading → loaded React unmount'ит loading-Card и mount'ит
     новый → animation запускается ровно когда юзер видит реальный контент. */
  animation: ${cardInKf} 0.5s ${EASE} both;
  &[data-no-anim] { animation: none; }

  /* DS v2.1 §06 fluid типографика: на узких карточках уменьшаем шрифты, чтобы
     VitalFewSummary / CardTitle / footer не overflow'или. Уровни по DS §05
     адаптивной типографики (медиум → small → ультра-компакт). */
  @container pareto (max-width: 400px) {
    padding: 14px 16px;
    --fs-body: 14px;
    --fs-interactive: 13px;
    --fs-meta: 12px;
    --fs-micro: 11px;
  }
  @container pareto (max-width: 320px) {
    padding: 12px 14px;
    --fs-body: 13px;
    --fs-interactive: 12px;
    --fs-meta: 11px;
    --fs-micro: 11px;
    --fs-nano: 10px;
  }
  @container pareto (max-width: 240px) {
    padding: 10px 12px;
  }
`;
export const CardHead = styled.div `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  /* DS v2.1 §06: «Отступ после заголовка контейнера: space-3 (12px)». */
  margin-bottom: 12px;
  flex-wrap: wrap;
`;
export const CardTitleGroup = styled.div `
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;
export const CardTitle = styled.div `
  /* DS v2.1 §06 canonical Card title (как в scorecard / metricTimeSeries /
     donut / riskMatrix после 3f1ed19bd): sans-serif, 14px, 700, UPPERCASE,
     letter-spacing 0.05em. Раньше был mono 11px — не совпадало с остальными
     плагинами и было нечитабельно на узких карточках. */
  font-family: var(--f);
  font-size: var(--fs-body);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink);
  line-height: 1.25;
`;
/* DS v2.1 §08 «Состояния» — Stale bar: тонкая sky-полоса сверху Card,
   данные из кеша. Slide animation как progress indicator («обновление в фоне»).
   Cписывает Card position:relative — он уже есть на Card-обёртке. */
export const StaleBar = styled.div `
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--c-sky) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: pareto-stale-slide 1.6s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;

  @keyframes pareto-stale-slide {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;
/* DS v2.1 §08 «Состояния» — Partial badge: данные неполные (part queries failed
   или часть колонок не пришла). Рядом с заголовком, как индикатор того что
   chart показывает доступную часть. */
export const PartialBadge = styled.span `
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--wn-b);
  color: var(--wn);
  font-family: var(--m);
  font-size: var(--fs-nano);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-left: 8px;
  vertical-align: middle;
  user-select: none;
`;
/* DS v2.1 §06 «Статусный бейдж ТЕСТ» — 1:1 со scorecard MockBadge.
   Min-height 24px (DS требование к pill/индикаторам). */
export const MockBadge = styled.span `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 24px;
  padding: 4px 8px;
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
`;
export const CardSubtitle = styled.div `
  /* DS 2.0: subtitle с локализованным time_range («за год», «за месяц»). */
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 500;
  color: var(--g500);
  letter-spacing: 0.02em;
  margin-top: 1px;
`;
export const BreadcrumbRow = styled.div `
  font-family: var(--m);
  font-size: var(--fs-micro);
  color: var(--g500);
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 14px;
`;
export const BreadcrumbBtn = styled.button `
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--m);
  /* DS 2.0: ◂ back-button — крупный (18px/700), чтобы юзер сразу видел «назад». */
  font-size: 18px;
  font-weight: 700;
  color: var(--g500);
  padding: 0 6px;
  border-radius: 6px;
  transition: color 0.15s ${EASE}, background 0.15s ${EASE};
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  min-width: 22px;
  &:hover,
  &:focus-visible {
    color: var(--ink);
    background: var(--g100);
    outline: none;
  }
  /* ADR-0001 mobile-first: touch target 44×44 на coarse pointer (тач). */
  @media (pointer: coarse) {
    min-height: 44px;
    min-width: 44px;
    height: auto;
    padding: 0 12px;
  }
`;
export const BreadcrumbCur = styled.span `
  color: var(--g600);
  font-weight: 500;
`;
export const BreadcrumbSel = styled.span `
  color: var(--ink);
  font-weight: 600;
`;
export const ControlsRow = styled.div `
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  flex-shrink: 0;
`;
// ═══════════════════════════════════════
// Unit toggle (₽ / %)
// ═══════════════════════════════════════
export const UnitToggle = styled.div `
  display: flex;
  gap: 2px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 2px;
  min-height: 30px;
`;
export const UnitBtn = styled.button `
  border: none;
  background: ${({ active }) => (active ? 'var(--c-sky)' : 'transparent')};
  color: ${({ active }) => (active ? 'var(--on-accent)' : 'var(--g500)')};
  font-family: var(--f);
  font-size: var(--fs-micro);
  font-weight: 600;
  padding: 5px 13px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  min-height: 24px;
  min-width: 32px;
  letter-spacing: 0.01em;
  white-space: nowrap;
  box-shadow: ${({ active }) => (active ? 'var(--sh)' : 'none')};
  &:hover {
    color: ${({ active }) => (active ? 'var(--on-accent)' : 'var(--ink)')};
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 1px;
  }
  /* ADR-0001 mobile-first: touch target 44×44 на coarse pointer. */
  @media (pointer: coarse) {
    min-height: 44px;
    min-width: 44px;
    padding: 10px 14px;
  }
`;
// ═══════════════════════════════════════
// Chip (Top-A / Prev period)
// ═══════════════════════════════════════
export const Chip = styled.button `
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${({ active }) => (active ? 'var(--c-sky)' : 'var(--g100)')};
  border: 1px solid
    ${({ active }) => (active ? 'var(--c-sky)' : 'var(--g200)')};
  border-radius: 7px;
  font-family: var(--f);
  font-size: var(--fs-micro);
  font-weight: 600;
  color: ${({ active }) => (active ? 'var(--on-accent)' : 'var(--g500)')};
  padding: 5px 11px;
  min-height: 30px;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  letter-spacing: 0.01em;
  white-space: nowrap;
  box-shadow: ${({ active }) => (active ? 'var(--sh)' : 'none')};
  &:hover {
    color: ${({ active }) => (active ? 'var(--on-accent)' : 'var(--ink)')};
    border-color: ${({ active }) => (active ? 'var(--c-sky)' : 'var(--g300)')};
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 1px;
  }
  /* ADR-0001 mobile-first: touch target 44×44 на coarse pointer. */
  @media (pointer: coarse) {
    min-height: 44px;
    padding: 10px 14px;
  }
`;
// ═══════════════════════════════════════
// Threshold slider
// ═══════════════════════════════════════
export const ThresholdWrap = styled.label `
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 5px 12px;
  min-height: 30px;
  font-family: var(--f);
  font-size: var(--fs-micro);
  font-weight: 600;
  color: var(--g500);
  letter-spacing: 0.01em;
`;
export const ThresholdLabel = styled.span `
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  color: var(--g500);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;
export const ThresholdValue = styled.span `
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  min-width: 30px;
  text-align: right;
`;
export const ThresholdRange = styled.input `
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  width: 90px;
  height: 14px;
  cursor: pointer;
  margin: 0;
  &::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: var(--g300);
  }
  &::-moz-range-track {
    height: 4px;
    border-radius: 2px;
    background: var(--g300);
  }
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--c-sky);
    border: 2px solid var(--s);
    box-shadow: var(--sh);
    margin-top: -5px;
    cursor: grab;
  }
  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--c-sky);
    border: 2px solid var(--s);
    box-shadow: var(--sh);
    cursor: grab;
  }
  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
    border-radius: 4px;
  }
`;
// ═══════════════════════════════════════
// Vital Few + chart area
// ═══════════════════════════════════════
export const VitalFewLine = styled.div `
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 2px 0 12px;
  font-family: var(--f);
  font-size: var(--fs-micro);
  color: var(--g500);
  letter-spacing: 0.01em;
  /* Cascade enter: после CardHead (~0.1s delay), 0.4s длительность. */
  animation: pareto-cascade-in 0.4s ${EASE} 0.1s both;

  b {
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 700;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  b.dn {
    color: var(--dn);
  }
  .mark {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--dn);
    margin-right: 4px;
    vertical-align: middle;
  }
`;
export const ChartBox = styled.div `
  position: relative;
  flex: 1;
  min-height: 280px;
  width: 100%;
  /* DS 2.0 §08 — графики с тултипами имеют crosshair-курсор. */
  cursor: crosshair;
  /* Cascade enter: после VitalFew (~0.25s delay), 0.5s. ECharts series
     animation (700ms) играет внутри уже-видимого canvas. */
  animation: pareto-cascade-in 0.5s ${EASE} 0.25s both;
`;
export const ChartCanvasDiv = styled.div `
  position: absolute;
  inset: 0;
`;
// ═══════════════════════════════════════
// Footer: hint + legend
// ═══════════════════════════════════════
export const CardFooter = styled.div `
  display: flex;
  align-items: center;
  gap: 12px;
  /* DS §06 space-4 (16px) между chart и легендой — комфортная визуальная
     граница, не залипает. Border-top — тонкая разделительная линия. */
  margin-top: 16px;
  padding-top: 0;
  border-top: 1px solid var(--g200);
  /* Cascade enter: последний после chart (~0.5s delay), 0.4s. */
  animation: pareto-cascade-in 0.4s ${EASE} 0.5s both;
`;
export const HintItem = styled.div `
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g500);
  letter-spacing: 0.01em;
  white-space: nowrap;
  justify-self: start;

  .hi {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  /* DS 2.0: иконки 16px (раньше 11px — не видно). */
  .hi svg {
    width: 16px;
    height: 16px;
    color: var(--g500);
    flex-shrink: 0;
  }
  .hi .hi-arrow {
    /* Типографический «◂» внутри hint-текста, той же формы что в breadcrumb. */
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    color: var(--g600);
    margin-right: 2px;
    vertical-align: -1px;
  }
  .hi-sep {
    /* Вертикальный разделитель между подсказками — заменяет SVG-стрелки «→»
       которые читались как direction-индикатор, а не как граница. */
    display: inline-block;
    width: 1px;
    height: 14px;
    background: var(--g300);
    margin: 0 4px;
    vertical-align: middle;
  }
`;
export const LegendRow = styled.div `
  display: flex;
  flex: 1;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;

  .sep {
    width: 1px;
    height: 10px;
    background: var(--g200);
  }
`;
export const Lg = styled.div `
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;
  opacity: ${({ off }) => (off ? 0.35 : 1)};

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
    border-radius: 4px;
  }

  &:hover [data-lg-label] {
    color: var(--ink);
  }
`;
export const LgSwatch = styled.span `
  width: 14px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
  background: ${({ color }) => color};
`;
export const LgLine = styled.span `
  width: 14px;
  height: 0;
  border-top: 2px solid var(--ink);
  flex-shrink: 0;
`;
export const LgLabel = styled.span `
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g600);
  letter-spacing: 0.01em;
  white-space: nowrap;
`;
LgLabel.defaultProps = { 'data-lg-label': '' };
export const ZoneChipBtn = styled.button `
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 3px 8px;
  border-radius: 14px;
  border: 1px solid ${({ active }) => (active ? 'var(--g300)' : 'transparent')};
  background: ${({ active }) => (active ? 'var(--g100)' : 'transparent')};
  cursor: pointer;
  transition: border-color 0.15s ${EASE}, background 0.15s ${EASE};
  user-select: none;

  &:hover {
    background: var(--g50);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 1px;
  }
  & > span:last-child {
    color: ${({ active }) => (active ? 'var(--ink)' : 'var(--g600)')};
    font-weight: ${({ active }) => (active ? 600 : 500)};
  }
  /* ADR-0001 mobile-first: touch target 44×44 на coarse pointer. */
  @media (pointer: coarse) {
    min-height: 44px;
    padding: 10px 12px;
  }
`;
// ═══════════════════════════════════════
// Tooltip (DOM)
// ═══════════════════════════════════════
export const TooltipEl = styled.div `
  /* position: fixed (viewport-relative) — tooltip выходит за overflow:hidden
     Card, не клипается её правым краем. Координаты приходят из clientX/Y. */
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  /* DS 2.1 §08 «Тултипы»: tooltip того же тона что Card surface (НЕ инверт). */
  background: var(--s);
  color: var(--ink);
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: var(--sh);
  font-family: var(--f);
  font-size: 11px;
  max-width: 240px;
  animation: pareto-tooltip-in 0.12s ${EASE};

  /* Header 13px Manrope 700 — крупнее DS-минимума для читаемости. */
  .tt-title {
    font-weight: 700;
    font-size: 13px;
    color: var(--ink);
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(128, 128, 128, 0.25);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tt-title .dot {
    width: 7px;
    height: 7px;
    border-radius: 2px;
  }
  .tt-title .zone {
    font-family: var(--m);
    font-size: 10px;
    font-weight: 600;
    margin-left: auto;
    padding: 1px 5px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .tt-row {
    font-family: var(--m);
    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .tt-row > span:first-of-type {
    font-size: 11px;
    font-weight: 600;
    color: var(--g500);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .tt-row b {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .tt-row b.up { color: var(--up); }
  .tt-row b.dn { color: var(--dn); }
  .tt-divider {
    height: 1px;
    background: rgba(128, 128, 128, 0.25);
    margin: 6px 0;
  }
`;
// ═══════════════════════════════════════
// Modal (drill)
// ═══════════════════════════════════════
export const ModalOverlay = styled.div `
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: pareto-overlay-in 0.18s ${EASE};

  /* Modal рендерится через createPortal в document.body — CSS-переменные
     из ParetoCardRoot не наследуются. Scrim задаём напрямую через data-theme. */
  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
  }
  &[data-theme='dark'] .backdrop {
    background: rgba(0, 0, 0, 0.78);
  }
`;
export const ModalCard = styled.div `
  position: relative;
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  box-shadow: var(--sh);
  max-width: min(820px, 100%);
  width: 100%;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  animation: pareto-modal-in 0.2s ${EASE};
  color: var(--ink);
  font-family: var(--f);
`;
export const ModalHead = styled.div `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px 12px;
  border-bottom: 1px solid var(--g200);
`;
export const ModalTitle = styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;

  .m-eyebrow {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--g500);
  }
  .m-h {
    /* DS v2.0 fluid: --fs-title (20-28) для modal heading */
    font-family: var(--f);
    font-size: var(--fs-title);
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--ink);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .m-h .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
`;
export const ModalClose = styled.button `
  border: none;
  background: var(--g100);
  color: var(--g500);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ${EASE};
  flex-shrink: 0;
  &:hover {
    color: var(--ink);
    background: var(--g200);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 1px;
  }
  svg {
    width: 12px;
    height: 12px;
  }
`;
export const ModalBody = styled.div `
  padding: 18px 22px 20px;
  overflow-y: auto;
  flex: 1;
`;
export const DrillSummaryGrid = styled.div `
  display: flex;
  /* 5 hero metrics в одну строку. Flex с justify-content: space-between —
     каждая ячейка занимает natural width, лейблы не разрываются,
     равномерное распределение по ширине. */
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px 16px;
  padding: 14px 16px;
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 8px;
  margin-bottom: 18px;

  /* Каждая ячейка — natural width, label в одну строку. */
  > div {
    min-width: 0;
  }

  .s-l {
    white-space: nowrap;
  }

  .s-l {
    /* DS v2.0: 9px → var(--fs-micro) (минимум 11) UPPER */
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--g500);
  }
  .s-v {
    /* DS v2.0 P0: drill summary value 15px → --fs-subtitle (16-20) */
    font-family: var(--m);
    font-size: var(--fs-subtitle);
    font-weight: 700;
    color: var(--g700);
    font-variant-numeric: tabular-nums;
    margin-top: 2px;
  }
  .s-v.zone-a {
    color: var(--dn);
  }
  .s-v.zone-b {
    color: var(--wn);
  }
  .s-v.zone-c {
    color: var(--g500);
  }
  /* Семантика «Движение по рангу»: bad = ранг упал (число выросло),
     good = поднялся (число уменьшилось). */
  .s-v.bad {
    color: var(--dn);
  }
  .s-v.good {
    color: var(--up);
  }
  /* Длинные значения движения «#8 → #9» — мельче чтобы не ломать grid.
     inline-flex + align-items:center — стрелка точно по vertical center цифр
     (raw text «#11 → #12» давала смещение из-за baseline arrow vs digits). */
  .s-v.rank-delta {
    font-size: var(--fs-interactive);
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    line-height: 1;
    white-space: nowrap;
  }
  .s-v.rank-delta .arr {
    /* Sans-serif arrow — на baseline ближе к центру относительно цифр mono. */
    font-family: var(--f);
    font-weight: 500;
    color: var(--g500);
    font-size: 0.95em;
  }
`;
export const DrillContext = styled.div `
  margin-bottom: 18px;
  padding: 14px 16px;
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 8px;

  .ctx-row {
    display: grid;
    grid-template-columns: 1fr minmax(120px, 2fr) auto;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid var(--g200);
  }
  .ctx-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .ctx-row:first-of-type {
    padding-top: 0;
  }
  .ctx-l {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .ctx-label {
    font-family: var(--f);
    font-size: var(--fs-meta);
    font-weight: 600;
    color: var(--g700);
    letter-spacing: -0.01em;
  }
  .ctx-hint {
    /* DS v2.0: 9px → var(--fs-micro) */
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--g500);
    letter-spacing: 0.01em;
  }
  .ctx-v {
    font-family: var(--m);
    font-size: var(--fs-interactive);
    font-weight: 700;
    color: var(--g700);
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
  }
  .ctx-v.bad {
    color: var(--dn);
  }
  .ctx-v.good {
    color: var(--up);
  }

  .ctx-bar-wrap {
    position: relative;
    /* Flex-column: bar сверху + опциональный ctx-hint снизу (по центру).
       Раньше height: 10px fixed — переключился на content-driven. */
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .ctx-hint.ctx-hint-under {
    /* Цифры «3,0 млн ₽ из 225,0», «было … → стало …» — по центру под mini-bar.
     --fs-micro (12px) — на token меньше chart-body, чтобы не конкурировать
     визуально с правым итоговым числом ctx-v. */
    text-align: center;
    font-size: var(--fs-micro);
    color: var(--g500);
    line-height: 1.3;
  }
  .ctx-bar {
    height: 10px;
    background: var(--g100);
    border-radius: 5px;
    overflow: visible;
    position: relative;
  }
  .ctx-bar-fill {
    height: 100%;
    border-radius: 5px;
    background: var(--g500);
    transition: width 0.4s ${EASE};
  }
  .ctx-bar-fill.bad {
    background: var(--dn);
  }
  .ctx-bar-fill.good {
    background: var(--up);
  }
  .ctx-bar-avg {
    position: absolute;
    top: -3px;
    width: 2px;
    height: 16px;
    background: var(--ink);
    border-radius: 1px;
    opacity: 0.6;
  }
`;
export const DrillSectionTitle = styled.div `
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g600);
  margin-bottom: 10px;
`;
export const DrillBars = styled.div `
  display: flex;
  flex-direction: column;
  gap: 10px;

  .dbf {
    display: grid;
    /* value-колонка: minmax(120px, auto) — растёт под content, удерживая
       «123,45 млн ₽» одной строкой при nowrap, и не сжимается ниже минимума. */
    grid-template-columns: 140px 1fr minmax(120px, auto);
    gap: 14px;
    align-items: center;
  }
  .dbf-l {
    font-family: var(--f);
    font-size: var(--fs-meta);
    font-weight: 500;
    color: var(--g700);
  }
  .dbf-bar {
    height: 10px;
    background: var(--g100);
    border-radius: 5px;
    overflow: hidden;
  }
  .dbf-bar-fill {
    height: 100%;
    border-radius: 5px;
    transition: width 0.4s ${EASE};
  }
  .dbf-v {
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--g700);
    /* Stack: число (1,9 млн ₽) сверху одной строкой, % под ним справа.
       white-space: nowrap запрещает разрыв «1,9 млн» ↔ «₽» при тесном месте. */
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    white-space: nowrap;
  }
  .dbf-v .pct {
    color: var(--g500);
    font-size: var(--fs-micro);
    margin-left: 0;
  }
`;
// ═══════════════════════════════════════
// Empty / loading / error states
// ═══════════════════════════════════════
export const StateCenter = styled.div `
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--g500);
  font-family: var(--f);
  padding: 24px;
  text-align: center;
`;
export const StateTitle = styled.div `
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--g600);
  letter-spacing: -0.01em;
`;
export const StateSub = styled.div `
  font-family: var(--m);
  font-size: var(--fs-micro);
  color: var(--g500);
  letter-spacing: 0.01em;
`;
export const SkeletonBlock = styled.div `
  width: ${({ w }) => w ?? '100%'};
  height: ${({ h }) => h ?? '12px'};
  background: var(--g200);
  border-radius: 4px;
  animation: pareto-skeleton-pulse 1.2s ${EASE} infinite;
`;
//# sourceMappingURL=styled.js.map