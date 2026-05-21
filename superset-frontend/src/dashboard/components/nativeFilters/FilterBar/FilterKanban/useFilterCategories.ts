/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * useFilterCategories — локальное хранилище категорий фильтров для
 * kanban-UI в FiltersDrawer. Персистится в localStorage на ID дашборда,
 * чтобы у каждого дашборда был свой набор колонок.
 *
 * **MVP:** нет backend-персистентности — юзер видит колонки между
 * сессиями только на той же машине. Позже можно будет переехать на
 * `dashboard.json_metadata.filter_categories`.
 */
import { useCallback, useEffect, useState } from 'react';
import type { FilterCategory, FilterCategoriesState } from './types';

const STORAGE_PREFIX = 'superset:filter-categories:';

const newId = (): string =>
  `cat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

interface LoadResult {
  categories: FilterCategory[];
  uncategorizedName: string | null;
  presetsName: string | null;
}

function loadFromStorage(dashboardId: number): LoadResult {
  const fallback: LoadResult = {
    categories: [],
    uncategorizedName: null,
    presetsName: null,
  };
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${dashboardId}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as FilterCategoriesState;
    if (parsed?.version === 1 && Array.isArray(parsed.categories)) {
      return {
        categories: parsed.categories,
        uncategorizedName: parsed.uncategorizedName ?? null,
        presetsName: parsed.presetsName ?? null,
      };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(dashboardId: number, state: LoadResult): void {
  try {
    const payload: FilterCategoriesState = {
      version: 1,
      categories: state.categories,
      uncategorizedName: state.uncategorizedName ?? null,
      presetsName: state.presetsName ?? null,
    };
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${dashboardId}`,
      JSON.stringify(payload),
    );
  } catch {
    // localStorage может быть недоступен (quota / private mode) — игнор.
  }
}

export interface UseFilterCategoriesResult {
  categories: FilterCategory[];
  /** Переопределённое название колонки «Нераспределённые» (или null,
   *  тогда потребитель использует дефолт t('Нераспределённые')). */
  uncategorizedName: string | null;
  /** Переопределённое название колонки «Пресеты». */
  presetsName: string | null;
  /** Создать новую категорию в конец списка. Возвращает id новой. */
  addCategory: (name?: string) => string;
  /** Переименовать категорию. */
  renameCategory: (categoryId: string, name: string) => void;
  /** Переименовать спец-колонку (uncategorized | presets). */
  renameSpecial: (kind: 'uncategorized' | 'presets', name: string) => void;
  /** Удалить категорию. Её фильтры становятся нераспределёнными. */
  deleteCategory: (categoryId: string) => void;
  /**
   * Переместить фильтр в указанную категорию. `toCategoryId=null` —
   * вынести фильтр в нераспределённые.
   */
  moveFilter: (filterId: string, toCategoryId: string | null) => void;
  /**
   * Массив id нераспределённых фильтров (переданных в `allFilterIds`, но
   * не числящихся ни в одной категории).
   */
  uncategorizedFilterIds: (allFilterIds: string[]) => string[];
}

export function useFilterCategories(
  dashboardId: number,
): UseFilterCategoriesResult {
  const [categories, setCategories] = useState<FilterCategory[]>(
    () => loadFromStorage(dashboardId).categories,
  );
  const [uncategorizedName, setUncategorizedName] = useState<string | null>(
    () => loadFromStorage(dashboardId).uncategorizedName,
  );
  const [presetsName, setPresetsName] = useState<string | null>(
    () => loadFromStorage(dashboardId).presetsName,
  );

  // Перезагружаем при смене дашборда.
  useEffect(() => {
    const loaded = loadFromStorage(dashboardId);
    setCategories(loaded.categories);
    setUncategorizedName(loaded.uncategorizedName);
    setPresetsName(loaded.presetsName);
  }, [dashboardId]);

  // Любая мутация — сразу пишем в localStorage.
  useEffect(() => {
    saveToStorage(dashboardId, {
      categories,
      uncategorizedName,
      presetsName,
    });
  }, [dashboardId, categories, uncategorizedName, presetsName]);

  const addCategory = useCallback((name = ''): string => {
    const id = newId();
    setCategories(prev => [...prev, { id, name, filterIds: [] }]);
    return id;
  }, []);

  const renameCategory = useCallback(
    (categoryId: string, name: string): void => {
      setCategories(prev =>
        prev.map(c => (c.id === categoryId ? { ...c, name } : c)),
      );
    },
    [],
  );

  const renameSpecial = useCallback(
    (kind: 'uncategorized' | 'presets', name: string): void => {
      const trimmed = name.trim();
      const value = trimmed || null;
      if (kind === 'uncategorized') setUncategorizedName(value);
      else setPresetsName(value);
    },
    [],
  );

  const deleteCategory = useCallback((categoryId: string): void => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  }, []);

  const moveFilter = useCallback(
    (filterId: string, toCategoryId: string | null): void => {
      setCategories(prev => {
        // Снимаем фильтр из прежней категории (если была).
        const detached = prev.map(c =>
          c.filterIds.includes(filterId)
            ? { ...c, filterIds: c.filterIds.filter(f => f !== filterId) }
            : c,
        );
        if (toCategoryId === null) return detached;
        // Ставим в целевую.
        return detached.map(c =>
          c.id === toCategoryId && !c.filterIds.includes(filterId)
            ? { ...c, filterIds: [...c.filterIds, filterId] }
            : c,
        );
      });
    },
    [],
  );

  const uncategorizedFilterIds = useCallback(
    (allFilterIds: string[]): string[] => {
      const assigned = new Set(categories.flatMap(c => c.filterIds));
      return allFilterIds.filter(id => !assigned.has(id));
    },
    [categories],
  );

  return {
    categories,
    uncategorizedName,
    presetsName,
    addCategory,
    renameCategory,
    renameSpecial,
    deleteCategory,
    moveFilter,
    uncategorizedFilterIds,
  };
}
