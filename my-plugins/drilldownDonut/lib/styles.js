"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaleBadge = exports.PartialChip = exports.ErrorOverlay = exports.EmptyOverlay = exports.SkeletonOverlay = exports.Hint = exports.LegendChip = exports.Legend = exports.Footer = exports.ChartCanvas = exports.ChartWrap = exports.UnitToggle = exports.Controls = exports.Breadcrumb = exports.HeaderText = exports.Title = exports.CardHead = exports.Card = exports.StructureDonutRoot = exports.KEYFRAMES_CSS = exports.CARD_CLASS = void 0;
const core_1 = require("@superset-ui/core");
const themeTokens_1 = require("./themeTokens");
/*
 * Design System v2.0 tokens as CSS custom properties.
 * Light/dark switching via `data-theme` attribute on the root container.
 *
 * Template-literal values имитируют `ref/structure-donut-prototype.html`
 * один-в-один: padding, radius, border, font-stacks. Единственное отличие —
 * токены читаются через Emotion + React useTheme, а не из window.CSS vars.
 */
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
exports.CARD_CLASS = 'structure-donut-card';
/* ── Keyframes для skeleton и фоновой анимации (6 DataState) ── */
exports.KEYFRAMES_CSS = `
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
exports.StructureDonutRoot = core_1.styled.div `
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
  --c-sky: ${themeTokens_1.LIGHT_TOKENS.cSky};
  --c-violet: ${themeTokens_1.LIGHT_TOKENS.cViolet};
  --c-tangerine: ${themeTokens_1.LIGHT_TOKENS.cTangerine};
  --c-fuchsia: ${themeTokens_1.LIGHT_TOKENS.cFuchsia};
  --c-amber: ${themeTokens_1.LIGHT_TOKENS.cAmber};
  --f: ${themeTokens_1.FONTS.text};
  --m: ${themeTokens_1.FONTS.mono};
  --sh: 0 1px 3px rgba(15, 17, 20, 0.06);
  --ease: ${EASE};

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
    --c-sky: ${themeTokens_1.DARK_TOKENS.cSky};
    --c-violet: ${themeTokens_1.DARK_TOKENS.cViolet};
    --c-tangerine: ${themeTokens_1.DARK_TOKENS.cTangerine};
    --c-fuchsia: ${themeTokens_1.DARK_TOKENS.cFuchsia};
    --c-amber: ${themeTokens_1.DARK_TOKENS.cAmber};
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
exports.Card = core_1.styled.div `
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
exports.CardHead = core_1.styled.div `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;
exports.Title = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;
exports.HeaderText = core_1.styled.div `
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink);
`;
exports.Breadcrumb = core_1.styled.div `
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
exports.Controls = core_1.styled.div `
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
`;
exports.UnitToggle = core_1.styled.div `
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
exports.ChartWrap = core_1.styled.div `
  position: relative;
  flex: 1 1 auto;
  min-height: 220px;
`;
exports.ChartCanvas = core_1.styled.div `
  width: 100%;
  height: 100%;
  min-height: 220px;
`;
exports.Footer = core_1.styled.div `
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--g200);
`;
exports.Legend = core_1.styled.div `
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
`;
exports.LegendChip = core_1.styled.div `
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
exports.Hint = core_1.styled.div `
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
exports.SkeletonOverlay = core_1.styled.div `
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
exports.EmptyOverlay = core_1.styled.div `
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
exports.ErrorOverlay = core_1.styled.div `
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
exports.PartialChip = core_1.styled.div `
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
exports.StaleBadge = core_1.styled.div `
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