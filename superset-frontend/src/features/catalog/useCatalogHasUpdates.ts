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
 * useCatalogHasUpdates — «есть ли в каталоге новое с момента последнего открытия».
 * Использует два уровня трекинга:
 *
 *  1) **Button-level** (RailBadgeDot на иконке каталога): сравнивает текущие
 *     folderCount+itemTotal с сохранённым snapshot'ом. `markCatalogViewed()`
 *     вызывается при открытии CatalogDrawer → snapshot обновляется → точка
 *     исчезает до следующего изменения.
 *
 *  2) **Item-level** (точка рядом с дашбордом/чартом/датасетом): отдельный
 *     Set<"type:id">, заполняется кликами. `useIsCatalogItemSeen()` возвращает
 *     true, если юзер уже кликнул по этому объекту. `markCatalogItemSeen()`
 *     вызывается из рендерера карточки при клике.
 *
 * Реактивность: запись в localStorage не триггерит React-хук в той же вкладке
 * (storage event только между вкладками), поэтому ниже используются кастомные
 * события 'mrts:catalog-snapshot-changed' и 'mrts:catalog-items-seen-changed'.
 */
import { useCallback, useEffect, useState } from 'react';
import type { CatalogFolderNode, CatalogObjectType } from './types';

const STORAGE_KEY = 'mrts-catalog-snapshot';
const SEEN_KEY = 'mrts-catalog-items-seen';
const SNAPSHOT_EVENT = 'mrts:catalog-snapshot-changed';
const SEEN_EVENT = 'mrts:catalog-items-seen-changed';

interface CatalogSnapshot {
  folderCount: number;
  itemTotal: number;
}

/* ─── snapshot (button-level) ─── */

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

function emit(name: string): void {
  try {
    window.dispatchEvent(new Event(name));
  } catch {
    // SSR / старые браузеры — событие просто не фиррится, хуки тогда
    // перечитают localStorage только при следующем рендере.
  }
}

/** Сохраняет текущее состояние каталога как «просмотренное» — снимает
 *  точку с rail-кнопки до следующего изменения folders/items. */
export function markCatalogViewed(folders: CatalogFolderNode[]): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(computeSnapshot(folders)),
    );
    emit(SNAPSHOT_EVENT);
  } catch {
    // localStorage недоступен — игнорируем.
  }
}

/**
 * Возвращает true, если у каталога появились новые папки/объекты с момента
 * последнего `markCatalogViewed()`. Уменьшение/удаление считается как
 * «уже просмотрено» — точка не появляется, если юзер «отстал».
 */
export function useCatalogHasUpdates(folders: CatalogFolderNode[]): boolean {
  // Форсируем ре-рендер при emit'е кастомного события из markCatalogViewed.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion(v => v + 1);
    window.addEventListener(SNAPSHOT_EVENT, handler);
    // Другие вкладки — storage event.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) handler();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SNAPSHOT_EVENT, handler);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Зависимости — folders (изменения содержимого) и version (snapshot update).
  if (folders.length === 0) return false;
  const snapshot = readSnapshot();
  const current = computeSnapshot(folders);
  // `version` читается просто чтобы линтер не ругался; сама цифра — триггер.
  void version;
  return (
    current.folderCount > snapshot.folderCount ||
    current.itemTotal > snapshot.itemTotal
  );
}

/* ─── seen items (item-level) ─── */

function makeItemKey(type: CatalogObjectType, id: number): string {
  return `${type}:${id}`;
}

function readSeenSet(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeSeenSet(set: Set<string>): void {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
    emit(SEEN_EVENT);
  } catch {
    // ignore
  }
}

/** Помечает объект как «просмотренный» — точка рядом с ним исчезнет. */
export function markCatalogItemSeen(
  type: CatalogObjectType,
  id: number,
): void {
  const set = readSeenSet();
  const key = makeItemKey(type, id);
  if (set.has(key)) return;
  set.add(key);
  writeSeenSet(set);
}

/** Массовая инициализация «всё уже видено» — вызывается один раз при
 *  первом открытии CatalogDrawer, чтобы не показывать точки на ВСЕХ
 *  объектах при самой первой загрузке системы. */
export function markAllItemsSeenBaseline(
  items: Array<{ object_type: CatalogObjectType; object_id: number }>,
): void {
  const set = readSeenSet();
  let changed = false;
  for (const it of items) {
    const key = makeItemKey(it.object_type, it.object_id);
    if (!set.has(key)) {
      set.add(key);
      changed = true;
    }
  }
  if (changed) writeSeenSet(set);
}

/** Хук: подписан на изменения seen-set, перерисовывается при markItemSeen. */
export function useIsCatalogItemSeen(
  type: CatalogObjectType | undefined,
  id: number | undefined,
): boolean {
  const [seen, setSeen] = useState(() => {
    if (type === undefined || id === undefined) return true;
    return readSeenSet().has(makeItemKey(type, id));
  });

  useEffect(() => {
    if (type === undefined || id === undefined) {
      setSeen(true);
      return undefined;
    }
    const refresh = () => {
      setSeen(readSeenSet().has(makeItemKey(type, id)));
    };
    refresh();
    window.addEventListener(SEEN_EVENT, refresh);
    const onStorage = (e: StorageEvent) => {
      if (e.key === SEEN_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SEEN_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [type, id]);

  return seen;
}

/** Утилита для обработчиков клика — отмечает и делает callback. */
export function useMarkSeenOnClick(
  type: CatalogObjectType,
  id: number,
): () => void {
  return useCallback(() => {
    markCatalogItemSeen(type, id);
  }, [type, id]);
}
