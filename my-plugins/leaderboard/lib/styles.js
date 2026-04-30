"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MContextBc = exports.MClose = exports.MSub = exports.MTitle = exports.MTitles = exports.MStatusBar = exports.MHead = exports.Modal = exports.ModalBg = exports.TooltipEl = exports.CardFooter = exports.Chip = exports.ChipCell = exports.DriversCellEl = exports.NumCell = exports.DualBulletEl = exports.BulletCellEl = exports.StoreCellEl = exports.RankCell = exports.PinBtn = exports.ExBtn = exports.TreeBullet = exports.TreeCellEl = exports.Cell = exports.RowEl = exports.TableBodyEl = exports.Th = exports.TableHead = exports.TableWrap = exports.DdItem = exports.DdMenu = exports.CountBadge = exports.DdTrigger = exports.DdWrap = exports.SearchClear = exports.SearchInputEl = exports.SearchIcon = exports.SearchWrap = exports.FilterResetBtn = exports.FilterResetRow = exports.IconButton = exports.Controls = exports.CardSub = exports.CardTitle = exports.TitleBlock = exports.CardHead = exports.Card = exports.Wrap = exports.Root = exports.KEYFRAMES_CSS = void 0;
exports.SkeletonRow = exports.StateContainer = exports.MTrendLast = exports.MTrendCard = exports.MTrendWrap = exports.MProfile = exports.MRankRow = exports.MRanked = exports.MSectionL = exports.M3Col = exports.MStat = exports.MSummary = void 0;
const core_1 = require("@superset-ui/core");
/**
 * Styled-компоненты плагина «Рейтинг магазинов».
 *
 * Соответствует DS 2.0 (см. _ds2_doc.txt):
 * - минимум 10px (ничего мельче), интерактивный текст ≥ 11px
 * - UPPERCASE заголовки с letter-spacing 0.05-0.08em
 * - карточка: padding 16×24px, radius 10px
 * - тултип: фон --ink, radius 6px, padding 8×12px, max-width 240px
 * - <14px текст окрашен в --g600 или темнее (не --g500)
 * - --ease: cubic-bezier(.4, 0, .2, 1)
 *
 * Все цвета — через var(--…); значения живут в themeTokens.ts.
 *
 * Transient props ($…): Emotion не пересылает их в DOM — так избегаем
 * React-warning «Unknown prop selected/sortable/open/…» при булевых пропсах.
 */
exports.KEYFRAMES_CSS = `
@keyframes rs-dd-fade { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rs-bg-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes rs-m-fade  { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes rs-tt-fade { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rs-skeleton { 0% { opacity: .4; } 50% { opacity: .7; } 100% { opacity: .4; } }
`;
/* ================================================================
 * ROOT
 * ================================================================ */
exports.Root = core_1.styled.div `
  width: ${p => p.$width}px;
  height: ${p => p.$height}px;
  overflow: auto;
  font-family: var(--f);
  background: var(--bg);
  color: var(--ink);
  font-feature-settings: 'tnum' 1;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  button {
    font-family: inherit;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
exports.Wrap = core_1.styled.div `
  padding: 16px 16px 24px;
`;
exports.Card = core_1.styled.section `
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 16px 24px;
  box-shadow: var(--sh);
`;
exports.CardHead = core_1.styled.div `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;
exports.TitleBlock = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;
/* DS 2.0: заголовок секции — 14px / 700 / UPPERCASE / 0.05em */
exports.CardTitle = core_1.styled.h2 `
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink);
  line-height: 1.3;
`;
/* DS 2.0: подзаголовок — 11px моно, --g600 */
exports.CardSub = core_1.styled.div `
  font-size: 11px;
  font-weight: 500;
  color: var(--g600);
  font-family: var(--m);
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  line-height: 1.4;

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
/* ================================================================
 * TOOLBAR (dropdowns, search, export) — DS 2.0: high=32px, radius 6px
 * ================================================================ */
exports.IconButton = core_1.styled.button `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  color: var(--g600);
  cursor: pointer;
  transition: 0.15s var(--ease);

  &:hover {
    color: var(--c-sky);
    border-color: var(--g300);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  svg {
    width: 14px;
    height: 14px;
  }
`;
exports.FilterResetRow = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 10px;
`;
exports.FilterResetBtn = core_1.styled.button `
  background: none;
  border: none;
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--c-sky);
  cursor: pointer;
  padding: 4px 8px;
  min-height: 28px;

  &:hover {
    color: var(--ink);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
exports.SearchWrap = core_1.styled.div `
  position: relative;
  display: flex;
  align-items: center;
  width: 220px;
`;
exports.SearchIcon = core_1.styled.svg `
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  color: var(--g600);
  pointer-events: none;
`;
exports.SearchInputEl = core_1.styled.input `
  width: 100%;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 7px 28px 7px 28px;
  height: 32px;
  color: var(--ink);
  font-family: var(--f);
  font-size: 12px;
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
    color: var(--g600);
  }
`;
exports.SearchClear = core_1.styled.button `
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

  svg {
    width: 10px;
    height: 10px;
  }
  &:hover {
    color: var(--ink);
    background: var(--g200);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
/* ================================================================
 * DROPDOWN (multi-select) — DS: 32px, moно 11px UPPERCASE
 * ================================================================ */
exports.DdWrap = core_1.styled.div `
  position: relative;
`;
exports.DdTrigger = core_1.styled.button `
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 6px 10px;
  height: 32px;
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--g700);
  cursor: pointer;
  transition: 0.15s var(--ease);

  &:hover {
    border-color: var(--g300);
    color: var(--ink);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  svg {
    width: 10px;
    height: 10px;
    opacity: 0.8;
  }
`;
exports.CountBadge = core_1.styled.span `
  background: var(--c-sky);
  color: var(--on-accent);
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0;
`;
exports.DdMenu = core_1.styled.div `
  display: ${p => (p.$open ? 'block' : 'none')};
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: var(--s);
  border: 1px solid var(--g300);
  border-radius: 8px;
  padding: 4px;
  min-width: 220px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.32);
  z-index: 200;
  animation: rs-dd-fade 0.12s var(--ease);
`;
exports.DdItem = core_1.styled.button `
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
  font-size: 12px;
  font-weight: 500;
  color: var(--ink);
  text-align: left;
  transition: background 0.12s var(--ease);
  min-height: 32px;

  &:hover {
    background: var(--g100);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }

  .dd-check {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1.5px solid var(--g400);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: 0.12s var(--ease);
    background: ${p => (p.$active ? 'var(--c-sky)' : 'transparent')};
    border-color: ${p => (p.$active ? 'var(--c-sky)' : 'var(--g400)')};

    svg {
      width: 9px;
      height: 9px;
      color: var(--on-accent);
      display: ${p => (p.$active ? 'block' : 'none')};
    }
  }
  .dd-item-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dd-item-label {
    flex: 1;
  }
  .dd-item-count {
    font-family: var(--m);
    font-size: 10px;
    font-weight: 600;
    color: var(--g600);
  }
`;
/* ================================================================
 * TABLE
 * ================================================================ */
exports.TableWrap = core_1.styled.div `
  border: 1px solid var(--g200);
  border-radius: 10px;
  overflow: hidden;
  background: var(--s);
`;
/* DS: заголовок столбца — 11px моно 600 UPPERCASE 0.06em */
exports.TableHead = core_1.styled.div `
  display: grid;
  grid-template-columns: ${p => p.$cols};
  gap: 10px;
  padding: 10px 14px;
  background: var(--g50);
  border-bottom: 1px solid var(--g200);
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g600);
  position: sticky;
  top: 0;
  z-index: 5;
`;
exports.Th = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: ${p => (p.$sortable ? 'pointer' : 'default')};
  user-select: none;
  min-width: 0;
  transition: color 0.12s var(--ease);
  justify-content: ${p => p.$align === 'right'
    ? 'flex-end'
    : p.$align === 'center'
        ? 'center'
        : 'flex-start'};
  color: ${p => (p.$sorted ? 'var(--c-sky)' : 'inherit')};

  &:hover {
    color: ${p => (p.$sortable ? 'var(--ink)' : 'inherit')};
  }
  svg.sort-arrow {
    width: 10px;
    height: 10px;
    opacity: 0.8;
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }
`;
exports.TableBodyEl = core_1.styled.div `
  display: flex;
  flex-direction: column;
  max-height: 720px;
  overflow-y: auto;
  --cols: ${p => p.$cols};

  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-track {
    background: var(--g50);
  }
  &::-webkit-scrollbar-thumb {
    background: var(--g300);
    border-radius: 5px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--g400);
  }
`;
exports.RowEl = core_1.styled.div `
  position: relative;
  display: grid;
  grid-template-columns: var(--cols);
  gap: 10px;
  padding: 11px 14px 12px;
  align-items: center;
  border-bottom: 1px solid var(--g200);
  transition: background 0.1s var(--ease);
  cursor: pointer;
  background: ${p => p.$segment
    ? 'var(--g50)'
    : p.$selected || p.$pinned
        ? 'var(--g100)'
        : 'transparent'};
  border-left: ${p => (p.$segment ? '2px solid var(--g300)' : '0')};
  opacity: ${p => (p.$dimmed ? 0.35 : 1)};

  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: var(--g100);
    opacity: ${p => (p.$dimmed ? 0.8 : 1)};
  }
  &::before {
    content: '';
    display: ${p => (p.$selected && !p.$segment ? 'block' : 'none')};
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--c-sky);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }
`;
exports.Cell = core_1.styled.div `
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: ${p => p.$align === 'right'
    ? 'flex-end'
    : p.$align === 'center'
        ? 'center'
        : 'flex-start'};
`;
exports.TreeCellEl = core_1.styled.div `
  display: flex;
  align-items: center;
  padding-left: ${p => p.$level * 18}px;
  position: relative;
`;
exports.TreeBullet = core_1.styled.span `
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--g500);
  margin-left: 18px;
`;
exports.ExBtn = core_1.styled.button `
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: ${p => (p.$open ? 'var(--c-sky)' : 'var(--g600)')};
  cursor: pointer;
  transition: 0.12s var(--ease);
  border-radius: 4px;

  &:hover {
    color: var(--c-sky);
    background: var(--g100);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  svg {
    width: 10px;
    height: 10px;
    transition: transform 0.18s var(--ease);
    transform: ${p => (p.$open ? 'rotate(90deg)' : 'rotate(0deg)')};
  }
`;
exports.PinBtn = core_1.styled.button `
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: ${p => (p.$active ? 'var(--c-sky)' : 'var(--g500)')};
  cursor: pointer;
  transition: 0.12s var(--ease);
  border-radius: 4px;
  margin-left: 2px;

  &:hover {
    color: var(--ink);
    background: var(--g100);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  svg {
    width: 11px;
    height: 11px;
  }
`;
/* Rank — DS: 11px моно 600, цвет --g600 (контраст для <14px) */
exports.RankCell = core_1.styled.span `
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  color: var(--g600);
  display: flex;
  align-items: center;
  gap: 4px;
`;
/* Store cell — 13px name, 11px meta (мин) */
exports.StoreCellEl = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  .store-code {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.005em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .store-code .code {
    font-family: var(--m);
    font-size: 10px;
    font-weight: 700;
    color: var(--g700);
    background: var(--g100);
    border-radius: 4px;
    padding: 2px 6px;
    flex-shrink: 0;
  }
  .store-meta {
    font-family: var(--m);
    font-size: 10px;
    font-weight: 500;
    color: var(--g600);
    letter-spacing: 0.02em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
/* Bullet — 13px число, 10px план */
exports.BulletCellEl = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  width: 100%;

  .bullet-val {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
    font-family: var(--m);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.005em;
  }
  .bullet-val .plan {
    font-size: 10px;
    font-weight: 500;
    color: var(--g600);
  }
  .bullet-track {
    position: relative;
    height: 5px;
    background: var(--g100);
    border-radius: 2px;
    overflow: visible;
  }
  .bullet-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 2px;
    max-width: 100%;
  }
  .bullet-target {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 2px;
    background: var(--ink);
    border-radius: 1px;
  }
`;
/* Dual bullet — 10px label (мин), 11px значение */
exports.DualBulletEl = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  width: 100%;

  .db-row {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr) 52px;
    align-items: center;
    gap: 6px;
  }
  .db-label {
    font-family: var(--m);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .db-track {
    position: relative;
    height: 5px;
    background: var(--g100);
    border-radius: 2px;
  }
  .db-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 2px;
  }
  .db-target {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 2px;
    background: var(--ink);
    border-radius: 1px;
  }
  .db-val {
    font-family: var(--m);
    font-size: 11px;
    font-weight: 700;
    text-align: right;
    color: var(--ink);
    letter-spacing: -0.005em;
  }
`;
/* Number cell — DS: 13px моно 700 */
exports.NumCell = core_1.styled.span `
  font-family: var(--m);
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.005em;
  text-align: right;

  .u {
    font-size: 10px;
    font-weight: 500;
    color: var(--g600);
    margin-left: 2px;
  }
`;
/* Drivers — DS: 11px моно (мин для интерактива/значений) */
exports.DriversCellEl = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  width: 100%;

  .driver-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: baseline;
    gap: 8px;
    font-family: var(--m);
    font-size: 11px;
    line-height: 1.35;
  }
  .driver-name {
    color: var(--g700);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .driver-name .type-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 5px;
    vertical-align: middle;
  }
  .driver-pct {
    font-weight: 700;
    color: var(--ink);
  }
  .driver-delta {
    font-weight: 600;
    font-size: 10px;
  }
  .driver-delta.up {
    color: var(--up);
  }
  .driver-delta.dn {
    color: var(--dn);
  }
  .driver-delta.wn {
    color: var(--g700);
  }
`;
/* Status chip — DS: 10px моно 600 UPPERCASE, pill-radius */
exports.ChipCell = core_1.styled.div `
  display: flex;
  justify-content: flex-end;
`;
exports.Chip = core_1.styled.span `
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: ${p => p.$bg};
  border: 1px solid ${p => p.$border};
  border-radius: 12px;
  padding: 4px 10px 4px 8px;
  font-family: var(--m);
  font-size: 10px;
  font-weight: 700;
  color: ${p => p.$color};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  min-height: 20px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${p => p.$color};
    flex-shrink: 0;
  }
`;
/* Footer */
exports.CardFooter = core_1.styled.footer `
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--g200);
  font-family: var(--m);
  font-size: 11px;
  font-weight: 500;
  color: var(--g600);
  letter-spacing: 0.03em;

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
  .total-right {
    color: var(--g700);
    font-weight: 700;
  }
  kbd {
    display: inline-block;
    background: var(--g100);
    border: 1px solid var(--g300);
    border-radius: 3px;
    padding: 1px 5px;
    font-family: var(--m);
    font-size: 10px;
    font-weight: 700;
    color: var(--g700);
    line-height: 1;
    vertical-align: baseline;
  }
`;
/* ================================================================
 * TOOLTIP — DS 2.0: фон --ink (light) / --s (dark), radius 6px,
 *   padding 8×12px, max-width 240px.
 *   ВАЖНО: на light текст — белый (--s); на dark — тёмный (--ink).
 * ================================================================ */
exports.TooltipEl = core_1.styled.div `
  position: fixed;
  display: ${p => (p.$visible ? 'block' : 'none')};
  background: var(--ink);
  color: var(--s);
  border: 1px solid var(--g700);
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.32);
  font-family: var(--f);
  font-size: 11px;
  pointer-events: none;
  z-index: 2000;
  max-width: 240px;
  animation: rs-tt-fade 0.12s var(--ease);

  .tt-head {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding-bottom: 6px;
    margin-bottom: 6px;
    border-bottom: 1px solid var(--g700);
  }
  .tt-status {
    width: 4px;
    border-radius: 2px;
    flex-shrink: 0;
    align-self: stretch;
  }
  .tt-titles {
    flex: 1;
    min-width: 0;
  }
  .tt-name {
    font-size: 12px;
    font-weight: 700;
    color: var(--s);
    line-height: 1.3;
    margin-bottom: 2px;
    letter-spacing: -0.005em;
  }
  .tt-sub {
    font-size: 10px;
    font-weight: 500;
    color: var(--g400);
    font-family: var(--m);
    letter-spacing: 0.02em;
  }
  .tt-trend {
    background: var(--g700);
    border: 1px solid var(--g600);
    border-radius: 4px;
    padding: 6px 8px;
    margin-bottom: 6px;
  }
  .tt-trend-l {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--g400);
    font-family: var(--m);
    margin-bottom: 3px;
  }
  .tt-rows {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tt-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 14px;
    font-family: var(--m);
  }
  .tt-l {
    font-size: 10px;
    font-weight: 500;
    color: var(--g400);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .tt-v {
    font-size: 11px;
    font-weight: 700;
    color: var(--s);
    letter-spacing: -0.005em;
  }
  .tt-v.up {
    color: var(--up);
  }
  .tt-v.dn {
    color: var(--dn);
  }
  .tt-v.wn {
    color: var(--wn);
  }
`;
/* ================================================================
 * MODAL
 * ================================================================ */
exports.ModalBg = core_1.styled.div `
  position: fixed;
  inset: 0;
  background: rgba(15, 17, 20, 0.6);
  backdrop-filter: blur(4px);
  display: ${p => (p.$open ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40px 20px;
  overflow-y: auto;
  animation: rs-bg-fade 0.18s var(--ease);
`;
exports.Modal = core_1.styled.div `
  background: var(--s);
  border: 1px solid var(--g300);
  border-radius: 10px;
  max-width: 1280px;
  width: 100%;
  padding: 22px 24px 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.36);
  animation: rs-m-fade 0.22s var(--ease);

  &:focus {
    outline: none;
  }
`;
exports.MHead = core_1.styled.div `
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--g200);
`;
exports.MStatusBar = core_1.styled.div `
  width: 5px;
  border-radius: 2px;
  align-self: stretch;
  flex-shrink: 0;
  background: ${p => p.$color};
`;
exports.MTitles = core_1.styled.div `
  flex: 1;
  min-width: 0;
`;
/* DS page title: 28px / 800 / -0.03em. Модаль это не «страница», используем h3 чуть меньше: 20px. */
exports.MTitle = core_1.styled.h3 `
  font-size: 20px;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin-bottom: 3px;
`;
exports.MSub = core_1.styled.div `
  font-size: 11px;
  font-weight: 500;
  color: var(--g600);
  font-family: var(--m);
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .code {
    background: var(--g100);
    border-radius: 4px;
    padding: 2px 6px;
    font-weight: 700;
    color: var(--g700);
  }
  .dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--g400);
  }
`;
exports.MClose = core_1.styled.button `
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--g100);
  border: 1px solid var(--g200);
  color: var(--g700);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.12s var(--ease);
  flex-shrink: 0;

  &:hover {
    background: var(--g200);
    color: var(--ink);
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
exports.MContextBc = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--m);
  font-size: 10px;
  font-weight: 600;
  color: var(--g600);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 8px;

  .bc-item {
    color: var(--g700);
    font-weight: 700;
  }
  .bc-sep {
    color: var(--g500);
  }
  .bc-current {
    color: var(--c-sky);
  }
`;
exports.MSummary = core_1.styled.div `
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;

  @media (max-width: 790px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;
exports.MStat = core_1.styled.div `
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 12px 14px;

  .m-stat-l {
    font-family: var(--m);
    font-size: 11px;
    font-weight: 600;
    color: var(--g600);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 6px;
    line-height: 1.3;
  }
  .m-stat-v {
    font-family: var(--f);
    font-size: 22px;
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .m-stat-v .u {
    font-size: 11px;
    font-weight: 600;
    color: var(--g600);
    margin-left: 3px;
  }
  .m-stat-d {
    font-family: var(--m);
    font-size: 11px;
    font-weight: 600;
    margin-top: 6px;
    letter-spacing: 0.02em;
  }
  .m-stat-d.up {
    color: var(--up);
  }
  .m-stat-d.dn {
    color: var(--dn);
  }
  .m-stat-d.wn {
    color: var(--g700);
  }
`;
exports.M3Col = core_1.styled.div `
  display: grid;
  grid-template-columns: 1.3fr 1.3fr minmax(260px, 0.8fr);
  gap: 22px;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;
exports.MSectionL = core_1.styled.div `
  font-family: var(--m);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g600);
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--g200);
`;
exports.MRanked = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 5px;
`;
exports.MRankRow = core_1.styled.div `
  display: grid;
  grid-template-columns: minmax(150px, 1.3fr) minmax(0, 2.6fr) 58px 62px;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 7px;

  .m-rank-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
    letter-spacing: -0.005em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .m-rank-bar {
    height: 18px;
    background: var(--g100);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
  }
  .m-rank-bar-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 4px;
    transition: width 0.25s var(--ease);
  }
  .m-rank-pct {
    font-family: var(--m);
    font-size: 12px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.005em;
    text-align: right;
  }
  .m-rank-delta {
    font-family: var(--m);
    font-size: 11px;
    font-weight: 600;
    text-align: right;
    letter-spacing: 0.02em;
  }
  .m-rank-delta.up {
    color: var(--up);
  }
  .m-rank-delta.dn {
    color: var(--dn);
  }
  .m-rank-delta.wn {
    color: var(--g700);
  }
`;
exports.MProfile = core_1.styled.div `
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 14px 16px;
  align-self: start;

  .m-pr-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 14px;
    padding: 7px 0;
    border-bottom: 1px solid var(--g200);
  }
  .m-pr-row:first-of-type {
    padding-top: 0;
  }
  .m-pr-row:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
  }
  .m-pr-l {
    font-family: var(--m);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--g600);
    flex-shrink: 0;
  }
  .m-pr-v {
    font-family: var(--f);
    font-size: 12px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.005em;
    text-align: right;
  }
  .m-pr-v.big {
    font-size: 13px;
  }
  .m-pr-v.mono {
    font-family: var(--m);
  }
`;
exports.MTrendWrap = core_1.styled.div `
  margin-bottom: 20px;
`;
exports.MTrendCard = core_1.styled.div `
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 14px 16px 12px;
  position: relative;

  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .trend-overlay {
    cursor: crosshair;
  }
  .trend-hover-line,
  .trend-hover-dot {
    pointer-events: none;
  }
`;
exports.MTrendLast = core_1.styled.span `
  font-family: var(--m);
  font-size: 11px;
  font-weight: 700;
  color: var(--g700);
  text-transform: none;
  letter-spacing: 0;
`;
/* ================================================================
 * EMPTY / LOADING / ERROR STATES
 * ================================================================ */
exports.StateContainer = core_1.styled.div `
  padding: 60px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  .state-icon {
    width: 48px;
    height: 48px;
    color: var(--g300);
  }
  .state-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--g700);
    letter-spacing: 0.03em;
  }
  .state-desc {
    font-size: 12px;
    color: var(--g600);
    font-family: var(--m);
    max-width: 420px;
    line-height: 1.5;
  }
`;
exports.SkeletonRow = core_1.styled.div `
  display: grid;
  grid-template-columns: ${p => p.$cols};
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--g200);
  animation: rs-skeleton 1.2s var(--ease) infinite;

  > div {
    height: 14px;
    background: var(--g100);
    border-radius: 3px;
  }
`;
//# sourceMappingURL=styles.js.map