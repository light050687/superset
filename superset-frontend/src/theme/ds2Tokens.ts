/**
 * DS 2.0 — Design System tokens (TypeScript mirror of head_custom_extra.html CSS vars).
 *
 * Источник правды: `superset/templates/head_custom_extra.html` + _ds2_doc.txt.
 * Используйте эти константы вместо хардкода hex в компонентах.
 * Для динамического использования (light/dark) — см. хук useDs2() в ./useDs2.ts.
 */

/* eslint-disable theme-colors/no-literal-colors */

export const DS2_FONTS = {
  sans: "'Manrope', 'Inter', Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
} as const;

export const DS2_SPACE = {
  s05: 2,
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s6: 24,
  s8: 32,
  s12: 48,
} as const;

export const DS2_RADIUS = {
  card: 10,
  control: 6,
} as const;

export const DS2_EASE = 'cubic-bezier(.4, 0, .2, 1)';

export const DS2_LIGHT = {
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
  cSky: '#3B8BD9',
  cViolet: '#8B5CF6',
  cTangerine: '#E87C3E',
  cFuchsia: '#D946A8',
  cAmber: '#CA8A04',
  up: '#16A34A',
  dn: '#DC2626',
  wn: '#CCB604',
  upBg: 'rgba(22, 163, 74, 0.08)',
  dnBg: 'rgba(220, 38, 38, 0.08)',
  wnBg: 'rgba(204, 182, 4, 0.08)',
} as const;

export const DS2_DARK = {
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
  cSky: '#5CAAF0',
  cViolet: '#A78BFA',
  cTangerine: '#F09A62',
  cFuchsia: '#E870C0',
  cAmber: '#FBBF24',
  up: '#34D399',
  dn: '#F87171',
  wn: '#F8F571',
  upBg: 'rgba(52, 211, 153, 0.10)',
  dnBg: 'rgba(248, 113, 113, 0.10)',
  wnBg: 'rgba(248, 245, 113, 0.10)',
} as const;

/**
 * Общий тип палитры — union покрывает оба режима (light/dark),
 * чтобы `useDs2().palette` имел консистентный тип независимо от mode.
 */
export type Ds2Palette = {
  [K in keyof typeof DS2_LIGHT]: string;
};

/** CSS var имена — используйте через `var(--...)` в стилях верхнего уровня. */
export const DS2_VARS = {
  bg: 'var(--bg)',
  s: 'var(--s)',
  ink: 'var(--ink)',
  g50: 'var(--g50)',
  g100: 'var(--g100)',
  g200: 'var(--g200)',
  g300: 'var(--g300)',
  g400: 'var(--g400)',
  g500: 'var(--g500)',
  g600: 'var(--g600)',
  g700: 'var(--g700)',
  cSky: 'var(--c-sky)',
  cViolet: 'var(--c-violet)',
  cTangerine: 'var(--c-tangerine)',
  cFuchsia: 'var(--c-fuchsia)',
  cAmber: 'var(--c-amber)',
  up: 'var(--up)',
  dn: 'var(--dn)',
  wn: 'var(--wn)',
  upBg: 'var(--up-b)',
  dnBg: 'var(--dn-b)',
  wnBg: 'var(--wn-b)',
  fontSans: 'var(--f)',
  fontMono: 'var(--m)',
  ease: 'var(--ease)',
} as const;

/** Типографическая шкала DS 2.0 (см. раздел 02 дизайн-документа). */
export const DS2_TYPE = {
  pageTitle: {
    fontFamily: DS2_VARS.fontSans,
    fontSize: 28,
    lineHeight: '34px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  sectionTitle: {
    fontFamily: DS2_VARS.fontSans,
    fontSize: 14,
    lineHeight: '18px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  metaMono: {
    fontFamily: DS2_VARS.fontMono,
    fontSize: 11,
    lineHeight: '16px',
    fontWeight: 400,
  },
  kpiLabel: {
    fontFamily: DS2_VARS.fontMono,
    fontSize: 11,
    lineHeight: '16px',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },
  heroNumber: {
    fontFamily: DS2_VARS.fontSans,
    fontSize: 28,
    lineHeight: '34px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums' as const,
  },
  delta: {
    fontFamily: DS2_VARS.fontMono,
    fontSize: 11,
    lineHeight: '16px',
    fontWeight: 600,
  },
  body: {
    fontFamily: DS2_VARS.fontSans,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 400,
  },
  tableHeader: {
    fontFamily: DS2_VARS.fontMono,
    fontSize: 11,
    lineHeight: '16px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },
} as const;

/**
 * Пороги контраста из DS 2.0 (раздел 10).
 * Используйте как валидацию в тестах и в CI.
 */
export const DS2_A11Y_MIN_CONTRAST = {
  smallText: 4.5, // <18px
  largeText: 3.0, // ≥18px bold / ≥24px regular
} as const;
