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
 * useCatalogHasUpdates — определяет, появились ли новые папки/объекты
 * в каталоге с момента последнего просмотра пользователем.
 * Snapshot сохраняется в localStorage и обновляется через `markCatalogViewed()`
 * при открытии CatalogDrawer.
 */
import { useMemo } from 'react';
import type { CatalogFolderNode } from './types';

const STORAGE_KEY = 'mrts-catalog-snapshot';

interface CatalogSnapshot {
  folderCount: number;
  itemTotal: number;
}

function readSnapshot(): CatalogSnapshot {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { folderCount: 0, itemTotal: 0 };
    const parsed = JSON.parse(raw) as Partial<CatalogSnapshot>;
    return {
      folderCount: Number(parsed.folderCount) || 0,
      itemTotal: Number(parsed.itemTotal) || 0,
    };
  } catch {
    return { folderCount: 0, itemTotal: 0 };
  }
}

function computeSnapshot(folders: CatalogFolderNode[]): CatalogSnapshot {
  return {
    folderCount: folders.length,
    itemTotal: folders.reduce((acc, f) => acc + (f.item_count ?? 0), 0),
  };
}

/** Сохраняет текущее состояние каталога как «просмотренное». */
export function markCatalogViewed(folders: CatalogFolderNode[]): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(computeSnapshot(folders)),
    );
  } catch {
    // localStorage недоступен (приватный режим / ограничения CSP) — игнорируем.
  }
}

/**
 * Возвращает true, если количество папок или общее число объектов в каталоге
 * увеличилось с момента последнего просмотра. Уменьшение/удаление считается
 * за «просмотренное» — badge не появляется когда юзер «отстал».
 */
export function useCatalogHasUpdates(folders: CatalogFolderNode[]): boolean {
  return useMemo(() => {
    if (folders.length === 0) return false;
    const snapshot = readSnapshot();
    const current = computeSnapshot(folders);
    return (
      current.folderCount > snapshot.folderCount ||
      current.itemTotal > snapshot.itemTotal
    );
  }, [folders]);
}
