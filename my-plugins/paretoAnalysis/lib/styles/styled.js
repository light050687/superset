"use strict";
/**
 * Все styled-компоненты Pareto Card — на базе @superset-ui/core styled (Emotion).
 * CSS-переменные DS 2.0 живут на корневом контейнере и переключаются
 * через атрибут data-theme (light | dark).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkeletonBlock = exports.StateSub = exports.StateTitle = exports.StateCenter = exports.DrillBars = exports.DrillSectionTitle = exports.DrillContext = exports.DrillSummaryGrid = exports.ModalBody = exports.ModalClose = exports.ModalTitle = exports.ModalHead = exports.ModalCard = exports.ModalOverlay = exports.TooltipEl = exports.ZoneChipBtn = exports.LgLabel = exports.LgLine = exports.LgSwatch = exports.Lg = exports.LegendRow = exports.HintItem = exports.CardFooter = exports.ChartCanvasDiv = exports.ChartBox = exports.VitalFewLine = exports.ThresholdRange = exports.ThresholdValue = exports.ThresholdLabel = exports.ThresholdWrap = exports.Chip = exports.UnitBtn = exports.UnitToggle = exports.ControlsRow = exports.BreadcrumbSel = exports.BreadcrumbCur = exports.BreadcrumbBtn = exports.BreadcrumbRow = exports.CardTitle = exports.CardTitleGroup = exports.CardHead = exports.Card = exports.ParetoCardRoot = exports.PARETO_CARD_CLASS = void 0;
const core_1 = require("@superset-ui/core");
const tokens_1 = require("./tokens");
const keyframes_1 = require("./keyframes");
exports.PARETO_CARD_CLASS = 'pareto-card';
// ═══════════════════════════════════════
// Root — CSS-vars light/dark
// ═══════════════════════════════════════
exports.ParetoCardRoot = core_1.styled.div `
  /* light (default) */
  --bg: ${tokens_1.LIGHT_TOKENS.bg};
  --s: ${tokens_1.LIGHT_TOKENS.s};
  --ink: ${tokens_1.LIGHT_TOKENS.ink};
  --g50: ${tokens_1.LIGHT_TOKENS.g50};
  --g100: ${tokens_1.LIGHT_TOKENS.g100};
  --g200: ${tokens_1.LIGHT_TOKENS.g200};
  --g300: ${tokens_1.LIGHT_TOKENS.g300};
  --g400: ${tokens_1.LIGHT_TOKENS.g400};
  --g500: ${tokens_1.LIGHT_TOKENS.g500};
  --g600: ${tokens_1.LIGHT_TOKENS.g600};
  --g700: ${tokens_1.LIGHT_TOKENS.g700};
  --up: ${tokens_1.LIGHT_TOKENS.up};
  --dn: ${tokens_1.LIGHT_TOKENS.dn};
  --wn: ${tokens_1.LIGHT_TOKENS.wn};
  --c-sky: ${tokens_1.LIGHT_TOKENS.cSky};
  --c-violet: ${tokens_1.LIGHT_TOKENS.cViolet};
  --c-tangerine: ${tokens_1.LIGHT_TOKENS.cTangerine};
  --c-fuchsia: ${tokens_1.LIGHT_TOKENS.cFuchsia};
  --c-amber: ${tokens_1.LIGHT_TOKENS.cAmber};
  --on-accent: ${tokens_1.LIGHT_TOKENS.onAccent};
  --f: ${tokens_1.LIGHT_TOKENS.fontSans};
  --m: ${tokens_1.LIGHT_TOKENS.fontMono};
  --sh: 0 1px 3px rgba(15, 17, 20, 0.06);

  &[data-theme='dark'] {
    --bg: ${tokens_1.DARK_TOKENS.bg};
    --s: ${tokens_1.DARK_TOKENS.s};
    --ink: ${tokens_1.DARK_TOKENS.ink};
    --g50: ${tokens_1.DARK_TOKENS.g50};
    --g100: ${tokens_1.DARK_TOKENS.g100};
    --g200: ${tokens_1.DARK_TOKENS.g200};
    --g300: ${tokens_1.DARK_TOKENS.g300};
    --g400: ${tokens_1.DARK_TOKENS.g400};
    --g500: ${tokens_1.DARK_TOKENS.g500};
    --g600: ${tokens_1.DARK_TOKENS.g600};
    --g700: ${tokens_1.DARK_TOKENS.g700};
    --up: ${tokens_1.DARK_TOKENS.up};
    --dn: ${tokens_1.DARK_TOKENS.dn};
    --wn: ${tokens_1.DARK_TOKENS.wn};
    --c-sky: ${tokens_1.DARK_TOKENS.cSky};
    --c-violet: ${tokens_1.DARK_TOKENS.cViolet};
    --c-tangerine: ${tokens_1.DARK_TOKENS.cTangerine};
    --c-fuchsia: ${tokens_1.DARK_TOKENS.cFuchsia};
    --c-amber: ${tokens_1.DARK_TOKENS.cAmber};
    --sh: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  font-family: var(--f);
  color: var(--ink);
  animation: pareto-card-in 0.22s ${keyframes_1.EASE};
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
exports.Card = core_1.styled.div `
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
exports.CardHead = core_1.styled.div `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
`;
exports.CardTitleGroup = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;
exports.CardTitle = core_1.styled.div `
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink);
`;
exports.BreadcrumbRow = core_1.styled.div `
  font-family: var(--m);
  font-size: 9px;
  color: var(--g500);
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 14px;
`;
exports.BreadcrumbBtn = core_1.styled.button `
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  color: var(--g500);
  padding: 0 4px;
  border-radius: 3px;
  transition: color 0.15s ${keyframes_1.EASE}, background 0.15s ${keyframes_1.EASE};
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
exports.BreadcrumbCur = core_1.styled.span `
  color: var(--g600);
  font-weight: 500;
`;
exports.BreadcrumbSel = core_1.styled.span `
  color: var(--ink);
  font-weight: 600;
`;
exports.ControlsRow = core_1.styled.div `
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  flex-shrink: 0;
`;
// ═══════════════════════════════════════
// Unit toggle (₽ / %)
// ═══════════════════════════════════════
exports.UnitToggle = core_1.styled.div `
  display: flex;
  gap: 2px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 2px;
  min-height: 30px;
`;
exports.UnitBtn = core_1.styled.button `
  border: none;
  background: ${({ active }) => (active ? 'var(--c-sky)' : 'transparent')};
  color: ${({ active }) => (active ? 'var(--on-accent)' : 'var(--g500)')};
  font-family: var(--f);
  font-size: 11px;
  font-weight: 600;
  padding: 5px 13px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ${keyframes_1.EASE};
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
exports.Chip = core_1.styled.button `
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
  transition: all 0.15s ${keyframes_1.EASE};
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
exports.ThresholdWrap = core_1.styled.label `
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
exports.ThresholdLabel = core_1.styled.span `
  font-family: var(--m);
  font-size: 10px;
  font-weight: 600;
  color: var(--g500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;
exports.ThresholdValue = core_1.styled.span `
  font-family: var(--m);
  font-size: 11px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  min-width: 30px;
  text-align: right;
`;
exports.ThresholdRange = core_1.styled.input `
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
exports.VitalFewLine = core_1.styled.div `
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
exports.ChartBox = core_1.styled.div `
  position: relative;
  flex: 1;
  min-height: 280px;
  width: 100%;
  /* DS 2.0 §08 — графики с тултипами имеют crosshair-курсор. */
  cursor: crosshair;
`;
exports.ChartCanvasDiv = core_1.styled.div `
  position: absolute;
  inset: 0;
`;
// ═══════════════════════════════════════
// Footer: hint + legend
// ═══════════════════════════════════════
exports.CardFooter = core_1.styled.div `
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--g200);
`;
exports.HintItem = core_1.styled.div `
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
exports.LegendRow = core_1.styled.div `
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
exports.Lg = core_1.styled.div `
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
exports.LgSwatch = core_1.styled.span `
  width: 14px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
  background: ${({ color }) => color};
`;
exports.LgLine = core_1.styled.span `
  width: 14px;
  height: 0;
  border-top: 2px solid var(--ink);
  flex-shrink: 0;
`;
exports.LgLabel = core_1.styled.span `
  font-family: var(--m);
  font-size: 10px;
  font-weight: 500;
  color: var(--g600);
  letter-spacing: 0.03em;
  white-space: nowrap;

  ${exports.Lg}:hover & {
    color: var(--ink);
  }
`;
exports.ZoneChipBtn = core_1.styled.button `
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 3px 8px;
  border-radius: 14px;
  border: 1px solid ${({ active }) => (active ? 'var(--g300)' : 'transparent')};
  background: ${({ active }) => (active ? 'var(--g100)' : 'transparent')};
  cursor: pointer;
  transition: border-color 0.15s ${keyframes_1.EASE}, background 0.15s ${keyframes_1.EASE};
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
exports.TooltipEl = core_1.styled.div `
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
  animation: pareto-tooltip-in 0.12s ${keyframes_1.EASE};

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
exports.ModalOverlay = core_1.styled.div `
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: pareto-overlay-in 0.18s ${keyframes_1.EASE};

  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
  }
`;
exports.ModalCard = core_1.styled.div `
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
  animation: pareto-modal-in 0.2s ${keyframes_1.EASE};
  color: var(--ink);
  font-family: var(--f);
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
exports.ModalClose = core_1.styled.button `
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
  transition: all 0.15s ${keyframes_1.EASE};
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
exports.ModalBody = core_1.styled.div `
  padding: 18px 22px 20px;
  overflow-y: auto;
  flex: 1;
`;
exports.DrillSummaryGrid = core_1.styled.div `
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
exports.DrillContext = core_1.styled.div `
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
    transition: width 0.4s ${keyframes_1.EASE};
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
exports.DrillSectionTitle = core_1.styled.div `
  font-family: var(--f);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
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
    transition: width 0.4s ${keyframes_1.EASE};
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
exports.StateCenter = core_1.styled.div `
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
exports.StateTitle = core_1.styled.div `
  font-size: 13px;
  font-weight: 600;
  color: var(--g600);
  letter-spacing: -0.01em;
`;
exports.StateSub = core_1.styled.div `
  font-family: var(--m);
  font-size: 11px;
  color: var(--g500);
  letter-spacing: 0.02em;
`;
exports.SkeletonBlock = core_1.styled.div `
  width: ${({ w }) => w ?? '100%'};
  height: ${({ h }) => h ?? '12px'};
  background: var(--g200);
  border-radius: 4px;
  animation: pareto-skeleton-pulse 1.2s ${keyframes_1.EASE} infinite;
`;
//# sourceMappingURL=styled.js.map