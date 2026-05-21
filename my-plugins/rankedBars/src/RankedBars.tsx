import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  RankedBarsProps,
  RankedRow,
  SortMode,
  UnitMode,
} from './types';
import {
  CardHead,
  CardRoot,
  CardSub,
  CardTitle,
  Controls,
  MockBadge,
  OpenAllBtn,
  OpenAllToolbar,
  RankList,
  SkeletonRow,
  StaleBar,
  StateWrap,
  TitleBlock,
} from './styles';
import RankRow from './components/RankRow';
import SortDropdown from './components/SortDropdown';
import UnitToggle from './components/UnitToggle';
import Tooltip, { TooltipPayload } from './components/Tooltip';
import { fmtRub } from './utils/formatRussian';
import DetailModal from './components/DetailModal';
import AllItemsModal from './components/AllItemsModal';
import { buildTooltipContent } from './components/tooltipContent';
import { InfoHint, InfoHintTopRight } from './components/InfoHint';

// ── Sorting helpers ─────────────────────────────────────────────────────────
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

/**
 * Derive a human-readable subtitle prefix for the current sort mode.
 * Matches the phrasing used throughout DS 2.0 prototypes.
 */
function subtitleForSort(sortBy: SortMode, userPrefix: string): string {
  switch (sortBy) {
    case 'delta':
      return 'Топ по дельте';
    case 'share':
      return 'Топ по доле';
    case 'sum':
    default:
      return userPrefix || 'Топ по сумме';
  }
}

// ── Cross-filter plumbing ───────────────────────────────────────────────────
function applyFilter(
  props: RankedBarsProps,
  groupbyCol: string,
  nextIds: string[],
): void {
  const setDataMask = props.setDataMask;
  if (!setDataMask) return;
  if (nextIds.length === 0) {
    setDataMask({
      filterState: { value: null, selectedValues: null },
      extraFormData: { filters: [] },
    });
    return;
  }
  setDataMask({
    filterState: { value: nextIds, selectedValues: nextIds },
    extraFormData: {
      filters: [{ col: groupbyCol, op: 'IN', val: nextIds }],
    },
  });
}

// ── Main component ─────────────────────────────────────────────────────────
const RankedBars: React.FC<RankedBarsProps> = props => {
  const {
    dataState,
    errorMessage,
    rows,
    totalSum,
    headerText,
    headerSubtitlePrefix,
    showTotalInHeader,
    showSparkline,
    showGhostPrevBar,
    showHoverTooltip,
    invertDeltaGood,
    defaultSort,
    defaultUnit,
    topNVisible,
    unitSuffixRub,
    decimalsValue,
    decimalsDelta,
    decimalsShare,
    enableDrillModal,
    enableAllItemsModal,
    enableCrossFilter,
    hasPrevMetric,
    drillQueryParams,
    filterState,
    isMockMode,
    themeMode: themeFromProps,
  } = props;

  /* Superset runtime может переключить тему без re-mount чарта (ChartProps
     theme prop приходит stale). Следим за html[data-theme] напрямую через
     MutationObserver — это работает и при HMR, и при ручном toggle темы. */
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') return themeFromProps;
    const t = document.documentElement.getAttribute('data-theme');
    return t === 'dark' ? 'dark' : t === 'light' ? 'light' : themeFromProps;
  });
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const html = document.documentElement;
    const read = (): void => {
      const t = html.getAttribute('data-theme');
      if (t === 'dark' || t === 'light') setEffectiveTheme(t);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  const themeMode = effectiveTheme;

  // ── Local state ─────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<SortMode>(defaultSort);
  const [unit, setUnit] = useState<UnitMode>(defaultUnit);
  const [drillRow, setDrillRow] = useState<RankedRow | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipPayload | null>(null);
  /* Mock cross-filter: local state вместо filterState из props (которого в
     моке нет). Используется только когда isMockMode. */
  const [mockActiveIds, setMockActiveIds] = useState<Set<string>>(new Set());

  // Keep state in sync with controlPanel defaults if they change.
  useEffect(() => {
    setSortBy(defaultSort);
  }, [defaultSort]);
  useEffect(() => {
    setUnit(defaultUnit);
  }, [defaultUnit]);

  // ── Derived data ────────────────────────────────────────────────────────
  const sortedAll = useMemo(() => sortRows(rows, sortBy), [rows, sortBy]);
  const visible = useMemo(
    () => sortedAll.slice(0, topNVisible),
    [sortedAll, topNVisible],
  );

  /**
   * Bar scale: in rub mode we include previous-period values so the ghost bar
   * never overflows the track when `valuePrev > value`. In pct mode we include
   * `sharePrevPct` for the same reason. Only values from the dataset are used
   * — the caller's `topNVisible` window is ignored (all rows share one scale).
   */
  const maxValue = useMemo(() => {
    if (visible.length === 0) return 0;
    if (unit === 'rub') {
      return rows.reduce(
        (m, r) => Math.max(m, r.value, r.valuePrev ?? 0),
        0,
      );
    }
    return rows.reduce(
      (m, r) => Math.max(m, r.sharePct, r.sharePrevPct ?? 0),
      0,
    );
  }, [rows, visible.length, unit]);

  const activeIds = useMemo<Set<string>>(() => {
    if (isMockMode) return mockActiveIds;
    const raw = filterState?.value;
    if (Array.isArray(raw)) return new Set(raw.map(String));
    return new Set();
  }, [isMockMode, mockActiveIds, filterState]);

  const hasFilter = activeIds.size > 0;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleRowClick = useCallback(
    (row: RankedRow, modKey: boolean) => {
      if (modKey) {
        if (enableDrillModal) {
          setDrillRow(row);
          setTooltip(null);
        }
        return;
      }
      if (!enableCrossFilter) return;
      const next = new Set(activeIds);
      if (next.has(row.id)) {
        next.delete(row.id);
      } else {
        next.add(row.id);
      }
      if (isMockMode) {
        setMockActiveIds(next);
        return;
      }
      if (!drillQueryParams) return;
      applyFilter(props, drillQueryParams.groupbyCol, Array.from(next));
    },
    [
      activeIds,
      drillQueryParams,
      enableCrossFilter,
      enableDrillModal,
      isMockMode,
      props,
    ],
  );

  const hoverRowRef = useRef<string | null>(null);

  const handleHoverStart = useCallback(
    (row: RankedRow, evt: React.MouseEvent) => {
      if (!showHoverTooltip) return;
      hoverRowRef.current = row.id;
      setTooltip({
        element: buildTooltipContent(row, {
          invertDeltaGood,
          decimalsValue,
          decimalsDelta,
          decimalsShare,
          unitSuffixRub,
        }),
        clientX: evt.clientX,
        clientY: evt.clientY,
        themeMode,
      });
    },
    [
      decimalsDelta,
      decimalsShare,
      decimalsValue,
      invertDeltaGood,
      showHoverTooltip,
      themeMode,
      unitSuffixRub,
    ],
  );

  const handleHoverMove = useCallback((evt: React.MouseEvent) => {
    setTooltip(prev =>
      prev
        ? {
            ...prev,
            clientX: evt.clientX,
            clientY: evt.clientY,
          }
        : prev,
    );
  }, []);

  const handleHoverEnd = useCallback(() => {
    hoverRowRef.current = null;
    setTooltip(null);
  }, []);

  const handleCloseDetail = useCallback(() => setDrillRow(null), []);
  const handleCloseAll = useCallback(() => setAllOpen(false), []);

  // Close modals on Escape (priority: detail > all)
  useEffect(() => {
    if (!drillRow && !allOpen) return undefined;
    function handleKey(evt: KeyboardEvent): void {
      if (evt.key !== 'Escape') return;
      if (drillRow) {
        setDrillRow(null);
      } else if (allOpen) {
        setAllOpen(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [drillRow, allOpen]);

  // ── Header subtitle ─────────────────────────────────────────────────────
  const subtitleBits: React.ReactNode[] = [];
  const dynamicPrefix = subtitleForSort(sortBy, headerSubtitlePrefix);
  if (dynamicPrefix) {
    subtitleBits.push(<span key="prefix">{dynamicPrefix}</span>);
  }
  if (showTotalInHeader && totalSum > 0) {
    if (subtitleBits.length > 0) {
      subtitleBits.push(<span key="dot1" className="dot" />);
    }
    const totalParts = fmtRub(totalSum, decimalsValue, unitSuffixRub);
    subtitleBits.push(
      <span key="total" className="total">
        {totalParts.number}
        {totalParts.unit}
      </span>,
    );
  }
  if (dataState === 'partial' && rows.length > 0) {
    if (subtitleBits.length > 0) {
      subtitleBits.push(<span key="dot2" className="dot" />);
    }
    subtitleBits.push(
      <span key="partial" className="badge-partial" role="status">
        неполные данные
      </span>,
    );
  }

  // ── Render states ───────────────────────────────────────────────────────
  const renderBody = (): React.ReactNode => {
    if (dataState === 'loading') {
      return (
        <RankList $hasFilter={false} role="list" aria-busy="true">
          {Array.from({ length: topNVisible }).map((_, i) => (
            <SkeletonRow key={i}>
              <span className="icon" />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </SkeletonRow>
          ))}
        </RankList>
      );
    }
    if (dataState === 'error') {
      return (
        <StateWrap role="alert">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="16" cy="16" r="12" />
            <path d="M16 10 L16 17" />
            <path d="M16 21 L16 22" />
          </svg>
          <div>{errorMessage || 'Ошибка загрузки данных'}</div>
        </StateWrap>
      );
    }
    if (dataState === 'empty' || visible.length === 0) {
      return (
        <StateWrap>
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <rect x="4" y="4" width="24" height="24" rx="3" />
            <path d="M10 16 L22 16" />
          </svg>
          <div>{errorMessage || 'Нет данных за выбранный период'}</div>
        </StateWrap>
      );
    }
    return (
      <RankList $hasFilter={hasFilter} role="list">
        {visible.map((row, idx) => (
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
            onClick={handleRowClick}
            onHoverStart={handleHoverStart}
            onHoverMove={handleHoverMove}
            onHoverEnd={handleHoverEnd}
          />
        ))}
      </RankList>
    );
  };

  const totalRowsCount = rows.length;

  // DS 2.0 canonical: loading имеет свой раздельный return со своим CardRoot.
  // При переходе loading → loaded React unmount'ит loading-CardRoot и mount'ит
  // новый → cardInKf animation запускается ровно когда юзер видит контент.
  if (dataState === 'loading') {
    return (
      <CardRoot
        data-theme={themeMode}
        role="region"
        aria-labelledby="rb-card-title"
        aria-busy="true"
        data-no-anim=""
      >
        <CardHead>
          <TitleBlock>
            <CardTitle id="rb-card-title">
            {headerText}
            {isMockMode && (
              <>
                {' '}
                <MockBadge>ТЕСТ</MockBadge>
              </>
            )}
          </CardTitle>
          </TitleBlock>
        </CardHead>
        <RankList $hasFilter={false} role="list" aria-busy="true">
          {Array.from({ length: topNVisible }).map((_, i) => (
            <SkeletonRow key={i}>
              <span className="icon" />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </SkeletonRow>
          ))}
        </RankList>
      </CardRoot>
    );
  }

  return (
    <CardRoot
      data-theme={themeMode}
      role="region"
      aria-labelledby="rb-card-title"
      data-info-hint-container=""
    >
      {dataState === 'stale' && <StaleBar aria-hidden="true" />}
      <CardHead>
        <TitleBlock>
          <CardTitle id="rb-card-title">
            {headerText}
            {isMockMode && (
              <>
                {' '}
                <MockBadge>ТЕСТ</MockBadge>
              </>
            )}
          </CardTitle>
          {subtitleBits.length > 0 && <CardSub>{subtitleBits}</CardSub>}
        </TitleBlock>
        <Controls>
          <SortDropdown
            value={sortBy}
            onChange={setSortBy}
            deltaDisabled={!hasPrevMetric}
          />
          {enableAllItemsModal && totalRowsCount > topNVisible && (
            <OpenAllToolbar role="toolbar" aria-label="Все позиции">
              <OpenAllBtn
                type="button"
                onClick={() => setAllOpen(true)}
                title={`Показать все ${totalRowsCount} позиций`}
                aria-label={`Открыть список всех ${totalRowsCount} позиций`}
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <line x1="3" y1="4" x2="11" y2="4" />
                  <line x1="3" y1="7" x2="11" y2="7" />
                  <line x1="3" y1="10" x2="11" y2="10" />
                  <circle cx="1.5" cy="4" r="0.5" fill="currentColor" stroke="none" />
                  <circle cx="1.5" cy="7" r="0.5" fill="currentColor" stroke="none" />
                  <circle cx="1.5" cy="10" r="0.5" fill="currentColor" stroke="none" />
                </svg>
              </OpenAllBtn>
            </OpenAllToolbar>
          )}
          <UnitToggle value={unit} onChange={setUnit} />
          <InfoHintTopRight>
            <InfoHint ariaLabel="Подсказка по управлению">
              <span className="hi"><kbd>Клик</kbd> — фильтр</span>
              <span className="hi-sep" aria-hidden="true" />
              <span className="hi"><kbd>Ctrl</kbd>+<kbd>клик</kbd> — детализация</span>
              <span className="hi-sep" aria-hidden="true" />
              <span className="hi"><kbd>Right Click</kbd> — меню действий</span>
            </InfoHint>
          </InfoHintTopRight>
        </Controls>
      </CardHead>

      {renderBody()}

      {showHoverTooltip && <Tooltip payload={tooltip} />}

      {enableDrillModal && drillRow && drillQueryParams && (
        <DetailModal
          row={drillRow}
          queryParams={drillQueryParams}
          unitSuffixRub={unitSuffixRub}
          decimalsValue={decimalsValue}
          decimalsDelta={decimalsDelta}
          invertDeltaGood={invertDeltaGood}
          isMockMode={isMockMode}
          themeMode={themeMode}
          onClose={handleCloseDetail}
        />
      )}

      {enableAllItemsModal && allOpen && (
        <AllItemsModal
          rows={rows}
          totalRows={totalRowsCount}
          totalSum={totalSum}
          unit={unit}
          maxValue={maxValue}
          invertDeltaGood={invertDeltaGood}
          decimalsValue={decimalsValue}
          decimalsDelta={decimalsDelta}
          decimalsShare={decimalsShare}
          unitSuffixRub={unitSuffixRub}
          showSparkline={showSparkline}
          showGhostPrevBar={showGhostPrevBar}
          hasPrevMetric={hasPrevMetric}
          activeIds={activeIds}
          themeMode={themeMode}
          initialSort={sortBy}
          onRowClick={handleRowClick}
          onClose={handleCloseAll}
        />
      )}
    </CardRoot>
  );
};

export default RankedBars;

