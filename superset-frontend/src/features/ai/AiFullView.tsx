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
 * AiFullView — полноэкранный ИИ-чат. Монтируется поверх main как overlay
 * когда пользователь открывает AI через rail. Закрывается клавишей Esc.
 */
import { styled, t } from '@superset-ui/core';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DS2_RADIUS, DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import type { BootstrapUser } from 'src/types/bootstrapTypes';
import {
  analyzeQuestion,
  createAiChatFolder,
  createAiChatMessage,
  createAiChatSession,
  deleteAiChatFolder,
  deleteAiChatSession,
  isAiBackendConfigured,
  listAiActiveTasks,
  listAiChatFolders,
  listAiChatMessages,
  listAiChatSessions,
  updateAiChatSession,
} from './api';
import { AiEmpty } from './AiEmpty';
import { AiMessage } from './AiMessage';
import { AiSidebar } from './AiSidebar';
import type {
  AiActiveTask,
  AiAnswerBlocks,
  AiChatFolder,
  AiChatSession,
} from './types';

interface AiFullViewProps {
  open: boolean;
  onClose: () => void;
  user?: BootstrapUser;
  /** Предзаполненный вопрос (например, из Command Palette Tab). */
  seedQuery?: string;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${DS2_VARS.bg};
  z-index: 70;
  display: flex;
  font-family: ${DS2_VARS.fontSans};
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: ${DS2_SPACE.s3}px;
  right: ${DS2_SPACE.s4}px;
  background: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g600};
  width: 32px;
  height: 32px;
  border-radius: ${DS2_RADIUS.control}px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;

  &:hover {
    border-color: ${DS2_VARS.g400};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${DS2_SPACE.s8}px ${DS2_SPACE.s6}px ${DS2_SPACE.s6}px;
  max-width: 780px;
  margin: 0 auto;
  width: 100%;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }
`;

const InputZone = styled.div`
  padding: ${DS2_SPACE.s4}px ${DS2_SPACE.s6}px ${DS2_SPACE.s6}px;
  background: ${DS2_VARS.bg};
  flex-shrink: 0;
  display: flex;
  justify-content: center;
`;

const InputInner = styled.div`
  max-width: 780px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${DS2_SPACE.s2}px;
`;

const QuickChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${DS2_SPACE.s1}px;
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${DS2_SPACE.s1}px;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s3}px;
  background: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.g100};
  border-radius: 14px;
  font-size: 11px;
  color: ${DS2_VARS.g600};
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};

  &:hover {
    border-color: ${DS2_VARS.g300};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }
`;

const InputBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  background: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 24px;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s1}px ${DS2_SPACE.s1}px
    ${DS2_SPACE.s4}px;
  transition: border-color 0.15s ${DS2_VARS.ease};

  &:focus-within {
    border-color: ${DS2_VARS.cSky};
    box-shadow: 0 0 0 3px rgba(59, 139, 217, 0.12);
  }

  input {
    flex: 1;
    background: transparent;
    border: none;
    color: ${DS2_VARS.ink};
    font-family: ${DS2_VARS.fontSans};
    font-size: 14px;
    outline: none;
    height: 38px;
  }

  input::placeholder {
    color: ${DS2_VARS.g400};
  }
`;

const SendBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${DS2_VARS.cSky};
  border: none;
  color: ${DS2_VARS.s};
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 700;

  &:hover {
    filter: brightness(1.1);
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.ink};
    outline-offset: 2px;
  }

  &:disabled {
    background: ${DS2_VARS.g300};
    cursor: not-allowed;
  }
`;

const MockBanner = styled.div`
  background: ${DS2_VARS.wnBg};
  border-bottom: 1px solid rgba(204, 182, 4, 0.25);
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s6}px;
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g700};
  text-align: center;

  strong {
    color: ${DS2_VARS.ink};
  }
`;

const IconClose: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);

const DEFAULT_PROMPTS = [
  'Какая маржа по мясу за март?',
  'Топ-10 магазинов по выручке за неделю',
  'Где растут потери в категории молочной продукции?',
  'Покажи на карте магазины с падением LFL',
];

const QUICK_CHIPS_AFTER_CHAT = [
  '📊 Сравнить периоды',
  '📈 Построить прогноз',
  '⬇ Экспорт в Excel',
];

interface ChatItem {
  role: 'user' | 'bot' | 'thinking';
  text?: string;
  blocks?: AiAnswerBlocks;
  /** id записи в БД, если сохранено. */
  messageId?: number;
}

function parseBotContent(json: string | null | undefined): AiAnswerBlocks {
  if (!json) return {};
  try {
    return JSON.parse(json) as AiAnswerBlocks;
  } catch {
    return { text: json };
  }
}

export const AiFullView: FC<AiFullViewProps> = ({
  open,
  onClose,
  user,
  seedQuery,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [folders, setFolders] = useState<AiChatFolder[]>([]);
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [tasks, setTasks] = useState<AiActiveTask[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const mockMode = !isAiBackendConfigured();

  // Первичная загрузка папок и сессий.
  const refresh = useCallback(async () => {
    try {
      const [f, s, tasksList] = await Promise.all([
        listAiChatFolders().catch(() => [] as AiChatFolder[]),
        listAiChatSessions().catch(() => [] as AiChatSession[]),
        listAiActiveTasks(),
      ]);
      setFolders(f);
      setSessions(s);
      setTasks(tasksList);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void refresh();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (seedQuery && open) {
      setQuery(seedQuery);
    }
  }, [seedQuery, open]);

  // Скролл к последнему сообщению.
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [items]);

  const handleSelectSession = useCallback(async (id: number) => {
    setCurrentSessionId(id);
    try {
      const msgs = await listAiChatMessages(id);
      setItems(
        msgs.map(m => ({
          role: m.role === 'system' ? 'bot' : (m.role as ChatItem['role']),
          text: m.role === 'user' ? safeText(m.content_json) : undefined,
          blocks: m.role === 'bot' ? parseBotContent(m.content_json) : undefined,
          messageId: m.id,
        })),
      );
    } catch {
      setItems([]);
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setCurrentSessionId(null);
    setItems([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleNewFolder = useCallback(async () => {
    const name = window.prompt(t('Название новой папки'));
    if (!name) return;
    await createAiChatFolder({ name: name.trim() });
    await refresh();
  }, [refresh]);

  const handleDeleteFolder = useCallback(
    async (id: number) => {
      await deleteAiChatFolder(id);
      await refresh();
    },
    [refresh],
  );

  const handleDeleteSession = useCallback(
    async (id: number) => {
      await deleteAiChatSession(id);
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setItems([]);
      }
      await refresh();
    },
    [currentSessionId, refresh],
  );

  const handleRenameSession = useCallback(
    async (id: number, title: string) => {
      await updateAiChatSession(id, { title });
      await refresh();
    },
    [refresh],
  );

  const sendQuery = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || sending) return;

      setSending(true);
      setQuery('');

      // Создаём сессию если её ещё нет.
      let sessionId = currentSessionId;
      if (sessionId == null) {
        try {
          const newSession = await createAiChatSession({
            title: trimmed.slice(0, 80),
            folder_id: null,
          });
          sessionId = newSession.id;
          setCurrentSessionId(sessionId);
          setSessions(prev => [newSession, ...prev]);
        } catch {
          // Если metadata DB недоступна — продолжаем без сохранения.
        }
      }

      // Добавляем user-сообщение в локальный список.
      setItems(prev => [
        ...prev,
        { role: 'user', text: trimmed },
        { role: 'thinking' },
      ]);

      // Сохраняем user-сообщение в metadata DB.
      if (sessionId != null) {
        try {
          await createAiChatMessage(sessionId, {
            role: 'user',
            content_json: JSON.stringify({ text: trimmed }),
          });
        } catch {
          // silent
        }
      }

      // Отправляем в ai-analytics.
      try {
        const response = await analyzeQuestion({
          query: trimmed,
          session_id: sessionId != null ? String(sessionId) : undefined,
        });

        setItems(prev => {
          const next = prev.slice(0, -1); // убираем thinking
          next.push({ role: 'bot', blocks: response.answer });
          return next;
        });

        // Сохраняем bot-ответ в metadata DB.
        if (sessionId != null) {
          try {
            await createAiChatMessage(sessionId, {
              role: 'bot',
              content_json: JSON.stringify(response.answer),
              meta_json: response.meta ? JSON.stringify(response.meta) : null,
            });
          } catch {
            // silent
          }
        }
      } catch (err) {
        setItems(prev => {
          const next = prev.slice(0, -1);
          next.push({
            role: 'bot',
            blocks: {
              text: `${t('Не удалось получить ответ от ИИ')}: ${
                err instanceof Error ? err.message : t('Неизвестная ошибка')
              }`,
            },
          });
          return next;
        });
      } finally {
        setSending(false);
        void refresh();
      }
    },
    [currentSessionId, sending, refresh],
  );

  const handlePrompt = useCallback(
    (text: string) => {
      setQuery(text);
      setTimeout(() => sendQuery(text), 0);
    },
    [sendQuery],
  );

  const handleFollowup = useCallback(
    (text: string) => sendQuery(text),
    [sendQuery],
  );

  const userFirstName = useMemo(
    () => user?.firstName ?? user?.username ?? undefined,
    [user],
  );

  if (!open) return null;

  const empty = items.length === 0;

  return (
    <Overlay role="dialog" aria-modal="true" aria-label={t('ИИ-аналитик')}>
      <AiSidebar
        folders={folders}
        sessions={sessions}
        activeTasks={tasks}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onNewFolder={handleNewFolder}
        onDeleteFolder={handleDeleteFolder}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(prev => !prev)}
      />
      <Main>
        <CloseBtn
          type="button"
          onClick={onClose}
          aria-label={t('Закрыть ИИ-аналитика')}
          title={t('Esc')}
        >
          <IconClose />
        </CloseBtn>
        {mockMode ? (
          <MockBanner>
            <strong>{t('Mock-режим:')}</strong>{' '}
            {t(
              'ai-analytics backend не подключён (VITE_AI_BACKEND_URL или AI_BACKEND_URL в config). Ответы — локальные заглушки.',
            )}
          </MockBanner>
        ) : null}
        <Body ref={bodyRef}>
          {empty ? (
            <AiEmpty
              userFirstName={userFirstName}
              prompts={DEFAULT_PROMPTS}
              onPrompt={handlePrompt}
            />
          ) : (
            items.map((msg, i) => (
              <AiMessage
                key={`${msg.role}-${i}`}
                role={msg.role}
                text={msg.text}
                blocks={msg.blocks}
                onFollowup={handleFollowup}
              />
            ))
          )}
        </Body>
        <InputZone>
          <InputInner>
            {!empty ? (
              <QuickChips>
                {QUICK_CHIPS_AFTER_CHAT.map(chip => (
                  <Chip
                    key={chip}
                    type="button"
                    onClick={() => handlePrompt(chip)}
                  >
                    {chip}
                  </Chip>
                ))}
              </QuickChips>
            ) : null}
            <InputBox>
              <input
                ref={inputRef}
                type="text"
                placeholder={t('Спросите что-нибудь о ваших данных…')}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !sending) {
                    e.preventDefault();
                    void sendQuery(query);
                  }
                }}
                aria-label={t('Вопрос ИИ-аналитику')}
              />
              <SendBtn
                type="button"
                onClick={() => void sendQuery(query)}
                disabled={sending || !query.trim()}
                aria-label={t('Отправить')}
              >
                ↑
              </SendBtn>
            </InputBox>
          </InputInner>
        </InputZone>
      </Main>
    </Overlay>
  );
};

function safeText(json: string | null | undefined): string {
  if (!json) return '';
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object' && 'text' in parsed) {
      return String(parsed.text);
    }
  } catch {
    // Not JSON — возвращаем как есть.
  }
  return String(json);
}
