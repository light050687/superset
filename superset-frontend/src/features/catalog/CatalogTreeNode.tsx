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
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from 'react-dnd';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import {
  CATALOG_DRAG_TYPES,
  type DragFolderPayload,
  type DragItemPayload,
} from './types';
import type { CatalogTreeNode as TreeNode } from './useCatalogFolders';
import {
  deriveDefaultFolderName,
  useCatalogColumnLabels,
} from './useCatalogColumnLabels';

/** Собственные пропсы одного узла дерева. */
export interface CatalogTreeNodeProps {
  node: TreeNode;
  depth: number;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: (id: number) => void;
  onSelect: (id: number) => void;
  onFolderMove: (
    folderId: number,
    newParentId: number | null,
  ) => Promise<void> | void;
  onItemDrop: (
    folderId: number,
    payload: DragItemPayload,
  ) => Promise<void> | void;
  /** Список потомков (для защиты от циклов при drag folder). */
  descendantIds: Set<number>;
}

const NodeRow = styled.div<{
  $depth: number;
  $active: boolean;
  $over: boolean;
  $dragging: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s2}px;
  padding-left: ${({ $depth }) => DS2_SPACE.s2 + $depth * DS2_SPACE.s3}px;
  border-radius: 6px;
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g600)};
  background: ${({ $active, $over }) => {
    if ($over) return 'rgba(59, 139, 217, 0.12)';
    if ($active) return 'rgba(59, 139, 217, 0.08)';
    return 'transparent';
  }};
  opacity: ${({ $dragging }) => ($dragging ? 0.4 : 1)};
  outline: ${({ $over }) => ($over ? `1px dashed ${DS2_VARS.cSky}` : 'none')};
  transition: background 0.1s ${DS2_VARS.ease};
  white-space: nowrap;
  overflow: hidden;

  &:hover {
    background: ${({ $active, $over }) =>
      $over || $active ? undefined : DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }
`;

const Arrow = styled.span<{ $open: boolean; $hasChildren: boolean }>`
  width: 10px;
  font-size: 8px;
  line-height: 1;
  color: ${DS2_VARS.g500};
  transform: rotate(${({ $open }) => ($open ? '90deg' : '0deg')});
  transition: transform 0.12s ${DS2_VARS.ease};
  opacity: ${({ $hasChildren }) => ($hasChildren ? 1 : 0)};
  user-select: none;
  flex-shrink: 0;
`;

const ColorDot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const Name = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Count = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g400};
  flex-shrink: 0;
`;

export const CatalogTreeNode: FC<
  React.PropsWithChildren<CatalogTreeNodeProps>
> = ({
  node,
  depth,
  isActive,
  isExpanded,
  onToggle,
  onSelect,
  onFolderMove,
  onItemDrop,
  descendantIds,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const dragItem: DragFolderPayload = {
    type: CATALOG_DRAG_TYPES.FOLDER,
    folderId: node.id,
    parentId: node.parent_id,
  };

  const [{ isDragging }, drag] = useDrag({
    type: CATALOG_DRAG_TYPES.FOLDER,
    item: dragItem,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [CATALOG_DRAG_TYPES.FOLDER, CATALOG_DRAG_TYPES.ITEM],
    canDrop: (dragged: DragFolderPayload | DragItemPayload) => {
      if (dragged.type === CATALOG_DRAG_TYPES.FOLDER) {
        // нельзя дропнуть папку в себя или в своего потомка
        if (dragged.folderId === node.id) return false;
        if (descendantIds.has(dragged.folderId)) return false;
        // нельзя дропать в текущего родителя (no-op)
        if (dragged.parentId === node.id) return false;
        return true;
      }
      // Item — можно в любую папку.
      return true;
    },
    drop: (dragged: DragFolderPayload | DragItemPayload) => {
      if (dragged.type === CATALOG_DRAG_TYPES.FOLDER) {
        void onFolderMove(dragged.folderId, node.id);
      } else {
        void onItemDrop(node.id, dragged);
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // Присваиваем оба хендлера одному ref (react-dnd поддерживает такое склеивание).
  drag(drop(ref));

  const hasChildren = node.children.length > 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(node.id);
    } else if (event.key === 'ArrowRight' && hasChildren && !isExpanded) {
      event.preventDefault();
      onToggle(node.id);
    } else if (event.key === 'ArrowLeft' && hasChildren && isExpanded) {
      event.preventDefault();
      onToggle(node.id);
    }
  };

  const color = node.color ?? 'var(--g400)';
  const { labels } = useCatalogColumnLabels();
  const displayName = node.is_default
    ? deriveDefaultFolderName(labels.dept)
    : node.name;

  return (
    <NodeRow
      ref={ref}
      tabIndex={0}
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isActive}
      aria-label={t('Папка %s, %d элементов', displayName, node.item_count)}
      data-test="catalog-tree-node"
      data-folder-id={node.id}
      $depth={depth}
      $active={isActive}
      $over={isOver && canDrop}
      $dragging={isDragging}
      onClick={event => {
        event.stopPropagation();
        onSelect(node.id);
      }}
      onKeyDown={handleKeyDown}
    >
      <Arrow
        $open={isExpanded}
        $hasChildren={hasChildren}
        onClick={event => {
          event.stopPropagation();
          if (hasChildren) onToggle(node.id);
        }}
      >
        ▶
      </Arrow>
      <ColorDot $color={color} />
      <Name>{displayName}</Name>
      <Count>{node.item_count}</Count>
    </NodeRow>
  );
};
