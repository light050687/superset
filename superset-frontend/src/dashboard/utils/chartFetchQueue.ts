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
 * Singleton concurrency-limited priority queue для chart fetch'ей.
 *
 * Production-ready native JS implementation (без внешних зависимостей —
 * избегаем ESM/CommonJS interop проблем с webpack 5 в Superset форке).
 *
 * Возможности:
 *   • Concurrency limit (1-12, default 8) — динамически меняется через
 *     setQueueConcurrency() при mount дашборда (read из json_metadata).
 *   • Priority ordering: visible (top of viewport) → -y_position (отриц.,
 *     раньше); off-screen → большое значение (в конец очереди).
 *   • clearAndAbort — drop pending tasks (вызывается при filter change
 *     через middleware).
 *   • Edit mode / Bot bypass — setConcurrency(Infinity) разблокирует все
 *     задачи мгновенно для drag/drop и screenshot endpoint'ов.
 *   • Graceful: ошибка в task не ломает очередь.
 *   • Singleton живёт вне React tree, переживает unmount компонентов.
 *   • DEV: window.__chartFetchQueue для отладки в DevTools console.
 *
 * Используется через `enqueueChartFetch(fn, priority)` в Chart.tsx
 * `runQuery()`.
 */

const DEFAULT_CONCURRENCY = 8;
const MIN_CONCURRENCY = 1;
const MAX_CONCURRENCY = 12;

interface QueueTask {
  fn: () => Promise<unknown>;
  priority: number;
  enqueueOrder: number; // FIFO tie-breaker внутри одного priority
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
}

interface QueueState {
  tasks: QueueTask[];
  active: number;
  concurrency: number;
}

const state: QueueState = {
  tasks: [],
  active: 0,
  concurrency: DEFAULT_CONCURRENCY,
};

let enqueueCounter = 0;

function dequeue(): QueueTask | undefined {
  if (state.tasks.length === 0) return undefined;
  // Sort by priority ASC (меньше = раньше), затем FIFO внутри priority
  state.tasks.sort(
    (a, b) =>
      a.priority - b.priority || a.enqueueOrder - b.enqueueOrder,
  );
  return state.tasks.shift();
}

function processNext(): void {
  if (state.active >= state.concurrency) return;
  const task = dequeue();
  if (!task) return;
  state.active += 1;
  Promise.resolve()
    .then(() => task.fn())
    .then(
      v => task.resolve(v),
      e => task.reject(e),
    )
    .finally(() => {
      state.active -= 1;
      processNext();
    });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Добавить fetch-task в очередь с priority. Возвращает Promise который
 * settles когда task выполнена. Reject не ломает очередь — другие tasks
 * продолжают независимо.
 *
 * @param fn — async функция выполняющая fetch (возвращает Promise)
 * @param priority — меньше число = раньше выполнится. Default 0.
 *                   Visible charts обычно отрицательное (по Y-координате),
 *                   off-screen — большое положительное.
 */
export function enqueueChartFetch(
  fn: () => Promise<unknown>,
  priority = 0,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    enqueueCounter += 1;
    state.tasks.push({
      fn,
      priority,
      enqueueOrder: enqueueCounter,
      resolve,
      reject,
    });
    processNext();
  });
}

/**
 * Динамически меняет concurrency очереди.
 *
 *   • Number 1..12 → clamp в этот диапазон
 *   • Infinity → bypass (для edit mode / bot)
 *
 * После увеличения concurrency освобождает столько slots, сколько нужно
 * для запуска ожидающих tasks.
 */
export function setQueueConcurrency(n: number): void {
  if (n === Infinity) {
    state.concurrency = Infinity;
  } else {
    state.concurrency = clamp(Math.floor(n), MIN_CONCURRENCY, MAX_CONCURRENCY);
  }
  // Заполнить новые slot'ы (если concurrency возросло)
  for (let i = 0; i < MAX_CONCURRENCY; i += 1) processNext();
}

/**
 * Drop all pending tasks. Уже-выполняющиеся продолжают (для них
 * есть Redux AbortController в chartAction.js — следующий dispatch
 * postChartFormData отменит previous controller).
 *
 * Pending tasks reject'аются с ошибкой 'cancelled' — caller (Chart.tsx)
 * должен .catch() игнорировать.
 */
export function clearAndAbort(): void {
  const dropped = state.tasks.splice(0);
  dropped.forEach(t => t.reject(new Error('cancelled')));
}

/**
 * Текущая статистика очереди (для observability + DEV-отладки).
 */
export function getQueueStats(): {
  pending: number;
  size: number;
  concurrency: number;
} {
  return {
    pending: state.active,
    size: state.tasks.length,
    concurrency: state.concurrency,
  };
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, '__chartFetchQueue', {
    configurable: true,
    get() {
      return getQueueStats();
    },
  });
}

export const FETCH_QUEUE_DEFAULT_CONCURRENCY = DEFAULT_CONCURRENCY;
export const FETCH_QUEUE_MIN_CONCURRENCY = MIN_CONCURRENCY;
export const FETCH_QUEUE_MAX_CONCURRENCY = MAX_CONCURRENCY;
