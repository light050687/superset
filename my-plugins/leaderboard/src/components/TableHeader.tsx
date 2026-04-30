import { memo } from 'react';
import { TableHead, Th } from '../styles';
import type { SortDir, SortKey } from '../types';
import { COLUMNS, GRID_COLS } from './columns';

interface Props {
  sortBy: SortKey;
  sortDir: SortDir;
  onSort: (sortKey: SortKey, defaultDir: SortDir) => void;
}

function TableHeaderInner({ sortBy, sortDir, onSort }: Props) {
  return (
    <TableHead $cols={GRID_COLS} role="row">
      {COLUMNS.map(c => {
        const isSortable = c.sortable !== false && Boolean(c.sortKey);
        const isSorted = c.sortKey === sortBy;
        const alignTh = c.align;
        const aria = isSorted
          ? sortDir === 'asc'
            ? 'ascending'
            : 'descending'
          : undefined;
        return (
          <Th
            key={c.id}
            role="columnheader"
            aria-sort={aria}
            $align={alignTh}
            $sorted={isSorted}
            $sortable={isSortable}
            tabIndex={isSortable ? 0 : -1}
            onClick={() => {
              if (!isSortable || !c.sortKey) return;
              onSort(c.sortKey, c.defaultSort ?? 'desc');
            }}
            onKeyDown={e => {
              if (!isSortable || !c.sortKey) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSort(c.sortKey, c.defaultSort ?? 'desc');
              }
            }}
          >
            {c.label}
            {isSorted &&
              (sortDir === 'desc' ? (
                <svg
                  className="sort-arrow"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                >
                  <path d="M5 2 L5 8 M2.5 6 L5 8 L7.5 6" />
                </svg>
              ) : (
                <svg
                  className="sort-arrow"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                >
                  <path d="M5 8 L5 2 M2.5 4 L5 2 L7.5 4" />
                </svg>
              ))}
          </Th>
        );
      })}
    </TableHead>
  );
}

export default memo(TableHeaderInner);
