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
 * Per-dashboard toggle для UI элементов страниц. Persistится в localStorage
 * (per-user per-browser). Default = true (UI показан). Структура страниц
 * в layout НЕ меняется при toggle — это чистая visibility.
 *
 * Используется в: DashboardPagesRail (rail с pill'ами), DashboardSideRail
 * (иконка «Страницы»), useHeaderActionsMenu (toggle MenuItem).
 */
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from 'src/dashboard/types';

const storageKey = (id: string | number) =>
  `superset:dashboard:${id}:pages-visible`;
const CHANGE_EVENT = 'superset:dashboard:pages-visible-changed';

function readStored(dashboardId: string | number | undefined): boolean {
  if (!dashboardId) return true;
  try {
    return localStorage.getItem(storageKey(dashboardId)) !== '0';
  } catch {
    return true;
  }
}

export default function usePagesVisibility(): [boolean, (v: boolean) => void] {
  const dashboardId = useSelector<RootState, string | number | undefined>(
    state => (state as any).dashboardInfo?.id,
  );
  const [visible, setVisibleState] = useState<boolean>(() =>
    readStored(dashboardId),
  );
  useEffect(() => {
    setVisibleState(readStored(dashboardId));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.dashboardId === dashboardId) {
        setVisibleState(readStored(dashboardId));
      }
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, [dashboardId]);
  const setVisible = useCallback(
    (v: boolean) => {
      if (!dashboardId) return;
      try {
        localStorage.setItem(storageKey(dashboardId), v ? '1' : '0');
      } catch {
        /* private mode / quota — silent */
      }
      window.dispatchEvent(
        new CustomEvent(CHANGE_EVENT, { detail: { dashboardId } }),
      );
    },
    [dashboardId],
  );
  return [visible, setVisible];
}
