/**
 * Все styled-компоненты Pareto Card — на базе @superset-ui/core styled (Emotion).
 * CSS-переменные DS 2.0 живут на корневом контейнере и переключаются
 * через атрибут data-theme (light | dark).
 */

import { styled } from '@superset-ui/core';
import { LIGHT_TOKENS as L, DARK_TOKENS as D } from './tokens';
import { EASE } from './keyframes';

export const PARETO_CARD_CLASS = 'pareto-card';

// ═══════════════════════════════════════
// Root — CSS-vars light/dark
// ═══════════════════════════════════════

export const ParetoCardRoot = styled.div<{ width: number; height: number }>`
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
  --c-sky: ${L.cSky};
  --c-violet: ${L.cViolet};
  --c-tangerine: ${L.cTangerine};
  --c-fuchsia: ${L.cFuchsia};
  --c-amber: ${L.cAmber};
  --on-accent: ${L.onAccent};
  --f: ${L.fontSans};
  --m: ${L.fontMono};
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
    --c-sky: ${D.cSky};
    --c-violet: ${D.cViolet};
    --c-tangerine: ${D.cTangerine};
    --c-fuchsia: ${D.cFuchsia};
    --c-amber: ${D.cAmber};
    --sh: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  font-family: var(--f);
  color: var(--ink);
  animation: pareto-card-in 0.22s ${EASE};
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

export const Card = styled.div`
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 16px 20px 14px;
  box-shadow: var(--sh);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const CardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
`;

export const CardTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

export const CardTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink);
`;

export const BreadcrumbRow = styled.div`
  font-family: var(--m);
  font-size: 9px;
  color: var(--g500);
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 14px;
`;

export const BreadcrumbBtn = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  color: var(--g500);
  padding: 0 4px;
  border-radius: 3px;
  transition: color 0.15s ${EASE}, background 0.15s ${EASE};
  line-height: 1;
  display: inline-flex;
  align-items: center;
  height: 14px;
  &:hover,
  &:focus-visible {
    color: var(--ink);
    background: var(--g100);
    outline: none;
  }
`;

export const BreadcrumbCur = styled.span`
  color: var(--g600);
  font-weight: 500;
`;

export const BreadcrumbSel = styled.span`
  color: var(--ink);
  font-weight: 600;
`;

export const ControlsRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  flex-shrink: 0;
`;

// ═══════════════════════════════════════
// Unit toggle (₽ / %)
// ═══════════════════════════════════════

export const UnitToggle = styled.div`
  display: flex;
  gap: 2px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 2px;
  min-height: 30px;
`;

export const UnitBtn = styled.button<{ active: boolean }>`
  border: none;
  background: ${({ active }) => (active ? 'var(--c-sky)' : 'transparent')};
  color: ${({ active }) => (active ? 'var(--on-accent)' : 'var(--g500)')};
  font-family: var(--f);
  font-size: 11px;
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
`;

// ═══════════════════════════════════════
// Chip (Top-A / Prev period)
// ═══════════════════════════════════════

export const Chip = styled.button<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${({ active }) => (active ? 'var(--c-sky)' : 'var(--g100)')};
  border: 1px solid
    ${({ active }) => (active ? 'var(--c-sky)' : 'var(--g200)')};
  border-radius: 7px;
  font-family: var(--f);
  font-size: 11px;
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
`;

// ═══════════════════════════════════════
// Threshold slider
// ═══════════════════════════════════════

export const ThresholdWrap = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 5px 12px;
  min-height: 30px;
  font-family: var(--f);
  font-size: 11px;
  font-weight: 600;
  color: var(--g500);
  letter-spacing: 0.01em;
`;

export const ThresholdLabel = styled.span`
  font-family: var(--m);
  font-size: 10px;
  font-weight: 600;
  color: var(--g500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const ThresholdValue = styled.span`
  font-family: var(--m);
  font-size: 11px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  min-width: 30px;
  text-align: right;
`;

export const ThresholdRange = styled.input`
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

export const VitalFewLine = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 2px 0 12px;
  font-family: var(--f);
  font-size: 11px;
  color: var(--g500);
  letter-spacing: 0.01em;

  b {
    font-family: var(--m);
    font-size: 12px;
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

export const ChartBox = styled.div`
  position: relative;
  flex: 1;
  min-height: 280px;
  width: 100%;
  /* DS 2.0 §08 — графики с тултипами имеют crosshair-курсор. */
  cursor: crosshair;
`;

export const ChartCanvasDiv = styled.div`
  position: absolute;
  inset: 0;
`;

// ═══════════════════════════════════════
// Footer: hint + legend
// ═══════════════════════════════════════

export const CardFooter = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--g200);
`;

export const HintItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--m);
  font-size: 10px;
  font-weight: 500;
  color: var(--g500);
  letter-spacing: 0.03em;
  white-space: nowrap;
  justify-self: start;

  .hi {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .hi svg {
    width: 11px;
    height: 11px;
    color: var(--g500);
    flex-shrink: 0;
  }
`;

export const LegendRow = styled.div`
  display: flex;
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

export const Lg = styled.div<{ off?: boolean }>`
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
`;

export const LgSwatch = styled.span<{ color: string }>`
  width: 14px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
  background: ${({ color }) => color};
`;

export const LgLine = styled.span`
  width: 14px;
  height: 0;
  border-top: 2px solid var(--ink);
  flex-shrink: 0;
`;

export const LgLabel = styled.span`
  font-family: var(--m);
  font-size: 10px;
  font-weight: 500;
  color: var(--g600);
  letter-spacing: 0.03em;
  white-space: nowrap;

  ${Lg}:hover & {
    color: var(--ink);
  }
`;

export const ZoneChipBtn = styled.button<{ active: boolean }>`
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
`;

// ═══════════════════════════════════════
// Tooltip (DOM)
// ═══════════════════════════════════════

export const TooltipEl = styled.div`
  position: absolute;
  z-index: 10;
  pointer-events: none;
  background: var(--ink);
  color: var(--s);
  border-radius: 6px;
  padding: 9px 13px 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  font-family: var(--f);
  font-size: 11px;
  max-width: 300px;
  animation: pareto-tooltip-in 0.12s ${EASE};

  .tt-title {
    font-weight: 700;
    font-size: 11px;
    margin-bottom: 5px;
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
    font-size: 9px;
    font-weight: 700;
    margin-left: auto;
    padding: 1px 5px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .tt-row {
    font-family: var(--m);
    font-size: 11px;
    font-weight: 500;
    line-height: 1.6;
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }
  .tt-row b {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .tt-row b.up {
    color: var(--up);
  }
  .tt-row b.dn {
    color: var(--dn);
  }
  .tt-divider {
    height: 1px;
    background: var(--g400);
    margin: 5px 0;
    opacity: 0.3;
  }
`;

// ═══════════════════════════════════════
// Modal (drill)
// ═══════════════════════════════════════

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: pareto-overlay-in 0.18s ${EASE};

  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
  }
`;

export const ModalCard = styled.div`
  position: relative;
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: min(680px, 100%);
  width: 100%;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  animation: pareto-modal-in 0.2s ${EASE};
  color: var(--ink);
  font-family: var(--f);
`;

export const ModalHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px 12px;
  border-bottom: 1px solid var(--g200);
`;

export const ModalTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;

  .m-eyebrow {
    font-family: var(--m);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--g500);
  }
  .m-h {
    font-family: var(--f);
    font-size: 17px;
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

export const ModalClose = styled.button`
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

export const ModalBody = styled.div`
  padding: 18px 22px 20px;
  overflow-y: auto;
  flex: 1;
`;

export const DrillSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px 18px;
  padding: 14px 16px;
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 8px;
  margin-bottom: 18px;

  .s-l {
    font-family: var(--m);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--g500);
  }
  .s-v {
    font-family: var(--m);
    font-size: 15px;
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
`;

export const DrillContext = styled.div`
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
    font-size: 12px;
    font-weight: 600;
    color: var(--g700);
    letter-spacing: -0.01em;
  }
  .ctx-hint {
    font-family: var(--m);
    font-size: 9px;
    font-weight: 500;
    color: var(--g500);
    letter-spacing: 0.03em;
  }
  .ctx-v {
    font-family: var(--m);
    font-size: 13px;
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
    height: 10px;
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

export const DrillSectionTitle = styled.div`
  font-family: var(--f);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--g600);
  margin-bottom: 10px;
`;

export const DrillBars = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  .dbf {
    display: grid;
    grid-template-columns: 140px 1fr 110px;
    gap: 14px;
    align-items: center;
  }
  .dbf-l {
    font-family: var(--f);
    font-size: 12px;
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
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: var(--g700);
  }
  .dbf-v .pct {
    color: var(--g500);
    font-size: 10px;
    margin-left: 4px;
  }
`;

// ═══════════════════════════════════════
// Empty / loading / error states
// ═══════════════════════════════════════

export const StateCenter = styled.div`
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

export const StateTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--g600);
  letter-spacing: -0.01em;
`;

export const StateSub = styled.div`
  font-family: var(--m);
  font-size: 11px;
  color: var(--g500);
  letter-spacing: 0.02em;
`;

export const SkeletonBlock = styled.div<{ w?: string; h?: string }>`
  width: ${({ w }) => w ?? '100%'};
  height: ${({ h }) => h ?? '12px'};
  background: var(--g200);
  border-radius: 4px;
  animation: pareto-skeleton-pulse 1.2s ${EASE} infinite;
`;
