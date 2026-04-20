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
 * AiSidePanel — slide-in панель внутри AI overlay (AiFullView).
 * Появляется когда пользователь нажимает «История чатов» в dock во время
 * активного чата. Содержит поиск, папки, список чатов текущей папки,
 * и кнопку «+ Новый чат». Slide из левого края, высота = высота overlay.
 */
import { styled, t } from '@superset-ui/core';
import { type FC, useEffect, useMemo, useState } from 'react';
import { DS2_VARS } from 'src/theme/ds2';
import {
  createAiChatFolder,
  deleteAiChatFolder,
  deleteAiChatSession,
  updateAiChatFolder,
  updateAiChatSession,
} from './api';
import type { AiChatFolder, AiChatSession } from './types';

interface AiSidePanelProps {
  open: boolean;
  onClose: () => void;
  folders: AiChatFolder[];
  sessions: AiChatSession[];
  currentSessionId?: number | null;
  onSelectSession: (sessionId: number) => void;
  onNewChat: () => void;
  /** Перезагрузить папки/сессии после мутации — вызывается родителем. */
  onChanged?: () => Promise<void> | void;
}

/* Выдвижная панель ЗА overlay'ем: немного выступает слева из-под него.
   Скруглены все углы, тон чуть темнее overlay'я, z-index ниже чем Panel
   (overlay перекрывает правую часть панели). Когда закрыта — уезжает
   влево за край экрана и гасится opacity. */
/* Боковая панель — ВНУТРИ AI overlay, абсолютно спозиционирована у
   левого края. Overlay имеет `overflow: hidden` и rounded-углы со всех
   сторон, поэтому правая/верхняя/нижняя часть панели обрезается самим
   overlay'ем — получается бесшовная пристройка внутри единого окна.
   Slide-анимация: справа-налево (transform). */
/* Боковая панель-ПРИСТРОЙКА снаружи AI overlay — примыкает к его
   левому краю. Warm-neutral tone с radial-light сверху, все 4
   скругления, тонкий нахлёст 2px на overlay для бесшовного стыка.
   Slide-анимация: справа-налево (из-под overlay выезжает влево). */
const Shell = styled.aside<{ $open: boolean }>`
  position: fixed;
  bottom: ${DS2_VARS.dockAiBottom};
  /* Правый край панели заходит на 30px под overlay — больше чем его
     border-radius (20px), чтобы rounded левые углы overlay'я полностью
     перекрывали правый край панели. Зазор исключён. */
  right: calc(50% + min(46vw, 410px) - 30px);
  width: 300px;
  height: min(${DS2_VARS.dockAiHeight}, 70vh);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  /* Фон из DS 2.0 токенов: --ai-side-bg (темная/светлая темы), поверх
     radial-градиент из --ai-side-glow для тёплого свечения сверху. */
  background: ${DS2_VARS.aiSideBg};
  border: 1px solid ${DS2_VARS.aiSideBorder};
  border-right: none;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  box-shadow: inset 0 1px 0 ${DS2_VARS.aiSideHairline};
  /* Slide справа-налево: closed — за overlay'ем (невидима),
     open — в позиции у левого края overlay. */
  transform: translateX(
    ${({ $open }) => ($open ? '0' : 'calc(100% + 20px)')}
  );
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition:
    transform 0.28s ${DS2_VARS.ease},
    opacity 0.2s ${DS2_VARS.ease};
  z-index: 99;
  font-family: ${DS2_VARS.fontSans};

  @media (max-width: 900px) {
    display: none;
  }
`;

const TopRow = styled.div`
  /* Padding-left 14 совпадает с margin-left у NewChatBtn — Search и
     кнопка «Новый чат» имеют одинаковую визуальную ширину и выравнены. */
  padding: 12px 54px 10px 14px;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  border-bottom: 1px solid ${DS2_VARS.aiSideDivider};
`;

const SearchInput = styled.input`
  flex: 1;
  height: 30px;
  padding: 0 10px;
  background: ${DS2_VARS.bg3};
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 7px;
  color: ${DS2_VARS.ink};
  font-family: ${DS2_VARS.fontSans};
  font-size: 12.5px;
  outline: none;

  &::placeholder {
    color: ${DS2_VARS.g500};
  }

  &:focus {
    border-color: ${DS2_VARS.cSky};
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

/* Primary-кнопка DS 2.0: ink-фон + surface-текст. Контрастно и одинаково
   выразительно в обеих темах (раньше использовался cSky, у которого hex
   разный в light/dark → кнопка выглядела по-разному). */
const NewChatBtn = styled.button`
  margin: 10px 54px 0 14px;
  padding: 8px 12px;
  background: ${DS2_VARS.ink};
  color: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.ink};
  border-radius: 7px;
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  transition:
    opacity 0.12s ${DS2_VARS.ease},
    background 0.12s ${DS2_VARS.ease};

  &:hover {
    opacity: 0.88;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  /* Правый padding 54px = 30px overlap + 24px visible — чтобы counter'ы
     справа от items были на комфортном отступе от левого края overlay. */
  padding: 10px 54px 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g200};
    border-radius: 2px;
  }
`;

const SectionLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 2px;
`;

const SectionLabel = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: 9.5px;
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  flex: 1;
`;

const SectionAddBtn = styled.button`
  background: none;
  border: 1px solid ${DS2_VARS.g200};
  color: ${DS2_VARS.g500};
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition:
    border-color 0.1s ${DS2_VARS.ease},
    color 0.1s ${DS2_VARS.ease},
    background 0.1s ${DS2_VARS.ease};

  &:hover {
    border-color: ${DS2_VARS.cSky};
    color: ${DS2_VARS.cSky};
    background: rgba(59, 139, 217, 0.12);
  }

  svg {
    width: 8px;
    height: 8px;
  }
`;

const FolderRow = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  width: 100%;
  border-radius: 6px;
  background: ${({ $selected }) =>
    $selected ? 'rgba(59, 139, 217, 0.14)' : 'transparent'};
  color: ${({ $selected }) => ($selected ? DS2_VARS.cSky : DS2_VARS.ink)};
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  cursor: pointer;
  transition: background 0.1s ${DS2_VARS.ease};
  position: relative;

  &:hover {
    background: ${({ $selected }) =>
      $selected ? 'rgba(59, 139, 217, 0.18)' : DS2_VARS.g100};
  }
`;

const RowActions = styled.span`
  display: none;
  gap: 2px;
  margin-left: 4px;

  ${FolderRow}:hover & {
    display: inline-flex;
  }
`;

const RowActBtn = styled.button`
  background: none;
  border: none;
  color: ${DS2_VARS.g500};
  width: 18px;
  height: 18px;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    background: ${DS2_VARS.g200};
    color: ${DS2_VARS.ink};
  }

  svg {
    width: 10px;
    height: 10px;
  }
`;

const FolderDot = styled.span<{ $color: string; $dashed?: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $color, $dashed }) => ($dashed ? 'transparent' : $color)};
  ${({ $dashed }) =>
    $dashed
      ? `border: 1px dashed ${DS2_VARS.g400};`
      : ''}
  flex-shrink: 0;
`;

const FolderName = styled.span<{ $italic?: boolean }>`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${({ $italic }) =>
    $italic
      ? `color: ${DS2_VARS.g500}; font-style: italic;`
      : ''}
`;

const FolderCount = styled.span`
  font-size: 10px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  flex-shrink: 0;
`;

const ChatRow = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  width: 100%;
  border-radius: 6px;
  background: ${({ $active }) =>
    $active ? 'rgba(59, 139, 217, 0.14)' : 'transparent'};
  border: none;
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.ink)};
  font-family: ${DS2_VARS.fontSans};
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s ${DS2_VARS.ease};

  &:hover {
    background: ${({ $active }) =>
      $active ? 'rgba(59, 139, 217, 0.18)' : DS2_VARS.bg3};
  }

  svg {
    width: 12px;
    height: 12px;
    color: ${DS2_VARS.g500};
    flex-shrink: 0;
  }
`;

const ChatTitle = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Empty = styled.div`
  padding: 16px 12px;
  color: ${DS2_VARS.g500};
  font-size: 11px;
  text-align: center;
`;

/* ─── icons ─── */

const IconClose: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M3 3l6 6M9 3l-6 6" />
  </svg>
);

const IconPlus: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M6 2v8M2 6h8" />
  </svg>
);

const IconChatBubble: FC<React.PropsWithChildren<unknown>> = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 2v-2H4a2 2 0 01-2-2V4z" />
  </svg>
);

/* Палитра для dot'ов папок. */
const FOLDER_PALETTE = [
  '#3B8BD9',
  '#16A34A',
  '#8B5CF6',
  '#E87C3E',
  '#DC2626',
  '#E870C0',
  '#CA8A04',
  '#CCB604',
];

export const AiSidePanel: FC<React.PropsWithChildren<AiSidePanelProps>> = ({
  open,
  onClose,
  folders,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
}) => {
  const [query, setQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  // Сброс поиска при закрытии панели.
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const roots = useMemo(
    () => folders.filter(f => f.parent_id === null),
    [folders],
  );

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions
      .filter(s => {
        if (selectedFolderId !== null && s.folder_id !== selectedFolderId)
          return false;
        if (q && !(s.title || '').toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const ta = a.changed_on ?? a.created_on ?? '';
        const tb = b.changed_on ?? b.created_on ?? '';
        return tb.localeCompare(ta);
      });
  }, [sessions, selectedFolderId, query]);

  const noFolderCount = useMemo(
    () => sessions.filter(s => s.folder_id == null).length,
    [sessions],
  );

  return (
    <Shell $open={open} aria-hidden={!open}>
      <TopRow>
        <SearchInput
          type="search"
          placeholder={t('Поиск по чатам…')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label={t('Поиск по чатам')}
        />
      </TopRow>

      <NewChatBtn type="button" onClick={onNewChat}>
        <IconPlus />
        {t('Новый чат')}
      </NewChatBtn>

      <Body>
        {/* Папки */}
        <div>
          <SectionLabel>{t('Папки')}</SectionLabel>
          <FolderRow
            type="button"
            $selected={selectedFolderId === null}
            onClick={() => setSelectedFolderId(null)}
          >
            <FolderDot $color={DS2_VARS.g400} />
            <FolderName>{t('Все чаты')}</FolderName>
            <FolderCount>{sessions.length}</FolderCount>
          </FolderRow>
          {roots.length === 0 && noFolderCount === 0 ? null : (
            <>
              {roots.map((f, idx) => {
                const count = sessions.filter(
                  s => s.folder_id === f.id,
                ).length;
                return (
                  <FolderRow
                    key={f.id}
                    type="button"
                    $selected={selectedFolderId === f.id}
                    onClick={() => setSelectedFolderId(f.id)}
                  >
                    <FolderDot
                      $color={FOLDER_PALETTE[idx % FOLDER_PALETTE.length]}
                    />
                    <FolderName>{f.name}</FolderName>
                    <FolderCount>{count}</FolderCount>
                  </FolderRow>
                );
              })}
              {noFolderCount > 0 ? (
                <FolderRow type="button">
                  <FolderDot $color="transparent" $dashed />
                  <FolderName $italic>{t('Без папки')}</FolderName>
                  <FolderCount>{noFolderCount}</FolderCount>
                </FolderRow>
              ) : null}
            </>
          )}
        </div>

        {/* Чаты */}
        <div>
          <SectionLabel>
            {selectedFolderId === null ? t('Все чаты') : t('Чаты папки')}
          </SectionLabel>
          {filteredSessions.length === 0 ? (
            <Empty>
              {query ? t('Ничего не найдено') : t('Чатов пока нет')}
            </Empty>
          ) : (
            filteredSessions.map(s => (
              <ChatRow
                key={s.id}
                type="button"
                $active={currentSessionId === s.id}
                onClick={() => onSelectSession(s.id)}
              >
                <IconChatBubble />
                <ChatTitle>{s.title || t('Без названия')}</ChatTitle>
              </ChatRow>
            ))
          )}
        </div>
      </Body>
    </Shell>
  );
};
