/**
 * useDockCollapse — минималистичный state для collapse-to-handle.
 *
 * Только явные триггеры (по запросу юзера):
 *   • click на grabber-полоске над dock'ом → `collapse()`;
 *   • click на свёрнутом pill'е → `expand()` (обрабатывается в Rail.tsx).
 *
 * Никаких scroll-listener'ов, hot-zone mouse, keyboard shortcuts или
 * inactivity-timer'ов — dock никогда не сворачивается сам, только когда
 * юзер явно нажимает.
 *
 * Pinned режим (`pinned: true`) — когда открыт drawer/AI overlay, dock
 * всегда развёрнут, `collapse()` игнорируется.
 */
import { useCallback, useEffect, useState } from 'react';

export interface UseDockCollapseOptions {
  /** Когда true — dock всегда expanded, collapse() игнорируется. */
  pinned?: boolean;
}

export interface UseDockCollapseResult {
  isCollapsed: boolean;
  /** Развернуть dock. */
  expand: () => void;
  /** Свернуть dock (игнорируется в pinned-режиме). */
  collapse: () => void;
}

export function useDockCollapse({
  pinned = false,
}: UseDockCollapseOptions = {}): UseDockCollapseResult {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  const collapse = useCallback(() => {
    if (pinned) return;
    setIsCollapsed(true);
  }, [pinned]);

  // pinned всегда форсит expanded.
  useEffect(() => {
    if (pinned) setIsCollapsed(false);
  }, [pinned]);

  return { isCollapsed, expand, collapse };
}
