/**
 * Emotion-компоненты Scatter · Risk Matrix.
 * Все цвета идут через CSS-переменные (--bg, --s, --ink, --gN, --c-*, --up/dn/wn),
 * которые устанавливаются в CardRoot через data-theme.
 */
import { styled, css } from '@superset-ui/core';
import { keyframes } from '@emotion/react';
import { DARK_TOKENS, LIGHT_TOKENS, FONTS } from './themeTokens';
const EASE = 'cubic-bezier(.2, .8, .25, 1)';
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
/** Глобальные keyframes инжектируются через <style>-тег в компоненте. */
export const KEYFRAMES_CSS = `
  @keyframes sr-tt-fade { from { opacity: 0; transform: translateY(-2px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes sr-dd-fade { from { opacity: 0; transform: translateY(-3px) } to { opacity: 1; transform: translateY(0) } }
  /* Slide-down + лёгкий scale из top-right (точка origin = trigger button),
     создаёт ощущение что панель «выдвигается» из-под trigger тулбара. */
  @keyframes sr-dd-slide { from { opacity: 0; transform: translateY(-6px) scale(0.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
  @keyframes sr-m-fade { from { opacity: 0 } to { opacity: 1 } }
  @keyframes sr-m-pop  { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
  @keyframes sr-skel-pulse { 0%, 100% { opacity: 0.45 } 50% { opacity: 0.85 } }
`;
/** CSS-переменные DS 2.0 — ставятся на корневом элементе через data-theme */
export const themeVars = (t) => css `
  --bg: ${t.bg};
  --s: ${t.s};
  --ink: ${t.ink};
  --g50: ${t.g50};
  --g100: ${t.g100};
  --g200: ${t.g200};
  --g300: ${t.g300};
  --g400: ${t.g400};
  --g500: ${t.g500};
  --g600: ${t.g600};
  --g700: ${t.g700};
  --up: ${t.up};
  --dn: ${t.dn};
  --wn: ${t.wn};
  --up-bg: ${t.upBg};
  --dn-bg: ${t.dnBg};
  --wn-bg: ${t.wnBg};
  --c-sky: ${t.cSky};
  --c-violet: ${t.cViolet};
  --c-tangerine: ${t.cTangerine};
  --c-fuchsia: ${t.cFuchsia};
  --c-amber: ${t.cAmber};
  --c-cyan: ${t.cCyan};
  --on-accent: ${t.onAccent};
  --sh: ${t.sh};
  --selection-tint: ${t.selectionTint};
  --modal-scrim: ${t.modalScrim};
  --modal-shadow: ${t.modalShadow};
  --tooltip-shadow: ${t.tooltipShadow};
  --dd-shadow: ${t.ddShadow};
  --annot-bg: ${t.annotBg};
  --f: ${FONTS.text};
  --m: ${FONTS.mono};
  --ease: ${EASE};
`;
/**
 * Обёртка для portal-рендера (tooltip / drill-modals) в document.body.
 * Прокидывает CSS-переменные темы — иначе var(--g100) etc. внутри portal'a
 * будут unset (они объявлены только на CardRoot). НЕ создаёт containing
 * block (нет transform / container-type) — поэтому position:fixed внутри
 * работает относительно viewport, а не CardRoot.
 */
export const PortalRoot = styled.div `
  &[data-theme='dark'] {
    ${themeVars(DARK_TOKENS)}
  }
  &[data-theme='light'] {
    ${themeVars(LIGHT_TOKENS)}
  }
  font-family: var(--f);
`;
export const CardRoot = styled.div `
  &[data-theme='dark'] {
    ${themeVars(DARK_TOKENS)}
  }
  &[data-theme='light'] {
    ${themeVars(LIGHT_TOKENS)}
  }

  position: relative;
  font-family: var(--f);
  color: var(--ink);
  background: var(--s);
  border: 1px solid var(--g200);
  /* DS 2.1 §06 Контейнер: radius 10px, padding space-4 × space-6 (16×20px). */
  border-radius: 10px;
  padding: 16px 20px;
  box-shadow: var(--sh);
  width: 100%;
  height: 100%;
  /* DS v2.0: container query для fluid типографики */
  container-type: inline-size;
  container-name: risk;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  font-feature-settings: 'tnum' 1;
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
  /* DS 2.0 mount animation. Эмоция keyframes() — race-condition-free. При
     переходе loading → loaded React unmount'ит loading-CardRoot и mount'ит
     новый → animation запускается ровно когда юзер видит контент. */
  animation: ${cardInKf} 0.5s ${EASE} both;
  &[data-no-anim] { animation: none; }
  /* Dashboard drag/edit: animation re-trigger при remount → плагин невидим. */
  .dragdroppable--dragging &,
  .dashboard--editing & {
    animation: none !important;
    opacity: 1 !important;
  }

  * {
    box-sizing: border-box;
  }
`;
/* DS 2.0 §06 — Partial badge: данные неполные. */
export const PartialBadge = styled.span `
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
  margin-left: 8px;
  vertical-align: middle;
  user-select: none;
`;
/* DS 2.0 «Статусный бейдж ТЕСТ» — 1:1 со scorecard MockBadge.
   Superscript-effect: badge поднят выше базовой линии заголовка. */
export const MockBadge = styled.span `
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
`;
/* DS 2.0 §06 — Stale bar: тонкая sky-полоса сверху Card. */
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
  animation: rm-stale-slide 1.6s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;

  @keyframes rm-stale-slide {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;
export const CardHead = styled.div `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  /* DS 2.1 §06: «Отступ после заголовка контейнера: space-3 (12px)». */
  margin-bottom: 12px;
  flex-shrink: 0;
`;
export const TitleBlock = styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;
export const CardTitle = styled.div `
  /* DS v2.0 canonical Card title (как в scorecard / metricTimeSeries / donut):
     sans-serif, 14px, 700, UPPERCASE. Раньше был mono 11px 800 — не совпадало
     с остальными плагинами. */
  font-family: var(--f);
  font-size: var(--fs-body, 14px);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink);
  line-height: 1.25;
`;
export const CardSubtitle = styled.div `
  /* DS v2.0 fluid: --fs-micro моно для подзаголовка */
  font-size: var(--fs-micro);
  font-weight: 500;
  color: var(--g500);
  font-family: var(--m);
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--g400);
  }
  .strong {
    color: var(--g700);
    font-weight: 600;
  }
`;
export const Controls = styled.div `
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
`;
/* Wrapper для нескольких Toolbar-капсул в одной строке — каждая
   функциональная группа = отдельная капсула, по pattern metricTimeSeries
   Controls. Капсулы по визуалу одинаковые (см. Toolbar + SelectDd). */
export const ToolbarRow = styled.div `
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;
/* Toolbar capsule для одиночных действий (Reset, Clear). По визуалу совпадает
   с SelectDd в закрытом состоянии: размер 30×30 (по 1 кнопке) с bg/border.
   БЕЗ внешнего padding, кнопка fill'ит capsule. */
export const Toolbar = styled.div `
  display: inline-flex;
  align-items: center;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 5px;
  overflow: hidden;
`;
export const TbBtn = styled.button `
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 5px;
  color: var(--g500);
  cursor: pointer;
  transition: 0.12s;

  &:hover:not(:disabled) {
    color: var(--ink);
    background: var(--g200);
  }
  &.on {
    background: var(--c-sky);
    color: var(--on-accent);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  &.clear {
    color: var(--dn);
  }
  &.clear:hover {
    background: var(--g200);
  }
  svg {
    width: 14px;
    height: 14px;
    display: block;
  }

  /* ADR-0001 mobile-first: touch target 44×44 на coarse pointer (тач) */
  @media (pointer: coarse) {
    min-width: 44px;
    min-height: 44px;
    width: auto;
    height: auto;
    padding: 10px;
  }
`;
export const TbDivider = styled.span `
  width: 1px;
  background: var(--g200);
  margin: 2px 1px;
`;
/* Dropdown по pattern metricTimeSeries (DropdownRoot+Panel):
   Wrap фиксирует layout 30×30 (= размер trigger TbBtn). Panel абсолютно
   позиционирован поверх Wrap и при открытии расширяется ВНИЗ за пределы
   Wrap, оставаясь единым capsule с trigger'ом внутри. */
export const SelectDdWrap = styled.div `
  position: relative;
  display: inline-block;
  width: 30px;
  height: 30px;
  vertical-align: top;
`;
export const SelectDd = styled.div `
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: var(--g100);
  /* Border видим в любом состоянии — capsule одинаково выглядит с Toolbar
     (Reset/Clear). При открытии border темнее (--g300) для подсветки. */
  border: 1px solid var(--g200);
  border-radius: 5px;
  overflow: hidden;
  transition: border-color 0.15s var(--ease);
  z-index: 1;

  &[data-open='true'] {
    border-color: var(--g300);
    z-index: 200;
  }
  &[data-open='true'] > button:first-child {
    border-bottom: 1px solid var(--g200);
    border-radius: 0;
  }
`;
/* Stack контейнер для options inside SelectDd. Появляется только при open.
   Fade-in анимация (короткая) — options "проявляются" внутри Panel. */
export const SelectDdMenu = styled.div `
  display: flex;
  flex-direction: column;
  width: 100%;
  animation: sr-dd-fade 0.12s var(--ease);
`;
/* Option button внутри SelectDdMenu. Icon-only: width=trigger (30px),
   height = trigger (30px), без отдельного border-radius (radius даёт
   Panel сверху). По pattern metricTimeSeries — active state НЕ выделен
   фоном, только цвет иконки (--c-sky). */
export const SelectDdItem = styled.button `
  appearance: none;
  border: none;
  background: transparent;
  color: var(--g500);
  cursor: pointer;
  width: 100%;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 0;
  transition: background 0.12s var(--ease), color 0.12s var(--ease);

  &:hover {
    background: var(--g200);
    color: var(--ink);
  }
  /* Active option скрыта в menu — она показана в trigger вверху Panel,
     повтор не нужен. Pattern из metricTimeSeries DropdownItem. */
  &.on {
    display: none;
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }
  .sdd-icon {
    width: 14px;
    height: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    svg { width: 100%; height: 100%; }
  }

  /* ADR-0001 mobile-first: touch target 44×44 на coarse pointer */
  @media (pointer: coarse) {
    height: 44px;
  }
`;
export const SearchWrap = styled.div `
  position: relative;
  display: flex;
  align-items: center;
  width: 200px;

  .search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    color: var(--g500);
    pointer-events: none;
  }
  .search-clear {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--g500);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: none;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    svg {
      width: 9px;
      height: 9px;
    }
    &:hover {
      color: var(--ink);
      background: var(--g200);
    }

    /* ADR-0001 mobile-first: расширяем кликабельную зону на touch */
    @media (pointer: coarse) {
      width: 32px;
      height: 32px;
    }
  }
  &.has-value .search-clear {
    display: flex;
  }
`;
export const SearchInput = styled.input `
  width: 100%;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 7px 10px 7px 28px;
  height: 30px;
  color: var(--ink);
  font-family: var(--f);
  font-size: var(--fs-meta);
  font-weight: 500;
  outline: none;
  transition: border-color 0.15s var(--ease);

  &:hover {
    border-color: var(--g300);
  }
  &:focus {
    border-color: var(--c-sky);
  }
  &::placeholder {
    color: var(--g500);
  }
`;
export const SearchSelectBtn = styled.button `
  margin-left: 6px;
  display: none;
  align-items: center;
  gap: 4px;
  background: var(--c-sky);
  border: 1px solid var(--c-sky);
  color: var(--on-accent);
  border-radius: 7px;
  padding: 0 10px;
  height: 30px;
  font-family: var(--m);
  font-size: var(--fs-nano);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: 0.15s;
  white-space: nowrap;

  &:hover {
    filter: brightness(1.1);
  }
  &.visible {
    display: inline-flex;
  }
  svg {
    width: 11px;
    height: 11px;
  }
`;
export const ChartArea = styled.div `
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 280px;
  margin-bottom: 14px;
  user-select: none;
  cursor: grab;
  /* Скругление углов чарта: квадрант-background, gridlines и точки
     обрезаются по rounded corners, чтобы визуально совпадало с
     border-radius CardRoot (10px). */
  border-radius: 10px;
  overflow: hidden;

  &.panning {
    cursor: grabbing;
  }
  &.mode-select {
    cursor: crosshair;
  }
  &.mode-select .pt,
  &.mode-select .qa-bg-rect {
    pointer-events: none;
  }
`;
export const ChartSvg = styled.svg `
  display: block;
  width: 100%;
  height: 100%;

  /* Bubble mount animation — играет ОДИН раз при первом появлении точек.
     SVG-specific: transform-box: fill-box + transform-origin центр круга,
     иначе scale идёт от SVG (0,0). Easing с лёгким overshoot (back-out) —
     soft "pop" эффект, в стиле проекта. */
  @keyframes pt-mount {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    60% {
      opacity: 1;
      transform: scale(1.15);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  &.is-mount .pt {
    transform-box: fill-box;
    transform-origin: center;
    animation: pt-mount 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) both;
    animation-delay: calc(var(--anim-i, 0) * 3ms);
  }

  .pt {
    cursor: pointer;
    transition: opacity 0.15s var(--ease), stroke-width 0.15s var(--ease);
    outline: none;
  }
  .pt:focus-visible {
    stroke: var(--ink);
    stroke-width: 3;
  }
  .pt.dim {
    opacity: 0.1;
    pointer-events: none;
  }
  .pt.found {
    stroke: var(--ink);
    stroke-width: 2;
    pointer-events: auto !important;
  }
  /* .pt.bad — зарезервированный стиль (как в мокапе). На точках сейчас не
     применяется; селекция «хуже плана» работает через activeFilters → .found.
     Сохранён 1:1 с прототипом для возможного будущего использования. */
  .pt.bad {
    stroke: var(--dn);
    stroke-width: 2;
  }
  .pt.worst-mark {
    stroke: var(--ink);
    stroke-width: 1.5;
  }
`;
export const SelectionOverlay = styled.div `
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;

  .selection-rect {
    position: absolute;
    border: 1.5px dashed var(--c-sky);
    background: var(--selection-tint);
    border-radius: 2px;
  }

  .selection-lasso {
    fill: var(--selection-tint);
    stroke: var(--c-sky);
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
  }
`;
export const QuadAnnot = styled.button `
  /* Плашка теперь кликабельная (button) — клик = bulk select stores quadrant'a.
     Раньше выделение шло через клик на background quadrant rect (qa-bg-rect),
     теперь только через эту плашку (по запросу юзера). */
  appearance: none;
  position: absolute;
  font-family: var(--m);
  letter-spacing: 0.02em;
  z-index: 5;
  background: var(--annot-bg);
  backdrop-filter: blur(4px);
  border: 1px solid var(--g300);
  border-radius: 7px;
  padding: 7px 10px 8px;
  min-width: 90px;
  text-align: ${(p) => (p.side === 'right' ? 'right' : 'left')};
  cursor: pointer;
  transition: border-color 0.15s var(--ease), transform 0.12s var(--ease);

  [data-theme='light'] & {
    border-color: var(--g200);
  }
  &:hover {
    border-color: currentColor;
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  &.on {
    border-color: currentColor;
    box-shadow: 0 0 0 1px currentColor;
  }

  /* DS v2.0 P0: 8.5px → --fs-nano (10) UPPER. Минимум 10 для UPPER quadrant labels */
  .qa-label {
    font-size: var(--fs-nano);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 3px;
  }
  .qa-count {
    font-family: var(--f);
    font-size: var(--fs-interactive);
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.01em;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;

    .u {
      font-size: var(--fs-nano);
      font-weight: 700;
      color: var(--g500);
      margin-left: 3px;
      font-family: var(--m);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  }
  .qa-loss {
    font-size: var(--fs-nano);
    font-weight: 700;
    color: var(--g500);
    margin-top: 2px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`;
export const Legend = styled.div `
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
  padding-top: 6px;
`;
export const LegendItem = styled.button `
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;
  background: none;
  border: none;
  padding: 2px 4px;
  border-radius: 6px;

  &.off {
    opacity: 0.35;
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  .lg-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .lg-l {
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 600;
    color: var(--g600);
    letter-spacing: 0.03em;
  }
  &:hover .lg-l {
    color: var(--ink);
  }

  /* ADR-0001 mobile-first: touch target 44×44 на coarse pointer */
  @media (pointer: coarse) {
    min-height: 44px;
    padding: 8px 10px;
  }
`;
export const Footer = styled.div `
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--g200);
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g500);
  letter-spacing: 0.03em;
  flex-shrink: 0;
  flex-wrap: wrap;

  .hint {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  /* DS 2.0 canonical: .hi/.hi-sep/.hi-arrow вместо .hint-item — единая семантика. */
  .hi,
  .hint-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  /* DS 2.0: иконки 16px (раньше 11px — мелковато). */
  .hi svg,
  .hint-item svg {
    width: 16px;
    height: 16px;
    color: var(--g500);
    flex-shrink: 0;
  }
  .hi .hi-arrow {
    /* Типографический «◂» внутри hint-текста. */
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    color: var(--g700);
    margin-right: 2px;
    vertical-align: -1px;
  }
  .hi-sep {
    /* Вертикальный разделитель между подсказками. */
    display: inline-block;
    width: 1px;
    height: 14px;
    background: var(--g300);
    margin: 0 4px;
    vertical-align: middle;
  }
  kbd {
    display: inline-block;
    background: var(--g100);
    border: 1px solid var(--g300);
    border-radius: 3px;
    padding: 1px 5px;
    font-family: var(--m);
    font-size: var(--fs-nano);
    font-weight: 700;
    color: var(--g700);
    line-height: 1;
    vertical-align: baseline;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`;
/**
 * Popup при ховере на «кучу» магазинов (overlap >1 в радиусе курсора).
 * Кликабельный (pointer-events: auto), в отличие от Tooltip.
 * Click по строке = cross-filter, Ctrl+Click = детализация магазина.
 */
export const OverlapList = styled.div `
  position: fixed;
  background: var(--s);
  border: 1px solid var(--g300);
  border-radius: 10px;
  padding: 6px;
  box-shadow: var(--tooltip-shadow);
  font-family: var(--f);
  color: var(--ink);
  pointer-events: auto;
  z-index: 2001;
  min-width: 220px;
  max-width: 320px;
  max-height: 320px;
  overflow-y: auto;
  display: none;
  animation: sr-tt-fade 0.12s var(--ease);

  &[data-visible='true'] {
    display: block !important;
  }
  /* Locked-mode (Ctrl зажат): рамка и подсветка синим (--c-sky),
     консистентно с focus-outline InfoHint и StoreDrillModal. */
  &[data-locked='true'] {
    border-color: var(--c-sky, #3b8bd9);
    box-shadow:
      0 0 0 1px var(--c-sky, #3b8bd9),
      var(--tooltip-shadow);
  }
  &[data-locked='true'] .ol-foot {
    color: var(--c-sky, #3b8bd9);
  }

  /* Стилизованный scrollbar — тонкий, нейтральный, прозрачный track.
     Дефолтный системный (см. скриншот) выглядит чужеродно в dark popup'е. */
  scrollbar-width: thin;
  scrollbar-color: var(--g300) transparent;
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--g300);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--g400);
    background-clip: content-box;
  }

  .ol-head {
    font-family: var(--m);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--g500);
    padding: 4px 8px 6px;
    border-bottom: 1px solid var(--g200);
    margin-bottom: 4px;
  }
  .ol-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.12s;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    color: var(--ink);
    font-family: var(--f);
    font-size: 12px;
  }
  .ol-row:hover,
  .ol-row:focus-visible {
    background: var(--g100);
    outline: none;
  }
  .ol-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ol-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }
  .ol-meta {
    font-family: var(--m);
    font-size: 10px;
    color: var(--g500);
    letter-spacing: 0.02em;
    flex-shrink: 0;
  }
  .ol-foot {
    font-family: var(--m);
    font-size: 9px;
    color: var(--g500);
    letter-spacing: 0.02em;
    padding: 4px 8px 2px;
    margin-top: 4px;
    border-top: 1px solid var(--g200);
  }
  .ol-foot kbd {
    display: inline-block;
    background: var(--g100);
    border: 1px solid var(--g300);
    border-radius: 3px;
    padding: 1px 4px;
    font-family: var(--m);
    font-size: 9px;
    font-weight: 700;
    color: var(--g700);
    line-height: 1;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`;
export const Tooltip = styled.div `
  /* Tooltip = position: fixed → рендерится в body, ВНЕ container query scope
     CardRoot. CSS-переменные --fs-* недоступны, поэтому используем fixed px. */
  position: fixed;
  /* DS 2.1 §08 «Тултипы»: tooltip того же тона что Card surface (НЕ инверт). */
  background: var(--s);
  color: var(--ink);
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: var(--tooltip-shadow);
  font-family: var(--f);
  font-size: 11px;
  pointer-events: none;
  /* z-index 2002 > OverlapList 2001 (см. showTooltipBesidePopup). */
  z-index: 2002;
  max-width: 240px;
  display: none;
  animation: sr-tt-fade 0.12s var(--ease);

  /* !important — защита от перебивания глобальными стилями Superset
     (тематические [role="tooltip"] правила) */
  &[data-visible='true'] {
    display: block !important;
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

    &.up {
      color: var(--up);
    }
    &.dn {
      color: var(--dn);
    }
    &.wn {
      color: var(--g500);
    }
  }
  .tt-status-text {
    margin-top: 8px;
    padding: 7px 9px;
    background: var(--g50);
    border: 1px solid var(--g200);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.005em;
  }
  .tt-foot {
    margin-top: 9px;
    padding-top: 9px;
    border-top: 1px solid var(--g200);
    font-family: var(--m);
    font-size: 11px;
    font-weight: 500;
    color: var(--g500);
    letter-spacing: 0.02em;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .tt-foot kbd {
    display: inline-block;
    background: var(--g200);
    border: 1px solid var(--g300);
    border-radius: 3px;
    padding: 1px 4px;
    font-family: var(--m);
    font-size: 10px;
    font-weight: 700;
    color: var(--g700);
    line-height: 1;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`;
/* ============================================================
 * Modals
 * ============================================================ */
export const ModalBg = styled.div `
  position: fixed;
  inset: 0;
  /* Scrim 0.65 + blur 3px — canonical. var(--modal-scrim) убран:
     при portal-рендере не резолвится, fallback на explicit rgba надёжнее. */
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
  animation: sr-m-fade 0.15s var(--ease);

  &[data-open='true'] {
    display: flex;
  }
`;
export const Modal = styled.div `
  /* DS v2.1 §06: контейнер = bg --s, border 1px --g200, radius 10px,
     padding 16×20. Для модали увеличиваем radius до 12 (визуальная
     иерархия — modal крупнее card) и padding до 20×24 (комфортные
     отступы для нескольких секций stat-cards/list/footer). */
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 12px;
  padding: 20px 24px;
  width: 100%;
  max-width: 880px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--modal-shadow);
  animation: sr-m-pop 0.2s var(--ease);
  color: var(--ink);

  .m-head {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 18px;
  }
  .m-status {
    width: 8px;
    border-radius: 3px;
    flex-shrink: 0;
    align-self: stretch;
    min-height: 40px;
  }
  .m-titles {
    flex: 1;
    min-width: 0;
  }
  .m-title {
    /* DS v2.0 fluid: --fs-subtitle (16-20) для модального заголовка */
    font-size: var(--fs-subtitle);
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.01em;
    line-height: 1.25;
    margin-bottom: 2px;
  }
  .m-sub {
    font-size: var(--fs-meta);
    font-weight: 500;
    color: var(--g500);
    font-family: var(--m);
    letter-spacing: 0.01em;
  }
  .m-close {
    background: transparent;
    border: 1px solid var(--g300);
    border-radius: 7px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--g500);
    cursor: pointer;
    flex-shrink: 0;
    transition: 0.15s;

    &:hover {
      color: var(--ink);
      border-color: var(--g500);
    }
    svg {
      width: 14px;
      height: 14px;
    }

    /* ADR-0001 mobile-first: touch target 44×44 на coarse pointer */
    @media (pointer: coarse) {
      width: 44px;
      height: 44px;
    }
  }
  .m-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 22px;
  }
  @media (max-width: 640px) {
    .m-summary {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .m-stat {
    background: var(--g50);
    border: 1px solid var(--g200);
    border-radius: 10px;
    padding: 12px 14px;
  }
  .m-stat-l {
    /* DS v2.1 §10: <14px текст — только --ink/--g700/--g600, --g500 запрещён.
       Был --g500, поднят до --g600 для контраста. */
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--g600);
    font-family: var(--m);
    margin-bottom: 6px;
  }
  .m-stat-v {
    /* DS v2.0 fluid: --fs-subtitle (16-20) для KPI value в модалке */
    font-size: var(--fs-subtitle);
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.02em;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;

    .u {
      font-weight: 600;
      color: var(--g500);
      font-size: var(--fs-micro);
      margin-left: 2px;
    }
  }
  .m-stat-d {
    font-size: var(--fs-micro);
    font-weight: 600;
    font-family: var(--m);
    margin-top: 4px;

    &.up {
      color: var(--up);
    }
    &.dn {
      color: var(--dn);
    }
    &.wn {
      color: var(--g500);
    }
  }
  .m-section {
    margin-bottom: 20px;
  }
  .m-section:last-child {
    margin-bottom: 0;
  }
  .m-section-l {
    /* DS v2.1 §10: <14px текст — минимум --g600 для контраста. */
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--g600);
    font-family: var(--m);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .count {
      color: var(--g700);
      font-weight: 700;
    }
  }
  .m-grid-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  @media (max-width: 760px) {
    .m-grid-2col {
      grid-template-columns: 1fr;
    }
  }
`;
export const BulletRow = styled.div `
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr) 110px;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 10px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  .m-br-label {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 700;
    color: var(--g500);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .m-br-chart {
    position: relative;
    height: 14px;
  }
  .m-br-band {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    border-radius: 3px;
  }
  .m-br-band-1 {
    background: var(--g100);
    width: 100%;
  }
  .m-br-band-2 {
    background: var(--g200);
  }
  .m-br-band-3 {
    background: var(--g300);
  }
  .m-br-bar {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 0;
    height: 6px;
    border-radius: 2px;
    z-index: 2;
  }
  .m-br-target {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 2.5px;
    background: var(--ink);
    z-index: 3;
    border-radius: 1.5px;

    &::before,
    &::after {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 2px;
      background: var(--ink);
      border-radius: 1px;
    }
    &::before {
      top: -2px;
    }
    &::after {
      bottom: -2px;
    }
  }
  .m-br-val {
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 700;
    text-align: right;
    letter-spacing: -0.005em;
    font-variant-numeric: tabular-nums;

    .plan-note {
      display: block;
      font-size: var(--fs-nano);
      font-weight: 700;
      color: var(--g500);
      margin-top: 1px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  }
`;
export const StoreRow = styled.div `
  display: grid;
  grid-template-columns: minmax(0, 1fr) 60px minmax(120px, 180px) 60px minmax(120px, 180px);
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--g50);
  border: 1px solid var(--g200);
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: var(--g100);
  }

  .rank {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 700;
    color: var(--g500);
    text-align: center;
  }
  .name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-meta);
    font-weight: 600;
    color: var(--ink);
    min-width: 0;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
    .city {
      color: var(--g500);
      font-weight: 500;
      font-size: var(--fs-micro);
      font-family: var(--m);
      margin-left: 6px;
    }
  }
  .cell-v {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: -0.005em;
    text-align: right;
    font-variant-numeric: tabular-nums;

    &.up {
      color: var(--up);
    }
    &.dn {
      color: var(--dn);
    }
    &.wn {
      color: var(--g500);
    }
  }
  .mini-bullet {
    height: 7px;
    background: var(--g200);
    border-radius: 2px;
    position: relative;
  }
  .mini-bar {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 5px;
    border-radius: 1px;
  }
  .mini-bar.mini-bar--x {
    background: var(--c-tangerine);
  }
  .mini-bar.mini-bar--y {
    background: var(--c-sky);
  }
  .mini-target {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 2px;
    background: var(--ink);
    border-radius: 1px;
  }
`;
export const Skeleton = styled.div `
  background: var(--g100);
  border-radius: 6px;
  animation: sr-skel-pulse 1.4s ease-in-out infinite;
`;
export const EmptyBlock = styled.div `
  padding: 24px 12px;
  text-align: center;
  color: var(--g500);
  font-family: var(--m);
  font-size: var(--fs-meta);
`;
//# sourceMappingURL=styles.js.map