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
 * DashboardSideRail — горизонтальная мини-панель из icon-кнопок,
 * появляется НАД главным floating dock'ом (bottom-центр), persistent
 * на страницах дашборда (view/edit/create).
 *
 * Icon-кнопки:
 *   - Фильтры / Страницы — открывают shell-drawer'ы (kind='filters' / 'pages')
 *   - Обновить — action: forceRefreshAllCharts
 *   - Инструменты разработчика — action: открывает плавающий DevToolsPanel
 *   - Сохранить — action (только в edit-mode): триггер header-save-button
 */
import { styled, t } from '@superset-ui/core';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { DS2_VARS } from 'src/theme/ds2';
import { useShell } from 'src/views/components/Shell/ShellContext';
import type { DrawerKind } from 'src/views/components/Shell/types';
import type { RootState } from 'src/dashboard/types';
import { useChartIds } from 'src/dashboard/util/charts/useChartIds';
import { onRefresh as onRefreshAction } from 'src/dashboard/actions/dashboardState';
import { addSuccessToast as addSuccessToastAction } from 'src/components/MessageToasts/actions';
import { LOG_ACTIONS_FORCE_REFRESH_DASHBOARD } from 'src/logger/LogUtils';
import { logEvent as logEventAction } from 'src/logger/actions';
import DevToolsPanel from './DevToolsPanel';

/* ─── Styled ─────────────────────────────────────────────────────── */

const Rail = styled.nav<{
  $metrics: DockMetrics | null;
  $collapsed: boolean;
}>`
  position: fixed;
  transform: none;
  bottom: calc(${DS2_VARS.dockBottom} + ${DS2_VARS.dockHeight} - 18px);
  ${({ $metrics }) =>
    $metrics !== null
      ? `left: ${$metrics.left}px; width: ${$metrics.width}px;`
      : 'left: 50%; visibility: hidden;'}
  height: 48px;
  padding: 2px 10px 20px 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: ${DS2_VARS.aiSideBg};
  backdrop-filter: ${DS2_VARS.dockFilter};
  -webkit-backdrop-filter: ${DS2_VARS.dockFilter};
  border: 1px solid ${DS2_VARS.dockBorder};
  border-bottom: none;
  border-radius: 14px 14px 0 0;
  box-shadow: inset 0 1px 0 ${DS2_VARS.aiSideHairline};
  z-index: 99;

  transform: ${({ $collapsed }) =>
    $collapsed ? 'translateY(100%)' : 'translateY(0)'};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};
  transition:
    transform 280ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 180ms ease;

  @media print {
    display: none;
  }
  @media (max-width: 768px) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 120ms ease;
    transform: ${({ $collapsed }) =>
      $collapsed ? 'translateY(100%)' : 'none'};
  }
`;

const RailBtn = styled.button<{ $active?: boolean }>`
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: ${({ $active }) =>
    $active ? DS2_VARS.dockBtnActiveBg : 'transparent'};
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g600)};
  box-shadow: ${({ $active }) =>
    $active ? DS2_VARS.dockBtnActiveRing : 'none'};
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease},
    box-shadow 0.12s ${DS2_VARS.ease};

  &:hover:not(:disabled) {
    background: ${({ $active }) =>
      $active ? DS2_VARS.dockBtnActiveBg : DS2_VARS.dockBtnHoverBg};
    color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.ink)};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  svg {
    width: 14px;
    height: 14px;
    stroke-width: 1.6;
  }
`;

/* ─── Иконки ─────────────────────────────────────────────────────── */

const IconFilter = (): JSX.Element => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor">
    <path d="M3 4.5h14M6 10h8M8.5 15.5h3" strokeLinecap="round" />
  </svg>
);

const IconPages = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 3.5h7a1 1 0 011 1v10" />
    <rect x="4" y="5.5" width="11" height="11" rx="1" />
    <path d="M6.5 9.5h6M6.5 12.5h4" />
  </svg>
);

const IconRefresh = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6" />
    <path d="M16.5 3.5v3h-3" />
  </svg>
);

const IconWrench = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 3a4 4 0 013.9 5L15 10l2.5 2.5a1.5 1.5 0 11-2.1 2.1L13 12l-2 1.9A4 4 0 115 7.1L7 9 9 7 7.1 5A4 4 0 0113 3z" />
  </svg>
);

/* ─── Types ──────────────────────────────────────────────────────── */

type SideRailItem =
  | {
      kind: 'drawer';
      drawer: DrawerKind;
      label: string;
      icon: JSX.Element;
      visible?: boolean;
    }
  | {
      kind: 'action';
      id: string;
      label: string;
      icon: JSX.Element;
      onClick: () => void;
      visible?: boolean;
      active?: boolean;
    };

function useOnDashboardRoute(): boolean {
  const loc = useLocation();
  return useMemo(() => {
    const p = loc.pathname;
    if (/\/dashboard\/list\/?$/.test(p)) return false;
    return (
      /^\/(superset\/)?dashboard\/[^/]+\/?/.test(p) ||
      /^\/dashboard\/new\/?/.test(p)
    );
  }, [loc.pathname]);
}

interface DockMetrics {
  left: number;
  width: number;
}
function useMainDockMetrics(): DockMetrics | null {
  const [metrics, setMetrics] = useState<DockMetrics | null>(null);
  useEffect(() => {
    let observer: ResizeObserver | null = null;
    let dock: HTMLElement | null = null;
    const tryAttach = (attemptsLeft: number) => {
      dock = document.querySelector<HTMLElement>(
        'nav[data-shell-rail="main"]',
      );
      if (!dock && attemptsLeft > 0) {
        requestAnimationFrame(() => tryAttach(attemptsLeft - 1));
        return;
      }
      if (!dock) return;
      const update = () => {
        if (!dock) return;
        const r = dock.getBoundingClientRect();
        const left = Math.round(r.left);
        const width = Math.round(r.width);
        setMetrics(prev =>
          prev && prev.left === left && prev.width === width
            ? prev
            : { left, width },
        );
      };
      update();
      observer = new ResizeObserver(update);
      observer.observe(dock);
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    };
    tryAttach(10);
    return () => {
      observer?.disconnect();
    };
  }, []);
  return metrics;
}

/* ─── Component ──────────────────────────────────────────────────── */

export const DashboardSideRail: FC = () => {
  const { openedDrawer, toggleDrawer, isDockCollapsed, setHasMiniRail } =
    useShell();
  const onDashboard = useOnDashboardRoute();
  const dockMetrics = useMainDockMetrics();
  const dispatch = useDispatch();
  const chartIds = useChartIds();
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  useEffect(() => {
    if (onDashboard) setHasMiniRail(true);
    return () => setHasMiniRail(false);
  }, [onDashboard, setHasMiniRail]);

  const topLevelPagesCount = useSelector<RootState, number>(state => {
    const layout = state.dashboardLayout?.present;
    if (!layout) return 0;
    const pagesNode = Object.values(layout).find(
      (c: any) => c?.type === 'PAGES',
    ) as { children?: string[] } | undefined;
    return pagesNode?.children?.length ?? 0;
  });
  const editMode = useSelector<RootState, boolean>(
    state => state.dashboardState?.editMode ?? false,
  );
  const dashboardId = useSelector<RootState, number | undefined>(
    state => state.dashboardInfo?.id,
  );

  /* ─── Refresh handler (остаётся тут, т.к. action-кнопка рельса) ─── */
  const handleRefresh = useCallback(() => {
    if (dashboardId === undefined) return;
    dispatch(
      logEventAction(LOG_ACTIONS_FORCE_REFRESH_DASHBOARD, {
        force: true,
        interval: 0,
        chartCount: chartIds.length,
      }),
    );
    dispatch(
      // @ts-ignore — onRefresh thunk не типизирован
      onRefreshAction(chartIds, true, 0, dashboardId),
    );
    dispatch(addSuccessToastAction(t('Обновление чартов')));
  }, [dispatch, chartIds, dashboardId]);

  const handleToggleDevTools = useCallback(() => {
    setDevToolsOpen(v => !v);
  }, []);

  const items: SideRailItem[] = useMemo(() => {
    const arr: SideRailItem[] = [
      {
        kind: 'drawer',
        drawer: 'filters',
        label: t('Фильтры'),
        icon: <IconFilter />,
      },
      {
        kind: 'drawer',
        drawer: 'pages',
        label: t('Страницы'),
        icon: <IconPages />,
        visible: topLevelPagesCount > 1 || editMode,
      },
      {
        kind: 'action',
        id: 'refresh',
        label: t('Обновить дашборд'),
        icon: <IconRefresh />,
        onClick: handleRefresh,
      },
      {
        kind: 'action',
        id: 'devtools',
        label: t('Инструменты разработчика'),
        icon: <IconWrench />,
        onClick: handleToggleDevTools,
        active: devToolsOpen,
      },
    ];
    return arr;
  }, [
    topLevelPagesCount,
    editMode,
    devToolsOpen,
    handleRefresh,
    handleToggleDevTools,
  ]);

  if (!onDashboard) return null;

  return (
    <>
      <Rail
        aria-label={t('Панель управления дашбордом')}
        aria-hidden={isDockCollapsed}
        $metrics={dockMetrics}
        $collapsed={isDockCollapsed}
      >
        {items.map(item => {
          if (item.visible === false) return null;
          const key = item.kind === 'drawer' ? item.drawer : item.id;
          const isActive =
            item.kind === 'drawer'
              ? openedDrawer === item.drawer
              : item.active ?? false;
          return (
            <RailBtn
              key={key}
              type="button"
              $active={isActive}
              aria-pressed={isActive}
              aria-label={item.label}
              title={item.label}
              onClick={() =>
                item.kind === 'drawer'
                  ? toggleDrawer(item.drawer)
                  : item.onClick()
              }
            >
              {item.icon}
            </RailBtn>
          );
        })}
      </Rail>
      {devToolsOpen && (
        <DevToolsPanel onClose={() => setDevToolsOpen(false)} />
      )}
    </>
  );
};
