/**
 * Design System v2.0 — цветовые и типографические токены для плагина
 * "Рейтинг магазинов". Соответствуют прототипу ref/ranked-stores-prototype.html.
 *
 * Токены оборачиваются в CSS custom properties (см. toCssVars) и
 * навешиваются на root styled-div плагина через style prop. Все
 * styled-компоненты внутри читают их через var(--…), тем самым
 * обеспечивая единый источник истины и поддержку live-смены темы.
 */

export interface DsTokens {
  /* Фундамент */
  bg: string; // --bg
  surface: string; // --s
  ink: string; // --ink
  onAccent: string; // --on-accent
  shadow: string; // --sh

  /* Серая лесенка g50..g700 */
  g50: string;
  g100: string;
  g200: string;
  g300: string;
  g400: string;
  g500: string;
  g600: string;
  g700: string;

  /* Акценты */
  sky: string; // --c-sky
  violet: string; // --c-violet
  tangerine: string; // --c-tangerine
  fuchsia: string; // --c-fuchsia
  amber: string; // --c-amber

  /* Семантика */
  up: string; // --up (рост / норма)
  dn: string; // --dn (падение / проблема)
  wn: string; // --wn (внимание)

  /* Шрифты и easing */
  fontFace: string; // --f
  fontMono: string; // --m
  ease: string; // --ease
}

export const LIGHT_TOKENS: DsTokens = {
  bg: '#F3F3F3',
  surface: '#FFFFFF',
  ink: '#0A0A0A',
  onAccent: '#FFFFFF',
  shadow: '0 1px 2px rgba(15,17,20,.08)',

  g50: '#F7F7F7',
  g100: '#EBEBEB',
  g200: '#DCDCDC',
  g300: '#C0C0C0',
  g400: '#999999',
  g500: '#737373',
  g600: '#555555',
  g700: '#2E2E2E',

  sky: '#3B8BD9',
  violet: '#8B5CF6',
  tangerine: '#E87C3E',
  fuchsia: '#D946A8',
  amber: '#CA8A04',

  up: '#16A34A',
  dn: '#DC2626',
  wn: '#CCB604',

  fontFace:
    "'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontMono:
    "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, Consolas, monospace",
  /* DS 2.0 стандартный easing: cubic-bezier(.4, 0, .2, 1). */
  ease: 'cubic-bezier(.4, 0, .2, 1)',
};

export const DARK_TOKENS: DsTokens = {
  bg: '#0F1114',
  surface: '#171A1E',
  ink: '#E6E9EF',
  onAccent: '#FFFFFF',
  shadow: '0 1px 2px rgba(0,0,0,.4)',

  g50: '#131619',
  g100: '#1B1E22',
  g200: '#272B30',
  g300: '#363B42',
  g400: '#555C65',
  g500: '#7B8390',
  g600: '#9BA3AE',
  g700: '#C4CAD2',

  sky: '#5CAAF0',
  violet: '#A78BFA',
  tangerine: '#F09A62',
  fuchsia: '#E870C0',
  amber: '#FBBF24',

  up: '#34D399',
  dn: '#F87171',
  wn: '#F8F571',

  fontFace: LIGHT_TOKENS.fontFace,
  fontMono: LIGHT_TOKENS.fontMono,
  ease: LIGHT_TOKENS.ease,
};

/** Преобразует токены в объект CSS custom properties. */
export function toCssVars(tokens: DsTokens): Record<string, string> {
  return {
    '--bg': tokens.bg,
    '--s': tokens.surface,
    '--ink': tokens.ink,
    '--on-accent': tokens.onAccent,
    '--sh': tokens.shadow,

    '--g50': tokens.g50,
    '--g100': tokens.g100,
    '--g200': tokens.g200,
    '--g300': tokens.g300,
    '--g400': tokens.g400,
    '--g500': tokens.g500,
    '--g600': tokens.g600,
    '--g700': tokens.g700,

    '--c-sky': tokens.sky,
    '--c-violet': tokens.violet,
    '--c-tangerine': tokens.tangerine,
    '--c-fuchsia': tokens.fuchsia,
    '--c-amber': tokens.amber,

    '--up': tokens.up,
    '--dn': tokens.dn,
    '--wn': tokens.wn,

    '--f': tokens.fontFace,
    '--m': tokens.fontMono,
    '--ease': tokens.ease,
  };
}

/** hex → rgba string с заданной непрозрачностью. */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map(c => c + c)
          .join('')
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
