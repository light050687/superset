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
 * Стратегия загрузки чартов дашборда — types, defaults, selectors, hook.
 *
 * Хранится per-dashboard в `json_metadata.fetch_strategy`. Управляется
 * через DevToolsPanel → DashboardSettingsDrawer → saveFetchStrategy thunk.
 */
import { useSelector, shallowEqual } from 'react-redux';
import type { RootState } from 'src/dashboard/types';
import {
  FETCH_QUEUE_DEFAULT_CONCURRENCY,
  FETCH_QUEUE_MIN_CONCURRENCY,
  FETCH_QUEUE_MAX_CONCURRENCY,
} from './chartFetchQueue';

export interface FetchStrategyMetadata {
  /** Max одновременных fetch'ей в queue. 1-12, default 8. */
  concurrency: number;
  /** Off-screen чарты не fires runQuery до scroll (через IntersectionObserver). */
  lazy_offscreen: boolean;
  /** DS 2.0 shimmer placeholder поверх loading чарта. */
  show_skeletons: boolean;
}

export const DEFAULT_FETCH_STRATEGY: FetchStrategyMetadata = {
  concurrency: FETCH_QUEUE_DEFAULT_CONCURRENCY,
  lazy_offscreen: true,
  show_skeletons: true,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Безопасно прочитать fetch strategy из json_metadata. Возвращает
 * defaults если поле отсутствует или содержит невалидные значения.
 */
export function readFetchStrategy(
  metadata: Record<string, any> | null | undefined,
): FetchStrategyMetadata {
  const raw = (metadata?.fetch_strategy as Partial<FetchStrategyMetadata>) || {};
  return {
    concurrency: clamp(
      Number.isFinite(raw.concurrency)
        ? Number(raw.concurrency)
        : DEFAULT_FETCH_STRATEGY.concurrency,
      FETCH_QUEUE_MIN_CONCURRENCY,
      FETCH_QUEUE_MAX_CONCURRENCY,
    ),
    lazy_offscreen:
      typeof raw.lazy_offscreen === 'boolean'
        ? raw.lazy_offscreen
        : DEFAULT_FETCH_STRATEGY.lazy_offscreen,
    show_skeletons:
      typeof raw.show_skeletons === 'boolean'
        ? raw.show_skeletons
        : DEFAULT_FETCH_STRATEGY.show_skeletons,
  };
}

export const selectFetchStrategy = (state: RootState): FetchStrategyMetadata =>
  readFetchStrategy(state.dashboardInfo?.metadata);

/**
 * React hook для получения текущей стратегии. shallowEqual чтобы избежать
 * лишних re-render'ов на каждый Redux dispatch.
 */
export function useFetchStrategy(): FetchStrategyMetadata {
  return useSelector(selectFetchStrategy, shallowEqual);
}

export {
  FETCH_QUEUE_MIN_CONCURRENCY,
  FETCH_QUEUE_MAX_CONCURRENCY,
} from './chartFetchQueue';
