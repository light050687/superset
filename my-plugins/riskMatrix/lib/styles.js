"use strict";
/**
 * Emotion-компоненты Scatter · Risk Matrix.
 * Все цвета идут через CSS-переменные (--bg, --s, --ink, --gN, --c-*, --up/dn/wn),
 * которые устанавливаются в CardRoot через data-theme.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyBlock = exports.Skeleton = exports.StoreRow = exports.BulletRow = exports.Modal = exports.ModalBg = exports.Tooltip = exports.Footer = exports.LegendItem = exports.Legend = exports.QuadAnnot = exports.SelectionOverlay = exports.ChartSvg = exports.ChartArea = exports.SearchSelectBtn = exports.SearchInput = exports.SearchWrap = exports.SelectDdItem = exports.SelectDd = exports.SelectDdWrap = exports.TbDivider = exports.TbBtn = exports.Toolbar = exports.Controls = exports.CardSubtitle = exports.CardTitle = exports.TitleBlock = exports.CardHead = exports.CardRoot = exports.KEYFRAMES_CSS = void 0;
const core_1 = require("@superset-ui/core");
const themeTokens_1 = require("./themeTokens");
const EASE = 'cubic-bezier(.2, .8, .25, 1)';
/** Глобальные keyframes инжектируются через <style>-тег в компоненте. */
exports.KEYFRAMES_CSS = `
  @keyframes sr-tt-fade { from { opacity: 0; transform: translateY(-2px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes sr-dd-fade { from { opacity: 0; transform: translateY(-3px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes sr-m-fade { from { opacity: 0 } to { opacity: 1 } }
  @keyframes sr-m-pop  { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
  @keyframes sr-skel-pulse { 0%, 100% { opacity: 0.45 } 50% { opacity: 0.85 } }
`;
/** CSS-переменные DS 2.0 — ставятся на корневом элементе через data-theme */
const themeVars = (t) => (0, core_1.css) `
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
  --f: ${themeTokens_1.FONTS.text};
  --m: ${themeTokens_1.FONTS.mono};
  --ease: ${EASE};
`;
exports.CardRoot = core_1.styled.div `
  &[data-theme='dark'] {
    ${themeVars(themeTokens_1.DARK_TOKENS)}
  }
  &[data-theme='light'] {
    ${themeVars(themeTokens_1.LIGHT_TOKENS)}
  }

  font-family: var(--f);
  color: var(--ink);
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 18px 22px 16px;
  box-shadow: var(--sh);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  font-feature-settings: 'tnum' 1;
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;

  * {
    box-sizing: border-box;
  }
`;
exports.CardHead = core_1.styled.div `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
  flex-shrink: 0;
`;
exports.TitleBlock = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;
exports.CardTitle = core_1.styled.div `
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink);
`;
exports.CardSubtitle = core_1.styled.div `
  font-size: 10px;
  font-weight: 500;
  color: var(--g500);
  font-family: var(--m);
  letter-spacing: 0.02em;
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
exports.Controls = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
`;
exports.Toolbar = core_1.styled.div `
  display: inline-flex;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 3px;
  gap: 1px;
  height: 30px;
`;
exports.TbBtn = core_1.styled.button `
  width: 26px;
  height: 24px;
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
`;
exports.TbDivider = core_1.styled.span `
  width: 1px;
  background: var(--g200);
  margin: 2px 1px;
`;
exports.SelectDdWrap = core_1.styled.div `
  position: relative;
  display: inline-flex;
`;
exports.SelectDd = core_1.styled.div `
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  right: -2px;
  background: var(--s);
  border: 1px solid var(--g300);
  border-radius: 9px;
  padding: 4px;
  min-width: 240px;
  box-shadow: var(--dd-shadow);
  z-index: 200;
  animation: sr-dd-fade 0.12s var(--ease);

  &[data-open='true'] {
    display: block;
  }
`;
exports.SelectDdItem = core_1.styled.button `
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: var(--f);
  font-size: 11px;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.005em;
  text-align: left;
  transition: background 0.12s;

  &:hover,
  &.on {
    background: var(--g100);
  }
  &.on .sdd-l {
    color: var(--c-sky);
  }
  &:hover .sdd-icon,
  &.on .sdd-icon {
    color: var(--c-sky);
  }
  .sdd-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--g500);
    flex-shrink: 0;

    svg {
      width: 14px;
      height: 14px;
    }
  }
  .sdd-l {
    flex: 1;
  }
`;
exports.SearchWrap = core_1.styled.div `
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
  }
  &.has-value .search-clear {
    display: flex;
  }
`;
exports.SearchInput = core_1.styled.input `
  width: 100%;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 7px 10px 7px 28px;
  height: 30px;
  color: var(--ink);
  font-family: var(--f);
  font-size: 11px;
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
exports.SearchSelectBtn = core_1.styled.button `
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
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
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
exports.ChartArea = core_1.styled.div `
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 280px;
  margin-bottom: 14px;
  user-select: none;
  cursor: grab;

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
exports.ChartSvg = core_1.styled.svg `
  display: block;
  width: 100%;
  height: 100%;

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
  .pt.worst-mark {
    stroke: var(--ink);
    stroke-width: 1.5;
  }
`;
exports.SelectionOverlay = core_1.styled.div `
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
exports.QuadAnnot = core_1.styled.div `
  position: absolute;
  pointer-events: none;
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

  [data-theme='light'] & {
    border-color: var(--g200);
  }

  .qa-label {
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 3px;
  }
  .qa-count {
    font-family: var(--f);
    font-size: 13px;
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.01em;
    line-height: 1.1;

    .u {
      font-size: 8.5px;
      font-weight: 600;
      color: var(--g500);
      margin-left: 3px;
      font-family: var(--m);
    }
  }
  .qa-loss {
    font-size: 8.5px;
    font-weight: 600;
    color: var(--g500);
    margin-top: 2px;
  }
`;
exports.Legend = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
  padding-top: 6px;
`;
exports.LegendItem = core_1.styled.button `
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;
  background: none;
  border: none;
  padding: 2px 4px;
  border-radius: 4px;

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
    font-size: 10px;
    font-weight: 600;
    color: var(--g600);
    letter-spacing: 0.03em;
  }
  &:hover .lg-l {
    color: var(--ink);
  }
`;
exports.Footer = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--g200);
  font-family: var(--m);
  font-size: 10px;
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
  .hint-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .hint-item svg {
    width: 11px;
    height: 11px;
    color: var(--g500);
  }
  kbd {
    display: inline-block;
    background: var(--g100);
    border: 1px solid var(--g300);
    border-radius: 3px;
    padding: 1px 5px;
    font-family: var(--m);
    font-size: 9px;
    font-weight: 700;
    color: var(--g700);
    line-height: 1;
    vertical-align: baseline;
  }
`;
exports.Tooltip = core_1.styled.div `
  position: fixed;
  background: var(--g100);
  border: 1px solid var(--g300);
  border-radius: 10px;
  padding: 12px 14px 10px;
  box-shadow: var(--tooltip-shadow);
  font-family: var(--f);
  font-size: 11px;
  color: var(--ink);
  pointer-events: none;
  z-index: 2000;
  min-width: 240px;
  max-width: 300px;
  display: none;
  animation: sr-tt-fade 0.12s var(--ease);

  &[data-visible='true'] {
    display: block;
  }

  .tt-head {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding-bottom: 9px;
    margin-bottom: 9px;
    border-bottom: 1px solid var(--g200);
  }
  .tt-status {
    width: 8px;
    border-radius: 3px;
    flex-shrink: 0;
    align-self: stretch;
  }
  .tt-titles {
    flex: 1;
    min-width: 0;
  }
  .tt-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.25;
    margin-bottom: 2px;
    letter-spacing: -0.005em;
  }
  .tt-sub {
    font-size: 9px;
    font-weight: 500;
    color: var(--g500);
    font-family: var(--m);
    letter-spacing: 0.02em;
  }
  .tt-rows {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .tt-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 14px;
    font-family: var(--m);
  }
  .tt-l {
    font-size: 9.5px;
    font-weight: 500;
    color: var(--g500);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .tt-v {
    font-size: 11px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.005em;

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
    font-size: 10px;
    font-weight: 600;
    letter-spacing: -0.005em;
  }
  .tt-foot {
    margin-top: 9px;
    padding-top: 9px;
    border-top: 1px solid var(--g200);
    font-family: var(--m);
    font-size: 9px;
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
    font-size: 8px;
    font-weight: 700;
    color: var(--g700);
    line-height: 1;
  }
`;
/* ============================================================
 * Modals
 * ============================================================ */
exports.ModalBg = core_1.styled.div `
  position: fixed;
  inset: 0;
  background: var(--modal-scrim);
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
exports.Modal = core_1.styled.div `
  background: var(--s);
  border: 1px solid var(--g300);
  border-radius: 16px;
  padding: 24px 28px;
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
    font-size: 18px;
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.01em;
    line-height: 1.25;
    margin-bottom: 2px;
  }
  .m-sub {
    font-size: 10px;
    font-weight: 500;
    color: var(--g500);
    font-family: var(--m);
    letter-spacing: 0.02em;
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
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--g500);
    font-family: var(--m);
    margin-bottom: 6px;
  }
  .m-stat-v {
    font-size: 18px;
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.02em;
    line-height: 1.1;

    .u {
      font-weight: 600;
      color: var(--g500);
      font-size: 11px;
      margin-left: 2px;
    }
  }
  .m-stat-d {
    font-size: 9.5px;
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
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--g500);
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
exports.BulletRow = core_1.styled.div `
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
    font-size: 10px;
    font-weight: 700;
    color: var(--g500);
    letter-spacing: 0.04em;
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
    font-size: 12px;
    font-weight: 700;
    text-align: right;
    letter-spacing: -0.005em;

    .plan-note {
      display: block;
      font-size: 8.5px;
      font-weight: 500;
      color: var(--g500);
      margin-top: 1px;
    }
  }
`;
exports.StoreRow = core_1.styled.div `
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 60px minmax(120px, 180px) 60px minmax(120px, 180px);
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 7px;
  background: var(--g50);
  border: 1px solid var(--g200);
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: var(--g100);
  }

  .rank {
    font-family: var(--m);
    font-size: 9px;
    font-weight: 700;
    color: var(--g500);
    text-align: center;
  }
  .name {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    .city {
      color: var(--g500);
      font-weight: 500;
      font-size: 9.5px;
      font-family: var(--m);
      margin-left: 6px;
    }
  }
  .cell-v {
    font-family: var(--m);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: -0.005em;
    text-align: right;

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
  .mini-target {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 2px;
    background: var(--ink);
    border-radius: 1px;
  }
`;
exports.Skeleton = core_1.styled.div `
  background: var(--g100);
  border-radius: 6px;
  animation: sr-skel-pulse 1.4s ease-in-out infinite;
`;
exports.EmptyBlock = core_1.styled.div `
  padding: 24px 12px;
  text-align: center;
  color: var(--g500);
  font-family: var(--m);
  font-size: 10px;
`;
//# sourceMappingURL=styles.js.map