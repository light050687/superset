import { useEffect, useRef, useState } from 'react';
import type {
  AxisItem,
  BreakdownRow,
  CellData,
  CompareItem,
  DrillQueryParams,
  Thresholds,
  TotalsSlice,
} from './types';
import { cellStatus, STATUS_LABEL, totalsStatus } from './utils/thresholds';
import {
  formatRussianInt,
  formatRussianPercent,
  formatRussianSmartEx,
} from './utils/formatRussian';
import { fetchBreakdown } from './utils/drillApi';
import { buildMockCells } from './mocks/lossesPreset';
import {
  DrillBars,
  DrillSectionTitle,
  DrillSummary,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalClose,
  ModalHead,
  ModalRoot,
  ModalTitle,
} from './styles';

interface DrillSummaryData {
  title: string;
  totalFact: number;
  totalPlan: number | null;
  pct: number | null;
  ratio: number | null;
  shops: number | null;
}

interface DrillModalProps {
  item: CompareItem;
  onClose: () => void;
  rows: AxisItem[];
  cols: AxisItem[];
  cells: Map<string, CellData>;
  rowTotals: Map<string, TotalsSlice>;
  colTotals: Map<string, TotalsSlice>;
  thresholds: Thresholds;
  unitSuffix: string;
  decimals: number;
  drillQueryParams: DrillQueryParams | null;
  mockMode: boolean;
}

function buildSummary(
  item: CompareItem,
  rows: AxisItem[],
  cols: AxisItem[],
  cells: Map<string, CellData>,
  rowTotals: Map<string, TotalsSlice>,
  colTotals: Map<string, TotalsSlice>,
): DrillSummaryData | null {
  if (item.type === 'cell' && item.rowId && item.colId) {
    const cell = cells.get(`${item.rowId}|${item.colId}`);
    if (!cell) return null;
    const rowName = rows.find((r) => r.id === item.rowId)?.name ?? item.rowId;
    const colName = cols.find((c) => c.id === item.colId)?.name ?? item.colId;
    return {
      title: `${rowName} × ${colName}`,
      totalFact: cell.value,
      totalPlan: cell.plan,
      pct: cell.pct,
      ratio: cell.ratio,
      shops: cell.shops,
    };
  }
  if (item.type === 'row' && item.rowId) {
    const slice = rowTotals.get(item.rowId);
    if (!slice) return null;
    const rowName = rows.find((r) => r.id === item.rowId)?.name ?? item.rowId;
    return {
      title: `Строка: ${rowName}`,
      totalFact: slice.fact,
      totalPlan: slice.plan,
      pct: slice.pct,
      ratio: slice.ratio,
      shops: null,
    };
  }
  if (item.type === 'col' && item.colId) {
    const slice = colTotals.get(item.colId);
    if (!slice) return null;
    const colName = cols.find((c) => c.id === item.colId)?.name ?? item.colId;
    return {
      title: `Колонка: ${colName}`,
      totalFact: slice.fact,
      totalPlan: slice.plan,
      pct: slice.pct,
      ratio: slice.ratio,
      shops: null,
    };
  }
  return null;
}

function mockBreakdown(item: CompareItem): BreakdownRow[] {
  const mockCells = buildMockCells();
  if (item.type === 'cell' && item.rowId && item.colId) {
    const c = mockCells.get(`${item.rowId}|${item.colId}`);
    return c?.breakdown ?? [];
  }
  // Row / col — aggregate breakdown across matching cells
  const bucket = new Map<string, number>();
  mockCells.forEach((c) => {
    const match =
      (item.type === 'row' && c.rowId === item.rowId) ||
      (item.type === 'col' && c.colId === item.colId);
    if (!match) return;
    c.breakdown.forEach((b) => {
      bucket.set(b.name, (bucket.get(b.name) ?? 0) + b.value);
    });
  });
  return Array.from(bucket.entries())
    .map(([name, value]) => ({ name, value: Number(value.toFixed(1)) }))
    .sort((a, b) => b.value - a.value);
}

export function DrillModal(props: DrillModalProps): JSX.Element | null {
  const {
    item,
    onClose,
    rows,
    cols,
    cells,
    rowTotals,
    colTotals,
    thresholds,
    unitSuffix,
    decimals,
    drillQueryParams,
    mockMode,
  } = props;

  const summary = buildSummary(item, rows, cols, cells, rowTotals, colTotals);

  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchSeq = useRef(0);

  // Close button focus on mount + focus trap setup
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    if (mockMode) {
      setBreakdown(mockBreakdown(item));
      return;
    }
    if (!drillQueryParams) return;

    const mySeq = ++fetchSeq.current;
    setLoading(true);
    const scope: { rowId?: string; colId?: string } = {};
    if (item.type === 'cell' || item.type === 'row') scope.rowId = item.rowId;
    if (item.type === 'cell' || item.type === 'col') scope.colId = item.colId;

    fetchBreakdown(drillQueryParams, scope)
      .then((result) => {
        if (fetchSeq.current !== mySeq) return; // stale
        setBreakdown(result);
      })
      .finally(() => {
        if (fetchSeq.current !== mySeq) return;
        setLoading(false);
      });
  }, [item, drillQueryParams, mockMode]);

  if (!summary) return null;

  const status =
    item.type === 'cell'
      ? cellStatus(
          cells.get(`${item.rowId ?? ''}|${item.colId ?? ''}`),
          thresholds,
        )
      : item.type === 'row'
        ? totalsStatus(rowTotals.get(item.rowId ?? ''), thresholds)
        : totalsStatus(colTotals.get(item.colId ?? ''), thresholds);

  const dotColor = status === 'ok' ? 'var(--up)' : status === 'dn' ? 'var(--dn)' : status === 'wn' ? 'var(--wn)' : 'var(--g400)';
  const statusClass =
    status === 'ok' ? 'status-ok' : status === 'dn' ? 'status-dn' : status === 'wn' ? 'status-wn' : '';

  const maxValue = Math.max(1, ...breakdown.map((b) => Math.abs(b.value)));

  const eyebrow =
    item.type === 'cell' ? 'Разложение · Пересечение'
      : item.type === 'row' ? 'Разложение · Строка'
        : 'Разложение · Колонка';

  return (
    <ModalRoot
      className="show"
      role="dialog"
      aria-modal="true"
      aria-label={`${eyebrow}: ${summary.title}`}
      onClick={(e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <ModalBackdrop onClick={onClose} />
      <Modal>
        <ModalHead>
          <ModalTitle>
            <div className="m-eyebrow">{eyebrow}</div>
            <div className="m-h">
              <span className="dot" style={{ background: dotColor }} />
              {summary.title}
            </div>
          </ModalTitle>
          <ModalClose
            type="button"
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M3 3 L13 13 M13 3 L3 13" />
            </svg>
          </ModalClose>
        </ModalHead>
        <ModalBody>
          <DrillSummary>
            <div>
              <div className="s-l">Сумма</div>
              <div className="s-v">{formatRussianSmartEx(summary.totalFact, decimals, unitSuffix)}</div>
            </div>
            <div>
              <div className="s-l">% от знаменателя</div>
              <div className={`s-v ${statusClass}`}>
                {summary.pct != null ? formatRussianPercent(summary.pct, decimals) : '—'}
              </div>
            </div>
            <div>
              <div className="s-l">План</div>
              <div className="s-v">
                {summary.totalPlan != null
                  ? formatRussianSmartEx(summary.totalPlan, decimals, unitSuffix)
                  : '—'}
              </div>
            </div>
            <div>
              <div className="s-l">Статус</div>
              <div className={`s-v ${statusClass}`}>{STATUS_LABEL[status]}</div>
            </div>
          </DrillSummary>

          {summary.shops != null && (
            <DrillSectionTitle>
              Магазинов: {formatRussianInt(summary.shops)}
            </DrillSectionTitle>
          )}

          <DrillSectionTitle>Разложение по категориям</DrillSectionTitle>
          {loading && <div style={{ color: 'var(--g500)', fontSize: 12 }}>Загрузка…</div>}
          {!loading && breakdown.length === 0 && (
            <div style={{ color: 'var(--g500)', fontSize: 12 }}>
              {drillQueryParams?.breakdownCol
                ? 'Нет данных по детализации'
                : 'Укажите «Измерение детализации» в настройках чарта'}
            </div>
          )}
          {!loading && breakdown.length > 0 && (
            <DrillBars>
              {breakdown.map((b) => {
                const w = Math.round((Math.abs(b.value) / maxValue) * 100);
                const pctOfTotal =
                  summary.totalFact !== 0 ? (b.value / summary.totalFact) * 100 : 0;
                return (
                  <div className="dbf" key={b.name}>
                    <div className="dbf-l">{b.name}</div>
                    <div className="dbf-bar">
                      <div
                        className="dbf-bar-fill"
                        style={{ width: `${w}%`, background: dotColor }}
                      />
                    </div>
                    <div className="dbf-v">
                      {formatRussianSmartEx(b.value, decimals, unitSuffix)}
                      <span className="pct">{pctOfTotal.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </DrillBars>
          )}
        </ModalBody>
      </Modal>
    </ModalRoot>
  );
}
