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
 */
import { styled, t } from '@superset-ui/core';
import { type FC, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { DragSourceMonitor, useDrag } from 'react-dnd';
import { useHistory } from 'react-router-dom';
import {
  CATALOG_DRAG_TYPES,
  type CatalogObjectType,
  type DragItemPayload,
} from 'src/features/catalog';
import {
  markCatalogItemSeen,
  useIsCatalogItemSeen,
} from 'src/features/catalog/useCatalogHasUpdates';
import { DS2_RADIUS, DS2_VARS } from 'src/theme/ds2';
import { BentoPreview } from './BentoPreview';
import type { BentoCardKind, BentoCardSize, BentoItem } from './types';

const KIND_LABELS: Record<BentoCardKind, string> = {
  dashboard: 'Дашборд',
  chart: 'Чарт',
  geo: 'Гео',
  table: 'Таблица',
  doc: 'Документ',
};

/** Маппинг BentoCardKind → CatalogObjectType для seen-трекера.
 *  geo фактически Slice с viz_type=deck_*, поэтому идёт как chart. */
const KIND_TO_CATALOG_TYPE: Record<BentoCardKind, CatalogObjectType> = {
  dashboard: 'dashboard',
  chart: 'chart',
  geo: 'chart',
  table: 'dataset',
  doc: 'ai_document',
};

const KIND_COLORS: Record<BentoCardKind, string> = {
  dashboard: DS2_VARS.cSky,
  chart: DS2_VARS.cViolet,
  geo: '#2DD4BF',
  table: DS2_VARS.cTangerine,
  doc: DS2_VARS.cFuchsia,
};

const sizeSpan = (size: BentoCardSize) => {
  switch (size) {
    case 'small':
      return 'grid-column: span 3;';
    case 'wide':
      return 'grid-column: span 6;';
    case 'large':
      return 'grid-column: span 4; grid-row: span 2;';
    case 'full':
      return 'grid-column: span 12;';
    case 'medium':
    default:
      return 'grid-column: span 4;';
  }
};

/* Card с опциональным left-accent'ом для «непросмотренных» объектов.
   Плавающая точка возле звезды (предыдущий вариант) создавала визуальную
   кашу — см. скрин пользователя. Best-practices для unread-индикатора на
   карточках (GitHub, Slack, Figma): **левая accent-полоска** 3px на всю
   высоту. Реализовано через ::before pseudo-element — не сдвигает контент,
   не конфликтует со звездой в правом верхнем углу.
   Полоска исчезает на hover, чтобы не мешать чтению содержимого. */
const Card = styled.div<{
  $size: BentoCardSize;
  $dragging: boolean;
  $unseen: boolean;
}>`
  ${({ $size }) => sizeSpan($size)};
  background: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.g100};
  border-radius: ${DS2_RADIUS.card}px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  position: relative;
  opacity: ${({ $dragging }) => ($dragging ? 0.4 : 1)};
  transition:
    border-color 0.15s ${DS2_VARS.ease},
    transform 0.15s ${DS2_VARS.ease},
    box-shadow 0.15s ${DS2_VARS.ease};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 3px;
    background: ${({ $unseen }) =>
      $unseen ? DS2_VARS.cTangerine : 'transparent'};
    opacity: ${({ $unseen }) => ($unseen ? 1 : 0)};
    transition: opacity 0.15s ${DS2_VARS.ease};
    pointer-events: none;
    z-index: 2;
  }

  &:hover::before {
    opacity: 0;
  }

  &:hover {
    border-color: ${DS2_VARS.g300};
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

const TagRow = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  right: 38px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  z-index: 3;
  pointer-events: none;
`;

/* Tag — бейдж на верхней строке карточки. $accent — CSS-переменная
   (var(--c-sky)), поэтому для полупрозрачного фона используем color-mix,
   а не конкатенацию со строкой '26' (она давала невалидный CSS, фон терялся
   и бейдж выглядел как обычный текст — то что видел юзер на скрине). */
const Tag = styled.span<{ $accent?: string }>`
  font-family: ${DS2_VARS.fontMono};
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 3px;
  background: ${({ $accent }) =>
    $accent
      ? `color-mix(in oklab, ${$accent} 18%, transparent)`
      : 'rgba(128, 128, 128, 0.18)'};
  color: ${({ $accent }) => $accent ?? DS2_VARS.g600};
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 1.2;
`;

/* LiveTag — зелёный бейдж с точкой «● LIVE». */
const LiveTag = styled(Tag)`
  background: color-mix(in oklab, ${DS2_VARS.up} 18%, transparent);
  color: ${DS2_VARS.up};
`;

const LiveDot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${DS2_VARS.up};
  box-shadow: 0 0 6px ${DS2_VARS.up};
  display: inline-block;
`;

/* StarBtn — кнопка избранного в верхнем-правом углу карточки. Круглый
   полупрозрачный фон чтобы читалась поверх любого preview (светлого/тёмного).
   Заполненная ★ жёлтая (cAmber), пустая ☆ — серая, hover → cAmber. */
const StarBtn = styled.button<{ $on: boolean }>`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: color-mix(in oklab, ${DS2_VARS.s} 80%, transparent);
  border: 1px solid ${DS2_VARS.g100};
  color: ${({ $on }) => ($on ? DS2_VARS.cAmber : DS2_VARS.g400)};
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  backdrop-filter: blur(6px);
  transition:
    color 0.12s ${DS2_VARS.ease},
    transform 0.12s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease};

  &:hover {
    color: ${DS2_VARS.cAmber};
    border-color: ${DS2_VARS.cAmber};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.92);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }
`;

const Preview = styled.div`
  flex: 1;
  min-height: 90px;
  background: ${DS2_VARS.g50};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const Body = styled.div`
  padding: 10px 12px;
  border-top: 1px solid ${DS2_VARS.g100};
`;

const Name = styled.div`
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  font-weight: 700;
  color: ${DS2_VARS.ink};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Meta = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const StatusDot = styled.span<{ $live?: boolean }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${({ $live }) => ($live ? DS2_VARS.up : DS2_VARS.wn)};
  display: inline-block;
`;

const DeptRow = styled.div`
  padding: 6px 12px;
  background: ${DS2_VARS.g50};
  border-top: 1px solid ${DS2_VARS.g100};
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g600};
`;

const DeptDot = styled.span<{ $color: string }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export interface BentoCardProps {
  item: BentoItem;
  size?: BentoCardSize;
  showDepartment?: boolean;
  onToggleStar?: (item: BentoItem) => void;
}

export const BentoCard: FC<React.PropsWithChildren<BentoCardProps>> = ({
  item,
  size = 'medium',
  showDepartment = true,
  onToggleStar,
}) => {
  const history = useHistory();
  const ref = useRef<HTMLDivElement>(null);

  const dragPayload: DragItemPayload = {
    type: CATALOG_DRAG_TYPES.ITEM,
    objectType: item.objectType,
    objectId: item.id,
  };

  const [{ isDragging }, drag] = useDrag({
    type: CATALOG_DRAG_TYPES.ITEM,
    item: dragPayload,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drag(ref);

  const catalogType = KIND_TO_CATALOG_TYPE[item.kind];
  const isSeen = useIsCatalogItemSeen(catalogType, item.id);

  // Оптимистичное состояние звезды — чтобы клик отрабатывал мгновенно,
  // не дожидаясь POST+refresh. Синхронизируется с item.starred при новых
  // данных (проп меняется → useEffect перезаписывает локал).
  const [starOptimistic, setStarOptimistic] = useState(!!item.starred);
  useEffect(() => {
    setStarOptimistic(!!item.starred);
  }, [item.starred]);

  const navigate = () => {
    // Клик по карточке засчитывается как «увидел» — точка «новое» уходит.
    markCatalogItemSeen(catalogType, item.id);
    history.push(item.url);
  };

  const handleStarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    // Мгновенно переключаем визуально; API + refresh подоспеют позже
    // и закрепят состояние (или откатят если произошла ошибка).
    setStarOptimistic(prev => !prev);
    onToggleStar?.(item);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate();
    }
  };

  const kindColor = KIND_COLORS[item.kind];

  return (
    <Card
      ref={ref}
      role="link"
      tabIndex={0}
      $size={size}
      $dragging={isDragging}
      $unseen={!isSeen}
      onClick={navigate}
      onKeyDown={handleKeyDown}
      aria-label={`${KIND_LABELS[item.kind]}: ${item.title}${isSeen ? '' : ` (${t('новое')})`}`}
      data-test="bento-card"
    >
      <TagRow>
        <Tag $accent={kindColor}>{KIND_LABELS[item.kind]}</Tag>
        {item.live ? (
          <LiveTag>
            <LiveDot />
            LIVE
          </LiveTag>
        ) : null}
        {item.tags?.slice(0, 2).map(tag => <Tag key={tag}>{tag}</Tag>)}
      </TagRow>

      <StarBtn
        type="button"
        $on={starOptimistic}
        aria-pressed={starOptimistic}
        aria-label={starOptimistic ? t('Убрать из избранного') : t('В избранное')}
        onClick={handleStarClick}
      >
        {starOptimistic ? '★' : '☆'}
      </StarBtn>

      <Preview>
        <BentoPreview id={item.id} kind={item.kind} />
      </Preview>

      <Body>
        <Name>{item.title}</Name>
        <Meta>
          <StatusDot $live={item.live} />
          {item.updatedHuman ?? ''}
        </Meta>
      </Body>

      {showDepartment && item.department ? (
        <DeptRow>
          <DeptDot $color={item.departmentColor ?? DS2_VARS.g400} />
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.department}
          </span>
        </DeptRow>
      ) : null}
    </Card>
  );
};
