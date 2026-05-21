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
 * DnD wrappers для CatalogManageView на react-dnd.
 *
 * ПОЧЕМУ react-dnd, а не hand-rolled HTML5 DnD:
 *  - DndProvider (HTML5Backend) подключён на уровне RootContextProviders
 *    и перехватывает все native drag events на document'е. Свои
 *    ondragstart/ondragover/ondrop handlers бесполезны, потому что
 *    backend'у тоже нужны эти события — кто-то один обрабатывает,
 *    и часто это react-dnd. Результат: свои handlers выглядят как
 *    «не работают» (событие достаётся backend'у, а не React'овскому
 *    onDragStart).
 *  - useDrag/useDrop интегрируются с этим backend'ом нативно.
 *  - monitor.getClientOffset() доступен в hover всегда — не нужны
 *    draggingPayloadRef/activeDropRef обходы.
 *
 * API:
 *  DndRow  — row, который одновременно drag-source и drop-target.
 *            Принимает children (визуальный контент row'а) + колбэки
 *            на move/drop операции.
 *  DndBody — пустая тело колонки, только drop-target (для случаев
 *            когда user дропает на пустую область).
 */
import { type FC, type ReactNode, useEffect, useRef, useState } from 'react';
import {
  type DragSourceMonitor,
  type DropTargetMonitor,
  useDrag,
  useDrop,
} from 'react-dnd';
import type { CatalogFolderItem, CatalogObjectType } from './types';

/* ─── Payload types ────────────────────────────────────────────────── */

/** Уровень папки в иерархии: 1=dept, 2=sub, 3=folder. */
export type FolderLevel = 1 | 2 | 3;

export interface FolderDragPayload {
  kind: 'folder';
  folderId: number;
  level: FolderLevel;
  parentId: number | null;
}

export interface ItemDragPayload {
  kind: 'item';
  objectType: CatalogObjectType;
  objectId: number;
  fromFolderId: number;
}

export type DndPayload = FolderDragPayload | ItemDragPayload;

/** Как интерпретировать payload на drop'е с учётом уровня иерархии. */
export type DragKind = 'dept' | 'sub' | 'folder' | 'item';

export function dragKindOf(p: DndPayload): DragKind {
  if (p.kind === 'item') return 'item';
  if (p.level === 1) return 'dept';
  if (p.level === 2) return 'sub';
  return 'folder';
}

/** Позиция курсора на row'е для 3-зонного drop (above/into/below). */
export type DropZone = 'above' | 'into' | 'below';

/* ─── DnD MIME types для react-dnd ─────────────────────────────────── */

export const CATALOG_DND_TYPES = {
  FOLDER: 'catalog-folder',
  ITEM: 'catalog-item',
} as const;

/** Возвращает react-dnd type по payload.kind для useDrag. */
function dndTypeOf(p: DndPayload): string {
  return p.kind === 'item' ? CATALOG_DND_TYPES.ITEM : CATALOG_DND_TYPES.FOLDER;
}

/** Возвращает массив types, которые принимает drop-target. */
export function acceptAll(): string[] {
  return [CATALOG_DND_TYPES.FOLDER, CATALOG_DND_TYPES.ITEM];
}

/* ─── Вычисление drop-зоны по позиции курсора ─────────────────────── */

export function computeDropZone(
  monitor: DropTargetMonitor,
  el: HTMLElement | null,
  intoAllowed: boolean,
): DropZone | null {
  const offset = monitor.getClientOffset();
  if (!offset || !el) return null;
  const rect = el.getBoundingClientRect();
  const rel = (offset.y - rect.top) / rect.height;
  if (intoAllowed) {
    if (rel < 0.28) return 'above';
    if (rel > 0.72) return 'below';
    return 'into';
  }
  return rel < 0.5 ? 'above' : 'below';
}

/* ─── DndRow: drag-source + drop-target на одном элементе ─────────── */

interface DndRowProps {
  /** Payload, который этот row отправляет при drag-старте. Если не
   *  задан — row только drop-target, не draggable. */
  dragPayload?: DndPayload;
  /** Какие MIME-types row принимает как drop. По умолчанию все caталоговые. */
  accept?: string[];
  /** Возвращает true если drag'и этого типа можно дропать сюда вообще
   *  (включая above/below). По умолчанию — всегда true. */
  canAccept?: (payload: DndPayload) => boolean;
  /** Возвращает true если payload можно дропать ВНУТРЬ (into) этого row'а
   *  (в мокапе это «слияние» или «поместить в папку»). По умолчанию false. */
  canDropInto?: (payload: DndPayload) => boolean;
  /** Вызывается при drop'е. Получает payload и зону (above/into/below).
   *  Опциональный — если row только draggable (drag-source), без drop-обработки. */
  onDrop?: (payload: DndPayload, zone: DropZone) => void;
  /** Пробрасываем состояние в рендер через render-prop, чтобы родитель
   *  применял нужные visual-эффекты (background/outline/opacity). */
  children: (state: {
    isDragging: boolean;
    isOver: boolean;
    dropZone: DropZone | null;
    ref: React.RefObject<HTMLDivElement>;
  }) => ReactNode;
}

export const DndRow: FC<DndRowProps> = ({
  dragPayload,
  accept = acceptAll(),
  canAccept = () => true,
  canDropInto = () => false,
  onDrop,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: dragPayload ? dndTypeOf(dragPayload) : '__disabled__',
      /* item как функция — react-dnd вычисляет свежий payload в
         момент старта drag'а, а не кеширует объект из первого
         render'а. Критично для повторных drag'ов: если payload
         был бы захвачен по ссылке, второй drag мог бы отправить
         устаревший (например, с id уже удалённой папки). */
      item: () => dragPayload,
      canDrag: () => dragPayload !== undefined,
      /* end() всегда срабатывает в конце drag-сессии (и при успешном
         drop'е, и при отмене). react-dnd на некоторых браузерах
         (особенно Safari/Firefox) может не очищать внутреннее
         состояние, если backend не получил нормальный dragend от DOM.
         Пустой end() достаточен — сам вызов сбрасывает isDragging
         и освобождает drag-session backend'а. */
      end: () => undefined,
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    /* Зависимости от dragPayload — useDrag пересоздаёт spec, когда
       payload меняется (например, folder.parent_id изменился после
       move). Без этого dragPayload в item'е остался бы навсегда
       тот, каким был при первом mount'е DndRow. */
    [
      dragPayload?.kind,
      dragPayload?.kind === 'folder' ? dragPayload.folderId : null,
      dragPayload?.kind === 'folder' ? dragPayload.parentId : null,
      dragPayload?.kind === 'folder' ? dragPayload.level : null,
      dragPayload?.kind === 'item' ? dragPayload.objectId : null,
      dragPayload?.kind === 'item' ? dragPayload.fromFolderId : null,
    ],
  );

  /* dropZone — одновременно state (для re-render визуальной подсветки)
     и ref-зеркало (для синхронного чтения внутри drop handler'а).
     Нужно обе формы:
       - state → React увидит изменение и перекрасит Row
       - ref   → drop handler в useDrop'е читает СЕЙЧАС (closure
                над deps не включает dropZone, поэтому state в замыкании
                был бы stale)

     Почему не использовать computeDropZone прямо в drop: некоторые
     браузеры (Firefox, некоторые версии Chromium) возвращают null
     из monitor.getClientOffset() в момент drop, и зона падает на
     fallback 'into' → выше/ниже интерпретируется как merge. */
  const [dropZone, setDropZone] = useState<DropZone | null>(null);
  const dropZoneRef = useRef<DropZone | null>(null);

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept,
      canDrop: (dragged: DndPayload) => canAccept(dragged),
      hover: (dragged: DndPayload, monitor: DropTargetMonitor) => {
        // hover вызывается на КАЖДЫЙ dragover — именно здесь ловим
        // движение курсора внутри row'а (переходы above/into/below).
        if (!monitor.isOver({ shallow: true })) return;
        const zone = computeDropZone(
          monitor,
          ref.current,
          canDropInto(dragged),
        );
        dropZoneRef.current = zone;
        setDropZone(prev => (prev === zone ? prev : zone));
      },
      drop: (dragged: DndPayload, monitor: DropTargetMonitor) => {
        if (monitor.didDrop()) return; // nested target перехватил
        // Берём зону из ref (последнее значение из hover), а не
        // recompute через monitor — getClientOffset в drop может
        // вернуть null на некоторых браузерах.
        const zone =
          dropZoneRef.current ??
          computeDropZone(monitor, ref.current, canDropInto(dragged)) ??
          'into';
        onDrop?.(dragged, zone);
      },
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver({ shallow: true }) && monitor.canDrop(),
      }),
    }),
    [accept, canAccept, canDropInto, onDrop],
  );

  /* Сброс dropZone когда курсор ушёл с row'а (isOver=false). */
  useEffect(() => {
    if (!isOver) {
      dropZoneRef.current = null;
      setDropZone(null);
    }
  }, [isOver]);

  // Drop всегда подключаем (row может быть drop-target даже без drag).
  // Drag подключаем только если задан payload — иначе DOM получит
  // draggable="false" естественным путём, и native-drag не запустится
  // для системных папок («Без департамента», is_default).
  if (dragPayload) {
    drag(drop(ref));
  } else {
    drop(ref);
  }

  return <>{children({ isDragging, isOver, dropZone, ref })}</>;
};

/* ─── DndBody: только drop-target, для пустых тел колонок ─────────── */

interface DndBodyProps {
  accept?: string[];
  canAccept?: (payload: DndPayload) => boolean;
  onDrop: (payload: DndPayload) => void;
  children: (state: {
    isOver: boolean;
    ref: React.RefObject<HTMLDivElement>;
  }) => ReactNode;
}

export const DndBody: FC<DndBodyProps> = ({
  accept = acceptAll(),
  canAccept = () => true,
  onDrop,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept,
      canDrop: (dragged: DndPayload) => canAccept(dragged),
      drop: (dragged: DndPayload, monitor: DropTargetMonitor) => {
        if (monitor.didDrop()) return; // nested target уже обработал
        onDrop(dragged);
      },
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver({ shallow: true }) && monitor.canDrop(),
      }),
    }),
    [accept, canAccept, onDrop],
  );

  drop(ref);

  return <>{children({ isOver, ref })}</>;
};

/* ─── Хелперы для преобразования существующих моделей в DnD payload ── */

export function folderDragPayload(
  folderId: number,
  level: FolderLevel,
  parentId: number | null,
): FolderDragPayload {
  return { kind: 'folder', folderId, level, parentId };
}

export function itemDragPayload(item: CatalogFolderItem): ItemDragPayload {
  return {
    kind: 'item',
    objectType: item.object_type,
    objectId: item.object_id,
    fromFolderId: item.folder_id,
  };
}
