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
const cardInKf = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
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
  /* DS 2.0: первое появление карточки — fade + slight rise (4px),
     0.45s — заметно, но не раздражает. Раньше было 0.2s opacity-only —
     юзер не видел анимацию вообще. */
  from{opacity:0;transform:translateY(6px)}
  to{opacity:1;transform:translateY(0)}
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
`;

export const Card = styled.div`
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  background: var(--s);
  /* DS 2.0: рамка и тень убраны на ВСЕХ состояниях. !important чтобы
     перебить outer Superset chart-holder hover (он добавлял outline и
     box-shadow при наведении). В light/dark одинаковое поведение,
     только background меняется. */
  border: 1px solid transparent !important;
  border-radius: 10px;
  padding: 16px 20px 14px;
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
  animation: ${cardInKf} 0.6s ${EASE} both;
  display: flex;
  flex-direction: column;
`;

export const CardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
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
  /* DS 2.0 §02 «Заголовок секции»: 1-в-1 со scorecard CardTitle.
     display: inline-block чтобы заголовок не тянулся на всю ширину
     Title-flex-column — ширина = только текст (как в KPI). */
  font-family: var(--f);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.3;
  text-transform: uppercase;
  color: var(--ink);
  /* Height 23.75px = 17 * 1.3 + ascent/descent margin. Юзер требует
     фиксировать именно 23.75 (1-в-1 с KPI CardTitle). */
  height: 23.75px;
  /* !important чтобы перебить любой cascade-override от parent flex.
     Width должен быть = text content (как у scorecard CardTitle 138px),
     а не растянутый block 1147px. */
  display: inline-block !important;
  width: max-content;
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
    padding: 0 6px;
    border-radius: 6px;
    transition: color 0.15s var(--ease), background 0.15s var(--ease);
    line-height: 1;
    display: inline-flex;
    align-items: center;
    height: 22px;
    min-width: 22px;
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
  /* Унифицированный размер с scorecard ToggleGroup:
     box-sizing: border-box + height 30px — гарантирует одинаковую
     внешнюю высоту на всех ext-* плагинах независимо от content-box
     vs border-box default. */
  box-sizing: border-box;
  display: flex;
  gap: 2px;
  background: var(--g100);
  border: 1px solid var(--g200);
  border-radius: 6px;
  padding: 2px;
  height: 30px;

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
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s var(--ease);
    min-width: 28px;
    letter-spacing: 0.02em;
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

export const ChartWrap = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-height: 220px;
  animation: ${chartInKf} 0.55s ${EASE} 0.2s both;
`;

export const ChartCanvas = styled.div`
  width: 100%;
  height: 100%;
  min-height: 220px;
  box-shadow: none !important;
  outline: none !important;
  &:hover, &:focus, &:focus-within {
    box-shadow: none !important;
    outline: none !important;
  }
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
`;

/* HeroValue — фиксированный размер 35px (юзер требование). */
export const HeroValue = styled.div`
  font-family: ${FONTS.text};
  font-size: 35px;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  color: var(--ink);
`;

/* HeroLabel — Mono uppercase, --fs-meta через cqi (12-14px). */
export const HeroLabel = styled.div`
  font-family: ${FONTS.mono};
  font-size: clamp(11px, 1.1cqi, 14px);
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--g500);
  margin-top: 6px;
  text-transform: uppercase;
`;

export const Footer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--g200);
  animation: ${footerInKf} 0.5s ${EASE} 0.6s both;
`;

export const Legend = styled.div`
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
`;

export const LegendChip = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;
  padding: 2px 4px;
  border-radius: 4px;
  /* Stagger 50мс между chip'ами; базовый delay 0.7s — после Footer
     translateY (0.6s) уже видно контейнер. */
  animation: ${legendChipInKf} 0.4s ${EASE} both;
  animation-delay: 0.7s;
  &:nth-of-type(2) { animation-delay: 0.75s; }
  &:nth-of-type(3) { animation-delay: 0.8s; }
  &:nth-of-type(4) { animation-delay: 0.85s; }
  &:nth-of-type(5) { animation-delay: 0.9s; }
  &:nth-of-type(6) { animation-delay: 0.95s; }
  &:nth-of-type(7) { animation-delay: 1s; }
  &:nth-of-type(n+8) { animation-delay: 1.05s; }

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
    font-size: var(--fs-micro);
    font-weight: 500;
    color: var(--g600);
    letter-spacing: 0.01em;
    white-space: nowrap;
    transition: color 0.15s var(--ease);
  }
`;

export const Hint = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--m);
  font-size: var(--fs-micro);
  font-weight: 500;
  color: var(--g500);
  letter-spacing: 0.01em;
  white-space: nowrap;
  flex-wrap: wrap;
  justify-content: center;
  animation: ${hintInKf} 0.4s ${EASE} 0.85s both;

  .hi {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .hi svg {
    /* Раньше 11px — почти не видно. Сейчас 16px, чтобы стрелка
       назад / drill / клик читались с дистанции. */
    width: 16px;
    height: 16px;
    color: var(--g500);
    flex-shrink: 0;
  }
  .hi .hi-arrow {
    /* Типографический «◂» (символ, не SVG) внутри hint-текста.
       По умолчанию наследует --fs-meta (12-14px), а должен быть
       заметным акцентом — кликабельная стрелка возврата той же
       формы что в breadcrumb (18px). */
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    color: var(--g600);
    margin-right: 2px;
    vertical-align: -1px;
  }
  .hi-sep {
    /* Вертикальный разделитель между подсказками. Заменяет SVG-стрелку
       «→», которая визуально выглядела как direction-индикатор, а не
       как граница между двумя независимыми хинтами. */
    display: inline-block;
    width: 1px;
    height: 14px;
    background: var(--g300);
    margin: 0 4px;
    vertical-align: middle;
  }
`;

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
