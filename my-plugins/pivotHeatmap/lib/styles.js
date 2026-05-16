"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaleBar = exports.PartialBadge = exports.DrillHelperText = exports.SkeletonGrid = exports.StateOverlay = exports.CmpTable = exports.DrillBars = exports.DrillSectionTitle = exports.DrillSummary = exports.ModalBody = exports.ModalClose = exports.ModalTitle = exports.ModalHead = exports.Modal = exports.ModalBackdrop = exports.ModalRoot = exports.ColProfile = exports.Tooltip = exports.HintBar = exports.ScaleItem = exports.Scale = exports.Footer = exports.Cell = exports.Pivot = exports.PivotWrap = exports.AxisDropdownItem = exports.AxisDropdownMenu = exports.AxisDropdownTrigger = exports.AxisDropdownPanel = exports.AxisDropdownGhost = exports.AxisDropdownRoot = exports.Chip = exports.UnitButton = exports.Unit = exports.Controls = exports.BreadcrumbBack = exports.BreadcrumbSel = exports.BreadcrumbPlus = exports.BreadcrumbDot = exports.BreadcrumbCurrent = exports.Breadcrumbs = exports.MockBadge = exports.Title = exports.TitleBlock = exports.Header = exports.Card = exports.Root = exports.KEYFRAMES_CSS = exports.ROOT_CLASS = void 0;
const core_1 = require("@superset-ui/core");
const react_1 = require("@emotion/react");
const themeTokens_1 = require("./themeTokens");
/*
 * Design System v2.0 tokens as CSS custom properties.
 *
 * Pattern mirrors kpiCard — light defaults on :root, dark switched via
 * `data-theme="dark"` attribute. Prototype `ref/heatmap-pivot-prototype.html`
 * translated one-to-one into Emotion styled components.
 */
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
exports.ROOT_CLASS = 'heatmap-pivot';
// DS 2.0 canonical card mount animation. Через emotion keyframes() helper —
// race-condition-free относительно <style dangerouslySetInnerHTML> (см. donut).
const cardInKf = (0, react_1.keyframes) `
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;
/*
 * Keyframes injected via <style> in component. DS 2.0 §08:
 *  - skeleton shimmer: --g100, opacity 0.4 → 0.7, длительность 0.8s
 *  - prefers-reduced-motion: все анимации отключаются (DS §08, WCAG 2.3.3)
 */
exports.KEYFRAMES_CSS = `
@keyframes hp-fade-in { from{opacity:0} to{opacity:1} }
@keyframes hp-modal-in {
  from{opacity:0;transform:translateY(10px) scale(.98)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
@keyframes hp-skeleton-pulse {
  0%{opacity:.4} 50%{opacity:.7} 100%{opacity:.4}
}
@keyframes hp-stale-slide {
  0%{background-position:200% 0}
  100%{background-position:-200% 0}
}
@media (prefers-reduced-motion: reduce) {
  .heatmap-pivot *, .heatmap-pivot *::before, .heatmap-pivot *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
@media print {
  /* DS 2.0 §14: фоны → белый, скрыть тултипы/тоглы/контролы, page-break-inside:avoid */
  .heatmap-pivot {
    background: #fff !important;
    color: #000 !important;
    box-shadow: none !important;
    page-break-inside: avoid;
  }
  .heatmap-pivot button,
  .heatmap-pivot [role='tooltip'],
  .heatmap-pivot [aria-hidden='true'] {
    display: none !important;
  }
  .heatmap-pivot .ok,
  .heatmap-pivot .wn,
  .heatmap-pivot .dn {
    background: #fff !important;
    border: 1px solid #999 !important;
  }
  .heatmap-pivot td,
  .heatmap-pivot th {
    color: #000 !important;
    background: #fff !important;
  }
}
`;
/* ── Root container with theme tokens ── */
exports.Root = core_1.styled.div `
  --bg: ${themeTokens_1.LIGHT_TOKENS.bg};
  --s: ${themeTokens_1.LIGHT_TOKENS.s};
  --ink: ${themeTokens_1.LIGHT_TOKENS.ink};
  --g50: ${themeTokens_1.LIGHT_TOKENS.g50};
  --g100: ${themeTokens_1.LIGHT_TOKENS.g100};
  --g200: ${themeTokens_1.LIGHT_TOKENS.g200};
  --g300: ${themeTokens_1.LIGHT_TOKENS.g300};
  --g400: ${themeTokens_1.LIGHT_TOKENS.g400};
  --g500: ${themeTokens_1.LIGHT_TOKENS.g500};
  --g600: ${themeTokens_1.LIGHT_TOKENS.g600};
  --g700: ${themeTokens_1.LIGHT_TOKENS.g700};
  --up: ${themeTokens_1.LIGHT_TOKENS.up};
  --dn: ${themeTokens_1.LIGHT_TOKENS.dn};
  --wn: ${themeTokens_1.LIGHT_TOKENS.wn};
  --up-b: ${themeTokens_1.LIGHT_TOKENS.upBg};
  --dn-b: ${themeTokens_1.LIGHT_TOKENS.dnBg};
  --wn-b: ${themeTokens_1.LIGHT_TOKENS.wnBg};
  --c-sky: ${themeTokens_1.LIGHT_TOKENS.cSky};
  --c-violet: ${themeTokens_1.LIGHT_TOKENS.cViolet};
  --f: ${themeTokens_1.FONTS.text};
  --m: ${themeTokens_1.FONTS.mono};
  --sh: 0 1px 3px rgba(15, 17, 20, 0.06);
  --modal-scrim: rgba(0, 0, 0, 0.55);

  &[data-theme='dark'] {
    --bg: ${themeTokens_1.DARK_TOKENS.bg};
    --s: ${themeTokens_1.DARK_TOKENS.s};
    --ink: ${themeTokens_1.DARK_TOKENS.ink};
    --g50: ${themeTokens_1.DARK_TOKENS.g50};
    --g100: ${themeTokens_1.DARK_TOKENS.g100};
    --g200: ${themeTokens_1.DARK_TOKENS.g200};
    --g300: ${themeTokens_1.DARK_TOKENS.g300};
    --g400: ${themeTokens_1.DARK_TOKENS.g400};
    --g500: ${themeTokens_1.DARK_TOKENS.g500};
    --g600: ${themeTokens_1.DARK_TOKENS.g600};
    --g700: ${themeTokens_1.DARK_TOKENS.g700};
    --up: ${themeTokens_1.DARK_TOKENS.up};
    --dn: ${themeTokens_1.DARK_TOKENS.dn};
    --wn: ${themeTokens_1.DARK_TOKENS.wn};
    --up-b: ${themeTokens_1.DARK_TOKENS.upBg};
    --dn-b: ${themeTokens_1.DARK_TOKENS.dnBg};
    --wn-b: ${themeTokens_1.DARK_TOKENS.wnBg};
    --c-sky: ${themeTokens_1.DARK_TOKENS.cSky};
    --c-violet: ${themeTokens_1.DARK_TOKENS.cViolet};
    --sh: 0 1px 3px rgba(0, 0, 0, 0.3);
    --modal-scrim: rgba(0, 0, 0, 0.7);
  }

  width: 100%;
  height: 100%;
  /* DS v2.0: container query для fluid типографики (cqi растёт с шириной карточки) */
  container-type: inline-size;
  container-name: heatmap;
  box-sizing: border-box;
  overflow: visible;
  display: flex;
  flex-direction: column;
  font-family: var(--f);
  color: var(--ink);
  /* DS v2.0 §02: tabular-nums наследуется на всю карточку (heatmap, тултипы,
     бейджи, totals — числа выровнены по ширине). */
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
`;
/* ── Card ── */
exports.Card = core_1.styled.div `
  /* DS 2.0 §06: padding space-4 × space-6 (16×20px) */
  position: relative;
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 16px 20px;
  overflow: hidden;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  box-shadow: var(--sh);
  /* DS 2.0 mount animation. fill-mode both — initial state мгновенно. При
     переходе loading/error → populated React unmount'ит соответствующий
     Card и mount'ит новый → animation запускается ровно когда юзер видит
     реальный контент. */
  animation: ${cardInKf} 0.5s ${EASE} both;
`;
exports.Header = core_1.styled.div `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;
exports.TitleBlock = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;
exports.Title = core_1.styled.div `
  /* DS 2.0 §02: «Заголовок секции» — единый стандарт со scorecard CardTitle */
  font-family: var(--f);
  font-size: var(--fs-body);
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.3;
  text-transform: uppercase;
  color: var(--ink);
`;
/* DS 2.0 «Статусный бейдж ТЕСТ» — 1:1 со scorecard MockBadge.
   Mono nano UPPER warning-цвет, superscript-effect (top:-2px). */
exports.MockBadge = core_1.styled.span `
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
exports.Breadcrumbs = core_1.styled.div `
  /* DS 2.0 §02 fluid: --fs-micro для breadcrumb (≥11) */
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 500;
  color: var(--g600);
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 16px;
  flex-wrap: wrap;
`;
exports.BreadcrumbCurrent = core_1.styled.span `
  color: var(--g700);
  font-weight: 500;
`;
exports.BreadcrumbDot = core_1.styled.span `
  color: var(--g300);
`;
exports.BreadcrumbPlus = core_1.styled.span `
  color: var(--g300);
  margin: 0 4px;
`;
exports.BreadcrumbSel = core_1.styled.span `
  color: var(--ink);
  font-weight: 600;
`;
exports.BreadcrumbBack = core_1.styled.button `
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--m);
  /* DS 2.0: ◂ back-button — крупный (18px/700), читается с дистанции. */
  font-size: 18px;
  font-weight: 700;
  color: var(--g600);
  padding: 0 6px;
  border-radius: 6px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  min-width: 22px;
  transition: color 0.15s ${EASE}, background 0.15s ${EASE};

  &:hover {
    color: var(--ink);
    background: var(--g100);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
exports.Controls = core_1.styled.div `
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
`;
exports.Unit = core_1.styled.div `
  /* 1:1 с scorecard ToggleGroup / donut UnitToggle — единый размер на всех ext-* */
  box-sizing: border-box;
  display: flex;
  gap: 2px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 2px;
  height: 30px;
  flex-shrink: 0;
`;
exports.UnitButton = core_1.styled.button `
  /* 1:1 с scorecard ToggleButton — JetBrains Mono UPPER, height 24px, br 6px */
  box-sizing: border-box;
  border: none;
  background: ${({ on }) => (on ? 'var(--c-sky)' : 'transparent')};
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${({ on }) => (on ? 'var(--s)' : 'var(--g500)')};
  padding: 0 11px;
  height: 24px;
  min-width: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  line-height: 1;

  &:hover {
    color: ${({ on }) => (on ? 'var(--s)' : 'var(--ink)')};
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
exports.Chip = core_1.styled.button `
  /* Σ-chip: standalone-кнопка с такой же геометрией, как scorecard ToggleGroup
     (height 30px, border-radius 6px). Содержимое — только Σ. */
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ on }) => (on ? 'var(--c-sky)' : 'var(--g100)')};
  border: 1px solid ${({ on }) => (on ? 'var(--c-sky)' : 'var(--g200)')};
  border-radius: 6px;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  color: ${({ on }) => (on ? 'var(--s)' : 'var(--g500)')};
  padding: 0 11px;
  height: 30px;
  min-width: 32px;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  letter-spacing: 0.02em;
  line-height: 1;

  &:hover {
    color: ${({ on }) => (on ? 'var(--s)' : 'var(--ink)')};
    border-color: ${({ on }) => (on ? 'var(--c-sky)' : 'var(--g300)')};
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }

  .sigma {
    font-family: var(--m);
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
  }
`;
/* ── Axis Dropdown (collapsible group selector — like metricTimeSeries) ── */
exports.AxisDropdownRoot = core_1.styled.div `
  position: relative;
  display: inline-block;
  height: 30px;
  flex-shrink: 0;
`;
/** Невидимый «ghost» — занимает место по самой длинной опции, чтобы Root
 *  имел стабильную ширину независимо от выбранного label. */
exports.AxisDropdownGhost = core_1.styled.span `
  visibility: hidden;
  pointer-events: none;
  display: block;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 0 11px;
  height: 30px;
  line-height: 30px;
  white-space: nowrap;
  /* +2px на ширину border (1px×2) панели сверху */
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: 6px;
`;
exports.AxisDropdownPanel = core_1.styled.div `
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: var(--g100);
  border: 1px solid ${({ open }) => (open ? 'var(--g300)' : 'var(--g200)')};
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.15s ${EASE};
  z-index: ${({ open }) => (open ? 200 : 1)};

  &[data-open='true'] > button:first-of-type {
    border-bottom: 1px solid var(--g200);
  }
`;
exports.AxisDropdownTrigger = core_1.styled.button `
  /* Активная опция: без bg/стрелочки, текст по центру panel-ширины.
     padding-top: 2px компенсирует оптический сдвиг кириллицы вверх (Mono-cap-height). */
  box-sizing: border-box;
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ink);
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-align: center;
  padding: 2px 11px 0;
  height: 28px;
  width: 100%;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
`;
exports.AxisDropdownMenu = core_1.styled.div `
  display: flex;
  flex-direction: column;
  width: 100%;
  animation: hp-fade-in 0.12s ${EASE};
`;
exports.AxisDropdownItem = core_1.styled.button `
  /* Активный пункт скрыт (он уже показан в trigger). hover — только смена цвета,
     без bg-подсветки (по требованию UX — лишняя визуальная нагрузка). */
  box-sizing: border-box;
  appearance: none;
  border: none;
  background: transparent;
  color: var(--g500);
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-align: center;
  cursor: pointer;
  width: 100%;
  height: 28px;
  display: ${({ active }) => (active ? 'none' : 'flex')};
  align-items: center;
  justify-content: center;
  padding: 2px 11px 0;
  border-radius: 0;
  line-height: 1;
  transition: color 0.12s ${EASE};
  white-space: nowrap;

  &:hover {
    color: var(--ink);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }
`;
/* ── Pivot table ── */
exports.PivotWrap = core_1.styled.div `
  position: relative;
  overflow: auto;
  flex: 1;
  min-height: 0;

  /* DS 2.0: thin scrollbar (Firefox + WebKit), цвета через токены, авто-смена темы */
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
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--g400);
  }
  &::-webkit-scrollbar-corner {
    background: transparent;
  }
`;
exports.Pivot = core_1.styled.table `
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  font-variant-numeric: tabular-nums;

  thead th {
    /* DS 2.0 §02: column-header Manrope UPPER (кириллица читаемее, чем Mono) */
    position: sticky;
    top: 0;
    z-index: 3;
    background: var(--s);
    font-family: var(--f);
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--g700);
    text-align: left;
    padding: 10px 14px;
    border-bottom: 1px solid var(--g200);
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ${EASE}, color 0.15s ${EASE};
    min-width: 130px;
  }
  thead th:hover {
    color: var(--ink);
    background: var(--g50);
  }
  thead th.sorted {
    color: var(--ink);
  }
  thead th.corner {
    cursor: default;
  }
  thead th.corner:hover {
    background: var(--s);
    color: var(--g700);
  }
  thead th .sort-arrow {
    display: inline-block;
    margin-left: 6px;
    font-family: var(--m);
    font-size: var(--fs-micro);
    color: var(--c-sky);
    vertical-align: baseline;
  }
  thead th:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }

  tbody th {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--s);
    font-family: var(--f);
    font-size: var(--fs-meta);
    font-weight: 500;
    color: var(--g600);
    text-align: left;
    padding: 0 14px;
    border-right: 1px solid var(--g200);
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition: color 0.15s ${EASE}, background 0.15s ${EASE};
    min-width: 140px;
    height: 48px;
  }
  tbody th:hover {
    color: var(--ink);
    background: var(--g50);
  }
  tbody th:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }

  td {
    padding: 6px;
    vertical-align: middle;
    position: relative;
    user-select: none;
  }

  /* Hover highlight row/col */
  tr.row-hl th,
  tr.row-hl td {
    background: var(--g50);
  }
  td.col-hl .cell:not(.nd),
  thead th.col-hl {
    background: var(--g50);
  }
  thead th.col-hl {
    color: var(--ink);
  }

  /* Filtered axis */
  thead th.filtered,
  tbody th.filtered {
    color: #fff;
    background: var(--c-sky);
  }
  thead th.filtered:hover,
  tbody th.filtered:hover {
    background: var(--c-sky);
    color: #fff;
    filter: brightness(1.1);
  }

  /* Totals row/col — sticky */
  tr.totals-row th,
  tr.totals-row td {
    position: sticky;
    bottom: 0;
    z-index: 2;
    background: var(--s);
    border-top: 1px solid var(--g200);
  }
  tr.totals-row th {
    font-weight: 700;
    color: var(--ink);
    text-transform: uppercase;
    font-size: var(--fs-nano);
    letter-spacing: 0.08em;
    z-index: 4;
  }
  .totals-col {
    position: sticky;
    right: 0;
    z-index: 3;
    background: var(--s);
    border-left: 1px solid var(--g200);
  }
  thead th.totals-col {
    z-index: 5;
    text-transform: uppercase;
    font-size: var(--fs-nano);
    letter-spacing: 0.08em;
    color: var(--ink);
  }
  tr.totals-row td.totals-col {
    z-index: 5;
  }
`;
/* ── Cell ──
 * DS 2.0 §07 (WCAG 1.4.1): цвет никогда не единственный индикатор.
 * Status-icon в верхнем правом углу: ✓ ok, △ wn, ▲ dn.
 * .nd использует диагональную штриховку (паттерн заливки).
 */
exports.Cell = core_1.styled.div `
  /*
   * Сознательное отклонение от DS 2.0 §02 (рекомендация 13–14px для основного текста):
   * heatmap-ячейки требуют компактности 35-50 ячеек на экран. Используем 12px моно
   * (соответствует AntD fontSizeSM). На tablet/mobile увеличиваем до 13px.
   * Контраст: цвет текста --up/--wn/--dn на тинте --up-b/--wn-b/--dn-b — pass WCAG AA
   * для 12px (контраст ≥ 4.5:1 проверен в DS 2.0 §10).
   */
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  border-radius: 8px;
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 600;
  color: var(--g700);
  transition: all 0.15s ${EASE};
  cursor: pointer;
  position: relative;
  font-variant-numeric: tabular-nums;

  @media (max-width: 1024px) {
    height: 48px;
  }
  @media (max-width: 428px) {
    height: 52px;
  }

  /* Status-icon скрыт по требованию UX — статус считывается только цветом
     (фон + текст). Узлы оставлены в DOM ради aria-label с расшифровкой. */
  .status-icon {
    display: none;
  }

  &.ok {
    background: var(--up-b);
    color: var(--up);
  }
  &.wn {
    background: var(--wn-b);
    color: var(--wn);
  }
  &.dn {
    background: var(--dn-b);
    color: var(--dn);
  }
  &.nd {
    /* DS 2.0 §10: --g400 запрещён для текста <18px (контраст 2.6:1, fail WCAG AA).
       Используем --g600 (5.9:1 на bg) — pass AA для 12px. */
    background: repeating-linear-gradient(
      45deg,
      transparent 0,
      transparent 6px,
      var(--g100) 6px,
      var(--g100) 7px
    );
    color: var(--g600);
    cursor: default;
    font-weight: 500;
  }

  &:hover:not(.nd) {
    transform: translateY(-1px);
    box-shadow: var(--sh);
    filter: brightness(1.08);
  }

  &.cmp-a {
    box-shadow: inset 0 0 0 2px var(--c-sky);
  }
  &.cmp-b {
    box-shadow: inset 0 0 0 2px var(--c-violet);
  }
  &.cell-filt {
    box-shadow: inset 0 0 0 2px var(--c-sky);
  }
  &.dimmed {
    opacity: 0.22;
    filter: saturate(0.3);
  }
`;
/* ── Footer / legend ── */
exports.Footer = core_1.styled.div `
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--g200);
`;
exports.Scale = core_1.styled.div `
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
`;
exports.ScaleItem = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 7px;

  .sw {
    width: 18px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  &.ok .sw {
    background: var(--up-b);
    border: 1px solid var(--up);
  }
  &.wn .sw {
    background: var(--wn-b);
    border: 1px solid var(--wn);
  }
  &.dn .sw {
    background: var(--dn-b);
    border: 1px solid var(--dn);
  }
  &.nd .sw {
    background: repeating-linear-gradient(
      45deg,
      transparent 0,
      transparent 3px,
      var(--g300) 3px,
      var(--g300) 4px
    );
    border: 1px solid var(--g300);
  }

  .label {
    /* DS 2.0 fluid: --fs-meta для scale-label (был 10px) */
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 500;
    color: var(--g600);
    letter-spacing: 0.01em;
    white-space: nowrap;
  }
`;
exports.HintBar = core_1.styled.div `
  /* DS 2.0 fluid: --fs-meta для hint-bar (был 10px) */
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g600);
  letter-spacing: 0.01em;
  flex-wrap: wrap;
  justify-content: center;

  .hi {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  /* DS 2.0: иконки 16px (раньше 11px — не видно). */
  .hi svg {
    width: 16px;
    height: 16px;
    color: var(--g600);
    flex-shrink: 0;
  }
  .hi .hi-arrow {
    /* Типографический «◂» внутри hint-текста, той же формы что в breadcrumb. */
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
`;
/* ── Tooltip / popover ── */
exports.Tooltip = core_1.styled.div `
  position: fixed;
  z-index: 200;
  pointer-events: none;
  background: var(--ink);
  color: var(--s);
  border-radius: 6px;
  padding: 8px 12px 9px;
  box-shadow: var(--sh);
  font-family: var(--f);
  font-size: var(--fs-micro);
  max-width: 280px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.12s ${EASE}, transform 0.12s ${EASE};

  &.show {
    opacity: 1;
    transform: translateY(0);
  }
  .tt-title {
    font-weight: 600;
    font-size: var(--fs-micro);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tt-title .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  .tt-row {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 500;
    line-height: 1.55;
    display: flex;
    justify-content: space-between;
    gap: 14px;
  }
  .tt-row b {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
`;
exports.ColProfile = core_1.styled.div `
  position: fixed;
  z-index: 150;
  pointer-events: none;
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: var(--sh);
  min-width: 220px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.15s ${EASE}, transform 0.15s ${EASE};

  &.show {
    opacity: 1;
    transform: translateY(0);
  }
  .cp-t {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ink);
    margin-bottom: 6px;
  }
  .cp-r {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    font-family: var(--m);
    font-size: var(--fs-meta);
    color: var(--g600);
    line-height: 1.7;
  }
  .cp-r b {
    font-variant-numeric: tabular-nums;
    color: var(--g700);
    font-weight: 600;
  }
`;
/* ── Modals (drill + compare) ── */
exports.ModalRoot = core_1.styled.div `
  position: fixed;
  inset: 0;
  z-index: 300;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 24px;

  &.show {
    display: flex;
  }
`;
exports.ModalBackdrop = core_1.styled.div `
  position: absolute;
  inset: 0;
  background: var(--modal-scrim);
  backdrop-filter: blur(2px);
  opacity: 1;
  animation: hp-fade-in 0.18s ${EASE};
`;
exports.Modal = core_1.styled.div `
  position: relative;
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  box-shadow: var(--sh);
  max-width: min(720px, 100%);
  width: 100%;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  animation: hp-modal-in 0.2s ${EASE};
  color: var(--ink);
`;
exports.ModalHead = core_1.styled.div `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px 12px;
  border-bottom: 1px solid var(--g200);
`;
exports.ModalTitle = core_1.styled.div `
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
    color: var(--g600);
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
exports.ModalClose = core_1.styled.button `
  /* DS 2.0 §02: touch target — на tablet/mobile увеличиваем */
  border: none;
  background: var(--g100);
  color: var(--g600);
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ${EASE};
  flex-shrink: 0;

  @media (max-width: 1024px) {
    width: 44px;
    height: 44px;
  }

  &:hover {
    color: var(--ink);
    background: var(--g200);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  svg {
    width: 12px;
    height: 12px;
  }
`;
exports.ModalBody = core_1.styled.div `
  padding: 18px 22px 20px;
  overflow-y: auto;
  flex: 1;

  /* DS 2.0: thin scrollbar consistent with PivotWrap */
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
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--g400);
  }
  &::-webkit-scrollbar-corner {
    background: transparent;
  }
`;
/* ── Drill modal specifics ── */
exports.DrillSummary = core_1.styled.div `
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px 18px;
  padding: 14px 16px;
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 8px;
  margin-bottom: 18px;

  .s-l {
    /* DS v2.0: 9px → --fs-micro (минимум 11) UPPER */
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--g600);
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
  .s-v.status-ok {
    color: var(--up);
  }
  .s-v.status-wn {
    color: var(--wn);
  }
  .s-v.status-dn {
    color: var(--dn);
  }
`;
exports.DrillSectionTitle = core_1.styled.div `
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g600);
  margin-bottom: 10px;
`;
exports.DrillBars = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 10px;

  .dbf {
    display: grid;
    grid-template-columns: 140px 1fr 96px;
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
    text-align: right;
    color: var(--g700);
  }
  .dbf-v .pct {
    color: var(--g600);
    font-size: var(--fs-micro);
    margin-left: 4px;
  }
`;
/* ── Compare modal specifics ── */
exports.CmpTable = core_1.styled.table `
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-variant-numeric: tabular-nums;

  thead th {
    padding: 10px 14px 12px;
    text-align: left;
    vertical-align: bottom;
    border-bottom: 1px solid var(--g200);
    font-family: var(--f);
  }
  thead th.cmp-l {
    width: 140px;
  }
  thead th.cmp-a,
  thead th.cmp-b {
    text-align: right;
  }
  thead th.cmp-d {
    width: 72px;
    text-align: right;
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 700;
    color: var(--g600);
  }
  .cmp-h-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--m);
    font-size: var(--fs-nano);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 3px;
  }
  .cmp-h-badge .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  thead th.cmp-a .cmp-h-badge {
    color: var(--c-sky);
  }
  thead th.cmp-a .cmp-h-badge .dot {
    background: var(--c-sky);
  }
  thead th.cmp-b .cmp-h-badge {
    color: var(--c-violet);
  }
  thead th.cmp-b .cmp-h-badge .dot {
    background: var(--c-violet);
  }
  .cmp-h-name {
    font-family: var(--f);
    font-size: var(--fs-meta);
    font-weight: 700;
    color: var(--ink);
    line-height: 1.35;
    max-width: 200px;
    white-space: normal;
  }

  tbody tr {
    border-bottom: 1px solid var(--g100);
  }
  tbody tr:last-child {
    border-bottom: none;
  }
  tbody th.cmp-l {
    padding: 10px 14px;
    text-align: left;
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    color: var(--g600);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  tbody td {
    padding: 10px 14px;
    text-align: right;
    font-family: var(--m);
    font-size: var(--fs-interactive);
    font-weight: 600;
    white-space: nowrap;
  }
  tbody td.cmp-a {
    color: var(--c-sky);
  }
  tbody td.cmp-b {
    color: var(--c-violet);
  }
  tbody td.cmp-d {
    font-size: var(--fs-micro);
    font-weight: 700;
    color: var(--g600);
  }
  tbody td.cmp-d.up {
    color: var(--up);
  }
  tbody td.cmp-d.dn {
    color: var(--dn);
  }
  tbody.cmp-sub tr.cmp-sub-title td {
    padding: 14px 14px 6px;
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--g600);
    text-align: left;
    border-top: 1px solid var(--g200);
  }
  tbody.cmp-sub tr.cmp-sub-title {
    border-bottom: none;
  }
  tbody.cmp-sub td {
    font-size: var(--fs-meta);
    font-weight: 500;
    color: var(--g700);
  }
  tbody.cmp-sub td.cmp-a {
    color: var(--c-sky);
  }
  tbody.cmp-sub td.cmp-b {
    color: var(--c-violet);
  }
`;
/* ── State overlays (DS 2.0 — loading/error/empty) ── */
exports.StateOverlay = core_1.styled.div `
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--g600);
  font-family: var(--f);
  font-size: var(--fs-interactive);
  padding: 24px;
  text-align: center;
`;
exports.SkeletonGrid = core_1.styled.div `
  /* DS 2.0 §08: shimmer --g100 0.4→0.7, 0.8s */
  display: grid;
  grid-template-columns: 140px repeat(5, 1fr);
  gap: 8px;
  padding: 16px 0;

  .sk {
    height: 42px;
    background: var(--g100);
    border-radius: 8px;
    animation: hp-skeleton-pulse 0.8s ease-in-out infinite;
  }
  .sk.hdr {
    height: 24px;
  }
`;
/* DrillModal helper texts (loading / empty state) */
exports.DrillHelperText = core_1.styled.div `
  color: var(--g600);
  font-size: var(--fs-meta);
`;
/* DS 2.0 §06 «Состояния» — Partial badge: показывает что данные не
   полные (часть фильтров отвергнута). UPPER mono nano warning-цвет. */
exports.PartialBadge = core_1.styled.div `
  /* 1:1 со scorecard PartialBadge — margin-left: auto + flex-push */
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
  margin-left: auto;
`;
/* DS 2.0 §06 «Состояния» — Stale bar: тонкая sky-полоса сверху Card,
   show'ит что данные пришли из кеша (могут быть устаревшие). Slide
   animation как progress indicator. */
exports.StaleBar = core_1.styled.div `
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
  animation: hp-stale-slide 1.6s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
`;
//# sourceMappingURL=styles.js.map