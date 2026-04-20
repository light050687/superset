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
import { AiSidePanel } from './AiSidePanel';
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
  /** Предзаполненный вопрос (например, из CentralPill или Command Palette Tab). */
  seedQuery?: string;
  /** ID AI-контекста из CentralPill (general / dashboard_<id> / chart_<id>). */
  contextId?: string;
  /** ID модели LLM из CentralPill (haiku-4.5 / sonnet-4.6 / opus-4.7). */
  modelId?: string;
}

/**
 * Scrim — полупрозрачный backdrop под Panel. Клик по scrim закрывает AI overlay
 * (так же как Esc). Это отличает AI overlay 2.0 от прежнего fullscreen —
 * дашборд под ним частично виден.
 */
const Scrim = styled.div`
  position: fixed;
  inset: 0;
  background: ${DS2_VARS.glassScrim};
  z-index: 99;
`;

/**
 * Panel — centered floating chat (820×640). Зажат между dock (bottom:92px над
 * доком) и верхом viewport (со смарт-fallback через max-height:70vh). Нулевые
 * поля от центра — через left:50% + translateX.
 */
/* Pixel-perfect parity .ai-full (analytics-floating-dock.html):
   width min(92vw, 820), height min(70vh, 640), bottom 92, radius 24,
   blur 36 saturate 180, bg1 88%, тяжёлая тень 40px 100px. */
const Panel = styled.div`
  position: fixed;
  left: 50%;
  bottom: ${DS2_VARS.dockAiBottom};
  transform: translateX(-50%);
  width: min(92vw, ${DS2_VARS.dockAiWidth});
  height: min(${DS2_VARS.dockAiHeight}, 70vh);
  max-height: 70vh;
  background: ${DS2_VARS.aiBg};
  backdrop-filter: ${DS2_VARS.aiFilter};
  -webkit-backdrop-filter: ${DS2_VARS.aiFilter};
  border: 1px solid ${DS2_VARS.aiBorder};
  border-radius: ${DS2_VARS.drawerRadius};
  /* Flat modern style — без drop-shadow. Глубину дают backdrop-blur и
     ring-border. Не падает тень на side panel. */
  box-shadow: ${DS2_VARS.aiShadow};
  overflow: hidden;
  z-index: 100;
  display: flex;
  font-family: ${DS2_VARS.fontSans};

  @media (max-width: 767px) {
    /* Mobile: fullscreen (вкрай viewport-а кроме MobileNav). */
    left: 0;
    right: 0;
    transform: none;
    width: 100%;
    bottom: ${DS2_VARS.dockMobileHeight};
    top: 0;
    height: auto;
    max-height: none;
    border-radius: 0;
  }
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

/* Кнопка-таб на левом крае overlay для открытия боковой панели истории.
   Визуально — часть окна чата (полупрозрачный hover, тот же tone). */
const SidePanelTab = styled.button`
  position: absolute;
  top: ${DS2_SPACE.s3}px;
  left: ${DS2_SPACE.s3}px;
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g600};
  width: 30px;
  height: 30px;
  border-radius: ${DS2_RADIUS.control}px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  transition:
    background 0.12s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.bg3};
    border-color: ${DS2_VARS.g300};
    color: ${DS2_VARS.ink};
  }

  &[aria-pressed='true'] {
    border-color: ${DS2_VARS.cSky};
    color: ${DS2_VARS.cSky};
    background: rgba(59, 139, 217, 0.1);
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

/* Мокап .ai-close: 30×30. */
const CloseBtn = styled.button`
  position: absolute;
  top: ${DS2_SPACE.s3}px;
  right: ${DS2_SPACE.s4}px;
  background: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g600};
  width: 30px;
  height: 30px;
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
  /* Top 56px — отступ под SidePanelTab + CloseBtn (30×30 + отступы),
     чтобы сообщения пользователя не заходили под эти кнопки.
     Bottom 72px — запас под CentralPill, которая парит над overlay. */
  padding: 56px 24px 72px;
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

/* InputBox/IconBtn/SendBtn удалены — нижний input-ряд убран в B12
   (ввод идёт через CentralPill в dock'е, которая парит над overlay-ем). */

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

/* Икона side-panel toggle — прямоугольник с вертикальной линией слева
   (sidebar symbol). */
const IconSidePanel: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <rect x="2" y="3" width="12" height="10" rx="1.5" />
    <path d="M6 3v10" />
  </svg>
);

const IconClose: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);

/* IconPaperclip/IconMic удалены вместе с нижним input-рядом. Ввод через
   CentralPill в dock'е, там свои иконки (IconPlus, IconMic, IconGear). */

/* Empty state welcome — без hardcoded подсказок. Реальные подсказки
   появятся когда backend отдаст их через `/api/v1/ai/suggestions/` (TODO). */
const DEFAULT_PROMPTS: string[] = [];

/* Быстрые чипсы после ответа ИИ — убраны; их должен отдавать бэкенд
   в поле `followups` AiAnswerBlocks для каждого конкретного ответа. */
const QUICK_CHIPS_AFTER_CHAT: string[] = [];

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

export const AiFullView: FC<React.PropsWithChildren<AiFullViewProps>> = ({
  open,
  onClose,
  user,
  seedQuery,
  contextId,
  modelId,
}) => {
  // Side panel — локальное состояние overlay'я, управляется кнопкой-табом
  // на левом крае Panel (не из dock). При выборе чата / новом чате —
  // не закрываем автоматически; только по кнопке или при закрытии overlay.
  // Состояние сохраняется между открытиями overlay — если юзер оставил
  // панель открытой, она будет открытой при следующем открытии overlay.
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const toggleSidePanel = useCallback(() => setSidePanelOpen(v => !v), []);
  const closeSidePanel = useCallback(() => setSidePanelOpen(false), []);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [folders, setFolders] = useState<AiChatFolder[]>([]);
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [tasks, setTasks] = useState<AiActiveTask[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
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
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /* seedQuery приходит из CentralPill после её submit. Автоматически
     отправляем запрос в AI (CentralPill сама очистила input у себя). */
  useEffect(() => {
    if (seedQuery && open) {
      void sendQuery(seedQuery);
    }
    // sendQuery зависит от currentSessionId/sending — но мы хотим запустить
    // seedQuery ОДИН раз при open+seedQuery. eslint-disable для простоты.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Отправляем в ai-analytics. Контекст и модель приходят из CentralPill
      // через пропсы — бэкенду отдаём как структурированные поля.
      try {
        const response = await analyzeQuestion({
          query: trimmed,
          session_id: sessionId != null ? String(sessionId) : undefined,
          context: contextId ? { context_id: contextId } : undefined,
          model: modelId,
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
    [currentSessionId, sending, refresh, contextId, modelId],
  );

  const handlePrompt = useCallback(
    (text: string) => {
      void sendQuery(text);
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
    <>
      <Scrim
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Side panel — пристройка СНАРУЖИ overlay, слева. position:fixed
          рендерится рядом с overlay'ем, с нахлёстом 2px на overlay для
          бесшовного стыка (тень обрезана clip-path на правой стороне). */}
      <AiSidePanel
        open={sidePanelOpen}
        onClose={closeSidePanel}
        folders={folders}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
      />
      <Panel role="dialog" aria-modal="true" aria-label={t('ИИ-аналитик')}>
      <SidePanelTab
        type="button"
        onClick={toggleSidePanel}
        aria-label={t('История чатов')}
        aria-pressed={sidePanelOpen}
        title={t('История чатов')}
      >
        <IconSidePanel />
      </SidePanelTab>
      <Main>
        <CloseBtn
          type="button"
          onClick={onClose}
          aria-label={t('Закрыть ИИ-аналитика')}
          title={t('Esc')}
        >
          <IconClose />
        </CloseBtn>
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
        {/*
         * Нижний input убран (мокап analytics-floating-dock.html): ввод
         * идёт через CentralPill в dock'е, которая парит над overlay-ем.
         * Quick-chips после чата остаются как быстрый способ продолжить диалог.
         */}
        {!empty ? (
          <InputZone>
            <InputInner>
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
            </InputInner>
          </InputZone>
        ) : null}
        </Main>
      </Panel>
    </>
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
