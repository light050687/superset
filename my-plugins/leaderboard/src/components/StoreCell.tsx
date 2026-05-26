import { memo } from 'react';
import type { Segment, Store } from '../types';
import { StoreCellEl } from '../styles';

interface Props {
  data: Store | Segment;
}

function StoreCellInner({ data }: Props) {
  if (data.isSegment) {
    return (
      <StoreCellEl>
        <span className="store-code">
          <span className="code">{data.code}</span>
          <span>{data.name}</span>
        </span>
        <span className="store-meta">Сегмент · ТО {data.toClass} млн</span>
      </StoreCellEl>
    );
  }
  return (
    <StoreCellEl>
      <span className="store-code">
        <span className="code">{data.code}</span>
        <span>{data.shortLabel}</span>
      </span>
      <span className="store-meta">
        {data.city} · {data.formatName} · ТО {data.toClass}млн
      </span>
    </StoreCellEl>
  );
}

export default memo(StoreCellInner);
