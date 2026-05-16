import { memo } from 'react';
import type { Segment, Store } from '../types';
import { PinBtn, StoreCellEl } from '../styles';

interface Props {
  data: Store | Segment;
  pinned?: boolean;
  onTogglePin?: () => void;
}

function StoreCellInner({ data, pinned, onTogglePin }: Props) {
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
        {onTogglePin && (
          <PinBtn
            type="button"
            $active={!!pinned}
            aria-label={pinned ? 'Открепить' : 'Закрепить'}
            aria-pressed={!!pinned}
            data-action="pin"
            onClick={e => {
              e.stopPropagation();
              onTogglePin();
            }}
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 1 L9 1 L9 5 L10.5 6.5 L7.5 6.5 L7.5 10.5 L6 12 L4.5 10.5 L4.5 6.5 L1.5 6.5 L3 5 Z" />
            </svg>
          </PinBtn>
        )}
      </span>
      <span className="store-meta">
        {data.city} · {data.formatName} · ТО {data.toClass}млн
      </span>
    </StoreCellEl>
  );
}

export default memo(StoreCellInner);
