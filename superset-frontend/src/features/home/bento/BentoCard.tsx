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
import { type FC, type KeyboardEvent, useRef } from 'react';
import { DragSourceMonitor, useDrag } from 'react-dnd';
import { useHistory } from 'react-router-dom';
import {
  CATALOG_DRAG_TYPES,
  type DragItemPayload,
} from 'src/features/catalog';
import { DS2_RADIUS, DS2_VARS } from 'src/theme/ds2';
import { BentoPreview } from './BentoPreview';
import type { BentoCardKind, BentoCardSize, BentoItem } from './types';

const KIND_LABELS: Record<BentoCardKind, string> = {
  dashboard: 'Дашборд',
  chart: 'Диаграмма',
  geo: 'Гео',
  table: 'Таблица',
  doc: 'Документ',
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

const Card = styled.div<{
  $size: BentoCardSize;
  $dragging: boolean;
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

const Tag = styled.span<{ $accent?: string }>`
  font-family: ${DS2_VARS.fontMono};
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 3px;
  background: ${({ $accent }) =>
    $accent ? `${$accent}26` : 'rgba(128, 128, 128, 0.14)'};
  color: ${({ $accent }) => $accent ?? DS2_VARS.g700};
  border: 1px solid transparent;
`;

const LiveTag = styled(Tag)`
  background: rgba(22, 163, 74, 0.14);
  color: ${DS2_VARS.up};
`;

const StarBtn = styled.button<{ $on: boolean }>`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  border: none;
  color: ${({ $on }) => ($on ? DS2_VARS.wn : DS2_VARS.g400)};
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  backdrop-filter: blur(4px);

  &:hover {
    color: ${DS2_VARS.wn};
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
    item: dragPayload,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drag(ref);

  const navigate = () => {
    history.push(item.url);
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
      onClick={navigate}
      onKeyDown={handleKeyDown}
      aria-label={`${KIND_LABELS[item.kind]}: ${item.title}`}
      data-test="bento-card"
    >
      <TagRow>
        <Tag $accent={kindColor}>{KIND_LABELS[item.kind]}</Tag>
        {item.live ? <LiveTag>● live</LiveTag> : null}
        {item.tags?.slice(0, 2).map(tag => <Tag key={tag}>{tag}</Tag>)}
      </TagRow>

      <StarBtn
        type="button"
        $on={!!item.starred}
        aria-pressed={!!item.starred}
        aria-label={item.starred ? t('Убрать из избранного') : t('В избранное')}
        onClick={event => {
          event.stopPropagation();
          onToggleStar?.(item);
        }}
      >
        {item.starred ? '★' : '☆'}
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
