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
 *
 * FilterSearchContext — общее состояние поискового поля в шапке
 * FiltersDrawer'а. Один input фильтрует сразу всё:
 *   • presets (через fetchPresets с query-параметром);
 *   • filter-карточки (по filter.name, case-insensitive);
 *   • kanban-колонки (с 0 совпадений — скрыты; спец-колонки
 *     «Нераспределённые» и «Пресеты» остаются всегда).
 */
import { createContext, useContext } from 'react';

export interface FilterSearchContextValue {
  query: string;
  setQuery: (v: string) => void;
}

export const FilterSearchContext = createContext<FilterSearchContextValue>({
  query: '',
  setQuery: () => {},
});

export const useFilterSearch = (): FilterSearchContextValue =>
  useContext(FilterSearchContext);
