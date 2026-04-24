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
 * на страницах дашборда (view/edit/create). Каждая иконка triggers
 * bottom-sheet drawer через useShell().
 *
 * Визуальный паттерн — «secondary contextual rail»: компактная
 * горизонтальная панель в том же DS 2.0 стиле (surface + border +
 * radius), что и главный dock — подчёркивает принадлежность к
 * одному «floating-dock»-кластеру, но видно что это дополнительная
 * контекстная панель (меньше высота 40 vs 58).
 *
 * Всегда видна на дашборде — пользователь не должен кликать для
 * открытия/закрытия, только для выбора конкретного drawer'а.
 *
 * Видимость:
 *   - только когда URL матчит /superset/dashboard/:id или /dashboard/new
 *     (edit-mode, view-mode, create — режимы Superset handle'ит через
 *     ?edit=true, а не через разные роуты)
 *   - скрывается на mobile (<768px) — там drawer полноэкранный
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
import {
  onRefresh as onRefreshAction,
  setEditMode as setEditModeAction,
} from 'src/dashboard/actions/dashboardState';
import { addSuccessToast as addSuccessToastAction } from 'src/components/MessageToasts/actions';
import { URL_PARAMS } from 'src/constants';
import { getUrlParam } from 'src/utils/urlUtils';
import getDashboardUrl from 'src/dashboard/util/getDashboardUrl';
import { getActiveFilters } from 'src/dashboard/util/activeDashboardFilters';
import { LOG_ACTIONS_FORCE_REFRESH_DASHBOARD } from 'src/logger/LogUtils';
import { logEvent as logEventAction } from 'src/logger/actions';

/* ─── Styled ─────────────────────────────────────────────────────── */

/* Позиционирование: визуально «прилеплено» к верху главного dock'а,
   как бугор-расширение. Нижняя граница — ровно на верхней границе
   dock'а (bottom: dockBottom + dockHeight), нижний border и нижние
   углы скрыты, так что создаётся иллюзия одной общей фигуры
   (pill-сверху, pill-основной-dock-снизу). Слегка sunk-in бордером
   ниже z-index'а dock'а, чтобы их borders не рисовались поверх.

   Z-index 100 < 101 главного dock'а: если мини-панель всё-таки
   частично перекрывается с dock'ом на 1-2px для anti-aliasing,
   dock остаётся визуально выше. */
const Rail = styled.nav<{
  $metrics: DockMetrics | null;
  $collapsed: boolean;
}>`
  /* Горизонтальная полоска, «сидит» на главном floating dock'е как
     крышка ноутбука. Ширина динамически совпадает с шириной
     главного dock'а (измеряется через ResizeObserver). Нижний
     край с 1px overlap, нижний border скрыт, нижние углы flat —
     mini-rail и dock визуально одна compound-фигура.

     Цвет темнее — DS2_VARS.aiSideBg (warm neutral surface), как у
     AI-сайдбара, чтобы отличалась от main dock'а и была
     «второстепенной» по визуальному весу. */
  position: fixed;
  /* Позиция pixel-in-pixel: берём реальные left/width главного dock'а
     через getBoundingClientRect, а не transform: translateX(-50%),
     чтобы избежать sub-pixel rounding и получить идентичные x-координаты
     левой/правой кромок с dock'ом. Transform: none, left задаётся явно. */
  transform: none;
  /* Overlap 18px с доком — ровно на dockRadius (радиус закруглённых
     углов dock'а). Mini-rail находится ЗА главным dock'ом (z-index
     ниже), поэтому dock'овские rounded-top-corners видны как обычно,
     а mini-rail высовывается только своей верхней частью. */
  bottom: calc(${DS2_VARS.dockBottom} + ${DS2_VARS.dockHeight} - 18px);
  ${({ $metrics }) =>
    $metrics !== null
      ? `left: ${$metrics.left}px; width: ${$metrics.width}px;`
      : /* Пока метрики не измерены — скрыт, чтобы не мигать
           неправильной позиции/ширины. */
        'left: 50%; visibility: hidden;'}
  /* height 48 = 30 visible (компактная полоска над dock'ом) +
     18 скрытый overlap. padding-bottom 20 = 18 overlap + 2 normal. */
  height: 48px;
  padding: 2px 10px 20px 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  /* По запросу юзера: иконки центрированы в mini-rail'е (раньше flex-end
     справа), чтобы не конкурировать с top-edge grabber'ом и смотреть
     симметрично относительно dock'а. */
  justify-content: center;
  gap: 4px;
  background: ${DS2_VARS.aiSideBg};
  backdrop-filter: ${DS2_VARS.dockFilter};
  -webkit-backdrop-filter: ${DS2_VARS.dockFilter};
  border: 1px solid ${DS2_VARS.dockBorder};
  border-bottom: none;
  border-radius: 14px 14px 0 0;
  box-shadow: inset 0 1px 0 ${DS2_VARS.aiSideHairline};
  /* z-index НИЖЕ главного dock'а (101) — mini-rail сидит ЗА доком,
     overlap 18px скрыт под доком, видно только верхнюю часть
     ~38px + rounded-top. Так user получает эффект «дополнительной
     панели сзади, выглядывающей из-под главного dock'а». */
  z-index: 99;

  /* Collapse-to-handle sync: когда main dock свёрнут в pill,
     mini-rail визуально уходит вниз (translateY) и фейдится, чтобы
     вместе с доком формировать единую compound-анимацию. Триггерится
     через ShellContext.isDockCollapsed. */
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
  /* Mobile: скрываем — drawer'ы triggered через нижний dock. */
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
  transition: background 0.12s ${DS2_VARS.ease},
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

/* ─── Иконки (inline SVG, viewBox 0 0 20 20) ─────────────────────── */

const IconFilter = (): JSX.Element => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor">
    <path d="M3 4.5h14M6 10h8M8.5 15.5h3" strokeLinecap="round" />
  </svg>
);

/* IconPages — stacked pages (Notion/Confluence pattern): задняя страница
   слегка смещена вверх-вправо, передняя лежит поверх с контент-линиями.
   Однозначно читается как «несколько страниц», не конфликтует с
   IconTools (2×2 grid) в главном dock'е. */
const IconPages = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Задняя страница (peek) */}
    <path d="M8 3.5h7a1 1 0 011 1v10" />
    {/* Передняя страница */}
    <rect x="4" y="5.5" width="11" height="11" rx="1" />
    {/* Контент-линии */}
    <path d="M6.5 9.5h6M6.5 12.5h4" />
  </svg>
);

/* IconEdit — карандаш, классический паттерн для «редактирования». */
const IconEdit = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3.5 14.5v3h3l9-9-3-3-9 9z" />
    <path d="M12 5l3 3" />
  </svg>
);

/* IconRefresh — круговая стрелка. */
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

/* IconFullscreen — 4 угловые «скобки» (expand). */
const IconFullscreen = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 7.5V4h3.5M16 7.5V4h-3.5M4 12.5V16h3.5M16 12.5V16h-3.5" />
  </svg>
);

/* IconFullscreenExit — скобки «внутрь» (collapse). */
const IconFullscreenExit = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7.5 4v3.5H4M12.5 4v3.5H16M7.5 16v-3.5H4M12.5 16v-3.5H16" />
  </svg>
);

/* ─── Component ──────────────────────────────────────────────────── */

/**
 * Item в mini-rail'е может быть:
 *   - Drawer-item: открывает/закрывает shell-drawer (фильтры/страницы)
 *     — поле `drawer` задано;
 *   - Action-item: inline-кнопка-действие (edit/refresh/fullscreen) —
 *     задан `onClick`. Никакой drawer не открывается.
 * На уровне UI обе варианта рендерятся одинаково (RailBtn), но state
 * `$active` выставляется только у drawer-item'ов (по openedDrawer).
 */
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
      disabled?: boolean;
    };

/** True, если текущий URL — это страница дашборда (не список, не чарт,
 *  не SQL Lab). Покрывает и view, и edit, и new. */
function useOnDashboardRoute(): boolean {
  const loc = useLocation();
  return useMemo(() => {
    const p = loc.pathname;
    /* Route'ы:
       - /superset/dashboard/:id/         → основной формат
       - /dashboard/:id/                   → альтернативный (без /superset)
       - /dashboard/list/                  → ЭТО СПИСОК, не дашборд → NO
       - /dashboard/new                    → создание → YES */
    if (/\/dashboard\/list\/?$/.test(p)) return false;
    return (
      /^\/(superset\/)?dashboard\/[^/]+\/?/.test(p) ||
      /^\/dashboard\/new\/?/.test(p)
    );
  }, [loc.pathname]);
}

/** Измеряет позицию и ширину главного floating dock'а. Возвращает
 *  абсолютные left/width, которые мини-панель применяет 1-в-1,
 *  чтобы её боковые кромки совпадали с dock'ом пиксель-в-пиксель.
 *  Отслеживаются изменения размера (CentralPill expand/collapse,
 *  resize окна) через ResizeObserver + scroll/resize событий. */
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
      /* Устойчивый селектор через data-attr — aria-label меняется
         при смене языка. `data-shell-rail="main"` на Rail.tsx. */
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
        /* Округляем до целого пикселя — getBoundingClientRect
           возвращает float (например, left=330.5, width=821.3),
           и разные браузеры по-разному округляют subpixel-positioning
           для разных элементов. Итоге кромки могут разъезжаться
           на 1px. Math.round гарантирует идентичные integer-координаты
           как на dock, так и на mini-rail. */
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
      /* resize окна сдвигает центрированный dock — ловим window.resize */
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

export const DashboardSideRail: FC = () => {
  const { openedDrawer, toggleDrawer, isDockCollapsed, setHasMiniRail } =
    useShell();
  const onDashboard = useOnDashboardRoute();
  const dockMetrics = useMainDockMetrics();
  const dispatch = useDispatch();
  const chartIds = useChartIds();

  /* Сообщаем Shell'у что mini-rail присутствует — Rail.tsx прокинет
     эту инфу в top-edge grabber, чтобы тот позиционировался ВЫШЕ
     mini-rail'а на дашбордах, а не перекрывался с его иконками. */
  useEffect(() => {
    if (onDashboard) setHasMiniRail(true);
    return () => setHasMiniRail(false);
  }, [onDashboard, setHasMiniRail]);

  /* Pages-иконка имеет смысл только если:
     - у дашборда есть Pages-структура (topLevelPages с >1 child), либо
     - это edit-mode (юзер может создать Pages)
     Это условие повторяет isVerticalFilterBarVisible в DashboardBuilder. */
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
  const userCanEdit = useSelector<RootState, boolean>(
    state => state.dashboardInfo?.dash_edit_perm ?? false,
  );
  const isEmbedded = useSelector<RootState, boolean>(
    state => !state.dashboardInfo?.userId,
  );
  const dashboardId = useSelector<RootState, number | undefined>(
    state => state.dashboardInfo?.id,
  );
  /* isLoading вычисляется как «есть ли хоть один chart в состоянии
     loading». Используем тот же паттерн, что в Header.jsx. */
  const isLoading = useSelector<RootState, boolean>(state => {
    const charts = state.charts || {};
    return Object.values(charts).some(
      (c: any) => c?.chartStatus === 'loading',
    );
  });

  /* ─── Action handlers ───────────────────────────────────────────── */

  const handleEdit = useCallback(() => {
    dispatch(setEditModeAction(true));
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    if (isLoading || dashboardId === undefined) return;
    dispatch(
      logEventAction(LOG_ACTIONS_FORCE_REFRESH_DASHBOARD, {
        force: true,
        interval: 0,
        chartCount: chartIds.length,
      }),
    );
    // @ts-ignore — onRefresh thunk не типизирован
    dispatch(onRefreshAction(chartIds, true, 0, dashboardId));
    dispatch(addSuccessToastAction(t('Обновление чартов')));
  }, [dispatch, chartIds, dashboardId, isLoading]);

  const isStandalone = Number(getUrlParam(URL_PARAMS.standalone)) === 1;
  const handleFullscreen = useCallback(() => {
    const url = getDashboardUrl({
      pathname: window.location.pathname,
      filters: getActiveFilters(),
      hash: window.location.hash,
      standalone: isStandalone ? null : 1,
    });
    window.location.replace(url);
  }, [isStandalone]);

  const items: SideRailItem[] = useMemo(
    () => [
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
      /* Action: Refresh dashboard — прячется в edit-mode (как и в gear
         меню: editMode ⇒ нет смысла обновлять чарты, нужно сохранять). */
      {
        kind: 'action',
        id: 'refresh',
        label: t('Обновить дашборд'),
        icon: <IconRefresh />,
        onClick: handleRefresh,
        visible: !editMode,
        disabled: isLoading,
      },
      /* Action: Fullscreen — стандалон-режим. Скрывается в edit-mode и
         для embedded дашбордов (как в оригинальном dropdown). */
      {
        kind: 'action',
        id: 'fullscreen',
        label: isStandalone
          ? t('Выйти из полноэкранного режима')
          : t('Полноэкранный режим'),
        icon: isStandalone ? <IconFullscreenExit /> : <IconFullscreen />,
        onClick: handleFullscreen,
        visible: !editMode && !isEmbedded,
      },
      /* Action: Enter edit mode — видно только юзерам с правом edit и
         не в edit-mode. Единственная кнопка «редактировать» — убрали
         primary-button из Header'а. */
      {
        kind: 'action',
        id: 'edit',
        label: t('Редактировать дашборд'),
        icon: <IconEdit />,
        onClick: handleEdit,
        visible: userCanEdit && !editMode,
      },
    ],
    [
      topLevelPagesCount,
      editMode,
      isEmbedded,
      isLoading,
      isStandalone,
      userCanEdit,
      handleRefresh,
      handleFullscreen,
      handleEdit,
    ],
  );

  if (!onDashboard) return null;

  return (
    <Rail
      aria-label={t('Панель управления дашбордом')}
      aria-hidden={isDockCollapsed}
      $metrics={dockMetrics}
      $collapsed={isDockCollapsed}
    >
      {items.map(item => {
        if (item.visible === false) return null;
        const key = item.kind === 'drawer' ? item.drawer : item.id;
        const isDrawerItem = item.kind === 'drawer';
        const isActive = isDrawerItem && openedDrawer === item.drawer;
        return (
          <RailBtn
            key={key}
            type="button"
            $active={isActive}
            aria-pressed={isActive}
            aria-label={item.label}
            title={item.label}
            disabled={item.kind === 'action' ? item.disabled : undefined}
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
  );
};
