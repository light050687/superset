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
 * Thunk для сохранения fetch_strategy в json_metadata дашборда.
 *
 * Паттерн копирует saveCrossFiltersSetting из dashboardInfo.ts —
 * PUT /api/v1/dashboard/:id с partial json_metadata, потом dispatch
 * dashboardInfoChanged для синхронизации Redux state с БД.
 */
import { Dispatch } from 'redux';
import { omit } from 'lodash';
import { makeApi, getErrorText } from '@superset-ui/core';
import { addDangerToast } from 'src/components/MessageToasts/actions';
import type { DashboardInfo, RootState } from 'src/dashboard/types';
import {
  type FetchStrategyMetadata,
  readFetchStrategy,
} from 'src/dashboard/utils/fetchStrategy';
import { setQueueConcurrency } from 'src/dashboard/utils/chartFetchQueue';
import { dashboardInfoChanged } from './dashboardInfo';
import { onSave, setRefreshFrequency } from './dashboardState';

/**
 * Поля metadata, которые НЕ сохраняем через PUT — computed на бэкенде или
 * принадлежат другим endpoint'ам (positions через slices, label_colors
 * через runtime). Тот же whitelist что в PropertiesModal.
 */
const METADATA_NON_SAVEABLE_KEYS = [
  'positions',
  'shared_label_colors',
  'map_label_colors',
  'color_scheme_domain',
];

/**
 * Сохраняет стратегию загрузки в json_metadata.fetch_strategy. После
 * успешного PUT обновляет Redux state через dashboardInfoChanged +
 * применяет concurrency немедленно к существующей очереди.
 */
export function saveFetchStrategy(strategy: FetchStrategyMetadata) {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const { id, metadata } = getState().dashboardInfo;
    const updateDashboard = makeApi<
      Partial<DashboardInfo>,
      { result: Partial<DashboardInfo>; last_modified_time: number }
    >({
      method: 'PUT',
      endpoint: `/api/v1/dashboard/${id}`,
    });
    try {
      const cleanedMetadata = omit(metadata, METADATA_NON_SAVEABLE_KEYS);
      const response = await updateDashboard({
        json_metadata: JSON.stringify({
          ...cleanedMetadata,
          fetch_strategy: strategy,
        }),
      });
      const updatedDashboard = response.result;
      const lastModifiedTime = response.last_modified_time;
      if (updatedDashboard.json_metadata) {
        const parsedMetadata = JSON.parse(updatedDashboard.json_metadata);
        dispatch(
          dashboardInfoChanged({
            metadata: {
              ...metadata,
              ...parsedMetadata,
              fetch_strategy: readFetchStrategy(parsedMetadata),
            },
          }),
        );
        // Применяем concurrency немедленно — новые fetch'и сразу с new limit
        setQueueConcurrency(strategy.concurrency);
      }
      if (lastModifiedTime) {
        // @ts-ignore — onSave не типизирован в JS-thunk
        dispatch(onSave(lastModifiedTime));
      }
    } catch (errorObject) {
      const errorText = await getErrorText(errorObject, 'dashboard');
      dispatch(addDangerToast(errorText));
      throw errorObject;
    }
  };
}

/**
 * Сохраняет интервал авто-обновления в json_metadata.refresh_frequency.
 * Immediate-save (как saveFetchStrategy), не ждёт глобального dashboard
 * save из Header. После PUT'а синхронизирует Redux state и снимает
 * shouldPersistRefreshFrequency флаг (он нужен только legacy-flow'у в
 * Header.jsx, у нас уже сохранили).
 */
export function saveRefreshFrequency(refreshFrequency: number) {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const { id, metadata } = getState().dashboardInfo;
    const updateDashboard = makeApi<
      Partial<DashboardInfo>,
      { result: Partial<DashboardInfo>; last_modified_time: number }
    >({
      method: 'PUT',
      endpoint: `/api/v1/dashboard/${id}`,
    });
    try {
      const cleanedMetadata = omit(metadata, METADATA_NON_SAVEABLE_KEYS);
      const response = await updateDashboard({
        json_metadata: JSON.stringify({
          ...cleanedMetadata,
          refresh_frequency: refreshFrequency,
        }),
      });
      const updatedDashboard = response.result;
      const lastModifiedTime = response.last_modified_time;
      if (updatedDashboard.json_metadata) {
        const parsedMetadata = JSON.parse(updatedDashboard.json_metadata);
        dispatch(
          dashboardInfoChanged({
            metadata: {
              ...metadata,
              ...parsedMetadata,
            },
          }),
        );
        // setRefreshFrequency(value, false) — Header.jsx подписан на
        // dashboardState.refreshFrequency и перезапускает PeriodicalChart
        // refresh с новым интервалом. isPersistent=false — не помечаем
        // dashboard как dirty (уже сохранили на backend).
        // @ts-ignore — JS thunk не типизирован
        dispatch(setRefreshFrequency(refreshFrequency, false));
      }
      if (lastModifiedTime) {
        // @ts-ignore — onSave не типизирован в JS-thunk
        dispatch(onSave(lastModifiedTime));
      }
    } catch (errorObject) {
      const errorText = await getErrorText(errorObject, 'dashboard');
      dispatch(addDangerToast(errorText));
      throw errorObject;
    }
  };
}
