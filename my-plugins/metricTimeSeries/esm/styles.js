import { styled } from '@superset-ui/core';
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
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
`;
/* ── Root ── */
export const Root = styled.div `
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
  }

  width: 100%;
  height: 100%;
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
export const Card = styled.div `
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
  animation: wo-card-in 0.3s ${EASE} both;

  &:hover {
    border-color: var(--g300);
  }
`;
export const CardHead = styled.div `
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 8px;
  flex-shrink: 0;
`;
export const TitleWrap = styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;
export const Title = styled.div `
  font-family: var(--f);
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.2;
`;
export const Breadcrumb = styled.div `
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--m);
  font-size: 9px;
  color: var(--g500);
  letter-spacing: 0.03em;
  min-height: 16px;
`;
export const BreadcrumbBack = styled.button `
  appearance: none;
  border: none;
  background: var(--g100);
  color: var(--g600);
  cursor: pointer;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
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
export const Controls = styled.div `
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;
export const IconButton = styled.button `
  appearance: none;
  border: 1px solid ${({ active }) => (active ? 'var(--c-sky)' : 'var(--g200)')};
  background: ${({ active }) => (active ? 'var(--c-sky-b)' : 'var(--s)')};
  color: ${({ active }) => (active ? 'var(--c-sky)' : 'var(--g600)')};
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  font-size: 12px;
  line-height: 1;
  transition: all 0.15s ${EASE};

  &:hover:not(:disabled) {
    border-color: var(--g300);
    color: var(--ink);
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 1px;
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
export const UnitToggleGroup = styled.div `
  display: inline-flex;
  border: 1px solid var(--g200);
  border-radius: 6px;
  overflow: hidden;
  background: var(--s);
`;
export const UnitButton = styled.button `
  appearance: none;
  border: none;
  background: ${({ active }) => (active ? 'var(--c-sky)' : 'var(--s)')};
  color: ${({ active }) => (active ? 'var(--s)' : 'var(--g500)')};
  cursor: pointer;
  padding: 4px 10px;
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  transition: all 0.15s ${EASE};

  &:hover:not(:disabled) {
    color: ${({ active }) => (active ? 'var(--s)' : 'var(--ink)')};
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }

  & + & {
    border-left: 1px solid var(--g200);
  }
`;
/* Dropdown */
export const DropdownRoot = styled.div `
  position: relative;
  display: inline-block;
`;
export const DropdownMenu = styled.div `
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 10;
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  animation: wo-dd-fade 0.12s ${EASE};
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
export const DropdownItemRow = styled.span `
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;
export const DropdownItemIcon = styled.span `
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
export const DropdownItem = styled.button `
  appearance: none;
  border: none;
  background: ${({ active }) => (active ? 'var(--c-sky-b)' : 'transparent')};
  color: ${({ active }) => (active ? 'var(--c-sky)' : 'var(--ink)')};
  cursor: pointer;
  text-align: left;
  padding: 6px 10px;
  border-radius: 6px;
  font-family: var(--f);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  transition: background 0.12s ${EASE};

  &:hover {
    background: ${({ active }) => (active ? 'var(--c-sky-b)' : 'var(--g100)')};
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }
`;
/* Chart wrap */
export const ChartWrap = styled.div `
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  cursor: ${({ brushActive, drillable }) => brushActive ? 'crosshair' : drillable ? 'pointer' : 'default'};
`;
export const ChartInner = styled.div `
  width: 100%;
  height: 100%;

  & > div {
    width: 100% !important;
    height: 100% !important;
  }
`;
export const BrushButton = styled.button `
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
export const CardFooter = styled.div `
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
export const Hint = styled.div `
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--f);
  font-size: 10px;
  color: var(--g500);
`;
export const HintItem = styled.span `
  display: inline-flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 12px;
    height: 12px;
  }
`;
export const LegendRow = styled.div `
  display: inline-flex;
  align-items: center;
  gap: 18px;
  justify-self: center;
`;
export const LegendItem = styled.button `
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
export const LegendMark = styled.span `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
`;
export const LegendLabel = styled.span `
  font-family: var(--m);
  font-size: 10px;
  font-weight: 500;
  color: var(--g700);
  letter-spacing: 0.03em;
`;
export const LegendSeparator = styled.span `
  display: inline-block;
  width: 1px;
  height: 14px;
  background: var(--g200);
`;
export const FooterSpacer = styled.div ``;
/* ── States (Design System v2.0) ── */
export const SkeletonWrap = styled.div `
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
`;
export const SkeletonBlock = styled.div `
  width: ${({ w }) => w || '100%'};
  height: ${({ h }) => h || 16}px;
  border-radius: 4px;
  background: var(--g200);
  animation: wo-skeleton-pulse 1.4s ease-in-out infinite;
`;
export const EmptyStateWrap = styled.div `
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 8px;
  height: 100%;
`;
export const EmptyStateIcon = styled.div `
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--g100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--g500);
  font-size: 18px;
`;
export const EmptyStateText = styled.div `
  font-family: var(--f);
  font-size: 13px;
  color: var(--g500);
  text-align: center;
  line-height: 1.4;
`;
export const ErrorStateWrap = styled(EmptyStateWrap) ``;
export const ErrorStateIcon = styled.div `
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--dn-b);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dn);
  font-size: 18px;
  font-weight: 700;

  &::after {
    content: '!';
  }
`;
export const ErrorStateText = styled.div `
  font-family: var(--f);
  font-size: 13px;
  color: var(--dn);
  text-align: center;
  line-height: 1.4;
  max-width: 320px;
`;
export const MockBadge = styled.span `
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--wn-b);
  color: var(--wn);
  font-family: var(--f);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.3px;
  user-select: none;
`;
/** Partial-state badge (shown when some series/data is missing). */
export const PartialBadge = styled.span `
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--wn-b);
  color: var(--wn);
  font-family: var(--f);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  user-select: none;
`;
/** Stale-state indicator: thin animated bar at card top (DS 2.0 §08). */
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
  animation: wo-stale-shimmer 2.4s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: var(--c-sky-b);
  }
`;
export const StaleLabel = styled.div `
  font-family: var(--m);
  font-size: 9px;
  color: var(--g500);
  margin-top: 2px;
  letter-spacing: 0.04em;
`;
/** Live region for screen-reader announcements. */
export const SrLive = styled.div `
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