import { styled } from '@superset-ui/core';
import { LIGHT_TOKENS as L, DARK_TOKENS as D, FONTS } from './themeTokens';
/*
 * Design System v2.0 tokens as CSS custom properties.
 * Light/dark switching via `data-theme` attribute on the root container.
 *
 * Template-literal values имитируют `ref/structure-donut-prototype.html`
 * один-в-один: padding, radius, border, font-stacks. Единственное отличие —
 * токены читаются через Emotion + React useTheme, а не из window.CSS vars.
 */
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
export const CARD_CLASS = 'structure-donut-card';
/* ── Keyframes для skeleton и фоновой анимации (6 DataState) ── */
export const KEYFRAMES_CSS = `
@keyframes sd-skeleton-pulse{
  0%{opacity:.12}
  50%{opacity:.22}
  100%{opacity:.12}
}
@keyframes sd-fade-in{
  from{opacity:0}
  to{opacity:1}
}
@keyframes sd-card-in{
  from{opacity:0}
  to{opacity:1}
}
`;
/* ── Root container с токенами в обеих темах ── */
export const StructureDonutRoot = styled.div `
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
  --f: ${FONTS.text};
  --m: ${FONTS.mono};
  --sh: 0 1px 3px rgba(15, 17, 20, 0.06);
  --ease: ${EASE};

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
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  animation: sd-card-in 0.2s ${EASE};
`;
export const Card = styled.div `
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 16px 20px 14px;
  overflow: hidden;
  box-shadow: var(--sh);
  display: flex;
  flex-direction: column;
`;
export const CardHead = styled.div `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;
export const Title = styled.div `
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;
export const HeaderText = styled.div `
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink);
`;
export const Breadcrumb = styled.div `
  font-family: var(--m);
  font-size: 9px;
  color: var(--g500);
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 14px;

  .bc-back,
  .bc-fwd {
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: var(--m);
    font-size: 11px;
    font-weight: 600;
    color: var(--g500);
    padding: 0 4px;
    border-radius: 3px;
    transition: color 0.15s var(--ease), background 0.15s var(--ease);
    line-height: 1;
    display: inline-flex;
    align-items: center;
    height: 16px;

    &:hover {
      color: var(--ink);
      background: var(--g100);
    }
    &:focus-visible {
      outline: 2px solid var(--c-sky);
      outline-offset: 2px;
    }
  }
  .bc-cur {
    color: var(--g600);
    font-weight: 500;
  }
  .bc-sel {
    color: var(--ink);
    font-weight: 600;
  }
`;
export const Controls = styled.div `
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
`;
export const UnitToggle = styled.div `
  display: flex;
  gap: 2px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 2px;
  min-height: 28px;

  button {
    border: none;
    background: transparent;
    font-family: var(--m);
    font-size: 10px;
    font-weight: 600;
    color: var(--g500);
    padding: 4px 11px;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.15s var(--ease);
    min-height: 22px;
    min-width: 28px;
    letter-spacing: 0.02em;
  }
  button:hover {
    color: var(--ink);
  }
  button.on {
    background: var(--c-sky);
    color: #fff;
    box-shadow: var(--sh);
  }
  button:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
export const ChartWrap = styled.div `
  position: relative;
  flex: 1 1 auto;
  min-height: 220px;
`;
export const ChartCanvas = styled.div `
  width: 100%;
  height: 100%;
  min-height: 220px;
`;
export const Footer = styled.div `
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--g200);
`;
export const Legend = styled.div `
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
`;
export const LegendChip = styled.div `
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;
  padding: 2px 4px;
  border-radius: 4px;

  &.off {
    opacity: 0.35;
  }
  &:hover .lg-l {
    color: var(--ink);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }

  .lg-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .lg-l {
    font-family: var(--m);
    font-size: 10px;
    font-weight: 500;
    color: var(--g600);
    letter-spacing: 0.03em;
    white-space: nowrap;
    transition: color 0.15s var(--ease);
  }
`;
export const Hint = styled.div `
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--m);
  font-size: 10px;
  font-weight: 500;
  color: var(--g500);
  letter-spacing: 0.03em;
  white-space: nowrap;
  flex-wrap: wrap;
  justify-content: center;

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
/* ── DataState overlays ── */
export const SkeletonOverlay = styled.div `
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;

  &::before {
    content: '';
    display: block;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    border: 20px solid var(--g200);
    animation: sd-skeleton-pulse 1.2s ease-in-out infinite;
  }
`;
export const EmptyOverlay = styled.div `
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  font-family: var(--m);
  font-size: 11px;
  color: var(--g500);
  letter-spacing: 0.03em;
  text-align: center;
`;
export const ErrorOverlay = styled.div `
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 220px;
  font-family: var(--f);
  font-size: 13px;
  color: var(--dn);

  .sd-error-sub {
    font-family: var(--m);
    font-size: 10px;
    color: var(--g500);
    letter-spacing: 0.03em;
  }
`;
export const PartialChip = styled.div `
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--m);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--wn);
  background: rgba(204, 182, 4, 0.1);
  padding: 3px 8px;
  border-radius: 4px;
  margin-top: 6px;
  align-self: flex-start;
`;
export const StaleBadge = styled.div `
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--m);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--wn);
  margin-top: 2px;
`;
//# sourceMappingURL=styles.js.map