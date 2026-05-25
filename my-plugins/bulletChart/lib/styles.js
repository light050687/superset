"use strict";
/**
 * Emotion styled-components для Bullet Chart (Design System v2.0 — Cool Steel).
 *
 * Дизайн-токены инжектируются как CSS custom properties на корневой Root
 * в зависимости от data-theme="light|dark". Все компоненты используют var(--X).
 * Keyframes подаются отдельной <style> тэгом в BulletChart.tsx.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtRow = exports.TtRows = exports.TtSub = exports.TtName = exports.TtStatus = exports.TtHead = exports.Tooltip = exports.Kbd = exports.LegendBand = exports.LegendTarget = exports.LegendBar = exports.LegendItem = exports.FootLegend = exports.FootHint = exports.CardFooter = exports.BSpark = exports.BMetaV = exports.BMetaL = exports.BMetaCell = exports.BMetaRow = exports.BTarget = exports.BBar = exports.BBand = exports.BChart = exports.BArrow = exports.BVal = exports.BMain = exports.BMeta = exports.BName = exports.BNameWrap = exports.BTop = exports.BRow = exports.BulletList = exports.FilterPill = exports.FilterBadges = exports.IconDdBtn = exports.IconDd = exports.IconDdWrap = exports.Controls = exports.CardSub = exports.CardTitle = exports.TitleBlock = exports.CardHead = exports.StaleBar = exports.MockBadge = exports.PartialBadge = exports.Card = exports.Root = exports.KEYFRAMES_CSS = exports.ROOT_CLASS = void 0;
exports.RetryButton = exports.ErrorRowInner = exports.LoaderRowInner = exports.InlineSpinnerLarge = exports.InlineSpinnerSmall = exports.RefreshBar = exports.PageInput = exports.PageEllipsis = exports.PageBtn = exports.PaginationWrap = exports.TtDot = exports.TtHeadBody = exports.DetailErrorBlock = exports.FootDot = exports.HintCaption = exports.ErrorCaption = exports.Skeleton = exports.StateOverlay = exports.StoreRow = exports.StoreListWrap = exports.StoreList = exports.ModalSectionL = exports.ModalSection = exports.ModalStatD = exports.ModalStatV = exports.ModalStatL = exports.ModalStat = exports.ModalSummary = exports.ModalCloseBtn = exports.ModalSub = exports.ModalTitle = exports.ModalTitles = exports.ModalHead = exports.ModalBox = exports.ModalBg = exports.TtFoot = exports.TtStatusText = exports.TtV = exports.TtL = void 0;
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
/* ── Emotion keyframes для DetailModal (рендерится в портале к rootEl).
   Через keyframes() helper — Emotion гарантированно инжектит @keyframes
   в CSS bundle с уникальным именем; не зависит от <style> injection
   или DOM scope портала. Тот же паттерн что в scorecard styles.ts. */
const spinKf = (0, react_1.keyframes) `
  to { transform: rotate(360deg); }
`;
const refreshSlideKf = (0, react_1.keyframes) `
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
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
  /* DS v2.1 §02/§07 «Заголовок карточки» — как Velocity .vd-title:
     Manrope 14px base, 16px ≥768px (container-query), 700, 0.05em UPPER ink. */
  font-family: var(--f);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.3;
  text-transform: uppercase;
  color: var(--ink);
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  @container bullet (min-width: 768px) {
    font-size: 16px;
  }
`;
exports.CardSub = core_1.styled.div `
  /* DS v2.1 §02 «Подзаголовок / мета» — как Velocity .vd-sub:
     11px моно 400 g600 (микро-метка) */
  font-family: var(--m);
  font-size: 11px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--g600);
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--g400); }
  .strong { color: var(--g600); font-weight: 400; }
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
  /* Гарантия stacking context чтобы open menu не уезжало под соседей. */
  z-index: 1;
  &:has(> div[data-open='true']) { z-index: 9999; }
`;
exports.IconDd = core_1.styled.div `
  position: absolute;
  top: 0; left: 0; right: 0;
  background: var(--g100);
  border: 1px solid ${({ open }) => (open ? 'var(--g300)' : 'var(--g200)')};
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.15s ${EASE};
  z-index: ${({ open }) => (open ? 9999 : 1)};
  box-shadow: ${({ open }) => (open ? '0 10px 28px rgba(15,17,20,.15)' : 'none')};
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
/* ── Filter badges (compact toggle, как Velocity .vd-dir-dd-trigger) ──
   Два бейджа в ряд: «Хуже плана» (red tone) + «Лучше плана» (green tone).
   Каждый — независимый toggle с tinted border при .on. Touch target 44×44
   на xs (ADR-0001), компактные 30 на ≥576px. */
exports.FilterBadges = core_1.styled.div `
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;
exports.FilterPill = core_1.styled.button `
  --pill-color: ${({ tone }) => (tone === 'bad' ? 'var(--dn)' : 'var(--up)')};
  --pill-bg-tint: ${({ tone }) => tone === 'bad' ? 'var(--dn-bg)' : 'var(--up-bg)'};
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${({ active }) => (active ? 'var(--pill-bg-tint)' : 'var(--g100)')};
  border: 1px solid
    ${({ active }) => (active ? 'var(--pill-color)' : 'var(--g200)')};
  border-radius: 6px;
  padding: 6px 10px;
  /* Mobile-first 44×44 (ADR-0001). Desktop ≥576px — компактный 30. */
  min-height: 44px;
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: ${({ active }) => (active ? 'var(--ink)' : 'var(--g600)')};
  cursor: pointer;
  transition: background 0.15s ${EASE}, border-color 0.15s ${EASE},
    color 0.15s ${EASE};
  white-space: nowrap;
  &:hover {
    border-color: ${({ active }) => (active ? 'var(--pill-color)' : 'var(--g300)')};
    color: var(--ink);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  svg {
    width: 11px;
    height: 11px;
    flex-shrink: 0;
    color: var(--pill-color);
  }
  .pill-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--pill-color);
    flex-shrink: 0;
  }
  @media (min-width: 576px) {
    min-height: 30px;
    padding: 4px 9px;
  }
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
  /* DS v2.1 §02/§07 «Заголовок» — Manrope 14px base, 16px ≥768px (container).
     Совпадает с .vd-title из Velocity для одинаковой иерархии «Заголовок ряда». */
  font-family: var(--f);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.3;
  text-transform: uppercase;
  color: var(--ink);
  @container bullet (min-width: 768px) {
    font-size: 16px;
  }
`;
exports.BMeta = core_1.styled.div `
  /* DS v2.1 §02 «Подзаголовок / мета» — 11px моно 400 g600 (как .vd-sub). */
  font-family: var(--m);
  font-size: 11px;
  font-weight: 400;
  color: var(--g600);
  letter-spacing: 0.01em;
  line-height: 1.5;
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
  /* DS v2.1 §02 «Крупное число (hero)» — как Velocity .vd-sm-v:
     clamp(20px, 1.05rem + 1cqi, 28px), Manrope 800, tabular-nums, nowrap.
     В bulletChart 5+ строк делят высоту карточки, при ширине ≈ 320px
     fs-hero (28-56) превращает «2.36 %» в две строки. Локальный clamp 20-28
     решает: 20px на узких, 24-26 на md, 28 на lg.
     container queries ниже расширяют для широких карточек. */
  font-family: var(--f);
  font-size: clamp(20px, 1.05rem + 1cqi, 28px);
  font-weight: 800;
  color: var(--status-color);
  letter-spacing: -0.02em;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  /* Защита от overflow: текст не вылезет, но видно что значение скрыто. */
  overflow: hidden;
  text-overflow: ellipsis;
  .u {
    /* Unit (₽, %) рядом с hero — DS §02 «Подзаголовок» 11px моно. */
    font-family: var(--m);
    font-size: 11px;
    font-weight: 500;
    color: var(--g600);
    margin-left: 4px;
    font-variant-numeric: normal;
  }
  /* Container query: на md+ hero растёт до 24-28, на lg+ — 26-32. */
  @container bullet (min-width: 768px) {
    font-size: clamp(22px, 0.9rem + 1.2cqi, 28px);
  }
  @container bullet (min-width: 992px) {
    font-size: clamp(24px, 0.7rem + 1.4cqi, 32px);
  }
`;
exports.BArrow = core_1.styled.div `
  /* DS v2.1 «Delta-чип после hero» — 11-12px моно 600. */
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  color: var(--status-color);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  @container bullet (min-width: 768px) {
    font-size: 12px;
  }
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
  /* DS v2.1 §02 «Метка KPI» — 11px моно 600 0.06em UPPER g600
     (как .vd-sm-l, но weight 600 = чуть выраженнее для группировки 4 sub-stats). */
  font-family: var(--m);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1.4;
  text-transform: uppercase;
  color: var(--g600);
  /* На узких карточках label не должна переноситься в 2 строки — ellipsis. */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
exports.BMetaV = core_1.styled.div `
  /* DS v2.1 §02 «Sub-stat значение» — 13-14px моно 600 tabular-nums.
     На xs 13, на md+ 14 (chunk шире → readability). */
  font-family: var(--m);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.005em;
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ tone }) => tone === 'up'
    ? 'var(--up)'
    : tone === 'dn'
        ? 'var(--dn)'
        : tone === 'wn'
            ? 'var(--g500)'
            : 'var(--g700)'};
  @container bullet (min-width: 768px) {
    font-size: 14px;
  }
`;
exports.BSpark = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 18px;
  svg { display: block; overflow: visible; }
`;
/* ──────────────────────────────────────────────────────────
   Footer (grid 1fr/auto/1fr — легенда всегда по центру.
   InfoHintAbsolute размещается в правом нижнем углу Card отдельно.)
   ────────────────────────────────────────────────────────── */
exports.CardFooter = core_1.styled.div `
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--g200);
  /* Cascade enter — последний (~0.5s). */
  animation: bc-cascade-in 0.4s ${EASE} 0.5s both;
  font-family: var(--m);
  font-size: 11px;
  font-weight: 400;
  color: var(--g600);
  letter-spacing: 0.01em;
  @media (max-width: 575px) {
    grid-template-columns: 1fr;
  }
`;
/* DEPRECATED: kbd-hint удалён из футера (дублировал i-icon overlay).
   Стиль оставлен для обратной совместимости — старый референс мог импортить. */
exports.FootHint = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 6px;
`;
/* Legend — занимает центральную auto-колонку. На xs (single-column grid)
   тоже остаётся центрированной благодаря justify-self. */
exports.FootLegend = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  grid-column: 2;
  justify-self: center;
  @media (max-width: 575px) {
    grid-column: 1;
    justify-self: center;
  }
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
  box-shadow: none;
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
  /* Mobile-first: 12px scrim padding на xs (модалка занимает 351px из 375).
     На sm+ — 24px полей вокруг модалки. */
  padding: 12px;
  animation: bc-m-fade 0.15s ${EASE};

  @media (min-width: 576px) {
    padding: 24px;
  }
`;
exports.ModalBox = core_1.styled.div `
  background: var(--s);
  border: 1px solid var(--g300);
  /* DS v2.1 §06: Modal radius 12 (≥ контейнера 10). На xs fallback 10. */
  border-radius: 10px;
  /* Mobile-first padding (xs <576). На md+ — просторнее. */
  padding: 14px 14px;
  width: 100%;
  max-width: 820px;
  /* Fluid width: 320px min, 92% viewport, 820px max */
  max-height: clamp(280px, 88vh, 92vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--sh);
  animation: bc-m-pop 0.2s ${EASE};

  @media (min-width: 576px) {
    border-radius: 12px;
    padding: 18px 20px;
  }
  @media (min-width: 768px) {
    padding: 22px 26px;
  }
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
  /* DS §02 «Заголовок раздела» — Manrope 18-22px 800 */
  font-family: ${themeTokens_1.FONTS.text};
  font-size: 18px;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.01em;
  line-height: 1.25;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (min-width: 768px) {
    font-size: 20px;
  }
`;
exports.ModalSub = core_1.styled.div `
  /* DS §02 «Подзаголовок / мета» — 11px mono 400 */
  font-size: 11px;
  font-weight: 400;
  color: var(--g600);
  font-family: var(--m);
  letter-spacing: 0.01em;
`;
exports.ModalCloseBtn = core_1.styled.button `
  background: transparent;
  border: 1px solid var(--g300);
  border-radius: 6px;
  /* Mobile-first: 44×44 touch target (ADR-0001). Desktop — компактнее. */
  width: 44px;
  height: 44px;
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
  svg { width: 16px; height: 16px; }

  @media (min-width: 768px) {
    width: 30px;
    height: 30px;
    svg { width: 14px; height: 14px; }
  }
`;
exports.ModalSummary = core_1.styled.div `
  /* Mobile-first: 2 колонки на xs (<576), 4 на md+. */
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;

  @media (min-width: 576px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 22px;
  }
`;
exports.ModalStat = core_1.styled.div `
  background: var(--g50);
  border: 1px solid var(--g200);
  border-radius: 10px;
  padding: 12px 14px;
`;
exports.ModalStatL = core_1.styled.div `
  /* DS §02 «Метка KPI» — 11px mono 600 0.06em UPPER */
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g600);
  font-family: var(--m);
  margin-bottom: 6px;
`;
exports.ModalStatV = core_1.styled.div `
  /* DS §02 «Крупное число hero» — локальный clamp вместо --fs-hero
     (--fs-hero 28-56 рассчитан на BigNumber, разрывает 4-card grid).
     Manrope tabular-nums + nowrap → значение «2,36 %» в одну строку. */
  font-family: ${themeTokens_1.FONTS.text};
  font-size: clamp(20px, 1.05rem + 1cqi, 28px);
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.02em;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  .u {
    font-weight: 600;
    color: var(--g500);
    font-size: 0.55em;
    margin-left: 2px;
    font-family: var(--m);
  }
  @container bullet (min-width: 760px) {
    font-size: clamp(22px, 1.1rem + 1cqi, 30px);
  }
`;
exports.ModalStatD = core_1.styled.div `
  /* DS §02 «Подзаголовок / мета» — 11px mono 400 */
  font-size: 11px;
  font-weight: 500;
  font-family: var(--m);
  margin-top: 4px;
  line-height: 1.4;
  color: ${({ tone }) => tone === 'up'
    ? 'var(--up)'
    : tone === 'dn'
        ? 'var(--dn)'
        : tone === 'wn'
            ? 'var(--g500)'
            : 'var(--g600)'};
`;
exports.ModalSection = core_1.styled.div `
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  &:last-child { margin-bottom: 0; }
  /* Грузим список — Section может расти и скроллить StoreListWrap. */
  flex: 1;
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
  /* Stale-while-revalidate dimming через inline opacity на ModalSection. */
`;
/* Wrapper для StoreList — ограничивает высоту, скроллится. На xs/sm scroll
   обязателен (модалка короче, content длинный → user gets stuck). */
exports.StoreListWrap = core_1.styled.div `
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  position: relative;
`;
exports.StoreRow = core_1.styled.div `
  /* Mobile-first: rank+name+bar в одну строку, pct+delta под bar'ом.
     На xs (<576) grid 2-row, target touch height ≥ 44px. */
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  grid-template-areas:
    'rank name name'
    'bullet bullet bullet'
    'pct pct delta';
  column-gap: 10px;
  row-gap: 6px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--g50);
  border: 1px solid var(--g200);
  min-height: 44px;

  .rank { grid-area: rank; font-family: var(--m); font-size: var(--fs-micro); font-weight: 700; color: var(--g500); text-align: center; }
  .name { grid-area: name; font-size: var(--fs-meta); font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mini-bullet { grid-area: bullet; height: 16px; background: var(--g200); border-radius: 0; position: relative; overflow: visible; }
  .mini-bar { position: absolute; left: 0; top: 50%; transform: translateY(-50%); height: 8px; border-radius: 0; }
  .mini-target { position: absolute; top: -2px; bottom: -2px; width: 2px; background: var(--ink); border-radius: 0; }
  .pct { grid-area: pct; font-family: var(--m); font-size: var(--fs-meta); font-weight: 700; text-align: left; letter-spacing: -0.01em; }
  .delta { grid-area: delta; font-family: var(--m); font-size: var(--fs-meta); font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
  .delta.up { color: var(--up); }
  .delta.dn { color: var(--dn); }
  .delta.wn { color: var(--g500); }

  @media (min-width: 576px) {
    /* Single-row layout на sm+ — компактнее. */
    grid-template-columns: 24px minmax(0, 1fr) minmax(140px, 200px) 64px 92px;
    grid-template-areas: 'rank name bullet pct delta';
    column-gap: 12px;
    row-gap: 0;
    padding: 8px 12px;
    min-height: 44px;

    .mini-bullet { height: 10px; }
    .mini-bar { height: 6px; }
    .pct { font-size: var(--fs-micro); text-align: right; }
  }
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
/* ══════════════════════════════════════════════════════════
   Server-paged DetailModal — pagination / refresh / spinners
   (DS 2.0: 1:1 со scorecard styles.ts — единая UX-линеечка)
   ══════════════════════════════════════════════════════════ */
const MODAL_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
/* PaginationWrap — DS 2.0 §06: padding 8×24, border-top g100. Touch ≥ 40×40
   desktop / 48×48 mobile (см. PageBtn). */
exports.PaginationWrap = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 24px;
  border-top: 1px solid var(--g200);
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;

  @media (min-width: 769px) {
    /* Совпадает с дефолтом — оставлено для consistency, single-layout не блокируется. */
  }
  @media (max-width: 428px) {
    padding: 8px 14px;
  }
`;
/* PageBtn: 40×40 desktop / 48×48 mobile — touch target ≥ 44×44 на mobile.
   На xs (<576) держим 44 минимум через base styles (mobile-first). */
exports.PageBtn = core_1.styled.button `
  min-width: 44px;
  height: 44px;
  padding: 0 10px;
  border: none;
  border-radius: 6px;
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background 0.15s ${MODAL_EASE};
  background: ${({ isActive }) => (isActive ? 'var(--c-sky)' : 'transparent')};
  color: ${({ isActive }) => (isActive ? 'var(--s)' : 'var(--g600)')};

  &:hover:not(:disabled) {
    background: ${({ isActive }) => isActive ? 'var(--c-sky)' : 'var(--g100)'};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }

  @media (min-width: 769px) {
    min-width: 40px;
    height: 40px;
  }
`;
exports.PageEllipsis = core_1.styled.span `
  min-width: 28px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--g500);
  user-select: none;

  @media (min-width: 769px) {
    height: 40px;
  }
`;
exports.PageInput = core_1.styled.input `
  width: 56px;
  height: 32px;
  margin-left: 8px;
  padding: 0 6px;
  border: 1px solid var(--g200);
  border-radius: 6px;
  font-family: var(--m);
  font-size: var(--fs-meta);
  text-align: center;
  color: var(--ink);
  outline: none;
  background: var(--s);

  &::placeholder {
    color: var(--g400);
    font-weight: 500;
  }
  &:focus {
    border-color: var(--c-sky);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
`;
/* Refresh progress bar — stale-while-revalidate.
   Узкая sky-полоса под header'ом StoreList при смене страницы. */
exports.RefreshBar = core_1.styled.div `
  position: relative;
  height: 2px;
  margin: 0 0 6px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    width: 40%;
    height: 100%;
    background: var(--c-sky);
    animation: ${refreshSlideKf} 1.2s ease-in-out infinite;
  }
`;
/* Inline spinner — DS 2.0 §08 «Загрузка». */
exports.InlineSpinnerSmall = core_1.styled.span `
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 6px;
  border: 1.5px solid var(--g200);
  border-top-color: var(--c-sky);
  border-radius: 50%;
  animation: ${spinKf} 0.7s linear infinite;
  vertical-align: middle;
`;
exports.InlineSpinnerLarge = core_1.styled.span `
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--g200);
  border-top-color: var(--c-sky);
  border-radius: 50%;
  animation: ${spinKf} 0.7s linear infinite;
`;
exports.LoaderRowInner = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 12px;
  color: var(--g600);
  font-size: var(--fs-meta);
`;
exports.ErrorRowInner = core_1.styled.div `
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  color: var(--dn);
  font-size: var(--fs-meta);
`;
exports.RetryButton = core_1.styled.button `
  min-height: 32px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--g300);
  background: var(--s);
  cursor: pointer;
  font-family: var(--m);
  font-size: var(--fs-meta);
  color: var(--ink);

  &:hover:not(:disabled) {
    background: var(--g100);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
//# sourceMappingURL=styles.js.map