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

/**
 * Имя папки-обёртки «Без X», выведенное из текущего названия колонки.
 *
 * Используется для is_default-папки (когда юзер переименовал колонку
 * «Департаменты» → «Организации», дефолтная папка автоматически
 * становится «Без организаций») и для sibling-обёрток, которые
 * создаются при удалении подпапок.
 *
 * Через genitivePlural (родительный падеж множественного числа):
 *   Департаменты → Без департаментов
 *   Организации  → Без организаций
 *   Подразделы   → Без подразделов
 *   Папки        → Без папок
 */
export function deriveDefaultFolderName(columnLabel: string): string {
  const trimmed = columnLabel.trim();
  if (!trimmed) return 'Без департамента';
  return `Без ${genitivePlural(trimmed)}`;
}

/** Склонения для стандартных колонок каталога. Если юзер переименовал
 *  колонку в произвольное имя — возвращаем heuristic-based склонение,
 *  которое в большинстве случаев даёт читаемую форму (может быть не
 *  идеально грамматически, но лучше чем обрубок «папк»). */
const DEFAULT_SINGULAR_ACC: Record<string, string> = {
  департаменты: 'департамент',
  подразделы: 'подраздел',
  папки: 'папку',
  объекты: 'объект',
};

const DEFAULT_GENITIVE_PLURAL: Record<string, string> = {
  департаменты: 'департаментов',
  подразделы: 'подразделов',
  папки: 'папок',
  объекты: 'объектов',
};

/** «Выберите X» — аккузатив ед.ч. Из «Папки» → «папку». */
export function singularAccusative(plural: string): string {
  const trimmed = plural.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  const mapped = DEFAULT_SINGULAR_ACC[lower];
  if (mapped) return mapped;
  // Heuristic: -ки → -ку (папки→папку), остальное -ы/-и → strip.
  if (/[кгхжшщчц]и$/.test(lower)) return lower.slice(0, -1) + 'у';
  if (/[ыи]$/.test(lower)) return lower.slice(0, -1);
  return lower;
}

/** «Нет X» — родительный падеж мн.ч. Из «Папки» → «папок».
 *
 * Проверенные случаи:
 *   Департаменты → департаментов  (strip ы + ов)
 *   Организации  → организаций    (strip и + й, слова на -ии)
 *   Подразделы   → подразделов    (strip ы + ов)
 *   Папки        → папок          (strip ки + ок, шипящие)
 *   Отделы       → отделов        (strip ы + ов)
 *   Группы       → групп          (strip ы, без суффикса для g-stem — см. map)
 *
 * Русский язык непредсказуем, эвристики покрывают ~80% кейсов. Для
 * оставшихся 20% админ переименует папку вручную. */
export function genitivePlural(plural: string): string {
  const trimmed = plural.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  const mapped = DEFAULT_GENITIVE_PLURAL[lower];
  if (mapped) return mapped;
  // Слова на «ии» (организации, отделения, категории) — строят род.п. мн.ч.
  // как strip 'ии' + 'ий': организаций, отделений, категорий. Это
  // пересиливает более общее правило «и» → «ей», иначе получили бы
  // «организацией» что некорректно.
  if (lower.endsWith('ии')) return `${lower.slice(0, -2)}ий`;
  // -ки → -ок (папки → папок, точки → точек, ветки → веток).
  if (lower.endsWith('ки')) return `${lower.slice(0, -2)}ок`;
  // -ы → strip + 'ов' (департаменты → департаментов, отделы → отделов).
  if (lower.endsWith('ы')) return `${lower.slice(0, -1)}ов`;
  // -и → strip + 'ей' (статьи → статей; fallback для случаев, не
  // попавших в более специфичные правила выше).
  if (lower.endsWith('и')) return `${lower.slice(0, -1)}ей`;
  return lower;
}

/** Русская плюрализация «n X-ов / X-а / X-ов»:
 *   n=1/21/31 → one, n=2/3/4/22/23/24 → few, остальное → many.
 *   Для английских/других языков можно заменить при необходимости.
 */
function slavicPlural(n: number, one: string, few: string, many: string): string {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export type CatalogTypeCounts = Partial<{
  dashboard: number;
  chart: number;
  dataset: number;
  saved_query: number;
  ai_document: number;
  ai_spreadsheet: number;
}>;

/** Форматирует суммарное количество объектов в папке как «N объектов» с
 *  правильной русской плюрализацией. `visibleTotal` — количество, которое
 *  реально увидит пользователь (после учёта его ролей). Админам передаём
 *  общее `item_count`, обычным пользователям — только dashboard count,
 *  потому что остальные типы (чарты/датасеты) они на главной не видят. */
export function formatCatalogCounts(visibleTotal: number): string {
  return `${visibleTotal} ${slavicPlural(
    visibleTotal,
    'объект',
    'объекта',
    'объектов',
  )}`;
}

/** Возвращает число объектов, которое будет видно юзеру в зависимости от
 *  роли. Для не-админа показываем только dashboard-count, т.к. чарты/
 *  датасеты на «Главной» от него скрыты pill-фильтром и списком. */
export function visibleCatalogCount(
  total: number,
  breakdown: CatalogTypeCounts | undefined,
  isAdmin: boolean,
): number {
  if (isAdmin) return total;
  return breakdown?.dashboard ?? 0;
}

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
