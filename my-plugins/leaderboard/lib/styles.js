"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSub = exports.MTitle = exports.MTitles = exports.MStatusBar = exports.MHead = exports.Modal = exports.ModalBg = exports.TooltipEl = exports.CardFooter = exports.PageIndicator = exports.PageBtn = exports.PaginationWrap = exports.Chip = exports.ChipCell = exports.DriversCellEl = exports.NumCell = exports.DualBulletEl = exports.BulletCellEl = exports.StoreCellEl = exports.RankCell = exports.PinBtn = exports.ExBtn = exports.TreeBullet = exports.TreeCellEl = exports.Cell = exports.RowEl = exports.TableBodyEl = exports.Th = exports.TableHead = exports.TableWrap = exports.DdItem = exports.DdMenu = exports.CountBadge = exports.DdTrigger = exports.DdWrap = exports.SearchClear = exports.SearchInputEl = exports.SearchIcon = exports.SearchWrap = exports.FilterResetBtn = exports.FilterResetRow = exports.IconButton = exports.Controls = exports.CardSub = exports.CardTitle = exports.TitleBlock = exports.CardHead = exports.Card = exports.Root = exports.KEYFRAMES_CSS = void 0;
exports.SkeletonRow = exports.StateContainer = exports.MTrendLast = exports.MTrendCard = exports.MTrendWrap = exports.MProfile = exports.MRankRow = exports.MRanked = exports.MSectionL = exports.M3Col = exports.MStat = exports.MSummary = exports.MContextBc = exports.MClose = void 0;
const core_1 = require("@superset-ui/core");
const react_1 = require("@emotion/react");
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
@keyframes rs-cascade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
`;
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
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
/* ================================================================
 * ROOT
 * ================================================================ */
/* Root — explicit px из chartProps.width/height (паттерн paretoAnalysis
   styled.ts:29-117). Это критично для двух режимов сразу:
   - view mode: Superset знает height ячейки, Root уважает → таблица скроллится
     внутри Card (TableWrap flex:1), карточка не растёт unbounded на все строки;
   - edit mode resize: при drag-resize Superset перерендеривает плагин с новыми
     props.width/height → styled-component мгновенно подхватывает.
   `100%/100%` (паттерн rankedBars) зависит от родительского DOM-контекста и
   в view-mode даёт unbounded growth вниз. */
exports.Root = core_1.styled.div `
  width: ${p => p.$width}px;
  height: ${p => p.$height}px;
  /* DS 2.0 §02 шкала. Жёсткое правило: min 10px (ничего мельче),
     интерактивный текст ≥ 11px. Конфликт с мокапом (8–9px в db-label/
     driver-delta/chip) — DS wins, иначе плагин выпадает из общего
     типографического ритма других визуалов (scorecard, metricTimeSeries,
     paretoAnalysis тоже на этих токенах). */
  --fs-nano: 10px;       /* driver-delta, num-cell .u, m-stat-d (DS min) */
  --fs-micro: 11px;      /* rank-cell, CardSub, store-meta, db-label, badges */
  --fs-meta: 12px;       /* search input, dd-item, m-rank-name (interactive) */
  --fs-interactive: 13px;/* bullet-val, num-cell, db-val */
  --fs-body: 14px;       /* CardTitle */
  --fs-title: 18px;      /* m-title (modal heading) */
  --fs-hero: 24px;       /* m-stat-v (modal big KPI) */

  container-type: inline-size;
  container-name: leaderboard;
  overflow: hidden;
  font-family: var(--f);
  color: var(--ink);
  font-feature-settings: 'tnum' 1;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  /* CSS reset — ТОЛЬКО box-sizing. margin/padding в universal selector overrode
     emotion styled rules (та же specificity 0,1,0 + ordering), стирая Card padding.
     Эмоция всё равно сбрасывает margin/padding явно где надо. */
  * {
    box-sizing: border-box;
  }
  button {
    font-family: inherit;
  }
  h1, h2, h3, h4, h5, h6, p {
    margin: 0;
  }

  /* DS v2.1 §02 fluid: на узких карточках -1px по основным токенам,
     но строго не ниже 10px / интерактив 11px (DS floor). */
  @container leaderboard (max-width: 720px) {
    --fs-body: 13px;
    --fs-interactive: 12px;
    --fs-meta: 11px;
    --fs-micro: 10px;
  }
  @container leaderboard (max-width: 480px) {
    --fs-body: 13px;
    --fs-interactive: 12px;
    --fs-meta: 11px;
    --fs-micro: 10px;
    --fs-hero: 22px;
  }

  @media (prefers-reduced-motion: never-match) {
    * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
/* Card — `height: 100%` + `contain: strict`.

   КРИТИЧНО: `contain: strict` блокирует propagation children's intrinsic
   size в parent layout. Без этого в Superset dashboard view-mode:
   1) Superset CSS rule { height: unset !important; min-height: 100% } делает
      .resizable-container'ы content-driven (=intrinsic от children)
   2) grid-row высота = max(intrinsic content всех ext-* siblings)
   3) Наш Card.scrollHeight = 50 rows × ~75px = 3700px+ (TableWrap внутри)
   4) Row растягивается до 3930px, все cells stretch к этому
   5) Карточка визуально 3930px вместо saved 491
   `contain: strict` (= layout + paint + size + style) разрывает цепь:
   Card.intrinsic = его computed размер, НЕ зависит от content.

   Reference: scorecard plugin DataContainer паттерн `flex:1; min-height:0`,
   но scorecard работает потому что contains только Big Number (~80px),
   а у нас 50 rows × 75 = 3700px — нужен явный contain.
   CSS spec: https://developer.mozilla.org/en-US/docs/Web/CSS/contain
   `contain: strict` requires explicit width/height — у нас height:100%
   разрешается через Root explicit px, browser применяет containment. */
exports.Card = core_1.styled.section `
  position: relative;
  width: 100%;
  height: 100%;
  contain: strict;
  background: var(--s);
  border: 1px solid var(--g200);
  /* Mockup .c: padding 18px 22px 16px, radius 14px. */
  border-radius: 14px;
  padding: 18px 22px 16px;
  box-shadow: var(--sh);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* DS 2.0 mount animation. Эмоция keyframes() гарантирует, что
     animation-name доступен ДО commit'а — без race condition. */
  animation: ${cardInKf} 0.5s ${EASE} both;
  &[data-no-anim] { animation: none; }
  /* Dashboard drag: animation re-trigger при remount → плагин невидим.
     ВАЖНО: .dashboard--editing убран — он убивает animation на весь edit mode. */
  .dragdroppable--dragging & {
    animation: none !important;
    opacity: 1 !important;
  }
`;
/* DS v2.1 §06.1 Контейнер: заголовочная зона над таблицей.
   z-index выше TableHead (sticky z:5), чтобы dropdown-меню и поиск всегда
   были поверх таблицы при скролле/раскрытии. */
exports.CardHead = core_1.styled.div `
  position: relative;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  /* Cascade enter — header 0.1s. */
  animation: rs-cascade-in 0.4s var(--ease) 0.1s both;
`;
exports.TitleBlock = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;
/* Mockup .c-title: 13px / 800 / 0.04em UPPER, color ink, proportional. */
exports.CardTitle = core_1.styled.h2 `
  font-family: var(--f);
  font-size: var(--fs-body);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink);
  line-height: 1.3;
`;
/* Mockup .c-sub: 10px / 500 / mono / g500 / 0.02em. */
exports.CardSub = core_1.styled.div `
  font-size: var(--fs-micro);
  font-weight: 500;
  color: var(--g500);
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
/* Mockup .export-btn: 30x30 / radius 7 / g500. */
exports.IconButton = core_1.styled.button `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 7px;
  color: var(--g500);
  cursor: pointer;
  transition: 0.12s;

  &:hover {
    color: var(--c-sky);
    border-color: var(--g300);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
  svg {
    width: 13px;
    height: 13px;
  }
`;
exports.FilterResetRow = core_1.styled.div `
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 10px;
`;
/* Mockup .filter-reset: 10px / 600 / mono / c-sky / 0.02em. */
exports.FilterResetBtn = core_1.styled.button `
  background: none;
  border: none;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--c-sky);
  cursor: pointer;
  padding: 4px 8px;

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
/* Mockup .search-icon: 12x12 / g500. */
exports.SearchIcon = core_1.styled.svg `
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  color: var(--g500);
  pointer-events: none;
`;
/* Mockup .search-input: 30 / radius 7 / g100 / 11px proportional. */
exports.SearchInputEl = core_1.styled.input `
  width: 100%;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 7px 28px 7px 28px;
  height: 30px;
  color: var(--ink);
  font-family: var(--f);
  font-size: var(--fs-meta);
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
/* Mockup .search-clear: 18x18 / g500. */
exports.SearchClear = core_1.styled.button `
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
  display: flex;
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
/* Mockup .dd-trigger: 30 / radius 7 / 10px mono / g600 / 0.02em. */
exports.DdTrigger = core_1.styled.button `
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 7px;
  padding: 6px 10px;
  height: 30px;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.02em;
  /* line-height: 1 на trigger — иначе текст имеет vertical padding 1.5×
     от Root global, SVG визуально оказывается выше text base-line даже
     при align-items:center (box centered, но текст offsetted внутри). */
  line-height: 1;
  color: var(--g600);
  cursor: pointer;
  transition: 0.12s;

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
    opacity: 0.7;
    display: block; /* убирает inline baseline gap снизу SVG. */
  }
  span {
    display: inline-flex;
    align-items: center;
  }
`;
/* Mockup .count-badge: 9px / 800 / 0.08em UPPER / radius 10. */
exports.CountBadge = core_1.styled.span `
  background: var(--c-sky);
  color: var(--on-accent);
  border-radius: 10px;
  padding: 1px 6px;
  font-family: var(--m);
  font-size: var(--fs-nano);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;
/* Mockup .dd-menu: radius 9 / min-width 200 / shadow 28px. */
exports.DdMenu = core_1.styled.div `
  display: ${p => (p.$open ? 'block' : 'none')};
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: var(--s);
  border: 1px solid var(--g300);
  border-radius: 9px;
  padding: 4px;
  min-width: 200px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
  z-index: 200;
  animation: rs-dd-fade 0.12s var(--ease);
`;
/* Mockup .dd-item: 11px / 600 / ink / hover g100. */
exports.DdItem = core_1.styled.button `
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: var(--f);
  font-size: var(--fs-meta);
  font-weight: 600;
  color: var(--ink);
  text-align: left;
  transition: background 0.12s;

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
    /* DS мелкая метка минимум: 10px / 600 / g500 mono. */
    font-family: var(--m);
    font-size: var(--fs-nano);
    font-weight: 600;
    color: var(--g500);
  }
`;
/* ================================================================
 * TABLE
 * ================================================================ */
/* TableWrap — единый scroll-контейнер для таблицы (по X и Y).
   Sticky TableHead работает внутри overflow:auto родителя.
   Card height:100% + flex column ограничивает TableWrap высотой Card.
   Внутри таблица скроллится когда строк больше чем влезает. */
exports.TableWrap = core_1.styled.div `
  border: 1px solid var(--g200);
  border-radius: 10px;
  background: var(--s);
  flex: 1 1 auto;
  min-height: 0;
  /* Оба направления — горизонтальный включается автоматически,
     когда content (grid с minmax minimums) > visible width. */
  overflow: auto;
  /* Cascade enter — body 0.25s. */
  animation: rs-cascade-in 0.5s var(--ease) 0.25s both;
`;
/* DS 2.0 заголовок столбца: 11px / 600 / 0.06em UPPER / g500 mono. */
exports.TableHead = core_1.styled.div `
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
  color: var(--g500);
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
  /* Доп. text-align: при переносе строки (узкие колонки 'Ср. спис.' и
     т.п.) justify-content задаёт позицию блока, но внутри блока строки
     текста flow LTR. Без text-align хедер визуально 'уезжает' влево,
     значения остаются справа → выравнивание ломается. */
  text-align: ${p => p.$align ?? 'left'};
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
  /* Скролл теперь в TableWrap (overflow:auto). TableBodyEl просто flow вниз —
     родительский TableWrap скроллит при превышении высоты/ширины ячейки. */
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
  color: ${p => (p.$active ? 'var(--c-sky)' : 'var(--g600)')};
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
/* Mockup .rank-cell: 10px / 700 / mono / g500. */
exports.RankCell = core_1.styled.span `
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 700;
  color: var(--g500);
  display: flex;
  align-items: center;
  gap: 4px;
`;
/* Mockup .store-cell: gap 2px. */
exports.StoreCellEl = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  /* DS body 14px / 700 / ink — название магазина = body cell. */
  .store-code {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    font-size: var(--fs-body);
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.005em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Mockup .store-code .code: 10px / 700 / g500 mono / g100 bg / radius 4. */
  .store-code .code {
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 700;
    color: var(--g500);
    background: var(--g100);
    border-radius: 4px;
    padding: 2px 6px;
    flex-shrink: 0;
  }
  /* Mockup .store-meta: 9px / 500 / g500 mono / 0.02em. */
  .store-meta {
    font-family: var(--m);
    font-size: var(--fs-nano);
    font-weight: 500;
    color: var(--g500);
    letter-spacing: 0.02em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
/* Mockup .bullet-cell: 12px / 700 number, 9px plan. */
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
    font-size: var(--fs-interactive);
    font-weight: 700;
    letter-spacing: -0.005em;
    font-variant-numeric: tabular-nums;
  }
  .bullet-val .plan {
    font-size: var(--fs-nano);
    font-weight: 500;
    color: var(--g500);
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
/* Mockup .dual-bullet: 8px label, 10px val. */
exports.DualBulletEl = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  width: 100%;

  .db-row {
    display: grid;
    grid-template-columns: 14px minmax(0, 1fr) 52px;
    align-items: center;
    gap: 6px;
  }
  /* DS мелкая метка минимум: 10px / 700 / 0.04em UPPER mono. */
  .db-label {
    font-family: var(--m);
    font-size: var(--fs-nano);
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
  /* Mockup .db-val: 10px / 700 / ink mono. */
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
/* Mockup .num-cell: 12px / 700 / ink mono, .u 9px / 500 / g500. */
exports.NumCell = core_1.styled.span `
  font-family: var(--m);
  font-size: var(--fs-interactive);
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.005em;
  text-align: right;
  font-variant-numeric: tabular-nums;

  .u {
    font-size: var(--fs-nano);
    font-weight: 500;
    color: var(--g500);
    margin-left: 2px;
  }
`;
/* DS body cell для драйверов: 11px mono, gap 4 (уменьшаем плотность). */
exports.DriversCellEl = core_1.styled.div `
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  width: 100%;

  .driver-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: baseline;
    gap: 10px;
    font-family: var(--m);
    font-size: var(--fs-micro);
    line-height: 1.4;
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
    margin-right: 6px;
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
    color: var(--g500);
  }
`;
/* Status chip — DS: 10px моно 600 UPPERCASE, pill-radius */
exports.ChipCell = core_1.styled.div `
  display: flex;
  justify-content: flex-end;
`;
/* DS 2.0 статусный бейдж: 10px / 700 / mono / 0.02em / radius 12 / padding 4 10. */
exports.Chip = core_1.styled.span `
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
  letter-spacing: 0.02em;
  white-space: nowrap;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${p => p.$color};
    flex-shrink: 0;
  }
`;
/* Pagination — DS §06.2 «Элемент управления»: 32px high, radius 6, mono UPPER */
exports.PaginationWrap = core_1.styled.div `
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;
exports.PageBtn = core_1.styled.button `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  color: var(--g700);
  cursor: pointer;
  transition: 0.12s var(--ease);
  font-family: var(--m);
  font-size: var(--fs-interactive);
  font-weight: 700;
  line-height: 1;

  &:hover:not(:disabled) {
    border-color: var(--g300);
    color: var(--ink);
  }
  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
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
exports.PageIndicator = core_1.styled.span `
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  color: var(--g700);
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  padding: 0 6px;
  white-space: nowrap;

  .pg-muted {
    color: var(--g600);
    font-weight: 500;
  }
`;
/* Footer — пагинация по центру. */
exports.CardFooter = core_1.styled.footer `
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--g200);
  /* Cascade enter — footer 0.5s. */
  animation: rs-cascade-in 0.4s var(--ease) 0.5s both;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 500;
  color: var(--g500);
  letter-spacing: 0.02em;

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
exports.TooltipEl = core_1.styled.div `
  position: fixed;
  display: ${p => (p.$visible ? 'block' : 'none')};
  /* DS 2.1 §08 «Тултипы»: tooltip того же тона что Card surface (НЕ инверт). */
  background: var(--s);
  color: var(--ink);
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: none;
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
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(128, 128, 128, 0.25);
  }
  .tt-status {
    width: 4px;
    border-radius: 2px;
    flex-shrink: 0;
    align-self: stretch;
  }
  .tt-titles { flex: 1; min-width: 0; }
  /* Header 13px Manrope 700 — крупнее DS-минимума для читаемости. */
  .tt-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.3;
    margin-bottom: 1px;
  }
  .tt-sub {
    font-size: 11px;
    font-weight: 400;
    color: var(--g600);
    font-family: var(--m);
    line-height: 1.4;
  }
  .tt-trend {
    background: rgba(128, 128, 128, 0.15);
    border-radius: 5px;
    padding: 6px 8px;
    margin-bottom: 6px;
  }
  .tt-trend-l {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--g600);
    font-family: var(--m);
    margin-bottom: 3px;
  }
  .tt-rows { display: flex; flex-direction: column; gap: 4px; }
  .tt-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    font-family: var(--m);
  }
  .tt-l {
    font-size: 11px;
    font-weight: 600;
    color: var(--g600);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .tt-v {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
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
exports.ModalBg = core_1.styled.div `
  position: fixed;
  inset: 0;
  /* Scrim 0.65 + blur — canonical (синхронизировано с другими плагинами). */
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
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
/* DS v2.0 fluid: --fs-title для модального заголовка */
exports.MTitle = core_1.styled.h3 `
  font-size: var(--fs-title);
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin-bottom: 3px;
`;
exports.MSub = core_1.styled.div `
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
    color: var(--g600);
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
  font-size: var(--fs-micro);
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
  font-size: var(--fs-micro);
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