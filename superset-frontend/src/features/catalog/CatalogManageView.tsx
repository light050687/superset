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
 * CatalogManageView — 4-колоночный Miller drill-down режим управления
 * каталогом. Рендерится внутри CatalogDrawer при tab='manage'.
 *
 * Функционал:
 *  - drill-down: Департаменты → Подразделы → Папки → Объекты
 *  - добавление / переименование / удаление папок через prompt
 *  - DnD: перетаскивание папок между уровнями и объектов между папками
 *  - переименование названий колонок (catColLabels, localStorage)
 *  - реальные имена объектов через SupersetClient (hook useCatalogObjectNames)
 */
import { styled, t } from '@superset-ui/core';
import {
  type DragEvent,
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DS2_VARS } from 'src/theme/ds2';
import {
  createCatalogFolder,
  deleteCatalogFolder,
  listCatalogItems,
  moveCatalogFolder,
  unassignCatalogItems,
  updateCatalogFolder,
} from './api';
import { CatalogDeleteModal } from './CatalogDeleteModal';
import type {
  CatalogFolderItem,
  CatalogFolderNode,
  CatalogObjectType,
} from './types';
import {
  objectKey,
  useCatalogObjectNames,
} from './useCatalogObjectNames';
import {
  useCatalogColumnLabels,
  type ColumnLabelKey,
} from './useCatalogColumnLabels';

interface CatalogManageViewProps {
  folders: CatalogFolderNode[];
  onChanged: () => Promise<void> | void;
}

/* ─── Miller columns grid ─── */

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 0;
  flex: 1;
  min-height: 0;
  padding: 0 22px;
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 0 16px;
  border-right: 1px solid ${DS2_VARS.g100};

  &:first-child {
    padding-left: 0;
  }
  &:last-child {
    padding-right: 0;
    border-right: none;
  }
`;

const ColHead = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 4px 10px;
  flex-shrink: 0;
  font-size: 9.5px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
`;

/* Мокап: заголовок колонки кликабелен (редактирование имени через prompt).
   Hover — подсвечивается icon карандаша. */
const ColHeadLabel = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  padding: 0;
  color: inherit;
  font: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  & > svg {
    width: 10px;
    height: 10px;
    opacity: 0;
    transition: opacity 0.12s ${DS2_VARS.ease};
    flex-shrink: 0;
  }

  &:hover {
    color: ${DS2_VARS.ink};
  }
  &:hover > svg {
    opacity: 0.7;
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

const ColHeadCount = styled.span`
  color: ${DS2_VARS.g400};
  font-family: ${DS2_VARS.fontMono};
  margin-left: auto;
`;

const AddBtn = styled.button`
  background: none;
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g500};
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition:
    border-color 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease},
    background 0.12s ${DS2_VARS.ease};

  &:hover:not(:disabled) {
    border-color: ${DS2_VARS.cSky};
    color: ${DS2_VARS.cSky};
    background: rgba(59, 139, 217, 0.12);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  svg {
    width: 9px;
    height: 9px;
  }
`;

const ColBody = styled.div<{ $dropActive?: boolean }>`
  flex: 1;
  overflow-y: auto;
  padding: 0 0 10px;
  border-radius: 6px;
  outline: 1px dashed
    ${({ $dropActive }) => ($dropActive ? DS2_VARS.cSky : 'transparent')};
  outline-offset: -2px;
  background: ${({ $dropActive }) =>
    $dropActive ? 'rgba(59, 139, 217, 0.08)' : 'transparent'};
  transition:
    outline-color 0.12s ${DS2_VARS.ease},
    background 0.12s ${DS2_VARS.ease};

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g200};
    border-radius: 2px;
  }
`;

const Row = styled.div<{ $selected?: boolean; $dropActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s ${DS2_VARS.ease};
  background: ${({ $selected, $dropActive }) =>
    $dropActive
      ? 'rgba(59, 139, 217, 0.18)'
      : $selected
      ? 'rgba(59, 139, 217, 0.14)'
      : 'transparent'};
  color: ${({ $selected }) => ($selected ? DS2_VARS.cSky : DS2_VARS.ink)};
  font-family: ${DS2_VARS.fontSans};
  font-size: 12.5px;
  text-align: left;
  position: relative;
  outline: 1px dashed
    ${({ $dropActive }) => ($dropActive ? DS2_VARS.cSky : 'transparent')};
  outline-offset: -2px;

  &:hover {
    background: ${({ $selected }) =>
      $selected ? 'rgba(59, 139, 217, 0.18)' : DS2_VARS.bg3};
  }
`;

const Dot = styled.span<{ $color: string }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const Name = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Sub = styled.span`
  display: block;
  font-size: 10.5px;
  color: ${DS2_VARS.g500};
  font-family: ${DS2_VARS.fontMono};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Stack = styled.span`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 1px;
`;

const Count = styled.span`
  font-size: 10px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
`;

const Actions = styled.span`
  display: none;
  gap: 2px;
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: ${DS2_VARS.glassBgElev};
  padding: 2px;
  border-radius: 4px;

  ${Row}:hover & {
    display: flex;
  }
`;

const ActBtn = styled.button`
  background: none;
  border: none;
  color: ${DS2_VARS.g500};
  width: 20px;
  height: 20px;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }

  svg {
    width: 11px;
    height: 11px;
  }
`;

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 12px;
  text-align: center;
  color: ${DS2_VARS.g500};
  font-size: 12px;
  font-family: ${DS2_VARS.fontSans};

  svg {
    width: 28px;
    height: 28px;
    color: ${DS2_VARS.g400};
    opacity: 0.55;
  }

  strong {
    font-weight: 500;
    font-size: 12.5px;
    color: ${DS2_VARS.g600};
  }

  span {
    font-size: 10.5px;
    color: ${DS2_VARS.g500};
    font-family: ${DS2_VARS.fontMono};
  }
`;

/* ─── SVG icons ─── */

const IconPlus = () => (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M5 1v8M1 5h8" />
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4}>
    <path d="M2 10l1.5-.3 6-6L8 2l-6 6z" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4}>
    <path d="M3 3l6 6M9 3l-6 6" />
  </svg>
);

const IconFolder = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3}>
    <path d="M2 3h5l2 2h5v8H2z" />
  </svg>
);

const IconFolderSub = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3}>
    <path d="M3 4l1-1h3l1 1h5v9H3z" />
  </svg>
);

const IconBox = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3}>
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M5 8h6" />
  </svg>
);

/* ─── Palette (DS 2.0) для новых папок ─── */

const PALETTE = [
  '#3B8BD9',
  '#E870C0',
  '#E87C3E',
  '#16A34A',
  '#8B5CF6',
  '#DC2626',
  '#CA8A04',
  '#CCB604',
];

function nextColor(count: number): string {
  return PALETTE[count % PALETTE.length];
}

/* ─── DnD payload format ─── */

interface FolderDragPayload {
  kind: 'folder';
  folderId: number;
}

interface ItemDragPayload {
  kind: 'item';
  objectType: CatalogObjectType;
  objectId: number;
  fromFolderId: number | null;
}

type DragPayload = FolderDragPayload | ItemDragPayload;

const DRAG_MIME = 'application/x-catalog-dnd';

function serializeDrag(payload: DragPayload): string {
  return JSON.stringify(payload);
}

function parseDrag(raw: string): DragPayload | null {
  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}

/* ─── Component ─── */

export const CatalogManageView: FC<CatalogManageViewProps> = ({
  folders,
  onChanged,
}) => {
  const [deptId, setDeptId] = useState<number | null>(null);
  const [subId, setSubId] = useState<number | null>(null);
  const [folderId, setFolderId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<CatalogFolderNode | null>(null);
  const [items, setItems] = useState<CatalogFolderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const { labels, rename: renameLabel } = useCatalogColumnLabels();

  const depts = useMemo(
    () => folders.filter(f => f.parent_id === null),
    [folders],
  );
  const subs = useMemo(
    () => (deptId === null ? [] : folders.filter(f => f.parent_id === deptId)),
    [folders, deptId],
  );
  const subfolders = useMemo(
    () => (subId === null ? [] : folders.filter(f => f.parent_id === subId)),
    [folders, subId],
  );

  // Сброс selection если удалили выбранную папку
  useEffect(() => {
    if (deptId !== null && !depts.some(f => f.id === deptId)) {
      setDeptId(null);
      setSubId(null);
      setFolderId(null);
    }
  }, [depts, deptId]);
  useEffect(() => {
    if (subId !== null && !subs.some(f => f.id === subId)) {
      setSubId(null);
      setFolderId(null);
    }
  }, [subs, subId]);
  useEffect(() => {
    if (folderId !== null && !subfolders.some(f => f.id === folderId)) {
      setFolderId(null);
    }
  }, [subfolders, folderId]);

  // Подгрузка объектов при выборе папки
  useEffect(() => {
    if (folderId === null) {
      setItems([]);
      return;
    }
    setItemsLoading(true);
    listCatalogItems(folderId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setItemsLoading(false));
  }, [folderId]);

  const objectNames = useCatalogObjectNames(items);

  /* ─── Rename column label ─── */
  const handleRenameColumn = useCallback(
    (key: ColumnLabelKey, current: string) => {
      // eslint-disable-next-line no-alert
      const next = window.prompt(
        t('Новое название колонки (мн. ч.)'),
        current,
      );
      if (!next) return;
      renameLabel(key, next);
    },
    [renameLabel],
  );

  /* ─── Create folder ─── */
  const addFolder = async (parentId: number | null, columnKey: ColumnLabelKey) => {
    // eslint-disable-next-line no-alert
    const name = window.prompt(
      t('Название нового элемента «{{label}}»', {
        label: labels[columnKey],
      }),
    );
    if (!name || !name.trim()) return;
    try {
      await createCatalogFolder({
        name: name.trim(),
        color: nextColor(folders.length),
        parent_id: parentId,
      });
      await onChanged();
    } catch {
      // ignore
    }
  };

  /* ─── Rename folder ─── */
  const renameFolder = async (folder: CatalogFolderNode) => {
    // eslint-disable-next-line no-alert
    const name = window.prompt(t('Новое название'), folder.name);
    if (!name || name.trim() === folder.name) return;
    try {
      await updateCatalogFolder(folder.id, { name: name.trim() });
      await onChanged();
    } catch {
      // ignore
    }
  };

  /* ─── Delete folder ─── */
  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCatalogFolder(deleteTarget.id);
      await onChanged();
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
    }
  };

  /* ─── DnD handlers ─── */

  const onDragStartFolder = (
    e: DragEvent<HTMLDivElement>,
    folder: CatalogFolderNode,
  ) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      DRAG_MIME,
      serializeDrag({ kind: 'folder', folderId: folder.id }),
    );
  };

  const onDragStartItem = (
    e: DragEvent<HTMLDivElement>,
    item: CatalogFolderItem,
  ) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      DRAG_MIME,
      serializeDrag({
        kind: 'item',
        objectType: item.object_type,
        objectId: item.object_id,
        fromFolderId: item.folder_id,
      }),
    );
  };

  const onDragOver = (e: DragEvent<HTMLElement>, target: string) => {
    // Разрешаем drop только если есть наш MIME
    if (Array.from(e.dataTransfer.types).includes(DRAG_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTarget(target);
    }
  };

  const onDragLeave = () => setDropTarget(null);

  const movePayload = async (
    payload: DragPayload,
    target: {
      parentFolderId: number | null;
      itemTargetFolderId?: number | null;
    },
  ) => {
    if (payload.kind === 'folder') {
      if (payload.folderId === target.parentFolderId) return;
      try {
        await moveCatalogFolder(payload.folderId, {
          parent_id: target.parentFolderId,
        });
        await onChanged();
      } catch {
        // ignore
      }
    } else {
      const destFolderId = target.itemTargetFolderId;
      if (destFolderId === undefined || destFolderId === null) return;
      if (payload.fromFolderId === destFolderId) return;
      try {
        // Сначала убираем из старой папки, затем добавляем в новую
        if (payload.fromFolderId !== null) {
          await unassignCatalogItems(payload.fromFolderId, [
            {
              object_type: payload.objectType,
              object_id: payload.objectId,
            },
          ]);
        }
        // Import assign api locally
        const { assignCatalogItems } = await import('./api');
        await assignCatalogItems(destFolderId, [
          {
            object_type: payload.objectType,
            object_id: payload.objectId,
          },
        ]);
        await onChanged();
        // Обновляем items если мы смотрим ту папку
        if (folderId !== null) {
          const refreshed = await listCatalogItems(folderId);
          setItems(refreshed);
        }
      } catch {
        // ignore
      }
    }
  };

  const onDropOnFolder = async (
    e: DragEvent<HTMLElement>,
    folder: CatalogFolderNode,
  ) => {
    e.preventDefault();
    setDropTarget(null);
    const raw = e.dataTransfer.getData(DRAG_MIME);
    const payload = parseDrag(raw);
    if (!payload) return;
    if (payload.kind === 'folder') {
      await movePayload(payload, { parentFolderId: folder.id });
    } else {
      await movePayload(payload, {
        parentFolderId: null,
        itemTargetFolderId: folder.id,
      });
    }
  };

  const onDropOnColumnBody = async (
    e: DragEvent<HTMLDivElement>,
    parentFolderId: number | null,
  ) => {
    e.preventDefault();
    setDropTarget(null);
    const raw = e.dataTransfer.getData(DRAG_MIME);
    const payload = parseDrag(raw);
    if (!payload) return;
    if (payload.kind === 'folder') {
      await movePayload(payload, { parentFolderId });
    }
  };

  const selectedDept = depts.find(f => f.id === deptId);
  const selectedSub = subs.find(f => f.id === subId);
  const selectedFolder = subfolders.find(f => f.id === folderId);

  return (
    <>
      <Grid>
        {/* Col 1: Департаменты */}
        <Col>
          <ColHead>
            <ColHeadLabel
              type="button"
              onClick={() => handleRenameColumn('dept', labels.dept)}
              title={t('Переименовать колонку')}
            >
              {labels.dept}
              <IconEdit />
            </ColHeadLabel>
            <ColHeadCount>{depts.length}</ColHeadCount>
            <AddBtn
              type="button"
              onClick={() => addFolder(null, 'dept')}
              title={t('Добавить')}
            >
              <IconPlus />
            </AddBtn>
          </ColHead>
          <ColBody
            $dropActive={dropTarget === 'col:dept'}
            onDragOver={e => onDragOver(e, 'col:dept')}
            onDragLeave={onDragLeave}
            onDrop={e => onDropOnColumnBody(e, null)}
          >
            {depts.length === 0 ? (
              <Empty>
                <IconFolder />
                <strong>{t('Нет {{label}}', { label: labels.dept.toLowerCase() })}</strong>
                <span>{t('Создайте первый через «+»')}</span>
              </Empty>
            ) : (
              depts.map(d => (
                <Row
                  key={d.id}
                  $selected={deptId === d.id}
                  $dropActive={dropTarget === `row:${d.id}`}
                  draggable
                  onDragStart={e => onDragStartFolder(e, d)}
                  onDragOver={e => onDragOver(e, `row:${d.id}`)}
                  onDragLeave={onDragLeave}
                  onDrop={e => onDropOnFolder(e, d)}
                  onClick={() => {
                    setDeptId(d.id);
                    setSubId(null);
                    setFolderId(null);
                  }}
                >
                  <Dot $color={d.color ?? '#999999'} />
                  <Name>{d.name}</Name>
                  <Count>{d.item_count}</Count>
                  <Actions>
                    <ActBtn
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        renameFolder(d);
                      }}
                      aria-label={t('Переименовать')}
                    >
                      <IconEdit />
                    </ActBtn>
                    <ActBtn
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setDeleteTarget(d);
                      }}
                      aria-label={t('Удалить')}
                    >
                      <IconTrash />
                    </ActBtn>
                  </Actions>
                </Row>
              ))
            )}
          </ColBody>
        </Col>

        {/* Col 2: Подразделы */}
        <Col>
          <ColHead>
            <ColHeadLabel
              type="button"
              onClick={() => handleRenameColumn('sub', labels.sub)}
              title={t('Переименовать колонку')}
            >
              {labels.sub}
              <IconEdit />
            </ColHeadLabel>
            <ColHeadCount>{subs.length}</ColHeadCount>
            <AddBtn
              type="button"
              onClick={() => deptId !== null && addFolder(deptId, 'sub')}
              disabled={deptId === null}
              title={t('Добавить')}
            >
              <IconPlus />
            </AddBtn>
          </ColHead>
          <ColBody
            $dropActive={dropTarget === 'col:sub'}
            onDragOver={e => deptId !== null && onDragOver(e, 'col:sub')}
            onDragLeave={onDragLeave}
            onDrop={e => deptId !== null && onDropOnColumnBody(e, deptId)}
          >
            {deptId === null ? (
              <Empty>
                <IconFolder />
                <strong>
                  {t('Выберите {{label}}', { label: labels.dept.toLowerCase().slice(0, -1) })}
                </strong>
                <span>
                  {t('Слева, чтобы открыть {{label}}', {
                    label: labels.sub.toLowerCase(),
                  })}
                </span>
              </Empty>
            ) : subs.length === 0 ? (
              <Empty>
                <IconFolderSub />
                <strong>{t('Нет {{label}}', { label: labels.sub.toLowerCase() })}</strong>
                <span>{t('Создайте первый через «+»')}</span>
              </Empty>
            ) : (
              subs.map(s => (
                <Row
                  key={s.id}
                  $selected={subId === s.id}
                  $dropActive={dropTarget === `row:${s.id}`}
                  draggable
                  onDragStart={e => onDragStartFolder(e, s)}
                  onDragOver={e => onDragOver(e, `row:${s.id}`)}
                  onDragLeave={onDragLeave}
                  onDrop={e => onDropOnFolder(e, s)}
                  onClick={() => {
                    setSubId(s.id);
                    setFolderId(null);
                  }}
                >
                  <Dot
                    $color={s.color ?? selectedDept?.color ?? DS2_VARS.cSky}
                  />
                  <Name>{s.name}</Name>
                  <Count>{s.item_count}</Count>
                  <Actions>
                    <ActBtn
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        renameFolder(s);
                      }}
                    >
                      <IconEdit />
                    </ActBtn>
                    <ActBtn
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setDeleteTarget(s);
                      }}
                    >
                      <IconTrash />
                    </ActBtn>
                  </Actions>
                </Row>
              ))
            )}
          </ColBody>
        </Col>

        {/* Col 3: Папки */}
        <Col>
          <ColHead>
            <ColHeadLabel
              type="button"
              onClick={() => handleRenameColumn('folder', labels.folder)}
              title={t('Переименовать колонку')}
            >
              {labels.folder}
              <IconEdit />
            </ColHeadLabel>
            <ColHeadCount>{subfolders.length}</ColHeadCount>
            <AddBtn
              type="button"
              onClick={() => subId !== null && addFolder(subId, 'folder')}
              disabled={subId === null}
              title={t('Добавить')}
            >
              <IconPlus />
            </AddBtn>
          </ColHead>
          <ColBody
            $dropActive={dropTarget === 'col:folder'}
            onDragOver={e => subId !== null && onDragOver(e, 'col:folder')}
            onDragLeave={onDragLeave}
            onDrop={e => subId !== null && onDropOnColumnBody(e, subId)}
          >
            {subId === null ? (
              <Empty>
                <IconFolderSub />
                <strong>
                  {t('Выберите {{label}}', {
                    label: labels.sub.toLowerCase().slice(0, -1),
                  })}
                </strong>
                <span>
                  {t('Чтобы увидеть {{label}} и объекты', {
                    label: labels.folder.toLowerCase(),
                  })}
                </span>
              </Empty>
            ) : subfolders.length === 0 ? (
              <Empty>
                <IconFolderSub />
                <strong>{t('Нет {{label}}', { label: labels.folder.toLowerCase() })}</strong>
                <span>{t('Создайте первую через «+»')}</span>
              </Empty>
            ) : (
              subfolders.map(f => (
                <Row
                  key={f.id}
                  $selected={folderId === f.id}
                  $dropActive={dropTarget === `row:${f.id}`}
                  draggable
                  onDragStart={e => onDragStartFolder(e, f)}
                  onDragOver={e => onDragOver(e, `row:${f.id}`)}
                  onDragLeave={onDragLeave}
                  onDrop={e => onDropOnFolder(e, f)}
                  onClick={() => setFolderId(f.id)}
                >
                  <Dot
                    $color={
                      f.color ?? selectedSub?.color ?? DS2_VARS.cTangerine
                    }
                  />
                  <Name>{f.name}</Name>
                  <Count>{f.item_count}</Count>
                  <Actions>
                    <ActBtn
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        renameFolder(f);
                      }}
                    >
                      <IconEdit />
                    </ActBtn>
                    <ActBtn
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setDeleteTarget(f);
                      }}
                    >
                      <IconTrash />
                    </ActBtn>
                  </Actions>
                </Row>
              ))
            )}
          </ColBody>
        </Col>

        {/* Col 4: Объекты */}
        <Col>
          <ColHead>
            <ColHeadLabel
              type="button"
              onClick={() => handleRenameColumn('items', labels.items)}
              title={t('Переименовать колонку')}
            >
              {labels.items}
              <IconEdit />
            </ColHeadLabel>
            <ColHeadCount>{items.length}</ColHeadCount>
          </ColHead>
          <ColBody>
            {folderId === null ? (
              <Empty>
                <IconBox />
                <strong>
                  {t('Выберите {{label}}', {
                    label: labels.folder.toLowerCase().slice(0, -1),
                  })}
                </strong>
                <span>{t('Чтобы увидеть объекты')}</span>
              </Empty>
            ) : itemsLoading ? (
              <Empty>
                <IconBox />
                <span>{t('Загрузка…')}</span>
              </Empty>
            ) : items.length === 0 ? (
              <Empty>
                <IconBox />
                <strong>{t('Пустая папка')}</strong>
                <span>
                  {selectedFolder
                    ? t('В «{{name}}» пока нет объектов', {
                        name: selectedFolder.name,
                      })
                    : t('Перетащите сюда объекты')}
                </span>
              </Empty>
            ) : (
              items.map(it => {
                const info = objectNames[objectKey(it.object_type, it.object_id)];
                return (
                  <Row
                    key={it.id}
                    draggable
                    onDragStart={e => onDragStartItem(e, it)}
                  >
                    <Dot $color={DS2_VARS.cSky} />
                    <Stack>
                      <Name>
                        {info?.title ??
                          `${it.object_type} #${it.object_id}`}
                      </Name>
                      {info?.subtitle ? <Sub>{info.subtitle}</Sub> : null}
                    </Stack>
                  </Row>
                );
              })
            )}
          </ColBody>
        </Col>
      </Grid>

      <CatalogDeleteModal
        open={deleteTarget !== null}
        folderName={deleteTarget?.name ?? ''}
        hasContents={(deleteTarget?.item_count ?? 0) > 0}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
      />
    </>
  );
};
