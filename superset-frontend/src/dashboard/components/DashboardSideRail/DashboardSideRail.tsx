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
import {
  type FC,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  setUnsavedChanges as setUnsavedChangesAction,
} from 'src/dashboard/actions/dashboardState';
import {
  clearDashboardHistory as clearDashboardHistoryAction,
  undoLayoutAction,
  redoLayoutAction,
} from 'src/dashboard/actions/dashboardLayout';
import { addSuccessToast as addSuccessToastAction } from 'src/components/MessageToasts/actions';
import {
  LOG_ACTIONS_FORCE_REFRESH_DASHBOARD,
  LOG_ACTIONS_TOGGLE_EDIT_DASHBOARD,
} from 'src/logger/LogUtils';
import { logEvent as logEventAction } from 'src/logger/actions';

/* ─── DevTools panel constants ───────────────────────────────────── */

/** localStorage-ключ для persist'а позиции DevToolsPanel и pinned-state.
 *  Хранит JSON `{x:number, y:number, pinned:boolean}`. */
const DEVTOOLS_LS_KEY = 'superset.shell.devtools.panel.v1';

/* ─── Styled ─────────────────────────────────────────────────────── */

/** Floating панель «Инструменты разработчика» — position: fixed,
 *  draggable за шапку. Pin/unpin: в unpinned режиме закрывается при
 *  клике вне, в pinned — остаётся открытой (юзер перемещает по
 *  экрану и использует как плавающее рабочее окно). */
const DevToolsFloat = styled.div`
  position: fixed;
  min-width: 240px;
  max-width: 320px;
  background: ${DS2_VARS.drawerBg};
  backdrop-filter: ${DS2_VARS.dockFilter};
  -webkit-backdrop-filter: ${DS2_VARS.dockFilter};
  border: 1px solid ${DS2_VARS.dockBorder};
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  z-index: 110; /* выше mini-rail'а (99) и главного dock'а (101) */
  overflow: hidden;
  user-select: none;
`;

const DevToolsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid ${DS2_VARS.g200};
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
`;

const DevToolsTitle = styled.span`
  flex: 1;
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${DS2_VARS.g600};
  white-space: nowrap;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DevToolsHeaderBtn = styled.button<{ $active?: boolean }>`
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 5px;
  background: ${({ $active }) =>
    $active ? DS2_VARS.dockBtnActiveBg : 'transparent'};
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g500)};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.12s ease,
    color 0.12s ease;
  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }
  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
  svg {
    width: 13px;
    height: 13px;
    stroke-width: 1.6;
  }
`;

const DevToolsMenu = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px;
`;

const DevToolsMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: ${DS2_VARS.ink};
  font-family: ${DS2_VARS.fontSans};
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s ease;
  &:hover:not(:disabled) {
    background: ${DS2_VARS.g100};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: -2px;
  }
  svg {
    width: 14px;
    height: 14px;
    stroke-width: 1.6;
    flex-shrink: 0;
    color: ${DS2_VARS.g500};
  }
`;

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

/* IconSave — дискета (classic save). В edit-mode подменяет IconEdit
   на той же позиции mini-rail'а, сохраняя muscle-memory юзера. */
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

/* IconUndo — дуга со стрелкой влево. */
const IconUndo = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 9h8a4 4 0 010 8h-2" />
    <path d="M7.5 6L5 9l2.5 3" />
  </svg>
);

/* IconRedo — дуга со стрелкой вправо (зеркало IconUndo). */
const IconRedo = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 9H7a4 4 0 000 8h2" />
    <path d="M12.5 6L15 9l-2.5 3" />
  </svg>
);

/* IconDiscard — корзина (discard = выкинуть несохранённые изменения). */
const IconDiscard = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 6h12" />
    <path d="M7.5 6V4.5h5V6" />
    <path d="M5.5 6l.8 9.5a1 1 0 001 .9h5.4a1 1 0 001-.9L14.5 6" />
    <path d="M8.5 9v5M11.5 9v5" />
  </svg>
);

/* IconWrench — гаечный ключ, канонический символ «инструменты». */
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

/* IconPin — канцелярская кнопка. */
const IconPin = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 3v4l-2.5 3.5h5L10 7" />
    <path d="M10 11v5M6 10.5h8" />
  </svg>
);

/* IconPinSlash — канцелярская кнопка с диагональной чертой = unpin. */
const IconPinSlash = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 3v4l-2.5 3.5h5L10 7" />
    <path d="M10 11v5M6 10.5h8" />
    <path d="M3.5 3.5l13 13" />
  </svg>
);

/* IconClose — крестик для закрытия панели. */
const IconCloseX = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 5l10 10M15 5L5 15" />
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

/** Hydrate persisted DevToolsPanel state из localStorage один раз при
 *  mount'е. Держим position и pinned-флаг между перезагрузками, чтобы
 *  юзер не перетаскивал панель каждый раз в удобное место. */
interface DevToolsPanelState {
  x: number;
  y: number;
  pinned: boolean;
}
function useDevToolsPanelState(): {
  open: boolean;
  setOpen: (v: boolean) => void;
  pinned: boolean;
  setPinned: (v: boolean) => void;
  position: { x: number; y: number };
  setPosition: (p: { x: number; y: number }) => void;
} {
  const [open, setOpen] = useState(false);
  const [pinned, setPinnedInner] = useState(false);
  const [position, setPositionInner] = useState<{ x: number; y: number }>({
    x: 40,
    y: 140,
  });
  /* Read once */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DEVTOOLS_LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<DevToolsPanelState>;
      if (
        typeof parsed.x === 'number' &&
        typeof parsed.y === 'number'
      ) {
        setPositionInner({ x: parsed.x, y: parsed.y });
      }
      if (typeof parsed.pinned === 'boolean') {
        setPinnedInner(parsed.pinned);
      }
    } catch {
      /* ignore corrupt JSON */
    }
  }, []);
  /* Persist on change */
  const persist = (next: Partial<DevToolsPanelState>) => {
    try {
      const current: DevToolsPanelState = {
        x: position.x,
        y: position.y,
        pinned,
      };
      localStorage.setItem(
        DEVTOOLS_LS_KEY,
        JSON.stringify({ ...current, ...next }),
      );
    } catch {
      /* quota / sandboxed iframe */
    }
  };
  const setPinned = (v: boolean) => {
    setPinnedInner(v);
    persist({ pinned: v });
  };
  const setPosition = (p: { x: number; y: number }) => {
    setPositionInner(p);
    persist({ x: p.x, y: p.y });
  };
  return { open, setOpen, pinned, setPinned, position, setPosition };
}

export const DashboardSideRail: FC = () => {
  const { openedDrawer, toggleDrawer, isDockCollapsed, setHasMiniRail } =
    useShell();
  const onDashboard = useOnDashboardRoute();
  const dockMetrics = useMainDockMetrics();
  const dispatch = useDispatch();
  const chartIds = useChartIds();
  const devtools = useDevToolsPanelState();
  const devToolsPanelRef = useRef<HTMLDivElement | null>(null);

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
  const dashboardId = useSelector<RootState, number | undefined>(
    state => state.dashboardInfo?.id,
  );
  /* Длины undo/redo-стеков. dashboardLayout — это undo/redo-reducer
     (state.past / state.future). В edit-mode показываем/отключаем
     кнопки Undo/Redo по соответствующей длине. */
  const undoLength = useSelector<RootState, number>(
    state => (state.dashboardLayout as any)?.past?.length ?? 0,
  );
  const redoLength = useSelector<RootState, number>(
    state => (state.dashboardLayout as any)?.future?.length ?? 0,
  );

  /* ─── Action handlers ───────────────────────────────────────────── */

  /* Enter edit mode — повторяет handleEnterEditMode из Header.jsx
     один-в-один: logEvent + setEditMode(true) + clearDashboardHistory
     + setUnsavedChanges(false). Без clearDashboardHistory и
     setUnsavedChanges toolbar/sidebar чартов рендерится, но undo/redo
     history остаётся из прошлой сессии и hasUnsavedChanges может
     остаться true — некоторые компоненты блокируют DnD в таком
     состоянии. Поэтому делаем ТАК ЖЕ как оригинал. */
  const handleEdit = useCallback(() => {
    dispatch(
      logEventAction(LOG_ACTIONS_TOGGLE_EDIT_DASHBOARD, { edit_mode: true }),
    );
    dispatch(setEditModeAction(true));
    dispatch(clearDashboardHistoryAction());
    dispatch(setUnsavedChangesAction(false));
  }, [dispatch]);

  /* Save в edit-mode — триггерим существующую primary-кнопку Save в
     Header'е (она уже держит всю тяжёлую overwriteDashboard-логику:
     сбор metadata, position-data limit check, onSave thunk). Кликаем
     её программно — логика edit-mode полностью совпадает, никаких
     дублей кода. Если кнопка disabled (hasUnsavedChanges === false),
     клик no-op. */
  const handleSave = useCallback(() => {
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-test="header-save-button"]',
    );
    btn?.click();
  }, []);

  /* Undo/Redo — прямые layout-actions над dashboardLayout
     redux-undo-reducer'ом. Disabled когда past/future пусты (нет
     чего отменять/повторять). */
  const handleUndo = useCallback(() => {
    dispatch(undoLayoutAction());
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    // @ts-ignore redoLayoutAction — setUnsavedChangesAfterAction thunk
    dispatch(redoLayoutAction());
  }, [dispatch]);

  /* Discard changes — повторяет discardChanges() из Header.jsx:
     удаляем из URL параметр `edit` и перезагружаем страницу.
     Reload стирает в-памяти state → несохранённые изменения
     откатываются до последнего persisted-состояния дашборда. */
  const handleDiscard = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    window.location.assign(url.toString());
  }, []);

  /* Refresh — logEvent + onRefresh thunk. Disabled-логику убрал:
     оригинал через `if (!isLoading)` просто молча ничего не делал, а
     юзер видел disabled-кнопку и писал «не работает». Пусть всегда
     clickable: при повторном клике во время загрузки thunk сам
     разберётся (onRefresh идемпотентен). */
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

  /* Toggle DevTools floating panel. */
  const handleToggleDevTools = useCallback(() => {
    devtools.setOpen(!devtools.open);
  }, [devtools]);

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
      /* «Инструменты разработчика» — единая иконка (гаечный ключ),
         которая открывает floating-панель. В панели: Редактировать
         дашборд (view), или Отменить изменения / Отменить действие /
         Повторить действие (edit). Панель pin'абл — остаётся
         открытой и перемещается по экрану для удобной работы. */
      {
        kind: 'action',
        id: 'devtools',
        label: t('Инструменты разработчика'),
        icon: <IconWrench />,
        onClick: handleToggleDevTools,
      },
    ];
    /* Save — отдельной иконкой только в edit-mode, рядом с DevTools.
       Мышечная память: справа = «сохранить и выйти». */
    if (editMode) {
      arr.push({
        kind: 'action',
        id: 'save',
        label: t('Сохранить дашборд'),
        icon: <IconSave />,
        onClick: handleSave,
      });
    }
    return arr;
  }, [
    topLevelPagesCount,
    editMode,
    handleRefresh,
    handleToggleDevTools,
    handleSave,
  ]);

  /* ─── Drag-handler для DevTools panel ───────────────────────────── */
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  const handleDragStart = useCallback(
    (e: ReactMouseEvent) => {
      /* Игнорируем клик на кнопках внутри header'а (pin/close) —
         у них свой click-handler. Определяем по tag==='BUTTON'. */
      if ((e.target as HTMLElement).closest('button')) return;
      const panel = devToolsPanelRef.current;
      if (!panel) return;
      e.preventDefault();
      const r = panel.getBoundingClientRect();
      dragOffsetRef.current = {
        dx: e.clientX - r.left,
        dy: e.clientY - r.top,
      };
      const onMove = (ev: MouseEvent) => {
        if (!dragOffsetRef.current) return;
        /* Сохраняем в bounds viewport'а — минимум 10px от каждой грани,
           чтобы панель не убежала за край и не потерялась. */
        const pw = panel.offsetWidth;
        const ph = panel.offsetHeight;
        const nx = Math.max(
          10,
          Math.min(window.innerWidth - pw - 10, ev.clientX - dragOffsetRef.current.dx),
        );
        const ny = Math.max(
          10,
          Math.min(window.innerHeight - ph - 10, ev.clientY - dragOffsetRef.current.dy),
        );
        devtools.setPosition({ x: nx, y: ny });
      };
      const onUp = () => {
        dragOffsetRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [devtools],
  );

  /* Click-outside закрывает panel ТОЛЬКО когда он не pinned. */
  useEffect(() => {
    if (!devtools.open || devtools.pinned) return undefined;
    const onDown = (e: MouseEvent) => {
      const panel = devToolsPanelRef.current;
      if (!panel) return;
      if (panel.contains(e.target as Node)) return;
      /* Клик по mini-rail DevTools-кнопке тоже не закрывает — он сам
         toggle'ит панель; иначе получим open→instant-close. */
      const target = e.target as Element;
      if (target.closest?.('button[aria-label="Инструменты разработчика"]'))
        return;
      devtools.setOpen(false);
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [devtools.open, devtools.pinned, devtools]);

  /* Esc закрывает panel (standard dismiss). Unpin при желании сначала. */
  useEffect(() => {
    if (!devtools.open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') devtools.setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [devtools.open, devtools]);

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
          const isDrawerItem = item.kind === 'drawer';
          const isActive = isDrawerItem
            ? openedDrawer === item.drawer
            : item.kind === 'action' &&
              item.id === 'devtools' &&
              devtools.open;
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
      {devtools.open && (
        <DevToolsFloat
          ref={devToolsPanelRef}
          role="dialog"
          aria-label={t('Инструменты разработчика')}
          style={{ left: devtools.position.x, top: devtools.position.y }}
        >
          <DevToolsHeader onMouseDown={handleDragStart}>
            <DevToolsTitle>{t('Инструменты разработчика')}</DevToolsTitle>
            <DevToolsHeaderBtn
              type="button"
              $active={devtools.pinned}
              aria-label={devtools.pinned ? t('Открепить') : t('Закрепить')}
              title={devtools.pinned ? t('Открепить') : t('Закрепить')}
              onClick={() => devtools.setPinned(!devtools.pinned)}
            >
              {devtools.pinned ? <IconPinSlash /> : <IconPin />}
            </DevToolsHeaderBtn>
            <DevToolsHeaderBtn
              type="button"
              aria-label={t('Закрыть')}
              title={t('Закрыть (Esc)')}
              onClick={() => devtools.setOpen(false)}
            >
              <IconCloseX />
            </DevToolsHeaderBtn>
          </DevToolsHeader>
          <DevToolsMenu>
            {editMode ? (
              <>
                <DevToolsMenuItem
                  type="button"
                  onClick={handleUndo}
                  disabled={undoLength < 1}
                >
                  <IconUndo />
                  {t('Отменить действие')}
                </DevToolsMenuItem>
                <DevToolsMenuItem
                  type="button"
                  onClick={handleRedo}
                  disabled={redoLength < 1}
                >
                  <IconRedo />
                  {t('Повторить действие')}
                </DevToolsMenuItem>
                <DevToolsMenuItem
                  type="button"
                  onClick={handleDiscard}
                >
                  <IconDiscard />
                  {t('Отменить изменения')}
                </DevToolsMenuItem>
              </>
            ) : (
              userCanEdit && (
                <DevToolsMenuItem
                  type="button"
                  onClick={() => {
                    handleEdit();
                    /* После входа в edit оставляем панель открытой —
                       юзер часто сразу хочет undo/redo/discard. */
                  }}
                >
                  <IconEdit />
                  {t('Редактировать дашборд')}
                </DevToolsMenuItem>
              )
            )}
          </DevToolsMenu>
        </DevToolsFloat>
      )}
    </>
  );
};
