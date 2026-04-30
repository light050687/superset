/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 */
import { css, styled } from '@superset-ui/core';
import { type FC, type ReactNode } from 'react';
import { useDrag } from 'react-dnd';

/** react-dnd type для фильтр-карточек внутри kanban. */
export const FILTER_CARD_DND_TYPE = 'filter-kanban-card';

const Card = styled.div<{ $dragging: boolean }>`
  ${({ theme, $dragging }) => css`
    background: ${theme.colorBgLayout};
    border: 1px solid ${theme.colorBorderSecondary};
    border-radius: ${theme.borderRadius}px;
    padding: ${theme.sizeUnit * 2}px;
    opacity: ${$dragging ? 0.4 : 1};
    cursor: grab;
    /* Клипаем горизонтальное переполнение внутренностей FilterControl
       (Range-picker, autocomplete и т.п. могут иметь свой overflow-x:auto,
       что рождает лишнюю горизонтальную полосу в карточке). В карточке
       h-scroll не нужен — контент должен либо ellipse'иться, либо
       wrap'аться по месту. */
    overflow-x: hidden;
    overflow-y: visible;
    /* min-width: 0 на прямых потомках снимает их min-content-минимум —
       flex/grid children смогут ужиматься до реального доступного места,
       а не распирать контейнер. */
    & > * {
      min-width: 0;
      max-width: 100%;
    }
    transition:
      border-color 160ms ease,
      opacity 120ms ease;
    &:hover {
      border-color: ${theme.colorPrimaryBorder};
    }
    &:active {
      cursor: grabbing;
    }
  `}
`;

interface FilterKanbanCardProps {
  filterId: string;
  children: ReactNode;
}

const FilterKanbanCard: FC<FilterKanbanCardProps> = ({
  filterId,
  children,
}) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: FILTER_CARD_DND_TYPE,
    item: { filterId },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }), [filterId]);

  return (
    <Card ref={dragRef as any} $dragging={isDragging}>
      {children}
    </Card>
  );
};

export default FilterKanbanCard;
