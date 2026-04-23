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

function loadFromStorage(dashboardId: number): FilterCategory[] {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${dashboardId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FilterCategoriesState;
    if (parsed?.version === 1 && Array.isArray(parsed.categories)) {
      return parsed.categories;
    }
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(
  dashboardId: number,
  categories: FilterCategory[],
): void {
  try {
    const payload: FilterCategoriesState = { version: 1, categories };
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
  /** Создать новую категорию в конец списка. Возвращает id новой. */
  addCategory: (name?: string) => string;
  /** Переименовать категорию. */
  renameCategory: (categoryId: string, name: string) => void;
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
  const [categories, setCategories] = useState<FilterCategory[]>(() =>
    loadFromStorage(dashboardId),
  );

  // Перезагружаем при смене дашборда.
  useEffect(() => {
    setCategories(loadFromStorage(dashboardId));
  }, [dashboardId]);

  // Любая мутация — сразу пишем в localStorage.
  useEffect(() => {
    saveToStorage(dashboardId, categories);
  }, [dashboardId, categories]);

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
    addCategory,
    renameCategory,
    deleteCategory,
    moveFilter,
    uncategorizedFilterIds,
  };
}
