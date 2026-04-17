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
import { CatalogDrawer } from 'src/features/catalog';
import { DS2_VARS } from 'src/theme/ds2';
import { useThemeContext } from 'src/theme/ThemeProvider';
import type { BootstrapUser, MenuData } from 'src/types/bootstrapTypes';
import { CommandPalette } from './CommandPalette';
import { CreateDrawer } from './CreateDrawer';
import { Drawer } from './Drawer';
import { Rail } from './Rail';
import { SettingsDropdown } from './SettingsDropdown';
import { ShellProvider } from './ShellContext';
import { ToolsDrawer } from './ToolsDrawer';
import type { DrawerKind } from './types';

const ShellRoot = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${DS2_VARS.bg};
  color: ${DS2_VARS.ink};
  font-family: ${DS2_VARS.fontSans};
`;

const ShellMain = styled.main`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
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
  /** Открытие команды поиска (Ctrl+K). */
  onOpenSearch?: () => void;
  /** Открытие AI-режима. */
  onOpenAi?: () => void;
  /** Открытие календаря. */
  onOpenCalendar?: () => void;
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
  onOpenSearch,
  onOpenAi,
  onOpenCalendar,
}) => {
  const ui = useUiConfig();
  const themeCtx = useThemeContext();
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

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

  const handleOpenPalette = useCallback(() => setPaletteOpen(true), []);
  const handleClosePalette = useCallback(() => setPaletteOpen(false), []);

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

  if (ui.hideNav) {
    // embedded / standalone — shell не рендерится
    return <>{children}</>;
  }

  const initials = extractInitials(user);

  return (
    <ShellProvider>
      <ShellRoot>
        <Rail
          userInitials={initials}
          onOpenSearch={onOpenSearch ?? handleOpenPalette}
          onOpenAi={onOpenAi}
          onOpenCalendar={onOpenCalendar}
          onOpenSettings={handleOpenSettings}
          onToggleTheme={onToggleTheme}
          settingsButtonRef={settingsButtonRef}
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
          onAskAi={onOpenAi}
        />
      </ShellRoot>
    </ShellProvider>
  );
};
