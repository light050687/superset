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
 * Категория для kanban-grid фильтров. Юзер распределяет фильтры по
 * категориям (колонкам) вручную — «Временные фильтры», «Департаменты»,
 * «Географические» и т.п. Один фильтр принадлежит максимум одной
 * категории; нераспределённые попадают в дефолтный bucket.
 */
export interface FilterCategory {
  id: string;
  name: string;
  /** ID'шники нативных фильтров (state.nativeFilters.filters[id]). */
  filterIds: string[];
}

/** Персистентная форма сохраняется в localStorage на дашборд. */
export interface FilterCategoriesState {
  categories: FilterCategory[];
  /** Переопределённое название колонки «Нераспределённые». null/undef —
   *  используется дефолт. Позволяет юзеру её переименовать. */
  uncategorizedName?: string | null;
  /** Переопределённое название колонки «Пресеты». */
  presetsName?: string | null;
  /** Версия схемы — пригодится при миграции формата. */
  version: 1;
}
