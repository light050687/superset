import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  Card,
  CardFooter,
  CardHead,
  CardSub,
  CardTitle,
  Controls,
  ErrorCaption,
  FootLegend,
  HintCaption,
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
  PartialBadge,
  MockBadge,
  StaleBar,
} from './styles';
import BulletRow from './components/BulletRow';
import SortMenu from './components/SortMenu';
import BulletTooltip from './components/Tooltip';
import DetailModal from './DetailModal';
import { LIGHT_TOKENS, DARK_TOKENS } from './themeTokens';
import { InfoHint, InfoHintTopRight } from './components/InfoHint';
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
          <ErrorCaption>Ошибка отрисовки bullet-чарта</ErrorCaption>
          <HintCaption>{this.state.message}</HintCaption>
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
  /* Единый фильтр статуса: dropdown с 3 опциями (Все/Хуже/Лучше плана).
     Default из controlPanel: если filterWorseThanPlanDefault=true → 'bad'. */
  type StatusFilter = 'all' | 'bad' | 'good';
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(
    filterWorseThanPlanDefault ? 'bad' : 'all',
  );
  const [statusDdOpen, setStatusDdOpen] = React.useState(false);
  const statusTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [statusMenuPos, setStatusMenuPos] = React.useState<{ top: number; right: number }>({ top: 0, right: 0 });
  React.useEffect(() => {
    if (!statusDdOpen) return undefined;
    const update = (): void => {
      const r = statusTriggerRef.current?.getBoundingClientRect();
      if (!r) return;
      setStatusMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    };
    update();
    const closeOnOutside = (e: MouseEvent): void => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (!t.closest('.bc-status-dd-portal') && !t.closest('.bc-status-dd-trigger')) {
        setStatusDdOpen(false);
      }
    };
    const closeOnEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setStatusDdOpen(false);
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    document.addEventListener('click', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      document.removeEventListener('click', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [statusDdOpen]);
  // Legacy bridge — для обратной совместимости с visibleRows useMemo / empty messages.
  const filterBad = statusFilter === 'bad';
  const filterGood = statusFilter === 'good';
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
    setStatusFilter(filterWorseThanPlanDefault ? 'bad' : 'all');
  }, [filterWorseThanPlanDefault]);

  // ── Derived ──
  const sorted = React.useMemo(() => sortRows(rows, sortBy), [rows, sortBy]);
  const visibleRows = React.useMemo(() => {
    // Если ни один toggle не активен — показываем всё.
    if (!filterBad && !filterGood) return sorted;
    return sorted.filter(r => {
      if (filterBad && r.status === 'bad') return true;
      if (filterGood && r.status === 'good') return true;
      return false;
    });
  }, [sorted, filterBad, filterGood]);

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
  // DS 2.0 canonical: loading имеет свой раздельный return со своим Card.
  // При переходе loading → loaded React unmount'ит loading-Card и mount'ит
  // новый → cardInKf animation запускается ровно когда юзер видит контент.
  if (dataState === 'loading') {
    return (
      <Root
        ref={rootRef}
        className={ROOT_CLASS}
        isDarkMode={isDarkMode}
        widthPx={width}
        heightPx={height}
        data-theme={isDarkMode ? 'dark' : 'light'}
      >
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
        <Card role="region" aria-label={headerText} aria-busy="true" data-no-anim="">
          <CardHead>
            <TitleBlock>
              <CardTitle>
                {headerText}
                {mockModeEnabled && <MockBadge>ТЕСТ</MockBadge>}
              </CardTitle>
            </TitleBlock>
          </CardHead>
          <StateOverlay aria-busy="true">
            <Skeleton widthPct={100} />
            <Skeleton widthPct={95} />
            <Skeleton widthPct={90} />
          </StateOverlay>
        </Card>
      </Root>
    );
  }

  return (
    <Root
      ref={rootRef}
      className={ROOT_CLASS}
      isDarkMode={isDarkMode}
      widthPx={width}
      heightPx={height}
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
      <Card role="region" aria-label={headerText} data-info-hint-container="">
        {dataState === 'stale' && <StaleBar aria-hidden="true" />}
        <CardHead>
          <TitleBlock>
            <CardTitle>
              {headerText}
              {mockModeEnabled && <MockBadge>ТЕСТ</MockBadge>}
              {dataState === 'partial' && (
                <PartialBadge title="Часть данных недоступна">Частично</PartialBadge>
              )}
            </CardTitle>
            <CardSub>
              {subheaderText ? <span>{subheaderText}</span> : null}
              {totalStores != null ? (
                <>
                  <span className="dot" />
                  <span className="strong">{formatStoresCount(totalStores)}</span>
                </>
              ) : null}
            </CardSub>
          </TitleBlock>
          <Controls>
            {rows.length > 0 && (
              <>
                <SortMenu value={sortBy} onChange={setSortBy} />
                {(() => {
                  const opts: { id: StatusFilter; label: string; tone: 'neutral' | 'bad' | 'good' }[] = [
                    { id: 'all', label: 'Все', tone: 'neutral' },
                    { id: 'bad', label: 'Хуже плана', tone: 'bad' },
                    { id: 'good', label: 'Лучше плана', tone: 'good' },
                  ];
                  const cur = opts.find(o => o.id === statusFilter) ?? opts[0];
                  const dotColor = cur.tone === 'bad' ? 'var(--dn)' : cur.tone === 'good' ? 'var(--up)' : 'var(--g400)';
                  const borderColor = cur.tone === 'neutral' ? 'var(--g200)' : (cur.tone === 'bad' ? 'var(--dn)' : 'var(--up)');
                  return (
                    <>
                      <button
                        ref={statusTriggerRef}
                        type="button"
                        className="bc-status-dd-trigger"
                        aria-haspopup="listbox"
                        aria-expanded={statusDdOpen}
                        aria-label={`Фильтр по статусу: ${cur.label}`}
                        title="Фильтр по статусу"
                        onClick={() => setStatusDdOpen(v => !v)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          minHeight: 30,
                          padding: '4px 9px',
                          background: 'var(--bg)',
                          border: `1px solid ${borderColor}`,
                          borderRadius: 8,
                          color: 'var(--ink)',
                          fontFamily: 'var(--m)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                        <span>{cur.label}</span>
                        <svg width="9" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M1 1 L5 5 L9 1" />
                        </svg>
                      </button>
                      {statusDdOpen && createPortal(
                        <div
                          className="bc-status-dd-portal"
                          role="listbox"
                          aria-label="Фильтр по статусу"
                          style={{
                            position: 'fixed',
                            top: statusMenuPos.top,
                            right: statusMenuPos.right,
                            zIndex: 10000,
                            minWidth: 180,
                            background: '#ffffff',
                            border: '1px solid #D1D5DB',
                            borderRadius: 10,
                            padding: 4,
                            boxShadow: '0 10px 28px rgba(15, 17, 20, 0.15)',
                          }}
                        >
                          {opts.map(o => {
                            const isOn = statusFilter === o.id;
                            const oDot = o.tone === 'bad' ? 'var(--dn)' : o.tone === 'good' ? 'var(--up)' : 'var(--g400)';
                            return (
                              <button
                                key={o.id}
                                type="button"
                                role="option"
                                aria-selected={isOn}
                                onClick={() => {
                                  setStatusFilter(o.id);
                                  setStatusDdOpen(false);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  width: '100%',
                                  minHeight: 34,
                                  padding: '7px 10px',
                                  background: isOn ? '#F3F4F6' : 'transparent',
                                  border: 'none',
                                  borderRadius: 6,
                                  color: '#0F1114',
                                  fontFamily: 'inherit',
                                  fontSize: 12,
                                  fontWeight: isOn ? 600 : 500,
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={e => { if (!isOn) (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB'; }}
                                onMouseLeave={e => { if (!isOn) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                              >
                                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: oDot, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)' }} />
                                <span>{o.label}</span>
                              </button>
                            );
                          })}
                        </div>,
                        document.body,
                      )}
                    </>
                  );
                })()}
              </>
            )}
            <InfoHintTopRight>
              <InfoHint ariaLabel="Подсказка по управлению">
                {enableDetailModal && (
                  <>
                    <span className="hi"><kbd>Click</kbd> bar — детали</span>
                    <span className="hi-sep" aria-hidden="true" />
                  </>
                )}
                <span className="hi">Sort / Filter — controls сверху</span>
                <span className="hi-sep" aria-hidden="true" />
                <span className="hi"><kbd>Right Click</kbd> — меню действий</span>
              </InfoHint>
            </InfoHintTopRight>
          </Controls>
        </CardHead>

        {/* dataState === 'loading' уже обработан выше через early return
            на line ~204 (отдельный Root для skeleton). Здесь dataState
            гарантированно не 'loading'. */}

        {dataState === 'error' ? (
          <StateOverlay role="alert">
            <ErrorCaption>Ошибка загрузки данных</ErrorCaption>
          </StateOverlay>
        ) : null}

        {dataState === 'empty' ? (
          <StateOverlay>
            <span>Нет данных для отображения</span>
            <HintCaption>Настройте измерение и метрику факта</HintCaption>
          </StateOverlay>
        ) : null}

        {(dataState === 'populated' ||
          dataState === 'partial' ||
          dataState === 'stale') && rows.length > 0 ? (
          <BulletList role="list">
            {visibleRows.length === 0 && (filterBad || filterGood) ? (
              <StateOverlay>
                <span>
                  {filterBad && filterGood
                    ? 'Нет строк «хуже» или «лучше плана» — все в пределах цели'
                    : filterBad
                    ? 'Нет строк «хуже плана» — все в пределах цели'
                    : 'Нет строк «лучше плана» — все в пределах цели или хуже'}
                </span>
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

        <CardFooter>
          {rows.length > 0 && (
            <FootLegend aria-label="Условные обозначения">
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
          )}
        </CardFooter>
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
          /* Tooltip того же тона что Card surface (НЕ инверт).
             Передаём theme-aware tokens: bg=surface, text=ink. */
          ink={isDarkMode ? DARK_TOKENS.s : LIGHT_TOKENS.s}
          surface={isDarkMode ? DARK_TOKENS.ink : LIGHT_TOKENS.ink}
          border={isDarkMode ? DARK_TOKENS.g700 : LIGHT_TOKENS.g300}
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
