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

/* eslint-disable no-param-reassign */
// <- When we work with Immer, we need reassign, so disabling lint
import { produce } from 'immer';
import {
  DataMask,
  DataMaskStateWithId,
  DataMaskWithId,
  Filter,
  FilterConfiguration,
  Filters,
  FilterState,
  ExtraFormData,
} from '@superset-ui/core';
import { NATIVE_FILTER_PREFIX } from 'src/dashboard/components/nativeFilters/FiltersConfigModal/utils';
import { HYDRATE_DASHBOARD } from 'src/dashboard/actions/hydrate';
import { SaveFilterChangesType } from 'src/dashboard/components/nativeFilters/FiltersConfigModal/types';
import { isEqual } from 'lodash';
import {
  AnyDataMaskAction,
  CLEAR_DATA_MASK_STATE,
  SET_DATA_MASK_FOR_FILTER_CHANGES_COMPLETE,
  UPDATE_DATA_MASK,
} from './actions';
import { areObjectsEqual } from '../reduxUtils';

type FilterWithExtaFromData = Filter & {
  extraFormData?: ExtraFormData;
  filterState?: FilterState;
  ownState?: Record<string, unknown>;
};

export function getInitialDataMask(
  id?: string | number,
  moreProps: DataMask = {},
): DataMask | DataMaskWithId {
  return {
    ...(id !== undefined ? { id } : {}),
    extraFormData: {},
    filterState: {},
    ownState: {},
    ...moreProps,
  } as DataMask | DataMaskWithId;
}

function fillNativeFilters(
  filterConfig: FilterConfiguration,
  mergedDataMask: DataMaskStateWithId,
  draftDataMask: DataMaskStateWithId,
  initialDataMask?: DataMaskStateWithId,
  currentFilters?: Filters,
) {
  filterConfig.forEach((filter: Filter) => {
    const dataMask = initialDataMask || {};
    mergedDataMask[filter.id] = {
      ...getInitialDataMask(filter.id), // take initial data
      ...filter.defaultDataMask, // if something new came from BE - take it
      ...dataMask[filter.id],
    };
    if (
      currentFilters &&
      !areObjectsEqual(
        filter.defaultDataMask,
        currentFilters[filter.id]?.defaultDataMask,
        { ignoreUndefined: true },
      )
    ) {
      mergedDataMask[filter.id] = {
        ...mergedDataMask[filter.id],
        ...filter.defaultDataMask,
      };
    }
  });

  // Get back all other non-native filters
  Object.values(draftDataMask).forEach(filter => {
    if (!String(filter?.id).startsWith(NATIVE_FILTER_PREFIX)) {
      mergedDataMask[filter?.id] = filter;
    }
  });
}

function updateDataMaskForFilterChanges(
  filterChanges: SaveFilterChangesType,
  mergedDataMask: DataMaskStateWithId,
  draftDataMask: DataMaskStateWithId,
  initialDataMask?: Filters,
) {
  const dataMask = initialDataMask || {};

  /* Сохраняем пользовательский выбор (filterState/extraFormData/ownState)
     для ВСЕХ фильтров, существовавших до save-операции. Раньше тут
     был ресет к value.defaultDataMask — это сбрасывало выбранные
     значения при ЛЮБОМ изменении конфигурации (rename/add/delete
     другого фильтра). Юзер ожидает, что rename фильтра B не должен
     обнулять выбор фильтра A. */
  Object.entries(dataMask).forEach(([key, value]) => {
    const existing = draftDataMask[key];
    mergedDataMask[key] = existing
      ? { ...value, ...existing }
      : { ...value, ...value.defaultDataMask };
  });

  filterChanges.deleted.forEach((filterId: string) => {
    delete mergedDataMask[filterId];
  });

  filterChanges.modified.forEach((filter: Filter) => {
    const existingFilter = draftDataMask[filter.id] as FilterWithExtaFromData;

    // Targets equal → старый filterState совместим с новым target'ом.
    const areTargetsEqual = isEqual(existingFilter?.targets, filter?.targets);

    /* preserveState: раньше требовался enableEmptyFilter/defaultToFirstItem.
       Сейчас — ЛЮБОЙ существующий фильтр с теми же targets'ами сохраняет
       выбор. Покрывает обычный случай rename / config-change без смены
       column'ы / datasetа, где user's selection должна выжить. */
    const shouldPreserveState = existingFilter && areTargetsEqual;

    mergedDataMask[filter.id] = {
      ...getInitialDataMask(filter.id),
      ...filter.defaultDataMask,
      ...filter,
      ...(shouldPreserveState && {
        extraFormData: existingFilter.extraFormData,
        filterState: existingFilter.filterState,
        ownState: existingFilter.ownState,
      }),
    };
  });

  Object.values(draftDataMask).forEach(filter => {
    if (!String(filter?.id).startsWith(NATIVE_FILTER_PREFIX)) {
      mergedDataMask[filter?.id] = filter;
    }
  });
}

const dataMaskReducer = produce(
  (draft: DataMaskStateWithId, action: AnyDataMaskAction) => {
    const cleanState: DataMaskStateWithId = {};
    switch (action.type) {
      case CLEAR_DATA_MASK_STATE:
        return cleanState;
      case UPDATE_DATA_MASK:
        draft[action.filterId] = {
          ...getInitialDataMask(action.filterId),
          ...draft[action.filterId],
          ...action.dataMask,
        };
        return draft;
      // TODO: update hydrate to .ts
      // @ts-ignore
      case HYDRATE_DASHBOARD:
        Object.keys(
          // @ts-ignore
          action.data.dashboardInfo?.metadata?.chart_configuration,
        ).forEach(id => {
          cleanState[id] = {
            ...(getInitialDataMask(id) as DataMaskWithId), // take initial data
          };
        });
        fillNativeFilters(
          // @ts-ignore
          action.data.dashboardInfo?.metadata?.native_filter_configuration ??
            [],
          cleanState,
          draft,
          // @ts-ignore
          action.data.dataMask,
        );
        return cleanState;
      case SET_DATA_MASK_FOR_FILTER_CHANGES_COMPLETE:
        updateDataMaskForFilterChanges(
          action.filterChanges,
          cleanState,
          draft,
          action.filters,
        );
        return cleanState;
      default:
        return draft;
    }
  },
  {},
);

export default dataMaskReducer;
