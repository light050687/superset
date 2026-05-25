import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  DetailErrorBlock,
  ErrorRowInner,
  InlineSpinnerLarge,
  LoaderRowInner,
  ModalBg,
  ModalBox,
  ModalCloseBtn,
  ModalHead,
  ModalSection,
  ModalSectionL,
  ModalStat,
  ModalStatD,
  ModalStatL,
  ModalStatV,
  ModalSub,
  ModalSummary,
  ModalTitle,
  ModalTitles,
  PageBtn,
  PageEllipsis,
  PageInput,
  PaginationWrap,
  RefreshBar,
  RetryButton,
  StoreList,
  StoreListWrap,
  StoreRow,
} from './styles';
import type {
  DetailQueryParams,
  Direction,
  FormatRow,
  Formatters,
  RowStatus,
} from './types';
import {
  fetchDetailCount,
  fetchDetailRows,
  DetailStoreRow,
} from './utils/detailApi';
import { formatStoresCount } from './utils/format';
import { computeStatus } from './utils/aggregation';

const PAGE_SIZE = 20;

interface DetailModalProps {
  row: FormatRow;
  scaleMax: number;
  direction: Direction;
  formatters: Formatters;
  detailQueryParams: DetailQueryParams | undefined;
  /** Если true — используем storesList из пресета вместо серверного запроса. */
  mockMode: boolean;
  onClose: () => void;
  rootEl: HTMLElement | null;
}

function statusColor(s: RowStatus): string {
  if (s === 'good') return 'var(--up)';
  if (s === 'bad') return 'var(--dn)';
  if (s === 'warn') return 'var(--wn)';
  return 'var(--g500)';
}

/* Numbered pagination helper — паттерн из scorecard DetailModal:
   <= 7 страниц: все. Иначе: первые/последние + текущая ± 1, ellipsis между. */
function getPageNumbers(current0: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  pages.add(total - 1);
  pages.add(total - 2);
  const cur1 = current0 + 1;
  pages.add(cur1);
  if (cur1 > 1) pages.add(cur1 - 1);
  if (cur1 < total) pages.add(cur1 + 1);
  const sorted = [...pages]
    .filter(p => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const result: (number | '...')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
    result.push(sorted[i]);
  }
  return result;
}

const DetailModal: React.FC<DetailModalProps> = ({
  row,
  scaleMax,
  direction,
  formatters,
  detailQueryParams,
  mockMode,
  onClose,
  rootEl,
}) => {
  // ── Server-paged state (real-data режим) ──
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [stores, setStores] = React.useState<DetailStoreRow[]>([]);
  const [totalCount, setTotalCount] = React.useState<number | null>(null);
  const [hasNextPage, setHasNextPage] = React.useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = React.useState<boolean>(
    !mockMode && !!detailQueryParams,
  );
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  // Retry-токен для перезапуска useEffect при «Повторить» — без смены currentPage.
  const [retryNonce, setRetryNonce] = React.useState<number>(0);

  // Mock-режим: локальная пагинация по storesList пресета.
  const allMockStores: DetailStoreRow[] = React.useMemo(() => {
    if (!mockMode || !row.storesList) return [];
    return row.storesList.map(s => ({
      name: s.name,
      rate: s.rate,
      plan: s.plan,
      py: s.py,
      stores: null,
    }));
  }, [mockMode, row.storesList]);

  // AbortController: предотвращает race condition при быстром переключении страниц.
  const rowsAbortRef = React.useRef<AbortController | null>(null);
  const countAbortRef = React.useRef<AbortController | null>(null);
  const hasEverLoadedRef = React.useRef<boolean>(false);

  /* ── Mock-режим: локальная пагинация slice по allMockStores ── */
  React.useEffect(() => {
    if (!mockMode) return;
    const total = allMockStores.length;
    setTotalCount(total);
    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const slice = allMockStores.slice(start, end);
    setStores(slice);
    setHasNextPage(end < total);
    setIsInitialLoading(false);
    setIsRefreshing(false);
    setFetchError(null);
    hasEverLoadedRef.current = true;
  }, [mockMode, allMockStores, currentPage]);

  /* ── Real-data: fetchDetailRows на смену страницы ── */
  React.useEffect(() => {
    if (mockMode || !detailQueryParams) return undefined;

    // Abort previous request — race-condition safety на быстром переключении.
    rowsAbortRef.current?.abort();
    const controller = new AbortController();
    rowsAbortRef.current = controller;

    // Stale-while-revalidate: spinner только на initial load,
    // на смене страницы — RefreshBar + dimmed list.
    if (!hasEverLoadedRef.current) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setFetchError(null);

    fetchDetailRows({
      ...detailQueryParams,
      categoryValue: row.name,
      page: currentPage,
      pageSize: PAGE_SIZE,
      signal: controller.signal,
    })
      .then(result => {
        setStores(result.rows);
        setHasNextPage(result.hasNextPage);
        hasEverLoadedRef.current = true;
        setIsInitialLoading(false);
        setIsRefreshing(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Не удалось загрузить детализацию';
        setFetchError(msg);
        setIsInitialLoading(false);
        setIsRefreshing(false);
      });

    return () => controller.abort();
  }, [mockMode, detailQueryParams, row.name, currentPage, retryNonce]);

  /* ── Real-data: fetchDetailCount (отдельный AbortController) ── */
  React.useEffect(() => {
    if (mockMode || !detailQueryParams) return undefined;

    countAbortRef.current?.abort();
    const controller = new AbortController();
    countAbortRef.current = controller;

    fetchDetailCount({
      ...detailQueryParams,
      categoryValue: row.name,
      signal: controller.signal,
    })
      .then(count => setTotalCount(count))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setTotalCount(null);
      });

    return () => controller.abort();
    // categoryValue фиксирован за время открытия модалки,
    // currentPage НЕ влияет на count — pure category total.
  }, [mockMode, detailQueryParams, row.name]);

  /* ── Cleanup при unmount ── */
  React.useEffect(
    () => () => {
      rowsAbortRef.current?.abort();
      countAbortRef.current?.abort();
    },
    [],
  );

  /* ── Escape close ── */
  React.useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  /* ── Focus management ── */
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    // Фокусируем сам Modal (как в scorecard), а не CloseButton — чтобы
    // visual focus-ring не оказался на крестике при открытии.
    modalRef.current?.focus();
  }, []);

  /* ── Focus trap (Tab loops внутри модалки) ── */
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key !== 'Tab') return;
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [],
  );

  if (!rootEl) return null;

  /* ── Summary block (4 m-stat: Факт / План / Прошлый год / Хуже плана) ── */
  const deltaPlanStr =
    row.deltaPlan != null ? formatters.deltaPP(row.deltaPlan) : '—';
  const deltaPyStr = row.deltaPy != null ? formatters.deltaPP(row.deltaPy) : '—';
  const deltaTone = (delta: number | null): 'up' | 'dn' | 'wn' | 'default' => {
    if (delta == null) return 'default';
    if (Math.abs(delta) <= 0.01) return 'wn';
    if (direction === 'less_is_better') return delta > 0 ? 'dn' : 'up';
    return delta > 0 ? 'up' : 'dn';
  };

  /* ── Сортировка current page по rate (худшие сверху для less_is_better) ──
     Это per-page client sort: server отдаёт уже отсортированный по fact desc,
     но direction === 'less_is_better' переворачивает порядок для UX («хуже всех — сверху»). */
  const sortedStores = React.useMemo(() => {
    const copy = [...stores];
    return copy.sort((a, b) =>
      direction === 'less_is_better' ? b.rate - a.rate : a.rate - b.rate,
    );
  }, [stores, direction]);

  /* ── Shared scale для mini-bullet: max по current page × 1.1, fallback scaleMax.
     Меняется между страницами — это OK, юзер видит relative comparison ВНУТРИ
     страницы (а не global), что соответствует UX «сравнение магазинов на этой странице». */
  const storeScale = React.useMemo(() => {
    if (!stores.length) return scaleMax;
    const all = stores.flatMap(s => [
      s.rate,
      ...(s.plan != null ? [s.plan] : []),
      ...(s.py != null ? [s.py] : []),
    ]);
    const m = Math.max(...all);
    return Number.isFinite(m) && m > 0 ? m * 1.1 : scaleMax;
  }, [stores, scaleMax]);

  const pct = (v: number): number =>
    Math.min(100, Math.max(0, (v / storeScale) * 100));

  /* ── «Хуже плана: N» — по current page (не по total). Помечаем «на этой странице»,
     если есть hasNextPage или page > 0 (не весь dataset виден). */
  const worseCount = stores.filter(s => {
    if (s.plan == null) return false;
    return direction === 'less_is_better' ? s.rate > s.plan : s.rate < s.plan;
  }).length;
  const isPartialView = hasNextPage || currentPage > 0;
  const worseSubtitle =
    stores.length === 0
      ? ''
      : isPartialView
        ? `из ${stores.length} на странице`
        : `из ${stores.length}`;
  const worsePct =
    stores.length > 0 ? Math.round((worseCount / stores.length) * 100) : 0;
  const worseTone: 'up' | 'dn' | 'wn' | 'default' =
    stores.length === 0
      ? 'default'
      : worsePct > 50
        ? 'dn'
        : worsePct > 30
          ? 'wn'
          : 'up';

  const rowStatusColor = statusColor(row.status);

  /* ── Pagination state ── */
  const totalPages =
    totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : null;
  const showPagination = totalPages != null && totalPages > 1;

  /* ── Header counter ── */
  const headerCount =
    totalCount != null
      ? `${totalCount}`
      : `${stores.length}${hasNextPage ? '+' : ''}`;

  /* ── Empty / loaded states ── */
  const isEmpty =
    !isInitialLoading && !fetchError && stores.length === 0;

  return createPortal(
    <ModalBg role="presentation" onClick={onClose}>
      <ModalBox
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bc-modal-title"
        tabIndex={-1}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <ModalHead>
          <ModalTitles>
            <ModalTitle id="bc-modal-title">{row.name}</ModalTitle>
            <ModalSub>
              {row.stores != null ? formatStoresCount(row.stores) : ''}
            </ModalSub>
          </ModalTitles>
          <ModalCloseBtn
            ref={closeRef}
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <svg
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </ModalCloseBtn>
        </ModalHead>

        <ModalSummary>
          <ModalStat>
            <ModalStatL>Факт</ModalStatL>
            <ModalStatV style={{ color: rowStatusColor }}>
              {formatters.value(row.rate)}
            </ModalStatV>
            <ModalStatD tone={deltaTone(row.deltaPlan)}>
              {deltaPlanStr} к плану
            </ModalStatD>
          </ModalStat>
          <ModalStat>
            <ModalStatL>План</ModalStatL>
            <ModalStatV>
              {row.plan != null ? formatters.value(row.plan) : '—'}
            </ModalStatV>
            <ModalStatD tone="wn">целевой уровень</ModalStatD>
          </ModalStat>
          <ModalStat>
            <ModalStatL>Прошлый год</ModalStatL>
            <ModalStatV>
              {row.py != null ? formatters.value(row.py) : '—'}
            </ModalStatV>
            <ModalStatD tone={deltaTone(row.deltaPy)}>
              {deltaPyStr} к ПГ
            </ModalStatD>
          </ModalStat>
          <ModalStat>
            <ModalStatL>Хуже плана</ModalStatL>
            <ModalStatV>
              {worseCount}
              {worseSubtitle && (
                <span className="u"> {worseSubtitle}</span>
              )}
            </ModalStatV>
            <ModalStatD tone={worseTone}>{worsePct}%</ModalStatD>
          </ModalStat>
        </ModalSummary>

        <ModalSection>
          <ModalSectionL>
            <span>Детализация</span>
            <span className="count">
              {isInitialLoading ? 'загрузка…' : headerCount}
            </span>
          </ModalSectionL>

          {fetchError ? (
            <DetailErrorBlock>
              <ErrorRowInner>
                <span>Ошибка: {fetchError}</span>
                <RetryButton
                  type="button"
                  onClick={() => {
                    setFetchError(null);
                    setRetryNonce(n => n + 1);
                  }}
                >
                  Повторить
                </RetryButton>
              </ErrorRowInner>
            </DetailErrorBlock>
          ) : null}

          {!fetchError && (
            <StoreListWrap>
              {isRefreshing && <RefreshBar aria-hidden="true" />}
              {isInitialLoading ? (
                <LoaderRowInner>
                  <InlineSpinnerLarge aria-label="Загрузка" />
                  Загрузка…
                </LoaderRowInner>
              ) : isEmpty ? (
                <LoaderRowInner>Нет данных</LoaderRowInner>
              ) : (
                <StoreList
                  style={{
                    opacity: isRefreshing ? 0.45 : 1,
                    transition: 'opacity 0.15s ease',
                    pointerEvents: isRefreshing ? 'none' : 'auto',
                  }}
                >
                  {sortedStores.map((s, i) => {
                    const d = s.plan != null ? s.rate - s.plan : null;
                    const st = computeStatus(s.rate, s.plan, direction);
                    const color = statusColor(st);
                    const globalRank = currentPage * PAGE_SIZE + i + 1;
                    return (
                      <StoreRow key={`${s.name}-${i}`}>
                        <span className="rank">
                          {String(globalRank).padStart(2, '0')}
                        </span>
                        <span className="name" title={s.name}>
                          {s.name}
                        </span>
                        <div className="mini-bullet" aria-hidden="true">
                          <div
                            className="mini-bar"
                            style={{
                              width: `${pct(s.rate)}%`,
                              background: color,
                            }}
                          />
                          {s.plan != null ? (
                            <div
                              className="mini-target"
                              style={{
                                left: `calc(${pct(s.plan)}% - 1px)`,
                              }}
                            />
                          ) : null}
                        </div>
                        <span className="pct" style={{ color }}>
                          {formatters.value(s.rate)}
                        </span>
                        <span
                          className={
                            'delta ' +
                            (st === 'good'
                              ? 'up'
                              : st === 'bad'
                                ? 'dn'
                                : 'wn')
                          }
                        >
                          {d != null ? formatters.deltaPP(d) : '—'}
                        </span>
                      </StoreRow>
                    );
                  })}
                </StoreList>
              )}
            </StoreListWrap>
          )}
        </ModalSection>

        {showPagination && (
          <PaginationWrap
            style={{
              opacity: isRefreshing ? 0.5 : 1,
              pointerEvents: isRefreshing ? 'none' : 'auto',
              transition: 'opacity 0.15s ease',
            }}
            aria-label="Навигация по страницам"
          >
            {getPageNumbers(currentPage, totalPages!).map((item, idx) =>
              item === '...' ? (
                <PageEllipsis key={`e${idx}`}>…</PageEllipsis>
              ) : (
                <PageBtn
                  key={item}
                  type="button"
                  isActive={item === currentPage + 1}
                  aria-label={`Страница ${item}`}
                  aria-current={item === currentPage + 1 ? 'page' : undefined}
                  onClick={() => setCurrentPage((item as number) - 1)}
                  disabled={isRefreshing}
                >
                  {item}
                </PageBtn>
              ),
            )}
            {totalPages! > 7 && (
              <PageInput
                type="number"
                min={1}
                max={totalPages!}
                placeholder="№"
                aria-label="Перейти на страницу"
                disabled={isRefreshing}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(
                      (e.target as HTMLInputElement).value,
                      10,
                    );
                    if (val >= 1 && val <= totalPages!) {
                      setCurrentPage(val - 1);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            )}
          </PaginationWrap>
        )}
      </ModalBox>
    </ModalBg>,
    rootEl,
  );
};

export default DetailModal;
