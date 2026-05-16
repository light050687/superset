import { memo } from 'react';
import { MRankRow, MRanked } from '../styles';
import { deltaClass, fmtDelta, nf2 } from '../utils/formatRussian';

export interface RankedBarItem {
  name: string;
  pct: number;
  delta: number;
  color: string;
}

interface Props {
  items: RankedBarItem[];
}

/** Список горизонтальных bar-rows (причины/виды списаний в модалке). */
function RankedBarListInner({ items }: Props) {
  const maxPct = Math.max(...items.map(i => i.pct), 0.01);
  return (
    <MRanked>
      {items.map((item, idx) => {
        const barPct = (item.pct / maxPct) * 100;
        const dCls = deltaClass(item.delta, true);
        return (
          <MRankRow key={`${item.name}-${idx}`}>
            <div className="m-rank-name" title={item.name}>
              {item.name}
            </div>
            <div className="m-rank-bar">
              <div
                className="m-rank-bar-fill"
                style={{ width: `${barPct}%`, background: item.color }}
              />
            </div>
            <div className="m-rank-pct">{nf2(item.pct)}%</div>
            <div className={`m-rank-delta ${dCls}`}>
              {fmtDelta(item.delta)}
            </div>
          </MRankRow>
        );
      })}
    </MRanked>
  );
}

export default memo(RankedBarListInner);
