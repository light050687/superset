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
 * DashboardPagesRail — горизонтальный rail с pill-кнопками для каждой
 * страницы dashboard. Сидит над DashboardSideRail (mini-rail). На hover
 * pill'а — справа появляются 3 inline-иконки (Переименовать / Дублировать /
 * Удалить). Double-click активирует inline-rename. Plus-кнопка всегда в
 * конце ряда добавляет новую пустую страницу. Multi-row wrap'ом — высота
 * rail'а отдаётся через CSS-переменную `--pages-rail-h` на :root, чтобы
 * DockGrabber (Rail.tsx) мог следовать за верхним краем независимо от
 * количества рядов.
 */
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { styled, t } from '@superset-ui/core';
import { DS2_VARS } from 'src/theme/ds2';
import { useShell } from 'src/views/components/Shell/ShellContext';
import {
  updateComponents,
  deleteComponent,
  copyPage,
} from 'src/dashboard/actions/dashboardLayout';
import {
  setActivePagePath,
  setDirectPathToChild,
} from 'src/dashboard/actions/dashboardState';
import { PAGE_TYPE, PAGES_TYPE } from 'src/dashboard/util/componentTypes';
import newComponentFactory from 'src/dashboard/util/newComponentFactory';
import getDirectPathToTabIndex from 'src/dashboard/util/getDirectPathToTabIndex';
import type { RootState } from 'src/dashboard/types';

/* ─── Types ──────────────────────────────────────────────────────── */

interface DockMetrics {
  left: number;
  width: number;
}

interface PagesComponent {
  id: string;
  type: string;
  children?: string[];
}

/* ─── Styled ─────────────────────────────────────────────────────── */

const Rail = styled.nav<{
  $metrics: DockMetrics | null;
  $hidden: boolean;
  $hasMiniRail: boolean;
}>`
  position: fixed;
  /* Сидим НАД mini-rail'ом без overlap'а. Mini-rail TOP edge от viewport
     bottom = dockBottom + dockHeight + 30. Pages rail сидит на 6px gap
     выше: bottom = +36. Multi-row growth направлен ВВЕРХ (height растёт
     от нижнего края). */
  bottom: ${({ $hidden, $hasMiniRail }) =>
    $hidden
      ? '-2px'
      : $hasMiniRail
        ? `calc(${DS2_VARS.dockBottom} + ${DS2_VARS.dockHeight} + 36px)`
        : `calc(${DS2_VARS.dockBottom} + ${DS2_VARS.dockHeight} + 6px)`};
  ${({ $metrics }) =>
    $metrics !== null
      ? `left: ${$metrics.left}px; width: ${$metrics.width}px;`
      : 'left: 50%; visibility: hidden;'}
  box-sizing: border-box;
  /* position: relative — для абсолютного позиционирования AddPageBtn
     внутри rail'а (плюс может выходить ЗА правую границу когда последний
     ряд заполнен 4 пилами). overflow: visible — чтобы overflow plus'а
     не обрезался. */
  position: fixed;
  display: flex;
  flex-direction: row;
  /* align-content: flex-end → multi-row блок прижат к НИЖНЕМУ краю
     контейнера; новые ряды добавляются ВВЕРХ. */
  align-items: center;
  align-content: flex-end;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 6px;
  overflow: visible;
  z-index: 98;

  /* НИКАКОЙ подложки. */
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;

  /* Симметричная анимация: collapse = expand в реверсе. Та же
     длительность (240ms), та же easing (decelerated cubic-bezier),
     тот же delay (280ms) — независимо от направления.
     Юзер хочет точный реверс развёртывания при свёртывании. */
  --pages-ease: cubic-bezier(0, 0, 0.2, 1);
  --pages-delay: 280ms;

  transform-origin: bottom center;
  transform: ${({ $hidden }) => ($hidden ? 'scaleY(0)' : 'scaleY(1)')};
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  pointer-events: ${({ $hidden }) => ($hidden ? 'none' : 'auto')};
  transition:
    transform 240ms var(--pages-ease) var(--pages-delay),
    opacity 240ms var(--pages-ease) var(--pages-delay),
    bottom 240ms var(--pages-ease) var(--pages-delay);

  @media print {
    display: none;
  }
  @media (max-width: 768px) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 120ms ease;
    transform: ${({ $hidden }) =>
      $hidden ? 'scaleY(0)' : 'scaleY(1)'};
  }
`;

const PagePill = styled.button<{
  $active?: boolean;
  $dragOver?: boolean;
  $dragging?: boolean;
  $dropPosition?: 'before' | 'after' | null;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 28px;
  /* Фиксированная ширина 1/4 от dock width минус 3 gap'а. 4 пилла +
     3 × 6 gap = 100% dock width. С 5+ страницами происходит wrap. */
  flex: 0 0 calc((100% - 18px) / 4);
  min-width: 0;
  padding: 0 12px;
  border: 1px solid
    ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g200)};
  /* DS 2.0: card radius 10px (было 999 = pill, юзер просил убрать
     сильные закругления, сверившись с дизайн-документом). */
  border-radius: 10px;
  background: ${({ $active }) =>
    $active ? DS2_VARS.dockBtnActiveBg : DS2_VARS.s};
  /* Dragging — приглушаем pill (визуальная подсказка что элемент
     "поднят"). DragOver НЕ меняет фон/border — только тонкая полоска
     с нужной стороны через box-shadow inset (юзер просил не подсвечивать
     всю карточку, только сторону вставки). */
  opacity: ${({ $dragging }) => ($dragging ? 0.4 : 1)};
  ${({ $dragOver, $dropPosition }) => {
    if (!$dragOver || !$dropPosition) return '';
    const inset = $dropPosition === 'before' ? '3px 0' : '-3px 0';
    return `box-shadow: inset ${inset} 0 ${DS2_VARS.cSky};`;
  }}
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g600)};
  font-family: ${DS2_VARS.fontSans};
  font-size: var(--fs-meta);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease};

  &:hover {
    background: ${({ $active }) =>
      $active ? DS2_VARS.dockBtnActiveBg : DS2_VARS.dockBtnHoverBg};
    color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.ink)};
    border-color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g300)};
  }

  &:hover [data-pill-actions] {
    opacity: 1;
    pointer-events: auto;
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

const PageName = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
`;

const PillActions = styled.span`
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 2px;
  /* DS 2.0: card radius 10px (было 999), согласовано с PagePill. */
  border-radius: 8px;
  background: ${DS2_VARS.s};
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ${DS2_VARS.ease};
`;

const PillActionBtn = styled.button<{ $danger?: boolean }>`
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${({ $danger }) => ($danger ? DS2_VARS.dn : DS2_VARS.g500)};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.1s ${DS2_VARS.ease},
    color 0.1s ${DS2_VARS.ease};

  &:hover {
    background: ${({ $danger }) => ($danger ? DS2_VARS.dnBg : DS2_VARS.g100)};
    color: ${({ $danger }) => ($danger ? DS2_VARS.dn : DS2_VARS.ink)};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const PageNameInput = styled.input`
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  outline: none;
  padding: 0;
  width: 100%;
  text-align: center;
`;

const AddPageBtn = styled.button`
  /* Absolute-позиция — плюс рендерится В rail'е, но координаты
     вычисляются JS-ом так чтобы плюс всегда был справа от последнего
     pill'а. Если последний ряд заполнен 4 пилами — плюс выходит ЗА
     правую границу dock width. Если 5+ страниц — плюс на новом ряду
     рядом с последним pill'ом. */
  position: absolute;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px dashed ${DS2_VARS.g300};
  border-radius: 50%;
  background: ${DS2_VARS.s};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: ${DS2_VARS.g500};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Только цветовые transitions; left/top меняются мгновенно (юзер
     не хочет видеть анимацию переноса плюса между позициями). */
  transition:
    background 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease},
    border-color 0.12s ${DS2_VARS.ease};

  &:hover {
    border-color: ${DS2_VARS.cSky};
    color: ${DS2_VARS.cSky};
    background: ${DS2_VARS.dockBtnHoverBg};
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

/* ─── Icons ──────────────────────────────────────────────────────── */

const IconPlus = (): JSX.Element => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path d="M8 3v10M3 8h10" />
  </svg>
);

const IconEdit = (): JSX.Element => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11.5 2.5l2 2L5 13H3v-2z" />
    <path d="M10 4l2 2" />
  </svg>
);

const IconCopy = (): JSX.Element => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="5" width="9" height="9" rx="1.5" />
    <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
  </svg>
);

const IconDelete = (): JSX.Element => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

/* ─── Hooks ──────────────────────────────────────────────────────── */

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

function useMainDockMetrics(): DockMetrics | null {
  const [metrics, setMetrics] = useState<DockMetrics | null>(null);
  useEffect(() => {
    let observer: ResizeObserver | null = null;
    let dock: HTMLElement | null = null;
    let cleanupResize: (() => void) | undefined;
    const tryAttach = (attemptsLeft: number): void => {
      dock = document.querySelector<HTMLElement>(
        'nav[data-shell-rail="main"]',
      );
      if (!dock && attemptsLeft > 0) {
        requestAnimationFrame(() => tryAttach(attemptsLeft - 1));
        return;
      }
      if (!dock) return;
      const update = (): void => {
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
      cleanupResize = () => window.removeEventListener('resize', update);
    };
    tryAttach(10);
    return () => {
      observer?.disconnect();
      cleanupResize?.();
    };
  }, []);
  return metrics;
}

/**
 * Tracks pages-rail height и пишет в CSS-переменную `--pages-rail-h` на
 * :root. DockGrabber (Rail.tsx) использует её через `var(--pages-rail-h)`,
 * чтобы плавать над верхним краем pages-rail независимо от числа рядов.
 * При hidden=true → ставит 0px, grabber возвращается на mini-rail/dock.
 */
function usePagesRailHeightVar(
  ref: React.RefObject<HTMLElement>,
  hidden: boolean,
): void {
  useEffect(() => {
    const el = ref.current;
    if (typeof document === 'undefined') return undefined;
    if (hidden || !el) {
      document.documentElement.style.setProperty('--pages-rail-h', '0px');
      return undefined;
    }
    const update = (): void => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty(
        '--pages-rail-h',
        `${h}px`,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      // При unmount (или hidden) сбрасываем в 0 чтобы grabber не висел.
      document.documentElement.style.setProperty('--pages-rail-h', '0px');
    };
  }, [ref, hidden]);
}

/* ─── Component ──────────────────────────────────────────────────── */

export const DashboardPagesRail: FC = () => {
  const dispatch = useDispatch();
  const onDashboard = useOnDashboardRoute();
  const dockMetrics = useMainDockMetrics();
  const { isDockCollapsed, hasMiniRail, pagesRailOpen } = useShell();
  // Hidden когда rail закрыт ИЛИ когда главный dock collapsed.
  const hidden = !pagesRailOpen || isDockCollapsed;

  const railRef = useRef<HTMLElement>(null);
  usePagesRailHeightVar(railRef, hidden);

  const dashboardLayout = useSelector(
    (state: RootState) => state.dashboardLayout?.present,
  );
  const activePagePath = useSelector(
    (state: RootState) => state.dashboardState?.activePagePath ?? [],
  );
  const editMode = useSelector(
    (state: RootState) => state.dashboardState?.editMode ?? false,
  );

  const pagesComponent = useMemo<PagesComponent | null>(() => {
    if (!dashboardLayout) return null;
    const node = Object.values(dashboardLayout).find(
      (c: any) => c?.type === PAGES_TYPE,
    ) as PagesComponent | undefined;
    return node ?? null;
  }, [dashboardLayout]);

  const pageIds = pagesComponent?.children ?? [];
  const pagesId = pagesComponent?.id;

  const activePageId =
    pageIds.find(pid => activePagePath?.includes(pid)) || pageIds[0];

  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  // DnD reorder state. dropPosition определяет, куда вставить
  // перетаскиваемую страницу относительно targetId — слева (before)
  // или справа (after). Вычисляется в handleDragOver по cursor-X.
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<
    'before' | 'after' | null
  >(null);

  const handlePageClick = useCallback(
    (pageId: string) => {
      if (!pagesComponent) return;
      const idx = pageIds.indexOf(pageId);
      const path = getDirectPathToTabIndex(pagesComponent, idx);
      dispatch(setActivePagePath(path));
      dispatch(setDirectPathToChild(path));
    },
    [dispatch, pagesComponent, pageIds],
  );

  const handleAddPage = useCallback(() => {
    if (!pagesComponent || !pagesId) return;
    const newPage = newComponentFactory(PAGE_TYPE);
    newPage.parents = [pagesId];
    const nextChildren = [...pageIds, newPage.id];
    dispatch(
      updateComponents({
        [newPage.id]: newPage,
        [pagesId]: { ...pagesComponent, children: nextChildren } as any,
      }) as any,
    );
  }, [dispatch, pagesId, pagesComponent, pageIds]);

  const handleDeletePage = useCallback(
    (pageId: string) => {
      if (!pagesId || !pagesComponent || pageIds.length <= 1) return;
      // Главная (первая) страница — нельзя удалить.
      if (pageId === pageIds[0]) return;
      // Если удаляем АКТИВНУЮ страницу — заранее переключаемся на левого
      // соседа (ближайшая слева). pageIds[idx-1] всегда существует когда
      // удаляем не-первую (idx >= 1), т.к. главную мы выше отсекли.
      if (pageId === activePageId) {
        const idx = pageIds.indexOf(pageId);
        const nextIdx = idx > 0 ? idx - 1 : 0;
        const nextActiveId = pageIds[nextIdx === idx ? idx + 1 : nextIdx];
        if (nextActiveId) {
          // Pages-children array без удаляемого — индекс в нём может
          // отличаться, но getDirectPathToTabIndex считает по pagesComponent
          // ДО удаления. После dispatch deleteComponent layout обновится,
          // а activePagePath укажет на корректный сохранённый pageId.
          const survivors = pageIds.filter(id => id !== pageId);
          const newIdx = survivors.indexOf(nextActiveId);
          const path = getDirectPathToTabIndex(
            { ...pagesComponent, children: survivors } as any,
            newIdx,
          );
          dispatch(setActivePagePath(path));
          dispatch(setDirectPathToChild(path));
        }
      }
      dispatch(deleteComponent(pageId, pagesId) as any);
    },
    [dispatch, pageIds, pagesId, pagesComponent, activePageId],
  );

  const handleCopyPage = useCallback(
    (pageId: string) => {
      if (!pagesId) return;
      dispatch(copyPage(pageId, pagesId) as any);
    },
    [dispatch, pagesId],
  );

  const handleStartRename = useCallback(
    (pageId: string) => {
      const page = (dashboardLayout as any)?.[pageId];
      setEditingPageId(pageId);
      setEditingName(page?.meta?.text || '');
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [dashboardLayout],
  );

  const handleFinishRename = useCallback(() => {
    if (editingPageId && dashboardLayout) {
      const page = (dashboardLayout as any)[editingPageId];
      if (page && editingName !== page.meta?.text) {
        dispatch(
          updateComponents({
            [editingPageId]: {
              ...page,
              meta: { ...page.meta, text: editingName },
            },
          }) as any,
        );
      }
    }
    setEditingPageId(null);
  }, [dispatch, editingPageId, editingName, dashboardLayout]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleFinishRename();
      if (e.key === 'Escape') setEditingPageId(null);
    },
    [handleFinishRename],
  );

  /**
   * Reorder pages: move srcId перед или после targetId (зависит от
   * position). Обновляет PAGES.children в Redux. Главная — pageIds[0]
   * всегда; если перетащили другую страницу на index 0, она автоматически
   * становится главной.
   */
  const handleReorder = useCallback(
    (srcId: string, targetId: string, position: 'before' | 'after') => {
      if (srcId === targetId || !pagesComponent || !pagesId) return;
      const srcIdx = pageIds.indexOf(srcId);
      const targetIdx = pageIds.indexOf(targetId);
      if (srcIdx < 0 || targetIdx < 0) return;
      const next = [...pageIds];
      next.splice(srcIdx, 1);
      let insertIdx = position === 'after' ? targetIdx + 1 : targetIdx;
      // Если targetIdx был ПОСЛЕ srcIdx, после splice он сдвинулся на -1.
      if (targetIdx > srcIdx) insertIdx -= 1;
      next.splice(insertIdx, 0, srcId);
      dispatch(
        updateComponents({
          [pagesId]: { ...pagesComponent, children: next } as any,
        }) as any,
      );
    },
    [dispatch, pageIds, pagesId, pagesComponent],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLButtonElement>, pageId: string) => {
      setDraggedId(pageId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', pageId);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLButtonElement>, pageId: string) => {
      if (!draggedId || draggedId === pageId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      // Определяем сторону drop'а по cursor-X относительно центра pill'а:
      // левая половина → before, правая → after.
      const rect = e.currentTarget.getBoundingClientRect();
      const middleX = rect.left + rect.width / 2;
      const position: 'before' | 'after' =
        e.clientX < middleX ? 'before' : 'after';
      setDropTargetId(pageId);
      setDropPosition(position);
    },
    [draggedId],
  );

  const handleDragLeave = useCallback(
    (pageId: string) => {
      if (dropTargetId === pageId) {
        setDropTargetId(null);
        setDropPosition(null);
      }
    },
    [dropTargetId],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLButtonElement>, pageId: string) => {
      e.preventDefault();
      if (draggedId && draggedId !== pageId && dropPosition) {
        handleReorder(draggedId, pageId, dropPosition);
      }
      setDraggedId(null);
      setDropTargetId(null);
      setDropPosition(null);
    },
    [draggedId, dropPosition, handleReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDropTargetId(null);
    setDropPosition(null);
  }, []);

  /**
   * Plus-кнопка позиционируется absolute внутри rail'а так, чтобы всегда
   * сидеть СПРАВА от последнего pill'а:
   *   • n=4 (ряд заполнен): plus в col 4 (overflow за правую границу).
   *   • n=5: plus в row 1 col 1 (рядом с 5-м пилом во втором ряду).
   *   • n=8 (2 ряда заполнены): plus в row 1 col 4 (overflow row 2 right).
   *   • n=0: plus в row 0 col 0.
   * Координаты вычисляются от LEFT/TOP rail-контейнера. С align-content:
   * flex-end строки рендерятся снизу вверх, row 0 = TOP container'а.
   */
  const plusStyle = useMemo<React.CSSProperties>(() => {
    if (!dockMetrics) return { display: 'none' };
    const n = pageIds.length;
    const pillW = (dockMetrics.width - 18) / 4;
    let plusRow: number;
    let plusCol: number;
    if (n === 0) {
      plusRow = 0;
      plusCol = 0;
    } else {
      plusRow = Math.floor((n - 1) / 4);
      plusCol = ((n - 1) % 4) + 1;
    }
    const left = plusCol * (pillW + 6);
    const top = plusRow * (28 + 6);
    return { left: `${left}px`, top: `${top}px` };
  }, [dockMetrics, pageIds.length]);

  if (!onDashboard || !pagesComponent || pageIds.length === 0) return null;

  return (
    <Rail
      ref={railRef}
      role="tablist"
      aria-label={t('Страницы дашборда')}
      data-hidden={hidden ? 'true' : 'false'}
      $metrics={dockMetrics}
      $hidden={hidden}
      $hasMiniRail={hasMiniRail}
    >
      {pageIds.map((pageId, idx) => {
        const page = (dashboardLayout as any)?.[pageId];
        const name =
          page?.meta?.text || page?.meta?.defaultText || t('Страница');
        const isActive = pageId === activePageId;
        const isEditing = editingPageId === pageId;
        const isMain = idx === 0;
        // Главную (первую) удалять нельзя; одну единственную страницу — тоже.
        const canDelete = pageIds.length > 1 && !isMain;
        const isDragOver = dropTargetId === pageId && draggedId !== pageId;

        return (
          <PagePill
            key={pageId}
            type="button"
            role="tab"
            aria-selected={isActive}
            $active={isActive}
            $dragOver={isDragOver}
            $dropPosition={isDragOver ? dropPosition : null}
            $dragging={draggedId === pageId}
            draggable={!isEditing}
            onClick={() => !isEditing && handlePageClick(pageId)}
            onDoubleClick={() => editMode && handleStartRename(pageId)}
            onDragStart={e => handleDragStart(e, pageId)}
            onDragOver={e => handleDragOver(e, pageId)}
            onDragLeave={() => handleDragLeave(pageId)}
            onDrop={e => handleDrop(e, pageId)}
            onDragEnd={handleDragEnd}
            title={name}
          >
            {isEditing ? (
              <PageNameInput
                ref={inputRef}
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={handleKeyDown}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <>
                <PageName>{name}</PageName>
                <PillActions data-pill-actions>
                  <PillActionBtn
                    type="button"
                    aria-label={t('Переименовать')}
                    title={t('Переименовать')}
                    onClick={e => {
                      e.stopPropagation();
                      handleStartRename(pageId);
                    }}
                  >
                    <IconEdit />
                  </PillActionBtn>
                  <PillActionBtn
                    type="button"
                    aria-label={t('Дублировать')}
                    title={t('Дублировать')}
                    onClick={e => {
                      e.stopPropagation();
                      handleCopyPage(pageId);
                    }}
                  >
                    <IconCopy />
                  </PillActionBtn>
                  {canDelete && (
                    <PillActionBtn
                      type="button"
                      $danger
                      aria-label={t('Удалить')}
                      title={t('Удалить')}
                      onClick={e => {
                        e.stopPropagation();
                        handleDeletePage(pageId);
                      }}
                    >
                      <IconDelete />
                    </PillActionBtn>
                  )}
                </PillActions>
              </>
            )}
          </PagePill>
        );
      })}

      <AddPageBtn
        type="button"
        onClick={handleAddPage}
        aria-label={t('Добавить страницу')}
        title={t('Добавить страницу')}
        style={plusStyle}
      >
        <IconPlus />
      </AddPageBtn>
    </Rail>
  );
};

export default DashboardPagesRail;
