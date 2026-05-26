import { memo } from 'react';
import { Cell, RowEl } from '../styles';
import type { Segment, Store } from '../types';
import type { DsTokens } from '../themeTokens';
import { COLUMNS } from './columns';
import TreeChevron from './TreeChevron';
import StoreCell from './StoreCell';
import BulletCell from './BulletCell';
import DualBulletCell from './DualBulletCell';
import NumberCell from './NumberCell';
import DriversCell from './DriversCell';
import StatusChip from './StatusChip';

interface Props {
  data: Store | Segment;
  level: 0 | 1;
  displayIdx: number;
  selected: boolean;
  dimmed: boolean;
  pinned: boolean;
  expanded: boolean;
  expandable: boolean;
  focused: boolean;
  tokens: DsTokens;
  globalMaxWriteoff: number;
  globalMaxShrinkage: number;
  onRowClick?: (e: React.MouseEvent) => void;
  onRowDblClick?: () => void;
  onRowMouseEnter?: (e: React.MouseEvent) => void;
  onRowMouseLeave?: () => void;
  onRowMouseMove?: (e: React.MouseEvent) => void;
  onToggleExpand?: () => void;
  onTogglePin?: () => void;
}

function StoreRowInner(props: Props) {
  const {
    data,
    level,
    displayIdx,
    selected,
    dimmed,
    pinned,
    expanded,
    expandable,
    focused,
    tokens,
    globalMaxWriteoff,
    globalMaxShrinkage,
    onRowClick,
    onRowDblClick,
    onRowMouseEnter,
    onRowMouseLeave,
    onRowMouseMove,
    onToggleExpand,
    onTogglePin,
  } = props;

  return (
    <RowEl
      role="row"
      tabIndex={focused ? 0 : -1}
      aria-selected={selected}
      $selected={selected}
      $dimmed={dimmed}
      $pinned={pinned}
      $segment={data.isSegment}
      onClick={onRowClick}
      onDoubleClick={onRowDblClick}
      onMouseEnter={onRowMouseEnter}
      onMouseLeave={onRowMouseLeave}
      onMouseMove={onRowMouseMove}
      data-id={data.id}
    >
      {COLUMNS.map(c => {
        switch (c.type) {
          case 'tree':
            return (
              <TreeChevron
                key={c.id}
                level={level}
                expandable={expandable}
                expanded={expanded}
                onToggle={onToggleExpand}
              />
            );
          case 'store':
            return (
              <Cell key={c.id}>
                <StoreCell data={data} />
              </Cell>
            );
          case 'bullet-loss':
            return (
              <BulletCell
                key={c.id}
                value={data.writeoff}
                plan={data.planWriteoff}
                globalMax={globalMaxWriteoff}
                tokens={tokens}
              />
            );
          case 'dual-bullet':
            return (
              <DualBulletCell
                key={c.id}
                writeoff={data.writeoff}
                shrinkage={data.shrinkage}
                planWriteoff={data.planWriteoff}
                planShrinkage={data.planShrinkage}
                maxWriteoff={globalMaxWriteoff}
                maxShrinkage={globalMaxShrinkage}
                tokens={tokens}
              />
            );
          case 'number': {
            const field = c.numberField ?? 'avgWriteoff';
            return <NumberCell key={c.id} value={data[field]} unit="₽" />;
          }
          case 'drivers':
            return <DriversCell key={c.id} data={data} tokens={tokens} />;
          case 'status':
            return (
              <StatusChip key={c.id} status={data.status} tokens={tokens} />
            );
          default:
            return <Cell key={c.id} />;
        }
      })}
    </RowEl>
  );
}

/** memo по id + все «состояние» ключи. */
function areEqual(prev: Props, next: Props): boolean {
  return (
    prev.data.id === next.data.id &&
    prev.displayIdx === next.displayIdx &&
    prev.level === next.level &&
    prev.selected === next.selected &&
    prev.dimmed === next.dimmed &&
    prev.pinned === next.pinned &&
    prev.expanded === next.expanded &&
    prev.expandable === next.expandable &&
    prev.focused === next.focused &&
    prev.tokens === next.tokens &&
    prev.globalMaxWriteoff === next.globalMaxWriteoff &&
    prev.globalMaxShrinkage === next.globalMaxShrinkage
  );
}

export default memo(StoreRowInner, areEqual);
