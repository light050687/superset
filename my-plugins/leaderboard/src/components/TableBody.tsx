import { memo, useMemo } from 'react';
import { TableBodyEl } from '../styles';
import type { FlatRow, Store } from '../types';
import type { DsTokens } from '../themeTokens';
import { GRID_COLS } from './columns';
import StoreRow from './StoreRow';

interface Props {
  rows: FlatRow[];
  /** Для scale в bullet-cells. */
  allStores: Store[];
  crossSelected: Set<string>;
  segmentCrossSelected: Set<string>;
  pinned: Set<string>;
  expanded: Set<string>;
  focusedRowId: string | null;
  tokens: DsTokens;

  onRowClick: (id: string, idx: number, e: React.MouseEvent) => void;
  onRowDblClick: (id: string, parentStoreId?: string) => void;
  onRowMouseEnter?: (id: string, e: React.MouseEvent) => void;
  onRowMouseMove?: (id: string, e: React.MouseEvent) => void;
  onRowMouseLeave?: () => void;
  onToggleExpand: (id: string) => void;
  onTogglePin: (id: string) => void;
}

function TableBodyInner(props: Props) {
  const {
    rows,
    allStores,
    crossSelected,
    segmentCrossSelected,
    pinned,
    expanded,
    focusedRowId,
    tokens,
    onRowClick,
    onRowDblClick,
    onRowMouseEnter,
    onRowMouseMove,
    onRowMouseLeave,
    onToggleExpand,
    onTogglePin,
  } = props;

  const globalMaxWriteoff = useMemo(
    () => Math.max(...allStores.map(s => s.writeoff), 0.01),
    [allStores],
  );
  const globalMaxShrinkage = useMemo(
    () =>
      Math.max(...allStores.map(s => Math.max(0, s.shrinkage)), 0.01),
    [allStores],
  );

  if (rows.length === 0) {
    return (
      <TableBodyEl $cols={GRID_COLS}>
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--g600)',
            fontFamily: 'var(--m)',
            fontSize: 12,
          }}
        >
          Ничего не найдено — попробуйте сбросить фильтры или изменить поиск.
        </div>
      </TableBodyEl>
    );
  }

  return (
    <TableBodyEl $cols={GRID_COLS} role="rowgroup">
      {rows.map(r => {
        const data = r.data;
        const id = data.id;
        const segmentId = data.isSegment ? data.segmentId : null;
        const isCross = data.isSegment
          ? segmentCrossSelected.has(segmentId ?? '')
          : crossSelected.has(id);
        const someCross = data.isSegment
          ? segmentCrossSelected.size > 0
          : crossSelected.size > 0;
        const dimmed = someCross && !isCross;
        const isPinned = pinned.has(id);
        const isExpanded = expanded.has(id);
        const expandable = !data.isSegment;

        return (
          <StoreRow
            key={id}
            data={data}
            level={r.level}
            displayIdx={r.displayIdx}
            selected={isCross}
            dimmed={dimmed}
            pinned={isPinned}
            expanded={isExpanded}
            expandable={expandable}
            focused={focusedRowId === id}
            tokens={tokens}
            globalMaxWriteoff={globalMaxWriteoff}
            globalMaxShrinkage={globalMaxShrinkage}
            onRowClick={e => {
              if ((e.target as HTMLElement).closest('[data-action]')) return;
              onRowClick(id, r.displayIdx - 1, e);
            }}
            onRowDblClick={() =>
              onRowDblClick(
                id,
                r.kind === 'segment' ? r.parentStoreId : undefined,
              )
            }
            onRowMouseEnter={e => onRowMouseEnter?.(id, e)}
            onRowMouseMove={e => onRowMouseMove?.(id, e)}
            onRowMouseLeave={onRowMouseLeave}
            onToggleExpand={() => onToggleExpand(id)}
            onTogglePin={data.isSegment ? undefined : () => onTogglePin(id)}
          />
        );
      })}
    </TableBodyEl>
  );
}

export default memo(TableBodyInner);
