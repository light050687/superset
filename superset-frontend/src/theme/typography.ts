/**
 * DS 2.0 — Typography helpers для Emotion.
 *
 * Используйте `t.<token>` в styled-component / css-prop вместо хардкодов
 * `font-size: Npx`. Возвращают serialized css template с fluid размерами
 * через CSS-переменные `var(--fs-*)` (определены в head_custom_extra.html).
 *
 * Минимум 11px для текста, 10px только для UPPERCASE (`t.nano`).
 * Hero KPI ≥ 28px, до 56px на 4K через container queries.
 *
 * Пример:
 *   const HeroValue = styled.div`
 *     ${t.hero}
 *     color: var(--ink);
 *   `;
 *
 * Для container query growth:
 *   const Root = styled.div`
 *     container-type: inline-size;
 *     container-name: kpi;
 *   `;
 */

import { css } from '@emotion/react';

export const t = {
  display: css`
    font: 800 var(--fs-display) / 1.05 var(--f);
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
  `,
  hero: css`
    font: 800 var(--fs-hero) / 1.1 var(--f);
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  `,
  title: css`
    font: 700 var(--fs-title) / 1.2 var(--f);
    letter-spacing: -0.01em;
  `,
  subtitle: css`
    font: 600 var(--fs-subtitle) / 1.3 var(--f);
  `,
  body: css`
    font: 400 var(--fs-body) / 1.5 var(--f);
  `,
  bodyStrong: css`
    font: 600 var(--fs-body) / 1.5 var(--f);
  `,
  interactive: css`
    font: 500 var(--fs-interactive) / 1.4 var(--f);
  `,
  meta: css`
    font: 500 var(--fs-meta) / 1.4 var(--f);
  `,
  metaMono: css`
    font: 500 var(--fs-meta) / 1.4 var(--m);
    font-variant-numeric: tabular-nums;
  `,
  micro: css`
    font: 600 var(--fs-micro) / 1.4 var(--m);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  `,
  nano: css`
    font: 700 var(--fs-nano) / 1.3 var(--m);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  `,
} as const;

export type TypographyToken = keyof typeof t;
