import { styled } from '@superset-ui/core';
import { keyframes } from '@emotion/react';
import { LIGHT_TOKENS as L, DARK_TOKENS as D, FONTS } from './themeTokens';

/* Emotion keyframes helper — canonical fix для проблемы «animation
   не запускается на mount». Plain `@keyframes` через
   <style dangerouslySetInnerHTML> страдает от race condition: React
   reconciler не гарантирует что <style> попадёт в DOM ДО commit'а
   styled-component, и браузер видит animation-name неизвестным →
   animation no-op'ится. Emotion keyframes injects keyframes в свой
   SSR-safe stylesheet ДО commit'а consuming компонента, плюс выдаёт
   уникальный hashed identifier — гарантированно работает.
   Ссылка: https://emotion.sh/docs/keyframes

   Каскад: Card 0s → ChartWrap 0.2s → Breadcrumb 0.3s → Controls 0.4s
   → Footer 0.6s → LegendChip 0.7s+stagger → Hint 0.85s. */
/* Только opacity — transform убран намеренно: Superset dashboard drag-drop
   управляет transform на chart-cell ancestor'е. Конфликт двух transform
   приводил к тому что после перестановки чарт оставался смещённым/невидимым
   до hard refresh. */
const cardInKf = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const breadcrumbInKf = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const controlsInKf = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const chartInKf = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const footerInKf = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const legendChipInKf = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const hintInKf = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

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
  /* Только opacity — transform убран намеренно: Superset dashboard drag-drop
     управляет transform на chart-cell ancestor'е. Конфликт двух transform
     приводил к тому что после перестановки чарт оставался смещённым. */
  from{opacity:0}
  to{opacity:1}
}
`;

/* ── Root container с токенами в обеих темах ── */
export const StructureDonutRoot = styled.div<{ width: number; height: number }>`
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
  --wn-b: ${L.wnBg};
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
    --wn-b: ${D.wnBg};
    --c-sky: ${D.cSky};
    --c-violet: ${D.cViolet};
    --c-tangerine: ${D.cTangerine};
    --c-fuchsia: ${D.cFuchsia};
    --c-amber: ${D.cAmber};
    --sh: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  /* width/height приходят от Superset chart-holder (ResizableContainer
     с патчем). px-значения, 1-в-1 как scorecard и initial commit. */
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  /* DS v2.0: container query для fluid типографики */
  container-type: inline-size;
  container-name: donut;
  font-family: var(--f);
  /* tabular-nums убран с Root (раньше наследовался во ВСЕ дочерние
     элементы, включая HeaderText). Делаем как scorecard: применяем
     tabular-nums точечно к элементам с числами (LegendChip lg-l,
     Breadcrumb), а заголовок остаётся без него — 1-в-1 с KPI CardTitle. */
  color: var(--ink);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  /* DS 2.0: ни теней, ни обводки — ни в idle, ни на hover. !important
     перебивает любой outer Superset chart-holder hover-effect. */
  box-shadow: none !important;
  outline: none !important;
  &:hover, &:focus, &:focus-within {
    box-shadow: none !important;
    outline: none !important;
  }

  /* prefers-reduced-motion удалён: Windows 11 default OFF на
     accessibility setting → CSS animations отключались для большинства
     пользователей. Наши chart animations subtle (1s scale, fade-in
     stagger) — безопасны даже для motion-sensitive. См. debug doc
     entry 6 (root cause). */
`;

export const Card = styled.div`
  position: relative;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  background: var(--s);
  /* DS 2.0: 1px рамка как у остальных my-plugins. !important чтобы перебить
     outer Superset chart-holder hover (он добавлял outline и box-shadow при
     наведении и мог убрать наш border). В light/dark одинаковое поведение,
     только background меняется. */
  border: 1px solid var(--g200) !important;
  border-radius: 10px;
  /* Mobile-first (ADR-0001): base xs, расширение на больших breakpoints. */
  padding: 12px 14px;
  @media (min-width: 576px) {
    padding: 14px 16px;
  }
  @media (min-width: 992px) {
    padding: 14px 18px;
  }
  @media (min-width: 1200px) {
    padding: 16px 20px 14px;
  }
  overflow: hidden;
  box-shadow: none !important;
  outline: none !important;
  &:hover, &:focus, &:focus-within {
    box-shadow: none !important;
    outline: none !important;
    border-color: transparent !important;
  }

  /* Card mount animation через emotion keyframes helper. Animation
     срабатывает при КАЖДОМ mount Card. У donut StructureDonut.tsx
     loading-state имеет свой раздельный return со своим Card → когда
     данные приходят, React unmount'ит loading-Card и mount'ит новый
     loaded-Card → animation запускается РОВНО когда юзер увидит
     загруженный контент (1:1 с подходом scorecard KpiCard.tsx).
     fill-mode both — начальное состояние применено мгновенно,
     никакой «вспышки» уже-final state до animation start. */
  animation: ${cardInKf} 0.5s ${EASE} both;
  &[data-no-anim] { animation: none; }
  /* Dashboard drag: animation re-trigger при remount → плагин невидим.
     ВАЖНО: .dashboard--editing убран — он убивает animation на весь edit mode. */
  .dragdroppable--dragging & {
    animation: none !important;
    opacity: 1 !important;
  }
  display: flex;
  flex-direction: column;
`;

export const CardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  /* Mobile-first: base xs 8px → ≥768 12px. */
  gap: 8px;
  margin-bottom: 14px;
  @media (min-width: 768px) {
    gap: 12px;
  }
`;

export const Title = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

/* MockBadge — superscript badge «ТЕСТ» рядом с заголовком,
   показывается когда mockModeEnabled=true. translateY вместо
   vertical-align:super — стабильнее для inline-flex. */
export const MockBadge = styled.span`
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
  transform: translateY(-30%);
  user-select: none;
`;

export const HeaderText = styled.div`
  /* DS 2.0 §02 «Заголовок секции». Mobile-first: fluid font 12-17px
     через container query (узкая карточка → меньший заголовок).
     Truncate ellipsis вместо overflow когда узко. */
  font-family: var(--f);
  font-size: clamp(12px, 0.5rem + 1.4cqi, 17px);
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.3;
  text-transform: uppercase;
  color: var(--ink);
  /* Display block с overflow ellipsis вместо width:max-content
     (max-content вызывал overflow на mobile — заголовок не помещался
     в Title-column на узком Card). */
  display: block;
  width: auto;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
`;

export const Breadcrumb = styled.div`
  font-family: var(--m);
  font-size: var(--fs-micro);
  color: var(--g500);
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 14px;
  animation: ${breadcrumbInKf} 0.5s ${EASE} 0.3s both;

  .bc-back,
  .bc-fwd {
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: var(--m);
    /* Стрелка возврата ◂ — крупнее, чтобы юзер сразу понимал «назад».
       Раньше была --fs-micro 11px → почти не видна. Сейчас 18px + жирнее. */
    font-size: 18px;
    font-weight: 700;
    color: var(--g500);
    /* Compact desktop (22×22), 44×44 на touch (CLAUDE.md hard rule). */
    padding: 0 6px;
    min-width: 22px;
    min-height: 22px;
    @media (hover: none), (pointer: coarse) {
      padding: 0 12px;
      min-width: 44px;
      min-height: 44px;
    }
    border-radius: 6px;
    transition: color 0.15s var(--ease), background 0.15s var(--ease);
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;

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

export const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  animation: ${controlsInKf} 0.45s ${EASE} 0.4s both;
`;

export const UnitToggle = styled.div`
  /* Mobile-first: compact 30px на узких Card'ах (xs container),
     full 44px touch target только на ≥480px container И coarse pointer.
     На узкой mobile-карточке 44×44 кнопки перекрывали Title — нельзя. */
  box-sizing: border-box;
  display: flex;
  gap: 2px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 2px;
  height: 30px;
  @container donut (min-width: 480px) {
    @media (hover: none), (pointer: coarse) {
      height: 44px;
    }
  }

  button {
    box-sizing: border-box;
    border: none;
    background: transparent;
    font-family: var(--m);
    font-size: var(--fs-micro);
    font-weight: 600;
    color: var(--g500);
    padding: 0 11px;
    height: 24px;
    min-width: 28px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s var(--ease);
    letter-spacing: 0.02em;
    @container donut (min-width: 480px) {
      @media (hover: none), (pointer: coarse) {
        height: 36px;
        min-width: 44px;
        padding: 0 14px;
      }
    }
  }
  button:hover {
    color: var(--ink);
  }
  button.on {
    /* DS 2.0: теней нет — active state выделен только цветом фона/текста. */
    background: var(--c-sky);
    color: var(--s);
  }
  button:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
  }
`;

/* Donut reveal animation реализована через ECharts native API в
   buildOption.ts:
   - animationDuration: 450 cubicOut (1:1 с мокапом)
   - animationDelay: idx => idx * 80 — sectors появляются по очереди
     с stagger 80ms, начиная с первого (clockwise from startAngle).
   Это даёт sequential reveal эффект как в мокапе, через нативный
   ECharts API а не CSS hacks. См. debug doc entry 7. */

export const ChartWrap = styled.div`
  position: relative;
  flex: 1 1 auto;
  /* Mobile-first: base xs 200, ≥768 220, ≥1200 260. */
  min-height: 200px;
  @media (min-width: 768px) {
    min-height: 220px;
  }
  @media (min-width: 1200px) {
    min-height: 260px;
  }
  /* НЕТ animation на ChartWrap — HeroOverlay (HTML, child этого ChartWrap)
     должен оставаться статичным. Animation теперь на ChartCanvas (только
     canvas с pie sectors), Hero не affected. */
`;

/* SVG overlay для reveal animation. Absolute positioning поверх
   ChartCanvas (внутри ChartWrap). pointer-events:none — events
   проходят на ECharts canvas underneath для tooltip/click. */
export const SvgOverlayWrapper = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  & svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
`;

export const ChartCanvas = styled.div`
  width: 100%;
  height: 100%;
  min-height: 200px;
  @media (min-width: 768px) {
    min-height: 220px;
  }
  @media (min-width: 1200px) {
    min-height: 260px;
  }
  box-shadow: none !important;
  outline: none !important;
  &:hover, &:focus, &:focus-within {
    box-shadow: none !important;
    outline: none !important;
  }
  /* CSS animation удалён — донат анимируется через ECharts native API
     с animationDelay per sector (см. buildOption.ts). Это правильный
     путь для Superset custom plugins (ECharts pie animationType
     'expansion' + animationDelay callback). */
`;

/* ── Hero overlay (центр donut'а) ── */

/* HeroOverlay — абсолютно позиционированный поверх ChartCanvas в центре
   donut hole. pointer-events:none — не блокирует click на сегменты. */
export const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  text-align: center;
  z-index: 5;
  /* Hero number в центре donut'а появляется после SVG reveal sectors —
     scale-pop из 0.5 + opacity, как фокус-эффект после «раскрытия» colца.
     Delay 0.9s = примерное завершение Plan D reveal (sectors clockwise). */
  animation: sd-hero-pop 0.5s ${EASE} 0.9s both;

  @keyframes sd-hero-pop {
    from { opacity: 0; transform: scale(0.5); }
    60%  { opacity: 1; transform: scale(1.08); }
    to   { opacity: 1; transform: scale(1); }
  }
`;

/* HeroValue — fluid scaling по ширине ChartWrap (container:donut).
   Slope 4.5cqi даёт пропорциональный hero относительно diameter donut'а:
   - xs (ChartWrap ~280px): ≈20px
   - md  (~500px): ≈28px
   - lg  (~700px): ≈38px
   - xl  (~1000px): ≈48-56px
   Cap 56px (DS «Крупное число KPI» max). */
export const HeroValue = styled.div`
  font-family: ${FONTS.text};
  font-size: clamp(20px, 0.4rem + 4.5cqi, 56px);
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  color: var(--ink);
`;

/* HeroLabel — Mono UPPERCASE, fluid 10-14px через container query,
   letter-spacing 0.06em. Пропорционально HeroValue. */
export const HeroLabel = styled.div`
  font-family: ${FONTS.mono};
  font-size: clamp(10px, 0.3rem + 0.8cqi, 14px);
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--g500);
  /* Mobile-first gap: base xs 4px → большие donut'ы 8px. */
  margin-top: clamp(4px, 0.2rem + 0.4cqi, 8px);
  text-transform: uppercase;
`;

export const Footer = styled.div`
  /* Flex-row: Legend растягивается, InfoHintCorner справа через
     margin-left:auto. align-items:center → иконка на одной линии
     с легендой. */
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 8px;
  @media (min-width: 768px) {
    padding-top: 10px;
  }
  border-top: 1px solid var(--g200);
  animation: ${footerInKf} 0.5s ${EASE} 0.6s both;
`;

export const Legend = styled.div`
  /* Растягивается на доступную ширину; InfoHintCorner справа от него. */
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  gap: 10px;
  @media (min-width: 768px) {
    gap: 14px;
  }
  @media (min-width: 992px) {
    gap: 18px;
  }
`;

export const LegendChip = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;
  /* Mobile-first: compact base, 44×44 hit-area только на ≥480px
     container И coarse pointer. Иначе chip на mobile Card'е занимает
     всю ширину строки (legend wrap'ил каждый chip на свою строку). */
  padding: 2px 4px;
  border-radius: 4px;
  @container donut (min-width: 480px) {
    @media (hover: none), (pointer: coarse) {
      padding: 12px 10px;
      min-height: 44px;
    }
  }
  /* Stagger 30мс между chip'ами (DS «каскад 30мс»); базовый delay 0.7s. */
  animation: ${legendChipInKf} 0.4s ${EASE} both;
  animation-delay: 0.7s;
  &:nth-of-type(2) { animation-delay: 0.73s; }
  &:nth-of-type(3) { animation-delay: 0.76s; }
  &:nth-of-type(4) { animation-delay: 0.79s; }
  &:nth-of-type(5) { animation-delay: 0.82s; }
  &:nth-of-type(6) { animation-delay: 0.85s; }
  &:nth-of-type(7) { animation-delay: 0.88s; }
  &:nth-of-type(n+8) { animation-delay: 0.91s; }

  /* iter 8.11: opacity применяется к ДЕТЯМ (.lg-dot + .lg-l), не к chip'у.
     Почему: на LegendChip висит animation legendChipInKf с fill-mode both,
     который фиксирует opacity 1 из последнего keyframe permanently,
     перекрывая правило .off { opacity: 0.35 } на parent. Дети без animation —
     наследуют parent opacity (=1) и сами применяют 0.35 → effective 0.35.
     Точное визуальное соответствие riskMatrix LegendItem. */
  &.off .lg-dot,
  &.off .lg-l {
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
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--g600);
    letter-spacing: 0.01em;
    white-space: nowrap;
    /* Mobile-first: truncate label на узких Card'ах чтобы chip
       помещался горизонтально (avoiding 1-chip-per-row wrap). */
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60px;
    @container donut (min-width: 480px) {
      max-width: 120px;
    }
    @container donut (min-width: 720px) {
      max-width: none;
    }
    transition: color 0.15s var(--ease);
  }
`;

/* HintCell упразднён в пользу shared <InfoHintCorner> (absolute bottom-right)
   из components/InfoHint. Иконка теперь не часть Footer-grid, а absolute
   на уровне Card — место одинаковое во всех плагинах. */

/* ── DataState overlays ── */

export const SkeletonOverlay = styled.div`
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

export const EmptyOverlay = styled.div`
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  font-family: var(--m);
  font-size: var(--fs-micro);
  color: var(--g500);
  letter-spacing: 0.01em;
  text-align: center;
`;

export const ErrorOverlay = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 220px;
  font-family: var(--f);
  font-size: var(--fs-body);
  color: var(--dn);

  .sd-error-sub {
    font-family: var(--m);
    font-size: var(--fs-micro);
    color: var(--g500);
    letter-spacing: 0.01em;
  }
`;

export const PartialChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--wn);
  background: rgba(204, 182, 4, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
  margin-top: 6px;
  align-self: flex-start;
`;

export const StaleBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--wn);
  margin-top: 2px;
`;
