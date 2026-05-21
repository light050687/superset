import { memo } from 'react';
import type { Segment, Store } from '../types';
import { Cell, DriversCellEl } from '../styles';
import { deltaClass, fmtDelta, nf1, nf2, nf0 } from '../utils/formatRussian';
import { colorFromKey } from '../utils/colorFromKey';
import type { DsTokens } from '../themeTokens';

interface Props {
  data: Store | Segment;
  tokens: DsTokens;
}

/** Ячейка «Основные драйверы» — 3 строки для store, 2 для сегмента. */
function DriversCellInner({ data, tokens }: Props) {
  const causeColor = colorFromKey(data.mainCause.colorKey, tokens);
  const dCls1 = deltaClass(data.mainCauseDelta, true);
  const dCls2 = deltaClass(data.mainWoTypeDelta, true);

  const causeRow = (
    <span className="driver-row">
      <span className="driver-name">
        <span className="type-dot" style={{ background: causeColor }} />
        {data.mainCause.name}
      </span>
      <span className="driver-pct">{nf1(data.mainCausePct)}%</span>
      <span className={`driver-delta ${dCls1}`}>
        {fmtDelta(data.mainCauseDelta)}
      </span>
    </span>
  );
  const woRow = (
    <span className="driver-row">
      <span className="driver-name">
        <span className="type-dot" style={{ background: tokens.g500 }} />
        {data.mainWoType}
      </span>
      <span className="driver-pct">{nf2(data.mainWoTypePct)}%</span>
      <span className={`driver-delta ${dCls2}`}>
        {fmtDelta(data.mainWoTypeDelta)}
      </span>
    </span>
  );

  if (data.isSegment) {
    return (
      <Cell $align="left">
        <DriversCellEl>
          {causeRow}
          {woRow}
        </DriversCellEl>
      </Cell>
    );
  }

  /* После early-return на isSegment, data — это Store. Явный cast потому что
     --strict false в этом плагине не сужает discriminated union. */
  const store = data as Store;
  const dCls3 = deltaClass(store.mainSegmentDelta, true);
  return (
    <Cell $align="left">
      <DriversCellEl>
        {causeRow}
        {woRow}
        <span className="driver-row">
          <span className="driver-name">
            <span className="type-dot" style={{ background: tokens.g500 }} />
            {store.mainSegment}
          </span>
          <span className="driver-pct">{nf0(store.mainSegmentPct)}%</span>
          <span className={`driver-delta ${dCls3}`}>
            {fmtDelta(store.mainSegmentDelta)}
          </span>
        </span>
      </DriversCellEl>
    </Cell>
  );
}

export default memo(DriversCellInner);
