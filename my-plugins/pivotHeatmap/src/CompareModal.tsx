import { useEffect, useRef, useState } from 'react';
import type {
  AxisItem,
  BreakdownRow,
  CellData,
  CompareItem,
  DrillQueryParams,
  TotalsSlice,
} from './types';
import {
  formatRussianDeltaPercent,
  formatRussianPercent,
  formatRussianSmartEx,
} from './utils/formatRussian';
import { fetchBreakdown } from './utils/drillApi';
import { buildMockCells } from './mocks/lossesPreset';
import {
  CmpTable,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalClose,
  ModalHead,
  ModalRoot,
  ModalTitle,
} from './styles';

interface CompareSide {
  title: string;
  fact: number;
  plan: number | null;
  pct: number | null;
  shops: number | null;
}

interface CompareModalProps {
  itemA: CompareItem;
  itemB: CompareItem;
  onClose: () => void;
  rows: AxisItem[];
  cols: AxisItem[];
  cells: Map<string, CellData>;
  rowTotals: Map<string, TotalsSlice>;
  colTotals: Map<string, TotalsSlice>;
  unitSuffix: string;
  decimals: number;
  drillQueryParams: DrillQueryParams | null;
  mockMode: boolean;
}

function buildSide(
  item: CompareItem,
  rows: AxisItem[],
  cols: AxisItem[],
  cells: Map<string, CellData>,
  rowTotals: Map<string, TotalsSlice>,
  colTotals: Map<string, TotalsSlice>,
): CompareSide | null {
  if (item.type === 'cell' && item.rowId && item.colId) {
    const cell = cells.get(`${item.rowId}|${item.colId}`);
    if (!cell) return null;
    const rowName = rows.find((r) => r.id === item.rowId)?.name ?? item.rowId;
    const colName = cols.find((c) => c.id === item.colId)?.name ?? item.colId;
    return {
      title: `${rowName} × ${colName}`,
      fact: cell.value,
      plan: cell.plan,
      pct: cell.pct,
      shops: cell.shops,
    };
  }
  if (item.type === 'row' && item.rowId) {
    const slice = rowTotals.get(item.rowId);
    if (!slice) return null;
    const rowName = rows.find((r) => r.id === item.rowId)?.name ?? item.rowId;
    return {
      title: rowName,
      fact: slice.fact,
      plan: slice.plan,
      pct: slice.pct,
      shops: null,
    };
  }
  if (item.type === 'col' && item.colId) {
    const slice = colTotals.get(item.colId);
    if (!slice) return null;
    const colName = cols.find((c) => c.id === item.colId)?.name ?? item.colId;
    return {
      title: colName,
      fact: slice.fact,
      plan: slice.plan,
      pct: slice.pct,
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

interface DeltaResult {
  cls: '' | 'up' | 'dn';
  text: string;
}

/** Delta between A and B — up/dn semantics expects losses (higher=worse). */
function pctDelta(va: number | null, vb: number | null): DeltaResult {
  if (va == null || vb == null || vb === 0) return { cls: '', text: '—' };
  const d = ((va - vb) / vb) * 100;
  const cls: DeltaResult['cls'] = d > 0.5 ? 'dn' : d < -0.5 ? 'up' : '';
  return { cls, text: formatRussianDeltaPercent(d, 1) };
}

export function CompareModal(props: CompareModalProps): JSX.Element | null {
  const {
    itemA,
    itemB,
    onClose,
    rows,
    cols,
    cells,
    rowTotals,
    colTotals,
    unitSuffix,
    decimals,
    drillQueryParams,
    mockMode,
  } = props;

  const sideA = buildSide(itemA, rows, cols, cells, rowTotals, colTotals);
  const sideB = buildSide(itemB, rows, cols, cells, rowTotals, colTotals);

  const [breakdownA, setBreakdownA] = useState<BreakdownRow[]>([]);
  const [breakdownB, setBreakdownB] = useState<BreakdownRow[]>([]);
  const fetchSeq = useRef(0);

  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    if (mockMode) {
      setBreakdownA(mockBreakdown(itemA));
      setBreakdownB(mockBreakdown(itemB));
      return;
    }
    if (!drillQueryParams) return;

    const mySeq = ++fetchSeq.current;
    const buildScope = (it: CompareItem): { rowId?: string; colId?: string } => {
      const scope: { rowId?: string; colId?: string } = {};
      if (it.type === 'cell' || it.type === 'row') scope.rowId = it.rowId;
      if (it.type === 'cell' || it.type === 'col') scope.colId = it.colId;
      return scope;
    };
    Promise.all([
      fetchBreakdown(drillQueryParams, buildScope(itemA)),
      fetchBreakdown(drillQueryParams, buildScope(itemB)),
    ]).then(([a, b]) => {
      if (fetchSeq.current !== mySeq) return;
      setBreakdownA(a);
      setBreakdownB(b);
    });
  }, [itemA, itemB, drillQueryParams, mockMode]);

  if (!sideA || !sideB) return null;

  const typeLabel =
    itemA.type === 'cell' ? 'Пересечения'
      : itemA.type === 'row' ? 'Строки'
        : 'Колонки';

  const fmtFact = (v: number | null): string =>
    v == null ? '—' : formatRussianSmartEx(v, decimals, unitSuffix);
  const fmtPct = (v: number | null): string =>
    v == null ? '—' : formatRussianPercent(v, decimals);

  const mainRows = [
    { label: 'Сумма', va: sideA.fact, vb: sideB.fact, fmt: fmtFact, delta: pctDelta(sideA.fact, sideB.fact) },
    { label: '%', va: sideA.pct, vb: sideB.pct, fmt: fmtPct, delta: pctDelta(sideA.pct, sideB.pct) },
    { label: 'План', va: sideA.plan, vb: sideB.plan, fmt: fmtFact, delta: pctDelta(sideA.plan, sideB.plan) },
    {
      label: 'Магазинов',
      va: sideA.shops,
      vb: sideB.shops,
      fmt: (v: number | null) => (v == null ? '—' : String(v)),
      delta: pctDelta(sideA.shops, sideB.shops),
    },
  ];

  // Merge breakdown categories across A and B
  const categories = Array.from(new Set([
    ...breakdownA.map((x) => x.name),
    ...breakdownB.map((x) => x.name),
  ]));
  const mapA = new Map(breakdownA.map((x) => [x.name, x.value]));
  const mapB = new Map(breakdownB.map((x) => [x.name, x.value]));

  const subRows = categories.map((name) => {
    const va = mapA.get(name) ?? 0;
    const vb = mapB.get(name) ?? 0;
    return { label: name, va, vb, fmt: fmtFact, delta: pctDelta(va, vb) };
  });

  return (
    <ModalRoot
      className="show"
      role="dialog"
      aria-modal="true"
      aria-label="Сравнение A vs B"
      onClick={(e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <ModalBackdrop onClick={onClose} />
      <Modal>
        <ModalHead>
          <ModalTitle>
            <div className="m-eyebrow">Сравнение · {typeLabel}</div>
            <div className="m-h">A vs B</div>
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
          <CmpTable>
            <thead>
              <tr>
                <th className="cmp-l" scope="col" />
                <th className="cmp-a" scope="col">
                  <div className="cmp-h-badge"><span className="dot" />A</div>
                  <div className="cmp-h-name">{sideA.title}</div>
                </th>
                <th className="cmp-b" scope="col">
                  <div className="cmp-h-badge"><span className="dot" />B</div>
                  <div className="cmp-h-name">{sideB.title}</div>
                </th>
                <th className="cmp-d" scope="col">Δ</th>
              </tr>
            </thead>
            <tbody>
              {mainRows.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="cmp-l">{r.label}</th>
                  <td className="cmp-a">{r.fmt(r.va as number)}</td>
                  <td className="cmp-b">{r.fmt(r.vb as number)}</td>
                  <td className={`cmp-d ${r.delta.cls}`}>{r.delta.text}</td>
                </tr>
              ))}
            </tbody>
            {subRows.length > 0 && (
              <tbody className="cmp-sub">
                <tr className="cmp-sub-title">
                  <td colSpan={4}>Разложение по категориям</td>
                </tr>
                {subRows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="cmp-l">{r.label}</th>
                    <td className="cmp-a">{r.fmt(r.va)}</td>
                    <td className="cmp-b">{r.fmt(r.vb)}</td>
                    <td className={`cmp-d ${r.delta.cls}`}>{r.delta.text}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </CmpTable>
        </ModalBody>
      </Modal>
    </ModalRoot>
  );
}
