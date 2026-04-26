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
 * GridGuidesContext — управление пользовательскими гайдами поверх
 * dashboard-grid (через DevToolsPanel → drawer «Сетка»).
 *
 * Семантика гайдов:
 *  - showColumns: 12-колоночный overlay (как при resize, но persistent)
 *  - showGrid: каждая колонка дополнительно разбита на квадраты
 *    (или прямоугольники, в зависимости от соотношения columnGap/rowGap)
 *    — соответствует фактической snap-сетке Superset
 *
 * Параметры (по умолчанию = стандарты Superset):
 *  - columnGap = GRID_GUTTER_SIZE (16px) — горизонтальный gap между колонками
 *  - rowGap    = GRID_BASE_UNIT  (8px)  — вертикальный gap между ячейками
 *
 * Реализация — module-level singleton store + useSyncExternalStore (React 18).
 * Provider-less: DevToolsPanel живёт в Shell.tsx (выше DashboardBuilder),
 * а DashboardGrid — внутри DashboardBuilder, и React-Context из одного
 * не дотянулся бы до другого.
 *
 * НЕ влияет на DnD-snap: re-resizable продолжает использовать стандартный
 * 12-колоночный grid (widthStep=columnWidth, heightStep=GRID_BASE_UNIT).
 *
 * Persist: localStorage `superset.gridGuides.v2` (v2 — поменялась схема:
 * gridStep → columnGap+rowGap; старые v1 ключи игнорируются и используется
 * default).
 */
import { useCallback, useSyncExternalStore } from 'react';

export interface GridGuidesState {
  /** Постоянный 12-колоночный overlay (без необходимости тащить чарт). */
  showColumns: boolean;
  /** Сетка ячеек внутри каждой колонки. */
  showGrid: boolean;
  /** Горизонтальный gap между колонками в px (default 16 = GRID_GUTTER_SIZE). */
  columnGap: number;
  /** Вертикальный gap между ячейками в px (default 8 = GRID_BASE_UNIT). */
  rowGap: number;
  /** Дробление колонки на горизонтальные ячейки (1=1 на колонку,
   *  2=2 в каждой колонке, итого 24, и т.д.). Делает сетку мельче,
   *  отступы (columnGap/rowGap) при этом не меняются. */
  subdivisions: number;
  /** Режим произвольных размеров — snap=1px, чарт можно ресайзить
   *  до любого пиксельного значения. Layout сохраняет
   *  meta.freePxWidth/freePxHeight; layoutMode=free. */
  freeMode: boolean;
}

/* Defaults = стандартные значения Superset-grid'а:
   - GRID_GUTTER_SIZE = 16 (см. dashboard/util/constants.ts)
   - GRID_BASE_UNIT   = 8  (heightStep в re-resizable) */
const DEFAULT_STATE: GridGuidesState = {
  showColumns: false,
  showGrid: false,
  columnGap: 16,
  rowGap: 16,
  subdivisions: 1,
  freeMode: false,
};

const LS_KEY = 'superset.gridGuides.v5';

const MIN_GAP = 0;
const MAX_GAP = 64;
const MIN_SUBDIVISIONS = 1;
const MAX_SUBDIVISIONS = 8;

function clampGap(n: number): number {
  return Math.max(MIN_GAP, Math.min(MAX_GAP, Math.round(n)));
}
function clampSub(n: number): number {
  return Math.max(MIN_SUBDIVISIONS, Math.min(MAX_SUBDIVISIONS, Math.round(n)));
}

function readPersist(): GridGuidesState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      showColumns:
        typeof parsed.showColumns === 'boolean'
          ? parsed.showColumns
          : DEFAULT_STATE.showColumns,
      showGrid:
        typeof parsed.showGrid === 'boolean'
          ? parsed.showGrid
          : DEFAULT_STATE.showGrid,
      columnGap:
        typeof parsed.columnGap === 'number'
          ? clampGap(parsed.columnGap)
          : DEFAULT_STATE.columnGap,
      rowGap:
        typeof parsed.rowGap === 'number'
          ? clampGap(parsed.rowGap)
          : DEFAULT_STATE.rowGap,
      subdivisions:
        typeof parsed.subdivisions === 'number'
          ? clampSub(parsed.subdivisions)
          : DEFAULT_STATE.subdivisions,
      freeMode:
        typeof parsed.freeMode === 'boolean'
          ? parsed.freeMode
          : DEFAULT_STATE.freeMode,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writePersist(state: GridGuidesState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* noop — приватный режим / квота полная */
  }
}

/* ─── Module-level store (singleton) ─────────────────────────────── */

type Listener = () => void;

let currentState: GridGuidesState = readPersist();
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach(l => l());
}

function shallowEqual(a: GridGuidesState, b: GridGuidesState): boolean {
  return (
    a.showColumns === b.showColumns &&
    a.showGrid === b.showGrid &&
    a.columnGap === b.columnGap &&
    a.rowGap === b.rowGap &&
    a.subdivisions === b.subdivisions &&
    a.freeMode === b.freeMode
  );
}

function setState(patch: Partial<GridGuidesState>): void {
  const next: GridGuidesState = { ...currentState, ...patch };
  if (shallowEqual(next, currentState)) return;
  currentState = next;
  writePersist(next);
  emit();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): GridGuidesState {
  return currentState;
}

/* Cross-tab sync. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === LS_KEY) {
      const next = readPersist();
      if (!shallowEqual(next, currentState)) {
        currentState = next;
        emit();
      }
    }
  });
}

/* ─── Public API ─────────────────────────────────────────────────── */

export interface GridGuidesApi {
  state: GridGuidesState;
  setShowColumns: (v: boolean) => void;
  setShowGrid: (v: boolean) => void;
  setColumnGap: (v: number) => void;
  setRowGap: (v: number) => void;
  setSubdivisions: (v: number) => void;
  setFreeMode: (v: boolean) => void;
  reset: () => void;
}

/**
 * Hook для чтения/изменения GridGuides state. Singleton — работает в
 * любой части React-дерева без обёртки в Provider.
 */
export const useGridGuides = (): GridGuidesApi => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setShowColumns = useCallback(
    (v: boolean) => setState({ showColumns: v }),
    [],
  );
  const setShowGrid = useCallback(
    (v: boolean) => setState({ showGrid: v }),
    [],
  );
  const setColumnGap = useCallback(
    (v: number) => setState({ columnGap: clampGap(v) }),
    [],
  );
  const setRowGap = useCallback(
    (v: number) => setState({ rowGap: clampGap(v) }),
    [],
  );
  const setSubdivisions = useCallback(
    (v: number) => setState({ subdivisions: clampSub(v) }),
    [],
  );
  const setFreeMode = useCallback(
    (v: boolean) => setState({ freeMode: v }),
    [],
  );
  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return {
    state,
    setShowColumns,
    setShowGrid,
    setColumnGap,
    setRowGap,
    setSubdivisions,
    setFreeMode,
    reset,
  };
};

export const GRID_GUIDES_LIMITS = {
  minGap: MIN_GAP,
  maxGap: MAX_GAP,
  minSubdivisions: MIN_SUBDIVISIONS,
  maxSubdivisions: MAX_SUBDIVISIONS,
};

export const GRID_GUIDES_DEFAULTS = DEFAULT_STATE;
