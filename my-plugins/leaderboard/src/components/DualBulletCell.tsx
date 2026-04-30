import { memo } from 'react';
import { Cell, DualBulletEl } from '../styles';
import { nf2 } from '../utils/formatRussian';
import type { DsTokens } from '../themeTokens';

interface Props {
  writeoff: number;
  shrinkage: number;
  planWriteoff: number;
  planShrinkage: number;
  maxWriteoff: number;
  maxShrinkage: number;
  tokens: DsTokens;
}

/** Стекованные bullets: СП (tangerine) + НД (sky) с планом. */
function DualBulletInner({
  writeoff,
  shrinkage,
  planWriteoff,
  planShrinkage,
  maxWriteoff,
  maxShrinkage,
  tokens,
}: Props) {
  const maxW = Math.max(maxWriteoff, 0.01) * 1.05;
  const maxS = Math.max(maxShrinkage, 0.01) * 1.05;
  const wFill = Math.min(100, (writeoff / maxW) * 100);
  const wTarget = (planWriteoff / maxW) * 100;
  const sFill = Math.min(100, (Math.max(0, shrinkage) / maxS) * 100);
  const sTarget = (planShrinkage / maxS) * 100;

  return (
    <Cell $align="right">
      <DualBulletEl>
        <span className="db-row" style={{ color: tokens.tangerine }}>
          <span className="db-label">СП</span>
          <span className="db-track">
            <span
              className="db-fill"
              style={{ width: `${wFill}%`, background: tokens.tangerine }}
            />
            <span
              className="db-target"
              style={{ left: `calc(${wTarget}% - 1px)` }}
            />
          </span>
          <span className="db-val">{nf2(writeoff)}%</span>
        </span>
        <span className="db-row" style={{ color: tokens.sky }}>
          <span className="db-label">НД</span>
          <span className="db-track">
            <span
              className="db-fill"
              style={{ width: `${sFill}%`, background: tokens.sky }}
            />
            <span
              className="db-target"
              style={{ left: `calc(${sTarget}% - 1px)` }}
            />
          </span>
          <span className="db-val">{nf2(shrinkage)}%</span>
        </span>
      </DualBulletEl>
    </Cell>
  );
}

export default memo(DualBulletInner);
