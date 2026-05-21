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
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import {
  type AnyThemeConfig,
  type ThemeContextType,
  Theme,
  ThemeMode,
} from '@superset-ui/core';
import { ThemeController } from './ThemeController';

/**
 * Резолв ThemeMode → конкретная тема (для detection направления анимации
 * когда выбран SYSTEM режим).
 */
function resolveMode(mode: ThemeMode): 'dark' | 'light' {
  if (mode === ThemeMode.DARK) return 'dark';
  if (mode === ThemeMode.SYSTEM) {
    return typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
}

/**
 * Theme switch через CSS View Transitions API + soft-edge mask + glow.
 *
 * Браузер делает screenshot DOM в OLD-состоянии, применяет swap
 * (data-theme=NEW), делает screenshot NEW-состояния и анимирует переход
 * через pseudo-elements ::view-transition-old(root) / -new(root).
 * NEW-слой раскрывается через mask-image: radial-gradient (мягкий
 * радиальный градиент, не clip-path) — это даёт soft edge вместо
 * жёсткого контура.
 *
 * Параллельно `spawnThemeGlow()` добавляет JS-overlay с radial-gradient
 * + filter: blur, который остаётся видимым ~200ms после VT-анимации
 * и плавно затухает за 200ms. Эффект — мягкое свечение из точки клика,
 * усиливающее ощущение «новой» темы.
 *
 * Реализация CSS правил живёт в head_custom_extra.html:
 *   @property --ds-tt-r { syntax: '<percentage>'; ... }
 *   ::view-transition-new(root) { mask-image: radial-gradient(...); animation: ds-theme-mask-reveal ... }
 *   @keyframes ds-theme-mask-reveal { from { --ds-tt-r: 0% } to { --ds-tt-r: 180% } }
 *
 * Поддержка: VT API — Chrome 111+, Safari 18+, Firefox 129+;
 * @property — Chrome 85+, Safari 16.4+, Firefox 128+. Fallback
 * (instant swap без анимации и без glow) для старых браузеров и
 * prefers-reduced-motion.
 */

// Координаты последнего pointerdown — для центра clip-path круга.
let lastPointerPoint: { x: number; y: number } | null = null;
function initPointerCapture(): void {
  if (typeof document === 'undefined') return;
  if (
    (window as unknown as { __ds2PointerCapture?: boolean }).__ds2PointerCapture
  )
    return;
  (window as unknown as { __ds2PointerCapture?: boolean }).__ds2PointerCapture =
    true;
  document.addEventListener(
    'pointerdown',
    (e: PointerEvent) => {
      lastPointerPoint = { x: e.clientX, y: e.clientY };
    },
    { capture: true },
  );
}

interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition(): void;
}

interface DocumentWithVT extends Document {
  startViewTransition?(callback: () => void | Promise<void>): ViewTransition;
}

/**
 * Soft glow overlay из точки клика. Параллельно VT-анимации появляется
 * полупрозрачный radial-gradient + blur, который остаётся видимым 200ms
 * после завершения VT (1000ms = 800 VT + 200 holding) и за следующие 200ms
 * плавно затухает. Tone подобран под --bg новой темы:
 *   • dark → rgba(0,0,0,0.45) — углубляет ощущение темноты
 *   • light → rgba(255,255,255,0.55) — мягкое свечение
 *
 * Уважает prefers-reduced-motion: при reduce — выходит без overlay.
 */
function spawnThemeGlow(
  x: number,
  y: number,
  resolvedTo: 'dark' | 'light',
): void {
  if (typeof document === 'undefined') return;
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }
  const glow = document.createElement('div');
  const tone =
    resolvedTo === 'dark' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.55)';
  glow.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2147483646;
    background: radial-gradient(
      circle 800px at ${x}px ${y}px,
      ${tone} 0%,
      transparent 65%
    );
    filter: blur(32px);
    opacity: 0;
    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: opacity;
  `;
  document.body.appendChild(glow);
  requestAnimationFrame(() => {
    glow.style.opacity = '1';
  });
  // 800ms VT + 200ms holding → fade-out 200ms → remove.
  window.setTimeout(() => {
    glow.style.opacity = '0';
    window.setTimeout(() => glow.remove(), 220);
  }, 1000);
}

/**
 * Theme swap через View Transitions API — профессиональный паттерн
 * (по Akash Hamirwasia / Chrome team / Web Animations API).
 *
 * Шаги:
 *   1) `startViewTransition(callback)` снимает OLD-snapshot мгновенно.
 *   2) Внутри callback `flushSync` форсит React commit DOM до snapshot NEW.
 *      Без этого AntD ConfigProvider, theme-зависимые компоненты, KPI
 *      карточки попадут в snapshot частично-обновлёнными.
 *   3) `vt.ready` Promise — резолвится когда pseudo-elements ::view-transition-*
 *      созданы и прикреплены. ТОЛЬКО после этого запускаем анимацию.
 *   4) `Element.animate({clipPath: [...]}, {pseudoElement: '::view-transition-new(root)'})`
 *      — Web Animations API. Точный maxRadius через Math.hypot (всегда
 *      покрывает экран до furthest corner). Soft edge ощущение даёт
 *      параллельный glow-overlay через `spawnThemeGlow`.
 *
 * Известное ограничение: ECharts canvas рендерится через `chart.setOption()`
 * в useEffect — он выполняется СИНХРОННО внутри flushSync если useEffect
 * успел зарегистрироваться, иначе с задержкой 1 RAF. flushSync помогает
 * максимально, но 100% синхронизации canvas pixels не гарантирует —
 * canvas это monolithic raster, и `view-transition-name` на нём
 * неэффективен (известное ограничение VT API).
 *
 * Fallback (instant swap) — для браузеров без VT API или WAAPI .animate с
 * pseudoElement (Chrome 116+).
 */
function runThemeViewTransition(
  resolvedTo: 'dark' | 'light',
  applyTheme: () => void,
): boolean {
  if (typeof document === 'undefined') {
    applyTheme();
    return false;
  }
  const doc = document as DocumentWithVT;
  if (typeof doc.startViewTransition !== 'function') {
    applyTheme();
    return false;
  }

  // Точка клика — центр clip-path circle и glow overlay.
  const point = lastPointerPoint ?? {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
  document.documentElement.style.setProperty('--ds-tt-x', `${point.x}px`);
  document.documentElement.style.setProperty('--ds-tt-y', `${point.y}px`);

  // Точный максимальный радиус — расстояние до furthest viewport corner.
  // Гарантирует что круг доходит до всех краёв независимо от позиции клика.
  const maxRadius = Math.hypot(
    Math.max(point.x, window.innerWidth - point.x),
    Math.max(point.y, window.innerHeight - point.y),
  );

  const vt = doc.startViewTransition(() => {
    // flushSync — React commit DOM СИНХРОННО внутри callback'а (важно для
    // AntD ConfigProvider, theme-context consumers, KPI styled-компонентов).
    // CSS-переменные через data-theme flip'аются мгновенно (sync update DOM).
    flushSync(() => {
      document.documentElement.setAttribute('data-theme', resolvedTo);
      applyTheme();
    });
  });

  // После .ready — pseudo-elements готовы. Запускаем programmatic
  // animation через WAAPI (более точный контроль чем CSS keyframes).
  vt.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${point.x}px ${point.y}px)`,
            `circle(${maxRadius}px at ${point.x}px ${point.y}px)`,
          ],
        },
        {
          duration: 800,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
          fill: 'forwards',
        },
      );
    })
    .catch(() => {
      /* VT skipped — не критично, тема уже применена через flushSync. */
    });

  // Soft glow overlay параллельно VT — даёт мягкий ореол вокруг clip-path
  // round (clipPath имеет hard edge сам по себе; glow добавляет soft fade).
  spawnThemeGlow(point.x, point.y, resolvedTo);
  return true;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  themeController: ThemeController;
}

export function SupersetThemeProvider({
  children,
  themeController,
}: ThemeProviderProps): JSX.Element {
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    themeController.getTheme(),
  );

  const [currentThemeMode, setCurrentThemeMode] = useState<ThemeMode>(
    themeController.getCurrentMode(),
  );

  useEffect(() => {
    const unsubscribe = themeController.onChange(theme => {
      setCurrentTheme(theme);
      setCurrentThemeMode(themeController.getCurrentMode());
    });

    return unsubscribe;
  }, [themeController]);

  // Pointer listener при mount — для запоминания координат клика
  // (используется как центр clip-path-круга в VT API анимации).
  useEffect(() => {
    initPointerCapture();
  }, []);

  /**
   * DS 2.0: синхронно ставим html[data-theme="dark|light"] при смене темы.
   * Иначе CSS-переменные в head_custom_extra.html обновляются с задержкой
   * (MutationObserver в tail_js_custom_extra.html срабатывает с лагом 50ms
   * или до 2000ms на fallback-setInterval). Это приводит к «частичной»
   * смене темы — AntD компоненты уже переключились, а наши панели/попапы,
   * использующие var(--bg), ещё в старой теме.
   */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isDark = currentThemeMode === ThemeMode.DARK;
    const isSystem = currentThemeMode === ThemeMode.SYSTEM;
    let resolved: 'dark' | 'light';
    if (isDark) {
      resolved = 'dark';
    } else if (isSystem) {
      const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
      resolved = mql?.matches ? 'dark' : 'light';
    } else {
      resolved = 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
  }, [currentThemeMode]);

  const setTheme = useCallback(
    (config: AnyThemeConfig) => themeController.setTheme(config),
    [themeController],
  );

  /**
   * Смена темы через CSS View Transitions API. Браузер делает screenshot
   * OLD состояния, применяет swap, делает screenshot NEW состояния и
   * анимирует переход через clip-path circle, растущий из точки клика.
   * Обе темы видны одновременно как два слоя.
   *
   * Fallback (instant swap без анимации) для:
   *   - браузеров без VT API
   *   - prefers-reduced-motion: reduce
   *   - same-mode toggle (никакой анимации не нужно)
   */
  const setThemeMode = useCallback(
    (newMode: ThemeMode) => {
      if (typeof document === 'undefined') {
        themeController.setThemeMode(newMode);
        return;
      }
      const from = resolveMode(themeController.getCurrentMode());
      const to = resolveMode(newMode);
      if (from === to) {
        themeController.setThemeMode(newMode);
        return;
      }
      initPointerCapture();
      runThemeViewTransition(to, () => {
        themeController.setThemeMode(newMode);
      });
    },
    [themeController],
  );

  const resetTheme = useCallback(
    () => themeController.resetTheme(),
    [themeController],
  );

  // setCrudTheme removed - dashboards should NOT modify the global controller

  const setTemporaryTheme = useCallback(
    (config: AnyThemeConfig) => themeController.setTemporaryTheme(config),
    [themeController],
  );

  const clearLocalOverrides = useCallback(
    () => themeController.clearLocalOverrides(),
    [themeController],
  );

  const getCurrentCrudThemeId = useCallback(
    () => themeController.getCurrentCrudThemeId(),
    [themeController],
  );

  const hasDevOverride = useCallback(
    () => themeController.hasDevOverride(),
    [themeController],
  );

  const canSetMode = useCallback(
    () => themeController.canSetMode(),
    [themeController],
  );

  const canSetTheme = useCallback(
    () => themeController.canSetTheme(),
    [themeController],
  );

  const canDetectOSPreference = useCallback(
    () => themeController.canDetectOSPreference(),
    [themeController],
  );

  const createDashboardThemeProvider = useCallback(
    (themeId: string) => themeController.createDashboardThemeProvider(themeId),
    [themeController],
  );

  const contextValue = useMemo(
    () => ({
      theme: currentTheme,
      themeMode: currentThemeMode,
      setTheme,
      setThemeMode,
      resetTheme,
      setTemporaryTheme,
      clearLocalOverrides,
      getCurrentCrudThemeId,
      hasDevOverride,
      canSetMode,
      canSetTheme,
      canDetectOSPreference,
      createDashboardThemeProvider,
    }),
    [
      currentTheme,
      currentThemeMode,
      setTheme,
      setThemeMode,
      resetTheme,
      setTemporaryTheme,
      clearLocalOverrides,
      getCurrentCrudThemeId,
      hasDevOverride,
      canSetMode,
      canSetTheme,
      canDetectOSPreference,
      createDashboardThemeProvider,
    ],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <currentTheme.SupersetThemeProvider>
        {children}
      </currentTheme.SupersetThemeProvider>
    </ThemeContext.Provider>
  );
}

/**
 * React hook to use the theme context
 */
export function useThemeContext(): ThemeContextType {
  const context: ThemeContextType | null = useContext(ThemeContext);

  if (!context)
    throw new Error('useThemeContext must be used within a ThemeProvider');

  return context;
}
