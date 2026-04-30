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
 * Хук загрузки дерева папок. Используем голый useState/useEffect, потому
 * что react-query в проект не подключён — RTK Query здесь избыточен для
 * одного ресурса.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchCatalogTree } from './api';
import type { CatalogFolderNode, CatalogFolderScope } from './types';

export interface CatalogFoldersState {
  folders: CatalogFolderNode[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCatalogFolders(
  options: { enabled?: boolean; scope?: CatalogFolderScope } = {},
): CatalogFoldersState {
  const { enabled = true, scope } = options;
  const [folders, setFolders] = useState<CatalogFolderNode[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      /* Если scope указан — сервер вернёт только его срез (dashboard|chart)
         + shared-папки. Иначе — все (админ-режим или legacy). */
      const tree = await fetchCatalogTree(scope);
      if (!mountedRef.current) return;
      setFolders(tree);
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки';
      setError(msg);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, scope]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (enabled) {
      void refresh();
    }
  }, [enabled, refresh]);

  return useMemo(
    () => ({ folders, loading, error, refresh }),
    [folders, loading, error, refresh],
  );
}

/** Преобразует плоский список в дерево по parent_id. */
export interface CatalogTreeNode extends CatalogFolderNode {
  children: CatalogTreeNode[];
}

export function buildCatalogTree(
  folders: CatalogFolderNode[],
): CatalogTreeNode[] {
  const byParent = new Map<number | null, CatalogTreeNode[]>();
  // Создаём копии с children=[] и индексируем по parent_id.
  folders.forEach(f => {
    const node: CatalogTreeNode = { ...f, children: [] };
    const key = f.parent_id;
    const arr = byParent.get(key) ?? [];
    arr.push(node);
    byParent.set(key, arr);
  });

  const attachChildren = (node: CatalogTreeNode): CatalogTreeNode => {
    const kids = byParent.get(node.id) ?? [];
    kids.sort((a, b) => a.position - b.position || a.id - b.id);
    node.children = kids.map(attachChildren);
    return node;
  };

  const roots = byParent.get(null) ?? [];
  roots.sort((a, b) => a.position - b.position || a.id - b.id);
  return roots.map(attachChildren);
}
