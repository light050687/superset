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

interface TagRow {
  id: number;
  name: string;
  type?: string;
}

interface DashboardApiRow {
  id: number;
  dashboard_title: string;
  url: string;
  changed_on_delta_humanized?: string;
  changed_on?: string;
  status?: string;
  tags?: TagRow[];
}

interface ChartApiRow {
  id: number;
  slice_name: string;
  url: string;
  changed_on_delta_humanized?: string;
  changed_on?: string;
  viz_type?: string;
  tags?: TagRow[];
}

/** Русская «сколько прошло времени» на основе ISO timestamp. Возвращает
 *  короткую форму: «35с», «12м», «3ч», «5д», «2нед», «1мес», «3г».
 *  Без зависимостей (dayjs/date-fns) — простая арифметика над Date. */
export function humanizeRu(iso?: string): string {
  if (!iso) return '';
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}с`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ч`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}д`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}нед`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}мес`;
  return `${Math.floor(d / 365)}г`;
}

/** Извлекает короткие custom-тэги, которые пользователь повесил на
 *  объект через UI Superset'а. type=='custom' отсеивает системные тэги
 *  вроде `type:dashboard`, `owner:admin` и т.п. Возвращаем только имена. */
function extractCustomTagNames(rows?: TagRow[]): string[] {
  if (!rows || rows.length === 0) return [];
  return rows
    .filter(r => !r.type || r.type === 'custom')
    .map(r => r.name)
    .filter(Boolean);
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
  const rows = (json as { result: DashboardApiRow[] }).result ?? [];
  return rows.map(row => ({
    id: row.id,
    title: row.dashboard_title,
    kind: 'dashboard',
    url: row.url,
    updatedHuman: humanizeRu(row.changed_on) || row.changed_on_delta_humanized,
    starred: true,
    live: (row.status ?? '').toLowerCase() === 'published',
    tags: extractCustomTagNames(row.tags),
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
  const rows = (json as { result: ChartApiRow[] }).result ?? [];
  return rows.map(row => ({
    id: row.id,
    title: row.slice_name,
    kind: isGeoViz(row.viz_type) ? 'geo' : 'chart',
    url: row.url,
    updatedHuman: humanizeRu(row.changed_on) || row.changed_on_delta_humanized,
    starred: true,
    live: false,
    tags: extractCustomTagNames(row.tags),
    objectType: 'chart',
  }));
}

/**
 * Переключает статус «в избранном» для дашборда или чарта.
 * Superset API:
 *   POST   /api/v1/dashboard/{id}/favorites/   → добавить
 *   DELETE /api/v1/dashboard/{id}/favorites/   → убрать
 *   POST   /api/v1/chart/{id}/favorites/       → добавить
 *   DELETE /api/v1/chart/{id}/favorites/       → убрать
 *
 * `currentlyStarred` — текущее состояние, чтобы понять направление toggle.
 */
export async function toggleFavorite(
  objectType: 'dashboard' | 'chart',
  id: number,
  currentlyStarred: boolean,
): Promise<void> {
  const endpoint = `/api/v1/${objectType}/${id}/favorites/`;
  if (currentlyStarred) {
    await SupersetClient.delete({ endpoint });
  } else {
    await SupersetClient.post({ endpoint });
  }
}

export async function fetchRecentActivity(pageSize = 12): Promise<BentoItem[]> {
  const q = rison.encode({ page_size: pageSize, distinct: false });
  const { json } = await SupersetClient.get({
    endpoint: `/api/v1/log/recent_activity/?q=${q}`,
  });
  const rows = (json as { result: RecentActivityRow[] }).result ?? [];
  // Убираем дубли по URL и фильтруем записи без url.
  const seen = new Set<string>();
  const deduped: RecentActivityRow[] = [];
  for (const row of rows) {
    if (!row.item_url || seen.has(row.item_url)) continue;
    seen.add(row.item_url);
    deduped.push(row);
  }
  return deduped.map(row => {
    // Извлекаем числовой id в зависимости от типа объекта:
    //  - dashboard: `/superset/dashboard/42/` или `/dashboard/42/` → 42
    //  - slice (chart): `/superset/explore/?slice_id=2` или `/chart/2/` → 2
    // Старый общий regex `\/(\d+)(?:\/|$)` не работал для URL с query
    // string (`?slice_id=2`) — из-за этого у чартов не заполнялся id,
    // и в итоге enrich с каталогом не находил соответствия, департамент
    // не показывался в нижней плашке карточки.
    let id = 0;
    if (row.item_type === 'slice') {
      // Chart URLs: `/superset/explore/?slice_id=2` — id в query string.
      const qsMatch = row.item_url.match(/[?&]slice_id=(\d+)/);
      if (qsMatch) {
        id = Number(qsMatch[1]);
      } else {
        const pathMatch = row.item_url.match(/\/(\d+)(?:\/|$)/);
        if (pathMatch) id = Number(pathMatch[1]);
      }
    } else {
      // Dashboard URLs: `/superset/dashboard/42/` — id в path.
      const pathMatch = row.item_url.match(/\/(\d+)(?:\/|$)/);
      if (pathMatch) id = Number(pathMatch[1]);
    }
    // row.time — epoch ms; переводим в ISO для humanizeRu.
    const humanized =
      humanizeRu(row.time ? new Date(row.time).toISOString() : undefined) ||
      row.time_delta_humanized;
    return {
      id,
      title: row.item_title,
      kind: row.item_type === 'dashboard' ? 'dashboard' : 'chart',
      url: row.item_url,
      updatedHuman: humanized,
      starred: false,
      objectType: row.item_type === 'dashboard' ? 'dashboard' : 'chart',
    };
  });
}
