/**
 * Design System v2.0 tokens — light и dark версии.
 *
 * Значения взяты из прототипа ref/pareto-prototype.html (строки 11-27).
 * Дополнительно к kpiCard/themeTokens.ts добавлены акценты
 * cViolet/cTangerine/cFuchsia/cAmber — они используются в DS 2.0 для
 * раскраски «Разложения причин» в drill-модалке.
 *
 * Экспортируется helper getActiveTokens(isDark) — для buildOption.ts,
 * которому нужны именно hex-строки, т.к. ECharts canvas не резолвит
 * CSS-переменные.
 */

import { ThemeTokens } from '../types';

const FONT_SANS = "'Manrope', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

export const LIGHT_TOKENS: ThemeTokens = {
  bg: '#F3F3F3',
  s: '#FFFFFF',
  ink: '#0A0A0A',
  g50: '#F7F7F7',
  g100: '#EBEBEB',
  g200: '#DCDCDC',
  g300: '#C0C0C0',
  g400: '#999999',
  g500: '#737373',
  g600: '#555555',
  g700: '#2E2E2E',
  up: '#16A34A',
  dn: '#DC2626',
  wn: '#CCB604',
  // DS §06: бэкграунд-тинты статусов light = 7% opacity
  upBg: 'rgba(22, 163, 74, 0.07)',
  dnBg: 'rgba(220, 38, 38, 0.07)',
  wnBg: 'rgba(204, 182, 4, 0.07)',
  cSky: '#3B8BD9',
  cViolet: '#8B5CF6',
  cTangerine: '#E87C3E',
  cFuchsia: '#D946A8',
  cAmber: '#CA8A04',
  onAccent: '#FFFFFF',
  fontSans: FONT_SANS,
  fontMono: FONT_MONO,
};

export const DARK_TOKENS: ThemeTokens = {
  bg: '#0F1114',
  s: '#171A1E',
  ink: '#E6E9EF',
  g50: '#131619',
  g100: '#1B1E22',
  g200: '#272B30',
  g300: '#363B42',
  g400: '#555C65',
  g500: '#7B8390',
  g600: '#9BA3AE',
  g700: '#C4CAD2',
  up: '#34D399',
  dn: '#F87171',
  wn: '#F8F571',
  // DS §06: бэкграунд-тинты статусов dark = 10% opacity
  upBg: 'rgba(52, 211, 153, 0.1)',
  dnBg: 'rgba(248, 113, 113, 0.1)',
  wnBg: 'rgba(248, 245, 113, 0.1)',
  cSky: '#5CAAF0',
  cViolet: '#A78BFA',
  cTangerine: '#F09A62',
  cFuchsia: '#E870C0',
  cAmber: '#FBBF24',
  onAccent: '#FFFFFF',
  fontSans: FONT_SANS,
  fontMono: FONT_MONO,
};

export function getActiveTokens(isDark: boolean): ThemeTokens {
  return isDark ? DARK_TOKENS : LIGHT_TOKENS;
}

/** Палитра акцентов для «Разложения причин» — циклически по индексу. */
export function breakdownColor(index: number, tokens: ThemeTokens): string {
  const palette = [
    tokens.cSky,
    tokens.cViolet,
    tokens.cTangerine,
    tokens.cFuchsia,
    tokens.cAmber,
  ];
  return palette[index % palette.length];
}
