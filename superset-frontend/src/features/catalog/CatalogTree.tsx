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
import {
  type FC,
  Fragment,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import { CatalogTreeNode as TreeNodeComponent } from './CatalogTreeNode';
import {
  CATALOG_DRAG_TYPES,
  type DragFolderPayload,
  type DragItemPayload,
} from './types';
import type { CatalogTreeNode as TreeNode } from './useCatalogFolders';

const TreeRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-family: ${DS2_VARS.fontSans};
`;

const Empty = styled.div`
  padding: ${DS2_SPACE.s4}px ${DS2_SPACE.s3}px;
  font-size: 12px;
  color: ${DS2_VARS.g500};
  line-height: 1.5;
`;

const ErrorBlock = styled.div`
  padding: ${DS2_SPACE.s3}px;
  font-size: 12px;
  color: ${DS2_VARS.dn};
  line-height: 1.5;
`;

const RootDropzone = styled.div<{ $over: boolean; $canDrop: boolean }>`
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s3}px;
  margin-top: ${DS2_SPACE.s2}px;
  border: 1px dashed
    ${({ $over, $canDrop }) =>
      $over && $canDrop ? DS2_VARS.cSky : DS2_VARS.g200};
  border-radius: 6px;
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${({ $over, $canDrop }) =>
    $over && $canDrop ? DS2_VARS.cSky : DS2_VARS.g500};
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition:
    border-color 0.1s ${DS2_VARS.ease},
    color 0.1s ${DS2_VARS.ease};
`;

interface CatalogTreeProps {
  nodes: TreeNode[];
  loading: boolean;
  error: string | null;
  activeFolderId: number | null;
  onSelect: (folderId: number) => void;
  onFolderMove: (
    folderId: number,
    newParentId: number | null,
  ) => Promise<void> | void;
  onItemDrop: (
    folderId: number,
    payload: DragItemPayload,
  ) => Promise<void> | void;
}

/** Собирает множество id потомков для защиты от цикла при drag folder. */
function collectDescendantIds(node: TreeNode, out: Set<number>): void {
  node.children.forEach(child => {
    out.add(child.id);
    collectDescendantIds(child, out);
  });
}

function getDescendantMap(nodes: TreeNode[]): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>();
  const walk = (list: TreeNode[]) => {
    list.forEach(node => {
      const set = new Set<number>();
      collectDescendantIds(node, set);
      map.set(node.id, set);
      walk(node.children);
    });
  };
  walk(nodes);
  return map;
}

export const CatalogTree: FC<React.PropsWithChildren<CatalogTreeProps>> = ({
  nodes,
  loading,
  error,
  activeFolderId,
  onSelect,
  onFolderMove,
  onItemDrop,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const handleToggle = useCallback((id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Root drop zone — делает папку корневой (parent_id = null).
  const rootRef = useRef<HTMLDivElement>(null);
  const [{ isOver: rootOver, canDrop: rootCanDrop }, rootDrop] = useDrop({
    accept: [CATALOG_DRAG_TYPES.FOLDER],
    canDrop: (dragged: DragFolderPayload | DragItemPayload) =>
      dragged.type === CATALOG_DRAG_TYPES.FOLDER &&
      dragged.parentId !== null,
    drop: (dragged: DragFolderPayload | DragItemPayload) => {
      if (dragged.type === CATALOG_DRAG_TYPES.FOLDER) {
        void onFolderMove(dragged.folderId, null);
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  rootDrop(rootRef);

  const descendantMap = useMemo(() => getDescendantMap(nodes), [nodes]);

  if (loading && nodes.length === 0) {
    return <Empty>{t('Загрузка...')}</Empty>;
  }

  if (error) {
    return <ErrorBlock>{error}</ErrorBlock>;
  }

  if (!loading && nodes.length === 0) {
    return (
      <Empty>
        {t(
          'Папок пока нет. Создайте первую через кнопку «Управление каталогом».',
        )}
      </Empty>
    );
  }

  const renderNode = (node: TreeNode, depth: number) => {
    const isExpanded = expandedIds.has(node.id);
    const descendants = descendantMap.get(node.id) ?? new Set();
    return (
      <Fragment key={node.id}>
        <TreeNodeComponent
          node={node}
          depth={depth}
          isActive={activeFolderId === node.id}
          isExpanded={isExpanded}
          onToggle={handleToggle}
          onSelect={onSelect}
          onFolderMove={onFolderMove}
          onItemDrop={onItemDrop}
          descendantIds={descendants}
        />
        {isExpanded &&
          node.children.map(child => renderNode(child, depth + 1))}
      </Fragment>
    );
  };

  return (
    <TreeRoot role="tree" aria-label={t('Папки каталога')}>
      {nodes.map(node => renderNode(node, 0))}
      <RootDropzone
        ref={rootRef}
        $over={rootOver}
        $canDrop={rootCanDrop}
        aria-label={t('Перенести папку в корень')}
      >
        {t('В корень')}
      </RootDropzone>
    </TreeRoot>
  );
};
