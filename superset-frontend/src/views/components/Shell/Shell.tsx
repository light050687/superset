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
import { type FC, type ReactNode, useCallback } from 'react';
import { useUiConfig } from 'src/components/UiConfigContext';
import { DS2_VARS } from 'src/theme/ds2';
import { useThemeContext } from 'src/theme/ThemeProvider';
import type { BootstrapUser } from 'src/types/bootstrapTypes';
import { Drawer } from './Drawer';
import { Rail } from './Rail';
import { ShellProvider } from './ShellContext';
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
  children?: ReactNode;
  /** Контент для catalog/tools/create drawer (передаётся извне по мере реализации этапов). */
  drawerContent?: Partial<Record<DrawerKind, ReactNode>>;
  /** Открытие команды поиска (Ctrl+K). */
  onOpenSearch?: () => void;
  /** Открытие AI-режима. */
  onOpenAi?: () => void;
  /** Открытие календаря. */
  onOpenCalendar?: () => void;
  /** Открытие профиля/настроек. */
  onOpenSettings?: () => void;
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
  children,
  drawerContent,
  onOpenSearch,
  onOpenAi,
  onOpenCalendar,
  onOpenSettings,
}) => {
  const ui = useUiConfig();
  const themeCtx = useThemeContext();

  const onToggleTheme = useCallback(() => {
    if (!themeCtx) return;
    const next =
      themeCtx.themeMode === ThemeMode.DARK ? ThemeMode.DEFAULT : ThemeMode.DARK;
    themeCtx.setThemeMode(next);
  }, [themeCtx]);

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
          onOpenSearch={onOpenSearch}
          onOpenAi={onOpenAi}
          onOpenCalendar={onOpenCalendar}
          onOpenSettings={onOpenSettings}
          onToggleTheme={onToggleTheme}
        />
        <Drawer content={drawerContent} />
        <ShellMain>{children}</ShellMain>
      </ShellRoot>
    </ShellProvider>
  );
};
