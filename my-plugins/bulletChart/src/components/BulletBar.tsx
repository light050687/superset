import * as React from 'react';
import { BBand, BBar, BChart, BTarget } from '../styles';
import type { Direction } from '../types';

interface BulletBarProps {
  /** Фактическое значение */
  value: number;
  /** Целевое значение (план). Если null — target не рисуется и зоны делят шкалу на 3 равные части. */
  target: number | null;
  /** Общий максимум шкалы — единый для всех строк, чтобы бары были сравнимы. */
  scaleMax: number;
  /** Направление «хорошо»: влияет на расположение качественных зон. */
  direction: Direction;
}

/**
 * Bullet-бар в стиле Stephen Few с 3 качественными зонами, основным баром и маркером цели.
 *
 * Зоны строятся относительно target (plan) по формуле из прототипа (ref:793-796):
 *   band1 (g100, «приемлемо») — вся ширина scaleMax
 *   band2 (g200, «хорошо»)    — до plan
 *   band3 (g300, «отлично»)   — до 0.8 × plan
 *
 * Для `more_is_better` зоны отражены: «отлично» справа от 1.2×plan, «хорошо» — от plan.
 */
const BulletBar: React.FC<BulletBarProps> = ({
  value,
  target,
  scaleMax,
  direction,
}) => {
  const safeScale = scaleMax > 0 ? scaleMax : 1;
  const pct = (v: number): number =>
    Math.min(100, Math.max(0, (v / safeScale) * 100));

  const barWidth = pct(value);
  const targetLeft = target != null ? pct(target) : null;

  // Построение 3 зон.
  // less_is_better: малые значения → хорошо → рисуем «good» узкой слева.
  // more_is_better: большие значения → хорошо → рисуем «good» широкой, «bad» узкой слева.
  const bandsLess = target != null
    ? [
        { w: 100, kind: 'bad' as const },              // band1 — весь фон
        { w: pct(target), kind: 'warn' as const },    // band2 — до плана
        { w: pct(target * 0.8), kind: 'good' as const }, // band3 — до 80% плана
      ]
    : [
        { w: 100, kind: 'bad' as const },
        { w: 66.6, kind: 'warn' as const },
        { w: 33.3, kind: 'good' as const },
      ];

  const bandsMore = target != null
    ? [
        { w: 100, kind: 'bad' as const },              // band1 — весь фон = плохо
        { w: pct(target * 1.2), kind: 'warn' as const }, // band2 — до 120% плана
        { w: pct(target), kind: 'good' as const },    // band3 — до плана (inverted)
      ]
    : bandsLess;

  const bands = direction === 'less_is_better' ? bandsLess : bandsMore;

  return (
    <BChart
      role="img"
      aria-label={
        target != null ? `Значение ${value}, цель ${target}` : `Значение ${value}`
      }
    >
      {bands.map((b, i) => (
        <BBand
          key={i}
          bg={b.kind}
          style={{ width: `${b.w}%` }}
          aria-hidden="true"
        />
      ))}
      <BBar widthPct={barWidth} />
      {targetLeft != null ? <BTarget leftPct={targetLeft} /> : null}
    </BChart>
  );
};

export default React.memo(BulletBar);
