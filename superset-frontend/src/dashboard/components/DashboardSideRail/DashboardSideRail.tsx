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
 *   - Обновить — popover: «Обновить сейчас» / «Настроить интервал авто-обновления»
 *   - Сохранить — popover: «Сохранить» (overwrite) / «Сохранить как…»
 *   - Поделиться — popover: «Скопировать ссылку» / «Поделиться по email»
 *   - Управление рассылкой — popover: setup/edit/delete email reports
 *   - Инструменты разработчика — action: открывает плавающий DevToolsPanel
 */
import {
  styled,
  t,
  isFeatureEnabled,
  FeatureFlag,
  logging,
} from '@superset-ui/core';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Dropdown } from '@superset-ui/core/components/Dropdown';
import { DS2_VARS } from 'src/theme/ds2';
import { useShell } from 'src/views/components/Shell/ShellContext';
import type { DrawerKind } from 'src/views/components/Shell/types';
import type { RootState } from 'src/dashboard/types';
import { useChartIds } from 'src/dashboard/util/charts/useChartIds';
import {
  onRefresh as onRefreshAction,
  saveDashboardRequest,
  fetchFaveStar,
  saveFaveStar,
} from 'src/dashboard/actions/dashboardState';
import {
  addSuccessToast as addSuccessToastAction,
  addDangerToast as addDangerToastAction,
} from 'src/components/MessageToasts/actions';
import { LOG_ACTIONS_FORCE_REFRESH_DASHBOARD } from 'src/logger/LogUtils';
import { logEvent as logEventAction } from 'src/logger/actions';
import {
  DASHBOARD_HEADER_ID,
  SAVE_TYPE_NEWDASHBOARD,
} from 'src/dashboard/util/constants';
import { getDashboardPermalink } from 'src/utils/urlUtils';
import copyTextToClipboard from 'src/utils/copy';
import downloadAsPdf from 'src/utils/downloadAsPdf';
import downloadAsImage from 'src/utils/downloadAsImage';
import { useDownloadScreenshot } from 'src/dashboard/hooks/useDownloadScreenshot';
import {
  LOG_ACTIONS_DASHBOARD_DOWNLOAD_AS_PDF,
  LOG_ACTIONS_DASHBOARD_DOWNLOAD_AS_IMAGE,
} from 'src/logger/LogUtils';
import { DownloadScreenshotFormat } from 'src/dashboard/components/menu/DownloadMenuItems/types';
import SaveModal from 'src/dashboard/components/SaveModal';
import {
  deleteActiveReport,
  fetchUISpecificReport,
} from 'src/features/reports/ReportModal/actions';
import type { AlertObject } from 'src/features/alerts/types';
import { DeleteModal } from '@superset-ui/core/components';
import DevToolsPanel from './DevToolsPanel';
import ReportDrawer from './ReportDrawer';

/* ─── Styled ─────────────────────────────────────────────────────── */

const Rail = styled.nav<{
  $metrics: DockMetrics | null;
  $collapsed: boolean;
}>`
  position: fixed;
  /* Anchored bottom: мини-рейл «приклеен» к main dock TOP edge. Bottom
     edge всегда отстоит от main dock TOP ровно на 18px overlap. */
  bottom: ${({ $collapsed }) =>
    $collapsed
      ? '-2px'
      : `calc(${DS2_VARS.dockBottom} + ${DS2_VARS.dockHeight} - 18px)`};
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

  /* Симметричная анимация: collapse = expand в реверсе. Та же
     длительность (240ms), та же easing (decelerated cubic-bezier),
     тот же delay (200ms) — независимо от направления.
     Юзер хочет точный реверс развёртывания при свёртывании. */
  --mini-ease: cubic-bezier(0, 0, 0.2, 1);
  --mini-delay: 200ms;

  transform-origin: bottom center;
  transform: ${({ $collapsed }) =>
    $collapsed ? 'scaleY(0)' : 'scaleY(1)'};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};
  transition:
    transform 240ms var(--mini-ease) var(--mini-delay),
    opacity 240ms var(--mini-ease) var(--mini-delay),
    bottom 240ms var(--mini-ease) var(--mini-delay);

  @media print {
    display: none;
  }
  @media (max-width: 768px) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 120ms ease;
    transform: ${({ $collapsed }) =>
      $collapsed ? 'scaleY(0)' : 'scaleY(1)'};
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

/* ─── Popover overlay ────────────────────────────────────────────── */

/** Стилизованный overlay для popover-меню над rail-кнопкой.
 *  Использует тот же drawer-look (glassmorphism + DS2 border), что и
 *  DevToolsPanel, чтобы визуально вписываться в общий нижний UI-уровень. */
const PopoverMenu = styled.div`
  background: ${DS2_VARS.drawerBg};
  backdrop-filter: ${DS2_VARS.drawerFilter};
  -webkit-backdrop-filter: ${DS2_VARS.drawerFilter};
  border: 1px solid ${DS2_VARS.drawerBorder};
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  padding: 6px;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: ${DS2_VARS.fontSans};
`;

const PopoverItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: ${({ $danger }) => ($danger ? DS2_VARS.dn : DS2_VARS.ink)};
  font-size: var(--fs-interactive);
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease};

  &:hover:not(:disabled) {
    background: ${DS2_VARS.dockBtnHoverBg};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }

  &:disabled {
    color: ${DS2_VARS.g400};
    cursor: not-allowed;
  }
`;

const PopoverDivider = styled.div`
  height: 1px;
  background: ${DS2_VARS.drawerBorder};
  margin: 4px 0;
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

/* Star (favourite) — outline + filled. Стиль соответствует остальным
   rail-иконкам (1.6 stroke-width, 14×14 размер, currentColor). Filled
   вариант показывает что dashboard в избранном. */
const IconStar = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 2.5l2.36 4.78 5.27.77-3.81 3.71.9 5.24L10 14.55l-4.72 2.45.9-5.24L2.37 8.05l5.27-.77z" />
  </svg>
);

const IconStarFilled = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="currentColor"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 2.5l2.36 4.78 5.27.77-3.81 3.71.9 5.24L10 14.55l-4.72 2.45.9-5.24L2.37 8.05l5.27-.77z" />
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

const IconSave = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4.5v11a1 1 0 001 1h10a1 1 0 001-1V7.5l-3-3H5a1 1 0 00-1 1z" />
    <path d="M7 4.5v3.5h5V4.5" />
    <path d="M6.5 16v-5h7v5" />
  </svg>
);

const IconShare = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 3v10" />
    <path d="M6.5 6.5L10 3l3.5 3.5" />
    <path d="M5 11v5a1 1 0 001 1h8a1 1 0 001-1v-5" />
  </svg>
);

const IconEnvelope = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="5" width="14" height="11" rx="1.5" />
    <path d="M3.5 6l6.5 5 6.5-5" />
  </svg>
);

/* IconDevTools — «code brackets» </> с молнией-точкой внутри. */
const IconDevTools = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7.5 5L3 10l4.5 5" />
    <path d="M12.5 5l4.5 5-4.5 5" />
    <circle cx="10" cy="10" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

/* ─── Types ──────────────────────────────────────────────────────── */

interface PopoverMenuItemDef {
  key: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

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
    }
  | {
      kind: 'popover';
      id: string;
      label: string;
      icon: JSX.Element;
      items: PopoverMenuItemDef[];
      visible?: boolean;
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
  const {
    openedDrawer,
    toggleDrawer,
    isDockCollapsed,
    setHasMiniRail,
    pagesRailOpen,
    togglePagesRail,
  } = useShell();
  const onDashboard = useOnDashboardRoute();
  const dockMetrics = useMainDockMetrics();
  const dispatch = useDispatch();
  const chartIds = useChartIds();

  /* Восстанавливаем DevTools-open после reload. */
  const [devToolsOpen, setDevToolsOpen] = useState(() => {
    try {
      if (
        sessionStorage.getItem('superset.shell.devtools.reopenAfterReload') ===
        '1'
      ) {
        sessionStorage.removeItem('superset.shell.devtools.reopenAfterReload');
        return true;
      }
    } catch {
      /* noop */
    }
    return false;
  });

  useEffect(() => {
    if (onDashboard) setHasMiniRail(true);
    return () => setHasMiniRail(false);
  }, [onDashboard, setHasMiniRail]);

  /* ─── Redux state ──────────────────────────────────────────────── */

  const editMode = useSelector<RootState, boolean>(
    state => state.dashboardState?.editMode ?? false,
  );
  const dashboardId = useSelector<RootState, number | undefined>(
    state => state.dashboardInfo?.id,
  );
  /* Favourite (звезда) — раньше жил в шапке (showFaveStar PageHeaderWithActions),
     теперь перенесён сюда чтобы освободить горизонталь рядом с заголовком
     страницы. Selector берёт isStarred из dashboardState reducer (тот же
     источник что Header использовал). */
  const isStarred = useSelector<RootState, boolean>(
    state => !!(state.dashboardState as any)?.isStarred,
  );

  /* Селекторы для Save/Share/Refresh/Email-report. shallowEqual — не
     создавать новые ссылки на каждом рендере. */
  const {
    dashboardInfo,
    layout,
    dataMask,
    activeTabs,
    expandedSlices,
    refreshFrequency,
    shouldPersistRefreshFrequency,
    customCss,
    colorNamespace,
    colorScheme,
    hasUnsavedChanges,
    lastModifiedTime,
    directPathToChild,
    user,
  } = useSelector<RootState, any>(
    state => ({
      dashboardInfo: state.dashboardInfo,
      layout: state.dashboardLayout?.present,
      dataMask: state.dataMask,
      activeTabs: state.dashboardState?.activeTabs,
      // expandedSlices/refreshFrequency/shouldPersistRefreshFrequency/colorNamespace
      // удалены из DashboardState type, но реально лежат в стейте через legacy
      // reducer'ы. Каст (any) — чтобы TS не падал, до полного refactor типов.
      expandedSlices: (state.dashboardState as any)?.expandedSlices,
      refreshFrequency: (state.dashboardState as any)?.refreshFrequency,
      shouldPersistRefreshFrequency: !!(state.dashboardState as any)
        ?.shouldPersistRefreshFrequency,
      customCss: state.dashboardState?.css,
      colorNamespace: (state.dashboardState as any)?.colorNamespace,
      colorScheme: state.dashboardState?.colorScheme,
      hasUnsavedChanges: !!state.dashboardState?.hasUnsavedChanges,
      lastModifiedTime: Math.max(
        (state.dashboardState as any)?.lastModifiedTime ?? 0,
        (state.dashboardInfo as any)?.last_modified_time ?? 0,
      ),
      directPathToChild: state.dashboardState?.directPathToChild,
      user: (state as any).user,
    }),
    shallowEqual,
  );

  const dashboardTitle = layout?.[DASHBOARD_HEADER_ID]?.meta?.text;
  const userCanEdit = !!dashboardInfo?.dash_edit_perm;
  const userCanSave = !!dashboardInfo?.dash_save_perm;
  const userCanShare = !!dashboardInfo?.dash_share_perm;

  const dashboardComponentId = useMemo(
    () => [...(directPathToChild || [])].pop(),
    [directPathToChild],
  );

  /* ─── Modal triggers (ref на скрытый span внутри ModalTrigger) ─── */

  /* SaveModal не forwardRef'ит ModalTrigger наружу, поэтому открываем
     его через .click() на скрытом triggerNode'е. ModalTrigger
     оборачивает triggerNode в `<div onClick={open} role="button">`, и
     нативный element.click() на внутреннем span'е bubble'ится на этот
     wrapper, вызывая open. */
  const saveTriggerRef = useRef<HTMLSpanElement | null>(null);

  const openSaveAsModal = useCallback(() => {
    saveTriggerRef.current?.click();
  }, []);

  /* ─── Controlled Dropdown state (по id popover'а) ──────────────── */

  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const closePopover = useCallback(() => setOpenPopoverId(null), []);

  /* ─── Favourite handlers ───────────────────────────────────────── */

  /* Подтягиваем isStarred с бэка при первом mount'е страницы дашборда —
     раньше это делал PageHeaderWithActions через onMount внутри
     CommonHeader; после переноса звезды на side-rail backend-fetch тоже
     переехал сюда, чтобы иконка сразу показывала актуальное состояние. */
  const userId = (user as any)?.userId;
  useEffect(() => {
    if (dashboardId === undefined || !userId) return;
    // @ts-ignore — fetchFaveStar thunk не типизирован
    dispatch(fetchFaveStar(dashboardId));
  }, [dispatch, dashboardId, userId]);

  const handleToggleFavorite = useCallback(() => {
    if (dashboardId === undefined) return;
    // @ts-ignore — saveFaveStar thunk не типизирован
    dispatch(saveFaveStar(dashboardId, isStarred));
  }, [dispatch, dashboardId, isStarred]);

  /* ─── Refresh handlers ─────────────────────────────────────────── */

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

  /* ─── Save handlers ────────────────────────────────────────────── */

  /* Триггерит скрытую primary-кнопку в Header. Она содержит весь
     overwriteDashboard pipeline (cert/owners/colors/cross-filters/
     legacy state). data-test attr фильтруется emotion'ом, поэтому
     ищем по классу `.right-button-panel button.ant-btn-primary`. */
  const triggerHiddenSaveButton = useCallback(() => {
    const headerSaveBtn =
      document.querySelector<HTMLButtonElement>(
        '.right-button-panel button.ant-btn-primary',
      ) ||
      document.querySelector<HTMLButtonElement>(
        '[data-test="header-save-button"]',
      );
    headerSaveBtn?.click();
  }, []);

  /* ─── Download handlers (PDF / PNG) ────────────────────────────── */

  const SCREENSHOT_NODE_SELECTOR = '.dashboard';
  const isWebDriverScreenshotEnabled =
    isFeatureEnabled(FeatureFlag.EnableDashboardScreenshotEndpoints) &&
    isFeatureEnabled(FeatureFlag.EnableDashboardDownloadWebDriverScreenshot);
  const downloadScreenshot = useDownloadScreenshot(
    dashboardId ?? 0,
    (action: string, payload?: Record<string, unknown>) =>
      dispatch(logEventAction(action, payload ?? {})),
  );

  const handleDownloadPdf = useCallback(() => {
    if (isWebDriverScreenshotEnabled) {
      downloadScreenshot(DownloadScreenshotFormat.PDF);
    } else {
      try {
        const fakeEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
        } as any;
        downloadAsPdf(SCREENSHOT_NODE_SELECTOR, dashboardTitle, true)(fakeEvent);
      } catch (error) {
        logging.error(error);
        dispatch(
          addDangerToastAction(t('Не удалось экспортировать в PDF.')),
        );
      }
    }
    dispatch(logEventAction(LOG_ACTIONS_DASHBOARD_DOWNLOAD_AS_PDF, {}));
  }, [
    isWebDriverScreenshotEnabled,
    downloadScreenshot,
    dashboardTitle,
    dispatch,
  ]);

  const handleDownloadImage = useCallback(() => {
    if (isWebDriverScreenshotEnabled) {
      downloadScreenshot(DownloadScreenshotFormat.PNG);
    } else {
      try {
        const fakeEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
        } as any;
        downloadAsImage(
          SCREENSHOT_NODE_SELECTOR,
          dashboardTitle,
          true,
        )(fakeEvent);
      } catch (error) {
        logging.error(error);
        dispatch(
          addDangerToastAction(t('Не удалось сохранить как изображение.')),
        );
      }
    }
    dispatch(logEventAction(LOG_ACTIONS_DASHBOARD_DOWNLOAD_AS_IMAGE, {}));
  }, [
    isWebDriverScreenshotEnabled,
    downloadScreenshot,
    dashboardTitle,
    dispatch,
  ]);

  /* ─── Share handlers ───────────────────────────────────────────── */

  const generateShareUrl = useCallback(
    () =>
      getDashboardPermalink({
        dashboardId: String(dashboardId),
        dataMask,
        activeTabs,
        anchor: dashboardComponentId,
      }),
    [dashboardId, dataMask, activeTabs, dashboardComponentId],
  );

  const handleCopyLink = useCallback(async () => {
    try {
      await copyTextToClipboard(generateShareUrl);
      dispatch(addSuccessToastAction(t('Ссылка скопирована в буфер обмена')));
    } catch (error) {
      logging.error(error);
      dispatch(
        addDangerToastAction(
          t('Не удалось скопировать ссылку. Попробуйте ещё раз.'),
        ),
      );
    }
  }, [dispatch, generateShareUrl]);

  const handleShareByEmail = useCallback(async () => {
    try {
      const subject = `${t('Superset dashboard')} ${dashboardTitle ?? ''}`;
      const body = `${t('Посмотрите этот дашборд: ')}${await generateShareUrl()}`;
      const encodedBody = encodeURIComponent(body);
      const encodedSubject = encodeURIComponent(subject);
      window.location.href = `mailto:?Subject=${encodedSubject}%20&Body=${encodedBody}`;
    } catch (error) {
      logging.error(error);
      dispatch(
        addDangerToastAction(t('Не удалось сформировать ссылку для email.')),
      );
    }
  }, [dispatch, dashboardTitle, generateShareUrl]);

  /* ─── Email-report drawer state ───────────────────────────────── */

  const [showingReportDrawer, setShowingReportDrawer] = useState(false);
  const [currentReportDeleting, setCurrentReportDeleting] =
    useState<AlertObject | null>(null);

  const canAddReports = useMemo(() => {
    if (!isFeatureEnabled(FeatureFlag.AlertReports)) return false;
    if (!user?.userId) return false;
    if (dashboardId === undefined) return false;
    const roles = Object.keys(user.roles || {});
    const permissions = roles.map(key =>
      (user.roles[key] as any[]).filter(
        perms => perms[0] === 'menu_access' && perms[1] === 'Manage',
      ),
    );
    return permissions.some(p => p.length > 0);
  }, [user, dashboardId]);

  /* Подгружаем report-данные для текущего дашборда — drawer должен
     знать о существующем report'е (для edit-mode + toggle active +
     delete). Эффект срабатывает при смене dashboardId. */
  const prevDashboardIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (
      canAddReports &&
      dashboardId !== undefined &&
      prevDashboardIdRef.current !== dashboardId
    ) {
      prevDashboardIdRef.current = dashboardId;
      dispatch(
        // @ts-ignore — fetchUISpecificReport thunk
        fetchUISpecificReport({
          userId: user.userId,
          filterField: 'dashboard_id',
          creationMethod: 'dashboards',
          resourceId: dashboardId,
        }),
      );
    }
  }, [dispatch, canAddReports, dashboardId, user?.userId]);

  const handleOpenReportDrawer = useCallback(
    () => setShowingReportDrawer(true),
    [],
  );
  const handleCloseReportDrawer = useCallback(
    () => setShowingReportDrawer(false),
    [],
  );
  const handleRequestDeleteReport = useCallback(
    (rep: any) => setCurrentReportDeleting(rep),
    [],
  );
  const handleConfirmDeleteReport = useCallback(async () => {
    if (currentReportDeleting) {
      await dispatch(
        // @ts-ignore — deleteActiveReport thunk
        deleteActiveReport(currentReportDeleting),
      );
      setCurrentReportDeleting(null);
      setShowingReportDrawer(false);
    }
  }, [dispatch, currentReportDeleting]);

  /* ─── DevTools toggle ──────────────────────────────────────────── */

  const handleToggleDevTools = useCallback(() => {
    setDevToolsOpen(v => !v);
  }, []);

  /* ─── Build menu item lists for popovers ───────────────────────── */

  const saveItems: PopoverMenuItemDef[] = useMemo(() => {
    const arr: PopoverMenuItemDef[] = [];
    if (editMode) {
      arr.push({
        key: 'save-overwrite',
        label: t('Сохранить'),
        onClick: triggerHiddenSaveButton,
        disabled: !hasUnsavedChanges,
      });
    }
    arr.push({
      key: 'save-as',
      label: t('Сохранить как…'),
      onClick: openSaveAsModal,
    });
    arr.push({ key: 'divider-1', label: '', divider: true });
    arr.push({
      key: 'export-pdf',
      label: t('Экспорт в PDF'),
      onClick: handleDownloadPdf,
    });
    arr.push({
      key: 'export-image',
      label: t('Сохранить как изображение'),
      onClick: handleDownloadImage,
    });
    return arr;
  }, [
    editMode,
    hasUnsavedChanges,
    triggerHiddenSaveButton,
    openSaveAsModal,
    handleDownloadPdf,
    handleDownloadImage,
  ]);

  const shareItems: PopoverMenuItemDef[] = useMemo(
    () => [
      {
        key: 'copy-link',
        label: t('Скопировать ссылку в буфер обмена'),
        onClick: handleCopyLink,
      },
      {
        key: 'share-by-email',
        label: t('Поделиться ссылкой по email'),
        onClick: handleShareByEmail,
      },
    ],
    [handleCopyLink, handleShareByEmail],
  );

  /* ─── Items list ───────────────────────────────────────────────── */

  const items: SideRailItem[] = useMemo(() => {
    const arr: SideRailItem[] = [
      {
        kind: 'drawer',
        drawer: 'filters',
        label: t('Фильтры'),
        icon: <IconFilter />,
      },
      {
        kind: 'action',
        id: 'pages',
        label: t('Страницы'),
        icon: <IconPages />,
        onClick: togglePagesRail,
        active: pagesRailOpen,
        // Always visible — единообразный rail на всех дашбордах
        // независимо от async hydrate'а и количества страниц.
      },
      {
        kind: 'action',
        id: 'favorite',
        label: isStarred ? t('Убрать из избранного') : t('В избранное'),
        icon: isStarred ? <IconStarFilled /> : <IconStar />,
        onClick: handleToggleFavorite,
        active: isStarred,
        // Скрываем кнопку для анонимных юзеров — у них нет userId,
        // saveFaveStar упадёт на бэке. Логика 1:1 с PageHeaderWithActions.
        visible: !!userId,
      },
      {
        kind: 'action',
        id: 'refresh',
        label: t('Обновить сейчас'),
        icon: <IconRefresh />,
        onClick: handleRefresh,
      },
      {
        kind: 'popover',
        id: 'save',
        label: t('Сохранить дашборд'),
        icon: <IconSave />,
        items: saveItems,
      },
      {
        kind: 'popover',
        id: 'share',
        label: t('Поделиться'),
        icon: <IconShare />,
        items: shareItems,
      },
      {
        kind: 'action',
        id: 'email-report',
        label: t('Управление рассылкой по почте'),
        icon: <IconEnvelope />,
        onClick: handleOpenReportDrawer,
        active: showingReportDrawer,
        // Sync feature-flag check (без async user role) — иконка появляется
        // на t=0, role гейтит реальное открытие drawer'а на клике.
        visible: isFeatureEnabled(FeatureFlag.AlertReports),
      },
      {
        kind: 'action',
        id: 'devtools',
        label: t('Инструменты разработчика'),
        icon: <IconDevTools />,
        onClick: handleToggleDevTools,
        active: devToolsOpen,
      },
    ];
    return arr;
  }, [
    editMode,
    devToolsOpen,
    handleToggleDevTools,
    handleRefresh,
    saveItems,
    shareItems,
    handleOpenReportDrawer,
    showingReportDrawer,
    pagesRailOpen,
    togglePagesRail,
    isStarred,
    handleToggleFavorite,
    userId,
  ]);

  if (!onDashboard) return null;

  return (
    <>
      <Rail
        aria-label={t('Панель управления дашбордом')}
        aria-hidden={isDockCollapsed}
        data-collapsed={isDockCollapsed ? 'true' : 'false'}
        $metrics={dockMetrics}
        $collapsed={isDockCollapsed}
      >
        {items.map(item => {
          if (item.visible === false) return null;
          const key =
            item.kind === 'drawer'
              ? item.drawer
              : item.kind === 'popover'
                ? item.id
                : item.id;
          const isActive =
            item.kind === 'drawer'
              ? openedDrawer === item.drawer
              : item.kind === 'action'
                ? (item.active ?? false)
                : false;

          if (item.kind === 'popover') {
            const isOpen = openPopoverId === item.id;
            return (
              <Dropdown
                key={key}
                trigger={['click']}
                placement="topCenter"
                open={isOpen}
                onOpenChange={next =>
                  setOpenPopoverId(next ? item.id : null)
                }
                popupRender={() => (
                  <PopoverMenu role="menu" aria-label={item.label}>
                    {item.items.map(menuItem => {
                      if (menuItem.divider) {
                        return <PopoverDivider key={menuItem.key} />;
                      }
                      return (
                        <PopoverItem
                          key={menuItem.key}
                          type="button"
                          role="menuitem"
                          $danger={menuItem.danger}
                          disabled={menuItem.disabled}
                          onClick={() => {
                            if (menuItem.disabled) return;
                            closePopover();
                            menuItem.onClick?.();
                          }}
                        >
                          {menuItem.label}
                        </PopoverItem>
                      );
                    })}
                  </PopoverMenu>
                )}
              >
                <RailBtn
                  type="button"
                  $active={isOpen}
                  aria-label={item.label}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                  title={item.label}
                >
                  {item.icon}
                </RailBtn>
              </Dropdown>
            );
          }

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

      {/* Скрытый SaveModal — open триггерится click()'ом по
          ref'у на triggerNode-span'е (bubble в ModalTrigger wrapper). */}
      {userCanSave && dashboardInfo?.id !== undefined && (
        <SaveModal
          addSuccessToast={(msg: string) =>
            dispatch(addSuccessToastAction(msg))
          }
          addDangerToast={(msg: string) => dispatch(addDangerToastAction(msg))}
          dashboardId={dashboardInfo.id}
          dashboardTitle={dashboardTitle}
          dashboardInfo={dashboardInfo}
          saveType={SAVE_TYPE_NEWDASHBOARD}
          layout={layout}
          expandedSlices={expandedSlices}
          refreshFrequency={refreshFrequency}
          shouldPersistRefreshFrequency={shouldPersistRefreshFrequency}
          lastModifiedTime={lastModifiedTime}
          customCss={customCss}
          colorNamespace={colorNamespace}
          colorScheme={colorScheme}
          onSave={(data: any, id: number | string, saveType: any) =>
            // @ts-ignore — saveDashboardRequest thunk
            dispatch(saveDashboardRequest(data, id, saveType))
          }
          triggerNode={
            <span
              ref={saveTriggerRef}
              aria-hidden="true"
              style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
            />
          }
          canOverwrite={userCanEdit}
        />
      )}

      {/* ReportDrawer — bottom-sheet drawer в стиле каталога. */}
      {canAddReports && user?.userId && dashboardInfo?.id !== undefined && (
        <ReportDrawer
          show={showingReportDrawer}
          onHide={handleCloseReportDrawer}
          userId={user.userId}
          userEmail={user.email}
          dashboardId={dashboardInfo.id}
          dashboardTitle={dashboardTitle}
          onRequestDelete={handleRequestDeleteReport}
        />
      )}

      {/* Confirm-удаление report'а. */}
      {currentReportDeleting && (
        <DeleteModal
          description={t(
            'Это действие удалит рассылку %s навсегда.',
            currentReportDeleting?.name,
          )}
          onConfirm={handleConfirmDeleteReport}
          onHide={() => setCurrentReportDeleting(null)}
          open
          title={t('Удалить рассылку?')}
        />
      )}

      {devToolsOpen && (
        <DevToolsPanel onClose={() => setDevToolsOpen(false)} />
      )}
    </>
  );
};
