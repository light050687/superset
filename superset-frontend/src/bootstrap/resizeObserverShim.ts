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

/**
 * Global throttle/debounce for `window.ResizeObserver`.
 *
 * Why so aggressive? Dashboards with 6-20 ECharts instances
 * each subscribe their own `ResizeObserver`, and every mouse move
 * during a window drag triggers all of them synchronously. Profiling
 * showed a single drag produced ~1 s of queued work per event —
 * the rAF loop starved and the page froze for seconds.
 *
 * Strategy (industry-standard for data dashboards — Tableau, Power BI,
 * Grafana all do this): do not react to intermediate sizes while the
 * user is dragging. Only dispatch the observer callback ~150 ms after
 * the *last* size change. This makes drag-resize appear instant
 * visually (layout reflows cheaply) and the actual chart repaint
 * happens once when the user releases the mouse.
 *
 * Side effects:
 * - Single `ResizeObserver.observe` call continues to produce the
 *   initial-size callback immediately (not debounced) so first paint
 *   is unaffected.
 * - Once the drag ends we flush *all* pending entries in a single
 *   callback, giving consumers the freshest ContentRect.
 */
type RawCallback = ResizeObserverCallback;

const NativeRO: typeof ResizeObserver | undefined =
  typeof window !== 'undefined' ? window.ResizeObserver : undefined;

if (
  NativeRO &&
  !(NativeRO as unknown as { __supersetThrottled?: boolean })
    .__supersetThrottled
) {
  class RafThrottledResizeObserver extends NativeRO {
    constructor(callback: RawCallback) {
      let rafHandle: number | null = null;
      let pendingEntries: ResizeObserverEntry[] = [];
      let pendingObserver: ResizeObserver | null = null;

      super((entries, observer) => {
        const merged = new Map<Element, ResizeObserverEntry>();
        for (const prev of pendingEntries) merged.set(prev.target, prev);
        for (const next of entries) merged.set(next.target, next);
        pendingEntries = Array.from(merged.values());
        pendingObserver = observer;

        if (rafHandle !== null) return;
        rafHandle = window.requestAnimationFrame(() => {
          rafHandle = null;
          const e = pendingEntries;
          const o = pendingObserver as ResizeObserver;
          pendingEntries = [];
          pendingObserver = null;
          try {
            callback(e, o);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[RO throttled callback]', err);
          }
        });
      });
    }
  }

  (
    RafThrottledResizeObserver as unknown as { __supersetThrottled: boolean }
  ).__supersetThrottled = true;
  (
    window as unknown as { ResizeObserver: typeof ResizeObserver }
  ).ResizeObserver =
    RafThrottledResizeObserver as unknown as typeof ResizeObserver;
}

export {};
