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
 * useCalendarEvents — CRUD для календарных событий пользователя.
 *
 * Хранение: localStorage с ключом `superset.calendar.events.<userId>`
 * (изолирует события между разными пользователями на одной машине).
 *
 * Когда backend-API будет готов (`/api/v1/ai/calendar/event/`):
 *   1. Заменить чтение в `loadFromStorage` на `SupersetClient.get(...)`
 *   2. Заменить запись в `persist` на `SupersetClient.post/patch/delete(...)`
 *   3. Обернуть в TanStack Query (useQuery / useMutation) для cache + refetch
 *   4. Сохранить fallback на localStorage для offline-режима
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Базовая модель события (используется и в API, и в UI). Определена здесь
 * (а не в CalendarDropdown.tsx) чтобы избежать circular import между
 * хуком и React-компонентом.
 */
export interface CalendarEvent {
  /** ISO-дата начала события (YYYY-MM-DD). */
  date: string;
  /** ISO-время начала «HH:MM» (опционально). */
  time?: string;
  /** ISO-время окончания «HH:MM» (опционально). */
  endTime?: string;
  /** Заголовок события. */
  title: string;
  /** Категория для легенды/цвета: meeting / deadline / report / personal. */
  category?: 'meeting' | 'deadline' | 'report' | 'personal';
  /** Online-метка (показывает badge ONLINE рядом с временем). */
  online?: boolean;
  /** Список участников (humanized "3 чел."). */
  attendees?: number;
}

/** Internal модель — событие с уникальным ID (для CRUD/DnD). */
export interface StoredCalendarEvent extends CalendarEvent {
  id: string;
  /** ISO-timestamp создания события (для сортировки/audit). */
  createdAt: string;
}

const STORAGE_PREFIX = 'superset.calendar.events.';

function storageKey(userId: string | number | undefined): string {
  // Anonymous fallback — общий «гостевой» неймспейс. На проде это
  // невозможный кейс (вход обязателен), но в Storybook/тестах удобно.
  return `${STORAGE_PREFIX}${userId ?? 'anonymous'}`;
}

function makeId(): string {
  // crypto.randomUUID может отсутствовать в старых iOS Safari — fallback
  // на time + random префикс.
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function loadFromStorage(key: string): StoredCalendarEvent[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCalendarEvent[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      ev => typeof ev?.id === 'string' && typeof ev?.date === 'string',
    );
  } catch {
    return [];
  }
}

function persistToStorage(key: string, events: StoredCalendarEvent[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(events));
  } catch {
    // localStorage может быть выключен (приватный режим) — silent fail.
  }
}

export interface UseCalendarEventsResult {
  /** События пользователя (отсортированные по date+time). */
  events: StoredCalendarEvent[];
  /** Создать событие. Возвращает созданный объект (с id). */
  addEvent: (event: Omit<CalendarEvent, never>) => StoredCalendarEvent;
  /** Удалить событие по id. */
  removeEvent: (id: string) => void;
  /** Перенести событие на другую дату (DnD). */
  moveEvent: (id: string, newDate: string) => void;
  /** Обновить произвольные поля события. */
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  /** Удалить ВСЕ события (для теста/reset). */
  clearAll: () => void;
}

export function useCalendarEvents(
  userId: string | number | undefined,
  /** Seed-данные (например, демо-набор из props). Применяются ТОЛЬКО
   *  если в localStorage у пользователя ещё нет ничего. */
  seedEvents?: readonly CalendarEvent[],
): UseCalendarEventsResult {
  const key = useMemo(() => storageKey(userId), [userId]);

  const [events, setEvents] = useState<StoredCalendarEvent[]>(() => {
    const stored = loadFromStorage(key);
    if (stored.length > 0) return stored;
    if (seedEvents && seedEvents.length > 0) {
      const seeded = seedEvents.map<StoredCalendarEvent>(ev => ({
        ...ev,
        id: makeId(),
        createdAt: new Date().toISOString(),
      }));
      persistToStorage(key, seeded);
      return seeded;
    }
    return [];
  });

  // Слушаем изменения localStorage из других вкладок (multi-tab sync).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      setEvents(loadFromStorage(key));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  const persist = useCallback(
    (next: StoredCalendarEvent[]) => {
      setEvents(next);
      persistToStorage(key, next);
    },
    [key],
  );

  const addEvent = useCallback<UseCalendarEventsResult['addEvent']>(
    event => {
      const created: StoredCalendarEvent = {
        ...event,
        id: makeId(),
        createdAt: new Date().toISOString(),
      };
      persist([...events, created]);
      return created;
    },
    [events, persist],
  );

  const removeEvent = useCallback<UseCalendarEventsResult['removeEvent']>(
    id => {
      persist(events.filter(ev => ev.id !== id));
    },
    [events, persist],
  );

  const moveEvent = useCallback<UseCalendarEventsResult['moveEvent']>(
    (id, newDate) => {
      persist(
        events.map(ev => (ev.id === id ? { ...ev, date: newDate } : ev)),
      );
    },
    [events, persist],
  );

  const updateEvent = useCallback<UseCalendarEventsResult['updateEvent']>(
    (id, patch) => {
      persist(
        events.map(ev => (ev.id === id ? { ...ev, ...patch } : ev)),
      );
    },
    [events, persist],
  );

  const clearAll = useCallback<UseCalendarEventsResult['clearAll']>(() => {
    persist([]);
  }, [persist]);

  // Сортировка по date + time для стабильного отображения.
  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        const ta = a.time ?? '00:00';
        const tb = b.time ?? '00:00';
        return ta.localeCompare(tb);
      }),
    [events],
  );

  return {
    events: sortedEvents,
    addEvent,
    removeEvent,
    moveEvent,
    updateEvent,
    clearAll,
  };
}

/* ─── Quick-add parser ────────────────────────────────────────────
 *
 * Парсит свободный текст вроде:
 *   "Завтра 15:00 созвон с командой"
 *   "Сегодня 9:00-10:30 митинг online"
 *   "12.04 18:00 ужин с клиентом"
 *   "Пн 14:00 deadline отчёт"
 *
 * Извлекает: дату (today/tomorrow/DD.MM/weekday), время (HH:MM[-HH:MM]),
 * category (по ключевым словам), title (остаток текста).
 * Возвращает null если нет ни даты ни времени (тогда показываем подсказку).
 */

const WEEKDAY_KEYWORDS: Record<string, number> = {
  пн: 1, понедельник: 1,
  вт: 2, вторник: 2,
  ср: 3, среда: 3,
  чт: 4, четверг: 4,
  пт: 5, пятница: 5,
  сб: 6, суббота: 6,
  вс: 0, воскресенье: 0,
};

const CATEGORY_KEYWORDS: Record<string, NonNullable<CalendarEvent['category']>> = {
  созвон: 'meeting',
  митинг: 'meeting',
  встреча: 'meeting',
  meeting: 'meeting',
  call: 'meeting',
  deadline: 'deadline',
  дедлайн: 'deadline',
  срок: 'deadline',
  отчёт: 'report',
  отчет: 'report',
  report: 'report',
  личное: 'personal',
  spa: 'personal',
  спорт: 'personal',
};

function nextWeekday(from: Date, weekday: number): Date {
  const d = new Date(from);
  const diff = (weekday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function dateToISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseQuickAdd(
  text: string,
  baseDate: Date = new Date(),
): Omit<CalendarEvent, never> | null {
  let raw = text.trim();
  if (!raw) return null;

  let date: string | null = null;
  let time: string | undefined;
  let endTime: string | undefined;
  let online = false;
  let category: CalendarEvent['category'];

  // Дата: "сегодня" / "завтра" / "послезавтра"
  const lower = raw.toLowerCase();
  if (/\bпослезавтра\b/.test(lower)) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 2);
    date = dateToISO(d);
    raw = raw.replace(/послезавтра/gi, '').trim();
  } else if (/\bзавтра\b/.test(lower)) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 1);
    date = dateToISO(d);
    raw = raw.replace(/завтра/gi, '').trim();
  } else if (/\bсегодня\b/.test(lower)) {
    date = dateToISO(baseDate);
    raw = raw.replace(/сегодня/gi, '').trim();
  } else {
    // День недели (пн, понедельник, …)
    for (const [kw, dow] of Object.entries(WEEKDAY_KEYWORDS)) {
      const re = new RegExp(`\\b${kw}\\b`, 'i');
      if (re.test(raw)) {
        date = dateToISO(nextWeekday(baseDate, dow));
        raw = raw.replace(re, '').trim();
        break;
      }
    }
    // Дата DD.MM или DD.MM.YYYY
    if (!date) {
      const m = raw.match(/\b(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?\b/);
      if (m) {
        const d = parseInt(m[1], 10);
        const mo = parseInt(m[2], 10) - 1;
        const y = m[3]
          ? parseInt(m[3].length === 2 ? `20${m[3]}` : m[3], 10)
          : baseDate.getFullYear();
        date = dateToISO(new Date(y, mo, d));
        raw = raw.replace(m[0], '').trim();
      }
    }
  }

  // Время: HH:MM или HH:MM-HH:MM
  const tm = raw.match(/\b(\d{1,2}):(\d{2})(?:\s*-\s*(\d{1,2}):(\d{2}))?\b/);
  if (tm) {
    time = `${tm[1].padStart(2, '0')}:${tm[2]}`;
    if (tm[3] && tm[4]) {
      endTime = `${tm[3].padStart(2, '0')}:${tm[4]}`;
    }
    raw = raw.replace(tm[0], '').trim();
  }

  // Online-метка
  if (/\bonline\b/i.test(raw) || /\bонлайн\b/i.test(raw)) {
    online = true;
    raw = raw.replace(/\b(online|онлайн)\b/gi, '').trim();
  }

  // Категория по ключевому слову
  for (const [kw, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (raw.toLowerCase().includes(kw)) {
      category = cat;
      break;
    }
  }

  // Title — то что осталось (или весь оригинальный текст если ничего не извлекли)
  const title = raw.replace(/\s{2,}/g, ' ').trim() || text.trim();

  if (!date && !time) return null;

  return {
    date: date ?? dateToISO(baseDate),
    time,
    endTime,
    title,
    category,
    online,
  };
}
