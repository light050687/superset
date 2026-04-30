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
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import type { DrawerKind } from './types';

interface ShellContextValue {
  openedDrawer: DrawerKind | null;
  /** Переключает drawer: повторный клик по тому же типу закрывает панель. */
  toggleDrawer: (kind: DrawerKind) => void;
  closeDrawer: () => void;
  /** Активная rail-кнопка для подсветки (id из RailButtonDescriptor). */
  activeRailId: string | null;
  setActiveRailId: (id: string | null) => void;
  /**
   * Collapse-to-handle state главного dock'а. Читается DashboardSideRail'ом
   * (mini-rail), чтобы collapse/expand shell-дока синхронно со свернутым
   * mini-rail'ом — они одна compound-фигура «laptop lid over dock».
   */
  isDockCollapsed: boolean;
  setDockCollapsed: (collapsed: boolean) => void;
  /**
   * Присутствует ли mini-rail (DashboardSideRail) на текущей странице.
   * Пушится из DashboardSideRail на mount/unmount. Используется в Rail,
   * чтобы позиционировать top-edge grabber ВЫШЕ mini-rail'а там, где он
   * есть (не перекрывался с иконками дашборда), и над dock'ом — где нет.
   */
  hasMiniRail: boolean;
  setHasMiniRail: (present: boolean) => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export const ShellProvider: FC<React.PropsWithChildren<{ children: ReactNode }>> = ({ children }) => {
  const [openedDrawer, setOpenedDrawer] = useState<DrawerKind | null>(null);
  const [activeRailId, setActiveRailId] = useState<string | null>(null);
  const [isDockCollapsed, setDockCollapsed] = useState(false);
  const [hasMiniRail, setHasMiniRail] = useState(false);

  const toggleDrawer = useCallback((kind: DrawerKind) => {
    setOpenedDrawer(prev => (prev === kind ? null : kind));
  }, []);

  const closeDrawer = useCallback(() => {
    setOpenedDrawer(null);
  }, []);

  const value = useMemo<ShellContextValue>(
    () => ({
      openedDrawer,
      toggleDrawer,
      closeDrawer,
      activeRailId,
      setActiveRailId,
      isDockCollapsed,
      setDockCollapsed,
      hasMiniRail,
      setHasMiniRail,
    }),
    [
      openedDrawer,
      toggleDrawer,
      closeDrawer,
      activeRailId,
      isDockCollapsed,
      hasMiniRail,
    ],
  );

  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
};

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error('useShell must be used within <ShellProvider>');
  }
  return ctx;
}
