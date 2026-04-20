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
 * ContextPopover — popover со списком контекстов AI (Общий / дашборд / чарт).
 * Открывается кликом по chip'у внутри CentralPill.
 */
import { styled, t } from '@superset-ui/core';
import { type FC, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DS2_VARS } from 'src/theme/ds2';
import type { AiContext } from './CentralPillTypes';

interface ContextPopoverProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  contexts: readonly AiContext[];
  currentContextId: string;
  onSelect: (ctx: AiContext) => void;
}

/* Popover: pixel-perfect parity с мокапом `.ai-pop` —
   blur(28px) saturate(160%) (отдельный от drawer/AI 16/180),
   тень 0 20px 60px rgba(0,0,0,.5) + inset-highlight, padding 10. */
const Popover = styled.div`
  position: fixed;
  min-width: 240px;
  max-width: 320px;
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
  align-items: center;
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

const ColorDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const ItemLabel = styled.span`
  font-weight: 600;
  color: inherit;
`;

const ItemHint = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
`;

const Check = styled.span`
  color: ${DS2_VARS.cSky};
  font-size: 14px;
  line-height: 1;
`;

/* Разделитель между списком контекстов и пунктом «+ Прикрепить». */
const Sep = styled.div`
  height: 1px;
  background: ${DS2_VARS.g100};
  margin: 6px 2px;
`;

/** Punkt «+ Прикрепить другой дашборд» — dashed dot, серый label. */
const DashedDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  border: 1px dashed ${DS2_VARS.g300};
  flex-shrink: 0;
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

export const ContextPopover: FC<React.PropsWithChildren<ContextPopoverProps>> = ({
  anchor,
  open,
  onClose,
  contexts,
  currentContextId,
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
      aria-label={t('Контекст ИИ-ассистента')}
      data-ai-popover="context"
      style={{ top: pos.top, left: pos.left }}
    >
      <GroupLabel>{t('Контекст')}</GroupLabel>
      {contexts.map(ctx => {
        const isActive = ctx.id === currentContextId;
        return (
          <Item
            key={ctx.id}
            type="button"
            role="option"
            aria-selected={isActive}
            $active={isActive}
            onClick={() => {
              onSelect(ctx);
              onClose();
            }}
          >
            <ColorDot $color={ctx.colorVar} />
            <ItemBody>
              <ItemLabel>{ctx.label}</ItemLabel>
              {ctx.hint ? <ItemHint>{ctx.hint}</ItemHint> : null}
            </ItemBody>
            {isActive ? <Check aria-hidden>✓</Check> : null}
          </Item>
        );
      })}
      <Sep />
      <Item
        type="button"
        $active={false}
        onClick={onClose}
        aria-label={t('Прикрепить другой дашборд')}
      >
        <DashedDot />
        <ItemBody>
          <ItemLabel style={{ color: DS2_VARS.g500, fontWeight: 500 }}>
            {t('+ Прикрепить другой дашборд')}
          </ItemLabel>
        </ItemBody>
      </Item>
    </Popover>,
    document.body,
  );
};
