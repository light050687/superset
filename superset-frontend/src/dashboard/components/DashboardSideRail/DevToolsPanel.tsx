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
} from 'src/dashboard/actions/dashboardState';
import {
  clearDashboardHistory as clearDashboardHistoryAction,
  undoLayoutAction,
  redoLayoutAction,
} from 'src/dashboard/actions/dashboardLayout';
import { LOG_ACTIONS_TOGGLE_EDIT_DASHBOARD } from 'src/logger/LogUtils';
import { logEvent as logEventAction } from 'src/logger/actions';

/* ─── localStorage key + types ───────────────────────────────────── */

const LS_KEY = 'superset.shell.devtools.panel.v2';

interface PersistState {
  pinned: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

/* Значения по умолчанию для unpinned-режима (первый раз после
   click'а «открепить» — откуда начнём floating). */
const DEFAULT_UNPINNED_W = 640;
const DEFAULT_UNPINNED_H = 400;
const DEFAULT_UNPINNED_X = 80;
const DEFAULT_UNPINNED_Y = 120;

/* ─── Styled ─────────────────────────────────────────────────────── */

/** Основной контейнер. Две ветки стилей — по $pinned. */
const Panel = styled.div<{
  $pinned: boolean;
  $x: number;
  $y: number;
  $w: number;
  $h: number;
  $animateIn: boolean;
}>`
  position: fixed;
  background: ${DS2_VARS.drawerBg};
  backdrop-filter: ${DS2_VARS.drawerFilter};
  -webkit-backdrop-filter: ${DS2_VARS.drawerFilter};
  border: 1px solid ${DS2_VARS.drawerBorder};
  border-radius: ${DS2_VARS.drawerRadius};
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  z-index: 110; /* поверх mini-rail (99) и main dock (101) */
  overflow: hidden;
  user-select: none;

  ${({ $pinned, $x, $y, $w, $h }) =>
    $pinned
      ? `
          left: 50%;
          bottom: ${DS2_VARS.drawerBottom};
          transform: translateX(-50%);
          width: min(96vw, 1200px);
          height: min(640px, 80vh);
        `
      : `
          left: ${$x}px;
          top: ${$y}px;
          width: ${$w}px;
          height: ${$h}px;
          min-width: 320px;
          min-height: 200px;
          resize: both;
        `}

  ${({ $animateIn }) =>
    $animateIn
      ? `
          animation: devtoolsEnter 0.28s cubic-bezier(0.32, 0.72, 0, 1);
        `
      : ''}

  @keyframes devtoolsEnter {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
    }
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

const Header = styled.div<{ $cursorGrab: boolean }>`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 8px 22px 10px;
  flex-shrink: 0;
  gap: 12px;
  cursor: ${({ $cursorGrab }) => ($cursorGrab ? 'grab' : 'default')};
  &:active {
    cursor: ${({ $cursorGrab }) => ($cursorGrab ? 'grabbing' : 'default')};
  }
`;

const Title = styled.span`
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${DS2_VARS.g600};
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

const SecLabel = styled.div`
  font-size: 9.5px;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 2px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
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
  font-size: 12px;
  font-weight: 600;
  color: ${({ $disabled }) => ($disabled ? DS2_VARS.g500 : DS2_VARS.ink)};
  text-align: center;
  line-height: 1.1;
`;

/* ─── Inline SVG ─────────────────────────────────────────────────── */

const IconEdit = (): JSX.Element => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 14.5v3h3l9-9-3-3-9 9z" />
    <path d="M12 5l3 3" />
  </svg>
);

const IconSave = (): JSX.Element => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4.5v11a1 1 0 001 1h10a1 1 0 001-1V7.5l-3-3H5a1 1 0 00-1 1z" />
    <path d="M7 4.5v3.5h5V4.5" />
    <path d="M6.5 16v-5h7v5" />
  </svg>
);

const IconUndo = (): JSX.Element => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 9h8a4 4 0 010 8h-2" />
    <path d="M7.5 6L5 9l2.5 3" />
  </svg>
);

const IconRedo = (): JSX.Element => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 9H7a4 4 0 000 8h2" />
    <path d="M12.5 6L15 9l-2.5 3" />
  </svg>
);

const IconDiscard = (): JSX.Element => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h12" />
    <path d="M7.5 6V4.5h5V6" />
    <path d="M5.5 6l.8 9.5a1 1 0 001 .9h5.4a1 1 0 001-.9L14.5 6" />
    <path d="M8.5 9v5M11.5 9v5" />
  </svg>
);

/* Pin: вертикальная кнопка с шапкой. Active = pinned. */
const IconPin = (): JSX.Element => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3v4l-2.5 3.5h5L10 7" />
    <path d="M10 11v5M6 10.5h8" />
  </svg>
);

/* Reset position icon — домик / точка с якорем. */
const IconReset = (): JSX.Element => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10l7-6 7 6" />
    <path d="M5 9.5V16h10V9.5" />
  </svg>
);

const IconCloseX = (): JSX.Element => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 5l10 10M15 5L5 15" />
  </svg>
);

/* ─── Helpers: persist ───────────────────────────────────────────── */

function readPersist(): Partial<PersistState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistState>) : {};
  } catch {
    return {};
  }
}

function writePersist(patch: Partial<PersistState>): void {
  try {
    const curr = readPersist();
    localStorage.setItem(LS_KEY, JSON.stringify({ ...curr, ...patch }));
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

  /* ─── Persisted state ──────────────────────────────────────────── */

  const persisted = useRef<Partial<PersistState>>(readPersist());
  /* По умолчанию pinned=true (юзер явно попросил: "при появлении док
     должен быть пин"). Если в localStorage было pinned:false — читаем. */
  const [pinned, setPinnedInner] = useState<boolean>(
    persisted.current.pinned ?? true,
  );
  const [pos, setPosInner] = useState<{ x: number; y: number }>({
    x: persisted.current.x ?? DEFAULT_UNPINNED_X,
    y: persisted.current.y ?? DEFAULT_UNPINNED_Y,
  });
  const [size, setSizeInner] = useState<{ w: number; h: number }>({
    w: persisted.current.w ?? DEFAULT_UNPINNED_W,
    h: persisted.current.h ?? DEFAULT_UNPINNED_H,
  });

  const setPinned = useCallback((v: boolean) => {
    setPinnedInner(v);
    writePersist({ pinned: v });
  }, []);
  const setPos = useCallback((p: { x: number; y: number }) => {
    setPosInner(p);
    writePersist({ x: p.x, y: p.y });
  }, []);
  const setSize = useCallback((s: { w: number; h: number }) => {
    setSizeInner(s);
    writePersist({ w: s.w, h: s.h });
  }, []);

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
    document
      .querySelector<HTMLButtonElement>('[data-test="header-save-button"]')
      ?.click();
  }, []);

  const handleUndo = useCallback(() => {
    dispatch(undoLayoutAction());
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    // @ts-ignore — redoLayoutAction это setUnsavedChangesAfterAction thunk
    dispatch(redoLayoutAction());
  }, [dispatch]);

  const handleDiscard = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    window.location.assign(url.toString());
  }, []);

  /* ─── Drag (только в unpinned-режиме) ──────────────────────────── */

  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  const handleHeaderMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (pinned) return;
      /* Игнорируем клик на кнопках (pin/reset/close). */
      if ((e.target as HTMLElement).closest('button')) return;
      const panel = panelRef.current;
      if (!panel) return;
      e.preventDefault();
      const r = panel.getBoundingClientRect();
      dragRef.current = {
        dx: e.clientX - r.left,
        dy: e.clientY - r.top,
      };
      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current || !panelRef.current) return;
        const pw = panelRef.current.offsetWidth;
        const ph = panelRef.current.offsetHeight;
        const nx = Math.max(
          0,
          Math.min(window.innerWidth - pw, ev.clientX - dragRef.current.dx),
        );
        const ny = Math.max(
          0,
          Math.min(window.innerHeight - ph, ev.clientY - dragRef.current.dy),
        );
        setPos({ x: nx, y: ny });
      };
      const onUp = () => {
        dragRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [pinned, setPos],
  );

  /* ─── Resize tracking (unpinned) ───────────────────────────────── */

  /* CSS `resize: both` меняет element's offsetWidth/offsetHeight, но
     React не узнаёт об этом без ResizeObserver. Сохраняем фактические
     размеры в state → localStorage. */
  useEffect(() => {
    if (pinned) return undefined;
    const el = panelRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w !== size.w || h !== size.h) {
        setSize({ w, h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [pinned, size.w, size.h, setSize]);

  /* ─── Bounds clamp on window resize ────────────────────────────── */

  useEffect(() => {
    if (pinned) return undefined;
    const onResize = () => {
      const el = panelRef.current;
      if (!el) return;
      const pw = el.offsetWidth;
      const ph = el.offsetHeight;
      const nx = Math.max(0, Math.min(window.innerWidth - pw, pos.x));
      const ny = Math.max(0, Math.min(window.innerHeight - ph, pos.y));
      if (nx !== pos.x || ny !== pos.y) setPos({ x: nx, y: ny });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pinned, pos.x, pos.y, setPos]);

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
    setPinned(!pinned);
  }, [pinned, setPinned]);

  /* Reset — возвращает в default pinned-state. Если юзер был в
     unpinned с каким-то уникальным размером/позицией, они стираются,
     окно снова становится стандартным bottom-sheet'ом. */
  const handleReset = useCallback(() => {
    setPinned(true);
    /* Также чистим сохранённые unpinned-координаты/размер, чтобы при
       следующем откреплении начать с дефолтов, а не из старого места. */
    setPos({ x: DEFAULT_UNPINNED_X, y: DEFAULT_UNPINNED_Y });
    setSize({ w: DEFAULT_UNPINNED_W, h: DEFAULT_UNPINNED_H });
  }, [setPinned, setPos, setSize]);

  /* ─── Enter-animation один раз при mount'е ─────────────────────── */

  const [animateIn, setAnimateIn] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setAnimateIn(false), 300);
    return () => clearTimeout(id);
  }, []);

  /* ─── Content: 4 action tiles ──────────────────────────────────── */

  interface TileDef {
    key: string;
    label: string;
    accent: string;
    icon: ReactNode;
    onClick: () => void;
    disabled: boolean;
  }

  /* Главная кнопка меняется Edit ↔ Save по editMode. */
  const mainTile: TileDef = editMode
    ? {
        key: 'save',
        label: t('Сохранить дашборд'),
        accent: DS2_VARS.cSky,
        icon: <IconSave />,
        onClick: handleSave,
        disabled: false,
      }
    : {
        key: 'edit',
        label: t('Редактировать дашборд'),
        accent: DS2_VARS.cSky,
        icon: <IconEdit />,
        onClick: handleEdit,
        disabled: !userCanEdit,
      };

  const tiles: TileDef[] = [
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

  return (
    <Panel
      ref={panelRef}
      role="dialog"
      aria-label={t('Инструменты разработчика')}
      $pinned={pinned}
      $x={pos.x}
      $y={pos.y}
      $w={size.w}
      $h={size.h}
      $animateIn={animateIn}
    >
      {pinned && <DragHandle />}
      <Header
        $cursorGrab={!pinned}
        onMouseDown={handleHeaderMouseDown}
      >
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
            <SecLabel>{t('Редактор')}</SecLabel>
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
  );
};

export default DevToolsPanel;
