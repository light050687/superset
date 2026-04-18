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
import { CatalogDrawer } from 'src/features/catalog';
import { DS2_VARS } from 'src/theme/ds2';
import { useThemeContext } from 'src/theme/ThemeProvider';
import type { BootstrapUser, MenuData } from 'src/types/bootstrapTypes';
import { getUrlParam } from 'src/utils/urlUtils';
import { CalendarDropdown, type CalendarEvent } from './CalendarDropdown';
import {
  DEFAULT_AI_CONTEXT,
  DEFAULT_AI_MODEL,
  type AiContext,
  type AiModelDescriptor,
  type AiModelId,
} from './CentralPillTypes';
import { CommandPalette } from './CommandPalette';
import { CreateDrawer } from './CreateDrawer';
import { Drawer } from './Drawer';
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
 */
const ShellRoot = styled.div`
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: ${DS2_VARS.bg};
  color: ${DS2_VARS.ink};
  font-family: ${DS2_VARS.fontSans};

  @media print {
    height: auto;
    overflow: visible;
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

  // Контекст AI (общий / дашборд / чарт) и модель LLM для CentralPill.
  const effectiveContexts = useMemo<readonly AiContext[]>(
    () => aiContexts ?? [DEFAULT_AI_CONTEXT],
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

  const onToggleTheme = useCallback(() => {
    if (!themeCtx) return;
    const next =
      themeCtx.themeMode === ThemeMode.DARK ? ThemeMode.DEFAULT : ThemeMode.DARK;
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

  return (
    <ShellProvider>
      <ShellRoot>
        <Rail
          userInitials={initials}
          onOpenAi={handleOpenAi}
          onOpenCalendar={handleToggleCalendar}
          onOpenSettings={handleOpenSettings}
          onToggleTheme={onToggleTheme}
          settingsButtonRef={settingsButtonRef}
          calendarButtonRef={calendarButtonRef}
          aiBadgeColor={DS2_VARS.up}
          calendarBadgeColor={DS2_VARS.cTangerine}
          catalogBadgeColor={DS2_VARS.cSky}
          contexts={effectiveContexts}
          contextId={contextId}
          onContextChange={handleContextChange}
          modelId={modelId}
          onModelChange={handleModelChange}
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
        />
        <AiFullView
          open={aiOpen}
          onClose={handleCloseAi}
          user={user}
          seedQuery={aiSeedQuery}
        />
      </ShellRoot>
    </ShellProvider>
  );
};
