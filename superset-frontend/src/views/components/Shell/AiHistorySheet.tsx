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
 * AiHistorySheet — bottom sheet истории чатов ИИ-аналитика. Открывается
 * кликом по кнопке «История чатов» в dock'е. Точно по мокапу
 * analytics-floating-dock.html `.ai-side`:
 *   - position fixed, left 50%, bottom 92px
 *   - width min(96vw, 1200px), max-height min(640px, 80vh)
 *   - Glass (blur + saturate)
 *   - ais-handle · ais-head · ais-body (4-col grid) · ais-foot
 *
 * Содержимое — группы чатов по датам (Сегодня / Вчера / На неделе / Старше).
 * Данные: listAiChatSessions() из features/ai/api.ts. Пока что выводим
 * упрощённый placeholder когда сессии пустые (API возвращает []).
 */
import { styled, t } from '@superset-ui/core';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import { listAiChatSessions } from 'src/features/ai';
import type { AiChatSession } from 'src/features/ai';

interface AiHistorySheetProps {
  open: boolean;
  onClose: () => void;
  onSelectSession?: (sessionId: number) => void;
  onNewChat?: () => void;
}

const Sheet = styled.aside<{ $open: boolean }>`
  position: fixed;
  left: 50%;
  bottom: ${DS2_VARS.dockAiBottom};
  transform: translateX(-50%)
    translateY(${({ $open }) => ($open ? '0' : '20px')});
  width: min(96vw, 1200px);
  max-height: ${({ $open }) => ($open ? 'min(640px, 80vh)' : '0')};
  height: ${({ $open }) => ($open ? 'min(640px, 80vh)' : '0')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  overflow: hidden;
  background: ${DS2_VARS.glassBg};
  backdrop-filter: ${DS2_VARS.glassFilter};
  -webkit-backdrop-filter: ${DS2_VARS.glassFilter};
  border: 1px solid ${DS2_VARS.glassBorder};
  border-radius: ${DS2_VARS.rGlass};
  box-shadow: ${DS2_VARS.glassShadowElev};
  display: flex;
  flex-direction: column;
  z-index: 97;
  transition:
    max-height 0.22s ${DS2_VARS.ease},
    height 0.22s ${DS2_VARS.ease},
    opacity 0.18s ${DS2_VARS.ease},
    transform 0.22s ${DS2_VARS.ease};
  font-family: ${DS2_VARS.fontSans};

  @media print {
    display: none;
  }

  @media (max-width: 767px) {
    left: ${DS2_SPACE.s1}px;
    right: ${DS2_SPACE.s1}px;
    transform: none;
    width: auto;
    bottom: ${DS2_VARS.dockMobileHeight};
    max-height: ${({ $open }) => ($open ? '90vh' : '0')};
    height: ${({ $open }) => ($open ? '90vh' : '0')};
  }
`;

const Handle = styled.div`
  width: 36px;
  height: 4px;
  margin: 10px auto 0;
  border-radius: 2px;
  background: ${DS2_VARS.g300};
  opacity: 0.5;
  flex-shrink: 0;
`;

const Head = styled.div`
  padding: 4px 22px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  border-bottom: 1px solid ${DS2_VARS.g100};
`;

const HeadTitle = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const HeadActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const HeadBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: none;
  border: 1px solid ${DS2_VARS.g200};
  border-radius: ${DS2_VARS.rControl};
  color: ${DS2_VARS.g500};
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};
  font-size: 11px;
  transition: all 0.12s ${DS2_VARS.ease};

  &:hover {
    border-color: ${DS2_VARS.cSky};
    color: ${DS2_VARS.cSky};
    background: ${DS2_VARS.upBg};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${DS2_VARS.g500};
  cursor: pointer;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 14px 22px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0 20px;
  align-content: start;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    gap: 12px 0;
  }
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  & + & {
    border-left: 1px solid ${DS2_VARS.g100};
    padding-left: 20px;

    @media (max-width: 767px) {
      border-left: none;
      padding-left: 0;
      padding-top: 12px;
      border-top: 1px solid ${DS2_VARS.g100};
    }
  }
`;

const ColLabel = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 9.5px;
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 0 8px;
`;

const ChatRow = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: none;
  border: none;
  border-radius: ${DS2_VARS.rControl};
  color: ${DS2_VARS.g700};
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition:
    background 0.1s ${DS2_VARS.ease},
    color 0.1s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: -2px;
  }
`;

const ChatTitle = styled.span`
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  padding: ${DS2_SPACE.s8}px;
  text-align: center;
  color: ${DS2_VARS.g500};
  font-family: ${DS2_VARS.fontSans};
  font-size: 13px;
  line-height: 1.5;
`;

/* Icons */

const IconPlus: FC = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path d="M6 2v8M2 6h8" />
  </svg>
);

const IconFolder: FC = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4}>
    <path d="M1 2.5h3l1.5 1.5H11v6H1V2.5z" />
  </svg>
);

const IconClose: FC = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M3 3l6 6M9 3l-6 6" />
  </svg>
);

/* Helpers */

function groupSessions(sessions: AiChatSession[]): Record<
  'today' | 'yesterday' | 'week' | 'older',
  AiChatSession[]
> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;
  const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
  const groups: Record<
    'today' | 'yesterday' | 'week' | 'older',
    AiChatSession[]
  > = { today: [], yesterday: [], week: [], older: [] };
  for (const s of sessions) {
    const changed = s.changed_on
      ? new Date(s.changed_on).getTime()
      : s.created_on
      ? new Date(s.created_on).getTime()
      : 0;
    if (changed >= today) groups.today.push(s);
    else if (changed >= yesterday) groups.yesterday.push(s);
    else if (changed >= weekAgo) groups.week.push(s);
    else groups.older.push(s);
  }
  return groups;
}

export const AiHistorySheet: FC<AiHistorySheetProps> = ({
  open,
  onClose,
  onSelectSession,
  onNewChat,
}) => {
  const [sessions, setSessions] = useState<AiChatSession[]>([]);

  // Загружаем историю чатов при открытии sheet.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listAiChatSessions()
      .then(list => {
        if (!cancelled) setSessions(list);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Esc закрывает.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const groups = useMemo(() => groupSessions(sessions), [sessions]);
  const isEmpty = sessions.length === 0;

  const handleSelect = useCallback(
    (id: number) => {
      onSelectSession?.(id);
      onClose();
    },
    [onSelectSession, onClose],
  );

  return (
    <Sheet
      $open={open}
      role="dialog"
      aria-modal="false"
      aria-hidden={!open}
      aria-label={t('История чатов ИИ')}
    >
      <Handle role="presentation" />
      <Head>
        <HeadTitle>{t('История чатов')}</HeadTitle>
        <HeadActions>
          <HeadBtn
            type="button"
            onClick={() => {
              onNewChat?.();
              onClose();
            }}
            title={t('Новый чат')}
          >
            <IconPlus />
            {t('Новый чат')}
          </HeadBtn>
          <HeadBtn type="button" title={t('Новая папка')}>
            <IconFolder />
            {t('Папка')}
          </HeadBtn>
          <CloseBtn
            type="button"
            onClick={onClose}
            aria-label={t('Закрыть')}
            title={t('Закрыть (Esc)')}
          >
            <IconClose />
          </CloseBtn>
        </HeadActions>
      </Head>
      <Body>
        {isEmpty ? (
          <EmptyState>
            {t(
              'Ваших чатов пока нет. Начните новый через центральную капсулу dock’a или кнопку «Новый чат».',
            )}
          </EmptyState>
        ) : (
          <>
            <Col>
              <ColLabel>{t('Сегодня')}</ColLabel>
              {groups.today.map(s => (
                <ChatRow
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(s.id)}
                >
                  <ChatTitle>{s.title || t('Без названия')}</ChatTitle>
                </ChatRow>
              ))}
            </Col>
            <Col>
              <ColLabel>{t('Вчера')}</ColLabel>
              {groups.yesterday.map(s => (
                <ChatRow
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(s.id)}
                >
                  <ChatTitle>{s.title || t('Без названия')}</ChatTitle>
                </ChatRow>
              ))}
            </Col>
            <Col>
              <ColLabel>{t('На этой неделе')}</ColLabel>
              {groups.week.map(s => (
                <ChatRow
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(s.id)}
                >
                  <ChatTitle>{s.title || t('Без названия')}</ChatTitle>
                </ChatRow>
              ))}
            </Col>
            <Col>
              <ColLabel>{t('Старше')}</ColLabel>
              {groups.older.map(s => (
                <ChatRow
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(s.id)}
                >
                  <ChatTitle>{s.title || t('Без названия')}</ChatTitle>
                </ChatRow>
              ))}
            </Col>
          </>
        )}
      </Body>
    </Sheet>
  );
};
