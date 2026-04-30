import * as React from 'react';
import {
  Card,
  CardFooter,
  CardHead,
  CardSub,
  CardTitle,
  Controls,
  FilterPill,
  FootHint,
  FootLegend,
  Kbd,
  KEYFRAMES_CSS,
  LegendBand,
  LegendBar,
  LegendItem,
  LegendTarget,
  BulletList,
  Root,
  ROOT_CLASS,
  Skeleton,
  StateOverlay,
  TitleBlock,
} from './styles';
import BulletRow from './components/BulletRow';
import SortMenu from './components/SortMenu';
import BulletTooltip from './components/Tooltip';
import DetailModal from './DetailModal';
import type {
  BulletChartProps,
  FormatRow,
  RowStatus,
  SortBy,
} from './types';
import { sortRows } from './utils/sorting';
import { formatStoresCount } from './utils/format';

/** Цвет статуса через CSS-переменные. */
function statusColorVar(s: RowStatus): string {
  if (s === 'good') return 'var(--up)';
  if (s === 'bad') return 'var(--dn)';
  if (s === 'warn') return 'var(--wn)';
  return 'var(--g500)';
}

// ═══════════════════════════════════════
// Error Boundary
// ═══════════════════════════════════════

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Ловит ошибки рендера и показывает fallback UI, чтобы весь дашборд не падал
 * из-за одной карточки (PRODUCTION_CHECKLIST §3.1).
 */
class BulletErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message =
      error instanceof Error ? error.message : 'Неизвестная ошибка рендера';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: unknown): void {
    // Structured-лог, чтобы уведомить о проблеме (без PII).
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'superset-plugin-chart-bullet',
        event: 'render_crash',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        info,
      }),
    );
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <StateOverlay role="alert">
          <span style={{ color: 'var(--dn)' }}>
            Ошибка отрисовки bullet-чарта
          </span>
          <span style={{ fontSize: 10, color: 'var(--g500)' }}>
            {this.state.message}
          </span>
        </StateOverlay>
      );
    }
    return this.props.children;
  }
}

// ═══════════════════════════════════════
// Inner component
// ═══════════════════════════════════════

const BulletChartInner: React.FC<BulletChartProps> = props => {
  const {
    width,
    height,
    dataState,
    headerText,
    subheaderText,
    rows,
    scaleMax,
    direction,
    defaultSort,
    filterWorseThanPlanDefault,
    enableCrossFilter,
    enableDetailModal,
    formatters,
    isDarkMode,
    detailQueryParams,
    mockModeEnabled,
  } = props;

  // ── State ──
  const [sortBy, setSortBy] = React.useState<SortBy>(defaultSort);
  const [filterBad, setFilterBad] = React.useState<boolean>(
    filterWorseThanPlanDefault,
  );
  // Cross-filter: множественный выбор (ref:621 — activeFilters: Set).
  const [activeCategoryIds, setActiveCategoryIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [modalRow, setModalRow] = React.useState<FormatRow | null>(null);
  const [tooltipState, setTooltipState] = React.useState<{
    row: FormatRow;
    x: number;
    y: number;
  } | null>(null);

  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setSortBy(defaultSort);
  }, [defaultSort]);
  React.useEffect(() => {
    setFilterBad(filterWorseThanPlanDefault);
  }, [filterWorseThanPlanDefault]);

  // ── Derived ──
  const sorted = React.useMemo(() => sortRows(rows, sortBy), [rows, sortBy]);
  const visibleRows = React.useMemo(() => {
    if (!filterBad) return sorted;
    return sorted.filter(r => r.status === 'bad');
  }, [sorted, filterBad]);

  const totalStores = React.useMemo(() => {
    const sum = rows.reduce((s, r) => s + (r.stores ?? 0), 0);
    return sum > 0 ? sum : null;
  }, [rows]);

  const hasActiveFilter = activeCategoryIds.size > 0;

  // ── Handlers ──
  const handleRowClick = React.useCallback(
    (row: FormatRow, ctrlKey: boolean) => {
      if (ctrlKey && enableDetailModal) {
        setModalRow(row);
        setTooltipState(null);
        return;
      }
      if (!enableCrossFilter) return;
      setActiveCategoryIds(prev => {
        const next = new Set(prev);
        if (next.has(row.id)) next.delete(row.id);
        else next.add(row.id);
        return next;
      });
    },
    [enableCrossFilter, enableDetailModal],
  );

  const handleRowHover = React.useCallback(
    (row: FormatRow | null, x: number, y: number) => {
      setTooltipState(row ? { row, x, y } : null);
    },
    [],
  );

  const closeModal = React.useCallback(() => setModalRow(null), []);

  // ── Render ──
  return (
    <Root
      ref={rootRef}
      className={ROOT_CLASS}
      isDarkMode={isDarkMode}
      style={{ width, height }}
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
      <Card role="region" aria-label={headerText}>
        <CardHead>
          <TitleBlock>
            <CardTitle>{headerText}</CardTitle>
            <CardSub>
              {subheaderText ? <span>{subheaderText}</span> : null}
              {totalStores != null ? (
                <>
                  <span className="dot" />
                  <span className="strong">{formatStoresCount(totalStores)}</span>
                </>
              ) : null}
              {mockModeEnabled ? (
                <>
                  <span className="dot" />
                  <span>Режим проектирования</span>
                </>
              ) : null}
            </CardSub>
          </TitleBlock>
          {rows.length > 0 ? (
            <Controls>
              <SortMenu value={sortBy} onChange={setSortBy} />
              <FilterPill
                type="button"
                active={filterBad}
                aria-pressed={filterBad}
                onClick={() => setFilterBad(v => !v)}
                title="Показать только хуже плана"
              >
                <svg
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 2 L13 12 L1 12 Z" />
                  <line x1="7" y1="6" x2="7" y2="9" />
                  <line x1="7" y1="11" x2="7" y2="11.5" />
                </svg>
                <span>Хуже плана</span>
              </FilterPill>
            </Controls>
          ) : null}
        </CardHead>

        {dataState === 'loading' ? (
          <StateOverlay aria-busy="true">
            <Skeleton style={{ width: '100%' }} />
            <Skeleton style={{ width: '95%' }} />
            <Skeleton style={{ width: '90%' }} />
          </StateOverlay>
        ) : null}

        {dataState === 'error' ? (
          <StateOverlay role="alert">
            <span style={{ color: 'var(--dn)' }}>Ошибка загрузки данных</span>
          </StateOverlay>
        ) : null}

        {dataState === 'empty' ? (
          <StateOverlay>
            <span>Нет данных для отображения</span>
            <span style={{ fontSize: 10, color: 'var(--g500)' }}>
              Настройте измерение и метрику факта
            </span>
          </StateOverlay>
        ) : null}

        {(dataState === 'populated' ||
          dataState === 'partial' ||
          dataState === 'stale') && rows.length > 0 ? (
          <BulletList role="list">
            {visibleRows.length === 0 && filterBad ? (
              <StateOverlay>
                <span>Нет строк «хуже плана» — все в пределах цели</span>
              </StateOverlay>
            ) : (
              visibleRows.map(row => {
                const color = statusColorVar(row.status);
                const isActive = activeCategoryIds.has(row.id);
                const dimmed = hasActiveFilter && !isActive;
                return (
                  <BulletRow
                    key={row.id}
                    row={row}
                    scaleMax={scaleMax}
                    direction={direction}
                    filtered={isActive}
                    dimmed={dimmed}
                    statusColor={color}
                    formatters={formatters}
                    handlers={{
                      onClick: handleRowClick,
                      onHover: handleRowHover,
                    }}
                  />
                );
              })
            )}
          </BulletList>
        ) : null}

        {rows.length > 0 ? (
          <CardFooter>
            <FootHint>
              <Kbd>Click</Kbd>
              <span>фильтр</span>
              {enableDetailModal ? (
                <>
                  <span style={{ color: 'var(--g500)' }}>·</span>
                  <Kbd>Ctrl</Kbd>
                  <span>+</span>
                  <Kbd>Click</Kbd>
                  <span>детализация</span>
                </>
              ) : null}
            </FootHint>
            <FootLegend>
              <LegendItem>
                <LegendBar />
                <span>факт</span>
              </LegendItem>
              <LegendItem>
                <LegendTarget />
                <span>цель</span>
              </LegendItem>
              <LegendItem>
                <LegendBand />
                <span>зона</span>
              </LegendItem>
            </FootLegend>
          </CardFooter>
        ) : null}
      </Card>

      {tooltipState ? (
        <BulletTooltip
          row={tooltipState.row}
          direction={direction}
          formatters={formatters}
          statusColor={statusColorVar(tooltipState.row.status)}
          x={tooltipState.x}
          y={tooltipState.y}
          rootEl={rootRef.current}
          showDetailHint={enableDetailModal}
        />
      ) : null}

      {modalRow ? (
        <DetailModal
          row={modalRow}
          scaleMax={scaleMax}
          direction={direction}
          formatters={formatters}
          detailQueryParams={detailQueryParams}
          mockMode={mockModeEnabled}
          onClose={closeModal}
          rootEl={rootRef.current}
        />
      ) : null}
    </Root>
  );
};

/** Корневой компонент, обёрнут в ErrorBoundary. */
const BulletChart: React.FC<BulletChartProps> = props => (
  <BulletErrorBoundary>
    <BulletChartInner {...props} />
  </BulletErrorBoundary>
);

export default BulletChart;
