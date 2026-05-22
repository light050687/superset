"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsCount = exports.FlipLabel = exports.FlipIcon = exports.FlipButton = exports.ModeButton = exports.ModeToggle = exports.ExactMatchLabel = exports.SearchScopeButton = exports.SearchScopeToggle = exports.SearchInput = exports.SearchIcon = exports.SearchBox = exports.ModalToolbar = exports.CloseButton = exports.ModalValue = exports.ModalTitle = exports.TitleRow = exports.TitleBlock = exports.ModalHead = exports.Modal = exports.Overlay = exports.DeltaPill = exports.ComparisonValue = exports.ComparisonLabel = exports.ComparisonItem = exports.ComparisonSection = exports.Subtitle = exports.HeroUnit = exports.HeroValue = exports.DataLayer = exports.DataContainer = exports.ToggleButton = exports.ToggleGroup = exports.CardTitle = exports.CardHead = exports.PartialBadge = exports.SkeletonWrap = exports.SkeletonText = exports.SkeletonBlock = exports.ErrorStateIcon = exports.EmptyStateText = exports.EmptyStateIcon = exports.EmptyStateWrap = exports.MockBadge = exports.Card = exports.KpiCardRoot = exports.KEYFRAMES_CSS = exports.CARD_CLASS = exports.refreshSlideKf = exports.spinKf = void 0;
exports.FooterHintIcon = exports.SortableTh = exports.RetryButton = exports.ErrorRowInner = exports.LoaderRowInner = exports.InlineSpinnerLarge = exports.InlineSpinnerSmall = exports.RefreshBar = exports.ExportButton = exports.FooterHint = exports.ModalFoot = exports.TablePill = exports.EmptyRow = exports.Chevron = exports.ChildRow = exports.GroupRow = exports.THRow = exports.THead = exports.DetailTable = exports.TableWrap = exports.PageInput = exports.PageEllipsis = exports.PageBtn = exports.PaginationWrap = void 0;
const core_1 = require("@superset-ui/core");
const react_1 = require("@emotion/react");
const themeTokens_1 = require("./themeTokens");
/* ── Emotion keyframes (для DetailModal — портал, нужны через keyframes
   функцию, чтобы Emotion гарантированно вставил @keyframes в CSS bundle
   с уникальным именем; не зависит от <style> injection или DOM scope). */
exports.spinKf = (0, react_1.keyframes) `
  to { transform: rotate(360deg); }
`;
exports.refreshSlideKf = (0, react_1.keyframes) `
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
`;
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
/** Hover-state pill backgrounds — color-mix берёт цвет из токена, чтобы тема переключалась автоматически (DS v2.0: запрет hardcoded hex/rgba) */
const HOVER_UP = 'color-mix(in srgb, var(--up) 15%, transparent)';
const HOVER_DN = 'color-mix(in srgb, var(--dn) 15%, transparent)';
const HOVER_WN = 'color-mix(in srgb, var(--wn) 15%, transparent)';
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
  /* Linear-gradient shimmer (вместо opacity-pulse). opacity 0.12-0.22 на
     dark mode давала почти нулевой контраст между --g200 (#272B30) и --s
     (#171A1E) — placeholder-блоки визуально неотличимы от Card background.
     Shift background-position создаёт чёткий визуальный pulse, видимый и
     в light, и в dark режиме. Тот же подход что ds2-skeleton-shimmer в
     head_custom_extra.html — visual continuity между ChartHolder shape-
     skeleton и plugin-internal skeleton. */
  0%{background-position:200% 0}
  100%{background-position:-200% 0}
}
@keyframes kpi-overlay-in{
  from{opacity:0}
  to{opacity:1}
}
@keyframes kpi-modal-in{
  from{opacity:0;transform:translateY(12px) scale(.97)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
@keyframes kpi-spin{
  to{transform:rotate(360deg)}
}
@keyframes kpi-refresh-slide{
  0%{transform:translateX(-100%)}
  50%{transform:translateX(150%)}
  100%{transform:translateX(150%)}
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
  /* max-height: 100% запрещает плагину вырастать выше chart-holder
     родителя. Без этого loaded card content + Card padding мог
     forces chart-holder grow → row equalization растягивает все
     siblings → shift между skeleton (= chart-holder min-height: outerH)
     и loaded размером. С max-height card.overflow:hidden ограничивает
     content внутри fixed area = skeleton/loaded имеют одинаковый
     container size. */
  max-height: 100%;
  /* Размер плагина полностью определяется outer ResizableContainer
     (синяя рамка). Никаких min-height/min-width — визуал заполняет
     рамку и меняется вместе с ней. */
  box-sizing: border-box;
  overflow: hidden;
  container-type: inline-size;
  container-name: kpi;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
  font-family: var(--f);
  -webkit-font-smoothing: antialiased;

  /* WCAG 2.3.3: функциональные анимации (loading spinner, progress bar,
     skeleton-shimmer) НЕ выключаем при prefers-reduced-motion — это
     индикаторы состояния, без которых юзер не понимает что происходит
     (короткие циклические анимации, не трясут глаза). Декоративные
     transitions/transforms выключаются ниже точечно при необходимости. */
`;
/* ── Card ── */
exports.Card = core_1.styled.div `
  /* DS v2.0: визуал заполняет ResizableContainer. Background var(--s) +
     1px g200 border — единый стиль с остальными my-plugins. */
  background: var(--s);
  /* DS 2.0: 1px рамка как у остальных my-plugins. !important чтобы перебить
     outer Superset chart-holder hover (он добавлял outline и box-shadow при
     наведении и мог убрать наш border). */
  border: 1px solid var(--g200) !important;
  border-radius: 10px;
  padding: 16px 20px;
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
  transition: border-color 0.25s ${EASE};
  animation-name: kpi-card-in;
  animation-duration: 0.5s;
  animation-timing-function: ${EASE};
  animation-fill-mode: both;
  &[data-no-anim] { animation-name: none; }
  /* Dashboard drag: React remount-ит компонент → animation
     стартует с opacity:0 → плагин невидим во время drag.
     ВАЖНО: .dashboard--editing убран — он убивает animation на весь edit mode. */
  .dragdroppable--dragging & {
    animation-name: none !important;
    opacity: 1 !important;
  }
  box-shadow: none !important;
  outline: none !important;
  &:hover, &:focus, &:focus-within {
    box-shadow: none !important;
    outline: none !important;
    border-color: transparent !important;
  }

  @container kpi (max-width: 400px) {
    padding: 14px 12px;
  }
  @container kpi (max-width: 320px) {
    padding: 12px 10px;
  }
  @container kpi (max-width: 240px) {
    padding: 10px 8px;
    border-radius: 10px;
  }
  @container kpi (max-width: 180px) {
    padding: 8px 6px;
  }
`;
/* KpiFooterRow упразднён — i-иконка теперь рендерится в ComparisonSection
   (rightmost), на одной линии с ComparisonRow'ами. */
/** Mock mode badge — DS v2.0 "Статусный бейдж": --fs-nano UPPER моно.
    Стиль superscript: text по центру + чуть выше базовой линии (как ²). */
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
  /* Superscript-effect: badge поднят на ~30% высоты от базовой линии,
     как «возведение в квадрат» — визуально badge выше текста заголовка. */
  vertical-align: super;
  position: relative;
  top: -2px;
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
  font-size: var(--fs-subtitle);
`;
exports.EmptyStateText = core_1.styled.div `
  /* DS v2.0 fluid: --fs-interactive (13-15) для empty-state */
  font-family: var(--f);
  font-size: var(--fs-interactive);
  font-weight: 500;
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
  font-size: var(--fs-subtitle);
  font-weight: 700;
  color: var(--dn);

  &::after {
    content: '!';
  }
`;
/* ── Loading skeleton ── */
exports.SkeletonBlock = core_1.styled.div `
  width: ${({ w }) => w || '100%'};
  /* min-height вместо height чтобы block мог расти через flex-grow.
     grow prop управляет распределением free space в SkeletonWrap. */
  min-height: ${({ h }) => h || 16}px;
  flex-grow: ${({ grow }) => grow ?? 0};
  flex-shrink: 0;
  border-radius: 6px;
  /* Linear-gradient между --g100 и --g200: видимый shimmer на любой
     теме (dark/light). Animation kpi-skeleton-pulse теперь сдвигает
     background-position вместо opacity — высокий контраст. */
  background: linear-gradient(
    110deg,
    var(--g100) 8%,
    var(--g200) 18%,
    var(--g100) 33%
  );
  background-size: 200% 100%;
  animation: kpi-skeleton-pulse 1.6s ease-in-out infinite;
`;
/* SkeletonText — inline placeholder который рендерится ВНУТРИ оригинального
   text-component (HeroValue, Subtitle, CardTitle, ComparisonValue и т.д.).
   text invisible (color: transparent), но reserves real text dimensions
   через nbsp/em-dash characters → размер = same as actual text при load.
   Это react-loading-skeleton best practice: identical DOM tree → identical
   размер 1:1 без хардкодов. */
exports.SkeletonText = core_1.styled.span `
  display: inline-block;
  color: transparent !important;
  border-radius: 6px;
  user-select: none;
  /* Linear-gradient shimmer (как SkeletonBlock) — видимый на dark mode. */
  background: linear-gradient(
    110deg,
    var(--g100) 8%,
    var(--g200) 18%,
    var(--g100) 33%
  );
  background-size: 200% 100%;
  animation: kpi-skeleton-pulse 1.6s ease-in-out infinite;
`;
exports.SkeletonWrap = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
  /* flex: 1 распирает SkeletonWrap до Card content height. SkeletonBlock
     внутри с grow={1} заполняет free space → skeleton total = Card height
     автоматически, независимо от outerH. Это устраняет shift между
     skeleton и loaded состоянием когда row align-items: stretch
     растягивает все cards до max content (>= outerH). */
  flex: 1;
  min-height: 0;
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
  font-family: var(--m);
  font-size: var(--fs-nano);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-left: auto;
`;
/* ── Header ── */
exports.CardHead = core_1.styled.div `
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  min-height: 24px;
  /* Cascade enter — header 0.1s (reuse kpi-cmp-in keyframe). */
  animation: kpi-cmp-in 0.4s ${EASE} 0.1s both;

  @container kpi (max-width: 320px) {
    margin-bottom: 8px;
    min-height: 20px;
  }
  @container kpi (max-width: 240px) {
    margin-bottom: 4px;
  }
`;
exports.CardTitle = core_1.styled.div `
  /* DS v2.0 §02 «Заголовок секции»: 14px / 700 / 0.05em / Пропорциональный (sans) UPPER.
     На mobile (<768px) → 13px (адаптивная типографика по дизайн-доку). */
  font-family: var(--f);
  font-size: var(--fs-body);
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.3;
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
`;
/* ── Toggle ── */
exports.ToggleGroup = core_1.styled.div `
  /* Размер 1-в-1 с donut UnitToggle (drilldownDonut/src/styles.ts) —
     юзер хочет одинаковые «бейджи» переключателей у всех ext-* плагинов.
     box-sizing: border-box + height 30px — гарантирует одинаковую
     внешнюю высоту независимо от content-box default. */
  box-sizing: border-box;
  display: flex;
  gap: 2px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 2px;
  height: 30px;
  animation-name: kpi-fade-in;
  animation-duration: 0.45s;
  animation-timing-function: ${EASE};
  animation-delay: 0.45s;
  animation-fill-mode: both;

  flex-shrink: 0;

  @container kpi (max-width: 240px) {
    padding: 1px;
    gap: 1px;
  }
`;
exports.ToggleButton = core_1.styled.button `
  /* Active state и размеры синхронизированы с donut UnitToggle button:
     фон --c-sky, текст --s. DS 2.0 — без тени.
     box-sizing: border-box + height 24px = ToggleGroup-height(30) -
     padding(2*2) = 26 - border(2*1)... — точное совпадение visual */
  box-sizing: border-box;
  border: none;
  background: ${({ active }) => (active ? 'var(--c-sky)' : 'transparent')};
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${({ active }) => (active ? 'var(--s)' : 'var(--g500)')};
  padding: 0 11px;
  height: 24px;
  min-width: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  line-height: 1;

  &:hover {
    color: ${({ active }) => (active ? 'var(--s)' : 'var(--ink)')};
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
/* ── Data layers (toggle transition via inline style) ── */
exports.DataContainer = core_1.styled.div `
  display: grid;
  overflow: hidden;
  /* flex: 1 заполняет Card content area. Используется в обоих состояниях
     (loaded и skeleton) — DOM structure одинаковая → размер совпадает. */
  flex: 1;
  min-height: 0;
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
  /* DS v2.0 fluid: clamp(28px, 1.5rem + 2.4cqi, 56px) — растёт с шириной карточки.
     Минимум 28px (даже на узких карточках), максимум 56px на 4K-мониторах. */
  font-family: var(--f);
  font-size: var(--fs-hero);
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  margin-bottom: 4px;
  color: var(--ink);
  transition: color 0.2s ${EASE};
  /* Cascade enter — hero number 0.3s (между header 0.1s и comparison 0.75s). */
  animation: kpi-cmp-in 0.5s ${EASE} 0.3s both;

  .kpi-card:hover & {
    color: var(--c-sky);
  }
`;
exports.HeroUnit = core_1.styled.span `
  /* DS v2.0 fluid: --fs-meta (12-14) для unit рядом с hero-числом. */
  font-size: var(--fs-meta);
  font-weight: 600;
  margin-left: 2px;
  color: var(--g500);
`;
/* ── Subtitle ── */
exports.Subtitle = core_1.styled.div `
  /* DS v2.0 fluid: --fs-meta (12-14) для subtitle (период/метаданные) */
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 500;
  line-height: 1.4;
  color: var(--g600);
  margin-bottom: 14px;
  animation-name: kpi-sub-in;
  animation-duration: 0.7s;
  animation-timing-function: ${EASE};
  animation-delay: 0.55s;
  animation-fill-mode: both;

  @container kpi (max-width: 428px) {
    margin-bottom: 8px;
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
  animation-duration: 0.7s;
  animation-timing-function: ${EASE};
  animation-delay: 0.75s;
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
    animation-duration: 0.55s;
    animation-timing-function: ${EASE};
    animation-delay: 0.7s;
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
  /* DS v2.0 fluid: --fs-micro (11-13) UPPERCASE для метки сравнения */
  font-family: var(--m);
  font-size: var(--fs-micro);
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g600);
  white-space: nowrap;
`;
exports.ComparisonValue = core_1.styled.span `
  /* DS v2.0 fluid: --fs-meta (12-14) mono с tabular-nums */
  font-family: var(--m);
  font-size: var(--fs-meta);
  line-height: 1.4;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--g700);
  white-space: nowrap;
`;
/* ── Delta pill ── */
exports.DeltaPill = core_1.styled.span `
  /* DS v2.0 fluid: --fs-meta (12-14) mono для delta-pill (≥12 даже на узких) */
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  animation-name: ${({ skipAnimation }) => skipAnimation ? 'none' : 'kpi-pill-pop'};
  animation-duration: 0.6s;
  animation-timing-function: ${EASE};
  animation-delay: 0.95s;
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

  @container kpi (max-width: 428px) {
    padding: 2px 6px;
  }
`;
/* ══════════════════════════════════════════════════════════
   Detail Modal — drill-down overlay with hierarchical table
   ══════════════════════════════════════════════════════════ */
/** Backdrop overlay — renders via portal to document.body.
    Scrim 0.65 + blur 3px — canonical (синхронизировано с другими плагинами). */
exports.Overlay = core_1.styled.div `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
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
  /* iter 8.10: tabIndex={-1} получает программный focus при mount, чтобы
     визуальный focus-ring НЕ оказался на крестике. outline:none скрывает
     ring на самом Modal (фокус нужен только для Tab-trap и a11y). */
  outline: none;
  /* DS v2.1 §06: Modal — radius 12 (визуальная иерархия выше базового
     контейнера 10). На мобиле fallback 10 (компактнее на узких экранах). */
  border-radius: 12px;
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
    border-radius: 10px;
  }
`;
/** Modal header row */
exports.ModalHead = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 12px;
  /* DS v2.1 §06: Modal padding 20×24 (увеличено с базовых 16×20). */
  padding: 20px 24px;
  border-bottom: 1px solid var(--g100);
  flex-shrink: 0;

  @media (max-width: 428px) {
    padding: 12px 14px;
    gap: 8px;
  }
`;
/** iter 8.3+8.6: блок «Title-row + counter».
   TitleRow — flex-row с Title и Value inline (на одной baseline'е).
   ResultsCount — на второй строке под title-row. */
exports.TitleBlock = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
`;
exports.TitleRow = core_1.styled.div `
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
`;
exports.ModalTitle = core_1.styled.span `
  /* DS v2.0: заголовок модалки — sans, --fs-subtitle (16-20), bold, без UPPER */
  font-family: var(--f);
  font-size: var(--fs-subtitle);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
  color: var(--ink);
`;
exports.ModalValue = core_1.styled.span `
  /* DS v2.0: число рядом с заголовком модалки — НЕ доминирует, размер
     меньше ModalTitle. Используем body (14-17), не hero/title. */
  font-family: var(--m);
  font-size: var(--fs-body);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--c-sky);
  font-variant-numeric: tabular-nums;
`;
exports.CloseButton = core_1.styled.button `
  margin-left: auto;
  /* DS v2.1: compact close — 28×28 desktop (визуальная компактность как у
     нативного AntD/Superset Linechart modal), 44×44 mobile (touch target). */
  width: 28px;
  height: 28px;
  border: 1px solid var(--g200);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  /* × glyph: явный px, чтобы не зависел от --fs-* (которые fluid). */
  font-size: 16px;
  line-height: 1;
  color: var(--g600);
  transition: border-color 0.15s ${EASE}, color 0.15s ${EASE};

  &:hover {
    border-color: var(--g300);
    color: var(--g700);
  }

  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    font-size: 20px;
  }
`;
/** Toolbar with search, mode toggles, hierarchy flip */
exports.ModalToolbar = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 8px;
  /* iter 8.8: horizontal padding 24px — единая «линеечка» с ModalHead (24)
     и table-content (TableWrap 12 + cell 12 = 24). */
  padding: 10px 24px;
  border-bottom: 1px solid var(--g100);
  flex-shrink: 0;
  flex-wrap: wrap;

  @media (max-width: 428px) {
    padding: 10px 14px;
  }
`;
exports.SearchBox = core_1.styled.div `
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--g200);
  border-radius: 6px;
  /* padding-right убран — SearchScopeToggle прижат к правому краю как часть поиска */
  padding: 0 2px 0 12px;
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
  /* DS v2.1: иконка-индикатор поиска — --g600 для контраста (consistency
     с UI-иконками в фильтрах). */
  color: var(--g600);
`;
exports.SearchInput = core_1.styled.input `
  /* DS v2.0 fluid: --fs-meta (12-14) для inputs (читаемость > UPPER-сжатие) */
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--m);
  font-size: var(--fs-meta);
  color: var(--ink);
  width: 100%;
  min-width: 0;

  &::placeholder {
    color: var(--g500);
  }
`;
/** Segmented toggle for search scope — sits inside SearchBox, прижат к правому краю */
exports.SearchScopeToggle = core_1.styled.div `
  display: flex;
  gap: 2px;
  background: var(--g100);
  border-radius: 6px;
  padding: 2px;
  flex-shrink: 0;
`;
exports.SearchScopeButton = core_1.styled.button `
  /* DS v2.0 fluid: --fs-micro для UPPER toggle */
  border: none;
  background: ${({ active }) => (active ? 'var(--s)' : 'transparent')};
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ active }) => (active ? 'var(--ink)' : 'var(--g500)')};
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ${EASE};
  line-height: 1;
  white-space: nowrap;

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
  font-size: var(--fs-meta);
  /* DS v2.1 §10: --g500 запрещён для <14px текста (--fs-meta = 12-14). */
  color: var(--g600);
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
  border-radius: 6px;
  padding: 2px;
  flex-shrink: 0;
`;
exports.ModeButton = core_1.styled.button `
  /* DS v2.0 fluid: --fs-micro для UPPER mode toggle */
  border: none;
  background: ${({ active }) => (active ? 'var(--s)' : 'transparent')};
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ active }) => (active ? 'var(--ink)' : 'var(--g500)')};
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.12s ${EASE};
  line-height: 1;
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
  font-size: var(--fs-micro);
  line-height: 1;
  transition: transform 0.3s ${EASE};
  transform: ${({ flipped }) => (flipped ? 'rotate(180deg)' : 'none')};
`;
exports.FlipLabel = core_1.styled.span `
  font-family: var(--m);
  font-size: var(--fs-meta);
  font-weight: 500;
  color: var(--g600);
`;
exports.ResultsCount = core_1.styled.span `
  /* iter 8.3: counter «Магазины: 10» теперь под ModalTitle (в TitleBlock).
     Убран margin-left:auto, добавлен компактный вид: --fs-micro, секондари. */
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--g600);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;
/* ── Pagination ── */
exports.PaginationWrap = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  /* iter 8.8: 24px = единая «линеечка» (см. ModalToolbar). */
  padding: 8px 24px;
  border-top: 1px solid var(--g100);
  font-family: var(--m);
  font-size: var(--fs-interactive);
  font-variant-numeric: tabular-nums;

  @media (max-width: 428px) {
    padding: 8px 14px;
  }
`;
exports.PageBtn = core_1.styled.button `
  /* DS v2.0: touch target 40×40 desktop / 48×48 mobile */
  min-width: 40px;
  height: 40px;
  padding: 0 10px;
  border: none;
  border-radius: 6px;
  font-family: var(--m);
  font-size: var(--fs-interactive);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background 0.15s;
  background: ${({ isActive }) => (isActive ? 'var(--c-sky)' : 'transparent')};
  color: ${({ isActive }) => (isActive ? 'var(--s)' : 'var(--g600)')};

  &:hover {
    background: ${({ isActive }) => (isActive ? 'var(--c-sky)' : 'var(--g100)')};
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  @media (max-width: 768px) {
    min-width: 48px;
    height: 48px;
  }
`;
exports.PageEllipsis = core_1.styled.span `
  width: 28px;
  text-align: center;
  /* DS v2.1 §10: --g400 запрещён для <14px (контраст 3:1 только для ≥18px bold).
     --g500 — компромисс для второстепенного UI-символа (ellipsis). */
  color: var(--g500);
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
  font-size: var(--fs-meta);
  text-align: center;
  color: var(--ink);
  outline: none;
  background: var(--s);

  &::placeholder {
    color: var(--g400);
    font-size: var(--fs-interactive);
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
/** Scrollable table area — both axes scroll when content overflows.
   iter 8.9: TableWrap padding 24px ровно = «линеечка» ModalHead/Toolbar/Foot.
   Поэтому THead-bg и row-borders НЕ выходят за линеечку. Cell-padding 12px
   внутри сместит text content на 36px от края модалки — допустимо (юзер: «что
   внутри если сместиться не страшно»). Mobile: 14px = mobile linееchka. */
exports.TableWrap = core_1.styled.div `
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
  padding: 0 24px;

  @media (max-width: 428px) {
    padding: 0 14px;
  }
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
    /* DS v2.0 fluid: --fs-micro для table-header UPPER. iter 8.7: cell padding
       12px + TableWrap padding 12px = 24px от края модалки (как ModalHead). */
    padding: 10px 12px;
    font-family: var(--m);
    font-size: var(--fs-micro);
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
      padding: 8px 12px;
    }
  }
`;
exports.GroupRow = core_1.styled.tr `
  /* Обычный click → expand. cursor:pointer + hover-feedback — стандартный
     interactive feedback для раскрывающейся строки. */
  cursor: pointer;
  user-select: none;
  transition: background 0.1s ${EASE};

  &:hover {
    background: var(--g50);
  }

  & > td {
    /* DS v2.1 iter 8: --fs-meta (12-14) — ещё компактнее, юзер жалуется что
       строки крупноваты. Вес 600 сохраняем (выделяет группу против child). */
    font-family: var(--f);
    font-size: var(--fs-meta);
    line-height: 1.5;
    /* iter 8.7: cell 12px + TableWrap 12px = 24px от края модалки. */
    padding: 10px 12px;
    font-weight: 600;
    color: var(--ink);
    border-bottom: 1px solid var(--g100);
    vertical-align: middle;
  }

  & > td.r {
    text-align: right;
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 428px) {
    & > td {
      padding: 8px 12px;
    }
  }
`;
exports.ChildRow = core_1.styled.tr `
  transition: background 0.1s ${EASE};

  &:hover {
    background: var(--g50);
  }

  & > td {
    /* DS v2.1 iter 8: child --fs-meta. iter 8.7: cell 12px + wrap 12px = 24px. */
    font-family: var(--f);
    font-size: var(--fs-meta);
    line-height: 1.5;
    padding: 8px 12px;
    color: var(--g700);
    font-weight: 400;
    border-bottom: 1px solid var(--g100);
    vertical-align: middle;
  }

  & > td:first-of-type {
    /* Inset chevron-индентация — +24 к base 12 = 36px от внутр.края (60 от Modal). */
    padding-left: 36px;
  }

  & > td.r {
    text-align: right;
    font-family: var(--m);
    font-size: var(--fs-meta);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 428px) {
    & > td {
      padding: 8px 12px;
    }
    & > td:first-of-type {
      padding-left: 28px;
    }
  }
`;
exports.Chevron = core_1.styled.span `
  display: inline-block;
  font-size: var(--fs-meta);
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
    font-size: var(--fs-interactive);
    /* DS v2.1 §10: --g500 запрещён для <14px текста. */
    color: var(--g700);
  }
`;
/** Small delta pill for table cells */
exports.TablePill = core_1.styled.span `
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
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
  /* iter 8.8: 24px = единая «линеечка» (см. ModalToolbar). */
  padding: 10px 24px;
  border-top: 1px solid var(--g100);
  flex-shrink: 0;

  @media (max-width: 428px) {
    padding: 8px 14px;
  }
`;
exports.FooterHint = core_1.styled.span `
  font-family: var(--m);
  font-size: var(--fs-meta);
  color: var(--g500);
`;
exports.ExportButton = core_1.styled.button `
  margin-left: auto;
  border: 1px solid var(--g200);
  background: transparent;
  color: var(--g600);
  font-family: var(--m);
  font-size: var(--fs-micro);
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
    background: var(--c-sky);
    animation: ${exports.refreshSlideKf} 1.2s ease-in-out infinite;
  }
`;
/* DetailModal helpers — extracted from inline styles per DS v2.0 */
/* Inline spinner (small) — used inside row cells */
exports.InlineSpinnerSmall = core_1.styled.span `
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 6px;
  border: 1.5px solid var(--g200);
  border-top-color: var(--c-sky);
  border-radius: 50%;
  animation: ${exports.spinKf} 0.7s linear infinite;
`;
/* Spinner (large) — empty-row loader */
exports.InlineSpinnerLarge = core_1.styled.span `
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--g200);
  border-top-color: var(--c-sky);
  border-radius: 50%;
  animation: ${exports.spinKf} 0.7s linear infinite;
`;
/* Centered loader row (icon + caption) */
exports.LoaderRowInner = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;
/* Vertical error stack with retry button */
exports.ErrorRowInner = core_1.styled.div `
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--dn);
`;
exports.RetryButton = core_1.styled.button `
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--g300);
  background: var(--s);
  cursor: pointer;
  font-size: var(--fs-meta);
  font-family: var(--f);
  color: var(--ink);

  &:hover:not(:disabled) {
    background: var(--g100);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;
/* Sortable column header — width is dynamic, keeps cursor:pointer */
exports.SortableTh = core_1.styled.th `
  width: ${({ widthPx }) => widthPx}px;
  cursor: pointer;
`;
/* Footer-hint inline icon helper */
exports.FooterHintIcon = core_1.styled.svg `
  vertical-align: middle;
`;
//# sourceMappingURL=styles.js.map