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
 * useCatalogObjectNames — загружает имена объектов каталога через
 * публичные Superset API (/api/v1/dashboard/{id}, /chart/{id}, /dataset/{id},
 * /saved_query/{id}). Возвращает map {key → {title, subtitle}}. Кэширует
 * результаты пока компонент монтирован.
 */
import { useEffect, useState } from 'react';
import { SupersetClient } from '@superset-ui/core';
import type { CatalogFolderItem, CatalogObjectType } from './types';

export interface ObjectInfo {
  title: string;
  subtitle?: string;
}

/** Endpoint по типу объекта. Возвращает null для неподдерживаемых типов. */
function endpointFor(type: CatalogObjectType, id: number): string | null {
  switch (type) {
    case 'dashboard':
      return `/api/v1/dashboard/${id}`;
    case 'chart':
      return `/api/v1/chart/${id}`;
    case 'dataset':
      return `/api/v1/dataset/${id}`;
    case 'saved_query':
      return `/api/v1/saved_query/${id}`;
    default:
      return null;
  }
}

/** Удобные русские подписи для типа. */
function typeLabel(type: CatalogObjectType): string {
  switch (type) {
    case 'dashboard':
      return 'Дашборд';
    case 'chart':
      return 'Чарт';
    case 'dataset':
      return 'Датасет';
    case 'saved_query':
      return 'SQL-запрос';
    case 'ai_document':
      return 'Документ ИИ';
    case 'ai_spreadsheet':
      return 'Таблица ИИ';
    default:
      return type;
  }
}

/** Извлекает человекочитаемое имя из ответа API различных endpoint'ов. */
function extractName(type: CatalogObjectType, body: unknown): string {
  if (typeof body !== 'object' || body === null) return '';
  const { result } = body as { result?: Record<string, unknown> };
  if (!result) return '';
  if (type === 'dashboard') {
    return String(result.dashboard_title ?? result.slug ?? '');
  }
  if (type === 'chart') {
    return String(result.slice_name ?? '');
  }
  if (type === 'dataset') {
    return String(result.table_name ?? '');
  }
  if (type === 'saved_query') {
    return String(result.label ?? '');
  }
  return '';
}

const cache = new Map<string, ObjectInfo>();

function key(type: CatalogObjectType, id: number): string {
  return `${type}:${id}`;
}

export function useCatalogObjectNames(
  items: CatalogFolderItem[],
): Record<string, ObjectInfo> {
  const [map, setMap] = useState<Record<string, ObjectInfo>>({});

  useEffect(() => {
    let cancelled = false;

    const missing = items.filter(
      it => !cache.has(key(it.object_type, it.object_id)),
    );
    if (missing.length === 0) {
      // Собираем уже закэшированные
      const out: Record<string, ObjectInfo> = {};
      items.forEach(it => {
        const k = key(it.object_type, it.object_id);
        const hit = cache.get(k);
        if (hit) out[k] = hit;
      });
      setMap(out);
      return () => undefined;
    }

    Promise.all(
      missing.map(async it => {
        const endpoint = endpointFor(it.object_type, it.object_id);
        if (!endpoint) {
          const info: ObjectInfo = {
            title: `${typeLabel(it.object_type)} #${it.object_id}`,
            subtitle: typeLabel(it.object_type),
          };
          cache.set(key(it.object_type, it.object_id), info);
          return;
        }
        try {
          const res = await SupersetClient.get({ endpoint });
          const { json } = res as { json?: unknown };
          const name = extractName(it.object_type, json);
          const info: ObjectInfo = {
            title: name || `${typeLabel(it.object_type)} #${it.object_id}`,
            subtitle: typeLabel(it.object_type),
          };
          cache.set(key(it.object_type, it.object_id), info);
        } catch {
          const info: ObjectInfo = {
            title: `${typeLabel(it.object_type)} #${it.object_id}`,
            subtitle: typeLabel(it.object_type),
          };
          cache.set(key(it.object_type, it.object_id), info);
        }
      }),
    ).then(() => {
      if (cancelled) return;
      const out: Record<string, ObjectInfo> = {};
      items.forEach(it => {
        const k = key(it.object_type, it.object_id);
        const hit = cache.get(k);
        if (hit) out[k] = hit;
      });
      setMap(out);
    });

    return () => {
      cancelled = true;
    };
  }, [items]);

  return map;
}

export function objectKey(type: CatalogObjectType, id: number): string {
  return key(type, id);
}
