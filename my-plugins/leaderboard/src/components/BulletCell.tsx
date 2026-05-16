import { memo } from 'react';
import { BulletCellEl, Cell } from '../styles';
import { deltaClass, nf2 } from '../utils/formatRussian';
import type { DsTokens } from '../themeTokens';

interface Props {
  value: number;
  plan: number;
  globalMax: number;
  tokens: DsTokens;
}

/**
 * Bullet chart с plan-маркером (столбец "Уровень потерь").
 * Цвет заливки определяется по дельте value-plan и правилу invertGood=true
 * (рост списаний это плохо).
 */
function BulletCellInner({ value, plan, globalMax, tokens }: Props) {
  const dClass = deltaClass(value - plan, true);
  const color =
    dClass === 'dn' ? tokens.dn : dClass === 'up' ? tokens.up : tokens.wn;

  const max = Math.max(globalMax, plan, value, 0.01) * 1.05;
  const fillPct = Math.min(100, (value / max) * 100);
  const planPct = (plan / max) * 100;

  return (
    <Cell $align="right">
      <BulletCellEl>
        <span className="bullet-val" style={{ color }}>
          <span>{nf2(value)}%</span>
          <span className="plan">план {nf2(plan)}%</span>
        </span>
        <span className="bullet-track">
          <span
            className="bullet-fill"
            style={{ width: `${fillPct}%`, background: color }}
          />
          <span
            className="bullet-target"
            style={{ left: `calc(${planPct}% - 1px)` }}
          />
        </span>
      </BulletCellEl>
    </Cell>
  );
}

export default memo(BulletCellInner);
