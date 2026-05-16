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
 * DevToolsPanel — плавающее окно «Инструменты разработчика».
 *
 * Два состояния:
 *   • pinned (default) — стандартный bottom-sheet: центрирован по
 *     горизонтали, прикреплён к низу viewport'а над dock'ом, размеры
 *     `min(96vw, 1200px) × min(640px, 80vh)`. Поведение идентично
 *     обычному Shell Drawer'у.
 *   • unpinned — floating: абсолютное `left/top/width/height` из
 *     persist'а, draggable за header, resize: both через native CSS.
 *
 * Reset-иконка в header'е возвращает окно в pinned-состояние (default
 * bottom-sheet). Pin/unpin + позиция + размер сохраняются в
 * localStorage между перезагрузками. По умолчанию окно pinned —
 * открывается всегда в стандартной позиции.
 *
 * Content — 4 tile-кнопки в ToolsDrawer-стиле (Sections/Grid/Tile):
 * Редактировать/Сохранить, Отменить действие, Повторить действие,
 * Отменить изменения. Disabled-состояния повторяют edit-mode-
 * зависимости из Header.jsx.
 */
import { styled, t } from '@superset-ui/core';
import {
  type FC,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import type { RootState } from 'src/dashboard/types';
import {
  setEditMode as setEditModeAction,
  setUnsavedChanges as setUnsavedChangesAction,
  savePublished as savePublishedAction,
} from 'src/dashboard/actions/dashboardState';
import { useShell } from 'src/views/components/Shell/ShellContext';
import {
  clearDashboardHistory as clearDashboardHistoryAction,
  undoLayoutAction,
  redoLayoutAction,
} from 'src/dashboard/actions/dashboardLayout';
import { LOG_ACTIONS_TOGGLE_EDIT_DASHBOARD } from 'src/logger/LogUtils';
import { logEvent as logEventAction } from 'src/logger/actions';

/* ─── localStorage key + types ───────────────────────────────────── */

/* v4 — ключ с полным набором полей, включая pinned. По запросу:
   «координаты должны сохраняться всегда». Храним pinned + x/y + w/h,
   чтобы при повторном открытии панель восстановила своё состояние
   как было закрыто (pinned или floating с конкретной позицией). */
const LS_KEY = 'superset.shell.devtools.panel.v4';

interface PersistState {
  pinned: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

/* Default-позиция = стандартный bottom-sheet (как Shell Drawer):
   1200×640 по центру горизонтально, прижат к низу viewport'а над
   dock'ом (92px = DS2_VARS.drawerBottom). Используется при первом
   открытии и после клика «Сбросить позицию». */
const DEFAULT_BOTTOM_GAP = 92;

function defaultSize(): { w: number; h: number } {
  return {
    w: Math.min(1200, Math.round(window.innerWidth * 0.96)),
    h: Math.min(640, Math.round(window.innerHeight * 0.8)),
  };
}
function defaultPos(w: number, h: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.round((window.innerWidth - w) / 2)),
    y: Math.max(0, window.innerHeight - h - DEFAULT_BOTTOM_GAP),
  };
}
function defaultPersist(): PersistState {
  const { w, h } = defaultSize();
  const { x, y } = defaultPos(w, h);
  return { pinned: true, x, y, w, h };
}

/* ─── Styled ─────────────────────────────────────────────────────── */

/** Основной контейнер.
 *
 *  Позиция/размер ВСЕГДА применяются через inline-style на DOM-ref'е
 *  (left/top/width/height), независимо от pinned. Так мы полностью
 *  уходим от React state → styled class → layout → ResizeObserver loop.
 *
 *  $pinned контролирует ТОЛЬКО:
 *   • `resize: none` (pinned) vs `resize: both` (unpinned);
 *   • cursor на header'е (grab в unpinned, default в pinned).
 *
 *  Т.е. «pin» = «зафиксировать окно на текущем месте», а не вернуть
 *  в default. Для возврата в default — отдельная кнопка reset.
 */
const Panel = styled.div<{ $pinned: boolean; $animateIn: boolean }>`
  position: fixed;
  box-sizing: border-box;
  background: ${DS2_VARS.drawerBg};
  backdrop-filter: ${DS2_VARS.drawerFilter};
  -webkit-backdrop-filter: ${DS2_VARS.drawerFilter};
  border: 1px solid ${DS2_VARS.drawerBorder};
  border-radius: ${DS2_VARS.drawerRadius};
  box-shadow: ${DS2_VARS.drawerShadow};
  display: flex;
  flex-direction: column;
  z-index: 110;
  /* overflow: auto — нужен для того, чтобы CSS resize:both
     отрисовывал и КЛИК'АЛ native resize-handle в правом нижнем углу.
     С overflow:hidden handle иногда не реагирует на mouse в
     Chromium (зависит от версии). Чтобы scroll'ы не появлялись —
     выставлен min-width/height достаточный для всего контента
     (400×240), а Body внутри имеет свой overflow-y:auto. */
  overflow: auto;
  user-select: none;

  /* Min-width 240 = после переезда 4 edit-actions в Toolbar основное
     окно может сужаться до 1 колонки grid. Header при 240px: Title
     с min-width:0 + ellipsis + 3×IconBtn 24px + gaps ≈ 156px —
     помещается. Body inner ~196px → 1 тайл minmax(min(116px,100%),1fr). */
  min-width: 240px;
  min-height: 240px;
  max-width: 100vw;
  max-height: 100vh;
  /* Только resize отличается — disabled когда pinned (фиксация),
     both когда unpinned (юзер может ресайзить углом). */
  resize: ${({ $pinned }) => ($pinned ? 'none' : 'both')};

  /* Плавный transition между pin/unpin — опацити/тень, без layout-
     свойств (position/size — inline, не участвуют). */
  transition:
    box-shadow 0.18s ${DS2_VARS.ease},
    border-color 0.18s ${DS2_VARS.ease};

  /* В unpinned курсор grab на всей панели — drag any-where. Кнопки/
     tile'ы внутри имеют свой cursor:pointer и перебивают. */
  cursor: ${({ $pinned }) => ($pinned ? 'default' : 'grab')};
  &:active {
    cursor: ${({ $pinned }) => ($pinned ? 'default' : 'grabbing')};
  }

  ${({ $animateIn }) =>
    $animateIn
      ? `animation: devtoolsEnter 0.28s cubic-bezier(0.32, 0.72, 0, 1);`
      : ''}

  @keyframes devtoolsEnter {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

/* ─── Pinned Toolbar (4 edit-actions над Panel) ──────────────────── */

/* Toolbar — отдельное закреплённое окно над Panel с 4 ключевыми
   действиями: edit/save, undo, redo, discard. Визуально независимое
   окно (свой border/тень/фон), но геометрически синхронизировано с
   Panel через applyStyle()/handleDragStart()/ResizeObserver.
   Lifecycle привязан к Panel: открывается/закрывается вместе. */
const TOOLBAR_GAP_PX = 10;
const TOOLBAR_HEIGHT_PX = 64;
/* Container query breakpoint: ниже ширины — labels скрываются,
   остаются только иконки + tooltip (через title-attr). 440px = 4 кнопки
   с текстом «Сохранить дашборд» (~110px каждая) ещё читаемы. */
const TOOLBAR_COMPACT_BREAKPOINT = 440;

const Toolbar = styled.div<{ $pinned: boolean; $animateIn: boolean }>`
  position: fixed;
  box-sizing: border-box;
  background: ${DS2_VARS.drawerBg};
  backdrop-filter: ${DS2_VARS.drawerFilter};
  -webkit-backdrop-filter: ${DS2_VARS.drawerFilter};
  border: 1px solid ${DS2_VARS.drawerBorder};
  border-radius: ${DS2_VARS.drawerRadius};
  box-shadow: ${DS2_VARS.drawerShadow};
  z-index: 110;
  height: ${TOOLBAR_HEIGHT_PX}px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${DS2_SPACE.s1 + 2}px;
  padding: 8px 12px;
  align-items: stretch;
  user-select: none;
  container-type: inline-size;
  container-name: devtools-toolbar;
  cursor: ${({ $pinned }) => ($pinned ? 'default' : 'grab')};
  &:active {
    cursor: ${({ $pinned }) => ($pinned ? 'default' : 'grabbing')};
  }
  ${({ $animateIn }) =>
    $animateIn
      ? `animation: devtoolsEnter 0.28s cubic-bezier(0.32, 0.72, 0, 1);`
      : ''}
`;

const ToolbarBtn = styled.button<{ $accent: string; $disabled?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${DS2_SPACE.s2}px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 8px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  color: ${({ $accent, $disabled }) => ($disabled ? DS2_VARS.g500 : $accent)};
  transition:
    background 0.12s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease};
  min-width: 0;
  &:hover {
    background: ${({ $disabled }) =>
      $disabled ? 'transparent' : DS2_VARS.tileHoverBg};
    border-color: ${({ $disabled }) =>
      $disabled ? DS2_VARS.g200 : DS2_VARS.tileHoverBorder};
  }
  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
  svg {
    width: 16px;
    height: 16px;
    stroke-width: 1.6;
    flex-shrink: 0;
  }
`;

const ToolbarLabel = styled.span`
  font-size: var(--fs-meta);
  font-weight: 600;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @container devtools-toolbar (max-width: ${TOOLBAR_COMPACT_BREAKPOINT}px) {
    display: none;
  }
`;

/** Drag-handle сверху (как у Shell Drawer). Визуально 36×4 pill. */
const DragHandle = styled.div`
  width: 36px;
  height: 4px;
  margin: 10px auto 0;
  border-radius: 2px;
  background: ${DS2_VARS.g300};
  opacity: 0.5;
  flex-shrink: 0;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  padding: 8px 22px 10px;
  flex-shrink: 0;
  gap: 12px;
`;

const Title = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-meta);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${DS2_VARS.g600};
  /* Ellipsis когда панель узкая — чтобы длинный заголовок не
     выталкивал кнопки за правый край Panel'а. */
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const IconBtn = styled.button<{ $active?: boolean }>`
  width: 24px;
  height: 24px;
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
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease};
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

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 22px 18px;
`;

/* ─── Sections / Grid / Tile — в стиле ToolsDrawer ───────────────── */

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 0 0;
  font-family: ${DS2_VARS.fontSans};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${DS2_SPACE.s2}px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(116px, 100%), 1fr));
  gap: ${DS2_SPACE.s1 + 2}px;
`;

const Tile = styled.button<{ $disabled?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: ${DS2_SPACE.s2}px;
  padding: 14px 10px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition:
    background 0.12s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease},
    transform 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${({ $disabled }) =>
      $disabled ? 'transparent' : DS2_VARS.tileHoverBg};
    border-color: ${({ $disabled }) =>
      $disabled ? 'transparent' : DS2_VARS.tileHoverBorder};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

const TileIcon = styled.div<{ $accent: string; $disabled?: boolean }>`
  position: relative;
  width: 38px;
  height: 38px;
  box-sizing: border-box;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $accent, $disabled }) =>
    $disabled
      ? DS2_VARS.bg3
      : `color-mix(in oklab, ${$accent} 12%, ${DS2_VARS.bg3})`};
  border: 1px solid ${DS2_VARS.g200};
  color: ${({ $accent, $disabled }) => ($disabled ? DS2_VARS.g400 : $accent)};
  filter: ${({ $disabled }) => ($disabled ? 'grayscale(1)' : 'none')};

  svg {
    width: 19px;
    height: 19px;
    stroke-width: 1.6;
  }
`;

const TileName = styled.span<{ $disabled?: boolean }>`
  font-size: var(--fs-meta);
  font-weight: 600;
  color: ${({ $disabled }) => ($disabled ? DS2_VARS.g500 : DS2_VARS.ink)};
  text-align: center;
  line-height: 1.1;
`;

/* ─── Inline SVG ─────────────────────────────────────────────────── */

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

/* IconBuilderTile — «stacked blocks» для tile «Конструктор». */
const IconBuilderTile = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="6" height="6" rx="1" />
    <rect x="11" y="3" width="6" height="6" rx="1" />
    <rect x="3" y="11" width="6" height="6" rx="1" />
    <path d="M14 11v6M11 14h6" />
  </svg>
);

/* IconPublish — глобус с галочкой: «опубликовано/доступно всем». */
const IconPublish = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="10" cy="10" r="7" />
    <path d="M3 10h14M10 3a10 10 0 010 14M10 3a10 10 0 000 14" />
  </svg>
);

/* IconUnpublish — глобус с чертой: «снять с публикации». */
const IconUnpublish = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="10" cy="10" r="7" />
    <path d="M3 10h14M10 3a10 10 0 010 14M10 3a10 10 0 000 14" />
    <path d="M4 4l12 12" />
  </svg>
);

/* IconTemplates — иконка «шаблоны»: бенто-разметка (asymmetric grid).
   TODO: реализовать раскладки (bento, masonry, equal-grid). Сейчас
   tile только placeholder, чтобы зарезервировать место в DevTools. */
const IconTemplates = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="11" y="3" width="6" height="5" rx="1" />
    <rect x="11" y="9" width="6" height="3" rx="1" />
    <rect x="3" y="13" width="14" height="4" rx="1" />
  </svg>
);

/* IconGrid — иконка «сетка» (3×3 dots) для tile «Сетка». */
const IconGrid = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="4" height="4" rx="0.5" />
    <rect x="8.5" y="3" width="4" height="4" rx="0.5" />
    <rect x="14" y="3" width="3" height="4" rx="0.5" />
    <rect x="3" y="8.5" width="4" height="4" rx="0.5" />
    <rect x="8.5" y="8.5" width="4" height="4" rx="0.5" />
    <rect x="14" y="8.5" width="3" height="4" rx="0.5" />
    <rect x="3" y="14" width="4" height="3" rx="0.5" />
    <rect x="8.5" y="14" width="4" height="3" rx="0.5" />
    <rect x="14" y="14" width="3" height="3" rx="0.5" />
  </svg>
);

/* Pin: вертикальная кнопка с шапкой. Active = pinned. */
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

/* Reset position icon — домик / точка с якорем. */
const IconReset = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 10l7-6 7 6" />
    <path d="M5 9.5V16h10V9.5" />
  </svg>
);

/* Gear icon — открывает DashboardSettingsDrawer (через Shell drawer). */
const IconGear = (): JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="10" cy="10" r="2.2" />
    <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.6 5.6l1.4 1.4M13 13l1.4 1.4M5.6 14.4L7 13M13 7l1.4-1.4" />
  </svg>
);

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

/* ─── Helpers: persist ───────────────────────────────────────────── */

function readPersist(): Partial<PersistState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const pinned =
      typeof parsed.pinned === 'boolean' ? parsed.pinned : undefined;
    const w = typeof parsed.w === 'number' ? parsed.w : undefined;
    const h = typeof parsed.h === 'number' ? parsed.h : undefined;
    const x = typeof parsed.x === 'number' ? parsed.x : undefined;
    const y = typeof parsed.y === 'number' ? parsed.y : undefined;
    return { pinned, x, y, w, h };
  } catch {
    return {};
  }
}

function writePersist(patch: Partial<PersistState>): void {
  try {
    const curr = readPersist();
    const merged = { ...curr, ...patch };
    localStorage.setItem(LS_KEY, JSON.stringify(merged));
  } catch {
    /* noop */
  }
}

/* ─── Component ──────────────────────────────────────────────────── */

interface DevToolsPanelProps {
  onClose: () => void;
}

export const DevToolsPanel: FC<DevToolsPanelProps> = ({ onClose }) => {
  const dispatch = useDispatch();
  const { toggleDrawer, openedDrawer, builderPanelOpen, toggleBuilderPanel } =
    useShell();
  const editMode = useSelector<RootState, boolean>(
    state => state.dashboardState?.editMode ?? false,
  );
  const userCanEdit = useSelector<RootState, boolean>(
    state => state.dashboardInfo?.dash_edit_perm ?? false,
  );
  const undoLength = useSelector<RootState, number>(
    state => (state.dashboardLayout as any)?.past?.length ?? 0,
  );
  const redoLength = useSelector<RootState, number>(
    state => (state.dashboardLayout as any)?.future?.length ?? 0,
  );
  const hasUnsavedChanges = useSelector<RootState, boolean>(
    state => state.dashboardState?.hasUnsavedChanges ?? false,
  );
  const isPublished = useSelector<RootState, boolean>(
    state => state.dashboardState?.isPublished ?? false,
  );
  const dashboardId = useSelector<RootState, number | undefined>(
    state => state.dashboardInfo?.id,
  );

  /* ─── Pinned state (React) ─────────────────────────────────────── */

  /* pinned: при ПЕРВОМ открытии (LS пустой) — true (default). При
     повторных открытиях — восстанавливаем сохранённое значение,
     чтобы юзер снова увидел панель в том же состоянии (pinned или
     unpinned), в каком закрыл. Координаты тоже persist'ятся. */
  const [pinned, setPinnedState] = useState<boolean>(() => {
    const p = readPersist().pinned;
    return p === undefined ? true : p;
  });
  const setPinned = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setPinnedState(prev => {
        const v = typeof next === 'function' ? next(prev) : next;
        writePersist({ pinned: v });
        return v;
      });
    },
    [],
  );

  /* ─── Persisted position/size (ref, не React state) ────────────── */

  /* Храним в ref чтобы НЕ ре-рендерить Panel при каждом пиксельном
     движении drag'а или resize. Панель читает эти значения один раз
     при mount'е и применяет через inline style. Дальше браузер сам
     управляет width/height через CSS `resize: both`, а мы только
     наблюдаем через ResizeObserver и пишем в localStorage без setState.
     Это ломает прошлый loop: setSize → re-render → styled class →
     layout → ResizeObserver → setSize → ∞. */
  const persistedRef = useRef<Partial<PersistState>>(readPersist());
  const defaults = useRef<PersistState>(defaultPersist());
  const posRef = useRef<{ x: number; y: number }>({
    x: persistedRef.current.x ?? defaults.current.x,
    y: persistedRef.current.y ?? defaults.current.y,
  });
  const sizeRef = useRef<{ w: number; h: number }>({
    w: persistedRef.current.w ?? defaults.current.w,
    h: persistedRef.current.h ?? defaults.current.h,
  });

  /* ─── Action handlers ──────────────────────────────────────────── */

  const handleEdit = useCallback(() => {
    dispatch(
      logEventAction(LOG_ACTIONS_TOGGLE_EDIT_DASHBOARD, { edit_mode: true }),
    );
    dispatch(setEditModeAction(true));
    dispatch(clearDashboardHistoryAction());
    dispatch(setUnsavedChangesAction(false));
  }, [dispatch]);

  const handleSave = useCallback(() => {
    /* В DashboardHeader save-кнопка скрыта (display:none), но остаётся
       в DOM — overwriteDashboard живёт там и подтягивает все
       callbacks/colors/cross-filters/legacy state. AntD/emotion
       фильтрует data-* пропсы у styled-обёрток → `data-test=
       "dashboard-edit-actions"` не доходит до DOM. Ищем primary-кнопку
       в `.right-button-panel` (это header-actions area). Discard
       рядом — secondary, поэтому отличаем по классу ant-btn-primary. */
    const headerSaveBtn =
      document.querySelector<HTMLButtonElement>(
        '.right-button-panel button.ant-btn-primary',
      ) ||
      document.querySelector<HTMLButtonElement>(
        '[data-test="header-save-button"]',
      );
    headerSaveBtn?.click();
  }, []);

  const handleUndo = useCallback(() => {
    dispatch(undoLayoutAction());
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    // @ts-ignore — redoLayoutAction это setUnsavedChangesAfterAction thunk
    dispatch(redoLayoutAction());
  }, [dispatch]);

  /* handleRefresh / IconRefreshTile удалены вместе с unused tile —
     refresh теперь через mini-rail Refresh-иконку, которая защищена
     от случайных кликов через подтверждение. */

  /* Publish / Unpublish. Не триггерит полный refresh дашборда —
     dispatch'им savePublished thunk, он патчит только поле
     `published` через PUT /api/v1/dashboard/:id и обновляет
     dashboardState.isPublished. Чарты не пересчитываются, лейаут
     не мигает. */
  const handleTogglePublish = useCallback(() => {
    if (dashboardId === undefined) return;
    // @ts-ignore — savePublished thunk не типизирован
    dispatch(savePublishedAction(dashboardId, !isPublished));
  }, [dispatch, dashboardId, isPublished]);

  const handleDiscard = useCallback(() => {
    /* Перед reload'ом ставим флаг, чтобы после перезагрузки
       DashboardSideRail сразу же восстановил DevToolsPanel-open.
       Юзер жаловался: «после нажатия отменить изменения не
       сворачивай окно инструменты разработчика». Reload стирает
       React-state, поэтому сохраняем намерение в sessionStorage. */
    try {
      sessionStorage.setItem('superset.shell.devtools.reopenAfterReload', '1');
    } catch {
      /* noop */
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    window.location.assign(url.toString());
  }, []);

  /* ─── Inline-style apply (ВСЕГДА, ref-based) ───────────────────── */

  const panelRef = useRef<HTMLDivElement | null>(null);
  /* Toolbar ref — синхронизируется с Panel через applyStyle/drag/resize.
     position: fixed; geometry устанавливается inline-стилем как у Panel. */
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  /** Записывает текущие posRef/sizeRef в inline-style панели
   *  (left/top/width/height) и clamp'ит в bounds viewport'а. Вызывается
   *  при mount'е и window.resize. Style всегда управляется inline-ом
   *  — и в pinned, и в unpinned, — styled лишь toggle'ит cursor и
   *  resize-свойство. Это значит «pin» фиксирует окно на текущем
   *  месте, не возвращает его в default. */
  const applyStyle = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    const w = Math.min(Math.max(240, sizeRef.current.w), window.innerWidth);
    const h = Math.min(Math.max(200, sizeRef.current.h), window.innerHeight);
    /* minY гарантирует место сверху для Toolbar: TOOLBAR_HEIGHT + GAP.
       Если panel.top < minY — Toolbar.top уйдёт в отрицательное и
       обрежется браузером. clamp здесь не даёт этому случиться. */
    const minY = TOOLBAR_HEIGHT_PX + TOOLBAR_GAP_PX;
    const x = Math.max(0, Math.min(window.innerWidth - w, posRef.current.x));
    const y = Math.max(
      minY,
      Math.min(window.innerHeight - h, posRef.current.y),
    );
    posRef.current = { x, y };
    sizeRef.current = { w, h };
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    /* Sync toolbar: ширина = Panel'у, top = Panel.top - height - gap. */
    const tb = toolbarRef.current;
    if (tb) {
      tb.style.left = `${x}px`;
      tb.style.top = `${y - TOOLBAR_HEIGHT_PX - TOOLBAR_GAP_PX}px`;
      tb.style.width = `${w}px`;
    }
  }, []);

  /* Apply один раз при mount'е и каждый раз когда toggle'ится pinned
     (на случай если юзер нажал reset — posRef/sizeRef обновились,
     но panel не знает — форсим apply). */
  useEffect(() => {
    applyStyle();
  }, [pinned, applyStyle]);

  /* ─── Drag (только unpinned) ───────────────────────────────────── */

  const dragRef = useRef<{
    dx: number;
    dy: number;
    source: 'panel' | 'toolbar';
  } | null>(null);

  /** mousedown на ЛЮБОМ месте Panel'а ИЛИ Toolbar'а (кроме интерактивных
   *  элементов). Drag за Toolbar = drag всего блока (Panel + Toolbar)
   *  как единого целого: offset запоминается от верхнего-левого угла
   *  Toolbar'а, при move корректируем `panel.top = ev.y - dy + TOOLBAR_H + GAP`.
   *  Source разделяет ветки в onMove чтобы корректно пересчитать
   *  координату Panel из mouse'а. */
  const handleDragStart = useCallback(
    (e: ReactMouseEvent, source: 'panel' | 'toolbar') => {
      if (pinned) return;
      const target = e.target as HTMLElement;
      /* Не начинаем drag если клик был по:
         - button (close/pin/reset/tile/toolbar-btn)
         - любому элементу с role=button
         - input/textarea/select
         - ссылкам
         Это даёт юзеру взаимодействовать с содержимым без драга. */
      if (
        target.closest(
          'button, a, input, textarea, select, [role="button"], [contenteditable="true"]',
        )
      ) {
        return;
      }
      const panel = panelRef.current;
      const toolbar = toolbarRef.current;
      if (!panel) return;
      const r =
        source === 'toolbar' && toolbar
          ? toolbar.getBoundingClientRect()
          : panel.getBoundingClientRect();
      /* Native CSS `resize: both` (только Panel) использует правый нижний
         угол (~14×14px UA-shadow hit-zone). Если mousedown попал туда —
         НЕ начинаем drag и НЕ preventDefault'им, чтобы браузер мог
         запустить собственный resize. Toolbar без resize:both, проверка
         нужна только для source='panel'. */
      if (source === 'panel') {
        const RESIZE_HANDLE_SIZE = 18;
        const inResizeHandle =
          e.clientX >= r.right - RESIZE_HANDLE_SIZE &&
          e.clientY >= r.bottom - RESIZE_HANDLE_SIZE;
        if (inResizeHandle) return;
      }
      e.preventDefault();
      dragRef.current = {
        dx: e.clientX - r.left,
        dy: e.clientY - r.top,
        source,
      };
      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current || !panelRef.current) return;
        const pw = panelRef.current.offsetWidth;
        const ph = panelRef.current.offsetHeight;
        const minY = TOOLBAR_HEIGHT_PX + TOOLBAR_GAP_PX;
        const desiredX = ev.clientX - dragRef.current.dx;
        const desiredTop = ev.clientY - dragRef.current.dy;
        /* Если drag за toolbar — desiredTop это top toolbar'а, а нам
           нужен top panel'а: panel.top = toolbar.top + height + gap. */
        const panelTop =
          dragRef.current.source === 'toolbar'
            ? desiredTop + TOOLBAR_HEIGHT_PX + TOOLBAR_GAP_PX
            : desiredTop;
        const nx = Math.max(0, Math.min(window.innerWidth - pw, desiredX));
        const ny = Math.max(minY, Math.min(window.innerHeight - ph, panelTop));
        panelRef.current.style.left = `${nx}px`;
        panelRef.current.style.top = `${ny}px`;
        posRef.current = { x: nx, y: ny };
        const tb = toolbarRef.current;
        if (tb) {
          tb.style.left = `${nx}px`;
          tb.style.top = `${ny - TOOLBAR_HEIGHT_PX - TOOLBAR_GAP_PX}px`;
        }
      };
      const onUp = () => {
        dragRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        writePersist({ x: posRef.current.x, y: posRef.current.y });
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [pinned],
  );

  /* ─── Resize tracking (persist only, no setState) ──────────────── */

  useEffect(() => {
    if (pinned) return undefined;
    const el = panelRef.current;
    if (!el) return undefined;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      sizeRef.current = { w, h };
      /* Sync toolbar width — Panel меняет ширину через native CSS resize,
         Toolbar должен следовать synchronously, без debounce (визуальная
         связка важнее, чем localStorage write). Toolbar не имеет
         resize:both, поэтому ResizeObserver-loop здесь невозможен. */
      if (toolbarRef.current) {
        toolbarRef.current.style.width = `${w}px`;
      }
      /* debounce persist — не бомбим localStorage на каждый пиксель. */
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        writePersist({ w, h });
      }, 150);
    });
    ro.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      ro.disconnect();
    };
  }, [pinned]);

  /* ─── Bounds clamp on window resize ────────────────────────────── */

  useEffect(() => {
    const onResize = () => {
      applyStyle();
      writePersist({
        x: posRef.current.x,
        y: posRef.current.y,
        w: sizeRef.current.w,
        h: sizeRef.current.h,
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [applyStyle]);

  /* ─── Esc to close ─────────────────────────────────────────────── */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* ─── Handlers: pin/unpin + reset ──────────────────────────────── */

  const handlePinToggle = useCallback(() => {
    setPinned(v => !v);
  }, []);

  /* Reset — возвращает в default bottom-sheet позицию и размер
     (1200×640 по центру снизу, как Shell Drawer). Также pinned=true
     — default state. Persist обновляется. Inline-style применится
     через useEffect[pinned] на следующем рендере. */
  const handleReset = useCallback(() => {
    const d = defaultPersist();
    posRef.current = { x: d.x, y: d.y };
    sizeRef.current = { w: d.w, h: d.h };
    writePersist({ x: d.x, y: d.y, w: d.w, h: d.h, pinned: true });
    setPinned(true);
    /* Если pinned уже был true, useEffect на [pinned] не зафайрит
       (значение не меняется) — форсим apply вручную. */
    applyStyle();
  }, [setPinned, applyStyle]);

  /* ─── Enter-animation один раз при mount'е ─────────────────────── */

  const [animateIn, setAnimateIn] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setAnimateIn(false), 300);
    return () => clearTimeout(id);
  }, []);

  /* ─── Content: action tiles ────────────────────────────────────── */

  interface TileDef {
    key: string;
    label: string;
    accent: string;
    icon: ReactNode;
    onClick: () => void;
    disabled: boolean;
  }

  /* Главная кнопка меняется Edit ↔ Save по editMode. В edit-mode
     Save disabled пока нет несохранённых изменений (hasUnsavedChanges
     — тот же флаг, что гасит header-save-button). Без изменений
     нечего сохранять: кнопка серая, активна только «Отменить
     изменения» — выход из edit-режима. */
  const mainTile: TileDef = editMode
    ? {
        key: 'save',
        label: t('Сохранить дашборд'),
        accent: DS2_VARS.cSky,
        icon: <IconSave />,
        onClick: handleSave,
        disabled: !hasUnsavedChanges,
      }
    : {
        key: 'edit',
        label: t('Редактировать дашборд'),
        accent: DS2_VARS.cSky,
        icon: <IconEdit />,
        onClick: handleEdit,
        disabled: !userCanEdit,
      };

  /* Toolbar — 4 ключевых edit-action, рендерятся в отдельном Toolbar
     окне НАД Panel. Всегда в одну строку (grid 4 col), labels
     адаптивно скрываются через container query. */
  const toolbarTiles: TileDef[] = [
    mainTile,
    {
      key: 'undo',
      label: t('Отменить действие'),
      accent: DS2_VARS.cTangerine,
      icon: <IconUndo />,
      onClick: handleUndo,
      disabled: !editMode || undoLength < 1,
    },
    {
      key: 'redo',
      label: t('Повторить действие'),
      accent: DS2_VARS.cTangerine,
      icon: <IconRedo />,
      onClick: handleRedo,
      disabled: !editMode || redoLength < 1,
    },
    {
      key: 'discard',
      label: t('Отменить изменения'),
      accent: DS2_VARS.dn,
      icon: <IconDiscard />,
      onClick: handleDiscard,
      disabled: !editMode,
    },
  ];

  const tiles: TileDef[] = [
    /* Библиотека — плавающее окно (BuilderPanel) с табами «Чарты»/
       «Оформление». Параллельно DevToolsPanel, имеет свой
       draggable/resizable lifecycle. Toggle через ShellContext.
       Виден только в edit-mode (библиотека нужна при редактировании
       лейаута). */
    {
      key: 'builder',
      label: builderPanelOpen
        ? t('Закрыть библиотеку')
        : t('Открыть библиотеку'),
      accent: DS2_VARS.cViolet,
      icon: <IconBuilderTile />,
      onClick: toggleBuilderPanel,
      disabled: !editMode,
    },
    /* Tile «Сетка» — открывает Shell-drawer kind='gridSettings' (тот же
       bottom-sheet что и Каталог). Drawer содержит настройки grid-guides
       (постоянное отображение колонок + визуальная сетка + шаг сетки).
       Виден только в edit-mode. Toggle: повторный клик закрывает. */
    {
      key: 'grid',
      label:
        openedDrawer === 'gridSettings'
          ? t('Закрыть настройки сетки')
          : t('Сетка'),
      accent: DS2_VARS.cAmber,
      icon: <IconGrid />,
      onClick: () => toggleDrawer('gridSettings'),
      disabled: !editMode,
    },
    /* Tile «Шаблоны» — placeholder. Планируется: bento, masonry, equal
       grid и др. — алгоритм анализирует размеры существующих чартов и
       реорганизует layout под выбранный шаблон. См. план реализации в
       memory project_chart_templates_plan.md (предстоит создать).
       Сейчас disabled — заглушка для UX-резерва места в DevTools. */
    {
      key: 'templates',
      label: t('Шаблоны (скоро)'),
      accent: DS2_VARS.cViolet,
      icon: <IconTemplates />,
      onClick: () => {
        /* TODO: открыть TemplatesDrawer с выбором bento/masonry/etc. */
      },
      disabled: true,
    },
    /* Publish toggle — виден всегда, если юзер может редактировать
       дашборд. Иконка/лейбл меняются по isPublished. Dispatch
       savePublished thunk — патчит только `published`, не триггерит
       полный refresh чартов (юзер просил «чтобы не мигало и не
       пересчитывало дашборд»). */
    {
      key: 'publish',
      label: isPublished ? t('Снять с публикации') : t('Опубликовать дашборд'),
      accent: isPublished ? DS2_VARS.up : DS2_VARS.cSky,
      icon: isPublished ? <IconUnpublish /> : <IconPublish />,
      onClick: handleTogglePublish,
      /* В edit-mode публикация блокируется — сначала «Сохранить»
         изменения. Юзер в edit может нагрести неполный лейаут, и
         опубликование здесь рисковано (заказчики увидят draft). */
      disabled: editMode || !userCanEdit || dashboardId === undefined,
    },
    /* Tile «Настройки дашборда» — открывает Shell drawer с настройками
       (стратегия загрузки и др.). Доступен всегда: viewer'ы видят
       read-only. Использует тот же визуальный shell что Каталог /
       Фильтры — bottom-anchored panel min(96vw, 1200px) × min(640px, 80vh). */
    {
      key: 'settings',
      label: t('Настройки дашборда'),
      accent: DS2_VARS.cFuchsia,
      icon: <IconGear />,
      onClick: () => toggleDrawer('dashboardSettings'),
      disabled: false,
    },
  ];

  return (
    <>
      <Toolbar
        ref={toolbarRef}
        role="toolbar"
        aria-label={t('Действия редактора')}
        $pinned={pinned}
        $animateIn={animateIn}
        onMouseDown={e => handleDragStart(e, 'toolbar')}
        /* Initial inline-style — top вычисляется относительно Panel.top.
           Width = Panel.width. Sync с Panel через applyStyle/drag/resize. */
        style={{
          left: posRef.current.x,
          top: posRef.current.y - TOOLBAR_HEIGHT_PX - TOOLBAR_GAP_PX,
          width: sizeRef.current.w,
        }}
      >
        {toolbarTiles.map(tile => (
          <ToolbarBtn
            key={tile.key}
            type="button"
            $accent={tile.accent}
            $disabled={tile.disabled}
            disabled={tile.disabled}
            onClick={tile.onClick}
            aria-label={tile.label}
            title={tile.label}
          >
            {tile.icon}
            <ToolbarLabel>{tile.label}</ToolbarLabel>
          </ToolbarBtn>
        ))}
      </Toolbar>
      <Panel
        ref={panelRef}
        role="dialog"
        aria-label={t('Инструменты разработчика')}
        $pinned={pinned}
        $animateIn={animateIn}
        onMouseDown={e => handleDragStart(e, 'panel')}
        /* Initial inline-style с первого рендера — чтобы не было flash
           из 0,0 пока не отработает useEffect с applyStyle. */
        style={{
          left: posRef.current.x,
          top: posRef.current.y,
          width: sizeRef.current.w,
          height: sizeRef.current.h,
        }}
      >
        {pinned && <DragHandle />}
        <Header>
          <Title>{t('Инструменты разработчика')}</Title>
          <HeaderRight>
            <IconBtn
              type="button"
              $active={pinned}
              aria-label={pinned ? t('Открепить') : t('Закрепить')}
              title={pinned ? t('Открепить') : t('Закрепить')}
              aria-pressed={pinned}
              onClick={handlePinToggle}
            >
              <IconPin />
            </IconBtn>
            <IconBtn
              type="button"
              aria-label={t('Сбросить позицию')}
              title={t('Сбросить позицию')}
              onClick={handleReset}
            >
              <IconReset />
            </IconBtn>
            <IconBtn
              type="button"
              aria-label={t('Закрыть')}
              title={t('Закрыть (Esc)')}
              onClick={onClose}
            >
              <IconCloseX />
            </IconBtn>
          </HeaderRight>
        </Header>
        <Body>
          <Sections role="menu">
            <Section>
              <Grid>
                {tiles.map(tile => (
                  <Tile
                    key={tile.key}
                    type="button"
                    $disabled={tile.disabled}
                    disabled={tile.disabled}
                    onClick={tile.onClick}
                    aria-label={tile.label}
                    aria-disabled={tile.disabled}
                    aria-pressed={
                      tile.key === 'grid'
                        ? openedDrawer === 'gridSettings'
                        : tile.key === 'settings'
                          ? openedDrawer === 'dashboardSettings'
                          : undefined
                    }
                    title={tile.label}
                  >
                    <TileIcon $accent={tile.accent} $disabled={tile.disabled}>
                      {tile.icon}
                    </TileIcon>
                    <TileName $disabled={tile.disabled}>{tile.label}</TileName>
                  </Tile>
                ))}
              </Grid>
            </Section>
          </Sections>
        </Body>
      </Panel>
    </>
  );
};

export default DevToolsPanel;
