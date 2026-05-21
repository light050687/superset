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

/** Типы объектов каталога. Зеркало CatalogObjectType из Python backend. */
export type CatalogObjectType =
  | 'dashboard'
  | 'chart'
  | 'dataset'
  | 'saved_query'
  | 'ai_document'
  | 'ai_spreadsheet';

/** Счётчик элементов папки с разбивкой по типу объекта. Ключи —
 *  CatalogObjectType (dashboard/chart/dataset/saved_query/ai_document/...). */
export type CatalogItemCountsByType = Partial<
  Record<CatalogObjectType, number>
>;

/** Scope папки — ограничивает видимость по типу объекта. Добавлено
 *  миграцией d4e5f6a7b8c9. NULL/undefined = shared (дефолтная папка
 *  видна в обоих режимах + наследие до миграции). */
export type CatalogFolderScope = 'dashboard' | 'chart';

/** Узел дерева — плоская структура от GET /api/v1/catalog_folder/tree. */
export interface CatalogFolderNode {
  id: number;
  parent_id: number | null;
  name: string;
  description: string | null;
  color: string | null;
  position: number;
  /** Scope папки (dashboard|chart|null). NULL — видна в обоих режимах
   *  (дефолтная папка «Без департамента» и legacy-записи). */
  scope?: CatalogFolderScope | null;
  /** true для системной папки «Без департамента». Удаление запрещено,
   *  кнопка Delete должна быть скрыта в UI. Все объекты без явной папки
   *  попадают сюда автоматически. */
  is_default?: boolean;
  item_count: number;
  /** Счётчик с разбивкой по типу объекта. Опционально — старые клиенты
   *  могут обходиться одним item_count, но для корректного UX каталога
   *  используем breakdown, чтобы не путать юзера total-цифрой. */
  item_counts_by_type?: CatalogItemCountsByType;
}

/** Элемент внутри папки — от GET /api/v1/catalog_folder/{id}/items. */
export interface CatalogFolderItem {
  id: number;
  folder_id: number;
  object_type: CatalogObjectType;
  object_id: number;
  position: number;
}

/** DTO для D&D операций. */
export interface CatalogFolderInput {
  name: string;
  parent_id?: number | null;
  description?: string | null;
  color?: string | null;
  position?: number;
  scope?: CatalogFolderScope | null;
}

export interface CatalogFolderPatch {
  name?: string;
  parent_id?: number | null;
  description?: string | null;
  color?: string | null;
  position?: number;
  scope?: CatalogFolderScope | null;
}

export interface CatalogFolderMoveInput {
  parent_id?: number | null;
  position?: number;
}

export interface CatalogItemAssignment {
  object_type: CatalogObjectType;
  object_id: number;
  position?: number;
}

/** Типы для react-dnd (item.type при drag). */
export const CATALOG_DRAG_TYPES = {
  FOLDER: 'catalog-folder',
  ITEM: 'catalog-item',
} as const;

/** Payload, переносимый при перетаскивании папки. */
export interface DragFolderPayload {
  type: typeof CATALOG_DRAG_TYPES.FOLDER;
  folderId: number;
  parentId: number | null;
}

/** Payload, переносимый при перетаскивании карточки (будущий bento). */
export interface DragItemPayload {
  type: typeof CATALOG_DRAG_TYPES.ITEM;
  objectType: CatalogObjectType;
  objectId: number;
  currentFolderIds?: number[];
}
