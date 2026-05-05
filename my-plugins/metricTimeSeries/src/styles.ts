import { styled } from '@superset-ui/core';
import { keyframes } from '@emotion/react';
import { LIGHT_TOKENS as L, DARK_TOKENS as D, FONTS } from './themeTokens';

/*
 * Design System v2.0 tokens as CSS custom properties.
 * Light/dark switching via `data-theme` attribute on the root container.
 *
 * Token values are imported from themeTokens.ts (single source of truth).
 * All colors via var(--token) — никакого хардкода.
 */

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

export const CARD_CLASS = 'wo-ts-card';

// DS 2.0 canonical card mount animation. Через emotion keyframes() helper —
// race-condition-free относительно <style dangerouslySetInnerHTML> (см. donut).
const cardInKf = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Keyframes injected via <style> in WriteoffsTimeseries.tsx ── */

export const KEYFRAMES_CSS = `
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

export const Root = styled.div<{ width: number; height: number }>`
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
  --c-sky-b: ${L.cSkyBg};
  --c-violet-b: ${L.cVioletBg};
  --c-tangerine-b: ${L.cTangerineBg};
  --c-fuchsia-b: ${L.cFuchsiaBg};
  --c-amber-b: ${L.cAmberBg};
  --f: ${FONTS.text};
  --m: ${FONTS.mono};
  --sh: 0 1px 3px rgba(15, 17, 20, 0.06);

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
    --c-sky-b: ${D.cSkyBg};
    --c-violet-b: ${D.cVioletBg};
    --c-tangerine-b: ${D.cTangerineBg};
    --c-fuchsia-b: ${D.cFuchsiaBg};
    --c-amber-b: ${D.cAmberBg};
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

export const Card = styled.div`
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
  animation: ${cardInKf} 0.6s ${EASE} both;

  &:hover {
    border-color: var(--g300);
  }
`;

export const CardHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 8px;
  flex-shrink: 0;
`;

export const TitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const Title = styled.div`
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

export const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--m);
  font-size: var(--fs-micro);
  color: var(--g600);
  letter-spacing: 0.03em;
  min-height: 16px;
`;

export const BreadcrumbBack = styled.button`
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

export const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const IconButton = styled.button<{ active?: boolean }>`
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

export const UnitToggleGroup = styled.div`
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

export const UnitButton = styled.button<{ active?: boolean }>`
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

export const DropdownRoot = styled.div`
  position: relative;
  display: inline-block;
  width: 30px;
  height: 30px;
  vertical-align: top;
`;

export const DropdownPanel = styled.div<{ open?: boolean }>`
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

export const DropdownMenu = styled.div`
  /* Icon-only options stack — внутри DropdownPanel под trigger'ом, БЕЗ
     position absolute (часть нормального flow внутри Panel). bg/border/
     radius даёт Panel. Анимация только при появлении options. */
  display: flex;
  flex-direction: column;
  width: 100%;
  animation: wo-dd-fade 0.12s ${EASE};
`;

export const DropdownItemRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

export const DropdownItemIcon = styled.span`
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

export const DropdownItem = styled.button<{ active?: boolean }>`
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

export const ChartWrap = styled.div<{ drillable?: boolean; brushActive?: boolean }>`
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  cursor: ${({ brushActive, drillable }) =>
    brushActive ? 'crosshair' : drillable ? 'pointer' : 'default'};
`;

export const ChartInner = styled.div`
  width: 100%;
  height: 100%;

  & > div {
    width: 100% !important;
    height: 100% !important;
  }
`;

export const BrushButton = styled.button<{ active?: boolean }>`
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

export const CardFooter = styled.div`
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

export const Hint = styled.div`
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

export const HintItem = styled.span`
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

export const LegendRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 18px;
  justify-self: center;
`;

export const LegendItem = styled.button<{ off?: boolean }>`
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

export const LegendMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
`;

export const LegendLabel = styled.span`
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g700);
  letter-spacing: 0.01em;
`;

export const LegendSeparator = styled.span`
  display: inline-block;
  width: 1px;
  height: 14px;
  background: var(--g200);
`;

export const FooterSpacer = styled.div``;

/* ── States (Design System v2.0) ── */

export const SkeletonWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
`;

export const SkeletonBlock = styled.div<{ w?: string; h?: number }>`
  width: ${({ w }) => w || '100%'};
  height: ${({ h }) => h || 16}px;
  border-radius: 4px;
  background: var(--g200);
  animation: wo-skeleton-pulse 1.4s ease-in-out infinite;
`;

export const EmptyStateWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 8px;
  height: 100%;
`;

export const EmptyStateIcon = styled.div`
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

export const EmptyStateText = styled.div`
  font-family: var(--f);
  font-size: var(--fs-body);
  color: var(--g600);
  text-align: center;
  line-height: 1.4;
`;

export const ErrorStateWrap = styled(EmptyStateWrap)``;

export const ErrorStateIcon = styled.div`
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

export const ErrorStateText = styled.div`
  font-family: var(--f);
  font-size: var(--fs-body);
  color: var(--dn);
  text-align: center;
  line-height: 1.4;
  max-width: 320px;
`;

export const MockBadge = styled.span`
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
export const PartialBadge = styled.span`
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
export const StaleBar = styled.div`
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

export const StaleLabel = styled.div`
  /* DS v2.0: 9px → --fs-micro (минимум 11) */
  font-family: var(--m);
  font-size: var(--fs-micro);
  color: var(--g500);
  margin-top: 2px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

/** Live region for screen-reader announcements. */
export const SrLive = styled.div`
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
