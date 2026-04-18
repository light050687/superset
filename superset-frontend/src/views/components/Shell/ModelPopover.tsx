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
 * ModelPopover — picker моделей LLM (Haiku 4.5 / Sonnet 4.6 / Opus 4.7).
 * Открывается кликом по model-кнопке внутри CentralPill (в expanded-режиме).
 */
import { styled, t } from '@superset-ui/core';
import { type FC, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import {
  AI_MODELS,
  type AiModelDescriptor,
  type AiModelId,
} from './CentralPillTypes';

interface ModelPopoverProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  currentModelId: AiModelId;
  onSelect: (model: AiModelDescriptor) => void;
}

/* Popover: blur(28) saturate(160) + popoverShadow + padding 10 — мокап. */
const Popover = styled.div`
  position: fixed;
  min-width: 260px;
  max-width: 300px;
  padding: 10px;
  background: ${DS2_VARS.glassBg};
  backdrop-filter: ${DS2_VARS.popoverFilter};
  -webkit-backdrop-filter: ${DS2_VARS.popoverFilter};
  border: 1px solid ${DS2_VARS.glassBorder};
  border-radius: ${DS2_VARS.rGlass};
  box-shadow: ${DS2_VARS.popoverShadow};
  z-index: 110;
  font-family: ${DS2_VARS.fontSans};
`;

const GroupLabel = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${DS2_VARS.g500};
  padding: 6px 10px 8px;
`;

const Item = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  background: ${({ $active }) =>
    $active ? 'rgba(59, 139, 217, 0.14)' : 'transparent'};
  border: none;
  border-radius: 10px;
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.ink)};
  font-family: ${DS2_VARS.fontSans};
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.1s ${DS2_VARS.ease},
    color 0.1s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.bg3};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: -2px;
  }
`;

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const LabelRow = styled.span`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s1}px;
  font-weight: 600;
  font-family: ${DS2_VARS.fontMono};
`;

const Hint = styled.span`
  font-size: 11px;
  color: ${DS2_VARS.g500};
  line-height: 1.3;
`;

const RecommendedBadge = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: ${DS2_VARS.upBg};
  color: ${DS2_VARS.up};
  padding: 1px 6px;
  border-radius: 3px;
`;

const Check = styled.span`
  color: ${DS2_VARS.cSky};
  font-size: 14px;
  line-height: 1.3;
`;

interface Position {
  top: number;
  left: number;
}

function computeAbovePosition(
  anchor: HTMLElement,
  menuWidth: number,
  menuHeight: number,
): Position {
  const rect = anchor.getBoundingClientRect();
  const viewportW = window.innerWidth;
  const gap = 10;
  const anchorCenterX = rect.left + rect.width / 2;
  const rawLeft = anchorCenterX - menuWidth / 2;
  const left = Math.max(8, Math.min(rawLeft, viewportW - menuWidth - 8));
  const above = rect.top - menuHeight - gap;
  const top = above >= 8 ? above : rect.bottom + gap;
  return { top, left };
}

export const ModelPopover: FC<ModelPopoverProps> = ({
  anchor,
  open,
  onClose,
  currentModelId,
  onSelect,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position>({ top: 12, left: 12 });

  useLayoutEffect(() => {
    if (!open || !anchor || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    setPos(computeAbovePosition(anchor, box.width, box.height));
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        anchor &&
        !anchor.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [open, onClose, anchor]);

  if (!open) return null;

  return createPortal(
    <Popover
      ref={ref}
      role="listbox"
      aria-label={t('Выбор модели ИИ')}
      data-ai-popover="model"
      style={{ top: pos.top, left: pos.left }}
    >
      <GroupLabel>{t('Модель')}</GroupLabel>
      {AI_MODELS.map(model => {
        const isActive = model.id === currentModelId;
        return (
          <Item
            key={model.id}
            type="button"
            role="option"
            aria-selected={isActive}
            $active={isActive}
            onClick={() => {
              onSelect(model);
              onClose();
            }}
          >
            <ItemBody>
              <LabelRow>
                {model.label}
                {model.recommended ? (
                  <RecommendedBadge>{t('Рекомендуем')}</RecommendedBadge>
                ) : null}
              </LabelRow>
              <Hint>{model.hint}</Hint>
            </ItemBody>
            {isActive ? <Check aria-hidden>✓</Check> : null}
          </Item>
        );
      })}
    </Popover>,
    document.body,
  );
};
