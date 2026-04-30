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
 * Тонкая обёртка над SupersetClient для catalog_folder endpoints.
 */
import { SupersetClient } from '@superset-ui/core';
import type {
  CatalogFolderInput,
  CatalogFolderItem,
  CatalogFolderMoveInput,
  CatalogFolderNode,
  CatalogFolderPatch,
  CatalogFolderScope,
  CatalogItemAssignment,
} from './types';

const BASE = '/api/v1/catalog_folder';

/** Получить дерево папок. Если передан scope — отдаётся только срез
 *  этого scope + shared-папки (NULL-scope). Иначе — все. */
export async function fetchCatalogTree(
  scope?: CatalogFolderScope,
): Promise<CatalogFolderNode[]> {
  const query = scope ? `?scope=${encodeURIComponent(scope)}` : '';
  const { json } = await SupersetClient.get({
    endpoint: `${BASE}/tree${query}`,
  });
  return (json as { result: CatalogFolderNode[] }).result;
}

export async function createCatalogFolder(
  payload: CatalogFolderInput,
): Promise<{ id: number; uuid: string }> {
  const { json } = await SupersetClient.post({
    endpoint: `${BASE}/`,
    jsonPayload: payload,
  });
  return json as { id: number; uuid: string };
}

export async function updateCatalogFolder(
  id: number,
  payload: CatalogFolderPatch,
): Promise<void> {
  await SupersetClient.put({
    endpoint: `${BASE}/${id}`,
    jsonPayload: payload,
  });
}

/**
 * Удалить папку каталога. Объекты (дашборды/чарты/датасеты) никогда не
 * удаляются — они переезжают в папку-обёртку на том же уровне иерархии.
 *
 * @param cascade если true — «Оставить только объекты»: все подпапки
 *   рекурсивно удаляются, а их items плоским списком попадают в обёртку.
 *   false (default) — «Сохранить структуру»: прямые подпапки и items
 *   переезжают внутрь обёртки.
 * @param wrapperName имя папки-обёртки (например, «Без департамента»,
 *   «Без подраздела»). Для root-папок — это имя применяется к
 *   is_default-папке (она переименуется). Для не-root — sibling с таким
 *   именем создаётся или переиспользуется. Если не задано (пустая папка
 *   без содержимого) — обёртка не используется.
 */
export async function deleteCatalogFolder(
  id: number,
  cascade: boolean = false,
  wrapperName?: string,
): Promise<void> {
  const params = new URLSearchParams();
  if (cascade) params.set('cascade', 'true');
  if (wrapperName) params.set('wrapper_name', wrapperName);
  const query = params.toString() ? `?${params.toString()}` : '';
  await SupersetClient.delete({ endpoint: `${BASE}/${id}${query}` });
}

export async function moveCatalogFolder(
  id: number,
  payload: CatalogFolderMoveInput,
): Promise<void> {
  await SupersetClient.post({
    endpoint: `${BASE}/${id}/move`,
    jsonPayload: payload,
  });
}

export async function assignCatalogItems(
  folderId: number,
  items: CatalogItemAssignment[],
): Promise<void> {
  await SupersetClient.post({
    endpoint: `${BASE}/${folderId}/items`,
    jsonPayload: { items },
  });
}

export async function unassignCatalogItems(
  folderId: number,
  items: CatalogItemAssignment[],
): Promise<void> {
  await SupersetClient.delete({
    endpoint: `${BASE}/${folderId}/items`,
    jsonPayload: { items } as unknown as Record<string, unknown>,
  });
}

export async function listCatalogItems(
  folderId: number,
): Promise<CatalogFolderItem[]> {
  const { json } = await SupersetClient.get({
    endpoint: `${BASE}/${folderId}/items`,
  });
  return (json as { result: CatalogFolderItem[] }).result;
}
