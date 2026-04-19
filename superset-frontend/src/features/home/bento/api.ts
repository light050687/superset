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
 * Загрузка данных для Home bento: избранное, недавние.
 */
import { SupersetClient } from '@superset-ui/core';
import rison from 'rison';
import type { BentoItem } from './types';

interface DashboardApiRow {
  id: number;
  dashboard_title: string;
  url: string;
  changed_on_delta_humanized?: string;
  status?: string;
}

interface ChartApiRow {
  id: number;
  slice_name: string;
  url: string;
  changed_on_delta_humanized?: string;
  viz_type?: string;
}

interface RecentActivityRow {
  action: string;
  item_type: 'slice' | 'dashboard';
  item_url: string;
  item_title: string;
  time: number;
  time_delta_humanized?: string;
}

function isGeoViz(vizType?: string): boolean {
  if (!vizType) return false;
  return (
    vizType.startsWith('deck_') ||
    vizType === 'map_box' ||
    vizType === 'country_map' ||
    vizType === 'world_map'
  );
}

export async function fetchFavoriteDashboards(
  userId: number,
  pageSize = 6,
): Promise<BentoItem[]> {
  // Superset favorite filter: col:id, opr:dashboard_is_favorite, value:!t
  const q = rison.encode({
    filters: [{ col: 'id', opr: 'dashboard_is_favorite', value: true }],
    order_column: 'changed_on_delta_humanized',
    order_direction: 'desc',
    page: 0,
    page_size: pageSize,
  });
  const { json } = await SupersetClient.get({
    endpoint: `/api/v1/dashboard/?q=${q}`,
  });
  const rows = ((json as { result: DashboardApiRow[] }).result ?? []);
  return rows.map(row => ({
    id: row.id,
    title: row.dashboard_title,
    kind: 'dashboard',
    url: row.url,
    updatedHuman: row.changed_on_delta_humanized,
    starred: true,
    live: (row.status ?? '').toLowerCase() === 'published',
    objectType: 'dashboard',
  }));
}

export async function fetchFavoriteCharts(
  userId: number,
  pageSize = 6,
): Promise<BentoItem[]> {
  const q = rison.encode({
    filters: [{ col: 'id', opr: 'chart_is_favorite', value: true }],
    order_column: 'changed_on_delta_humanized',
    order_direction: 'desc',
    page: 0,
    page_size: pageSize,
  });
  const { json } = await SupersetClient.get({
    endpoint: `/api/v1/chart/?q=${q}`,
  });
  const rows = ((json as { result: ChartApiRow[] }).result ?? []);
  return rows.map(row => ({
    id: row.id,
    title: row.slice_name,
    kind: isGeoViz(row.viz_type) ? 'geo' : 'chart',
    url: row.url,
    updatedHuman: row.changed_on_delta_humanized,
    starred: true,
    live: false,
    objectType: 'chart',
  }));
}

export async function fetchRecentActivity(
  pageSize = 12,
): Promise<BentoItem[]> {
  const q = rison.encode({ page_size: pageSize, distinct: false });
  const { json } = await SupersetClient.get({
    endpoint: `/api/v1/log/recent_activity/?q=${q}`,
  });
  const rows = ((json as { result: RecentActivityRow[] }).result ?? []);
  // Убираем дубли по URL и фильтруем записи без url.
  const seen = new Set<string>();
  const deduped: RecentActivityRow[] = [];
  for (const row of rows) {
    if (!row.item_url || seen.has(row.item_url)) continue;
    seen.add(row.item_url);
    deduped.push(row);
  }
  return deduped.map(row => {
    // Вычленяем числовой id из URL. Для '/superset/dashboard/42/' => 42.
    const match = row.item_url.match(/\/(\d+)(?:\/|$)/);
    const id = match ? Number(match[1]) : 0;
    return {
      id,
      title: row.item_title,
      kind: row.item_type === 'dashboard' ? 'dashboard' : 'chart',
      url: row.item_url,
      updatedHuman: row.time_delta_humanized,
      starred: false,
      objectType: row.item_type === 'dashboard' ? 'dashboard' : 'chart',
    };
  });
}
