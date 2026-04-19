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
 * AiHistoryManageView — режим управления историей чатов. 4 Miller-колонки
 * (симметрично CatalogManageView):
 *
 *   1. Папки (корневые)           — parent_id=null
 *   2. Подпапки                    — parent_id=root.id
 *   3. Под-подпапки                — parent_id=sub.id
 *   4. Чаты                         — sessions выбранной папки (любого уровня)
 *
 * Механики (как в Catalog manage):
 *   - drill-down кликом
 *   - add / rename / delete через prompt
 *   - DnD: папки между уровнями (parent_id update); чаты между папками
 *     (folder_id update)
 *   - «Сбросить» удаляет все корневые папки; чаты остаются без папки
 */
import { styled, t } from '@superset-ui/core';
import {
  type DragEvent,
  type FC,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DS2_VARS } from 'src/theme/ds2';
import {
  createAiChatFolder,
  deleteAiChatFolder,
  deleteAiChatSession,
  listAiChatSessions,
  updateAiChatFolder,
  updateAiChatSession,
} from 'src/features/ai/api';
import type { AiChatFolder, AiChatSession } from 'src/features/ai';

interface AiHistoryManageViewProps {
  folders: AiChatFolder[];
  sessions: AiChatSession[];
  /** Колбэк после любой мутации — sheet перезагрузит папки/сессии. */
  onChanged: () => Promise<void> | void;
}

/* ─── Grid 3 cols ─── */

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

const Head = styled.div`
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

const HeadLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HeadCount = styled.span`
  color: ${DS2_VARS.g400};
  font-family: ${DS2_VARS.fontMono};
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

const Body = styled.div<{ $dropActive?: boolean }>`
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

const IconChat = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3}>
    <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 2v-2H4a2 2 0 01-2-2V4z" />
  </svg>
);

/* ─── Palette + DnD payload ─── */

const PALETTE = [
  '#3B8BD9',
  '#16A34A',
  '#8B5CF6',
  '#E87C3E',
  '#DC2626',
  '#E870C0',
  '#CA8A04',
  '#CCB604',
];

function pickColor(idx: number): string {
  return PALETTE[idx % PALETTE.length];
}

interface FolderDragPayload {
  kind: 'folder';
  folderId: number;
}
interface ChatDragPayload {
  kind: 'chat';
  sessionId: number;
  fromFolderId: number | null;
}
type DragPayload = FolderDragPayload | ChatDragPayload;

const DRAG_MIME = 'application/x-ai-history-dnd';

function serializeDrag(p: DragPayload): string {
  return JSON.stringify(p);
}
function parseDrag(raw: string): DragPayload | null {
  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}

/* ─── Component ─── */

export const AiHistoryManageView: FC<AiHistoryManageViewProps> = ({
  folders,
  sessions,
  onChanged,
}) => {
  const [rootId, setRootId] = useState<number | null>(null);
  const [subId, setSubId] = useState<number | null>(null);
  const [subSubId, setSubSubId] = useState<number | null>(null);
  const [localSessions, setLocalSessions] = useState<AiChatSession[]>(sessions);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  useEffect(() => setLocalSessions(sessions), [sessions]);

  const roots = useMemo(
    () => folders.filter(f => f.parent_id === null),
    [folders],
  );
  const subs = useMemo(
    () => (rootId === null ? [] : folders.filter(f => f.parent_id === rootId)),
    [folders, rootId],
  );
  const subSubs = useMemo(
    () => (subId === null ? [] : folders.filter(f => f.parent_id === subId)),
    [folders, subId],
  );

  // Синхронизация при удалении папки из внешнего списка
  useEffect(() => {
    if (rootId !== null && !folders.some(f => f.id === rootId)) {
      setRootId(null);
      setSubId(null);
      setSubSubId(null);
    }
  }, [folders, rootId]);
  useEffect(() => {
    if (subId !== null && !subs.some(f => f.id === subId)) {
      setSubId(null);
      setSubSubId(null);
    }
  }, [subs, subId]);
  useEffect(() => {
    if (subSubId !== null && !subSubs.some(f => f.id === subSubId)) {
      setSubSubId(null);
    }
  }, [subSubs, subSubId]);

  // Чаты колонки 4: берём чаты самой глубокой выбранной папки.
  const col4Chats = useMemo(() => {
    if (subSubId !== null)
      return localSessions.filter(s => s.folder_id === subSubId);
    if (subId !== null) return localSessions.filter(s => s.folder_id === subId);
    if (rootId !== null) return localSessions.filter(s => s.folder_id === rootId);
    return [];
  }, [localSessions, subSubId, subId, rootId]);

  /* ─── Folder actions ─── */

  const addFolder = async (parentId: number | null) => {
    // eslint-disable-next-line no-alert
    const name = window.prompt(
      parentId === null
        ? t('Название новой папки')
        : t('Название новой подпапки'),
    );
    if (!name || !name.trim()) return;
    try {
      await createAiChatFolder({
        name: name.trim(),
        parent_id: parentId,
      });
      await onChanged();
    } catch {
      // ignore
    }
  };

  const renameFolder = async (folder: AiChatFolder) => {
    // eslint-disable-next-line no-alert
    const name = window.prompt(t('Новое название'), folder.name);
    if (!name || name.trim() === folder.name) return;
    try {
      await updateAiChatFolder(folder.id, { name: name.trim() });
      await onChanged();
    } catch {
      // ignore
    }
  };

  const deleteFolder = async (folder: AiChatFolder) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(
      t('Удалить папку «{{name}}»? Чаты внутри останутся без папки.', {
        name: folder.name,
      }),
    );
    if (!ok) return;
    try {
      await deleteAiChatFolder(folder.id);
      await onChanged();
    } catch {
      // ignore
    }
  };

  /* ─── Chat actions ─── */

  const removeChat = async (session: AiChatSession) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(
      t('Удалить чат «{{name}}»?', { name: session.title || '—' }),
    );
    if (!ok) return;
    try {
      await deleteAiChatSession(session.id);
      const refreshed = await listAiChatSessions();
      setLocalSessions(refreshed);
      await onChanged();
    } catch {
      // ignore
    }
  };

  /* ─── DnD ─── */

  const onDragStartFolder = (
    e: DragEvent<HTMLDivElement>,
    folder: AiChatFolder,
  ) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      DRAG_MIME,
      serializeDrag({ kind: 'folder', folderId: folder.id }),
    );
  };

  const onDragStartChat = (
    e: DragEvent<HTMLDivElement>,
    session: AiChatSession,
  ) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      DRAG_MIME,
      serializeDrag({
        kind: 'chat',
        sessionId: session.id,
        fromFolderId: session.folder_id,
      }),
    );
  };

  const onDragOver = (e: DragEvent<HTMLElement>, target: string) => {
    if (Array.from(e.dataTransfer.types).includes(DRAG_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTarget(target);
    }
  };
  const onDragLeave = () => setDropTarget(null);

  const moveFolder = async (payload: FolderDragPayload, newParent: number | null) => {
    try {
      await updateAiChatFolder(payload.folderId, { parent_id: newParent });
      await onChanged();
    } catch {
      // ignore
    }
  };

  const moveChat = async (payload: ChatDragPayload, newFolder: number | null) => {
    if (payload.fromFolderId === newFolder) return;
    try {
      await updateAiChatSession(payload.sessionId, { folder_id: newFolder });
      const refreshed = await listAiChatSessions();
      setLocalSessions(refreshed);
      await onChanged();
    } catch {
      // ignore
    }
  };

  const onDropOnFolder = async (
    e: DragEvent<HTMLElement>,
    target: { folderId: number },
  ) => {
    e.preventDefault();
    setDropTarget(null);
    const payload = parseDrag(e.dataTransfer.getData(DRAG_MIME));
    if (!payload) return;
    if (payload.kind === 'folder') {
      if (payload.folderId === target.folderId) return;
      await moveFolder(payload, target.folderId);
    } else {
      await moveChat(payload, target.folderId);
    }
  };

  const onDropOnColumnBody = async (
    e: DragEvent<HTMLDivElement>,
    newParentFolder: number | null,
  ) => {
    e.preventDefault();
    setDropTarget(null);
    const payload = parseDrag(e.dataTransfer.getData(DRAG_MIME));
    if (!payload || payload.kind !== 'folder') return;
    await moveFolder(payload, newParentFolder);
  };

  const selectedRoot = roots.find(f => f.id === rootId);
  const selectedSub = subs.find(f => f.id === subId);
  const selectedSubSub = subSubs.find(f => f.id === subSubId);

  /* Renderer одной строки-папки (переиспользуется в col 1/2/3). */
  const renderFolderRow = (
    f: AiChatFolder,
    isSelected: boolean,
    onSelect: () => void,
    color: string,
  ) => {
    const own = localSessions.filter(s => s.folder_id === f.id).length;
    const nested = folders
      .filter(x => x.parent_id === f.id)
      .reduce(
        (sum, sf) =>
          sum + localSessions.filter(s => s.folder_id === sf.id).length,
        0,
      );
    return (
      <Row
        key={f.id}
        $selected={isSelected}
        $dropActive={dropTarget === `row:${f.id}`}
        draggable
        onDragStart={e => onDragStartFolder(e, f)}
        onDragOver={e => onDragOver(e, `row:${f.id}`)}
        onDragLeave={onDragLeave}
        onDrop={e => onDropOnFolder(e, { folderId: f.id })}
        onClick={onSelect}
      >
        <Dot $color={color} />
        <Name>{f.name}</Name>
        <Count>{own + nested}</Count>
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
              deleteFolder(f);
            }}
          >
            <IconTrash />
          </ActBtn>
        </Actions>
      </Row>
    );
  };

  return (
    <Grid>
      {/* Col 1: Папки (root) */}
      <Col>
        <Head>
          <HeadLabel>{t('Папки')}</HeadLabel>
          <HeadCount>{roots.length}</HeadCount>
          <AddBtn
            type="button"
            onClick={() => addFolder(null)}
            title={t('Новая папка')}
          >
            <IconPlus />
          </AddBtn>
        </Head>
        <Body
          $dropActive={dropTarget === 'col:root'}
          onDragOver={e => onDragOver(e, 'col:root')}
          onDragLeave={onDragLeave}
          onDrop={e => onDropOnColumnBody(e, null)}
        >
          {roots.length === 0 ? (
            <Empty>
              <IconFolder />
              <strong>{t('Нет папок')}</strong>
              <span>{t('Создайте первую через «+»')}</span>
            </Empty>
          ) : (
            roots.map((f, idx) =>
              renderFolderRow(
                f,
                rootId === f.id,
                () => {
                  setRootId(f.id);
                  setSubId(null);
                  setSubSubId(null);
                },
                pickColor(idx),
              ),
            )
          )}
        </Body>
      </Col>

      {/* Col 2: Подпапки */}
      <Col>
        <Head>
          <HeadLabel>{t('Подпапки')}</HeadLabel>
          <HeadCount>{subs.length}</HeadCount>
          <AddBtn
            type="button"
            disabled={rootId === null}
            onClick={() => rootId !== null && addFolder(rootId)}
            title={t('Новая подпапка')}
          >
            <IconPlus />
          </AddBtn>
        </Head>
        <Body
          $dropActive={dropTarget === 'col:sub'}
          onDragOver={e => rootId !== null && onDragOver(e, 'col:sub')}
          onDragLeave={onDragLeave}
          onDrop={e => rootId !== null && onDropOnColumnBody(e, rootId)}
        >
          {rootId === null ? (
            <Empty>
              <IconFolderSub />
              <strong>{t('Выберите папку')}</strong>
              <span>{t('Слева, чтобы увидеть подпапки')}</span>
            </Empty>
          ) : subs.length === 0 ? (
            <Empty>
              <IconFolderSub />
              <strong>{t('Нет подпапок')}</strong>
              <span>{t('Создайте первую через «+»')}</span>
            </Empty>
          ) : (
            subs.map((sf, idx) =>
              renderFolderRow(
                sf,
                subId === sf.id,
                () => {
                  setSubId(sf.id);
                  setSubSubId(null);
                },
                pickColor(idx + 3),
              ),
            )
          )}
        </Body>
      </Col>

      {/* Col 3: Под-подпапки */}
      <Col>
        <Head>
          <HeadLabel>{t('Вложенные')}</HeadLabel>
          <HeadCount>{subSubs.length}</HeadCount>
          <AddBtn
            type="button"
            disabled={subId === null}
            onClick={() => subId !== null && addFolder(subId)}
            title={t('Новая вложенная папка')}
          >
            <IconPlus />
          </AddBtn>
        </Head>
        <Body
          $dropActive={dropTarget === 'col:subsub'}
          onDragOver={e => subId !== null && onDragOver(e, 'col:subsub')}
          onDragLeave={onDragLeave}
          onDrop={e => subId !== null && onDropOnColumnBody(e, subId)}
        >
          {subId === null ? (
            <Empty>
              <IconFolderSub />
              <strong>{t('Выберите подпапку')}</strong>
              <span>{t('Чтобы увидеть вложенные')}</span>
            </Empty>
          ) : subSubs.length === 0 ? (
            <Empty>
              <IconFolderSub />
              <strong>{t('Нет вложенных')}</strong>
              <span>{t('Создайте первую через «+»')}</span>
            </Empty>
          ) : (
            subSubs.map((ssf, idx) =>
              renderFolderRow(
                ssf,
                subSubId === ssf.id,
                () => setSubSubId(ssf.id),
                pickColor(idx + 5),
              ),
            )
          )}
        </Body>
      </Col>

      {/* Col 4: Чаты */}
      <Col>
        <Head>
          <HeadLabel>
            {selectedSubSub
              ? selectedSubSub.name
              : selectedSub
              ? selectedSub.name
              : selectedRoot
              ? selectedRoot.name
              : t('Чаты')}
          </HeadLabel>
          <HeadCount>{col4Chats.length}</HeadCount>
        </Head>
        <Body>
          {rootId === null ? (
            <Empty>
              <IconChat />
              <strong>{t('Выберите папку')}</strong>
              <span>{t('Чтобы увидеть чаты')}</span>
            </Empty>
          ) : col4Chats.length === 0 ? (
            <Empty>
              <IconChat />
              <strong>{t('Пусто')}</strong>
              <span>{t('Перетащите сюда чаты')}</span>
            </Empty>
          ) : (
            col4Chats.map(c => (
              <Row
                key={c.id}
                draggable
                onDragStart={e => onDragStartChat(e, c)}
              >
                <Dot $color={DS2_VARS.g400} />
                <Name>{c.title || t('Без названия')}</Name>
                <Actions>
                  <ActBtn
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      removeChat(c);
                    }}
                  >
                    <IconTrash />
                  </ActBtn>
                </Actions>
              </Row>
            ))
          )}
        </Body>
      </Col>
    </Grid>
  );
};
