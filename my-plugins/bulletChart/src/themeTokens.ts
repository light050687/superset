/**
 * Design System v2.0 — корпоративные токены.
 *
 * Источник правды для цветов/шрифтов. Используется в styles.ts для инъекции
 * CSS custom properties на :root и в компонентах через useTheme().
 */

export const LIGHT_TOKENS = {
  bg: '#f3f3f3',
  s: '#ffffff',
  ink: '#0a0a0a',
  g50: '#f7f7f7',
  g100: '#ebebeb',
  g200: '#dcdcdc',
  g300: '#c0c0c0',
  g400: '#999999',
  g500: '#737373',
  g600: '#555555',
  g700: '#2e2e2e',
  up: '#16a34a',
  dn: '#dc2626',
  wn: '#ccb604',
  upBg: 'rgba(22, 163, 74, 0.07)',
  dnBg: 'rgba(220, 38, 38, 0.07)',
  wnBg: 'rgba(204, 182, 4, 0.07)',
  cSky: '#3b8bd9',
  cViolet: '#8b5cf6',
  cTangerine: '#e87c3e',
  // Band-зоны (качественные уровни) — от «хорошо» к «плохо»
  bandGood: '#f3f4f6',
  bandWarn: '#e5e7eb',
  bandBad: '#d1d5db',
} as const;

export const DARK_TOKENS = {
  bg: '#0f1114',
  s: '#171a1e',
  ink: '#e6e9ef',
  g50: '#131619',
  g100: '#1b1e22',
  g200: '#272b30',
  g300: '#363b42',
  g400: '#555c65',
  g500: '#7b8390',
  g600: '#9ba3ae',
  g700: '#c4cad2',
  up: '#34d399',
  dn: '#f87171',
  wn: '#f8f571',
  upBg: 'rgba(52, 211, 153, 0.1)',
  dnBg: 'rgba(248, 113, 113, 0.1)',
  wnBg: 'rgba(248, 245, 113, 0.1)',
  cSky: '#5caaf0',
  cViolet: '#a78bfa',
  cTangerine: '#fb923c',
  bandGood: '#1b1e22',
  bandWarn: '#272b30',
  bandBad: '#363b42',
} as const;

export const FONTS = {
  text: "'Manrope', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export type ThemeTokens = typeof LIGHT_TOKENS;
