import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RankedRow, SortMode, UnitMode } from '../types';
import ModalShell from './ModalShell';
import RankRow from './RankRow';
import {
  AllFooter,
  AllModalIcon,
  AllToolbar,
  EmptyState,
  ModalHead,
  RankList,
  SortPills,
} from '../styles';
import { fmtRub } from '../utils/formatRussian';

interface AllItemsModalProps {
  rows: RankedRow[];
  totalRows: number;
  totalSum: number;
  unit: UnitMode;
  maxValue: number;
  invertDeltaGood: boolean;
  decimalsValue: number;
  decimalsDelta: number;
  decimalsShare: number;
  unitSuffixRub: string;
  showSparkline: boolean;
  showGhostPrevBar: boolean;
  hasPrevMetric: boolean;
  activeIds: Set<string>;
  themeMode: 'light' | 'dark';
  initialSort: SortMode;
  onRowClick: (row: RankedRow, modKey: boolean) => void;
  onClose: () => void;
}

function sortRows(rows: RankedRow[], by: SortMode): RankedRow[] {
  const copy = [...rows];
  switch (by) {
    case 'sum':
      copy.sort((a, b) => b.value - a.value);
      break;
    case 'share':
      copy.sort((a, b) => b.sharePct - a.sharePct);
      break;
    case 'delta':
      copy.sort((a, b) => b.deltaPP - a.deltaPP);
      break;
  }
  return copy;
}

const AllItemsModal: React.FC<AllItemsModalProps> = ({
  rows,
  totalRows,
  totalSum,
  unit,
  maxValue,
  invertDeltaGood,
  decimalsValue,
  decimalsDelta,
  decimalsShare,
  unitSuffixRub,
  showSparkline,
  showGhostPrevBar,
  hasPrevMetric,
  activeIds,
  themeMode,
  initialSort,
  onRowClick,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortMode>(initialSort);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus the search input once the modal has opened and its entry
  // animation settles (200ms) — matches the ref prototype.
  useEffect(() => {
    const id = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 200);
    return () => window.clearTimeout(id);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? rows.filter(
          r =>
            r.name.toLowerCase().includes(q) ||
            r.sub.toLowerCase().includes(q),
        )
      : rows;
    return sortRows(base, sortBy);
  }, [rows, query, sortBy]);

  const filteredSum = useMemo(
    () => filtered.reduce((s, r) => s + r.value, 0),
    [filtered],
  );
  const totalSumParts = fmtRub(filteredSum, decimalsValue, unitSuffixRub);
  const sharePct = totalSum > 0 ? (filteredSum / totalSum) * 100 : 0;

  const handleRowClickInModal = useCallback(
    (row: RankedRow, modKey: boolean) => {
      onRowClick(row, modKey);
      if (modKey) {
        // DetailModal will pop on top; keep AllItemsModal open for context.
      }
    },
    [onRowClick],
  );

  return (
    <ModalShell
      open
      onClose={onClose}
      wide
      themeMode={themeMode}
      zIndex={1050}
      labelledBy="rb-all-title"
    >
      <ModalHead>
        <AllModalIcon>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="2" y1="3" x2="14" y2="3" />
            <line x1="2" y1="7" x2="11" y2="7" />
            <line x1="2" y1="11" x2="7" y2="11" />
          </svg>
        </AllModalIcon>
        <div className="m-titles">
          <div className="m-title" id="rb-all-title">
            Все позиции
          </div>
          <div className="m-sub">Всего {totalRows} строк</div>
        </div>
        <button
          type="button"
          className="m-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <svg
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="2" y1="2" x2="12" y2="12" />
            <line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>
      </ModalHead>

      <AllToolbar>
        <div className="search-wrap">
          <svg
            className="search-icon"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="4" />
            <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск по названию…"
            aria-label="Поиск по названию"
            autoComplete="off"
          />
        </div>
        <SortPills>
          <button
            type="button"
            className={sortBy === 'sum' ? 'on' : ''}
            onClick={() => setSortBy('sum')}
          >
            По сумме
          </button>
          <button
            type="button"
            className={sortBy === 'delta' ? 'on' : ''}
            onClick={() => setSortBy('delta')}
            disabled={!hasPrevMetric}
            title={hasPrevMetric ? '' : 'Требуется «Метрика прошлого периода»'}
          >
            По дельте
          </button>
          <button
            type="button"
            className={sortBy === 'share' ? 'on' : ''}
            onClick={() => setSortBy('share')}
          >
            По доле
          </button>
        </SortPills>
      </AllToolbar>

      {filtered.length === 0 ? (
        <EmptyState>
          {query
            ? `Ничего не найдено по запросу «${query}»`
            : 'Нет данных для отображения'}
        </EmptyState>
      ) : (
        <RankList $hasFilter={activeIds.size > 0} role="list">
          {filtered.map((row, idx) => (
            <RankRow
              key={row.id}
              row={row}
              index={idx}
              maxValue={maxValue}
              unit={unit}
              invertDeltaGood={invertDeltaGood}
              decimalsValue={decimalsValue}
              decimalsDelta={decimalsDelta}
              decimalsShare={decimalsShare}
              unitSuffixRub={unitSuffixRub}
              showSparkline={showSparkline}
              showGhostPrevBar={showGhostPrevBar}
              filtered={activeIds.has(row.id)}
              onClick={handleRowClickInModal}
            />
          ))}
        </RankList>
      )}

      <AllFooter>
        <span>
          Показано {filtered.length} из {totalRows}
        </span>
        <span>
          Сумма:{' '}
          <span className="total-strong">
            {totalSumParts.number}
            {totalSumParts.unit}
          </span>{' '}
          · {sharePct.toFixed(1)}% от итога
        </span>
      </AllFooter>
    </ModalShell>
  );
};

export default AllItemsModal;
