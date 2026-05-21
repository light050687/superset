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
 * useCatalogDraft — transactional-buffer для изменений каталога.
 *
 * Зачем: пользователь хочет превью-режим управления каталогом:
 * действия удаления и перемещения НЕ уходят на сервер моментально, а
 * накапливаются в очередь; кнопка «Сохранить» пушит всё в API,
 * «Сбросить» — отбрасывает очередь и возвращает baseline.
 *
 * Поддерживаемые типы draft-ops:
 *   - delete_folder — пометка папки к удалению (с cascade + wrapper_name)
 *   - move_folder   — смена parent_id и/или position папки
 *   - move_item     — перенос объекта из одной папки в другую
 *
 * Create/rename остаются immediate — у них нет чёткой инверсии без
 * дополнительных snapshot'ов, а UX ожидания у юзеров другие
 * (переименовал → сразу закрепил).
 *
 * Derived state: `applyDraft(baseline)` возвращает дерево и множество
 * «deleted» папок как они выглядели бы ПОСЛЕ применения очереди, но
 * без реального сетевого вызова. UI использует derived state.
 */
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  assignCatalogItems,
  createCatalogFolder,
  deleteCatalogFolder,
  moveCatalogFolder,
  unassignCatalogItems,
  updateCatalogFolder,
} from './api';
import type {
  CatalogFolderItem,
  CatalogFolderNode,
  CatalogFolderScope,
  CatalogObjectType,
} from './types';

/* tempId для pending-create папок — отрицательный счётчик, чтобы не
   пересекаться с реальными id (BIGINT >0). applyDraft добавляет их в
   derived folders как синтетические узлы, а commit() маппит tempId →
   realId после успешного POST. */
let nextTempId = -1;
function allocateTempId(): number {
  const v = nextTempId;
  nextTempId -= 1;
  return v;
}

/* ─── Shared module-level store ─────────────────────────────────────
 *
 * Draft-очередь живёт ВНЕ React-дерева, в переменной модуля. Это нужно
 * чтобы очередь не терялась при закрытии/переоткрытии drawer'а — пользователь
 * мог начать изменения, закрыть каталог посмотреть дашборд, вернуться и
 * продолжить. Единственный триггер сброса: перезагрузка страницы
 * (содержимое модуля восстанавливается как undefined) или явный
 * discard()/commit().
 *
 * Реализовано через useSyncExternalStore, чтобы несколько компонентов
 * (drawer-footer + manage-view) видели одно состояние и синхронно
 * перерисовывались при изменениях. */
let sharedOps: CatalogDraftOp[] = [];
let sharedBusy = false;
const subscribers = new Set<() => void>();

function snapshotOps(): CatalogDraftOp[] {
  return sharedOps;
}
function snapshotBusy(): boolean {
  return sharedBusy;
}
function subscribe(listener: () => void): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}
function notify(): void {
  subscribers.forEach(fn => fn());
}
function setSharedOps(
  updater: CatalogDraftOp[] | ((prev: CatalogDraftOp[]) => CatalogDraftOp[]),
): void {
  sharedOps = typeof updater === 'function' ? updater(sharedOps) : updater;
  notify();
}
function setSharedBusy(next: boolean): void {
  sharedBusy = next;
  notify();
}

export type CatalogDraftOp =
  | {
      kind: 'delete_folder';
      id: number;
      cascade: boolean;
      wrapperName: string;
    }
  | {
      kind: 'move_folder';
      id: number;
      parent_id: number | null;
      position?: number;
    }
  | {
      kind: 'move_item';
      fromFolderId: number;
      toFolderId: number;
      objectType: CatalogObjectType;
      objectId: number;
    }
  | {
      kind: 'create_folder';
      tempId: number;
      name: string;
      parent_id: number | null;
      color?: string | null;
      scope: CatalogFolderScope | null;
    }
  | {
      kind: 'rename_folder';
      id: number;
      name: string;
    };

export interface CatalogDraftApplied {
  /** Baseline folders с применёнными move-операциями (parent_id и position
   *  обновлены у затронутых). Удалённые папки оставлены в списке — UI
   *  отрисует их с визуальной пометкой «pending delete». */
  folders: CatalogFolderNode[];
  /** Множество id папок, помеченных к удалению (включая каскадных потомков). */
  deletedFolderIds: Set<number>;
  /** Функция «какие items будут в папке N после применения draft-ops». */
  itemsInFolder: (
    folderId: number,
    baseline: CatalogFolderItem[],
  ) => CatalogFolderItem[];
}

export interface CatalogDraft {
  ops: CatalogDraftOp[];
  dirty: boolean;
  busy: boolean;
  /** Добавить операцию удаления в очередь. */
  enqueueDelete: (id: number, cascade: boolean, wrapperName: string) => void;
  /** Добавить перемещение папки. Повторные moves одной папки схлопываются. */
  enqueueMoveFolder: (
    id: number,
    parent_id: number | null,
    position?: number,
  ) => void;
  /** Добавить перенос объекта. */
  enqueueMoveItem: (
    fromFolderId: number,
    toFolderId: number,
    objectType: CatalogObjectType,
    objectId: number,
  ) => void;
  /** Поставить создание папки в очередь. Возвращает tempId — клиент может
   *  сразу же использовать его как родитель для следующих операций
   *  (вложенное создание, drop items в только что созданную папку, и т.п.). */
  enqueueCreate: (
    name: string,
    parent_id: number | null,
    scope: CatalogFolderScope | null,
    color?: string | null,
  ) => number;
  /** Поставить переименование. Повторные rename одной папки схлопываются. */
  enqueueRename: (id: number, name: string) => void;
  /** Отбросить всю очередь (Reset). */
  discard: () => void;
  /** Сбросить очередь (без refresh) — для use-case когда родитель сам
   *  сделает onChanged после сброса. Внутренний utility. */
  clearOps: () => void;
  /** Применить очередь на сервер и очистить её (Save). */
  commit: () => Promise<{ success: number; failed: number }>;
  /** Вывести derived folders/items/deletedIds из baseline + ops. */
  applyDraft: (baseline: CatalogFolderNode[]) => CatalogDraftApplied;
}

/** Ключ для move_item ops — позволяет схлопывать повторные перемещения
 *  одного и того же объекта (оставляем последнее назначение). */
function itemKey(objectType: CatalogObjectType, objectId: number): string {
  return `${objectType}:${objectId}`;
}

/** Собрать id всех потомков rootId в flat-списке по parent_id. */
function collectDescendants(
  folders: CatalogFolderNode[],
  rootId: number,
): Set<number> {
  const out = new Set<number>();
  const frontier = [rootId];
  while (frontier.length > 0) {
    const current = frontier.shift() as number;
    for (const f of folders) {
      if (f.parent_id === current && !out.has(f.id)) {
        out.add(f.id);
        frontier.push(f.id);
      }
    }
  }
  return out;
}

export function useCatalogDraft(options: {
  /** Вызывается после успешного commit — родитель делает refresh
   *  baseline'а с сервера. После commit ops уже очищены. */
  onCommitted: () => Promise<void> | void;
}): CatalogDraft {
  /* Подписываемся на shared-store: компонент перерисуется когда
     любой enqueue/discard/commit изменит sharedOps или sharedBusy. */
  const ops = useSyncExternalStore(subscribe, snapshotOps, snapshotOps);
  const busy = useSyncExternalStore(subscribe, snapshotBusy, snapshotBusy);
  const setOps = setSharedOps;
  const setBusy = setSharedBusy;
  /* onCommitted через ref, чтобы commit не пересоздавался на каждую
     смену колбэка — иначе useCallback-зависимость тянет лишние ре-рендеры. */
  const onCommittedRef = useRef(options.onCommitted);
  useEffect(() => {
    onCommittedRef.current = options.onCommitted;
  }, [options.onCommitted]);

  const enqueueDelete = useCallback(
    (id: number, cascade: boolean, wrapperName: string) => {
      setOps(prev => {
        /* Идемпотентно: повторный delete этой же папки не дублирует
           операцию, но обновляет cascade/wrapper_name (вдруг юзер
           передумал с галочкой). */
        const filtered = prev.filter(
          o => !(o.kind === 'delete_folder' && o.id === id),
        );
        return [
          ...filtered,
          { kind: 'delete_folder', id, cascade, wrapperName },
        ];
      });
    },
    [],
  );

  const enqueueMoveFolder = useCallback(
    (id: number, parent_id: number | null, position?: number) => {
      setOps(prev => {
        /* Схлопываем предыдущие move этой папки — оставляем только
           финальное место (пользователь перетащил несколько раз подряд). */
        const filtered = prev.filter(
          o => !(o.kind === 'move_folder' && o.id === id),
        );
        return [...filtered, { kind: 'move_folder', id, parent_id, position }];
      });
    },
    [],
  );

  const enqueueMoveItem = useCallback(
    (
      fromFolderId: number,
      toFolderId: number,
      objectType: CatalogObjectType,
      objectId: number,
    ) => {
      if (fromFolderId === toFolderId) return;
      setOps(prev => {
        const key = itemKey(objectType, objectId);
        /* Схлопываем: A→B, затем B→C эквивалентно A→C.
           Ищем последний move этого item'а, из него берём originalFrom. */
        let originalFrom = fromFolderId;
        const filtered: CatalogDraftOp[] = [];
        for (const o of prev) {
          if (
            o.kind === 'move_item' &&
            itemKey(o.objectType, o.objectId) === key
          ) {
            originalFrom = o.fromFolderId; // сохраняем самую первую
          } else {
            filtered.push(o);
          }
        }
        if (originalFrom === toFolderId) {
          /* Item вернулся в исходную папку — операция схлопнулась в ноль. */
          return filtered;
        }
        return [
          ...filtered,
          {
            kind: 'move_item',
            fromFolderId: originalFrom,
            toFolderId,
            objectType,
            objectId,
          },
        ];
      });
    },
    [],
  );

  const enqueueCreate = useCallback(
    (
      name: string,
      parent_id: number | null,
      scope: CatalogFolderScope | null,
      color?: string | null,
    ): number => {
      const tempId = allocateTempId();
      setOps(prev => [
        ...prev,
        { kind: 'create_folder', tempId, name, parent_id, color, scope },
      ]);
      return tempId;
    },
    [],
  );

  const enqueueRename = useCallback((id: number, name: string) => {
    setOps(prev => {
      /* Если это pending-create папка (tempId < 0) — правим имя прямо
         в create-op, чтобы не отправлять лишний PUT после POST. */
      if (id < 0) {
        return prev.map(o =>
          o.kind === 'create_folder' && o.tempId === id ? { ...o, name } : o,
        );
      }
      /* Реальная папка — схлопываем предыдущие rename этой же id. */
      const filtered = prev.filter(
        o => !(o.kind === 'rename_folder' && o.id === id),
      );
      return [...filtered, { kind: 'rename_folder', id, name }];
    });
  }, []);

  const clearOps = useCallback(() => setOps([]), []);
  const discard = useCallback(() => setOps([]), []);

  const commit = useCallback(async (): Promise<{
    success: number;
    failed: number;
  }> => {
    setBusy(true);
    let success = 0;
    let failed = 0;
    /* idMap: tempId → realId после POST create. Используется при
       ресолвинге последующих ops, которые ссылаются на только что
       созданную папку (move/rename/delete её или её детей). */
    const idMap = new Map<number, number>();
    const resolveId = (id: number): number | null => {
      if (id >= 0) return id;
      const real = idMap.get(id);
      return real === undefined ? null : real;
    };

    /* Pre-filter: убираем create+delete одного tempId (юзер создал
       папку и тут же удалил — эффективно no-op). Это оптимизация, а
       не обязанность: commit без фильтра тоже сработал бы, но делал
       бы лишний POST+DELETE. */
    const createdThenDeleted = new Set<number>();
    for (const op of ops) {
      if (op.kind === 'delete_folder' && op.id < 0) {
        createdThenDeleted.add(op.id);
      }
    }
    const effectiveOps = ops.filter(op => {
      if (op.kind === 'create_folder' && createdThenDeleted.has(op.tempId)) {
        return false;
      }
      if (op.kind === 'delete_folder' && createdThenDeleted.has(op.id)) {
        return false;
      }
      return true;
    });

    /* Играем строго в том порядке, в котором юзер накидал — порядок
       важен для cascade-delete'ов родителей до детей и наоборот, и
       для create → (move/rename/add-item) → commit chain. */
    for (const op of effectiveOps) {
      try {
        if (op.kind === 'create_folder') {
          // parent_id может быть tempId вложенного parent-а
          const resolvedParent =
            op.parent_id === null ? null : resolveId(op.parent_id);
          if (op.parent_id !== null && resolvedParent === null) {
            failed += 1;
            continue;
          }
          // eslint-disable-next-line no-await-in-loop
          const res = await createCatalogFolder({
            name: op.name,
            parent_id: resolvedParent,
            color: op.color ?? null,
            scope: op.scope,
          });
          idMap.set(op.tempId, res.id);
        } else if (op.kind === 'delete_folder') {
          const realId = resolveId(op.id);
          if (realId === null) {
            failed += 1;
            continue;
          }
          // eslint-disable-next-line no-await-in-loop
          await deleteCatalogFolder(realId, op.cascade, op.wrapperName);
        } else if (op.kind === 'move_folder') {
          const realId = resolveId(op.id);
          const resolvedParent =
            op.parent_id === null ? null : resolveId(op.parent_id);
          if (
            realId === null ||
            (op.parent_id !== null && resolvedParent === null)
          ) {
            failed += 1;
            continue;
          }
          // eslint-disable-next-line no-await-in-loop
          await moveCatalogFolder(realId, {
            parent_id: resolvedParent,
            ...(op.position !== undefined ? { position: op.position } : {}),
          });
        } else if (op.kind === 'rename_folder') {
          const realId = resolveId(op.id);
          if (realId === null) {
            failed += 1;
            continue;
          }
          // eslint-disable-next-line no-await-in-loop
          await updateCatalogFolder(realId, { name: op.name });
        } else if (op.kind === 'move_item') {
          const from = resolveId(op.fromFolderId);
          const to = resolveId(op.toFolderId);
          if (from === null || to === null) {
            failed += 1;
            continue;
          }
          // eslint-disable-next-line no-await-in-loop
          await unassignCatalogItems(from, [
            { object_type: op.objectType, object_id: op.objectId },
          ]);
          // eslint-disable-next-line no-await-in-loop
          await assignCatalogItems(to, [
            { object_type: op.objectType, object_id: op.objectId },
          ]);
        }
        success += 1;
      } catch {
        failed += 1;
      }
    }
    setOps([]);
    setBusy(false);
    await onCommittedRef.current();
    return { success, failed };
  }, [ops]);

  const applyDraft = useCallback(
    (baseline: CatalogFolderNode[]): CatalogDraftApplied => {
      /* 1. Копия baseline + синтетические папки из pending create-ops.
         Синтетические получают id=tempId (отрицательный), чтобы не
         коллидить с реальными; item_count=0 (они только что созданы). */
      const workingFolders: CatalogFolderNode[] = baseline.map(f => ({ ...f }));
      for (const op of ops) {
        if (op.kind === 'create_folder') {
          workingFolders.push({
            id: op.tempId,
            parent_id: op.parent_id,
            name: op.name,
            description: null,
            color: op.color ?? null,
            position: 0,
            scope: op.scope,
            is_default: false,
            item_count: 0,
            item_counts_by_type: {},
          });
        }
      }

      const byId = new Map(workingFolders.map(f => [f.id, f] as const));

      /* 2. Накладываем move_folder и rename_folder ops. Последний move
         одной папки перебивает ранние — ops уже сколлапсированы в
         enqueueMoveFolder. Rename обновляет имя; для pending-create
         enqueueRename уже обновил сам create-op (см. выше), так что
         здесь rename_folder в ops встречается только на реальных id. */
      for (const op of ops) {
        if (op.kind === 'move_folder') {
          const f = byId.get(op.id);
          if (f) {
            f.parent_id = op.parent_id;
            if (op.position !== undefined) f.position = op.position;
          }
        } else if (op.kind === 'rename_folder') {
          const f = byId.get(op.id);
          if (f) f.name = op.name;
        }
      }

      /* 3. Deleted-set: все помеченные к удалению + cascade-потомки. */
      const deletedFolderIds = new Set<number>();
      for (const op of ops) {
        if (op.kind === 'delete_folder') {
          deletedFolderIds.add(op.id);
          if (op.cascade) {
            for (const desc of collectDescendants(workingFolders, op.id)) {
              deletedFolderIds.add(desc);
            }
          }
        }
      }

      /* 4. Items override — передано baseline для конкретной папки, мы
         применяем move-item ops: убираем ушедшие, добавляем пришедшие
         с синтетическими id (отрицательные — UI не должен коллидить с
         реальными). */
      const itemsInFolder = (
        folderId: number,
        baselineItems: CatalogFolderItem[],
      ): CatalogFolderItem[] => {
        const out: CatalogFolderItem[] = [];
        const removed = new Set<string>();
        const added: CatalogFolderItem[] = [];
        for (const op of ops) {
          if (op.kind !== 'move_item') continue;
          if (op.fromFolderId === folderId) {
            removed.add(itemKey(op.objectType, op.objectId));
          } else if (op.toFolderId === folderId) {
            added.push({
              id: -Math.abs(
                Math.round(op.objectId * 31 + op.objectType.charCodeAt(0)),
              ),
              folder_id: folderId,
              object_type: op.objectType,
              object_id: op.objectId,
              position: 0,
            });
          }
        }
        for (const item of baselineItems) {
          if (!removed.has(itemKey(item.object_type, item.object_id))) {
            out.push(item);
          }
        }
        out.push(...added);
        return out;
      };

      return {
        folders: workingFolders,
        deletedFolderIds,
        itemsInFolder,
      };
    },
    [ops],
  );

  return {
    ops,
    dirty: ops.length > 0,
    busy,
    enqueueDelete,
    enqueueMoveFolder,
    enqueueMoveItem,
    enqueueCreate,
    enqueueRename,
    discard,
    clearOps,
    commit,
    applyDraft,
  };
}
