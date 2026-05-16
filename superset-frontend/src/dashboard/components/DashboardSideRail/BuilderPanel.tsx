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
 * BuilderPanel — плавающее окно «Библиотека».
 *
 * Двух-табовое окно (Чарты / Оформление) с механикой floating-окна
 * как у DevToolsPanel:
 *   • pinned (default) — bottom-sheet, центрирован, размер
 *     min(96vw, 1200px) × min(640px, 80vh).
 *   • unpinned — floating: абсолютное left/top/width/height из
 *     persist'а, drag за любое место кроме интерактивных, resize
 *     через native CSS `resize: both`.
 *
 * Reset-иконка возвращает в pinned-default. Все координаты/размеры
 * сохраняются в localStorage между перезагрузками.
 *
 * Responsive columnCount чартов вычисляется из текущей ширины панели:
 *   • <  800px → 1 колонка
 *   • <  1200px → 2 колонки
 *   • >= 1200px → 3 колонки (как в исходном drawer'е)
 *
 * Min-width окна — 600px (юзер: «минимум для 1 колонки»).
 */
import { css, styled, t } from '@superset-ui/core';
import {
  type FC,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Icons } from '@superset-ui/core/components/Icons';
import { useSelector } from 'react-redux';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import SliceAdder from 'src/dashboard/containers/SliceAdder';
import dashboardComponents from 'src/visualizations/presets/dashboardComponents';
import NewColumn from 'src/dashboard/components/gridComponents/new/NewColumn';
import NewDivider from 'src/dashboard/components/gridComponents/new/NewDivider';
import NewHeader from 'src/dashboard/components/gridComponents/new/NewHeader';
import NewRow from 'src/dashboard/components/gridComponents/new/NewRow';
import NewTabs from 'src/dashboard/components/gridComponents/new/NewTabs';
import NewMarkdown from 'src/dashboard/components/gridComponents/new/NewMarkdown';
import NewDynamicComponent from 'src/dashboard/components/gridComponents/new/NewDynamicComponent';
import type { RootState } from 'src/dashboard/types';
import { navigateTo } from 'src/utils/navigationUtils';

type TabKey = 'charts' | 'layout';

/* ─── Persist ────────────────────────────────────────────────────── */

const LS_KEY = 'superset.shell.builder.panel.v1';

interface PersistState {
  pinned: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

/* Default = bottom-sheet 1200×640, центр по горизонтали, прижат снизу
   над dock'ом (92px gap). Идентично DevToolsPanel default'у. */
const DEFAULT_BOTTOM_GAP = 92;
/* Min 320 = мобильный viewport (iPhone SE). Юзер хочет складывать окно
   до «мобильного состояния». При width < NARROW_HEADER_BREAKPOINT
   шапка переключается на 2-строчный layout (title+actions сверху,
   tabs «Чарты/Оформление» снизу) чтобы кнопки не наезжали на tabs. */
const PANEL_MIN_WIDTH = 320;
const PANEL_MIN_HEIGHT = 320;
const NARROW_HEADER_BREAKPOINT = 600;

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

function readPersist(): Partial<PersistState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      pinned: typeof parsed.pinned === 'boolean' ? parsed.pinned : undefined,
      w: typeof parsed.w === 'number' ? parsed.w : undefined,
      h: typeof parsed.h === 'number' ? parsed.h : undefined,
      x: typeof parsed.x === 'number' ? parsed.x : undefined,
      y: typeof parsed.y === 'number' ? parsed.y : undefined,
    };
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

/* ─── Responsive columns ─────────────────────────────────────────── */

/* Маппинг ширины окна → columnCount для SliceAdder.
   <  800   → 1 (узкое окно, чарты в одну колонку)
   <  1200  → 2 (среднее окно — две колонки, ~400-600px карточка)
   >= 1200  → 3 (широкое — как в исходном drawer'е) */
function widthToColumnCount(width: number): 1 | 2 | 3 {
  if (width < 800) return 1;
  if (width < 1200) return 2;
  return 3;
}

/* ─── Styled ─────────────────────────────────────────────────────── */

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
  /* z=105: выше Shell-drawer'ов (z=95) — чтобы Library оставался видим
     когда юзер открывает Каталог/Фильтры. Ниже DevToolsPanel (z=110) —
     чтобы tile «Открыть/Закрыть библиотеку» оставался кликабельным. */
  z-index: 105;
  overflow: auto;
  user-select: none;

  min-width: ${PANEL_MIN_WIDTH}px;
  min-height: ${PANEL_MIN_HEIGHT}px;
  max-width: 100vw;
  max-height: 100vh;
  resize: ${({ $pinned }) => ($pinned ? 'none' : 'both')};

  transition:
    box-shadow 0.18s ${DS2_VARS.ease},
    border-color 0.18s ${DS2_VARS.ease};

  cursor: ${({ $pinned }) => ($pinned ? 'default' : 'grab')};
  &:active {
    cursor: ${({ $pinned }) => ($pinned ? 'default' : 'grabbing')};
  }

  ${({ $animateIn }) =>
    $animateIn
      ? `animation: builderPanelEnter 0.28s cubic-bezier(0.32, 0.72, 0, 1);`
      : ''}

  @keyframes builderPanelEnter {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media print {
    display: none;
  }
`;

const DragHandle = styled.div`
  width: 36px;
  height: 4px;
  margin: 10px auto 0;
  border-radius: 2px;
  background: ${DS2_VARS.g300};
  opacity: 0.5;
  flex-shrink: 0;
`;

/* Wide (>= 600): 3-колоночный grid — title слева, tabs по центру,
   actions справа.
   Narrow (< 600): 2-строчный — title+actions сверху, tabs снизу
   занимают всю ширину. */
const Header = styled.div<{ $narrow: boolean }>`
  display: grid;
  align-items: center;
  padding: 8px ${({ $narrow }) => ($narrow ? '14' : '22')}px 10px;
  flex-shrink: 0;
  gap: ${({ $narrow }) => ($narrow ? '6px 12px' : '12px')};
  ${({ $narrow }) =>
    $narrow
      ? `
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-rows: auto auto;
      `
      : `
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      `}
`;

const Title = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: var(--fs-meta);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${DS2_VARS.g600};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HeaderCenter = styled.div<{ $narrow: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
  /* Narrow: tabs занимают всю ширину 2-й строки. */
  ${({ $narrow }) =>
    $narrow
      ? `
        grid-column: 1 / -1;
        grid-row: 2;
        justify-content: center;
      `
      : ''}
`;

const HeaderRight = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
`;

/* ─── Header tabs (ScopeToggle-style) ───────────────────────────── */

const HeadTabs = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border-radius: 8px;
  background: ${DS2_VARS.g100};
  border: 1px solid ${DS2_VARS.g200};
`;

const HeadTabBtn = styled.button<{ $active: boolean }>`
  min-width: 96px;
  padding: 4px 14px;
  border: none;
  border-radius: 6px;
  background: ${({ $active }) => ($active ? DS2_VARS.s : 'transparent')};
  color: ${({ $active }) => ($active ? DS2_VARS.ink : DS2_VARS.g500)};
  font-family: ${DS2_VARS.fontSans};
  font-size: var(--fs-meta);
  font-weight: 600;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active ? '0 1px 2px rgba(0, 0, 0, 0.08)' : 'none'};
  transition:
    background 0.15s ${DS2_VARS.ease},
    color 0.15s ${DS2_VARS.ease};
  &:hover {
    color: ${DS2_VARS.ink};
  }
  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
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
    width: 14px;
    height: 14px;
  }
`;

/* ─── Body ───────────────────────────────────────────────────────── */

const Body = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: ${DS2_SPACE.s3}px;
  padding: 4px 22px 18px;
  overflow-y: auto;
`;

const ChartsPanel = styled.div`
  flex: 1;
  min-height: 0;
  & > div {
    height: 100%;
  }
  /* Скрываем внутренние header-кнопки SliceAdder'а — их функции уже
     перенесены в header панели (+ и «Только мои»).
     SliceAdder root div:
       1. NewChartButtonContainer (скрыть)
       2. Controls (search + sort — оставляем)
       3. <div> с Checkbox «Show only my charts» (скрыть)
       4. ChartList / Loading */
  & > div > :first-child {
    display: none;
  }
  & > div > div:has(input[type='checkbox']) {
    display: none;
  }
`;

const LayoutSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 0 0;
`;

const SecLabel = styled.div`
  font-size: var(--fs-micro);
  font-weight: 600;
  font-family: ${DS2_VARS.fontMono};
  color: ${DS2_VARS.g500};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 2px;
`;

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${DS2_SPACE.s1 + 2}px;
`;

const TileHost = styled.div<{ $accent: string }>`
  ${({ theme, $accent }) => css`
    position: relative;
    display: flex;
    align-items: stretch;
    border-radius: 10px;
    overflow: hidden;

    & [draggable='true'] {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${DS2_SPACE.s2}px;
      padding: 14px 10px 12px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 10px;
      cursor: grab;
      font-size: var(--fs-meta);
      font-weight: 600;
      color: ${DS2_VARS.ink};
      text-align: center;
      line-height: 1.1;
      transition:
        background 0.12s ${DS2_VARS.ease},
        border-color 0.12s ${DS2_VARS.ease};
      &:hover {
        background: ${DS2_VARS.tileHoverBg};
        border-color: ${DS2_VARS.tileHoverBorder};
      }
    }

    & .new-component-placeholder {
      width: 38px;
      height: 38px;
      margin-right: 0;
      border-radius: 10px;
      background: color-mix(in oklab, ${$accent} 12%, ${DS2_VARS.bg3});
      border: 1px solid ${theme.colorBorderSecondary};
      color: ${$accent};
    }
    & .new-component-placeholder svg {
      width: 19px;
      height: 19px;
      color: ${$accent};
    }
  `}
`;

/* ─── Inline icons (1:1 с DevToolsPanel) ─────────────────────────── */

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

interface BuilderPanelProps {
  onClose: () => void;
}

export const BuilderPanel: FC<BuilderPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('charts');
  const initialW = readPersist().w ?? defaultPersist().w;
  const [columnCount, setColumnCount] = useState<1 | 2 | 3>(() =>
    widthToColumnCount(initialW),
  );
  /* narrowHeader = true когда панель уже NARROW_HEADER_BREAKPOINT (600px).
     В этом режиме tabs «Чарты/Оформление» переезжают на 2-ю строку
     шапки — иначе action-кнопки наезжают на них на узком окне. */
  const [narrowHeader, setNarrowHeader] = useState<boolean>(
    () => initialW < NARROW_HEADER_BREAKPOINT,
  );

  const dashboardId = useSelector<RootState, number | undefined>(
    state => state.dashboardInfo?.id,
  );

  /* ─── Show-only-my toggle ──────────────────────────────────────── */

  const [showOnlyMy, setShowOnlyMy] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('dashboard:sliceAdder:showOnlyMyCharts') === 'true'
      );
    } catch {
      return false;
    }
  });

  /* Синхронизация: дёргаем internal checkbox SliceAdder'а. Селектор
     ищет hidden checkbox внутри dialog с aria-label «Библиотека» (наш
     Panel), чтобы не сматчить чужой чекбокс на странице. */
  const toggleOnlyMy = useCallback(() => {
    const next = !showOnlyMy;
    setShowOnlyMy(next);
    try {
      localStorage.setItem(
        'dashboard:sliceAdder:showOnlyMyCharts',
        next ? 'true' : 'false',
      );
    } catch {
      /* noop */
    }
    const cb = document.querySelector<HTMLInputElement>(
      '[role="dialog"][aria-label="Библиотека"] input[type="checkbox"]',
    );
    if (cb && cb.checked !== next) cb.click();
  }, [showOnlyMy]);

  /* ─── Pinned state (React) ─────────────────────────────────────── */

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

  /* ─── Persisted position/size (ref) ────────────────────────────── */

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

  const panelRef = useRef<HTMLDivElement | null>(null);

  /* Применить текущие pos/size как inline style, clamp в viewport. */
  const applyStyle = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    const w = Math.min(
      Math.max(PANEL_MIN_WIDTH, sizeRef.current.w),
      window.innerWidth,
    );
    const h = Math.min(
      Math.max(PANEL_MIN_HEIGHT, sizeRef.current.h),
      window.innerHeight,
    );
    const x = Math.max(0, Math.min(window.innerWidth - w, posRef.current.x));
    const y = Math.max(0, Math.min(window.innerHeight - h, posRef.current.y));
    posRef.current = { x, y };
    sizeRef.current = { w, h };
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    setColumnCount(widthToColumnCount(w));
    setNarrowHeader(w < NARROW_HEADER_BREAKPOINT);
  }, []);

  useEffect(() => {
    applyStyle();
  }, [pinned, applyStyle]);

  /* ─── Drag (только unpinned) ───────────────────────────────────── */

  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  const handlePanelMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (pinned) return;
      const target = e.target as HTMLElement;
      /* Не начинаем drag если клик по интерактивному элементу. Также
         draggable tile'ы в layout-табе — у них cursor:grab, юзер
         перетаскивает в дашборд, не само окно. */
      if (
        target.closest(
          'button, a, input, textarea, select, [role="button"], ' +
            '[contenteditable="true"], [draggable="true"]',
        )
      ) {
        return;
      }
      const panel = panelRef.current;
      if (!panel) return;
      const r = panel.getBoundingClientRect();
      /* Hit-zone native resize-handle в правом нижнем углу — пропускаем
         чтобы браузер мог запустить свой resize. */
      const RESIZE_HANDLE_SIZE = 18;
      const inResizeHandle =
        e.clientX >= r.right - RESIZE_HANDLE_SIZE &&
        e.clientY >= r.bottom - RESIZE_HANDLE_SIZE;
      if (inResizeHandle) return;
      e.preventDefault();
      dragRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
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
        panelRef.current.style.left = `${nx}px`;
        panelRef.current.style.top = `${ny}px`;
        posRef.current = { x: nx, y: ny };
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

  /* ─── Resize tracking (persist + columnCount) ──────────────────── */

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return undefined;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      sizeRef.current = { w, h };
      setColumnCount(widthToColumnCount(w));
      setNarrowHeader(w < NARROW_HEADER_BREAKPOINT);
      if (pinned) return;
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

  /* ─── Window resize: clamp + persist ───────────────────────────── */

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
      if (e.key !== 'Escape') return;
      /* Если поверх открыт AntD-modal — даём ему поймать Escape первым. */
      const modalOpen =
        document.querySelector('.ant-modal-wrap, [role="dialog"].ant-modal') !==
        null;
      if (modalOpen) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* ─── Pin / Reset handlers ─────────────────────────────────────── */

  const handlePinToggle = useCallback(() => {
    setPinned(v => !v);
  }, [setPinned]);

  const handleReset = useCallback(() => {
    const d = defaultPersist();
    posRef.current = { x: d.x, y: d.y };
    sizeRef.current = { w: d.w, h: d.h };
    writePersist({ x: d.x, y: d.y, w: d.w, h: d.h, pinned: true });
    setPinned(true);
    applyStyle();
  }, [setPinned, applyStyle]);

  /* ─── Enter animation один раз при mount'е ─────────────────────── */

  const [animateIn, setAnimateIn] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setAnimateIn(false), 300);
    return () => clearTimeout(id);
  }, []);

  /* ─── Layout items (Оформление таб) ────────────────────────────── */

  const layoutItems: Array<{
    key: string;
    accent: string;
    label: string;
    node: JSX.Element;
  }> = useMemo(
    () => [
      {
        key: 'tabs',
        accent: DS2_VARS.cSky,
        label: t('Вкладки'),
        node: <NewTabs />,
      },
      {
        key: 'row',
        accent: DS2_VARS.cViolet,
        label: t('Ряд'),
        node: <NewRow />,
      },
      {
        key: 'column',
        accent: DS2_VARS.cTangerine,
        label: t('Колонка'),
        node: <NewColumn />,
      },
      {
        key: 'header',
        accent: DS2_VARS.cFuchsia,
        label: t('Заголовок'),
        node: <NewHeader />,
      },
      {
        key: 'markdown',
        accent: DS2_VARS.cAmber,
        label: t('Markdown'),
        node: <NewMarkdown />,
      },
      {
        key: 'divider',
        accent: DS2_VARS.g500,
        label: t('Разделитель'),
        node: <NewDivider />,
      },
    ],
    [],
  );

  return (
    <Panel
      ref={panelRef}
      role="dialog"
      aria-label={t('Библиотека')}
      $pinned={pinned}
      $animateIn={animateIn}
      onMouseDown={handlePanelMouseDown}
      style={{
        left: posRef.current.x,
        top: posRef.current.y,
        width: sizeRef.current.w,
        height: sizeRef.current.h,
      }}
    >
      {pinned && <DragHandle />}
      <Header $narrow={narrowHeader}>
        <Title>{t('Библиотека')}</Title>
        <HeaderCenter $narrow={narrowHeader}>
          <HeadTabs role="tablist" aria-label={t('Режим библиотеки')}>
            <HeadTabBtn
              type="button"
              role="tab"
              aria-selected={activeTab === 'charts'}
              $active={activeTab === 'charts'}
              onClick={() => setActiveTab('charts')}
            >
              {t('Чарты')}
            </HeadTabBtn>
            <HeadTabBtn
              type="button"
              role="tab"
              aria-selected={activeTab === 'layout'}
              $active={activeTab === 'layout'}
              onClick={() => setActiveTab('layout')}
            >
              {t('Оформление')}
            </HeadTabBtn>
          </HeadTabs>
        </HeaderCenter>
        <HeaderRight>
          {activeTab === 'charts' && (
            <>
              <IconBtn
                type="button"
                aria-label={
                  showOnlyMy
                    ? t('Показать все чарты')
                    : t('Показать только мои чарты')
                }
                title={
                  showOnlyMy
                    ? t('Показать все чарты')
                    : t('Показать только мои чарты')
                }
                aria-pressed={showOnlyMy}
                onClick={toggleOnlyMy}
                style={showOnlyMy ? { color: DS2_VARS.cSky } : undefined}
              >
                <Icons.UserOutlined iconSize="m" />
              </IconBtn>
              <IconBtn
                type="button"
                aria-label={t('Создать чарт')}
                title={t('Создать чарт')}
                onClick={() => {
                  if (dashboardId === undefined) return;
                  navigateTo(`/chart/add?dashboard_id=${dashboardId}`, {
                    newWindow: true,
                  });
                }}
              >
                <Icons.PlusOutlined iconSize="m" />
              </IconBtn>
            </>
          )}
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
        {activeTab === 'charts' ? (
          <ChartsPanel>
            <SliceAdder columnCount={columnCount} />
          </ChartsPanel>
        ) : (
          <LayoutSections>
            <SecLabel>{t('Базовые блоки')}</SecLabel>
            <LayoutGrid>
              {layoutItems.map(item => (
                <TileHost key={item.key} $accent={item.accent}>
                  {item.node}
                </TileHost>
              ))}
            </LayoutGrid>
            {dashboardComponents.getAll().length > 0 && (
              <>
                <SecLabel>{t('Дополнительно')}</SecLabel>
                <LayoutGrid>
                  {dashboardComponents
                    .getAll()
                    .map(({ key: componentKey, metadata }) => (
                      <TileHost key={componentKey} $accent={DS2_VARS.cSky}>
                        <NewDynamicComponent
                          metadata={metadata}
                          componentKey={componentKey}
                        />
                      </TileHost>
                    ))}
                </LayoutGrid>
              </>
            )}
          </LayoutSections>
        )}
      </Body>
    </Panel>
  );
};

export default BuilderPanel;
