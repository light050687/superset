"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableWrap = exports.PageInput = exports.PageEllipsis = exports.PageBtn = exports.PaginationWrap = exports.ResultsCount = exports.FlipLabel = exports.FlipIcon = exports.FlipButton = exports.ModeButton = exports.ModeToggle = exports.ExactMatchLabel = exports.SearchScopeButton = exports.SearchScopeToggle = exports.SearchInput = exports.SearchIcon = exports.SearchBox = exports.ModalToolbar = exports.CloseButton = exports.ModalValue = exports.ModalTitle = exports.ModalHead = exports.Modal = exports.Overlay = exports.DeltaPill = exports.ComparisonValue = exports.ComparisonLabel = exports.ComparisonItem = exports.ComparisonSection = exports.Subtitle = exports.HeroUnit = exports.HeroValue = exports.DataLayer = exports.DataContainer = exports.ToggleButton = exports.ToggleGroup = exports.CardTitle = exports.CardHead = exports.PartialBadge = exports.SkeletonWrap = exports.SkeletonBlock = exports.ErrorStateIcon = exports.EmptyStateText = exports.EmptyStateIcon = exports.EmptyStateWrap = exports.MockBadge = exports.Card = exports.KpiCardRoot = exports.KEYFRAMES_CSS = exports.CARD_CLASS = void 0;
exports.RefreshBar = exports.ExportButton = exports.FooterHint = exports.ModalFoot = exports.TablePill = exports.EmptyRow = exports.Chevron = exports.ChildRow = exports.GroupRow = exports.THRow = exports.THead = exports.DetailTable = void 0;
const core_1 = require("@superset-ui/core");
const themeTokens_1 = require("./themeTokens");
/*
 * Design System v2.0 tokens as CSS custom properties.
 * Light/dark switching via `data-theme` attribute on the root container.
 *
 * Token values are imported from themeTokens.ts (single source of truth).
 * Animations: plain CSS @keyframes injected via <style> in KpiCard.tsx.
 * Timing functions as TS constants (not CSS var()) to avoid Stylis issues.
 * Parent-hover selectors use `.kpi-card:hover` (plain CSS class).
 */
/* ── Shared constants (used in template literals) ── */
/** Standard easing — matches mockup's --ease token */
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
/** Hover-state pill backgrounds (stronger opacity than default --up-b/--dn-b/--wn-b) */
const HOVER_UP = 'rgba(22, 163, 74, 0.15)';
const HOVER_DN = 'rgba(220, 38, 38, 0.15)';
const HOVER_WN = 'rgba(204, 182, 4, 0.15)';
exports.CARD_CLASS = 'kpi-card';
/* ── Keyframes CSS string (injected via <style> in KpiCard.tsx) ── */
exports.KEYFRAMES_CSS = `
@keyframes kpi-card-in{
  from{opacity:0}
  to{opacity:1}
}
@keyframes kpi-sub-in{
  from{opacity:0;transform:translateX(-8px)}
  to{opacity:1;transform:translateX(0)}
}
@keyframes kpi-cmp-in{
  from{opacity:0;transform:translateY(6px)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes kpi-line-in{
  from{transform:scaleX(0)}
  to{transform:scaleX(1)}
}
@keyframes kpi-pill-pop{
  from{opacity:0;transform:translateY(4px)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes kpi-fade-in{
  from{opacity:0}
  to{opacity:1}
}
@keyframes kpi-skeleton-pulse{
  0%{opacity:.12}
  50%{opacity:.22}
  100%{opacity:.12}
}
@keyframes kpi-overlay-in{
  from{opacity:0}
  to{opacity:1}
}
@keyframes kpi-modal-in{
  from{opacity:0;transform:translateY(12px) scale(.97)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
`;
/* ── Root container with theme tokens ── */
exports.KpiCardRoot = core_1.styled.div `
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
  --f: ${themeTokens_1.FONTS.text};
  --m: ${themeTokens_1.FONTS.mono};

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
  }

  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: visible;
  container-type: inline-size;
  container-name: kpi;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
  font-family: var(--f);
  -webkit-font-smoothing: antialiased;

  /* prefers-reduced-motion intentionally omitted —
     animations are core to this visualization's UX.
     If needed, re-enable per WCAG 2.3.3 (Motion from Interaction). */
`;
/* ── Card ── */
exports.Card = core_1.styled.div `
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 16px 20px;
  overflow: hidden;
  position: relative;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
  transition: border-color 0.25s ${EASE};
  animation-name: kpi-card-in;
  animation-duration: 0.6s;
  animation-timing-function: ${EASE};
  animation-fill-mode: both;

  &:hover {
    border-color: var(--g300);
  }

  @container kpi (max-width: 400px) {
    padding: 14px 12px;
  }
  @container kpi (max-width: 320px) {
    padding: 12px 10px;
  }
  @container kpi (max-width: 240px) {
    padding: 10px 8px;
    border-radius: 8px;
  }
  @container kpi (max-width: 180px) {
    padding: 8px 6px;
  }
`;
/** Mock mode badge — matches DS 2.0 "Статусный бейдж": моно, UPPERCASE, 600 */
exports.MockBadge = core_1.styled.span `
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--wn-b);
  color: var(--wn);
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-left: 6px;
  vertical-align: middle;
  user-select: none;
`;
/* ── Empty state ── */
exports.EmptyStateWrap = core_1.styled.div `
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 8px;
  flex: 1;
`;
exports.EmptyStateIcon = core_1.styled.div `
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--g100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--g400);
  font-size: 18px;
`;
exports.EmptyStateText = core_1.styled.div `
  font-family: var(--f);
  font-size: 13px;
  color: var(--g500);
  text-align: center;
  line-height: 1.4;
`;
/** Error state icon — red circle with exclamation mark */
exports.ErrorStateIcon = core_1.styled.div `
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--dn) 15%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--dn);

  &::after {
    content: '!';
  }
`;
/* ── Loading skeleton ── */
exports.SkeletonBlock = core_1.styled.div `
  width: ${({ w }) => w || '100%'};
  height: ${({ h }) => h || 16}px;
  border-radius: 4px;
  background: var(--g200);
  animation: kpi-skeleton-pulse 1.4s ease-in-out infinite;
`;
exports.SkeletonWrap = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
  flex: 1;
`;
/* ── Partial state badge ── */
exports.PartialBadge = core_1.styled.div `
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--wn-b);
  color: var(--wn);
  font-family: var(--f);
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  margin-left: auto;
`;
/* ── Header ── */
exports.CardHead = core_1.styled.div `
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  min-height: 24px;

  @container kpi (max-width: 320px) {
    margin-bottom: 8px;
    min-height: 20px;
  }
  @container kpi (max-width: 240px) {
    margin-bottom: 4px;
  }
`;
exports.CardTitle = core_1.styled.div `
  font-family: var(--f);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 18px;
  text-transform: uppercase;
  color: var(--ink);
  position: relative;
  display: inline-block;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1.5px;
    background: var(--c-sky);
    transition: width 0.3s ${EASE};
  }

  .kpi-card:hover &::after {
    width: 100%;
  }

  @container kpi (max-width: 320px) {
    font-size: 12px;
    letter-spacing: 0.03em;
  }
  @container kpi (max-width: 240px) {
    font-size: 11px;
  }
`;
/* ── Toggle ── */
exports.ToggleGroup = core_1.styled.div `
  display: flex;
  gap: 2px;
  background: var(--g100);
  border-radius: 6px;
  padding: 2px;
  animation-name: kpi-fade-in;
  animation-duration: 0.3s;
  animation-timing-function: ${EASE};
  animation-delay: 0.3s;
  animation-fill-mode: both;

  flex-shrink: 0;

  @container kpi (max-width: 240px) {
    padding: 1px;
    gap: 1px;
  }
`;
exports.ToggleButton = core_1.styled.button `
  border: none;
  background: ${({ active }) => (active ? 'var(--s)' : 'transparent')};
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ active }) => (active ? 'var(--ink)' : 'var(--g400)')};
  padding: 4px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  line-height: 1;
  box-shadow: ${({ active }) => active ? '0 1px 3px rgba(0, 0, 0, 0.06)' : 'none'};

  &:hover {
    color: ${({ active }) => (active ? 'var(--ink)' : 'var(--g600)')};
  }

  @container kpi (max-width: 240px) {
    padding: 3px 6px;
    font-size: 10px;
  }
`;
/* ── Data layers (toggle transition via inline style) ── */
exports.DataContainer = core_1.styled.div `
  display: grid;
  overflow: hidden;
`;
exports.DataLayer = core_1.styled.div `
  grid-area: 1 / 1;
  transition:
    opacity 0.15s ${EASE},
    transform 0.15s ${EASE};
  will-change: opacity, transform;
`;
/* ── Hero number ── */
exports.HeroValue = core_1.styled.div `
  font-family: var(--f);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  margin-bottom: 4px;
  color: var(--ink);
  transition: color 0.2s ${EASE};

  .kpi-card:hover & {
    color: var(--c-sky);
  }

  @container kpi (max-width: 320px) {
    font-size: 24px;
  }
  @container kpi (max-width: 240px) {
    font-size: 20px;
  }
  @container kpi (max-width: 180px) {
    font-size: 16px;
    letter-spacing: -0.01em;
  }
`;
exports.HeroUnit = core_1.styled.span `
  font-size: 14px;
  font-weight: 600;
  margin-left: 2px;
  color: var(--g500);

  @container kpi (max-width: 240px) {
    font-size: 11px;
  }
`;
/* ── Subtitle ── */
exports.Subtitle = core_1.styled.div `
  font-family: var(--m);
  font-size: 11px;
  line-height: 16px;
  color: var(--g600);
  margin-bottom: 14px;
  animation-name: kpi-sub-in;
  animation-duration: 0.5s;
  animation-timing-function: ${EASE};
  animation-delay: 0.4s;
  animation-fill-mode: both;

  @container kpi (max-width: 240px) {
    font-size: 10px;
    margin-bottom: 8px;
  }
  @container kpi (max-width: 180px) {
    display: none;
  }
`;
/* ── Comparisons (horizontal wrap: Plan + YoY side by side) ── */
exports.ComparisonSection = core_1.styled.div `
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 10px;
  position: relative;
  margin-top: auto;
  animation-name: ${({ skipAnimation }) => skipAnimation ? 'none' : 'kpi-cmp-in'};
  animation-duration: 0.5s;
  animation-timing-function: ${EASE};
  animation-delay: 0.55s;
  animation-fill-mode: both;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--g100);
    transform-origin: left;
    animation-name: ${({ skipAnimation }) => skipAnimation ? 'none' : 'kpi-line-in'};
    animation-duration: 0.4s;
    animation-timing-function: ${EASE};
    animation-delay: 0.5s;
    animation-fill-mode: both;
  }

  @container kpi (max-width: 400px) {
    gap: 6px;
    padding-top: 8px;
  }
  @container kpi (max-width: 320px) {
    gap: 4px;
    padding-top: 6px;
  }
  @container kpi (max-width: 240px) {
    flex-direction: column;
    gap: 4px;
  }
`;
exports.ComparisonItem = core_1.styled.div `
  display: flex;
  align-items: baseline;
  gap: 4px;
`;
exports.ComparisonLabel = core_1.styled.span `
  font-family: var(--m);
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g600);
  white-space: nowrap;

`;
exports.ComparisonValue = core_1.styled.span `
  font-family: var(--m);
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--g700);
  white-space: nowrap;
`;
/* ── Delta pill ── */
exports.DeltaPill = core_1.styled.span `
  font-family: var(--m);
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  animation-name: ${({ skipAnimation }) => skipAnimation ? 'none' : 'kpi-pill-pop'};
  animation-duration: 0.45s;
  animation-timing-function: ${EASE};
  animation-delay: 0.7s;
  animation-fill-mode: both;
  transition: background 0.2s ${EASE};

  color: ${({ status }) => {
    if (status === 'up')
        return 'var(--up)';
    if (status === 'dn')
        return 'var(--dn)';
    if (status === 'wn')
        return 'var(--wn)';
    return 'var(--g600)';
}};

  background: ${({ status }) => {
    if (status === 'up')
        return 'var(--up-b)';
    if (status === 'dn')
        return 'var(--dn-b)';
    if (status === 'wn')
        return 'var(--wn-b)';
    return 'transparent';
}};

  .kpi-card:hover & {
    background: ${({ status }) => {
    if (status === 'up')
        return HOVER_UP;
    if (status === 'dn')
        return HOVER_DN;
    if (status === 'wn')
        return HOVER_WN;
    return 'transparent';
}};
  }

  @container kpi (max-width: 400px) {
    padding: 2px 6px;
  }
  @container kpi (max-width: 240px) {
    font-size: 9px;
    padding: 2px 4px;
  }
`;
/* ══════════════════════════════════════════════════════════
   Detail Modal — drill-down overlay with hierarchical table
   ══════════════════════════════════════════════════════════ */
/** Backdrop overlay — renders via portal to document.body */
exports.Overlay = core_1.styled.div `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 10, 0.45);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ closing }) => (closing ? 0 : 1)};
  transition: opacity 0.3s ${EASE};
`;
/** Modal container — responsive with min/max constraints and scroll */
exports.Modal = core_1.styled.div `
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  /* Fluid width: 320px min, 92% of viewport, 1200px max — smooth on every pixel */
  width: clamp(320px, 92vw, 1200px);
  max-height: clamp(260px, 88vh, 85vh);
  min-height: 260px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: ${({ closing }) => closing ? 'translateY(8px) scale(.98)' : 'translateY(0) scale(1)'};
  opacity: ${({ closing }) => (closing ? 0 : 1)};
  transition: transform 0.3s ${EASE}, opacity 0.3s ${EASE};

  @media (max-width: 380px) {
    border-radius: 8px;
  }
`;
/** Modal header row */
exports.ModalHead = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--g100);
  flex-shrink: 0;

  @media (max-width: 428px) {
    padding: 12px 14px;
    gap: 8px;
  }
`;
exports.ModalTitle = core_1.styled.span `
  font-family: var(--f);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 18px;
  color: var(--ink);
`;
exports.ModalValue = core_1.styled.span `
  font-family: var(--m);
  font-size: 14px;
  font-weight: 600;
  color: var(--c-sky);
  font-variant-numeric: tabular-nums;
`;
exports.CloseButton = core_1.styled.button `
  margin-left: auto;
  width: 32px;
  height: 32px;
  border: 1px solid var(--g200);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  color: var(--g500);
  transition: border-color 0.15s ${EASE}, color 0.15s ${EASE};

  &:hover {
    border-color: var(--g300);
    color: var(--g700);
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
/** Toolbar with search, mode toggles, hierarchy flip */
exports.ModalToolbar = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--g100);
  flex-shrink: 0;
  flex-wrap: wrap;
`;
exports.SearchBox = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 0 3px 0 12px;
  height: 32px;
  flex: 1 1 280px;
  min-width: 200px;
  transition: border-color 0.15s ${EASE};

  &:focus-within {
    border-color: var(--g300);
  }
`;
exports.SearchIcon = core_1.styled.svg `
  flex-shrink: 0;
  display: block;
  color: var(--g500);
`;
exports.SearchInput = core_1.styled.input `
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--m);
  font-size: 11px;
  color: var(--ink);
  width: 100%;
  min-width: 0;

  &::placeholder {
    color: var(--g500);
  }
`;
/** Segmented toggle for search scope — sits inside SearchBox */
exports.SearchScopeToggle = core_1.styled.div `
  display: flex;
  gap: 2px;
  background: var(--g100);
  border-radius: 6px;
  padding: 2px;
  flex-shrink: 0;
  margin-left: 4px;
`;
exports.SearchScopeButton = core_1.styled.button `
  border: none;
  background: ${({ active }) => (active ? 'var(--s)' : 'transparent')};
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ active }) => (active ? 'var(--ink)' : 'var(--g500)')};
  padding: 4px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  line-height: 1;
  white-space: nowrap;
  box-shadow: ${({ active }) => active ? '0 1px 3px rgba(0, 0, 0, 0.06)' : 'none'};

  &:hover {
    color: ${({ active }) => (active ? 'var(--ink)' : 'var(--g600)')};
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 1px;
  }
`;
/** Exact match checkbox label — compact, sits at the start of search bar */
exports.ExactMatchLabel = core_1.styled.label `
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--m);
  font-size: 11px;
  color: var(--g500);
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
  white-space: nowrap;
  margin-right: 6px;

  input[type='checkbox'] {
    width: 14px;
    height: 14px;
    accent-color: var(--c-sky);
    cursor: pointer;
    margin: 0;
  }

  &::after {
    content: '';
    display: block;
    width: 1px;
    height: 16px;
    background: var(--g200);
    margin-left: 4px;
    flex-shrink: 0;
  }
`;
exports.ModeToggle = core_1.styled.div `
  display: flex;
  gap: 1px;
  background: var(--g100);
  border-radius: 5px;
  padding: 2px;
  flex-shrink: 0;
`;
exports.ModeButton = core_1.styled.button `
  border: none;
  background: ${({ active }) => (active ? 'var(--s)' : 'transparent')};
  font-family: var(--m);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ active }) => (active ? 'var(--ink)' : 'var(--g500)')};
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.12s ${EASE};
  line-height: 1;
  box-shadow: ${({ active }) => active ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none'};
`;
exports.FlipButton = core_1.styled.button `
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 0 12px;
  height: 32px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  color: var(--g600);
  flex-shrink: 0;
  white-space: nowrap;

  &:hover {
    border-color: var(--g300);
    color: var(--ink);
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
exports.FlipIcon = core_1.styled.span `
  display: inline-block;
  font-size: 11px;
  line-height: 1;
  transition: transform 0.3s ${EASE};
  transform: ${({ flipped }) => (flipped ? 'rotate(180deg)' : 'none')};
`;
exports.FlipLabel = core_1.styled.span `
  font-family: var(--m);
  font-size: 11px;
  font-weight: 500;
  color: var(--g600);
`;
exports.ResultsCount = core_1.styled.span `
  margin-left: auto;
  font-family: var(--m);
  font-size: 11px;
  color: var(--g500);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
`;
/* ── Pagination ── */
exports.PaginationWrap = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 20px;
  border-top: 1px solid var(--g100);
  font-family: var(--m);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
`;
exports.PageBtn = core_1.styled.button `
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: none;
  border-radius: 6px;
  font-family: var(--m);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background 0.15s;
  background: ${({ isActive }) => (isActive ? 'var(--c-sky)' : 'transparent')};
  color: ${({ isActive }) => (isActive ? '#fff' : 'var(--g600)')};

  &:hover {
    background: ${({ isActive }) => (isActive ? 'var(--c-sky)' : 'var(--g100)')};
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
exports.PageEllipsis = core_1.styled.span `
  width: 28px;
  text-align: center;
  color: var(--g400);
  user-select: none;
`;
exports.PageInput = core_1.styled.input `
  width: 50px;
  height: 28px;
  margin-left: 8px;
  padding: 0 6px;
  border: 1px solid var(--g200);
  border-radius: 6px;
  font-family: var(--m);
  font-size: 12px;
  text-align: center;
  color: var(--ink);
  outline: none;
  background: var(--s);

  &::placeholder {
    color: var(--g400);
    font-size: 13px;
    font-weight: 500;
  }

  &:focus {
    border-color: var(--c-sky);
  }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
`;
/** Scrollable table area — both axes scroll when content overflows */
exports.TableWrap = core_1.styled.div `
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
`;
exports.DetailTable = core_1.styled.table `
  width: 100%;
  min-width: 580px;
  border-collapse: collapse;
  table-layout: auto;
`;
exports.THead = core_1.styled.thead `
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--bg);
`;
exports.THRow = core_1.styled.tr `
  & > th {
    padding: 10px 12px;
    font-family: var(--m);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--g600);
    text-align: left;
    border-top: 1px solid var(--g200);
    border-bottom: 1px solid var(--g200);
    white-space: nowrap;
  }

  & > th.r {
    text-align: right;
  }

  @media (max-width: 428px) {
    & > th {
      padding: 8px 8px;
      font-size: 10px;
    }
  }
`;
exports.GroupRow = core_1.styled.tr `
  cursor: pointer;
  user-select: none;
  transition: background 0.1s ${EASE};

  &:hover {
    background: var(--g50);
  }

  & > td {
    font-family: var(--f);
    font-size: 13px;
    line-height: 20px;
    padding: 12px 12px;
    font-weight: 600;
    color: var(--ink);
    border-bottom: 1px solid var(--g100);
    vertical-align: middle;
  }

  & > td.r {
    text-align: right;
    font-family: var(--m);
    font-size: 12px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 428px) {
    & > td {
      padding: 8px 8px;
      font-size: 12px;
      line-height: 18px;
    }
    & > td.r {
      font-size: 11px;
    }
  }
`;
exports.ChildRow = core_1.styled.tr `
  transition: background 0.1s ${EASE};

  &:hover {
    background: var(--g50);
  }

  & > td {
    font-family: var(--f);
    font-size: 12px;
    line-height: 20px;
    padding: 12px 12px;
    color: var(--g600);
    font-weight: 400;
    border-bottom: 1px solid var(--g100);
    vertical-align: middle;
  }

  & > td:first-of-type {
    padding-left: 36px;
  }

  & > td.r {
    text-align: right;
    font-family: var(--m);
    font-size: 12px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 428px) {
    & > td {
      padding: 8px 8px;
      font-size: 11px;
      line-height: 18px;
    }
    & > td:first-of-type {
      padding-left: 28px;
    }
    & > td.r {
      font-size: 11px;
    }
  }
`;
exports.Chevron = core_1.styled.span `
  display: inline-block;
  font-size: 10px;
  width: 16px;
  margin-right: 8px;
  color: var(--g500);
  vertical-align: middle;
  transition: transform 0.2s ${EASE};
  transform: rotate(${({ expanded }) => (expanded ? '90deg' : '0deg')});
`;
/** Empty state row — shown when search yields no results */
exports.EmptyRow = core_1.styled.tr `
  & > td {
    padding: 32px 12px;
    text-align: center;
    font-family: var(--f);
    font-size: 13px;
    color: var(--g500);
  }
`;
/** Small delta pill for table cells */
exports.TablePill = core_1.styled.span `
  font-family: var(--m);
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;

  color: ${({ status }) => {
    if (status === 'up')
        return 'var(--up)';
    if (status === 'dn')
        return 'var(--dn)';
    if (status === 'wn')
        return 'var(--wn)';
    return 'var(--g600)';
}};

  background: ${({ status }) => {
    if (status === 'up')
        return 'var(--up-b)';
    if (status === 'dn')
        return 'var(--dn-b)';
    if (status === 'wn')
        return 'var(--wn-b)';
    return 'transparent';
}};
`;
/** Modal footer */
exports.ModalFoot = core_1.styled.div `
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-top: 1px solid var(--g100);
  flex-shrink: 0;

  @media (max-width: 428px) {
    padding: 8px 14px;
  }
`;
exports.FooterHint = core_1.styled.span `
  font-family: var(--m);
  font-size: 11px;
  color: var(--g500);
`;
exports.ExportButton = core_1.styled.button `
  margin-left: auto;
  border: 1px solid var(--g200);
  background: transparent;
  color: var(--g600);
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    border-color: var(--g300);
    color: var(--ink);
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
/* ── Refresh progress bar (stale-while-revalidate) ── */
exports.RefreshBar = core_1.styled.div `
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  overflow: hidden;
  z-index: 2;

  &::after {
    content: '';
    display: block;
    width: 40%;
    height: 100%;
    background: var(--c-sky, #3B8BD9);
    animation: kpi-refresh-slide 1.2s ease-in-out infinite;
  }

  @keyframes kpi-refresh-slide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }
`;
//# sourceMappingURL=styles.js.map