import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AxisItem,
  CellData,
  CompareItem,
  HeatmapPivotProps,
  TotalsSlice,
  UnitMode,
} from './types';
import type { CellStatus } from './types';
import { cellStatus, STATUS_LABEL, totalsStatus } from './utils/thresholds';

/**
 * DS 2.0 §07 / WCAG 1.4.1: цвет ≠ единственный индикатор.
 * Иконка-символ в углу ячейки — второй канал кодирования статуса.
 */
function StatusIcon({ status }: { status: CellStatus }): JSX.Element | null {
  if (status === 'nd') return null;
  if (status === 'ok') {
    // ✓ Galочка — норма
    return (
      <svg className="status-icon" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1.5 4 L3.2 5.7 L6.5 2.3" />
      </svg>
    );
  }
  if (status === 'wn') {
    // △ Открытый треугольник — внимание
    return (
      <svg className="status-icon" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 1 L7 7 L1 7 Z" />
      </svg>
    );
  }
  // dn: ▲ Заполненный треугольник — превышение
  return (
    <svg className="status-icon" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
      <path d="M4 1 L7 7 L1 7 Z" />
    </svg>
  );
}
import {
  formatRussianInt,
  formatRussianPercent,
  formatRussianSmartEx,
} from './utils/formatRussian';
import {
  AxisDropdownGhost,
  AxisDropdownItem,
  AxisDropdownMenu,
  AxisDropdownPanel,
  AxisDropdownRoot,
  AxisDropdownTrigger,
  Breadcrumbs,
  BreadcrumbBack,
  BreadcrumbCurrent,
  BreadcrumbDot,
  BreadcrumbPlus,
  BreadcrumbSel,
  Card,
  Cell,
  Chip,
  ColProfile,
  Controls,
  Footer,
  Header,
  KEYFRAMES_CSS,
  MockBadge,
  Pivot,
  PivotWrap,
  ROOT_CLASS,
  Root,
  Scale,
  ScaleItem,
  SkeletonGrid,
  StateOverlay,
  Title,
  TitleBlock,
  Tooltip,
  Unit,
  UnitButton,
  PartialBadge,
  StaleBar,
} from './styles';
import { DrillModal } from './DrillModal';
import { CompareModal } from './CompareModal';
import { InfoHint, InfoHintTopRight } from './components/InfoHint';

type SortDir = 'asc' | 'desc';

function formatValue(
  cell: CellData | null | undefined,
  unit: UnitMode,
  suffix: string,
  decimals: number,
  auto: boolean,
): string {
  if (!cell) return '—';
  if (unit === 'pct') {
    if (cell.pct == null) return '—';
    return formatRussianPercent(cell.pct, decimals);
  }
  if (auto) return formatRussianSmartEx(cell.value, decimals, suffix);
  return `${cell.value.toFixed(decimals)}${suffix ? ` ${suffix}` : ''}`;
}

/**
 * Truncate long axis label to N chars, suffixing «…».
 * Returns the original string when maxChars <= 0 or label fits.
 * Single ellipsis char (…) keeps width tight inside cell.
 */
function truncateLabel(label: string, maxChars: number): string {
  if (!Number.isFinite(maxChars) || maxChars <= 0) return label;
  if (label.length <= maxChars) return label;
  if (maxChars <= 1) return '…';
  return `${label.slice(0, maxChars - 1).trimEnd()}…`;
}

function formatTotals(
  slice: TotalsSlice | null | undefined,
  unit: UnitMode,
  suffix: string,
  decimals: number,
  auto: boolean,
): string {
  if (!slice) return '—';
  if (unit === 'pct') {
    if (slice.pct == null) return '—';
    return formatRussianPercent(slice.pct, decimals);
  }
  if (auto) return formatRussianSmartEx(slice.fact, decimals, suffix);
  return `${slice.fact.toFixed(decimals)}${suffix ? ` ${suffix}` : ''}`;
}

interface TooltipState {
  show: boolean;
  x: number;
  y: number;
  title: string;
  status: 'ok' | 'wn' | 'dn';
  rows: Array<{ label: string; value: string; color?: string }>;
}

interface ProfileState {
  show: boolean;
  x: number;
  y: number;
  title: string;
  rows: Array<{ label: string; value: string; color?: string }>;
}

const INITIAL_TOOLTIP: TooltipState = {
  show: false,
  x: 0,
  y: 0,
  title: '',
  status: 'ok',
  rows: [],
};

const INITIAL_PROFILE: ProfileState = {
  show: false,
  x: 0,
  y: 0,
  title: '',
  rows: [],
};

export default function HeatmapPivot(props: HeatmapPivotProps): JSX.Element {
  const {
    width,
    height,
    rows: rowsRaw,
    cols: colsBase,
    cells: cellsBase,
    rowTotals: rowTotalsBase,
    colTotals: colTotalsBase,
    grandTotal: grandTotalBase,
    thresholds,
    defaultUnit,
    unitSuffix,
    decimals,
    autoFormatRussian,
    showTotalsDefault,
    headerText,
    headerSubtitle,
    emitFilter,
    setDataMask,
    drillQueryParams,
    mockMode,
    dataState,
    errorMessage,
    colAxisOptions,
    colLabelMaxChars,
    rowLabelMaxChars,
  } = props;

  // ── Axis switcher (mock-mode only) ──
  const [axisKey, setAxisKey] = useState<string>(
    () => colAxisOptions?.[0]?.key ?? 'division',
  );
  // Sync axisKey when options arrive/change
  useEffect(() => {
    if (colAxisOptions && colAxisOptions.length > 0) {
      const exists = colAxisOptions.some((o) => o.key === axisKey);
      if (!exists) setAxisKey(colAxisOptions[0].key);
    }
  }, [colAxisOptions, axisKey]);

  const activeAxis = useMemo(
    () => colAxisOptions?.find((o) => o.key === axisKey) ?? null,
    [colAxisOptions, axisKey],
  );

  // When axisKey changes, swap dataset slice. In non-mock mode use props directly.
  const cols: AxisItem[] = activeAxis ? activeAxis.cols : colsBase;
  const cells = activeAxis ? activeAxis.cells : cellsBase;
  const rowTotals = activeAxis ? activeAxis.rowTotals : rowTotalsBase;
  const colTotals = activeAxis ? activeAxis.colTotals : colTotalsBase;
  const grandTotal = activeAxis ? activeAxis.grandTotal : grandTotalBase;

  // Dropdown open state
  const [axisOpen, setAxisOpen] = useState(false);
  const axisRootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!axisOpen) return undefined;
    const onDown = (e: MouseEvent): void => {
      if (!axisRootRef.current) return;
      if (!axisRootRef.current.contains(e.target as Node)) setAxisOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setAxisOpen(false);
        e.stopPropagation();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [axisOpen]);

  const rowAxisColName = drillQueryParams?.rowAxisCol ?? '';
  const colAxisColName = drillQueryParams?.colAxisCol ?? '';

  // ── Local state ──
  const [unit, setUnit] = useState<UnitMode>(defaultUnit);
  const [showTotals, setShowTotals] = useState<boolean>(showTotalsDefault);
  const [sortColId, setSortColId] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Filters (one-shot semantics: any new selection clears the others)
  const [rowFilter, setRowFilter] = useState<string | null>(null);
  const [colFilter, setColFilter] = useState<string | null>(null);
  const [cellFilter, setCellFilter] = useState<{ rowId: string; colId: string } | null>(null);

  // Compare / Drill
  const [compareA, setCompareA] = useState<CompareItem | null>(null);
  const [compareB, setCompareB] = useState<CompareItem | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [drillTarget, setDrillTarget] = useState<CompareItem | null>(null);

  // Tooltip / popover
  const [tooltip, setTooltip] = useState<TooltipState>(INITIAL_TOOLTIP);
  const [profile, setProfile] = useState<ProfileState>(INITIAL_PROFILE);

  /* Theme: следим за html[data-theme] (Superset 6 ставит туда, не на body).
     Default 'light' — соответствует поведению Superset до явного переключения.
     Реагируем только на конкретные значения 'light'/'dark', чтобы не упасть
     в dark при отсутствии атрибута. */
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document === 'undefined') return 'light';
    const v = document.documentElement.getAttribute('data-theme');
    return v === 'dark' ? 'dark' : 'light';
  });
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const html = document.documentElement;
    const read = (): void => {
      const v = html.getAttribute('data-theme');
      if (v === 'dark' || v === 'light') setTheme(v);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // ── Derived: sorted rows ──
  const rows: AxisItem[] = useMemo(() => {
    if (!sortColId) return rowsRaw;
    const out = [...rowsRaw];
    out.sort((a, b) => {
      const ca = cells.get(`${a.id}|${sortColId}`);
      const cb = cells.get(`${b.id}|${sortColId}`);
      if (!ca && !cb) return 0;
      if (!ca) return 1;
      if (!cb) return -1;
      const va = unit === 'pct' ? (ca.pct ?? 0) : ca.value;
      const vb = unit === 'pct' ? (cb.pct ?? 0) : cb.value;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return out;
  }, [rowsRaw, sortColId, sortDir, unit, cells]);

  // ── Row/col hover highlight state ──
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<string | null>(null);

  // ── Cross-filter emission ──
  const emitMask = useCallback(
    (payload: Record<string, unknown> | null) => {
      if (!emitFilter || !setDataMask) return;
      if (!payload) {
        setDataMask({ extraFormData: { filters: [] }, filterState: { value: null } });
        return;
      }
      setDataMask(payload);
    },
    [emitFilter, setDataMask],
  );

  const applyCellCrossFilter = useCallback(
    (rowId: string, colId: string) => {
      if (!rowAxisColName || !colAxisColName) return;
      emitMask({
        extraFormData: {
          filters: [
            { col: rowAxisColName, op: 'IN', val: [rowId] },
            { col: colAxisColName, op: 'IN', val: [colId] },
          ],
        },
        filterState: {
          value: `${rowId}|${colId}`,
          selectedValues: [rowId, colId],
        },
      });
    },
    [emitMask, rowAxisColName, colAxisColName],
  );

  const applyAxisCrossFilter = useCallback(
    (axis: 'row' | 'col', value: string) => {
      const col = axis === 'row' ? rowAxisColName : colAxisColName;
      if (!col) return;
      emitMask({
        extraFormData: { filters: [{ col, op: 'IN', val: [value] }] },
        filterState: { value, selectedValues: [value] },
      });
    },
    [emitMask, rowAxisColName, colAxisColName],
  );

  // ── Actions ──
  const toggleSort = useCallback((colId: string) => {
    if (sortColId === colId) {
      if (sortDir === 'desc') setSortDir('asc');
      else {
        setSortColId(null);
        setSortDir('desc');
      }
    } else {
      setSortColId(colId);
      setSortDir('desc');
    }
  }, [sortColId, sortDir]);

  const addToCompare = useCallback(
    (item: CompareItem) => {
      const same = (x: CompareItem | null, y: CompareItem): boolean => {
        if (!x || x.type !== y.type) return false;
        if (y.type === 'cell') return x.rowId === y.rowId && x.colId === y.colId;
        if (y.type === 'row') return x.rowId === y.rowId;
        if (y.type === 'col') return x.colId === y.colId;
        return false;
      };

      if (compareA && compareA.type !== item.type) {
        setCompareA(item);
        setCompareB(null);
        return;
      }
      if (!compareA) {
        setCompareA(item);
        return;
      }
      if (same(compareA, item)) {
        setCompareA(compareB);
        setCompareB(null);
        return;
      }
      if (!compareB) {
        setCompareB(item);
        setCompareOpen(true);
        return;
      }
      if (same(compareB, item)) {
        setCompareB(null);
        return;
      }
      setCompareA(item);
      setCompareB(null);
    },
    [compareA, compareB],
  );

  const closeCompare = useCallback(() => {
    setCompareOpen(false);
    setCompareA(null);
    setCompareB(null);
  }, []);

  const clearAllFilters = useCallback(() => {
    setRowFilter(null);
    setColFilter(null);
    setCellFilter(null);
    emitMask(null);
  }, [emitMask]);

  // ── Click handlers ──
  const onCellClick = useCallback(
    (e: React.MouseEvent, row: AxisItem, col: AxisItem) => {
      const cell = cells.get(`${row.id}|${col.id}`);
      if (!cell) return;
      if (e.ctrlKey || e.metaKey) {
        setDrillTarget({ type: 'cell', rowId: row.id, colId: col.id });
        return;
      }
      if (e.shiftKey) {
        addToCompare({ type: 'cell', rowId: row.id, colId: col.id });
        return;
      }
      const same = cellFilter && cellFilter.rowId === row.id && cellFilter.colId === col.id;
      if (same) {
        setCellFilter(null);
        emitMask(null);
      } else {
        setCellFilter({ rowId: row.id, colId: col.id });
        setRowFilter(null);
        setColFilter(null);
        applyCellCrossFilter(row.id, col.id);
      }
    },
    [cells, cellFilter, addToCompare, applyCellCrossFilter, emitMask],
  );

  const onRowHeaderClick = useCallback(
    (e: React.MouseEvent, row: AxisItem) => {
      if (e.shiftKey) {
        addToCompare({ type: 'row', rowId: row.id });
        return;
      }
      if (rowFilter === row.id) {
        setRowFilter(null);
        emitMask(null);
      } else {
        setRowFilter(row.id);
        setColFilter(null);
        setCellFilter(null);
        applyAxisCrossFilter('row', row.id);
      }
    },
    [rowFilter, addToCompare, applyAxisCrossFilter, emitMask],
  );

  const onColHeaderClick = useCallback(
    (e: React.MouseEvent, col: AxisItem) => {
      if (e.shiftKey) {
        addToCompare({ type: 'col', colId: col.id });
        return;
      }
      toggleSort(col.id);
    },
    [toggleSort, addToCompare],
  );

  const onColHeaderDblClick = useCallback(
    (e: React.MouseEvent, col: AxisItem) => {
      e.preventDefault();
      if (colFilter === col.id) {
        setColFilter(null);
        emitMask(null);
      } else {
        setColFilter(col.id);
        setRowFilter(null);
        setCellFilter(null);
        applyAxisCrossFilter('col', col.id);
      }
    },
    [colFilter, applyAxisCrossFilter, emitMask],
  );

  // ── Tooltip / Popover positioning ──
  // DS 2.0 §08: «Offset: 8px от курсора»
  const positionNear = useCallback((x: number, y: number, pad = 8) => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const w = 260;
    const h = 180;
    let nx = x + pad;
    let ny = y + pad;
    if (nx + w > vw - 8) nx = x - w - pad;
    if (ny + h > vh - 8) ny = y - h - pad;
    return { x: nx, y: ny };
  }, []);

  const onCellEnter = useCallback(
    (e: React.MouseEvent, row: AxisItem, col: AxisItem) => {
      setHoverRow(row.id);
      setHoverCol(col.id);
      const cell = cells.get(`${row.id}|${col.id}`);
      if (!cell) return;
      const st = cellStatus(cell, thresholds);
      if (st === 'nd') return;
      const pos = positionNear(e.clientX, e.clientY);
      const rows: TooltipState['rows'] = [
        { label: 'Факт', value: formatRussianSmartEx(cell.value, decimals, unitSuffix) },
      ];
      if (cell.pct != null) {
        rows.push({ label: '% от знаменателя', value: formatRussianPercent(cell.pct, decimals) });
      }
      if (cell.planPct != null) {
        rows.push({ label: 'План, %', value: formatRussianPercent(cell.planPct, decimals) });
      }
      rows.push({ label: 'Статус', value: STATUS_LABEL[st] });
      if (cell.shops != null) {
        rows.push({ label: 'Магазинов', value: formatRussianInt(cell.shops) });
      }
      setTooltip({
        show: true,
        x: pos.x,
        y: pos.y,
        title: `${row.name} · ${col.name}`,
        status: st as 'ok' | 'wn' | 'dn',
        rows,
      });
    },
    [cells, thresholds, decimals, unitSuffix, positionNear],
  );

  const onCellMove = useCallback(
    (e: React.MouseEvent) => {
      setTooltip((t) => {
        if (!t.show) return t;
        const pos = positionNear(e.clientX, e.clientY);
        return { ...t, x: pos.x, y: pos.y };
      });
    },
    [positionNear],
  );

  const onCellLeave = useCallback(() => {
    setHoverRow(null);
    setHoverCol(null);
    setTooltip(INITIAL_TOOLTIP);
  }, []);

  // Col header hover = column profile
  const onColHeaderEnter = useCallback(
    (e: React.MouseEvent, col: AxisItem) => {
      const prof = colTotals.get(col.id);
      if (!prof || prof.fact === 0) return;
      const pos = positionNear(e.clientX, e.clientY, 14);
      const rows: ProfileState['rows'] = [
        { label: 'Сумма', value: formatRussianSmartEx(prof.fact, decimals, unitSuffix) },
      ];
      if (prof.pct != null) {
        rows.push({ label: '% от знаменателя', value: formatRussianPercent(prof.pct, decimals) });
      }
      if (prof.ratio != null) {
        const st = totalsStatus(prof, thresholds);
        rows.push({
          label: 'Ratio факт/план',
          value: prof.ratio.toFixed(2),
          color: st === 'ok' ? 'var(--up)' : st === 'dn' ? 'var(--dn)' : st === 'wn' ? 'var(--wn)' : undefined,
        });
      }
      setProfile({ show: true, x: pos.x, y: pos.y, title: col.name, rows });
    },
    [colTotals, decimals, unitSuffix, thresholds, positionNear],
  );

  const onRowHeaderEnter = useCallback(
    (e: React.MouseEvent, row: AxisItem) => {
      const prof = rowTotals.get(row.id);
      if (!prof || prof.fact === 0) return;
      const pos = positionNear(e.clientX, e.clientY, 14);
      const rows: ProfileState['rows'] = [
        { label: 'Сумма', value: formatRussianSmartEx(prof.fact, decimals, unitSuffix) },
      ];
      if (prof.pct != null) {
        rows.push({ label: '% от знаменателя', value: formatRussianPercent(prof.pct, decimals) });
      }
      if (prof.ratio != null) {
        const st = totalsStatus(prof, thresholds);
        rows.push({
          label: 'Ratio факт/план',
          value: prof.ratio.toFixed(2),
          color: st === 'ok' ? 'var(--up)' : st === 'dn' ? 'var(--dn)' : st === 'wn' ? 'var(--wn)' : undefined,
        });
      }
      setProfile({ show: true, x: pos.x, y: pos.y, title: row.name, rows });
    },
    [rowTotals, decimals, unitSuffix, thresholds, positionNear],
  );

  const onHeaderLeave = useCallback(() => {
    setProfile(INITIAL_PROFILE);
  }, []);

  const onHeaderMove = useCallback(
    (e: React.MouseEvent) => {
      setProfile((p) => {
        if (!p.show) return p;
        const pos = positionNear(e.clientX, e.clientY, 14);
        return { ...p, x: pos.x, y: pos.y };
      });
    },
    [positionNear],
  );

  // ── Escape key cascade: modal → compare → filter ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (drillTarget) {
        setDrillTarget(null);
        return;
      }
      if (compareOpen) {
        closeCompare();
        return;
      }
      if (compareA || compareB) {
        setCompareA(null);
        setCompareB(null);
        return;
      }
      if (rowFilter || colFilter || cellFilter) {
        clearAllFilters();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drillTarget, compareOpen, compareA, compareB, rowFilter, colFilter, cellFilter, clearAllFilters, closeCompare]);

  // ── Breadcrumbs ──
  const breadcrumbChips: string[] = [];
  if (rowFilter) {
    const r = rowsRaw.find((x) => x.id === rowFilter);
    if (r) breadcrumbChips.push(r.name);
  }
  if (colFilter) {
    const c = cols.find((x) => x.id === colFilter);
    if (c) breadcrumbChips.push(c.name);
  }
  if (cellFilter) {
    const r = rowsRaw.find((x) => x.id === cellFilter.rowId);
    const c = cols.find((x) => x.id === cellFilter.colId);
    if (r && c) breadcrumbChips.push(`${r.name} × ${c.name}`);
  }

  // ── Early returns for non-populated states ──
  if (dataState === 'loading') {
    /* DS 2.0 §08: aria-busy="true" + skeleton */
    return (
      <Root
        data-theme={theme}
        className={ROOT_CLASS}
        width={width}
        height={height}
        aria-busy="true"
        aria-live="polite"
      >
        <style>{KEYFRAMES_CSS}</style>
        <Card data-no-anim="">
          <Header>
            <TitleBlock>
              <Title>
                {headerText}
                {mockMode && <MockBadge>ТЕСТ</MockBadge>}
              </Title>
            </TitleBlock>
          </Header>
          <SkeletonGrid>
            <div className="sk hdr" />
            <div className="sk hdr" /><div className="sk hdr" /><div className="sk hdr" /><div className="sk hdr" /><div className="sk hdr" />
            {Array.from({ length: 25 }).map((_, i) => <div key={i} className="sk" />)}
          </SkeletonGrid>
        </Card>
      </Root>
    );
  }

  if (dataState === 'error') {
    return (
      <Root data-theme={theme} className={ROOT_CLASS} width={width} height={height}>
        <style>{KEYFRAMES_CSS}</style>
        <Card data-no-anim="">
          <StateOverlay role="alert">
            {errorMessage ?? 'Произошла ошибка при загрузке данных'}
          </StateOverlay>
        </Card>
      </Root>
    );
  }

  if (dataState === 'empty' && cells.size === 0) {
    return (
      <Root data-theme={theme} className={ROOT_CLASS} width={width} height={height}>
        <style>{KEYFRAMES_CSS}</style>
        <Card data-no-anim="">
          <Header>
            <TitleBlock>
              <Title>
                {headerText}
                {mockMode && <MockBadge>ТЕСТ</MockBadge>}
              </Title>
            </TitleBlock>
          </Header>
          <StateOverlay>{errorMessage ?? 'Нет данных за выбранный период'}</StateOverlay>
        </Card>
      </Root>
    );
  }

  // ── Render ──
  const isPartial = dataState === 'partial';
  const isStale = dataState === 'stale';
  return (
    <Root data-theme={theme} className={ROOT_CLASS} width={width} height={height}>
      <style>{KEYFRAMES_CSS}</style>
      <Card style={{ position: 'relative' }} data-info-hint-container="">
        {isStale && <StaleBar aria-hidden="true" />}
        <Header>
          <TitleBlock>
            <Title>
              {headerText}
              {mockMode && <MockBadge>ТЕСТ</MockBadge>}
            </Title>
            {isPartial && (
              <PartialBadge title="Часть данных недоступна">Частично</PartialBadge>
            )}
            <Breadcrumbs role="navigation" aria-label="Контекст фильтров">
              <BreadcrumbCurrent>{headerSubtitle}</BreadcrumbCurrent>
              {breadcrumbChips.length > 0 && (
                <>
                  <BreadcrumbDot>·</BreadcrumbDot>
                  <BreadcrumbCurrent>Фильтр:</BreadcrumbCurrent>
                  {breadcrumbChips.map((chip, i) => (
                    <span key={chip}>
                      <BreadcrumbSel>{chip}</BreadcrumbSel>
                      {i < breadcrumbChips.length - 1 && (
                        <BreadcrumbPlus>+</BreadcrumbPlus>
                      )}
                    </span>
                  ))}
                  <BreadcrumbBack
                    type="button"
                    onClick={clearAllFilters}
                    aria-label="Снять все фильтры"
                    title="Снять (Esc)"
                  >
                    ×
                  </BreadcrumbBack>
                </>
              )}
            </Breadcrumbs>
          </TitleBlock>
          <Controls>
            {colAxisOptions && colAxisOptions.length > 1 && activeAxis && (
              <AxisDropdownRoot ref={axisRootRef}>
                <AxisDropdownGhost aria-hidden="true">
                  {colAxisOptions.reduce(
                    (longest, o) => (o.label.length > longest.length ? o.label : longest),
                    '',
                  )}
                </AxisDropdownGhost>
                <AxisDropdownPanel open={axisOpen} data-open={axisOpen}>
                  <AxisDropdownTrigger
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={axisOpen}
                    aria-label="Группировка колонок"
                    onClick={() => setAxisOpen((v) => !v)}
                  >
                    {activeAxis.label}
                  </AxisDropdownTrigger>
                  {axisOpen && (
                    <AxisDropdownMenu role="listbox" aria-label="Группировка колонок">
                      {colAxisOptions.map((opt) => (
                        <AxisDropdownItem
                          key={opt.key}
                          type="button"
                          role="option"
                          active={opt.key === axisKey}
                          aria-selected={opt.key === axisKey}
                          onClick={() => {
                            setAxisKey(opt.key);
                            setAxisOpen(false);
                          }}
                        >
                          {opt.label}
                        </AxisDropdownItem>
                      ))}
                    </AxisDropdownMenu>
                  )}
                </AxisDropdownPanel>
              </AxisDropdownRoot>
            )}
            <Unit role="tablist" aria-label="Единицы измерения">
              <UnitButton
                type="button"
                on={unit === 'abs'}
                onClick={() => setUnit('abs')}
                aria-pressed={unit === 'abs'}
                title="Абсолютное значение"
              >
                {unitSuffix.includes('₽') ? '₽' : 'Σ'}
              </UnitButton>
              <UnitButton
                type="button"
                on={unit === 'pct'}
                onClick={() => setUnit('pct')}
                aria-pressed={unit === 'pct'}
                title="Процент"
              >
                %
              </UnitButton>
            </Unit>
            <Chip
              type="button"
              on={showTotals}
              onClick={() => setShowTotals((v) => !v)}
              aria-pressed={showTotals}
              aria-label="Показать строку и колонку итогов"
              title="Показать строку и колонку итогов"
            >
              <span className="sigma" aria-hidden="true">Σ</span>
            </Chip>
            <InfoHintTopRight>
              <InfoHint ariaLabel="Подсказка по управлению">
                <span className="hi"><kbd>клик</kbd> — фильтр</span>
                <span className="hi-sep" aria-hidden="true" />
                <span className="hi"><kbd>Ctrl</kbd>+<kbd>клик</kbd> — разложение</span>
                <span className="hi-sep" aria-hidden="true" />
                <span className="hi"><kbd>⇧</kbd> <kbd>клик</kbd> — сравнить</span>
                <span className="hi-sep" aria-hidden="true" />
                <span className="hi"><kbd>Right Click</kbd> — меню действий</span>
              </InfoHint>
            </InfoHintTopRight>
          </Controls>
        </Header>

        <PivotWrap>
          <Pivot role="grid" aria-label={headerText}>
            <thead>
              <tr>
                <th className="corner" scope="col" aria-label="Формат" />
                {cols.map((col) => {
                  const sorted = col.id === sortColId;
                  const arrow = sorted ? (sortDir === 'desc' ? '▾' : '▴') : '';
                  const className = [
                    sorted ? 'sorted' : '',
                    col.id === colFilter ? 'filtered' : '',
                    col.id === hoverCol && !showTotals ? 'col-hl' : '',
                  ].filter(Boolean).join(' ');
                  const shortLabel = truncateLabel(col.name, colLabelMaxChars);
                  const wasTruncated = shortLabel !== col.name;
                  return (
                    <th
                      key={col.id}
                      scope="col"
                      className={className}
                      onClick={(e) => onColHeaderClick(e, col)}
                      onDoubleClick={(e) => onColHeaderDblClick(e, col)}
                      onMouseEnter={(e) => onColHeaderEnter(e, col)}
                      onMouseLeave={onHeaderLeave}
                      onMouseMove={onHeaderMove}
                      tabIndex={0}
                      /* Native title убран — дублирует наш custom tooltip с
                         данными. Full name на truncated header читается в
                         основном tooltip при hover на ячейку. */
                      aria-label={col.name}
                    >
                      {shortLabel}
                      {arrow && <span className="sort-arrow">{arrow}</span>}
                    </th>
                  );
                })}
                {showTotals && (
                  <th className="totals-col" scope="col" aria-label="Итого">Итого</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => {
                const rowHl = hoverRow === row.id;
                return (
                  <tr key={row.id} className={rowHl ? 'row-hl' : ''}>
                    {(() => {
                      const shortRowLabel = truncateLabel(row.name, rowLabelMaxChars);
                      const rowTruncated = shortRowLabel !== row.name;
                      return (
                        <th
                          scope="row"
                          className={row.id === rowFilter ? 'filtered' : ''}
                          onClick={(e) => onRowHeaderClick(e, row)}
                          onMouseEnter={(e) => onRowHeaderEnter(e, row)}
                          onMouseLeave={onHeaderLeave}
                          onMouseMove={onHeaderMove}
                          tabIndex={0}
                          aria-label={row.name}
                        >
                          {shortRowLabel}
                        </th>
                      );
                    })()}
                    {cols.map((col, colIdx) => {
                      const cell = cells.get(`${row.id}|${col.id}`);
                      const st = cellStatus(cell, thresholds);
                      const isCellFiltered = cellFilter
                        && cellFilter.rowId === row.id
                        && cellFilter.colId === col.id;
                      const matchesFilter =
                        (rowFilter == null || row.id === rowFilter) &&
                        (colFilter == null || col.id === colFilter) &&
                        (cellFilter == null || isCellFiltered);
                      const dimmed = !matchesFilter;
                      const isCmpA = compareA?.type === 'cell'
                        && compareA.rowId === row.id
                        && compareA.colId === col.id;
                      const isCmpB = compareB?.type === 'cell'
                        && compareB.rowId === row.id
                        && compareB.colId === col.id;
                      const cellCls = [
                        st,
                        isCmpA ? 'cmp-a' : '',
                        isCmpB ? 'cmp-b' : '',
                        isCellFiltered ? 'cell-filt' : '',
                        dimmed ? 'dimmed' : '',
                      ].filter(Boolean).join(' ');
                      const colHl = hoverCol === col.id && !showTotals;
                      return (
                        <td
                          key={col.id}
                          className={colHl ? 'col-hl' : ''}
                          /* CSS vars для diagonal cascade анимации Cell:
                             animation-delay = (row * 40ms) + (col * 25ms).
                             Sweep сверху-слева вниз-направо. */
                          style={{
                            ['--row' as string]: rowIdx,
                            ['--col' as string]: colIdx,
                          } as React.CSSProperties}
                          onClick={(e) => onCellClick(e, row, col)}
                          onMouseEnter={(e) => onCellEnter(e, row, col)}
                          onMouseMove={onCellMove}
                          onMouseLeave={onCellLeave}
                          onMouseDown={(e) => { if (e.shiftKey) e.preventDefault(); }}
                        >
                          <Cell
                            className={cellCls}
                            aria-label={
                              cell
                                ? `${row.name} × ${col.name}: ${STATUS_LABEL[st]}`
                                : `${row.name} × ${col.name}: нет данных`
                            }
                          >
                            <StatusIcon status={st} />
                            {formatValue(cell, unit, unitSuffix, decimals, autoFormatRussian)}
                          </Cell>
                        </td>
                      );
                    })}
                    {showTotals && (() => {
                      const rtSt = totalsStatus(rowTotals.get(row.id), thresholds);
                      return (
                        <td className="totals-col">
                          <Cell className={rtSt} aria-label={`Итого по строке: ${STATUS_LABEL[rtSt]}`}>
                            <StatusIcon status={rtSt} />
                            {formatTotals(rowTotals.get(row.id), unit, unitSuffix, decimals, autoFormatRussian)}
                          </Cell>
                        </td>
                      );
                    })()}
                  </tr>
                );
              })}
              {showTotals && (
                <tr className="totals-row">
                  <th scope="row">Итого</th>
                  {cols.map((col) => {
                    const ctSt = totalsStatus(colTotals.get(col.id), thresholds);
                    return (
                      <td key={col.id}>
                        <Cell className={ctSt} aria-label={`Итого по колонке ${col.name}: ${STATUS_LABEL[ctSt]}`}>
                          <StatusIcon status={ctSt} />
                          {formatTotals(colTotals.get(col.id), unit, unitSuffix, decimals, autoFormatRussian)}
                        </Cell>
                      </td>
                    );
                  })}
                  {(() => {
                    const gSt = totalsStatus(grandTotal, thresholds);
                    return (
                      <td className="totals-col">
                        <Cell className={gSt} aria-label={`Общий итог: ${STATUS_LABEL[gSt]}`}>
                          <StatusIcon status={gSt} />
                          {formatTotals(grandTotal, unit, unitSuffix, decimals, autoFormatRussian)}
                        </Cell>
                      </td>
                    );
                  })()}
                </tr>
              )}
            </tbody>
          </Pivot>
        </PivotWrap>

        <Footer>
          <Scale aria-label="Шкала порогов">
            <ScaleItem className="ok"><span className="sw" aria-hidden="true" /><span className="label">{STATUS_LABEL.ok} · ratio ≤ {thresholds.ok}</span></ScaleItem>
            <ScaleItem className="wn"><span className="sw" aria-hidden="true" /><span className="label">{STATUS_LABEL.wn} · до {thresholds.wn}</span></ScaleItem>
            <ScaleItem className="dn"><span className="sw" aria-hidden="true" /><span className="label">{STATUS_LABEL.dn} · выше {thresholds.wn}</span></ScaleItem>
            <ScaleItem className="nd"><span className="sw" aria-hidden="true" /><span className="label">{STATUS_LABEL.nd}</span></ScaleItem>
          </Scale>
        </Footer>
      </Card>

      {/* Tooltip */}
      <Tooltip
        className={tooltip.show ? 'show' : ''}
        style={{ left: tooltip.x, top: tooltip.y }}
        role="tooltip"
        aria-hidden={!tooltip.show}
      >
        <div className="tt-title">
          <span
            className="dot"
            style={{
              background: tooltip.status === 'ok'
                ? 'var(--up)'
                : tooltip.status === 'dn' ? 'var(--dn)' : 'var(--wn)',
            }}
          />
          {tooltip.title}
        </div>
        {tooltip.rows.map((r) => (
          <div className="tt-row" key={r.label}>
            <span>{r.label}</span>
            <b style={r.color ? { color: r.color } : undefined}>{r.value}</b>
          </div>
        ))}
      </Tooltip>

      {/* Column/row popover */}
      <ColProfile
        className={profile.show ? 'show' : ''}
        style={{ left: profile.x, top: profile.y }}
        role="tooltip"
        aria-hidden={!profile.show}
      >
        <div className="cp-t">{profile.title}</div>
        {profile.rows.map((r) => (
          <div className="cp-r" key={r.label}>
            <span>{r.label}</span>
            <b style={r.color ? { color: r.color } : undefined}>{r.value}</b>
          </div>
        ))}
      </ColProfile>

      {/* Drill modal */}
      {drillTarget && (
        <DrillModal
          item={drillTarget}
          onClose={() => setDrillTarget(null)}
          rows={rowsRaw}
          cols={cols}
          cells={cells}
          rowTotals={rowTotals}
          colTotals={colTotals}
          thresholds={thresholds}
          unitSuffix={unitSuffix}
          decimals={decimals}
          drillQueryParams={drillQueryParams}
          mockMode={mockMode}
        />
      )}

      {/* Compare modal */}
      {compareOpen && compareA && compareB && (
        <CompareModal
          itemA={compareA}
          itemB={compareB}
          onClose={closeCompare}
          rows={rowsRaw}
          cols={cols}
          cells={cells}
          rowTotals={rowTotals}
          colTotals={colTotals}
          unitSuffix={unitSuffix}
          decimals={decimals}
          drillQueryParams={drillQueryParams}
          mockMode={mockMode}
        />
      )}
    </Root>
  );
}
