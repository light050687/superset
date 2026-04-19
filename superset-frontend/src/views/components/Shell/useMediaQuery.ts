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
 * useMediaQuery — подписка на CSS media query с корректным SSR-фолбэком
 * и listener-ами в useEffect. Нужен Shell для выбора FloatingDock vs
 * MobileNav в зависимости от ширины экрана.
 */
import { useEffect, useState } from 'react';

function getMatches(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => getMatches(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Safari <14: addListener/removeListener (deprecated, но живёт).
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
    } else {
      mql.addListener(handler);
    }

    // Sync в случае гонки mount ↔ viewport change.
    setMatches(mql.matches);

    return () => {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', handler);
      } else {
        mql.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}
