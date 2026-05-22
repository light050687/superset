import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';
import { LIGHT_TOKENS, DARK_TOKENS, FONTS, EASE } from './themeTokens';
/* DS 2.0 canonical card mount animation. Только opacity — transform убран
   намеренно: Superset dashboard drag-drop сам управляет transform на
   chart-cell ancestor'е (и иногда на самой обёртке). Конфликт двух transform
   приводил к тому что после перестановки чарта он оставался смещённым/невидимым
   до hard refresh. Fade-in через opacity безопасен и работает поверх любого
   transform parent'а. */
const cardInKf = keyframes `
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const L = LIGHT_TOKENS;
const D = DARK_TOKENS;
/**
 * Global CSS variables for the plugin, injected on any root that needs DS 2.0 tokens.
 * `data-theme="dark"` on the same element switches all tokens at once.
 *
 * Exposed as a plain CSS string so it works as a template-literal fragment inside
 * other styled-components (the parent already owns `styled`, so we just interpolate).
 */
export const THEME_VARS_CSS = `
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
  --up-bg: ${L.upBg};
  --dn-bg: ${L.dnBg};
  --wn-bg: ${L.wnBg};
  --c-sky: ${L.cSky};
  --c-violet: ${L.cViolet};
  --c-tangerine: ${L.cTangerine};
  --c-fuchsia: ${L.cFuchsia};
  --c-amber: ${L.cAmber};
  --on-accent: ${L.onAccent};
  --sh: ${L.sh};
  --sh-lg: ${L.shLg};
  --sh-modal: ${L.shModal};
  --m-bg: ${L.mBg};
  --f: ${FONTS.text};
  --m: ${FONTS.mono};
  --ease: ${EASE};

  font-family: var(--f);
  color: var(--ink);
  font-feature-settings: 'tnum' 1, 'cv11' 1;
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;

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
    --up-bg: ${D.upBg};
    --dn-bg: ${D.dnBg};
    --wn-bg: ${D.wnBg};
    --c-sky: ${D.cSky};
    --c-violet: ${D.cViolet};
    --c-tangerine: ${D.cTangerine};
    --c-fuchsia: ${D.cFuchsia};
    --c-amber: ${D.cAmber};
    --sh: ${D.sh};
    --sh-lg: ${D.shLg};
    --sh-modal: ${D.shModal};
    --m-bg: ${D.mBg};
  }
`;
// ─── Card container ──────────────────────────────────────────────────────────
export const CardRoot = styled.div `
  ${THEME_VARS_CSS}

  position: relative;
  width: 100%;
  height: 100%;
  /* DS v2.0: container query для fluid типографики */
  container-type: inline-size;
  container-name: ranked;
  overflow: auto;
  padding: 18px 22px 16px;
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  box-shadow: var(--sh);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  /* DS 2.0 mount animation. Эмоция keyframes() — race-condition-free. */
  animation: ${cardInKf} 0.5s ${EASE} both;
  &[data-no-anim] { animation: none; }
  /* Dashboard drag/edit: animation re-trigger при remount → плагин невидим. */
  .dragdroppable--dragging &,
  .dashboard--editing & {
    animation: none !important;
    opacity: 1 !important;
  }
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
  animation: rb-stale-slide 1.6s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;

  @keyframes rb-stale-slide {
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
  gap: 18px;
  margin-bottom: 18px;
`;
export const TitleBlock = styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;
export const CardTitle = styled.div `
  /* DS 2.0 §02 «Заголовок секции»: 1-в-1 с metricTimeSeries Title,
     scorecard CardTitle, drilldownDonut HeaderText. Manrope sans 17px / 700 /
     0.05em UPPER, height 23.75px, display:inline-block. */
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
/* Mock-режим бейдж — orange "ТЕСТ" pill рядом с заголовком. Паттерн из
   metricTimeSeries/styles.ts (MockBadge). transform:translateY поднимает
   badge выше baseline. */
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
  transform: translateY(-30%);
  user-select: none;
`;
export const CardSub = styled.div `
  font-size: var(--fs-meta);
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
  .total {
    color: var(--g700);
    font-weight: 600;
  }
  .badge-partial {
    color: var(--wn);
    background: var(--wn-bg);
    padding: 2px 8px;
    border-radius: 999px;
    font-size: var(--fs-nano);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`;
export const Controls = styled.div `
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;
// ─── Rank list & row ─────────────────────────────────────────────────────────
export const RankList = styled.div `
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;

  ${({ $hasFilter }) => $hasFilter &&
    css `
      & > [data-filtered='false'] {
        opacity: 0.45;
      }
    `}
`;
export const RankRowEl = styled.div `
  --cat-color: ${({ $catColor }) => $catColor};
  --cat-bg: ${({ $catBg }) => $catBg};

  display: grid;
  /* Колонки value/delta/share не должны wrap'ить число и единицу на 2 строки.
     Ширины подобраны под max-format "999,99 млрд ₽" / "−999,99 п.п." / "100 %"
     при font-variant tabular-nums в --m (JetBrains Mono). */
  grid-template-columns: 36px minmax(160px, 200px) minmax(120px, 1fr) 70px 116px 100px 56px;
  align-items: center;
  gap: 14px;
  padding: 11px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s var(--ease);
  position: relative;
  outline: none;

  &:hover {
    background: var(--g100);
  }
  &:focus-visible {
    background: var(--g100);
    box-shadow: inset 0 0 0 2px var(--c-sky);
  }
  &::after {
    content: '';
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 0;
    height: 1px;
    background: var(--g200);
    opacity: 0.7;
  }
  &:last-of-type::after {
    display: none;
  }

  ${({ $filtered }) => $filtered &&
    css `
      background: var(--g100);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 6px;
        bottom: 6px;
        width: 3px;
        background: var(--cat-color);
        border-radius: 0 2px 2px 0;
      }
    `}

  /* Compact layout for narrow containers */
  @media (max-width: 700px) {
    grid-template-columns: 32px minmax(120px, 1fr) 80px 60px;
    gap: 10px;
    .col-bar,
    .col-spark,
    .col-delta {
      display: none;
    }
  }
`;
export const RankIcon = styled.div `
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  background: var(--cat-bg);

  svg {
    width: 16px;
    height: 16px;
    color: var(--cat-color);
    display: block;
  }
`;
export const RankBadge = styled.span `
  position: absolute;
  top: -3px;
  right: -4px;
  background: var(--s);
  color: var(--g500);
  border: 1px solid var(--g300);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  font-family: var(--m);
  font-size: var(--fs-nano);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
`;
export const RankName = styled.div `
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;
export const RankNameL = styled.div `
  font-size: var(--fs-meta);
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.005em;
`;
export const RankNameS = styled.div `
  font-size: var(--fs-micro);
  font-weight: 500;
  color: var(--g500);
  font-family: var(--m);
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
// ─── Bar ─────────────────────────────────────────────────────────────────────
export const Bar = styled.div `
  position: relative;
  height: 18px;
  display: flex;
  align-items: center;
`;
export const BarTrack = styled.div `
  width: 100%;
  height: 8px;
  background: var(--g100);
  border-radius: 6px;
  position: relative;
  overflow: visible;
`;
export const BarPrev = styled.div `
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: ${({ $widthPct }) => Math.max(0, Math.min(100, $widthPct))}%;
  height: 14px;
  border-radius: 6px;
  border: 1px dashed var(--cat-color);
  background: transparent;
  opacity: 0.45;
  pointer-events: none;
`;
export const BarFill = styled.div `
  position: absolute;
  left: 0;
  top: 0;
  width: ${({ $widthPct }) => Math.max(0, Math.min(100, $widthPct))}%;
  height: 8px;
  background: var(--cat-color);
  border-radius: 6px;
  transition: width 0.4s var(--ease);

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: -2px;
    width: 2px;
    height: 12px;
    background: var(--cat-color);
    border-radius: 6px;
  }
`;
// ─── Spark & values ──────────────────────────────────────────────────────────
export const SparkBox = styled.div `
  display: flex;
  align-items: center;
  justify-content: center;
  height: 18px;

  svg {
    display: block;
    overflow: visible;
  }
`;
export const Value = styled.div `
  /* DS v2.0 P0: ranked KPI value 12px → --fs-subtitle (16-20) */
  font-family: var(--m);
  font-size: var(--fs-subtitle);
  font-weight: 700;
  color: var(--ink);
  text-align: right;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  .u {
    font-weight: 500;
    color: var(--g500);
    font-size: var(--fs-meta);
    margin-left: 2px;
  }
`;
export const Delta = styled.div `
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 600;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: ${({ $status }) => $status === 'up'
    ? 'var(--up)'
    : $status === 'dn'
        ? 'var(--dn)'
        : 'var(--g500)'};

  svg {
    width: 8px;
    height: 8px;
    flex-shrink: 0;
  }
`;
export const Share = styled.div `
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  color: var(--g700);
  text-align: right;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  .u {
    font-weight: 500;
    color: var(--g500);
    font-size: var(--fs-micro);
  }
`;
// ─── Icon dropdown & unit toggle ─────────────────────────────────────────────
export const IconDropdownWrap = styled.div `
  position: relative;
  display: inline-block;
  width: 32px;
  height: 30px;
`;
/* Capsule + button для открытия AllItemsModal. Паттерн заимствован из
   riskMatrix/styles.ts (Toolbar + TbBtn). 30×30 desktop, 44×44 на coarse
   pointer per ADR-0001. */
export const OpenAllToolbar = styled.div `
  display: inline-flex;
  align-items: center;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  overflow: hidden;
`;
export const OpenAllBtn = styled.button `
  width: 32px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--g500);
  cursor: pointer;
  transition: 0.12s var(--ease);

  &:hover {
    color: var(--ink);
    background: var(--g200);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 1px;
  }
  svg {
    width: 14px;
    height: 14px;
    display: block;
  }

  @media (pointer: coarse) {
    min-width: 44px;
    min-height: 44px;
    width: auto;
    height: auto;
    padding: 10px;
  }
`;
export const IconDropdown = styled.div `
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: var(--g100);
  border: 1px solid
    ${({ $open }) => ($open ? 'var(--g300)' : 'var(--g200)')};
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.15s var(--ease);
  z-index: ${({ $open }) => ($open ? 200 : 'auto')};
  box-shadow: ${({ $open }) => ($open ? 'var(--sh-lg)' : 'none')};

  &:hover {
    border-color: var(--g300);
  }
`;
export const IconDropdownTrigger = styled.button `
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 28px;
  background: transparent;
  border: none;
  padding: 0;
  color: var(--g500);
  cursor: pointer;
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: color 0.12s var(--ease);

  &:hover {
    color: var(--ink);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 1px;
    border-radius: 6px;
  }
`;
export const IconDropdownItem = styled.button `
  display: ${({ $active }) => ($active ? 'none' : 'inline-flex')};
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 28px;
  background: transparent;
  border: none;
  padding: 0;
  color: var(--g500);
  cursor: pointer;
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: all 0.12s var(--ease);

  &:hover {
    background: var(--g200);
    color: var(--ink);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
export const UnitToggleEl = styled.div `
  display: inline-flex;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 3px;
  gap: 2px;

  button {
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 700;
    letter-spacing: 0.01em;
    background: transparent;
    border: none;
    padding: 4px 10px;
    border-radius: 6px;
    color: var(--g500);
    cursor: pointer;
    min-width: 24px;
    transition: 0.12s;

    &:hover {
      color: var(--ink);
    }
    &.on {
      background: var(--c-sky);
      color: var(--on-accent);
      box-shadow: var(--sh);
    }
    &:focus-visible {
      outline: 2px solid var(--c-sky);
      outline-offset: 1px;
    }
  }
`;
// ─── States (skeleton, empty, error) ─────────────────────────────────────────
export const StateWrap = styled.div `
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--g500);
  font-family: var(--m);
  font-size: var(--fs-micro);
  gap: 10px;
  flex: 1;
`;
export const SkeletonRow = styled.div `
  display: grid;
  grid-template-columns: 36px minmax(180px, 220px) minmax(140px, 1fr) 70px 92px 80px 56px;
  gap: 14px;
  padding: 11px 10px;
  align-items: center;

  @keyframes rb-skel {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 0.7;
    }
  }

  & > span {
    background: var(--g100);
    border-radius: 6px;
    height: 16px;
    animation: rb-skel 1.4s infinite var(--ease);
  }
  & > span.icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
  }
`;
// ─── Modal ─────────────────────────────────────────────────────────────────
export const ModalBackdrop = styled.div `
  ${THEME_VARS_CSS}

  position: fixed;
  inset: 0;
  background: var(--m-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${({ $zIndex }) => $zIndex ?? 1000};
  padding: 24px;

  @keyframes rb-m-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  animation: rb-m-fade 0.15s var(--ease);
`;
export const ModalBox = styled.div `
  background: var(--s);
  border: 1px solid var(--g300);
  border-radius: 16px;
  padding: 24px 28px;
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? '980px' : '760px')};
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--sh-modal);
  color: var(--ink);

  @keyframes rb-m-pop {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  animation: rb-m-pop 0.2s var(--ease);
`;
export const ModalHead = styled.div `
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;

  .m-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      width: 22px;
      height: 22px;
    }
  }

  .m-titles {
    flex: 1;
    min-width: 0;
  }

  .m-title {
    font-size: var(--fs-title);
    font-weight: 700;
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
    border-radius: 6px;
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
    &:focus-visible {
      outline: 2px solid var(--c-sky);
      outline-offset: 1px;
    }

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;
export const ModalSummaryGrid = styled.div `
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 22px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;
export const StatBox = styled.div `
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 12px 14px;

  .l {
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--g500);
    font-family: var(--m);
    margin-bottom: 6px;
  }
  .v {
    /* StatBox в 4-col grid (~150px на колонку) — fs-hero (var) тут не работает
       и не помещает max-format "999,99 млн ₽". Фиксируем clamp 22→28 чтобы
       6 цифр + unit влезали без overflow при tabular-nums. */
    font-size: clamp(22px, 3vw, 28px);
    font-weight: 800;
    color: var(--ink);
    font-family: var(--f);
    letter-spacing: -0.02em;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .v .u {
    font-weight: 500;
    color: var(--g500);
    font-size: var(--fs-meta);
    margin-left: 2px;
  }
  .d {
    font-size: var(--fs-meta);
    font-weight: 600;
    font-family: var(--m);
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .d.up {
    color: var(--up);
  }
  .d.dn {
    color: var(--dn);
  }
  .d.wn {
    color: var(--g500);
  }
`;
export const ModalSection = styled.div `
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }

  .l {
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--g500);
    font-family: var(--m);
    margin-bottom: 10px;
  }
`;
export const TrendBox = styled.div `
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 14px 16px;

  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .head .l {
    font-size: var(--fs-meta);
    font-weight: 600;
    color: var(--g600);
    font-family: var(--m);
    letter-spacing: 0.01em;
  }
  .head .r {
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--g500);
    font-family: var(--m);
    letter-spacing: 0.01em;
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
  }
`;
export const TopList = styled.div `
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
export const TopRow = styled.div `
  --cat-color: ${({ $catColor }) => $catColor};

  display: grid;
  grid-template-columns: 18px 1fr minmax(110px, 180px) 70px;
  align-items: center;
  gap: 12px;
  padding: 7px 12px;
  border-radius: 6px;
  background: var(--g50);
  border: 1px solid var(--g200);

  .rank {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 700;
    color: var(--g500);
    text-align: center;
  }
  .name {
    font-size: var(--fs-meta);
    font-weight: 600;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bar {
    height: 6px;
    background: var(--g200);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
  }
  .bar-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: var(--cat-color);
    border-radius: 6px;
  }
  .val {
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 700;
    color: var(--ink);
    text-align: right;
    letter-spacing: -0.01em;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
`;
// ─── All-items modal toolbar ────────────────────────────────────────────────
export const AllToolbar = styled.div `
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--g200);

  .search-wrap {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    width: 13px;
    height: 13px;
    color: var(--g500);
    pointer-events: none;
  }
  input {
    width: 100%;
    background: var(--g50);
    border: 1px solid var(--g200);
    border-radius: 6px;
    padding: 8px 12px 8px 32px;
    color: var(--ink);
    font-family: var(--f);
    font-size: var(--fs-body);
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
  }
`;
export const SortPills = styled.div `
  display: flex;
  gap: 4px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 3px;

  button {
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 600;
    letter-spacing: 0.01em;
    background: transparent;
    border: none;
    color: var(--g500);
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: 0.12s;

    &:hover {
      color: var(--ink);
    }
    &.on {
      background: var(--c-sky);
      color: var(--on-accent);
      box-shadow: var(--sh);
    }
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    &:focus-visible {
      outline: 2px solid var(--c-sky);
      outline-offset: 1px;
    }
  }
`;
export const AllFooter = styled.div `
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--g200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g500);
  letter-spacing: 0.01em;

  .total-strong {
    color: var(--g700);
    font-weight: 700;
  }
`;
export const EmptyState = styled.div `
  padding: 40px 20px;
  text-align: center;
  color: var(--g500);
  font-family: var(--m);
  font-size: var(--fs-micro);
`;
// ─── Drill-modal head icon — category-colored background ──────────────────
export const ModalHeadIcon = styled.div `
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $bg }) => $bg};
`;
// ─── Top-list mini bar fill (DetailModal) ──────────────────────────────────
export const TopBarFill = styled.div `
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${({ $widthPct }) => Math.max(0, Math.min(100, $widthPct))}%;
  background: var(--cat-color);
  border-radius: 6px;
`;
// ─── Drill-modal in-section helpers (replace inline style usages) ──────────
export const InlineSkeleton = styled.div `
  width: 100%;
  height: ${({ $height }) => $height}px;
  border-radius: 6px;
  background: var(--g100);

  @keyframes rb-skel {
    0%,
    100% {
      opacity: 0.4;
    }
    50% {
      opacity: 0.7;
    }
  }
  animation: rb-skel 1.4s infinite var(--ease);
`;
export const InlineEmpty = styled.div `
  padding: 18px;
  text-align: center;
  color: var(--g500);
  font-family: var(--m);
  font-size: var(--fs-micro);
`;
export const InlineError = styled.div `
  padding: 18px;
  text-align: center;
  color: var(--dn);
  font-family: var(--m);
  font-size: var(--fs-micro);
`;
export const AllModalIcon = styled.div `
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--c-sky) 18%, transparent);

  svg {
    width: 22px;
    height: 22px;
    color: var(--c-sky);
  }
`;
export const DotSeparator = styled.span `
  color: var(--g400);
`;
// ─── Tooltip ────────────────────────────────────────────────────────────────
export const TooltipBox = styled.div `
  ${THEME_VARS_CSS}

  position: fixed;
  /* DS 2.1 §08 «Тултипы»: tooltip того же тона что Card surface — НЕ инверт.
     light: bg=--s(#fff) + text=--ink(#0a0a0a) = белый tooltip.
     dark:  bg=--s(#171a1e) + text=--ink(#e6e9ef) = тёмный tooltip.
     Border + shadow дают визуальное отделение от Card. */
  background: var(--s);
  color: var(--ink);
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: var(--sh-lg);
  font-family: var(--f);
  font-size: 11px;
  pointer-events: none;
  z-index: 500;
  max-width: 240px;
  display: ${({ $visible }) => ($visible ? 'block' : 'none')};

  @keyframes rb-tt-fade {
    from {
      opacity: 0;
      transform: translateY(-2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  animation: rb-tt-fade 0.12s var(--ease);

  .tt-head {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(128, 128, 128, 0.25);
  }
  .tt-icon {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    svg { width: 12px; height: 12px; }
  }
  .tt-titles { flex: 1; min-width: 0; }
  /* Header 13px Manrope 700 — крупнее DS-минимума 11px для лучшей читаемости. */
  .tt-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.3;
    margin-bottom: 1px;
  }
  /* DS 2.1: sub — 11px моно, описание/единицы/период. */
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
  /* DS 2.1: метка KPI — 11px моно 600 0.06em UPPERCASE. */
  .tt-l {
    font-size: 11px;
    font-weight: 600;
    color: var(--g500);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  /* DS 2.1: «строка» 12px моно. tabular-nums всегда на числовых значениях. */
  .tt-v {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .tt-v.up { color: var(--up); }
  .tt-v.dn { color: var(--dn); }
  .tt-v.wn { color: var(--g500); }

`;
//# sourceMappingURL=styles.js.map