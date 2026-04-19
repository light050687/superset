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
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchFavoriteCharts,
  fetchFavoriteDashboards,
  fetchRecentActivity,
} from './api';
import type { BentoItem } from './types';

export interface BentoDataState {
  favorites: BentoItem[];
  recents: BentoItem[];
  loadingFavorites: boolean;
  loadingRecents: boolean;
  error: string | null;
}

export function useBentoData(userId?: number): BentoDataState & {
  refresh: () => Promise<void>;
} {
  const [favorites, setFavorites] = useState<BentoItem[]>([]);
  const [recents, setRecents] = useState<BentoItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingRecents, setLoadingRecents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (userId == null) {
      setLoadingFavorites(false);
      setLoadingRecents(false);
      return;
    }
    setLoadingFavorites(true);
    setLoadingRecents(true);
    setError(null);
    try {
      const [dashboardFavs, chartFavs, recentData] = await Promise.all([
        fetchFavoriteDashboards(userId).catch(() => [] as BentoItem[]),
        fetchFavoriteCharts(userId).catch(() => [] as BentoItem[]),
        fetchRecentActivity().catch(() => [] as BentoItem[]),
      ]);
      if (!mounted.current) return;
      setFavorites([...dashboardFavs, ...chartFavs]);
      setRecents(recentData);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      if (mounted.current) {
        setLoadingFavorites(false);
        setLoadingRecents(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    favorites,
    recents,
    loadingFavorites,
    loadingRecents,
    error,
    refresh,
  };
}
