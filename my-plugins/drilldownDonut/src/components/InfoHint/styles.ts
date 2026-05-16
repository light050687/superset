// @canonical-version: 3.0.0
// @canonical-source: superset/my-plugins/_shared/info-hint/
import { styled } from '@superset-ui/core';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

/* InfoHintCorner — inline-flex обёртка для <InfoHint>. margin-left:auto
   прижимает иконку к правому краю flex-контейнера (footer / legend
   / comparison row), align-items:center выравнивает по вертикали. */
export const InfoHintCorner = styled.div`
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
`;

/* InfoHintAbsolute — absolute-обёртка для случаев, когда i-иконка
   должна быть в правом нижнем углу Card НЕ нарушая центрирование
   соседнего контента (например, центрированная легенда линчарта).
   Card должен иметь position:relative. */
export const InfoHintAbsolute = styled.div`
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  z-index: 3;
`;

export const HintTrigger = styled.button`
  position: relative;
  width: 24px;
  height: 24px;
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  color: var(--g500, #6b7280);
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
    background: var(--g100, #f3f4f6);
    color: var(--ink, #111827);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky, #0ea5e9);
    outline-offset: 2px;
  }
`;

/* HintOverlay — выдвигающееся окно ВНУТРИ Card (через portal к ближайшему
   positioned ancestor). inset:0 заполняет ровно область визуала. Слайдится
   снизу с прозрачностью 0→1 и translateY 12% → 0. Border-radius наследует
   от Card (если есть скругление). */
export const HintOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: var(--s, #ffffff);
  color: var(--ink, #111827);
  z-index: 50;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
  border-radius: inherit;
  font-family: var(--f, system-ui, -apple-system, sans-serif);
  font-size: var(--fs-body, 14px);
  line-height: 1.5;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
  animation: hi-overlay-slide-in 0.24s ${EASE} both;

  @keyframes hi-overlay-slide-in {
    from {
      opacity: 0;
      transform: translateY(12%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const HintOverlayClose = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--g500, #6b7280);
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
    background: var(--g100, #f3f4f6);
    color: var(--ink, #111827);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky, #0ea5e9);
    outline-offset: 2px;
  }
`;

/* HintOverlayBody — контент окна. Поддерживает legacy .hi / .hi-sep
   классы (которые плагины уже используют) и новые .hint-section
   / .hint-section-title для структурного разбиения. */
export const HintOverlayBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;

  .hi {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--ink, #111827);
    font-size: var(--fs-body, 14px);
  }
  .hi svg {
    width: 16px;
    height: 16px;
    color: var(--g600, #4b5563);
    flex-shrink: 0;
  }
  .hi .hi-arrow {
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
    color: var(--ink, #111827);
    margin-right: 2px;
  }
  .hi-sep {
    display: block;
    width: 100%;
    height: 1px;
    background: var(--g200, rgba(0, 0, 0, 0.08));
    margin: 4px 0;
  }

  .hint-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .hint-section-title {
    font-size: var(--fs-meta, 12px);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--g500, #6b7280);
    margin-bottom: 2px;
  }
`;
