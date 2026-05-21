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
import { type FC, useRef } from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import {
  assignCatalogItems,
  CATALOG_DRAG_TYPES,
  type CatalogFolderNode,
  type DragFolderPayload,
  type DragItemPayload,
} from 'src/features/catalog';
import {
  deriveDefaultFolderName,
  formatCatalogCounts,
  useCatalogColumnLabels,
  visibleCatalogCount,
  type CatalogTypeCounts,
} from 'src/features/catalog/useCatalogColumnLabels';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';

const Tile = styled.button<{ $over: boolean }>`
  background: ${DS2_VARS.s};
  border: 1px solid ${({ $over }) => ($over ? DS2_VARS.cSky : DS2_VARS.g100)};
  border-radius: ${DS2_RADIUS.card}px;
  padding: ${DS2_SPACE.s3}px;
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: ${DS2_SPACE.s1}px;
  transition:
    border-color 0.12s ${DS2_VARS.ease},
    transform 0.12s ${DS2_VARS.ease},
    background 0.12s ${DS2_VARS.ease};
  background: ${({ $over }) =>
    $over ? 'rgba(59, 139, 217, 0.08)' : DS2_VARS.s};

  &:hover {
    border-color: ${DS2_VARS.g300};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
`;

const Dot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const Name = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: ${DS2_VARS.ink};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Count = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
`;

interface DepartmentTileProps {
  folder: CatalogFolderNode;
  onClick: (folder: CatalogFolderNode) => void;
  onItemDropped?: () => void;
  /** Админ видит все объекты, не-админ — только dashboards. Для тайла
   *  это меняет отображаемый счётчик: админ «9 объектов», юзер «1 объект». */
  isAdmin?: boolean;
}

export const DepartmentTile: FC<
  React.PropsWithChildren<DepartmentTileProps>
> = ({ folder, onClick, onItemDropped, isAdmin = false }) => {
  const ref = useRef<HTMLButtonElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: CATALOG_DRAG_TYPES.ITEM,
    drop: async (dragged: DragItemPayload | DragFolderPayload) => {
      if (dragged.type !== CATALOG_DRAG_TYPES.ITEM) return;
      try {
        await assignCatalogItems(folder.id, [
          {
            object_type: dragged.objectType,
            object_id: dragged.objectId,
          },
        ]);
        onItemDropped?.();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Не удалось добавить объект в департамент:', err);
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });
  drop(ref);

  const { labels } = useCatalogColumnLabels();
  const displayName = folder.is_default
    ? deriveDefaultFolderName(labels.dept)
    : folder.name;
  const visible = visibleCatalogCount(
    folder.item_count,
    folder.item_counts_by_type as CatalogTypeCounts | undefined,
    isAdmin,
  );
  const countsText = formatCatalogCounts(visible);

  return (
    <Tile
      ref={ref}
      type="button"
      $over={isOver && canDrop}
      onClick={() => onClick(folder)}
      aria-label={t('Папка каталога: %s, %d элементов', displayName, visible)}
    >
      <Header>
        <Dot $color={folder.color ?? DS2_VARS.g400} />
        <Name>{displayName}</Name>
      </Header>
      <Count>{countsText}</Count>
    </Tile>
  );
};
