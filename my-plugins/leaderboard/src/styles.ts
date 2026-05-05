import { styled } from '@superset-ui/core';
import { keyframes } from '@emotion/react';

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

export const KEYFRAMES_CSS = `
@keyframes rs-dd-fade { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rs-bg-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes rs-m-fade  { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes rs-tt-fade { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rs-skeleton { 0% { opacity: .4; } 50% { opacity: .7; } 100% { opacity: .4; } }
`;

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

// DS 2.0 canonical card mount animation. Через emotion keyframes() helper —
// race-condition-free относительно <style dangerouslySetInnerHTML> (см. donut).
const cardInKf = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ================================================================
 * ROOT
 * ================================================================ */

export const Root = styled.div<{ $width: number; $height: number }>`
  width: ${p => p.$width}px;
  height: ${p => p.$height}px;
  /* DS v2.0: container query для fluid типографики */
  container-type: inline-size;
  container-name: leaderboard;
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

  @media (prefers-reduced-motion: never-match) {
    * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export const Wrap = styled.div`
  padding: 16px 16px 24px;
`;

export const Card = styled.section`
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 16px 24px;
  box-shadow: var(--sh);
  /* DS 2.0 mount animation. Эмоция keyframes() гарантирует, что
     animation-name доступен ДО commit'а — без race condition. */
  animation: ${cardInKf} 0.6s ${EASE} both;
`;

export const CardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

export const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

/* DS v2.0 fluid: --fs-micro UPPER моно для заголовка секции */
export const CardTitle = styled.h2`
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink);
  line-height: 1.4;
`;

/* DS v2.0 fluid: --fs-micro моно для подзаголовка */
export const CardSub = styled.div`
  font-size: var(--fs-micro);
  font-weight: 500;
  color: var(--g600);
  font-family: var(--m);
  letter-spacing: 0.01em;
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

export const Controls = styled.div`
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

export const IconButton = styled.button`
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

export const FilterResetRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 10px;
`;

export const FilterResetBtn = styled.button`
  background: none;
  border: none;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.01em;
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

export const SearchWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 220px;
`;

export const SearchIcon = styled.svg`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  color: var(--g600);
  pointer-events: none;
`;

export const SearchInputEl = styled.input`
  width: 100%;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 7px 28px 7px 28px;
  height: 32px;
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
    color: var(--g600);
  }
`;

export const SearchClear = styled.button`
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

export const DdWrap = styled.div`
  position: relative;
`;

export const DdTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 6px 10px;
  height: 32px;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.06em;
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

export const CountBadge = styled.span`
  background: var(--c-sky);
  color: var(--on-accent);
  border-radius: 10px;
  padding: 1px 6px;
  font-family: var(--m);
  font-size: var(--fs-nano);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const DdMenu = styled.div<{ $open: boolean }>`
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

export const DdItem = styled.button<{ $active: boolean }>`
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
  font-size: var(--fs-interactive);
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
    font-size: var(--fs-meta);
    font-weight: 600;
    color: var(--g600);
  }
`;

/* ================================================================
 * TABLE
 * ================================================================ */

export const TableWrap = styled.div`
  border: 1px solid var(--g200);
  border-radius: 10px;
  overflow: hidden;
  background: var(--s);
`;

/* DS v2.0 fluid: --fs-micro UPPER моно для table-header */
export const TableHead = styled.div<{ $cols: string }>`
  display: grid;
  grid-template-columns: ${p => p.$cols};
  gap: 10px;
  padding: 10px 14px;
  background: var(--g50);
  border-bottom: 1px solid var(--g200);
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g600);
  position: sticky;
  top: 0;
  z-index: 5;
`;

export const Th = styled.div<{
  $align?: 'left' | 'right' | 'center';
  $sorted?: boolean;
  $sortable?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: ${p => (p.$sortable ? 'pointer' : 'default')};
  user-select: none;
  min-width: 0;
  transition: color 0.12s var(--ease);
  justify-content: ${p =>
    p.$align === 'right'
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

export const TableBodyEl = styled.div<{ $cols: string }>`
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

export const RowEl = styled.div<{
  $selected?: boolean;
  $dimmed?: boolean;
  $pinned?: boolean;
  $segment?: boolean;
}>`
  position: relative;
  display: grid;
  grid-template-columns: var(--cols);
  gap: 10px;
  padding: 11px 14px 12px;
  align-items: center;
  border-bottom: 1px solid var(--g200);
  transition: background 0.1s var(--ease);
  cursor: pointer;
  background: ${p =>
    p.$segment
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

export const Cell = styled.div<{ $align?: 'left' | 'right' | 'center' }>`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: ${p =>
    p.$align === 'right'
      ? 'flex-end'
      : p.$align === 'center'
        ? 'center'
        : 'flex-start'};
`;

export const TreeCellEl = styled.div<{ $level: number }>`
  display: flex;
  align-items: center;
  padding-left: ${p => p.$level * 18}px;
  position: relative;
`;

export const TreeBullet = styled.span`
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--g500);
  margin-left: 18px;
`;

export const ExBtn = styled.button<{ $open: boolean }>`
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

export const PinBtn = styled.button<{ $active: boolean }>`
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

/* DS v2.0 fluid: --fs-micro моно для rank cell */
export const RankCell = styled.span`
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  color: var(--g600);
  display: flex;
  align-items: center;
  gap: 4px;
`;

/* Store cell — fluid */
export const StoreCellEl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  .store-code {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--fs-interactive);
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.005em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .store-code .code {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 700;
    color: var(--g700);
    background: var(--g100);
    border-radius: 4px;
    padding: 2px 6px;
    flex-shrink: 0;
  }
  .store-meta {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--g600);
    letter-spacing: 0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

/* Bullet — 13px число, 10px план */
export const BulletCellEl = styled.div`
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
    font-size: var(--fs-interactive);
    font-weight: 700;
    letter-spacing: -0.005em;
    font-variant-numeric: tabular-nums;
  }
  .bullet-val .plan {
    font-size: var(--fs-micro);
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
export const DualBulletEl = styled.div`
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
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.06em;
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
    font-size: var(--fs-micro);
    font-weight: 700;
    text-align: right;
    color: var(--ink);
    letter-spacing: -0.005em;
    font-variant-numeric: tabular-nums;
  }
`;

/* DS v2.0 fluid: --fs-interactive моно 700 для number cell */
export const NumCell = styled.span`
  font-family: var(--m);
  font-size: var(--fs-interactive);
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.005em;
  text-align: right;
  font-variant-numeric: tabular-nums;

  .u {
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--g600);
    margin-left: 2px;
  }
`;

/* Drivers — fluid */
export const DriversCellEl = styled.div`
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
    font-size: var(--fs-micro);
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
    font-size: var(--fs-micro);
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
export const ChipCell = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const Chip = styled.span<{
  $color: string;
  $bg: string;
  $border: string;
}>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: ${p => p.$bg};
  border: 1px solid ${p => p.$border};
  border-radius: 12px;
  padding: 4px 10px 4px 8px;
  font-family: var(--m);
  font-size: var(--fs-nano);
  font-weight: 700;
  color: ${p => p.$color};
  letter-spacing: 0.08em;
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
export const CardFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--g200);
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 500;
  color: var(--g600);
  letter-spacing: 0.01em;

  .hint {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .hi {
    display: flex;
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
    font-size: var(--fs-nano);
    font-weight: 700;
    color: var(--g700);
    line-height: 1;
    vertical-align: baseline;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`;

/* ================================================================
 * TOOLTIP — DS 2.0: фон --ink (light) / --s (dark), radius 6px,
 *   padding 8×12px, max-width 240px.
 *   ВАЖНО: на light текст — белый (--s); на dark — тёмный (--ink).
 * ================================================================ */

export const TooltipEl = styled.div<{ $visible: boolean }>`
  position: fixed;
  display: ${p => (p.$visible ? 'block' : 'none')};
  background: var(--ink);
  color: var(--s);
  border: 1px solid var(--g700);
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.32);
  font-family: var(--f);
  font-size: var(--fs-meta);
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
    font-size: var(--fs-meta);
    font-weight: 700;
    color: var(--s);
    line-height: 1.3;
    margin-bottom: 2px;
    letter-spacing: -0.005em;
  }
  .tt-sub {
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--g400);
    font-family: var(--m);
    letter-spacing: 0.01em;
  }
  .tt-trend {
    background: var(--g700);
    border: 1px solid var(--g600);
    border-radius: 4px;
    padding: 6px 8px;
    margin-bottom: 6px;
  }
  .tt-trend-l {
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.06em;
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
    font-size: var(--fs-micro);
    font-weight: 600;
    color: var(--g400);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .tt-v {
    font-size: var(--fs-meta);
    font-weight: 700;
    color: var(--s);
    letter-spacing: -0.005em;
    font-variant-numeric: tabular-nums;
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

export const ModalBg = styled.div<{ $open: boolean }>`
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

export const Modal = styled.div`
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

export const MHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--g200);
`;

export const MStatusBar = styled.div<{ $color: string }>`
  width: 5px;
  border-radius: 2px;
  align-self: stretch;
  flex-shrink: 0;
  background: ${p => p.$color};
`;

export const MTitles = styled.div`
  flex: 1;
  min-width: 0;
`;

/* DS v2.0 fluid: --fs-title для модального заголовка */
export const MTitle = styled.h3`
  font-size: var(--fs-title);
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin-bottom: 3px;
`;

export const MSub = styled.div`
  font-size: var(--fs-micro);
  font-weight: 500;
  color: var(--g600);
  font-family: var(--m);
  letter-spacing: 0.01em;
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

export const MClose = styled.button`
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

export const MContextBc = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  color: var(--g600);
  letter-spacing: 0.06em;
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

export const MSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;

  @media (max-width: 790px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const MStat = styled.div`
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 12px 14px;

  .m-stat-l {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    color: var(--g600);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 6px;
    line-height: 1.3;
  }
  /* DS v2.0: hero KPI в модалке — fluid 28→56 */
  .m-stat-v {
    font-family: var(--f);
    font-size: var(--fs-hero);
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.02em;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  .m-stat-v .u {
    font-size: var(--fs-micro);
    font-weight: 600;
    color: var(--g600);
    margin-left: 3px;
  }
  .m-stat-d {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    margin-top: 6px;
    letter-spacing: 0.01em;
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

export const M3Col = styled.div`
  display: grid;
  grid-template-columns: 1.3fr 1.3fr minmax(260px, 0.8fr);
  gap: 22px;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

export const MSectionL = styled.div`
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g600);
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--g200);
`;

export const MRanked = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

export const MRankRow = styled.div`
  display: grid;
  grid-template-columns: minmax(150px, 1.3fr) minmax(0, 2.6fr) 58px 62px;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 7px;

  .m-rank-name {
    font-size: var(--fs-meta);
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
    font-size: var(--fs-meta);
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.005em;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .m-rank-delta {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    text-align: right;
    letter-spacing: 0.01em;
    font-variant-numeric: tabular-nums;
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

export const MProfile = styled.div`
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
    font-size: var(--fs-micro);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--g600);
    flex-shrink: 0;
  }
  .m-pr-v {
    font-family: var(--f);
    font-size: var(--fs-meta);
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.005em;
    text-align: right;
  }
  .m-pr-v.big {
    font-size: var(--fs-interactive);
  }
  .m-pr-v.mono {
    font-family: var(--m);
  }
`;

export const MTrendWrap = styled.div`
  margin-bottom: 20px;
`;

export const MTrendCard = styled.div`
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

export const MTrendLast = styled.span`
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  color: var(--g700);
  text-transform: none;
  letter-spacing: 0;
`;

/* ================================================================
 * EMPTY / LOADING / ERROR STATES
 * ================================================================ */

export const StateContainer = styled.div`
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
    font-size: var(--fs-body);
    font-weight: 700;
    color: var(--g700);
    letter-spacing: 0.01em;
  }
  .state-desc {
    font-size: var(--fs-body);
    color: var(--g600);
    font-family: var(--m);
    max-width: 420px;
    line-height: 1.5;
  }
`;

export const SkeletonRow = styled.div<{ $cols: string }>`
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
