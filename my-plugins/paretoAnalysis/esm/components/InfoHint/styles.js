// @canonical-version: 3.2.0
// @canonical-source: superset/my-plugins/_shared/info-hint/
// DS-aligned per Superset_Design_System_v2_1_RU.docx §02 (типографика),
// §03 (цвета), §06 (анатомия контейнера), §08 (состояния/анимации).
import { styled } from '@superset-ui/core';
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
/* InfoHintCorner — inline-flex обёртка для <InfoHint>. margin-left:auto
   прижимает иконку к правому краю flex-контейнера (footer / legend
   / comparison row), align-items:center выравнивает по вертикали. */
export const InfoHintCorner = styled.div `
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
`;
/* InfoHintAbsolute — absolute-обёртка для случаев, когда i-иконка
   должна быть в правом нижнем углу Card НЕ нарушая центрирование
   соседнего контента (например, центрированная легенда линчарта).
   Card должен иметь position:relative. */
export const InfoHintAbsolute = styled.div `
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  z-index: 3;
`;
export const HintTrigger = styled.button `
  position: relative;
  width: 24px;
  height: 24px;
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  color: var(--g500, #737373);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ${EASE}, color 0.15s ${EASE};

  @media (hover: none), (pointer: coarse) {
    width: 44px;
    height: 44px;
    padding: 12px;
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
    background: var(--g100, #ebebeb);
    color: var(--ink, #0a0a0a);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky, #3b8bd9);
    outline-offset: 2px;
  }
`;
/* HintOverlay — выдвигающееся окно ВНУТРИ Card (через portal к ближайшему
   [data-info-hint-container]). DS §06: padding space-4 × space-6 (16×20px),
   border-radius наследуется от Card 10px. §08: fadeIn + сдвиг 4px, 0.25s
   ease cubic-bezier(.4,0,.2,1). */
export const HintOverlay = styled.div `
  position: absolute;
  inset: 0;
  background: var(--s, #ffffff);
  color: var(--ink, #0a0a0a);
  z-index: 50;
  padding: 16px 20px;
  box-sizing: border-box;
  overflow-y: auto;
  border-radius: inherit;
  font-family: var(--f, 'Manrope', system-ui, -apple-system, sans-serif);
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
  animation: hi-overlay-in 0.25s ${EASE} both;

  @keyframes hi-overlay-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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

  /* kbd-стиль для клавиш в подсказках. DS моно 11px на тинте --g100. */
  kbd {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    min-height: 18px;
    border-radius: 4px;
    background: var(--g100, #ebebeb);
    color: var(--ink, #0a0a0a);
    font-family: var(--m, 'JetBrains Mono', ui-monospace, monospace);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: 0;
  }
`;
//# sourceMappingURL=styles.js.map