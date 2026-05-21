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
 * Single shared IntersectionObserver + viewport priority publication.
 *
 * Производит:
 *   • isInView: boolean — для Chart skip runQuery если lazy_offscreen=true
 *     и chart за пределами viewport.
 *   • priority: number — для chartFetchQueue ordering. Visible сверху →
 *     меньше priority = раньше выполняется.
 *
 * Priority formula:
 *   visible (in viewport) → -row_y_position (отрицательное, sorted top-down)
 *   off-screen → 1000 + row_y_position (положительное, в конец очереди)
 *
 * Single shared IntersectionObserver (один на дашборд, не per-chart):
 *   • Экономия памяти и threading при 50+ чартах
 *   • Атомарный snapshot visibility map для controller
 *
 * INITIAL STATE FIX (важно):
 *   До первого callback от IO считаем все charts visible. Без этого
 *   Chart.componentDidMount → runQuery → priority hook → isInView=false
 *   (ещё нет IO data) → skip → never fires (race condition).
 *
 * STICKY VISIBILITY (для render — НЕ для priority):
 *   isVisible() возвращает true для любого chart, который КОГДА-ЛИБО был
 *   intersecting (everSeenRef). Это потому, что Chart.tsx использует
 *   isInView как условие рендера — `isInView ? <ChartRenderer/> :
 *   <Loading/>`. Без sticky уже отрисованный chart при scroll'е назад
 *   заменяется на спиннер → визуально «пропадает». Sticky гарантирует:
 *   первый раз увидел → остался отрендеренным навсегда.
 *
 *   getPriority() остаётся НЕ-sticky (visibleIdsRef.current напрямую) —
 *   chartFetchQueue должна приоритизировать фактический текущий viewport,
 *   а не historical sightings. Sticky в priority дал бы ложно-высокий
 *   ранг чартам, которые юзер давно проскроллил мимо.
 *
 * rootMargin '200px 0px' — preload 200px до пересечения viewport'а
 * (чарт начинает грузиться, когда подходит на 200px к видимой области —
 * убирает «blank panel» feel при scroll).
 */
import {
  type ReactNode,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

interface ChartViewportContextValue {
  observe: (el: HTMLElement) => void;
  unobserve: (el: HTMLElement) => void;
  isVisible: (chartId: number) => boolean;
  getPriority: (chartId: number) => number;
  enabled: boolean;
  /** Bumps на каждое visibility change — для re-render consumer'ов. */
  version: number;
}

const ViewportPriorityContext = createContext<ChartViewportContextValue | null>(
  null,
);

interface ViewportPriorityProviderProps {
  children: ReactNode;
  /** Если false — provider становится no-op (всегда visible, priority 0). */
  enabled?: boolean;
}

export function ViewportPriorityProvider({
  children,
  enabled = true,
}: ViewportPriorityProviderProps) {
  const visibleIdsRef = useRef<Set<number>>(new Set());
  const everSeenRef = useRef<Set<number>>(new Set()); // sticky: для render-decisions
  const positionRef = useRef<Map<number, number>>(new Map()); // chartId → top Y px (relative to document)
  const initialReceivedRef = useRef<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [version, bump] = useReducer((v: number) => v + 1, 0);

  // Single IO instance — создаётся один раз при mount, или при flip enabled.
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') {
      observerRef.current = null;
      initialReceivedRef.current = true; // disabled → нет initial wait
      return undefined;
    }
    const obs = new IntersectionObserver(
      entries => {
        let changed = false;
        entries.forEach(entry => {
          const raw = (entry.target as HTMLElement).dataset.chartId;
          if (!raw) return;
          const id = Number(raw);
          if (!Number.isFinite(id)) return;
          // Запоминаем top Y координату для priority calculation
          positionRef.current.set(
            id,
            Math.round(entry.boundingClientRect.top + window.scrollY),
          );
          if (entry.isIntersecting) {
            if (!visibleIdsRef.current.has(id)) {
              visibleIdsRef.current.add(id);
              everSeenRef.current.add(id); // sticky для render
              changed = true;
            }
          } else if (visibleIdsRef.current.delete(id)) {
            // priority поменялся (visible→not), но render не должен mount/unmount
            changed = true;
          }
          /* Initial IO snapshot: eager mark ВСЕ observed charts как rendered
             (включая offscreen). Это decouple render-gate от priority — chart
             mounts upfront, но fetch lazy через chartFetchQueue (offscreen
             charts получают low priority и грузятся когда concurrency slot
             освобождается). Без этого charts далеко offscreen никогда не
             получают entry.isIntersecting=true → never в everSeenRef → render
             навсегда <Loading/> пока user не scroll. */
          if (!initialReceivedRef.current && !everSeenRef.current.has(id)) {
            everSeenRef.current.add(id);
            changed = true;
          }
        });
        if (!initialReceivedRef.current) {
          initialReceivedRef.current = true;
          changed = true; // Re-evaluate consumers с реальным viewport state
        }
        if (changed) bump();
      },
      { root: null, rootMargin: '200px 0px', threshold: 0 },
    );
    observerRef.current = obs;
    return () => {
      obs.disconnect();
      observerRef.current = null;
      visibleIdsRef.current.clear();
      everSeenRef.current.clear();
      positionRef.current.clear();
      initialReceivedRef.current = false;
    };
  }, [enabled]);

  // Stable actions (refs deps=[]) — не пересоздаются при version bump
  const observe = useCallback((el: HTMLElement) => {
    observerRef.current?.observe(el);
  }, []);
  const unobserve = useCallback((el: HTMLElement) => {
    observerRef.current?.unobserve(el);
  }, []);
  const isVisible = useCallback(
    (chartId: number) => {
      if (!enabled) return true;
      // Initial state: до первого IO callback все visible — иначе
      // controller'у нечего fire'нуть до первого scroll'а (race condition).
      if (!initialReceivedRef.current) return true;
      // Sticky: once-seen-stays-seen (для render). См. STICKY VISIBILITY
      // в file header — Chart.tsx использует isInView как условие
      // рендера, поэтому без sticky уже отрисованный chart исчезает на
      // обратном scroll'е.
      return everSeenRef.current.has(chartId);
    },
    [enabled],
  );
  const getPriority = useCallback(
    (chartId: number) => {
      if (!enabled) return 0;
      const top = positionRef.current.get(chartId) ?? 0;
      // Priority НЕ-sticky — отражает фактический текущий viewport, чтобы
      // chartFetchQueue приоритизировала видимые сейчас, а не historical.
      const currentlyVisible = visibleIdsRef.current.has(chartId);
      // visible: -top (отрицательное, sorted top-down → меньше = раньше)
      // off-screen: 1000 + top (большое значение, в конец очереди)
      return currentlyVisible ? -top : 1000 + top;
    },
    [enabled],
  );

  const value = useMemo<ChartViewportContextValue>(
    () => ({ observe, unobserve, isVisible, getPriority, enabled, version }),
    [observe, unobserve, isVisible, getPriority, enabled, version],
  );

  return createElement(ViewportPriorityContext.Provider, { value }, children);
}

interface UseChartViewportPriorityResult {
  isInView: boolean;
  priority: number;
}

/**
 * Consumer hook — регистрирует chart в shared IO. Возвращает текущие
 * isInView + priority. Если provider не mounted — fallback all visible
 * (legacy: чарты грузятся как раньше без viewport-priority).
 */
export function useChartViewportPriority(
  chartId: number | undefined,
  ref: React.RefObject<HTMLElement>,
): UseChartViewportPriorityResult {
  const ctx = useContext(ViewportPriorityContext);

  useEffect(() => {
    if (!ctx || typeof chartId !== 'number') return undefined;
    const el = ref.current;
    if (!el) return undefined;
    el.dataset.chartId = String(chartId);
    ctx.observe(el);
    return () => {
      ctx.unobserve(el);
    };
    // observe/unobserve — stable refs (deps=[]). enabled flip триггерит
    // re-effect через context value reference change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartId, ref, ctx?.enabled]);

  if (!ctx || typeof chartId !== 'number') {
    return { isInView: true, priority: 0 };
  }
  void ctx.version; // re-render trigger при visibility change
  return {
    isInView: ctx.isVisible(chartId),
    priority: ctx.getPriority(chartId),
  };
}
