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
 * useCatalogColumnLabels — кастомные названия для колонок в режиме
 * «Управление каталогом» (мокап catColLabels). Юзер может переименовать
 * колонку через клик на заголовок → prompt. Хранится в localStorage.
 */
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'mrts-cat-col-labels';

export type ColumnLabelKey = 'dept' | 'sub' | 'folder' | 'items';

export interface ColumnLabels {
  dept: string;
  sub: string;
  folder: string;
  items: string;
}

const DEFAULT_LABELS: ColumnLabels = {
  dept: 'Департаменты',
  sub: 'Подразделы',
  folder: 'Папки',
  items: 'Объекты',
};

function readLabels(): ColumnLabels {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LABELS };
    const parsed = JSON.parse(raw) as Partial<ColumnLabels>;
    return { ...DEFAULT_LABELS, ...parsed };
  } catch {
    return { ...DEFAULT_LABELS };
  }
}

function writeLabels(labels: ColumnLabels): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
  } catch {
    // localStorage недоступен — игнорируем
  }
}

export interface UseCatalogColumnLabelsResult {
  labels: ColumnLabels;
  rename: (key: ColumnLabelKey, newLabel: string) => void;
  reset: () => void;
}

export function useCatalogColumnLabels(): UseCatalogColumnLabelsResult {
  const [labels, setLabels] = useState<ColumnLabels>(() => readLabels());

  const rename = useCallback((key: ColumnLabelKey, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    setLabels(prev => {
      const next = { ...prev, [key]: trimmed };
      writeLabels(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    writeLabels(DEFAULT_LABELS);
    setLabels({ ...DEFAULT_LABELS });
  }, []);

  // Синхронизация между вкладками: слушаем storage event.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLabels(readLabels());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { labels, rename, reset };
}
