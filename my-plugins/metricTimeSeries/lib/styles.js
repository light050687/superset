"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SrLive = exports.StaleLabel = exports.StaleBar = exports.PartialBadge = exports.MockBadge = exports.ErrorStateText = exports.ErrorStateIcon = exports.ErrorStateWrap = exports.EmptyStateText = exports.EmptyStateIcon = exports.EmptyStateWrap = exports.SkeletonBlock = exports.SkeletonWrap = exports.FooterSpacer = exports.LegendSeparator = exports.LegendLabel = exports.LegendMark = exports.LegendItem = exports.LegendRow = exports.HintItem = exports.Hint = exports.CardFooter = exports.BrushButton = exports.ChartInner = exports.ChartWrap = exports.DropdownItem = exports.DropdownItemIcon = exports.DropdownItemRow = exports.DropdownMenu = exports.DropdownPanel = exports.DropdownRoot = exports.UnitButton = exports.UnitToggleGroup = exports.IconButton = exports.Controls = exports.BreadcrumbBack = exports.Breadcrumb = exports.Title = exports.TitleWrap = exports.CardHead = exports.Card = exports.Root = exports.KEYFRAMES_CSS = exports.CARD_CLASS = void 0;
const core_1 = require("@superset-ui/core");
const react_1 = require("@emotion/react");
const themeTokens_1 = require("./themeTokens");
/*
 * Design System v2.0 tokens as CSS custom properties.
 * Light/dark switching via `data-theme` attribute on the root container.
 *
 * Token values are imported from themeTokens.ts (single source of truth).
 * All colors via var(--token) — никакого хардкода.
 */
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
exports.CARD_CLASS = 'wo-ts-card';
// DS 2.0 canonical card mount animation. Через emotion keyframes() helper —
// race-condition-free относительно <style dangerouslySetInnerHTML> (см. donut).
const cardInKf = (0, react_1.keyframes) `
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;
/* ── Keyframes injected via <style> in WriteoffsTimeseries.tsx ── */
exports.KEYFRAMES_CSS = `
@keyframes wo-card-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes wo-skeleton-pulse {
  0% { opacity: .12 }
  50% { opacity: .22 }
  100% { opacity: .12 }
}
@keyframes wo-dd-fade {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes wo-stale-shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}
@media (prefers-reduced-motion: never-match) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
`;
/* ── Root ── */
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
  --c-tangerine: ${themeTokens_1.LIGHT_TOKENS.cTangerine};
  --c-fuchsia: ${themeTokens_1.LIGHT_TOKENS.cFuchsia};
  --c-amber: ${themeTokens_1.LIGHT_TOKENS.cAmber};
  --c-sky-b: ${themeTokens_1.LIGHT_TOKENS.cSkyBg};
  --c-violet-b: ${themeTokens_1.LIGHT_TOKENS.cVioletBg};
  --c-tangerine-b: ${themeTokens_1.LIGHT_TOKENS.cTangerineBg};
  --c-fuchsia-b: ${themeTokens_1.LIGHT_TOKENS.cFuchsiaBg};
  --c-amber-b: ${themeTokens_1.LIGHT_TOKENS.cAmberBg};
  --f: ${themeTokens_1.FONTS.text};
  --m: ${themeTokens_1.FONTS.mono};
  --sh: 0 1px 3px rgba(15, 17, 20, 0.06);

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
    --c-tangerine: ${themeTokens_1.DARK_TOKENS.cTangerine};
    --c-fuchsia: ${themeTokens_1.DARK_TOKENS.cFuchsia};
    --c-amber: ${themeTokens_1.DARK_TOKENS.cAmber};
    --c-sky-b: ${themeTokens_1.DARK_TOKENS.cSkyBg};
    --c-violet-b: ${themeTokens_1.DARK_TOKENS.cVioletBg};
    --c-tangerine-b: ${themeTokens_1.DARK_TOKENS.cTangerineBg};
    --c-fuchsia-b: ${themeTokens_1.DARK_TOKENS.cFuchsiaBg};
    --c-amber-b: ${themeTokens_1.DARK_TOKENS.cAmberBg};
    --sh: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  width: 100%;
  height: 100%;
  /* DS v2.0: container query для fluid типографики */
  container-type: inline-size;
  container-name: mts;
  box-sizing: border-box;
  font-family: var(--f);
  -webkit-font-smoothing: antialiased;
  /* DS 2.0 hard rule §02: tabular figures for all numeric content */
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';

  * {
    box-sizing: border-box;
  }
`;
/* ── Card ── */
exports.Card = core_1.styled.div `
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 16px 20px 14px;
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  transition: border-color 0.25s ${EASE};
  /* Эмоция keyframes() — race-condition-free относительно plain CSS keyframes. */
  animation: ${cardInKf} 0.5s ${EASE} both;
  &[data-no-anim] { animation: none; }

  &:hover {
    border-color: var(--g300);
  }
`;
exports.CardHead = core_1.styled.div `
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 8px;
  flex-shrink: 0;
`;
exports.TitleWrap = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;
exports.Title = core_1.styled.div `
  /* DS 2.0 §02 «Заголовок секции»: 1-в-1 с scorecard CardTitle и
     drilldownDonut HeaderText. Manrope sans 17px / 700 / 0.05em UPPER,
     height 23.75px, display:inline-block (ширина = только текст). */
  font-family: var(--f);
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.3;
  height: 23.75px;
  display: inline-block;
  position: relative;
`;
exports.Breadcrumb = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--m);
  font-size: var(--fs-micro);
  color: var(--g600);
  letter-spacing: 0.03em;
  min-height: 16px;
`;
exports.BreadcrumbBack = core_1.styled.button `
  appearance: none;
  border: none;
  background: var(--g100);
  color: var(--g600);
  cursor: pointer;
  /* DS 2.0: ◂ back-button — крупный (18px/700/22px), читается с дистанции. */
  font-size: 18px;
  font-weight: 700;
  width: 22px;
  height: 22px;
  min-width: 22px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  line-height: 1;
  transition: all 0.15s ${EASE};

  &:hover {
    background: var(--g200);
    color: var(--ink);
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 1px;
  }
`;
exports.Controls = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;
exports.IconButton = core_1.styled.button `
  /* Trigger показывает текущее выбранное значение → визуально это
     selected-state (синий), как у unit-toggle button.on. При открытом
     меню добавляется border-bottom отделяющий trigger от options
     (через DropdownPanel[data-open="true"] селектор ниже). */
  box-sizing: border-box;
  appearance: none;
  border: none;
  background: ${({ active }) => (active ? 'var(--c-sky)' : 'transparent')};
  color: ${({ active }) => (active ? 'var(--s)' : 'var(--g500)')};
  cursor: pointer;
  width: 100%;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: var(--fs-meta);
  line-height: 1;
  transition: all 0.15s ${EASE};

  &:hover:not(:disabled) {
    color: ${({ active }) => (active ? 'var(--s)' : 'var(--ink)')};
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;
exports.UnitToggleGroup = core_1.styled.div `
  /* 1-в-1 с donut UnitToggle и scorecard ToggleGroup:
     box-sizing: border-box, height 30px, padding 2px, gap 2px,
     bg --g100, border --g200. Унифицированный «бейдж» для всех ext-*. */
  box-sizing: border-box;
  display: inline-flex;
  gap: 2px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 2px;
  height: 30px;
`;
exports.UnitButton = core_1.styled.button `
  /* 1-в-1 с donut UnitToggle button: height 24px (= 30 - 2*1 border -
     2*2 padding), padding 0 11, min-width 28, font mono fs-micro 600. */
  box-sizing: border-box;
  appearance: none;
  border: none;
  background: ${({ active }) => (active ? 'var(--c-sky)' : 'transparent')};
  color: ${({ active }) => (active ? 'var(--s)' : 'var(--g500)')};
  cursor: pointer;
  padding: 0 11px;
  height: 24px;
  min-width: 28px;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  border-radius: 6px;
  transition: all 0.15s ${EASE};

  &:hover:not(:disabled) {
    color: ${({ active }) => (active ? 'var(--s)' : 'var(--ink)')};
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
/* Dropdown — 1-в-1 с мокапом writeoffs-timeseries-prototype.html
   .icon-dd-wrap + .icon-dd: внешняя обёртка фиксирует layout 30x30,
   внутренняя absolute-панель содержит trigger + options как единый
   блок (общий border, bg, radius — без зазора между ними). */
exports.DropdownRoot = core_1.styled.div `
  position: relative;
  display: inline-block;
  width: 30px;
  height: 30px;
  vertical-align: top;
`;
exports.DropdownPanel = core_1.styled.div `
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

  /* При открытом меню trigger отделяется от options тонкой линией. */
  &[data-open='true'] > button:first-child {
    border-bottom: 1px solid var(--g200);
  }
`;
exports.DropdownMenu = core_1.styled.div `
  /* Icon-only options stack — внутри DropdownPanel под trigger'ом, БЕЗ
     position absolute (часть нормального flow внутри Panel). bg/border/
     radius даёт Panel. Анимация только при появлении options. */
  display: flex;
  flex-direction: column;
  width: 100%;
  animation: wo-dd-fade 0.12s ${EASE};
`;
exports.DropdownItemRow = core_1.styled.span `
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;
exports.DropdownItemIcon = core_1.styled.span `
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
  }
`;
exports.DropdownItem = core_1.styled.button `
  /* 1-в-1 с мокапом .icon-dd-item: активный пункт СКРЫТ (он уже
     показан в trigger вверху), остальные — transparent с hover-bg. */
  appearance: none;
  border: none;
  background: transparent;
  color: var(--g500);
  cursor: pointer;
  width: 100%;
  height: 28px;
  display: ${({ active }) => (active ? 'none' : 'inline-flex')};
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 0;
  transition: all 0.12s ${EASE};

  &:hover {
    background: var(--g200);
    color: var(--ink);
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }
`;
/* Chart wrap */
exports.ChartWrap = core_1.styled.div `
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  cursor: ${({ brushActive, drillable }) => brushActive ? 'crosshair' : drillable ? 'pointer' : 'default'};
`;
exports.ChartInner = core_1.styled.div `
  width: 100%;
  height: 100%;

  & > div {
    width: 100% !important;
    height: 100% !important;
  }
`;
exports.BrushButton = core_1.styled.button `
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  appearance: none;
  border: 1px solid ${({ active }) => (active ? 'var(--c-sky)' : 'var(--g200)')};
  background: ${({ active }) => (active ? 'var(--c-sky-b)' : 'var(--s)')};
  color: ${({ active }) => (active ? 'var(--c-sky)' : 'var(--g600)')};
  cursor: pointer;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.15s ${EASE};

  &:hover {
    border-color: var(--g300);
    color: var(--ink);
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 1px;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;
/* Footer */
exports.CardFooter = core_1.styled.div `
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--g100);
  gap: 12px;
  flex-shrink: 0;
  min-height: 22px;
`;
exports.Hint = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--f);
  font-size: var(--fs-meta);
  color: var(--g500);

  /* DS 2.0 canonical: разделитель между подсказками — vertical 1px divider. */
  .hi-sep {
    display: inline-block;
    width: 1px;
    height: 14px;
    background: var(--g300);
    margin: 0 4px;
    vertical-align: middle;
  }
`;
exports.HintItem = core_1.styled.span `
  display: inline-flex;
  align-items: center;
  gap: 6px;

  /* DS 2.0: иконки 16px (раньше 12px — мелковато). */
  svg {
    width: 16px;
    height: 16px;
  }
  .hi-arrow {
    /* Типографический «◂» внутри hint-текста, той же формы что в breadcrumb. */
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    color: var(--g700);
    margin-right: 2px;
    vertical-align: -1px;
  }
`;
exports.LegendRow = core_1.styled.div `
  /* Явно ставим в центральную колонку CardFooter (grid 1fr auto 1fr),
     иначе автозаполнение grid отправляет LegendRow в col 1 (1fr) и
     визуально она оказывается слева от центра, а не по центру визуала. */
  grid-column: 2;
  display: inline-flex;
  align-items: center;
  gap: 18px;
  justify-self: center;
`;
exports.LegendItem = core_1.styled.button `
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  border-radius: 4px;
  opacity: ${({ off }) => (off ? 0.35 : 1)};
  transition: opacity 0.15s ${EASE};

  &:hover {
    background: var(--g100);
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 1px;
  }
`;
exports.LegendMark = core_1.styled.span `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
`;
exports.LegendLabel = core_1.styled.span `
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g700);
  letter-spacing: 0.01em;
`;
exports.LegendSeparator = core_1.styled.span `
  display: inline-block;
  width: 1px;
  height: 14px;
  background: var(--g200);
`;
exports.FooterSpacer = core_1.styled.div ``;
/* ── States (Design System v2.0) ── */
exports.SkeletonWrap = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
`;
exports.SkeletonBlock = core_1.styled.div `
  width: ${({ w }) => w || '100%'};
  height: ${({ h }) => h || 16}px;
  border-radius: 4px;
  background: var(--g200);
  animation: wo-skeleton-pulse 1.4s ease-in-out infinite;
`;
exports.EmptyStateWrap = core_1.styled.div `
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 8px;
  height: 100%;
`;
exports.EmptyStateIcon = core_1.styled.div `
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--g100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--g500);
  font-size: var(--fs-subtitle);
`;
exports.EmptyStateText = core_1.styled.div `
  font-family: var(--f);
  font-size: var(--fs-body);
  color: var(--g600);
  text-align: center;
  line-height: 1.4;
`;
exports.ErrorStateWrap = (0, core_1.styled)(exports.EmptyStateWrap) ``;
exports.ErrorStateIcon = core_1.styled.div `
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--dn-b);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dn);
  font-size: var(--fs-subtitle);
  font-weight: 700;

  &::after {
    content: '!';
  }
`;
exports.ErrorStateText = core_1.styled.div `
  font-family: var(--f);
  font-size: var(--fs-body);
  color: var(--dn);
  text-align: center;
  line-height: 1.4;
  max-width: 320px;
`;
exports.MockBadge = core_1.styled.span `
  /* «Возведение в квадрат»: badge приподнят выше baseline через
     translateY (надёжнее vertical-align:super для inline-flex). */
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
  transform: translateY(-30%);
  user-select: none;
`;
/** Partial-state badge (shown when some series/data is missing). */
exports.PartialBadge = core_1.styled.span `
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--wn-b);
  color: var(--wn);
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  user-select: none;
`;
/** Stale-state indicator: thin animated bar at card top (DS 2.0 §08). */
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
  animation: wo-stale-shimmer 2.4s linear infinite;

  @media (prefers-reduced-motion: never-match) {
    animation: none;
    background: var(--c-sky-b);
  }
`;
exports.StaleLabel = core_1.styled.div `
  /* DS v2.0: 9px → --fs-micro (минимум 11) */
  font-family: var(--m);
  font-size: var(--fs-micro);
  color: var(--g500);
  margin-top: 2px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;
/** Live region for screen-reader announcements. */
exports.SrLive = core_1.styled.div `
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
//# sourceMappingURL=styles.js.map