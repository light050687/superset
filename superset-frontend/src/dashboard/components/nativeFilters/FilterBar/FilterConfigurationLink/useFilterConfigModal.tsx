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
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setFilterConfiguration } from 'src/dashboard/actions/nativeFilters';
import { SaveFilterChangesType } from 'src/dashboard/components/nativeFilters/FiltersConfigModal/types';
import FiltersConfigModal from 'src/dashboard/components/nativeFilters/FiltersConfigModal/FiltersConfigModal';

interface UseFilterConfigModalProps {
  createNewOnOpen?: boolean;
  dashboardId: number;
  initialFilterId?: string;
}

interface UseFilterConfigModalReturn {
  isFilterConfigModalOpen: boolean;
  /** Без аргумента — создать новый фильтр (modal сразу показывает форму
   *  пустого нового filter'а в single-mode).
   *  С аргументом — открыть форму редактирования конкретного фильтра. */
  openFilterConfigModal: (filterId?: string) => void;
  closeFilterConfigModal: () => void;
  handleFilterSave: (filterChanges: SaveFilterChangesType) => Promise<void>;
  FilterConfigModalComponent: JSX.Element | null;
}

export const useFilterConfigModal = ({
  createNewOnOpen = false,
  dashboardId,
  initialFilterId,
}: UseFilterConfigModalProps): UseFilterConfigModalReturn => {
  const dispatch = useDispatch();
  const [isFilterConfigModalOpen, setIsFilterConfigModalOpen] = useState(false);
  /* pendingFilterId — override initialFilterId per вызов openFilterConfigModal(id).
     Если не передан — fallback на initialFilterId из хук-пропсов. */
  const [pendingFilterId, setPendingFilterId] = useState<string | undefined>(
    undefined,
  );
  /* shouldCreateNew — выставляется в true, когда openFilterConfigModal()
     вызван БЕЗ filterId (т.е. это «+ Add Filter» в drawer'е). Прокидывается
     в FiltersConfigModal как createNewOnOpen, который автоматически
     добавляет пустой filter и фокусит форму на нём. */
  const [shouldCreateNew, setShouldCreateNew] = useState(false);

  const openFilterConfigModal = useCallback((filterId?: string) => {
    /* Defensive: при привязке к JSX onClick React передаёт SyntheticEvent.
       Без проверки event-объект бы трактовался как filterId. */
    const id = typeof filterId === 'string' ? filterId : undefined;
    setPendingFilterId(id);
    setShouldCreateNew(id === undefined);
    setIsFilterConfigModalOpen(true);
  }, []);

  const closeFilterConfigModal = useCallback(() => {
    setIsFilterConfigModalOpen(false);
  }, []);

  const handleFilterSave = useCallback(
    async (filterChanges: SaveFilterChangesType) => {
      dispatch(await setFilterConfiguration(filterChanges));
      closeFilterConfigModal();
    },
    [dispatch, closeFilterConfigModal],
  );

  const FilterConfigModalComponent = isFilterConfigModalOpen ? (
    <FiltersConfigModal
      isOpen={isFilterConfigModalOpen}
      onSave={handleFilterSave}
      onCancel={closeFilterConfigModal}
      key={`filters-for-${dashboardId}`}
      /* createNewOnOpen — true когда «+ Add filter» (открытие без filterId).
         FiltersConfigModal автоматически добавит пустой новый filter
         и установит его текущим. */
      createNewOnOpen={createNewOnOpen || shouldCreateNew}
      initialFilterId={pendingFilterId ?? initialFilterId}
      /* singleFilterMode ВСЕГДА true в нашем Kanban flow: список фильтров
         уже виден в drawer'е (Kanban-колонки), повторно показывать его
         в модалке избыточно. Modal становится «edit only this filter»
         (или «create new and immediately edit»). */
      singleFilterMode
    />
  ) : null;

  return {
    isFilterConfigModalOpen,
    openFilterConfigModal,
    closeFilterConfigModal,
    handleFilterSave,
    FilterConfigModalComponent,
  };
};
