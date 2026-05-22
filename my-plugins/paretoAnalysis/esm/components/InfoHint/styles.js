// @canonical-version: 3.3.0
// @canonical-source: superset/my-plugins/_shared/info-hint/
// DS-aligned per Superset_Design_System_v2_1_RU.docx §02 (типографика),
// §03 (цвета), §06 (анатомия контейнера), §08 (состояния/анимации).
import { styled } from '@superset-ui/core';
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
/* InfoHintTopRight — inline-flex обёртка с margin-left:auto, прижимается
   к правому краю flex-контейнера (CardHead / footer / legend row).
   Работает универсально в любой flex-row без дополнительной настройки. */
export const InfoHintTopRight = styled.div `
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
`;
/* HintTrigger — i-кнопка в форме одиночного бейджа ToggleGroup.
   Размеры/радиус/фон 1-в-1 с ToggleGroup container (height 30, bg --g100,
   border --g200, radius 6) чтобы визуально стоять в одной линии с
   переключателем. На touch — 44×44 (ADR-0001). */
export const HintTrigger = styled.button `
  box-sizing: border-box;
  position: relative;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--g200, #dcdcdc);
  background: var(--g100, #ebebeb);
  cursor: pointer;
  border-radius: 6px;
  color: var(--g500, #737373);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background 0.15s ${EASE},
    color 0.15s ${EASE},
    border-color 0.15s ${EASE};

  @media (hover: none), (pointer: coarse) {
    width: 44px;
    height: 44px;
  }

  & > svg {
    width: 16px;
    height: 16px;
    display: block;
    flex-shrink: 0;
    @media (hover: none), (pointer: coarse) {
      width: 20px;
      height: 20px;
    }
  }

  &:hover {
    background: var(--s, #ffffff);
    border-color: var(--g300, #c0c0c0);
    color: var(--ink, #0a0a0a);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky, #3b8bd9);
    outline-offset: 2px;
  }
`;
/* HintModalBackdrop — fixed overlay поверх всего viewport (через portal в
   document.body). Mobile-friendly: модалка не зависит от размеров Card.
   Scrim + blur — фокус на содержимом, фон уходит на задний план. */
export const HintModalBackdrop = styled.div `
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  box-sizing: border-box;
  animation: hi-backdrop-in 0.18s ${EASE} both;

  @keyframes hi-backdrop-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;
/* HintModalCard — центрированная карточка с контентом подсказки.
   max-width 520px на desktop, 100% width на узком viewport. */
export const HintModalCard = styled.div `
  position: relative;
  background: var(--s, #ffffff);
  color: var(--ink, #0a0a0a);
  border-radius: 12px;
  padding: 20px 24px;
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  overflow-y: auto;
  box-sizing: border-box;
  font-family: var(--f, 'Manrope', system-ui, -apple-system, sans-serif);
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: hi-modal-in 0.22s ${EASE} both;

  @keyframes hi-modal-in {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
`;
export const HintOverlayClose = styled.button `
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--g600, #555555);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ${EASE}, color 0.15s ${EASE};
  z-index: 1;

  & > svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: var(--g100, #ebebeb);
    color: var(--ink, #0a0a0a);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky, #3b8bd9);
    outline-offset: 2px;
  }
`;
/* HintOverlayTitle — заголовок окна. DS §02: 14px Manrope, 700,
   UPPERCASE, letter-spacing 0.05em. Цвет --ink. */
export const HintOverlayTitle = styled.div `
  font-family: var(--f, 'Manrope', system-ui, -apple-system, sans-serif);
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink, #0a0a0a);
  margin: 0 32px 12px 0;
  line-height: 1.3;
`;
/* HintOverlayBody — контент окна. DS §02: body 14px Manrope; sections
   разделяются 16px gap; меж-элементный gap внутри секции 6px; цветовая
   иерархия --ink → --g700 → --g600 (--g500 запрещён для <14px). */
export const HintOverlayBody = styled.div `
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: var(--f, 'Manrope', system-ui, -apple-system, sans-serif);
  font-size: 14px;
  color: var(--ink, #0a0a0a);

  /* Section: structured группа подсказок. */
  .hint-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .hint-section-title {
    /* DS §02 «Заголовок секции»: 14px proportional 700 UPPERCASE 0.05em. */
    font-family: var(--f, 'Manrope', system-ui, -apple-system, sans-serif);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--g600, #555555);
    margin-bottom: 4px;
  }

  /* .hi — строка действия. DS §06 кнопочный шрифт = 11px моно, но в
     контексте overlay body используем 14px proportional для читаемости. */
  .hi {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--ink, #0a0a0a);
    font-size: 14px;
    line-height: 1.4;
  }
  .hi svg {
    width: 16px;
    height: 16px;
    color: var(--g600, #555555);
    flex-shrink: 0;
  }
  .hi .hi-arrow {
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
    color: var(--ink, #0a0a0a);
    margin-right: 2px;
  }
  /* .hi-sep — разделитель DS §06 «1px solid --g200». */
  .hi-sep {
    display: block;
    width: 100%;
    height: 1px;
    background: var(--g200, #dcdcdc);
    margin: 4px 0;
  }

  /* kbd-стиль для клавиш в подсказках. Outlined-вариант: тонкая рамка
     var(--g200) + фон var(--s) под скриншот 2. Пропорциональный шрифт
     (sans-serif Manrope) — единый ритм с body 14px, weight 500. */
  kbd {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    min-height: 22px;
    border: 1px solid var(--g200, #dcdcdc);
    border-radius: 4px;
    background: var(--s, #ffffff);
    color: var(--ink, #0a0a0a);
    font-family: var(--f, 'Manrope', system-ui, -apple-system, sans-serif);
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0;
    white-space: nowrap;
  }
`;
//# sourceMappingURL=styles.js.map