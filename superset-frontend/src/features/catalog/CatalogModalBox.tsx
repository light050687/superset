/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Общие примитивы модалок каталога — pixel-perfect мокап
 * `.modal-box.cat-modal` из analytics-floating-dock.html.
 *
 * Используется в CatalogPromptModal (создать/переименовать),
 * CatalogDeleteModal (удалить), CatalogConfirmModal (generic yes/no).
 *
 * Почему не Superset `<Modal>`:
 *  - Superset Modal тянет свой header с title'ом, close-кнопкой и футер;
 *    мокап рендерит title внутри .cat-modal body (h3), без header'а.
 *  - Ширина и padding мокапа (380/20) не совпадают с Modal defaults.
 *  - Кнопки мокапа — 28px ink/danger/default, не Superset primary-style.
 *
 * Реализация: портал в body, overlay + box. Esc/overlay-click закрывают,
 * focus trap через первый `<input>`/`<button>` в box, scroll body
 * блокируется пока modal открыт.
 */
import { keyframes, styled } from '@superset-ui/core';
import {
  type FC,
  type KeyboardEvent,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { DS2_VARS } from 'src/theme/ds2';

interface CatalogModalBoxProps {
  open: boolean;
  onClose: () => void;
  /** Ширина body. Мокап: 380px (prompt/confirm), 400px (generic). */
  width?: number;
  /** Заголовок h3 — мелкий (13px/600). Если нужен кастомный — children. */
  title?: string;
  /** data-test для e2e. */
  dataTest?: string;
  children: ReactNode;
}

/* Мокап cat-modal in-animation: от opacity 0 + translateY(4) + scale(.98). */
const catModalIn = keyframes`
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to { opacity: 1; transform: none; }
`;

const overlayIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/* Мокап .modal-bg: fixed fullscreen overlay. */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.55);
  animation: ${overlayIn} 0.14s ease-out;
  /* Subtle blur to match drawer glass language. */
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
`;

/* Мокап .modal-box.cat-modal: bg1, 1px g200, r3 (16px), padding 20.
   box-shadow 0 24 60 rgba(0,0,0,.45) + внутренний 1px hairline для
   слабого glass-rim эффекта. */
const Box = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  max-width: calc(100vw - 32px);
  padding: 20px;
  /* Мокап .modal-box.cat-modal background: var(--bg1). В DS2_VARS это
     surface-уровень s (#171A1E dark, #FFFFFF light). */
  background: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 16px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.02);
  animation: ${catModalIn} 0.14s ease-out;
  font-family: ${DS2_VARS.fontSans};
  color: ${DS2_VARS.ink};
  outline: none;
`;

/* Мокап .cat-modal h3: 13px/600/ink, compact letter-spacing. */
export const ModalTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: ${DS2_VARS.ink};
  margin: 0 0 4px;
  letter-spacing: -0.005em;
  line-height: 1.3;
`;

/* Мокап .cat-modal-sub: 12/g600/lh1.5, <strong> подсветка ink. */
export const ModalSub = styled.p`
  font-size: 12px;
  color: ${DS2_VARS.g600};
  line-height: 1.5;
  margin: 0 0 14px;

  strong {
    color: ${DS2_VARS.ink};
    font-weight: 500;
  }
`;

/* Мокап .cat-modal-meta: mono chip под description (список объектов
   в удаляемой папке и т.п.). */
export const ModalMeta = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
  background: ${DS2_VARS.bg3};
  border: 1px solid ${DS2_VARS.g100};
  border-radius: 6px;
  padding: 8px 10px;
  margin: 0 0 14px;
  line-height: 1.6;

  &:empty {
    display: none;
  }
`;

/* Мокап .cat-modal-check: чекбокс с accent-color #F87171 (dn). */
export const ModalCheck = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${DS2_VARS.g600};
  cursor: pointer;
  margin: 0 0 14px;
  user-select: none;

  input {
    accent-color: ${DS2_VARS.dn};
    cursor: pointer;
  }

  span {
    line-height: 1.4;
  }
`;

/* Мокап .cat-modal-input: 32px high, 13px sans, bg2 → bg0 focus. */
export const ModalInput = styled.input`
  width: 100%;
  height: 32px;
  padding: 0 10px;
  background: ${DS2_VARS.bg3};
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 6px;
  color: ${DS2_VARS.ink};
  font-family: ${DS2_VARS.fontSans};
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition:
    border-color 0.1s ${DS2_VARS.ease},
    background 0.1s ${DS2_VARS.ease};

  &:focus {
    border-color: ${DS2_VARS.cSky};
    background: ${DS2_VARS.bg};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* Мокап .cat-modal-icon: 28x28 цветной круг под danger/info (удаление). */
export const ModalIcon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: color-mix(in oklab, ${DS2_VARS.dn} 14%, transparent);
  color: ${DS2_VARS.dn};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 10px;

  svg {
    width: 16px;
    height: 16px;
  }
`;

/* Мокап .modal-btns: flex row, justify-end, gap 8, margin-top 16. */
export const ModalBtnRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
`;

/* Мокап .cat-modal-btn: 28h/11.5/500, bg2 + g200 border, r6.
   В DS2 нет отдельного `bg2` — используем bg3 (= var(--g100)), которая
   даёт тот же визуальный эффект «приподнятой» кнопки над общим box bg. */
export const ModalBtn = styled.button`
  height: 28px;
  padding: 0 12px;
  background: ${DS2_VARS.bg3};
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 6px;
  color: ${DS2_VARS.ink};
  font-family: ${DS2_VARS.fontSans};
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s ${DS2_VARS.ease};

  &:hover:not(:disabled) {
    background: ${DS2_VARS.g200};
    border-color: ${DS2_VARS.g300};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* Мокап .cat-modal-btn-primary: ink bg + ink border + bg0 text (инверсия). */
export const ModalBtnPrimary = styled(ModalBtn)`
  background: ${DS2_VARS.ink};
  border-color: ${DS2_VARS.ink};
  color: ${DS2_VARS.bg};

  &:hover:not(:disabled) {
    background: ${DS2_VARS.g700};
    border-color: ${DS2_VARS.g700};
    color: ${DS2_VARS.bg};
  }
`;

/* Мокап .cat-modal-btn-danger: #F87171 background, белый текст. */
export const ModalBtnDanger = styled(ModalBtn)`
  background: ${DS2_VARS.dn};
  border-color: ${DS2_VARS.dn};
  color: #ffffff;

  &:hover:not(:disabled) {
    background: #ef4444;
    border-color: #ef4444;
    color: #ffffff;
  }
`;

/** Контейнер-обёртка: портал в body + overlay + box. Handles Esc/overlay-click,
 *  body scroll-lock, focus management. */
export const CatalogModalBox: FC<PropsWithChildren<CatalogModalBoxProps>> = ({
  open,
  onClose,
  width = 380,
  title,
  dataTest,
  children,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);

  /* Esc закрывает модалку. */
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  /* Scroll-lock body пока модалка открыта. */
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Фокус на first focusable в box'е при открытии. */
  useEffect(() => {
    if (!open || !boxRef.current) return;
    const focusable = boxRef.current.querySelector<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable) {
      // Небольшая задержка, чтобы CSS animation не сбрасывала фокус.
      setTimeout(() => focusable.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <Overlay
      role="dialog"
      aria-modal="true"
      /* data-catalog-modal — маркер для Shell/Drawer.isOutside(): когда
         модалка монтируется в document.body через createPortal, она
         физически вне drawer'а, и Shell'овский outside-click handler
         (capture-phase на document) воспринимает клики в модалке как
         клики ВНЕ drawer → закрывает его. Маркер даёт Shell'у возможность
         распознать «это наша модалка», считать её частью drawer'а и
         не закрывать. См. Drawer.tsx isOutside(). */
      data-catalog-modal="true"
      onClick={e => {
        /* Закрываем только если сам overlay — клиент события (не
           ребёнок). Используем onClick (а не onMouseDown) — mousedown
           срабатывает ДО click и преждевременно демонтирует box,
           блокируя click button'а.

           ВАЖНО: не ставим stopPropagation на Box. CatalogModalBox
           монтируется через createPortal(document.body), что ломает
           React event delegation: если остановить bubbling в Box,
           click не достигает React root → button.onClick не вызовется. */
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Box
        ref={boxRef}
        $width={width}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        data-test={dataTest}
      >
        {title ? <ModalTitle>{title}</ModalTitle> : null}
        {children}
      </Box>
    </Overlay>,
    document.body,
  );
};
