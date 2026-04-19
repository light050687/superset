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
 * AiHistorySheet — bottom sheet истории чатов ИИ. Pixel-perfect parity с
 * мокапом `.ai-side` (analytics-floating-dock.html). 4 колонки:
 *
 *   1. В РАБОТЕ       — активные задачи AI (mock, позже из API)
 *   2. ПАПКИ          — папки чатов (drill-in: корневые → подпапки → чаты)
 *   3. ИИ АНАЛИТИКА   — сгенерированные инсайты (ежедневная сводка,
 *                       аномалии, еженедельный отчёт)
 *   4. НЕДАВНИЕ       — последние чаты с временем
 *
 * Header: [title] · + Новый чат · ×
 * Footer: «Управление историей чатов» (активирует режим управления — TODO).
 */
import { css, keyframes, styled, t } from '@superset-ui/core';
import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import {
  deleteAiChatFolder,
  listAiActiveTasks,
  listAiChatFolders,
  listAiChatSessions,
} from 'src/features/ai/api';
import type {
  AiActiveTask,
  AiChatFolder,
  AiChatSession,
} from 'src/features/ai';
import { AiHistoryManageView } from './AiHistoryManageView';

interface AiHistorySheetProps {
  open: boolean;
  onClose: () => void;
  onSelectSession?: (sessionId: number) => void;
  onNewChat?: () => void;
}

/* ─── Sheet shell ─── */

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
  background: ${DS2_VARS.drawerBg};
  backdrop-filter: ${DS2_VARS.drawerFilter};
  -webkit-backdrop-filter: ${DS2_VARS.drawerFilter};
  border: 1px solid ${DS2_VARS.drawerBorder};
  border-radius: ${DS2_VARS.drawerRadius};
  box-shadow: ${DS2_VARS.drawerShadow};
  display: flex;
  flex-direction: column;
  z-index: 97;
  transition:
    max-height 0.28s ${DS2_VARS.ease},
    transform 0.28s ${DS2_VARS.ease},
    opacity 0.2s ${DS2_VARS.ease};
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

/* ─── Header: title + actions ─── */

const Head = styled.div`
  padding: 8px 22px 10px;
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
  font-weight: 600;
`;

const HeadActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

/* Primary action button (+ Новый чат) — ink+surface DS 2.0.
   Раньше sky-cSky, но у него разные hex в темах → кнопка смотрелась
   неоднородно; ink+surface одинаково выразительна в обеих темах. */
const HeadPrimaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${DS2_VARS.ink};
  border: 1px solid ${DS2_VARS.ink};
  border-radius: 7px;
  color: ${DS2_VARS.s};
  cursor: pointer;
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  font-weight: 600;
  transition: opacity 0.12s ${DS2_VARS.ease};

  &:hover {
    opacity: 0.88;
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
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

/* ─── Body: 4-col grid ─── */

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

/* Отдельный класс для «ИИ аналитика» — увеличенный gap между карточками. */
const InsightsCol = styled(Col)`
  gap: 6px;
`;

const ColHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 9.5px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 4px 10px;
  margin-bottom: 2px;
`;

const ColHeadCount = styled.span`
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g400};
`;

const Empty = styled.div`
  padding: 20px 12px;
  color: ${DS2_VARS.g500};
  font-size: 11px;
  text-align: center;
  font-family: ${DS2_VARS.fontSans};
`;

/* ─── Col 1: Активные задачи ─── */

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

/* Мокап .ais-active-row: янтарная полупрозрачная плашка с вращающимся
   spinner'ом (warning цвет) и прогрессом справа. */
const ActiveRow = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 7px;
  background: rgba(251, 191, 36, 0.05);
  border: 1px solid rgba(251, 191, 36, 0.15);
  margin-bottom: 4px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.12s ${DS2_VARS.ease};

  &:hover {
    background: rgba(251, 191, 36, 0.1);
  }
`;

const Spinner = styled.div`
  width: 10px;
  height: 10px;
  border: 1.5px solid ${DS2_VARS.g300};
  border-top-color: ${DS2_VARS.wn};
  border-radius: 50%;
  flex-shrink: 0;
  animation: ${spin} 1s linear infinite;
`;

const ActiveText = styled.div`
  flex: 1;
  font-size: 11px;
  color: ${DS2_VARS.ink};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActiveTime = styled.div`
  font-size: 9px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
`;

/* ─── Col 2: Папки (folder rows) ─── */

const FolderRow = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 7px;
  background: transparent;
  border: none;
  color: ${DS2_VARS.ink};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.1s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.bg3};
  }
`;

const FolderDot = styled.span<{ $color: string; $dashed?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $color, $dashed }) => ($dashed ? 'transparent' : $color)};
  ${({ $dashed }) =>
    $dashed
      ? css`
          border: 1px dashed ${DS2_VARS.g400};
        `
      : ''}
`;

const FolderName = styled.span<{ $italic?: boolean }>`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${({ $italic }) =>
    $italic
      ? css`
          color: ${DS2_VARS.g500};
          font-style: italic;
        `
      : ''}
`;

const FolderCount = styled.span`
  font-size: 11px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  flex-shrink: 0;
`;

/* ─── Col 3: ИИ аналитика (insight cards) ─── */

/* Мокап .ais-insight: карточка с цветным левым бордером, header (icon+badge
   +time), title, preview (2-line clamp). */
const Insight = styled.button<{ $sev: 'high' | 'med' | 'info' }>`
  position: relative;
  padding: 10px 12px;
  border-radius: 10px;
  background: ${DS2_VARS.bg3};
  border: 1px solid ${DS2_VARS.g100};
  color: ${DS2_VARS.ink};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow: hidden;
  text-align: left;
  width: 100%;
  transition:
    background 0.12s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease},
    transform 0.12s ${DS2_VARS.ease};

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    border-radius: 3px 0 0 3px;
    background: ${({ $sev }) =>
      $sev === 'high'
        ? DS2_VARS.cTangerine
        : $sev === 'med'
        ? DS2_VARS.cAmber
        : DS2_VARS.cSky};
  }

  &:hover {
    background: ${DS2_VARS.glassBgElev};
    border-color: ${DS2_VARS.g200};
    transform: translateX(1px);
  }
`;

const InsHead = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InsIcon = styled.span<{ $kind: 'daily' | 'weekly' | 'anomaly' }>`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $kind }) =>
    $kind === 'daily'
      ? `color-mix(in oklab, ${DS2_VARS.cSky} 15%, transparent)`
      : $kind === 'weekly'
      ? `color-mix(in oklab, ${DS2_VARS.cViolet} 15%, transparent)`
      : `color-mix(in oklab, ${DS2_VARS.cTangerine} 15%, transparent)`};
  color: ${({ $kind }) =>
    $kind === 'daily'
      ? DS2_VARS.cSky
      : $kind === 'weekly'
      ? DS2_VARS.cViolet
      : DS2_VARS.cTangerine};

  svg {
    width: 10px;
    height: 10px;
  }
`;

const InsBadge = styled.span`
  flex: 1;
  font-size: 9px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const InsTime = styled.span`
  font-size: 9px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g400};
`;

const InsTitle = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${DS2_VARS.ink};
  line-height: 1.3;
  letter-spacing: -0.005em;
`;

const InsPreview = styled.div`
  font-size: 10.5px;
  color: ${DS2_VARS.g500};
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

/* ─── Col 4: Недавние чаты ─── */

const ChatRow = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: none;
  border: none;
  border-radius: 7px;
  color: ${DS2_VARS.ink};
  font-size: 12.5px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.1s ${DS2_VARS.ease};

  &:hover {
    background: ${DS2_VARS.bg3};
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatTime = styled.span`
  font-size: 10px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  flex-shrink: 0;
`;

/* ─── Footer ─── */

const Foot = styled.div`
  padding: 10px 22px 14px;
  border-top: 1px solid ${DS2_VARS.g100};
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  align-items: center;
`;

const FootBtn = styled.button`
  background: none;
  border: 1px solid ${DS2_VARS.g200};
  padding: 6px 11px;
  border-radius: 6px;
  cursor: pointer;
  color: ${DS2_VARS.g500};
  font-size: 11px;
  font-family: ${DS2_VARS.fontSans};
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition:
    border-color 0.1s ${DS2_VARS.ease},
    color 0.1s ${DS2_VARS.ease};

  &:hover {
    border-color: ${DS2_VARS.g300};
    color: ${DS2_VARS.ink};
  }

  svg {
    width: 11px;
    height: 11px;
  }
`;

const FootHint = styled.span`
  flex: 1;
  font-size: 10px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  text-align: center;

  kbd {
    background: ${DS2_VARS.bg3};
    border: 1px solid ${DS2_VARS.g200};
    border-radius: 3px;
    padding: 1px 5px;
    font-family: ${DS2_VARS.fontMono};
    font-size: 9px;
    color: ${DS2_VARS.g600};
    margin: 0 2px;
  }
`;

/* Tab view wrapper для overview/manage режимов */
const TabView = styled.div<{ $active: boolean }>`
  flex: 1;
  min-height: 0;
  display: ${({ $active }) => ($active ? 'flex' : 'none')};
  flex-direction: column;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transition: opacity 0.18s ${DS2_VARS.ease};
`;

/* ─── SVG icons ─── */

const IconPlus: FC = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M6 2v8M2 6h8" />
  </svg>
);

const IconClose: FC = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M3 3l6 6M9 3l-6 6" />
  </svg>
);

const IconDaily: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" />
  </svg>
);

const IconWeekly: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6h12M6 1v3M10 1v3" />
  </svg>
);

const IconAnomaly: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path d="M8 1.5L1.5 14h13z" />
    <path d="M8 6.5v3.5M8 11.5v.7" strokeLinecap="round" />
  </svg>
);

const IconChatBubble: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 2v-2H4a2 2 0 01-2-2V4z" />
  </svg>
);

const IconGear: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3" />
  </svg>
);

const IconBack: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path d="M6 3L2 7l4 4M2 7h10a2 2 0 012 2v3" />
  </svg>
);

const IconReset: FC = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M13 8a5 5 0 11-1.5-3.5M13 3v2h-2" />
  </svg>
);

/* ─── Data types ─── */

interface ActiveJob {
  id: string;
  title: string;
  progress: string;
}

interface FolderStub {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface Insight {
  id: string;
  kind: 'daily' | 'weekly' | 'anomaly';
  title: string;
  preview: string;
  badge: string;
  time: string;
  severity: 'high' | 'med' | 'info';
}

/** Палитра для цветных dot'ов папок (детерминистично по индексу). */
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

/* Insight icon by kind */
function insightIcon(kind: 'daily' | 'weekly' | 'anomaly'): ReactNode {
  if (kind === 'daily') return <IconDaily />;
  if (kind === 'weekly') return <IconWeekly />;
  return <IconAnomaly />;
}

/** Короткая метка времени для недавних чатов. */
function formatRelative(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '';
  const now = Date.now();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('сейчас');
  if (mins < 60) return t('%s мин', String(mins));
  const h = Math.floor(mins / 60);
  if (h < 24) {
    const date = new Date(d);
    return `${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes(),
    ).padStart(2, '0')}`;
  }
  const days = Math.floor(h / 24);
  if (days === 1) return t('вчера');
  if (days < 7) return t('%s д', String(days));
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}.${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`;
}

export const AiHistorySheet: FC<AiHistorySheetProps> = ({
  open,
  onClose,
  onSelectSession,
  onNewChat,
}) => {
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [folders, setFolders] = useState<AiChatFolder[]>([]);
  const [activeTasks, setActiveTasks] = useState<AiActiveTask[]>([]);
  const [tab, setTab] = useState<'overview' | 'manage'>('overview');

  const refreshAll = useCallback(async () => {
    try {
      const [s, f, a] = await Promise.allSettled([
        listAiChatSessions(),
        listAiChatFolders(),
        listAiActiveTasks(),
      ]);
      setSessions(s.status === 'fulfilled' ? s.value : []);
      setFolders(f.status === 'fulfilled' ? f.value : []);
      setActiveTasks(a.status === 'fulfilled' ? a.value : []);
    } catch {
      /* ignore — каждая колонка упадёт в «Пусто» */
    }
  }, []);

  // Подгружаем реальные данные из API. Пока backend не реализован — API
  // вернёт пустой массив / 404, и каждая колонка покажет «Пусто».
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    refreshAll().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [open, refreshAll]);

  const resetAllFolders = useCallback(async () => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(
      t('Удалить все папки? Чаты останутся без папки.'),
    );
    if (!ok) return;
    const rootIds = folders
      .filter(f => f.parent_id === null)
      .map(f => f.id);
    for (const id of rootIds) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await deleteAiChatFolder(id);
      } catch {
        /* continue */
      }
    }
    await refreshAll();
  }, [folders, refreshAll]);

  // Инсайты пока захардкожены пустым массивом. Когда появится
  // /api/v1/ai/insights/ — поменяем на fetch.
  const insights: Insight[] = [];

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Последние 8 недавних — для колонки 4.
  const recents = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => {
          const ta = a.changed_on ?? a.created_on ?? '';
          const tb = b.changed_on ?? b.created_on ?? '';
          return tb.localeCompare(ta);
        })
        .slice(0, 8),
    [sessions],
  );

  // Корневые папки + счётчики чатов без папки. Цвет папки генерируется
  // из id (детерминистично) — backend пока не хранит цвет.
  const rootFolders = useMemo<FolderStub[]>(
    () =>
      folders
        .filter(f => f.parent_id === null)
        .map((f, idx) => ({
          id: String(f.id),
          name: f.name,
          color: FOLDER_PALETTE[idx % FOLDER_PALETTE.length],
          count: sessions.filter(s => s.folder_id === f.id).length,
        })),
    [folders, sessions],
  );
  const noFolderCount = useMemo(
    () => sessions.filter(s => s.folder_id == null).length,
    [sessions],
  );

  const activeJobs = useMemo<ActiveJob[]>(
    () =>
      activeTasks.map(task => ({
        id: String(task.id),
        title: task.title || t('Задача %s', String(task.id)),
        progress:
          typeof task.progress_percent === 'number'
            ? `${Math.round(task.progress_percent)}%`
            : '',
      })),
    [activeTasks],
  );

  const handleSelect = useCallback(
    (id: number) => {
      onSelectSession?.(id);
      onClose();
    },
    [onSelectSession, onClose],
  );

  const handleNewChat = useCallback(() => {
    onNewChat?.();
    onClose();
  }, [onNewChat, onClose]);

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
          <HeadPrimaryBtn
            type="button"
            onClick={handleNewChat}
            title={t('Новый чат')}
          >
            <IconPlus />
            {t('Новый чат')}
          </HeadPrimaryBtn>
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

      <TabView $active={tab === 'overview'}>
        <Body>
          {/* Col 1: В РАБОТЕ */}
          <Col>
          <ColHead>
            <span>{t('В работе')}</span>
            <ColHeadCount>{activeJobs.length}</ColHeadCount>
          </ColHead>
          {activeJobs.length === 0 ? (
            <Empty>{t('Нет активных задач')}</Empty>
          ) : (
            activeJobs.map(j => (
              <ActiveRow key={j.id} type="button">
                <Spinner />
                <ActiveText>{j.title}</ActiveText>
                <ActiveTime>{j.progress}</ActiveTime>
              </ActiveRow>
            ))
          )}
        </Col>

        {/* Col 2: ПАПКИ */}
        <Col>
          <ColHead>
            <span>{t('Папки')}</span>
            <ColHeadCount>
              {rootFolders.length + (noFolderCount > 0 ? 1 : 0)}
            </ColHeadCount>
          </ColHead>
          {rootFolders.length === 0 && noFolderCount === 0 ? (
            <Empty>{t('Папок пока нет')}</Empty>
          ) : (
            <>
              {rootFolders.map(f => (
                <FolderRow key={f.id} type="button">
                  <FolderDot $color={f.color} />
                  <FolderName>{f.name}</FolderName>
                  <FolderCount>{f.count}</FolderCount>
                </FolderRow>
              ))}
              {noFolderCount > 0 ? (
                <FolderRow type="button">
                  <FolderDot $color="transparent" $dashed />
                  <FolderName $italic>{t('Без папки')}</FolderName>
                  <FolderCount>{noFolderCount}</FolderCount>
                </FolderRow>
              ) : null}
            </>
          )}
        </Col>

        {/* Col 3: ИИ АНАЛИТИКА */}
        <InsightsCol>
          <ColHead>
            <span title={t('Автоматические сводки и найденные аномалии')}>
              {t('ИИ аналитика')}
            </span>
            <ColHeadCount>{insights.length}</ColHeadCount>
          </ColHead>
          {insights.length === 0 ? (
            <Empty>{t('Пока нет инсайтов')}</Empty>
          ) : (
            insights.map(ins => (
              <Insight key={ins.id} type="button" $sev={ins.severity}>
                <InsHead>
                  <InsIcon $kind={ins.kind}>{insightIcon(ins.kind)}</InsIcon>
                  <InsBadge>{ins.badge}</InsBadge>
                  <InsTime>{ins.time}</InsTime>
                </InsHead>
                <InsTitle>{ins.title}</InsTitle>
                <InsPreview>{ins.preview}</InsPreview>
              </Insight>
            ))
          )}
        </InsightsCol>

        {/* Col 4: НЕДАВНИЕ */}
        <Col>
          <ColHead>
            <span>{t('Недавние')}</span>
            <ColHeadCount>{recents.length}</ColHeadCount>
          </ColHead>
          {recents.length === 0 ? (
            <Empty>{t('Пусто')}</Empty>
          ) : (
            recents.map(s => (
              <ChatRow
                key={s.id}
                type="button"
                onClick={() => handleSelect(s.id)}
              >
                <IconChatBubble />
                <ChatTitle>{s.title || t('Без названия')}</ChatTitle>
                <ChatTime>
                  {formatRelative(s.changed_on ?? s.created_on ?? '')}
                </ChatTime>
              </ChatRow>
            ))
          )}
        </Col>
        </Body>
      </TabView>

      <TabView $active={tab === 'manage'}>
        <AiHistoryManageView
          folders={folders}
          sessions={sessions}
          onChanged={refreshAll}
        />
      </TabView>

      {tab === 'overview' ? (
        <Foot>
          <FootBtn
            type="button"
            onClick={e => {
              e.stopPropagation();
              setTab('manage');
            }}
            title={t('Управление историей чатов')}
          >
            <IconGear />
            {t('Управление историей чатов')}
          </FootBtn>
        </Foot>
      ) : (
        <Foot>
          <FootBtn
            type="button"
            onClick={e => {
              e.stopPropagation();
              setTab('overview');
            }}
          >
            <IconBack />
            {t('Назад к истории')}
          </FootBtn>
          <FootHint>
            {t('Перетащите чаты между папками. Максимум ')}
            <kbd>{t('3 уровня')}</kbd>
          </FootHint>
          <FootBtn type="button" onClick={resetAllFolders}>
            <IconReset />
            {t('Сбросить')}
          </FootBtn>
        </Foot>
      )}
    </Sheet>
  );
};
