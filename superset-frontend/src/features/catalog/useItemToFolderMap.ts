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
 * useItemToFolderMap — хук, возвращающий Map «type:id → folder{name,color}».
 * Нужен, чтобы на BentoCard показывать департамент объекта в нижнем углу
 * (dept-row в мокапе), а у нас в BentoItem `department`/`departmentColor`
 * не заполнены из list/favorites-endpoint'ов.
 *
 * Реализация: fetch /tree (уже кешируется в useCatalogFolders) + параллельно
 * для каждой папки GET /catalog_folder/:id/items. Собираем плоскую мапу.
 * Для user'а с несколькими папками это 1-5 параллельных запросов — OK.
 */
import { useEffect, useMemo, useState } from 'react';
import { listCatalogItems } from './api';
import { useCatalogFolders } from './useCatalogFolders';
import type { CatalogObjectType } from './types';

/** Информация о папке, прикреплённая к объекту. */
export interface ItemFolderInfo {
  folderId: number;
  folderName: string;
  folderColor: string | null;
  isDefault: boolean;
}

export type ItemFolderMap = Map<string, ItemFolderInfo>;

function keyOf(type: CatalogObjectType, id: number): string {
  return `${type}:${id}`;
}

export interface UseItemToFolderMapResult {
  /** Map<"type:id", folderInfo>. Пустая до окончания fetch. */
  itemFolderMap: ItemFolderMap;
  loading: boolean;
}

export function useItemToFolderMap(): UseItemToFolderMapResult {
  const { folders } = useCatalogFolders();
  const [itemFolderMap, setMap] = useState<ItemFolderMap>(() => new Map());
  const [loading, setLoading] = useState(false);

  // Детерминированный ключ зависимостей, чтобы не перезапускать запрос
  // при идентичном наборе папок (ссылка на массив может меняться).
  const foldersSignature = useMemo(
    () =>
      folders
        .map(f => `${f.id}:${f.item_count ?? 0}:${f.color ?? ''}:${f.name}`)
        .join('|'),
    [folders],
  );

  useEffect(() => {
    let cancelled = false;
    if (folders.length === 0) {
      setMap(new Map());
      return undefined;
    }
    setLoading(true);
    Promise.all(
      folders.map(async f => {
        try {
          const items = await listCatalogItems(f.id);
          return { folder: f, items };
        } catch {
          return { folder: f, items: [] };
        }
      }),
    )
      .then(results => {
        if (cancelled) return;
        const next: ItemFolderMap = new Map();
        for (const { folder, items } of results) {
          for (const item of items) {
            const k = keyOf(item.object_type, item.object_id);
            // Если объект уже попал в несколько папок, оставляем первую
            // не-дефолтную (она «настоящая» департамент-принадлежность).
            const existing = next.get(k);
            if (
              !existing ||
              (existing.isDefault && !folder.is_default)
            ) {
              next.set(k, {
                folderId: folder.id,
                folderName: folder.name,
                folderColor: folder.color,
                isDefault: !!folder.is_default,
              });
            }
          }
        }
        setMap(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foldersSignature]);

  return { itemFolderMap, loading };
}
