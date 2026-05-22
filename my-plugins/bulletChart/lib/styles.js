"use strict";
/**
 * Emotion styled-components для Bullet Chart (Design System v2.0 — Cool Steel).
 *
 * Дизайн-токены инжектируются как CSS custom properties на корневой Root
 * в зависимости от data-theme="light|dark". Все компоненты используют var(--X).
 * Keyframes подаются отдельной <style> тэгом в BulletChart.tsx.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtL = exports.TtRow = exports.TtRows = exports.TtSub = exports.TtName = exports.TtStatus = exports.TtHead = exports.Tooltip = exports.Kbd = exports.LegendBand = exports.LegendTarget = exports.LegendBar = exports.LegendItem = exports.FootLegend = exports.FootHint = exports.CardFooter = exports.BSpark = exports.BMetaV = exports.BMetaL = exports.BMetaCell = exports.BMetaRow = exports.BTarget = exports.BBar = exports.BBand = exports.BChart = exports.BArrow = exports.BVal = exports.BMain = exports.BMeta = exports.BName = exports.BNameWrap = exports.BTop = exports.BRow = exports.BulletList = exports.FilterPill = exports.IconDdBtn = exports.IconDd = exports.IconDdWrap = exports.Controls = exports.CardSub = exports.CardTitle = exports.TitleBlock = exports.CardHead = exports.StaleBar = exports.MockBadge = exports.PartialBadge = exports.Card = exports.Root = exports.KEYFRAMES_CSS = exports.ROOT_CLASS = void 0;
exports.TtDot = exports.TtHeadBody = exports.DetailErrorBlock = exports.FootDot = exports.HintCaption = exports.ErrorCaption = exports.Skeleton = exports.StateOverlay = exports.StoreRow = exports.StoreList = exports.ModalSectionL = exports.ModalSection = exports.ModalStatD = exports.ModalStatV = exports.ModalStatL = exports.ModalStat = exports.ModalSummary = exports.ModalCloseBtn = exports.ModalSub = exports.ModalTitle = exports.ModalTitles = exports.ModalHead = exports.ModalBox = exports.ModalBg = exports.TtFoot = exports.TtStatusText = exports.TtV = void 0;
const core_1 = require("@superset-ui/core");
const react_1 = require("@emotion/react");
const themeTokens_1 = require("./themeTokens");
/** Стандартный easing (совпадает с --ease из прототипа) */
const EASE = 'cubic-bezier(0.2, 0.8, 0.25, 1)';
exports.ROOT_CLASS = 'bullet-chart-root';
// DS 2.0 canonical card mount animation. Через emotion keyframes() helper —
// race-condition-free относительно <style dangerouslySetInnerHTML> (см. donut).
/* Только opacity — transform убран намеренно: Superset dashboard drag-drop
   управляет transform на chart-cell ancestor'е. Конфликт двух transform
   приводил к тому что после перестановки чарт оставался смещённым/невидимым
   до hard refresh. */
const cardInKf = (0, react_1.keyframes) `
  from { opacity: 0; }
  to   { opacity: 1; }
`;
/* ──────────────────────────────────────────────────────────
   Keyframes (инжектятся в <style dangerouslySetInnerHTML>)
   ────────────────────────────────────────────────────────── */
exports.KEYFRAMES_CSS = `
@keyframes bc-row-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@keyframes bc-cascade-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@keyframes bc-bar-grow{from{width:0}to{width:var(--bc-bar-w)}}
@keyframes bc-dd-fade{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}
@keyframes bc-tt-fade{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}
@keyframes bc-m-fade{from{opacity:0}to{opacity:1}}
@keyframes bc-m-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes bc-skeleton-pulse{0%{opacity:.12}50%{opacity:.22}100%{opacity:.12}}
@keyframes bc-stale-slide{0%{background-position:200% 0}100%{background-position:-200% 0}}
`;
/* ──────────────────────────────────────────────────────────
   Root (фиксирует width/height от Superset, задаёт тему)
   ────────────────────────────────────────────────────────── */
exports.Root = core_1.styled.div `
  ${({ isDarkMode }) => {
    const t = isDarkMode ? themeTokens_1.DARK_TOKENS : themeTokens_1.LIGHT_TOKENS;
    return `
      --bg:${t.bg};--s:${t.s};--ink:${t.ink};
      --g50:${t.g50};--g100:${t.g100};--g200:${t.g200};--g300:${t.g300};
      --g400:${t.g400};--g500:${t.g500};--g600:${t.g600};--g700:${t.g700};
      --up:${t.up};--dn:${t.dn};--wn:${t.wn};
      --up-bg:${t.upBg};--dn-bg:${t.dnBg};--wn-bg:${t.wnBg};
      --c-sky:${t.cSky};--c-violet:${t.cViolet};--c-tangerine:${t.cTangerine};
      --band-good:${t.bandGood};--band-warn:${t.bandWarn};--band-bad:${t.bandBad};
      --f:${themeTokens_1.FONTS.text};--m:${themeTokens_1.FONTS.mono};
      --sh:${isDarkMode ? '0 1px 2px rgba(0,0,0,.4)' : '0 1px 2px rgba(15,17,20,.08)'};
    `;
}}
  width: ${({ widthPx }) => widthPx}px;
  height: ${({ heightPx }) => heightPx}px;
  /* DS v2.0: container query для fluid типографики (cqi растёт с шириной карточки) */
  container-type: inline-size;
  container-name: bullet;
  font-family: var(--f);
  color: var(--ink);
  font-feature-settings: 'tnum' 1;
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  * { box-sizing: border-box; }
`;
/* InfoHintCell упразднён → shared <InfoHintCorner> из components/InfoHint. */
/* ──────────────────────────────────────────────────────────
   Card — основная карточка
   ────────────────────────────────────────────────────────── */
exports.Card = core_1.styled.div `
  position: relative;
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 18px 22px 16px;
  box-shadow: var(--sh);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* DS 2.0 mount animation. Эмоция keyframes() — race-condition-free.
     При переходе loading → loaded React unmount'ит loading-Card и mount'ит
     новый → animation запускается ровно когда юзер видит контент. */
  animation: ${cardInKf} 0.5s ${EASE} both;
  &[data-no-anim] { animation: none; }
  /* Dashboard drag: animation re-trigger при remount → плагин невидим.
     ВАЖНО: .dashboard--editing убран — он убивает animation на весь edit mode,
     не только во время drag. Cascade должен играть и в edit mode тоже. */
  .dragdroppable--dragging & {
    animation: none !important;
    opacity: 1 !important;
  }
`;
/* DS 2.0 §06 «Состояния» — Partial badge: данные неполные. */
exports.PartialBadge = core_1.styled.span `
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
  margin-left: 8px;
  vertical-align: middle;
  user-select: none;
`;
/* DS 2.0 «Статусный бейдж ТЕСТ» — 1:1 со scorecard MockBadge.
   Superscript-effect: badge поднят выше базовой линии заголовка. */
exports.MockBadge = core_1.styled.span `
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
  vertical-align: super;
  position: relative;
  top: -2px;
  user-select: none;
`;
/* DS 2.0 §06 «Состояния» — Stale bar: тонкая sky-полоса сверху Card,
   данные из кеша. Slide animation как progress indicator. */
exports.StaleBar = core_1.styled.div `
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
  animation: bc-stale-slide 1.6s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
`;
/* ── Header ── */
exports.CardHead = core_1.styled.div `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
  /* Cascade enter — 0.1s после card mount. */
  animation: bc-cascade-in 0.4s ${EASE} 0.1s both;
`;
exports.TitleBlock = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;
exports.CardTitle = core_1.styled.div `
  /* DS v2.0 fluid: --fs-micro (11-13) UPPER моно для card title */
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink);
`;
exports.CardSub = core_1.styled.div `
  /* DS v2.0 fluid: --fs-meta (12-14) mono для подзаголовка */
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g500);
  font-family: var(--m);
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--g400); }
  .strong { color: var(--g700); font-weight: 600; }
`;
exports.Controls = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;
/* ── Icon dropdown (сортировка) ── */
exports.IconDdWrap = core_1.styled.div `
  position: relative;
  display: inline-block;
  width: 32px;
  height: 30px;
`;
exports.IconDd = core_1.styled.div `
  position: absolute;
  top: 0; left: 0; right: 0;
  background: var(--g100);
  border: 1px solid ${({ open }) => (open ? 'var(--g300)' : 'var(--g200)')};
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.15s ${EASE};
  z-index: ${({ open }) => (open ? 200 : 1)};
  box-shadow: none;
  &:hover { border-color: var(--g300); }
`;
exports.IconDdBtn = core_1.styled.button `
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
  transition: color 0.12s ${EASE};
  &:hover { color: var(--ink); background: var(--g200); }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }
`;
/* ── Filter pill ── */
exports.FilterPill = core_1.styled.button `
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: ${({ active }) => (active ? 'var(--dn)' : 'var(--g100)')};
  border: 1px solid ${({ active }) => (active ? 'var(--dn)' : 'var(--g200)')};
  border-radius: 6px;
  padding: 7px 11px 7px 9px;
  height: 30px;
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 600;
  letter-spacing: 0.01em;
  color: ${({ active }) => (active ? 'var(--s)' : 'var(--g500)')};
  cursor: pointer;
  transition: all 0.15s ${EASE};
  &:hover {
    color: ${({ active }) => (active ? 'var(--s)' : 'var(--ink)')};
    border-color: ${({ active }) => (active ? 'var(--dn)' : 'var(--g300)')};
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  svg { width: 11px; height: 11px; flex-shrink: 0; }
`;
/* ──────────────────────────────────────────────────────────
   Bullet list
   ────────────────────────────────────────────────────────── */
exports.BulletList = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow-y: auto;
  /* Cascade enter — body после header (~0.25s). Сами rows имеют свой bc-row-in. */
  animation: bc-cascade-in 0.5s ${EASE} 0.25s both;
`;
exports.BRow = core_1.styled.div `
  --status-color: ${({ statusColor }) => statusColor};
  position: relative;
  padding: 14px 12px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ${EASE};
  opacity: ${({ dimmed }) => (dimmed ? 0.45 : 1)};
  background: ${({ filtered }) => (filtered ? 'var(--g100)' : 'transparent')};
  animation: bc-row-in 0.25s ${EASE} both;

  &:hover { background: var(--g100); }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: -2px;
  }

  &::after {
    content: '';
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 0;
    height: 1px;
    background: var(--g200);
    opacity: 0.7;
  }
  &:last-child::after { display: none; }

  ${({ filtered }) => filtered
    ? `&::before{
          content:'';
          position:absolute;
          left:0;top:8px;bottom:8px;
          width:3px;
          background:var(--status-color);
          border-radius:0;
        }`
    : ''}
`;
exports.BTop = core_1.styled.div `
  display: grid;
  grid-template-columns: minmax(180px, 1fr) auto;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 8px;
`;
exports.BNameWrap = core_1.styled.div `
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
`;
exports.BName = core_1.styled.div `
  /* DS v2.0 fluid: --fs-body-strong (14-17) для имени bullet-метрики */
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.01em;
`;
exports.BMeta = core_1.styled.div `
  /* DS v2.0 fluid: --fs-meta (12-14) mono для метаданных bullet */
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g500);
  letter-spacing: 0.01em;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;
exports.BMain = core_1.styled.div `
  display: flex;
  align-items: baseline;
  gap: 8px;
  justify-content: flex-end;
`;
exports.BVal = core_1.styled.div `
  /* DS v2.0 P0: hero KPI — fluid clamp(28px, 1.5rem + 2.4cqi, 56px).
     Минимум 28px (бывший 18px нарушал DS v2.0). */
  font-family: var(--m);
  font-size: var(--fs-hero);
  font-weight: 800;
  color: var(--status-color);
  letter-spacing: -0.02em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  .u {
    /* Unit (₽, %) рядом с hero — на одну ступень меньше */
    font-size: var(--fs-meta);
    font-weight: 600;
    color: var(--g500);
    margin-left: 2px;
  }
`;
exports.BArrow = core_1.styled.div `
  /* DS v2.0 fluid: --fs-meta для тренд-стрелки */
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 600;
  color: var(--status-color);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  svg { width: 9px; height: 9px; flex-shrink: 0; }
`;
/* ── Bullet canvas (3 bands + bar + target) ── */
exports.BChart = core_1.styled.div `
  position: relative;
  height: 14px;
  margin: 8px 0 9px;
`;
exports.BBand = core_1.styled.div `
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 0;
  width: ${({ widthPct }) => widthPct}%;
  background: ${({ bg }) => bg === 'good' ? 'var(--band-good)' : bg === 'warn' ? 'var(--band-warn)' : 'var(--band-bad)'};
`;
exports.BBar = core_1.styled.div `
  --bc-bar-w: ${({ widthPct }) => widthPct}%;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0;
  height: 6px;
  width: ${({ widthPct }) => widthPct}%;
  background: var(--status-color);
  border-radius: 0;
  z-index: 2;
  animation: bc-bar-grow 0.4s ${EASE};
`;
exports.BTarget = core_1.styled.div `
  position: absolute;
  top: -2px;
  bottom: -2px;
  left: calc(${({ leftPct }) => leftPct}% - 1.25px);
  width: 2.5px;
  background: var(--ink);
  z-index: 3;
  border-radius: 0;
  &::before, &::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 2px;
    background: var(--ink);
    border-radius: 0;
  }
  &::before { top: -2px; }
  &::after { bottom: -2px; }
`;
/* ── Мета-строка под баром (5 колонок) ── */
exports.BMetaRow = core_1.styled.div `
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  margin-top: 6px;
  padding: 6px 0 0;
  font-family: var(--m);
`;
exports.BMetaCell = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;
exports.BMetaL = core_1.styled.div `
  /* DS v2.0 fluid: --fs-micro UPPER для bullet meta-label */
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g500);
  opacity: 0.85;
`;
exports.BMetaV = core_1.styled.div `
  /* DS v2.0 fluid: --fs-meta для bullet meta-value */
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 600;
  letter-spacing: -0.005em;
  font-variant-numeric: tabular-nums;
  color: ${({ tone }) => tone === 'up'
    ? 'var(--up)'
    : tone === 'dn'
        ? 'var(--dn)'
        : tone === 'wn'
            ? 'var(--g500)'
            : 'var(--g700)'};
`;
exports.BSpark = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 18px;
  svg { display: block; overflow: visible; }
`;
/* ──────────────────────────────────────────────────────────
   Footer
   ────────────────────────────────────────────────────────── */
exports.CardFooter = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--g200);
  /* Cascade enter — последний (~0.5s). */
  animation: bc-cascade-in 0.4s ${EASE} 0.5s both;
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g500);
  letter-spacing: 0.01em;
  flex-wrap: wrap;
  gap: 10px;
`;
exports.FootHint = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 6px;
`;
exports.FootLegend = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
`;
exports.LegendItem = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 5px;
`;
exports.LegendBar = core_1.styled.span `
  width: 14px;
  height: 6px;
  border-radius: 0;
  background: var(--ink);
`;
exports.LegendTarget = core_1.styled.span `
  display: inline-block;
  width: 2.5px;
  height: 10px;
  background: var(--ink);
  border-radius: 0;
  position: relative;
  &::before, &::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 7px;
    height: 1.5px;
    background: var(--ink);
    border-radius: 0;
  }
  &::before { top: -1.5px; }
  &::after { bottom: -1.5px; }
`;
exports.LegendBand = core_1.styled.span `
  display: inline-block;
  width: 14px;
  height: 5px;
  background: var(--g200);
  border-radius: 0;
`;
exports.Kbd = core_1.styled.kbd `
  display: inline-block;
  background: var(--g100);
  border: 1px solid var(--g300);
  border-radius: 6px;
  padding: 1px 5px;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  color: var(--g700);
  line-height: 1;
  vertical-align: baseline;
`;
/* ──────────────────────────────────────────────────────────
   Tooltip
   ────────────────────────────────────────────────────────── */
exports.Tooltip = core_1.styled.div `
  --status-color: ${({ statusColor }) => statusColor};
  position: fixed;
  /* DS 2.1 §08 «Тултипы»: tooltip того же тона что Card surface (НЕ инверт).
     light: white, dark: dark — текст --ink. Border + shadow отделяют от Card. */
  background: var(--s);
  color: var(--ink);
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: var(--sh);
  font-family: var(--f);
  font-size: 11px;
  pointer-events: none;
  z-index: 500;
  max-width: 240px;
  animation: bc-tt-fade 0.12s ${EASE};
`;
exports.TtHead = core_1.styled.div `
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.25);
`;
exports.TtStatus = core_1.styled.div `
  width: 4px;
  border-radius: 2px;
  flex-shrink: 0;
  align-self: stretch;
  background: var(--status-color);
`;
exports.TtName = core_1.styled.div `
  /* Header 13px Manrope 700 — крупнее DS-минимума 11px для читаемости. */
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.3;
  margin-bottom: 1px;
`;
exports.TtSub = core_1.styled.div `
  font-size: 11px;
  font-weight: 400;
  color: var(--g500);
  font-family: var(--m);
  line-height: 1.4;
`;
exports.TtRows = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
exports.TtRow = core_1.styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--m);
`;
exports.TtL = core_1.styled.div `
  font-size: 11px;
  font-weight: 600;
  color: var(--g500);
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;
exports.TtV = core_1.styled.div `
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${({ tone }) => tone === 'up'
    ? 'var(--up)'
    : tone === 'dn'
        ? 'var(--dn)'
        : tone === 'wn'
            ? 'var(--g500)'
            : 'var(--ink)'};
`;
exports.TtStatusText = core_1.styled.div `
  margin-top: 8px;
  padding: 6px 8px;
  background: rgba(128, 128, 128, 0.15);
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  color: var(--status-color);
`;
exports.TtFoot = core_1.styled.div `
  margin-top: 9px;
  padding-top: 9px;
  border-top: 1px solid var(--g200);
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g500);
  display: flex;
  align-items: center;
  gap: 6px;
`;
/* ──────────────────────────────────────────────────────────
   Modal
   ────────────────────────────────────────────────────────── */
exports.ModalBg = core_1.styled.div `
  position: fixed;
  inset: 0;
  /* Scrim + blur — фокус на модалке, фон уходит на задний план (canonical). */
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
  animation: bc-m-fade 0.15s ${EASE};
`;
exports.ModalBox = core_1.styled.div `
  background: var(--s);
  border: 1px solid var(--g300);
  border-radius: 16px;
  padding: 24px 28px;
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--sh);
  animation: bc-m-pop 0.2s ${EASE};
`;
exports.ModalHead = core_1.styled.div `
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
`;
exports.ModalTitles = core_1.styled.div `
  flex: 1;
  min-width: 0;
`;
exports.ModalTitle = core_1.styled.div `
  font-size: var(--fs-title);
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.01em;
  line-height: 1.25;
  margin-bottom: 2px;
`;
exports.ModalSub = core_1.styled.div `
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g500);
  font-family: var(--m);
  letter-spacing: 0.01em;
`;
exports.ModalCloseBtn = core_1.styled.button `
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
  transition: all 0.15s ${EASE};
  &:hover { color: var(--ink); border-color: var(--g500); }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  svg { width: 14px; height: 14px; }
`;
exports.ModalSummary = core_1.styled.div `
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 22px;
`;
exports.ModalStat = core_1.styled.div `
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 12px 14px;
`;
exports.ModalStatL = core_1.styled.div `
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g500);
  font-family: var(--m);
  margin-bottom: 6px;
`;
exports.ModalStatV = core_1.styled.div `
  /* DS v2.0: hero KPI в модалке — fluid 28→56 */
  font-size: var(--fs-hero);
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-family: var(--m);
  font-variant-numeric: tabular-nums;
  .u { font-weight: 600; color: var(--g500); font-size: var(--fs-meta); margin-left: 2px; }
`;
exports.ModalStatD = core_1.styled.div `
  font-size: var(--fs-meta);
  font-weight: 600;
  font-family: var(--m);
  margin-top: 4px;
  color: ${({ tone }) => tone === 'up'
    ? 'var(--up)'
    : tone === 'dn'
        ? 'var(--dn)'
        : tone === 'wn'
            ? 'var(--g500)'
            : 'var(--g700)'};
`;
exports.ModalSection = core_1.styled.div `
  margin-bottom: 20px;
  &:last-child { margin-bottom: 0; }
`;
exports.ModalSectionL = core_1.styled.div `
  /* DS v2.0 fluid: --fs-micro UPPER для section label в модалке */
  font-size: var(--fs-micro);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--g500);
  font-family: var(--m);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .count { color: var(--g700); font-weight: 700; }
`;
exports.StoreList = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 5px;
`;
exports.StoreRow = core_1.styled.div `
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) minmax(140px, 200px) 64px 70px;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--g50);
  border: 1px solid var(--g200);
  .rank { font-family: var(--m); font-size: var(--fs-micro); font-weight: 700; color: var(--g500); text-align: center; }
  .name { font-size: var(--fs-meta); font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mini-bullet { height: 8px; background: var(--g200); border-radius: 0; position: relative; overflow: visible; }
  .mini-bar { position: absolute; left: 0; top: 50%; transform: translateY(-50%); height: 6px; border-radius: 0; }
  .mini-target { position: absolute; top: -2px; bottom: -2px; width: 2px; background: var(--ink); border-radius: 0; }
  .pct { font-family: var(--m); font-size: var(--fs-micro); font-weight: 700; text-align: right; letter-spacing: -0.01em; }
  .delta { font-family: var(--m); font-size: var(--fs-meta); font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
  .delta.up { color: var(--up); }
  .delta.dn { color: var(--dn); }
  .delta.wn { color: var(--g500); }
`;
/* ──────────────────────────────────────────────────────────
   DataState overlays
   ────────────────────────────────────────────────────────── */
exports.StateOverlay = core_1.styled.div `
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px 16px;
  color: var(--g500);
  font-size: var(--fs-body);
  flex: 1;
`;
exports.Skeleton = core_1.styled.div `
  height: 36px;
  border-radius: 6px;
  background: var(--g200);
  animation: bc-skeleton-pulse 1.4s ease-in-out infinite;
  margin-bottom: 8px;
  width: ${({ widthPct }) => (widthPct != null ? `${widthPct}%` : '100%')};
`;
/* ── Inline-style replacements (DS 2.0 §17 — Emotion-only). ── */
/* Error caption used inside StateOverlay (BulletChart loading-error/render-error). */
exports.ErrorCaption = core_1.styled.span `
  color: var(--dn);
`;
/* Hint caption — fluid --fs-micro. */
exports.HintCaption = core_1.styled.span `
  font-size: var(--fs-micro);
  color: var(--g500);
`;
/* Footer dot separator. */
exports.FootDot = core_1.styled.span `
  color: var(--g500);
`;
/* Detail-modal: error block. */
exports.DetailErrorBlock = core_1.styled.div `
  color: var(--dn);
  font-size: var(--fs-meta);
  padding: 12px 0;
`;
/* Tooltip head body — flexible, takes remaining space. */
exports.TtHeadBody = core_1.styled.div `
  flex: 1;
  min-width: 0;
`;
/* Tooltip footer dot separator. */
exports.TtDot = core_1.styled.span `
  color: var(--g400);
`;
//# sourceMappingURL=styles.js.map