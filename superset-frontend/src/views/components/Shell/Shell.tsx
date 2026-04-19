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
 */
import { styled, ThemeMode } from '@superset-ui/core';
import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useUiConfig } from 'src/components/UiConfigContext';
import { URL_PARAMS } from 'src/constants';
import { DashboardStandaloneMode } from 'src/dashboard/util/constants';
import { AiFullView } from 'src/features/ai';
import {
  CatalogDrawer,
  useCatalogFolders,
  useCatalogHasUpdates,
} from 'src/features/catalog';
import { DS2_VARS } from 'src/theme/ds2';
import { useThemeContext } from 'src/theme/ThemeProvider';
import type { BootstrapUser, MenuData } from 'src/types/bootstrapTypes';
import { getUrlParam } from 'src/utils/urlUtils';
import { AiHistorySheet } from './AiHistorySheet';
import { CalendarDropdown, type CalendarEvent } from './CalendarDropdown';
import {
  DEFAULT_AI_CONTEXT,
  DEFAULT_AI_CONTEXTS,
  DEFAULT_AI_MODEL,
  type AiContext,
  type AiModelDescriptor,
  type AiModelId,
} from './CentralPillTypes';
import { CommandPalette } from './CommandPalette';
import { CreateDrawer } from './CreateDrawer';
import { Drawer } from './Drawer';
import { MobileNav } from './MobileNav';
import { Rail } from './Rail';
import { SettingsDropdown } from './SettingsDropdown';
import { ShellProvider } from './ShellContext';
import { ToolsDrawer } from './ToolsDrawer';
import type { DrawerKind } from './types';

/**
 * Shell = «окно приложения». С переходом на Floating Dock (Этап 1):
 *   - ShellRoot больше не flex-row: док плавает через position:fixed,
 *     ShellMain занимает 100% viewport по обеим осям.
 *   - Padding-bottom у ShellMain резервирует место под док, чтобы контент
 *     (дашборды, таблицы) не уходил под floating pill.
 *
 * Z-index иерархия Shell (для справки):
 *   content / ShellMain  = auto (естественный order)
 *   Drawer (bottom sheet) = 95
 *   AI Scrim              = 99
 *   AI Panel              = 100
 *   FloatingDock/MobileNav= 101
 *   CommandPalette overlay= 105
 *   Dropdowns (popovers)  = 110
 *
 * При открытии AI overlay scrim не блокирует dock — dock специально
 * стоит выше scrim, чтобы пользователь мог переключиться на другой режим
 * без предварительного закрытия overlay-а.
 */
const ShellRoot = styled.div`
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: ${DS2_VARS.bg};
  color: ${DS2_VARS.ink};
  font-family: ${DS2_VARS.fontSans};
  isolation: isolate;

  /* Ambient orbs — мягкие цветные blur-пятна (тренд 2026 «warmth &
     humanity»). Два orb'а sky (top-left) и violet (bottom-right) на фоне,
     не мешают контенту (z-index -1, pointer-events none). В печати скрыты. */
  &::before,
  &::after {
    content: '';
    position: fixed;
    pointer-events: none;
    z-index: -1;
    filter: blur(80px);
    opacity: 0.5;
  }

  &::before {
    top: -10%;
    left: -10%;
    width: 50vw;
    height: 50vw;
    max-width: 700px;
    max-height: 700px;
    background: radial-gradient(
      circle,
      rgba(59, 139, 217, 0.18),
      transparent 60%
    );
  }

  &::after {
    bottom: -10%;
    right: -10%;
    width: 55vw;
    height: 55vw;
    max-width: 800px;
    max-height: 800px;
    background: radial-gradient(
      circle,
      rgba(139, 92, 246, 0.15),
      transparent 60%
    );
  }

  @media print {
    height: auto;
    overflow: visible;
    &::before,
    &::after {
      display: none;
    }
  }
`;

const ShellMain = styled.main`
  height: 100%;
  width: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  /* Резервируем нижний отступ под FloatingDock (height + bottom + gap). */
  padding-bottom: ${DS2_VARS.dockContentPad};

  @media print {
    padding-bottom: 0;
  }
`;

interface ShellProps {
  user?: BootstrapUser;
  /** Bootstrap menu_data — нужен SettingsDropdown для отрисовки нативных ссылок. */
  menu?: MenuData;
  /** Возвращает true, если URL обрабатывается React Router (не server-rendered). */
  isFrontendRoute?: (url?: string) => boolean;
  children?: ReactNode;
  /** Контент для catalog/tools/create drawer (передаётся извне по мере реализации этапов). */
  drawerContent?: Partial<Record<DrawerKind, ReactNode>>;
  /** Внешний хендлер AI (если не задан — используется встроенный AiFullView). */
  onOpenAi?: () => void;
  /** Внешний хендлер календаря (если задан — встроенный dropdown скрывается). */
  onOpenCalendar?: () => void;
  /** События для встроенного календаря. */
  calendarEvents?: CalendarEvent[];
  /**
   * Доступные контексты AI для CentralPill. По умолчанию — только «Общий».
   * Маршрут дашборда может передать расширенный список из bootstrap или
   * сформировать его на лету из URL (dashboard/chart контекст).
   */
  aiContexts?: readonly AiContext[];
}

function extractInitials(user?: BootstrapUser): string {
  const name =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || '';
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Новый shell (Rail + Drawer + main), заменяет классический <Menu>.
 * Скрывается в embedded-режиме (hideNav=true) — тогда children рендерятся без shell.
 */
export const Shell: FC<ShellProps> = ({
  user,
  menu,
  isFrontendRoute,
  children,
  drawerContent,
  onOpenAi,
  onOpenCalendar,
  calendarEvents,
  aiContexts,
}) => {
  const ui = useUiConfig();
  const themeCtx = useThemeContext();
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSeedQuery, setAiSeedQuery] = useState<string | undefined>(undefined);
  const [aiHistoryOpen, setAiHistoryOpen] = useState(false);

  // Контекст AI (общий / дашборд / чарт) и модель LLM для CentralPill.
  // Если aiContexts не передан — используем дефолтный набор из мокапа
  // (Общий + 3 дашборд-контекста). Реальные контексты могут приходить
  // из bootstrap.common.ai_contexts (фильтруются permissions на backend).
  const effectiveContexts = useMemo<readonly AiContext[]>(
    () => aiContexts ?? DEFAULT_AI_CONTEXTS,
    [aiContexts],
  );
  const [contextId, setContextId] = useState<string>(DEFAULT_AI_CONTEXT.id);
  const [modelId, setModelId] = useState<AiModelId>(DEFAULT_AI_MODEL);

  const handleContextChange = useCallback((ctx: AiContext) => {
    setContextId(ctx.id);
  }, []);

  const handleModelChange = useCallback((model: AiModelDescriptor) => {
    setModelId(model.id);
  }, []);

  const handleToggleTheme = useCallback(() => {
    if (!themeCtx) return;
    const next =
      themeCtx.themeMode === ThemeMode.DARK ? ThemeMode.DEFAULT : ThemeMode.DARK;
    // data-theme атрибут и анимация (View Transitions API) управляются
    // централизованно внутри ThemeProvider.setThemeMode — здесь только
    // делегируем. Ручной setAttribute здесь бы сломал VT-snapshot.
    themeCtx.setThemeMode(next);
  }, [themeCtx]);

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(prev => !prev);
  }, []);
  const handleCloseSettings = useCallback(() => setSettingsOpen(false), []);

  /* handleOpenPalette больше не вызывается из Rail (rail-search удалён —
     заменён CentralPill). CommandPalette открывается только по Ctrl+K
     (глобальный хоткей — см. эффект ниже). */
  const handleClosePalette = useCallback(() => setPaletteOpen(false), []);

  const handleToggleCalendar = useCallback(() => {
    if (onOpenCalendar) {
      onOpenCalendar();
      return;
    }
    setCalendarOpen(prev => !prev);
  }, [onOpenCalendar]);
  const handleCloseCalendar = useCallback(() => setCalendarOpen(false), []);

  /**
   * Открытие AI overlay. Принимает опциональный seed-запрос и мета (контекст,
   * модель) — приходят из CentralPill.onSubmit. Мы включаем контекст в текст
   * seed, чтобы бэк ai-analytics (AnalyzeRequest.query) знал рамки запроса;
   * model отдельно пока не передаётся — добавим в Этапе 4.
   */
  const handleOpenAi = useCallback(
    (seed?: string, meta?: { contextId: string; modelId: AiModelId }) => {
      if (onOpenAi) {
        onOpenAi();
        return;
      }
      if (meta) {
        // Синхронизируем контекст/модель дока с тем, что отправил пилюля.
        if (meta.contextId !== contextId) setContextId(meta.contextId);
        if (meta.modelId !== modelId) setModelId(meta.modelId);
      }
      const ctx = effectiveContexts.find(c => c.id === (meta?.contextId ?? contextId));
      const ctxPrefix =
        ctx && ctx.id !== DEFAULT_AI_CONTEXT.id ? `[${ctx.label}] ` : '';
      setAiSeedQuery(seed ? `${ctxPrefix}${seed}` : undefined);
      setAiOpen(true);
    },
    [onOpenAi, contextId, modelId, effectiveContexts],
  );
  const handleCloseAi = useCallback(() => {
    setAiOpen(false);
    setAiSeedQuery(undefined);
  }, []);

  /**
   * Toggle истории чатов (AiHistorySheet). Открывается из dock'а или
   * из кнопки «История» внутри AI overlay.
   */
  /**
   * Клик по «История чатов» в dock имеет два разных поведения:
   *  - overlay закрыт → toggle AiHistorySheet (полноразмерный 4-col sheet)
   *  - overlay открыт (активный чат) → toggle slide-in боковой панели
   *    внутри overlay'я (AiSidePanel) с поиском и списком чатов
   */
  /** Клик «История чатов» в dock → только toggle полноразмерного Sheet.
   *  Side-panel внутри overlay'я управляется собственной кнопкой-табом
   *  на левом крае AI overlay (см. AiFullView). */
  const handleOpenAiHistory = useCallback(() => {
    setAiHistoryOpen(prev => !prev);
  }, []);
  const handleCloseAiHistory = useCallback(() => {
    setAiHistoryOpen(false);
  }, []);

  const handleSelectAiSession = useCallback((_sessionId: number) => {
    // Переключение сессии — откроем AI overlay; дальнейшая загрузка
    // сообщений выполняется в AiFullView по session_id (TODO Этап B12).
    setAiOpen(true);
  }, []);

  const handleNewAiChat = useCallback(() => {
    setAiSeedQuery(undefined);
    setAiOpen(true);
  }, []);

  // Глобальный Ctrl+K / Cmd+K. Работает на любой странице под Shell.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const modifier = e.ctrlKey || e.metaKey;
      if (modifier && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Дефолтный контент drawer — можно переопределить через проп drawerContent.
  const mergedDrawerContent = useMemo(
    () => ({
      catalog: <CatalogDrawer />,
      tools: <ToolsDrawer />,
      create: <CreateDrawer />,
      ...drawerContent,
    }),
    [drawerContent],
  );

  // Shell скрывается в:
  // - embedded-режиме (hideNav через URL_PARAMS.uiConfig)
  // - URL_PARAMS.standalone ≥ HideNav (iframe-встраивание, публичные ссылки)
  const standaloneMode = getUrlParam(URL_PARAMS.standalone);
  const hideShell =
    ui.hideNav ||
    (standaloneMode !== null &&
      Number(standaloneMode) >= DashboardStandaloneMode.HideNav);

  if (hideShell) {
    return <>{children}</>;
  }

  const initials = extractInitials(user);

  // Badge на иконке Каталога — только при изменениях с момента последнего
  // открытия CatalogDrawer (snapshot в localStorage).
  const { folders } = useCatalogFolders();
  const catalogHasUpdates = useCatalogHasUpdates(folders);

  return (
    <ShellProvider>
      <ShellRoot>
        <Rail
          userInitials={initials}
          onOpenAi={handleOpenAi}
          onOpenAiHistory={handleOpenAiHistory}
          onOpenCalendar={handleToggleCalendar}
          onOpenSettings={handleOpenSettings}
          onToggleTheme={handleToggleTheme}
          settingsButtonRef={settingsButtonRef}
          calendarButtonRef={calendarButtonRef}
          /* Бейдж показывается только когда есть новые события извне или
             запланированное событие «скоро» — сейчас источника нет, поэтому
             undefined. TODO: завести проверку upcoming events из
             useCalendarEvents (события в ближайшие 2 часа или сегодня). */
          calendarBadgeColor={undefined}
          catalogBadgeColor={
            catalogHasUpdates ? DS2_VARS.cTangerine : undefined
          }
          historyActive={aiHistoryOpen}
          calendarActive={calendarOpen}
          settingsActive={settingsOpen}
          aiActive={aiOpen}
          contexts={effectiveContexts}
          contextId={contextId}
          onContextChange={handleContextChange}
          modelId={modelId}
          onModelChange={handleModelChange}
        />
        <MobileNav
          userInitials={initials}
          onOpenAi={() => handleOpenAi()}
          onOpenSettings={handleOpenSettings}
          settingsButtonRef={settingsButtonRef}
          aiBadgeColor={DS2_VARS.up}
          catalogBadgeColor={
            catalogHasUpdates ? DS2_VARS.cTangerine : undefined
          }
        />
        <Drawer content={mergedDrawerContent} />
        <ShellMain>{children}</ShellMain>
        {menu ? (
          <SettingsDropdown
            anchor={settingsButtonRef.current}
            open={settingsOpen}
            onClose={handleCloseSettings}
            user={user}
            menu={menu}
            isFrontendRoute={isFrontendRoute}
          />
        ) : null}
        <CommandPalette
          open={paletteOpen}
          onClose={handleClosePalette}
          onAskAi={query => handleOpenAi(query)}
        />
        <CalendarDropdown
          anchor={calendarButtonRef.current}
          open={calendarOpen}
          onClose={handleCloseCalendar}
          events={calendarEvents}
          userId={user?.userId ?? user?.username}
        />
        <AiFullView
          open={aiOpen}
          onClose={handleCloseAi}
          user={user}
          seedQuery={aiSeedQuery}
          contextId={contextId}
          modelId={modelId}
        />
        <AiHistorySheet
          open={aiHistoryOpen}
          onClose={handleCloseAiHistory}
          onSelectSession={handleSelectAiSession}
          onNewChat={handleNewAiChat}
        />
      </ShellRoot>
    </ShellProvider>
  );
};
