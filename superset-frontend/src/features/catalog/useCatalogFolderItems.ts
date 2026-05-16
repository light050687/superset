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
 * Подтягивает объекты (dashboard/chart) из папки каталога с meta-информацией.
 * Идея: `listCatalogItems` даёт лёгкие DTO {object_type, object_id, position},
 * затем батч-запросом читаем /api/v1/dashboard/ или /api/v1/chart/ по id_in.
 */
import { SupersetClient } from '@superset-ui/core';
import rison from 'rison';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listCatalogItems } from './api';
import type { CatalogObjectType } from './types';

export type DrilledScope = 'dashboard' | 'chart';

export interface DrilledItem {
  id: number;
  title: string;
  kind: DrilledScope;
  meta: string;
  url: string;
  objectType: CatalogObjectType;
  updated: string;
}

interface DashboardRow {
  id: number;
  dashboard_title: string;
  url: string;
  changed_on?: string;
  changed_on_delta_humanized?: string;
}

interface ChartRow {
  id: number;
  slice_name: string;
  url: string;
  viz_type?: string;
  changed_on?: string;
  changed_on_delta_humanized?: string;
}

async function fetchDashboardsByIds(ids: number[]): Promise<DashboardRow[]> {
  if (ids.length === 0) return [];
  const q = rison.encode({
    filters: [{ col: 'id', opr: 'in', value: ids }],
    page: 0,
    page_size: 100,
  });
  const { json } = await SupersetClient.get({
    endpoint: `/api/v1/dashboard/?q=${q}`,
  });
  return (json as { result: DashboardRow[] }).result ?? [];
}

async function fetchChartsByIds(ids: number[]): Promise<ChartRow[]> {
  if (ids.length === 0) return [];
  const q = rison.encode({
    filters: [{ col: 'id', opr: 'in', value: ids }],
    page: 0,
    page_size: 100,
  });
  const { json } = await SupersetClient.get({
    endpoint: `/api/v1/chart/?q=${q}`,
  });
  return (json as { result: ChartRow[] }).result ?? [];
}

export interface UseCatalogFolderItemsState {
  items: DrilledItem[];
  loading: boolean;
  error: string | null;
}

export function useCatalogFolderItems(
  folderId: number | null,
  scope: DrilledScope,
): UseCatalogFolderItemsState {
  const [items, setItems] = useState<DrilledItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const reqIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (folderId === null) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const rows = await listCatalogItems(folderId);
      const ids = rows
        .filter(r => r.object_type === scope)
        .map(r => r.object_id);
      if (ids.length === 0) {
        if (mountedRef.current && reqIdRef.current === reqId) {
          setItems([]);
          setLoading(false);
        }
        return;
      }
      if (scope === 'dashboard') {
        const result = await fetchDashboardsByIds(ids);
        if (!mountedRef.current || reqIdRef.current !== reqId) return;
        const byId = new Map(result.map(r => [r.id, r]));
        const ordered: DrilledItem[] = rows
          .filter(r => r.object_type === 'dashboard')
          .map(r => byId.get(r.object_id))
          .filter((r): r is DashboardRow => Boolean(r))
          .map(r => ({
            id: r.id,
            title: r.dashboard_title,
            kind: 'dashboard' as const,
            meta: `Дашборд · ${r.changed_on_delta_humanized ?? ''}`.trim(),
            url: r.url,
            objectType: 'dashboard' as CatalogObjectType,
            updated: r.changed_on_delta_humanized ?? '',
          }));
        setItems(ordered);
      } else {
        const result = await fetchChartsByIds(ids);
        if (!mountedRef.current || reqIdRef.current !== reqId) return;
        const byId = new Map(result.map(r => [r.id, r]));
        const ordered: DrilledItem[] = rows
          .filter(r => r.object_type === 'chart')
          .map(r => byId.get(r.object_id))
          .filter((r): r is ChartRow => Boolean(r))
          .map(r => ({
            id: r.id,
            title: r.slice_name,
            kind: 'chart' as const,
            meta: `${r.viz_type ?? 'Чарт'} · ${r.changed_on_delta_humanized ?? ''}`.trim(),
            url: r.url,
            objectType: 'chart' as CatalogObjectType,
            updated: r.changed_on_delta_humanized ?? '',
          }));
        setItems(ordered);
      }
    } catch (err) {
      if (!mountedRef.current || reqIdRef.current !== reqId) return;
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки';
      setError(msg);
    } finally {
      if (mountedRef.current && reqIdRef.current === reqId) {
        setLoading(false);
      }
    }
  }, [folderId, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(() => ({ items, loading, error }), [items, loading, error]);
}
