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
 * Iris-reveal анимация (Telegram/iOS-style).
 *
 * Overlay цвета СТАРОЙ темы с animated radial-gradient mask раскрывается
 * из точки клика — «дырка» в overlay растёт, через неё видна уже-новая
 * тема. Opacity 0.7 — обе темы просвечивают друг через друга (crossfade).
 */
const THEME_TRANSITION_STYLE_ID = 'ds2-theme-transition-style';
const THEME_TRANSITION_CSS = `
@property --iris-radius {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@keyframes ds2-iris-expand {
  from { --iris-radius: 0px; }
  to   { --iris-radius: var(--iris-max, 1500px); }
}

.ds2-theme-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2147483647;
  opacity: 0.7;
  mask-image: radial-gradient(
    circle at var(--iris-x, 50%) var(--iris-y, 50%),
    transparent 0,
    transparent calc(var(--iris-radius) - 120px),
    black var(--iris-radius)
  );
  -webkit-mask-image: radial-gradient(
    circle at var(--iris-x, 50%) var(--iris-y, 50%),
    transparent 0,
    transparent calc(var(--iris-radius) - 120px),
    black var(--iris-radius)
  );
  animation: ds2-iris-expand 780ms cubic-bezier(0.32, 0.72, 0.35, 1) forwards;
  will-change: --iris-radius;
}
`;

function ensureThemeTransitionStyle(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(THEME_TRANSITION_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = THEME_TRANSITION_STYLE_ID;
  style.textContent = THEME_TRANSITION_CSS;
  document.head.appendChild(style);
}

/**
 * Iris-reveal анимация (Telegram-style).
 *
 * 1) Запоминает координаты последнего pointerdown (привязка к клику).
 * 2) Тема меняется мгновенно.
 * 3) Overlay цвета СТАРОЙ темы накрывает весь viewport (clip-path: full).
 * 4) Overlay сжимается clip-path'ом в точку клика — старая тема уходит
 *    в точку, новая распускается наружу.
 * 5) Полупрозрачность overlay (0.75) даёт настоящий crossfade двух тем.
 */

// Координаты последнего pointerdown — для привязки iris-reveal к точке клика.
let lastPointerPoint: { x: number; y: number } | null = null;
function initPointerCapture(): void {
  if (typeof document === 'undefined') return;
  if ((window as unknown as { __ds2PointerCapture?: boolean }).__ds2PointerCapture)
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

function runThemeOverlayAnimation(
  from: 'dark' | 'light',
  applyTheme: () => void,
): void {
  ensureThemeTransitionStyle();

  // Точка из которой распускается новая тема (последний pointerdown).
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const point = lastPointerPoint ?? { x: vw / 2, y: vh };
  // Max radius до самого дальнего угла + 120px feather.
  const maxRadius =
    Math.hypot(
      Math.max(point.x, vw - point.x),
      Math.max(point.y, vh - point.y),
    ) + 120;

  // Overlay цвета СТАРОЙ темы + mask с iris-дыркой (растёт из точки клика).
  const overlay = document.createElement('div');
  overlay.className = 'ds2-theme-overlay';
  overlay.style.background = from === 'dark' ? '#0f1114' : '#f3f3f3';
  overlay.style.setProperty('--iris-x', `${point.x}px`);
  overlay.style.setProperty('--iris-y', `${point.y}px`);
  overlay.style.setProperty('--iris-max', `${maxRadius}px`);
  document.body.appendChild(overlay);

  // Даём браузеру ~1 кадр отрисовать overlay и начать iris-анимацию
  // ПЕРЕД heavy AntD re-render'ом.
  window.setTimeout(() => {
    applyTheme();
  }, 16);

  // 780мс animation + буфер.
  window.setTimeout(() => overlay.remove(), 820);
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

  // Инжектим CSS iris-анимации + pointer listener при mount.
  useEffect(() => {
    ensureThemeTransitionStyle();
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
   * Смена темы с plavной анимацией через View Transitions API (Chrome 111+,
   * Safari 18+, Firefox 129+).
   *
   * Темная ← светлая: wipe слева-направо.
   * Светлая ← темная: wipe справа-налево.
   *
   * Fallback на браузерах без VT API: мгновенное переключение без анимации.
   * Также честим `prefers-reduced-motion`.
   */
  /**
   * Смена темы с плавной overlay-анимацией (градиент-волна через экран).
   * Light → Dark: волна слева направо (sky → violet → #0f1114).
   * Dark → Light: волна справа налево (sky → fuchsia → #ffffff).
   *
   * Раньше использовался View Transitions API, но Chrome 147+ автоматически
   * блокирует VT API когда OS-настройка `prefers-reduced-motion: reduce`
   * включена (выдаёт «Transition was aborted because of invalid state»),
   * а переопределить это из CSS нельзя. Manual overlay работает везде.
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
      // Инициализируем CSS/pointer capture на всякий случай.
      ensureThemeTransitionStyle();
      initPointerCapture();
      runThemeOverlayAnimation(from, () => {
        // Без flushSync — React сам batch'нет updates, не блокирует
        // main thread синхронно на 1000+мс.
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
