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
 * Sidebar AI-режима: папки чатов + сессии с группировкой по дате.
 */
import { styled, t } from '@superset-ui/core';
import { type FC, useMemo, useState } from 'react';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import type {
  AiActiveTask,
  AiChatFolder,
  AiChatSession,
} from './types';

interface AiSidebarProps {
  folders: AiChatFolder[];
  sessions: AiChatSession[];
  activeTasks: AiActiveTask[];
  currentSessionId: number | null;
  onNewChat: () => void;
  onSelectSession: (id: number) => void;
  onNewFolder: () => Promise<void> | void;
  onDeleteFolder: (id: number) => Promise<void> | void;
  onDeleteSession: (id: number) => Promise<void> | void;
  onRenameSession: (id: number, title: string) => Promise<void> | void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const Root = styled.aside<{ $collapsed: boolean }>`
  width: ${({ $collapsed }) => ($collapsed ? 0 : 240)}px;
  background: ${DS2_VARS.s};
  border-right: 1px solid ${DS2_VARS.g100};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  transition: width 0.2s ${DS2_VARS.ease};
  font-family: ${DS2_VARS.fontSans};

  @media (max-width: 767px) {
    /* На mobile AI overlay занимает весь экран — sidebar скрываем, чтобы
       не сжимать main. История чатов в Этапе 6 переедет в AiHistorySheet. */
    display: none;
  }
`;

const Head = styled.div`
  padding: ${DS2_SPACE.s3}px;
  border-bottom: 1px solid ${DS2_VARS.g100};
  flex-shrink: 0;
`;

const NewChatBtn = styled.button`
  width: 100%;
  background: ${DS2_VARS.cSky};
  color: ${DS2_VARS.s};
  border: none;
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s3}px;
  border-radius: ${DS2_RADIUS.control}px;
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${DS2_SPACE.s1}px;
  transition: background 0.12s ${DS2_VARS.ease};

  &:hover {
    filter: brightness(1.1);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.ink};
    outline-offset: 2px;
  }

  svg {
    width: 13px;
    height: 13px;
  }
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${DS2_SPACE.s2}px;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }
`;

const Section = styled.div`
  margin-bottom: ${DS2_SPACE.s3}px;
`;

const SectionLabel = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 9px;
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s2}px;
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s1}px;

  span.count {
    margin-left: auto;
    color: ${DS2_VARS.g400};
  }
`;

const ActiveRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s2}px;
  border-radius: ${DS2_RADIUS.control}px;
  background: ${DS2_VARS.wnBg};
  border: 1px solid rgba(204, 182, 4, 0.2);
  margin-bottom: ${DS2_SPACE.s1}px;
  font-size: 11px;
  color: ${DS2_VARS.ink};
`;

const Spinner = styled.div`
  width: 10px;
  height: 10px;
  border: 1.5px solid ${DS2_VARS.g300};
  border-top-color: ${DS2_VARS.wn};
  border-radius: 50%;
  animation: ai-spin 1s linear infinite;
  flex-shrink: 0;

  @keyframes ai-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const FolderRow = styled.button<{ $open: boolean }>`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s1}px;
  width: 100%;
  background: transparent;
  border: none;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s1}px;
  border-radius: ${DS2_RADIUS.control}px;
  cursor: pointer;
  color: ${DS2_VARS.g600};
  font-size: 12px;
  font-family: ${DS2_VARS.fontSans};
  text-align: left;

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }

  .arrow {
    width: 10px;
    font-size: 8px;
    color: ${DS2_VARS.g500};
    transition: transform 0.12s ${DS2_VARS.ease};
    transform: rotate(${({ $open }) => ($open ? '90deg' : '0deg')});
  }

  .name {
    flex: 1;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    font-family: ${DS2_VARS.fontMono};
    font-size: 9px;
    color: ${DS2_VARS.g400};
  }
`;

const FolderChildren = styled.div<{ $open: boolean }>`
  padding-left: 14px;
  display: ${({ $open }) => ($open ? 'block' : 'none')};
`;

const ChatRow = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s1}px;
  width: 100%;
  background: ${({ $active }) =>
    $active ? 'rgba(59, 139, 217, 0.08)' : 'transparent'};
  border: none;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s2}px;
  border-radius: ${DS2_RADIUS.control}px;
  cursor: pointer;
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g600)};
  font-size: 11px;
  font-family: ${DS2_VARS.fontSans};
  text-align: left;

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }

  .title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .time {
    font-family: ${DS2_VARS.fontMono};
    font-size: 9px;
    color: ${DS2_VARS.g400};
  }
`;

const Foot = styled.div`
  padding: ${DS2_SPACE.s2}px;
  border-top: 1px solid ${DS2_VARS.g100};
  display: flex;
  gap: ${DS2_SPACE.s1}px;
  flex-shrink: 0;
`;

const FootBtn = styled.button`
  flex: 1;
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g600};
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s3}px;
  border-radius: ${DS2_RADIUS.control}px;
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${DS2_SPACE.s1}px;

  &:hover {
    border-color: ${DS2_VARS.g400};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }
`;

const IconPlus: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M8 3v10M3 8h10" />
  </svg>
);

const IconFolder: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M2 4l2-2h4l1 1h5v9H2V4z" />
    <path d="M7 8h2M8 7v2" />
  </svg>
);

const IconChevronLeft: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M10 4l-4 4 4 4" />
  </svg>
);

function groupSessionsByDate(sessions: AiChatSession[]): {
  label: string;
  sessions: AiChatSession[];
}[] {
  // Простая группировка «Сегодня / Вчера / На этой неделе / Раньше» по changed_on.
  const now = Date.now();
  const ms = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
  };
  const buckets: Record<string, AiChatSession[]> = {
    today: [],
    yesterday: [],
    week: [],
    older: [],
  };
  sessions.forEach(s => {
    const t = s.changed_on ? Date.parse(s.changed_on) : 0;
    const diff = now - t;
    if (diff < ms.day) buckets.today.push(s);
    else if (diff < 2 * ms.day) buckets.yesterday.push(s);
    else if (diff < ms.week) buckets.week.push(s);
    else buckets.older.push(s);
  });
  const out: { label: string; sessions: AiChatSession[] }[] = [];
  if (buckets.today.length) out.push({ label: t('Сегодня'), sessions: buckets.today });
  if (buckets.yesterday.length)
    out.push({ label: t('Вчера'), sessions: buckets.yesterday });
  if (buckets.week.length)
    out.push({ label: t('На этой неделе'), sessions: buckets.week });
  if (buckets.older.length)
    out.push({ label: t('Раньше'), sessions: buckets.older });
  return out;
}

export const AiSidebar: FC<React.PropsWithChildren<AiSidebarProps>> = ({
  folders,
  sessions,
  activeTasks,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onNewFolder,
  onDeleteFolder,
  onDeleteSession,
  onRenameSession,
  collapsed = false,
  onToggleCollapsed,
}) => {
  const [openFolders, setOpenFolders] = useState<Set<number>>(new Set());

  const toggleFolder = (id: number) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const rootFolders = useMemo(
    () =>
      folders
        .filter(f => f.parent_id === null)
        .sort((a, b) => a.position - b.position),
    [folders],
  );

  const sessionsByFolder = useMemo(() => {
    const map = new Map<number, AiChatSession[]>();
    sessions.forEach(s => {
      if (s.folder_id == null) return;
      const list = map.get(s.folder_id) ?? [];
      list.push(s);
      map.set(s.folder_id, list);
    });
    return map;
  }, [sessions]);

  const withoutFolder = useMemo(
    () => sessions.filter(s => s.folder_id == null),
    [sessions],
  );

  const handleRename = (id: number, currentTitle: string) => {
    const name = window.prompt(t('Новое название чата'), currentTitle);
    if (!name || name === currentTitle) return;
    void onRenameSession(id, name.trim());
  };

  const handleDeleteSession = (id: number) => {
    if (!window.confirm(t('Удалить чат?'))) return;
    void onDeleteSession(id);
  };

  const handleDeleteFolder = (id: number) => {
    if (
      !window.confirm(
        t('Удалить папку? Чаты внутри переместятся в «Без папки».'),
      )
    )
      return;
    void onDeleteFolder(id);
  };

  return (
    <Root $collapsed={collapsed} aria-label={t('История чатов')}>
      <Head>
        <NewChatBtn type="button" onClick={onNewChat} aria-label={t('Новый чат')}>
          <IconPlus />
          {t('Новый чат')}
        </NewChatBtn>
      </Head>
      <Body>
        {activeTasks.length > 0 ? (
          <Section>
            <SectionLabel>
              {t('В работе')}
              <span className="count">{activeTasks.length}</span>
            </SectionLabel>
            {activeTasks.map(task => (
              <ActiveRow key={task.id}>
                <Spinner aria-hidden />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {task.title}
                </span>
                {task.progress_percent != null ? (
                  <span
                    style={{
                      fontFamily: DS2_VARS.fontMono,
                      fontSize: 9,
                      color: DS2_VARS.g500,
                    }}
                  >
                    {task.progress_percent}%
                  </span>
                ) : null}
              </ActiveRow>
            ))}
          </Section>
        ) : null}

        {rootFolders.length > 0 ? (
          <Section>
            <SectionLabel>{t('Папки')}</SectionLabel>
            {rootFolders.map(folder => {
              const isOpen = openFolders.has(folder.id);
              const folderSessions = sessionsByFolder.get(folder.id) ?? [];
              return (
                <div key={folder.id}>
                  <FolderRow
                    type="button"
                    $open={isOpen}
                    onClick={() => toggleFolder(folder.id)}
                    onContextMenu={e => {
                      e.preventDefault();
                      handleDeleteFolder(folder.id);
                    }}
                  >
                    <span className="arrow">▶</span>
                    <IconFolder />
                    <span className="name">{folder.name}</span>
                    <span className="count">{folderSessions.length}</span>
                  </FolderRow>
                  <FolderChildren $open={isOpen}>
                    {folderSessions.map(s => (
                      <ChatRow
                        key={s.id}
                        type="button"
                        $active={currentSessionId === s.id}
                        onClick={() => onSelectSession(s.id)}
                        onContextMenu={e => {
                          e.preventDefault();
                          handleRename(s.id, s.title);
                        }}
                        onAuxClick={e => {
                          if (e.button === 1) handleDeleteSession(s.id);
                        }}
                      >
                        <span className="title">{s.title}</span>
                      </ChatRow>
                    ))}
                  </FolderChildren>
                </div>
              );
            })}
          </Section>
        ) : null}

        {(() => {
          const grouped = groupSessionsByDate(withoutFolder);
          return grouped.map(group => (
            <Section key={group.label}>
              <SectionLabel>{group.label}</SectionLabel>
              {group.sessions.map(s => (
                <ChatRow
                  key={s.id}
                  type="button"
                  $active={currentSessionId === s.id}
                  onClick={() => onSelectSession(s.id)}
                  onContextMenu={e => {
                    e.preventDefault();
                    handleRename(s.id, s.title);
                  }}
                  onAuxClick={e => {
                    if (e.button === 1) handleDeleteSession(s.id);
                  }}
                >
                  <span className="title">{s.title}</span>
                </ChatRow>
              ))}
            </Section>
          ));
        })()}
      </Body>
      <Foot>
        <FootBtn
          type="button"
          onClick={() => void onNewFolder()}
          aria-label={t('Новая папка')}
        >
          <IconPlus />
          {t('Новая папка')}
        </FootBtn>
        {onToggleCollapsed ? (
          <FootBtn
            type="button"
            onClick={onToggleCollapsed}
            aria-label={t('Свернуть')}
            style={{ flex: '0 0 32px', padding: 6 }}
          >
            <IconChevronLeft />
          </FootBtn>
        ) : null}
      </Foot>
    </Root>
  );
};
