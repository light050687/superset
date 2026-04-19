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
export { CatalogDrawer } from './CatalogDrawer';
export { CatalogTree } from './CatalogTree';
export { CatalogTreeNode } from './CatalogTreeNode';
export { CatalogDeleteModal } from './CatalogDeleteModal';
export { CatalogManageView } from './CatalogManageView';
export {
  useCatalogFolders,
  buildCatalogTree,
  type CatalogTreeNode as CatalogTreeNodeData,
} from './useCatalogFolders';
export {
  useCatalogHasUpdates,
  markCatalogViewed,
} from './useCatalogHasUpdates';
export {
  CATALOG_DRAG_TYPES,
  type CatalogFolderNode,
  type CatalogFolderItem,
  type CatalogObjectType,
  type DragFolderPayload,
  type DragItemPayload,
} from './types';
export * as catalogApi from './api';
// Прямые реэкспорты часто используемых функций (чтобы не тащить namespace catalogApi в компонентах).
export {
  assignCatalogItems,
  createCatalogFolder,
  deleteCatalogFolder,
  fetchCatalogTree,
  listCatalogItems,
  moveCatalogFolder,
  unassignCatalogItems,
  updateCatalogFolder,
} from './api';
