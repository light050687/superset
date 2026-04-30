import * as React from 'react';
import { createPortal } from 'react-dom';
import {
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
  StoreList,
  StoreRow,
} from './styles';
import type {
  DetailQueryParams,
  Direction,
  FormatRow,
  Formatters,
  RowStatus,
} from './types';
import { fetchDetailRows, DetailStoreRow } from './utils/detailApi';
import { formatStoresCount } from './utils/format';
import { computeStatus } from './utils/aggregation';

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
  // Mock-режим: используем storesList из пресета (ref:553-612).
  const initialStores: DetailStoreRow[] = React.useMemo(() => {
    if (!mockMode || !row.storesList) return [];
    return row.storesList.map(s => ({
      name: s.name,
      rate: s.rate,
      plan: s.plan,
      py: s.py,
      stores: null,
    }));
  }, [mockMode, row.storesList]);

  const shouldFetch = !mockMode && !!detailQueryParams;
  const [loading, setLoading] = React.useState<boolean>(shouldFetch);
  const [error, setError] = React.useState<string | null>(null);
  const [stores, setStores] = React.useState<DetailStoreRow[]>(initialStores);

  React.useEffect(() => {
    if (!shouldFetch || !detailQueryParams) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDetailRows({ ...detailQueryParams, categoryValue: row.name })
      .then(rowsFromApi => {
        if (!cancelled) {
          setStores(rowsFromApi);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Не удалось загрузить детализацию';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shouldFetch, detailQueryParams, row.name]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    closeRef.current?.focus();
  }, []);

  if (!rootEl) return null;

  const deltaPlanStr =
    row.deltaPlan != null ? formatters.deltaPP(row.deltaPlan) : '—';
  const deltaPyStr = row.deltaPy != null ? formatters.deltaPP(row.deltaPy) : '—';
  const deltaTone = (delta: number | null): 'up' | 'dn' | 'wn' | 'default' => {
    if (delta == null) return 'default';
    if (Math.abs(delta) <= 0.01) return 'wn';
    if (direction === 'less_is_better') return delta > 0 ? 'dn' : 'up';
    return delta > 0 ? 'up' : 'dn';
  };

  // Сортировка по убыванию rate (ref:942) — худшие сверху для less_is_better.
  const sortedStores = React.useMemo(() => {
    const copy = [...stores];
    return copy.sort((a, b) =>
      direction === 'less_is_better' ? b.rate - a.rate : a.rate - b.rate,
    );
  }, [stores, direction]);

  // Shared scale для mini-bullet всех stores (ref:943).
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

  // % магазинов хуже плана.
  const worseCount = stores.filter(s => {
    if (s.plan == null) return false;
    return direction === 'less_is_better' ? s.rate > s.plan : s.rate < s.plan;
  }).length;
  const worsePct = stores.length > 0 ? Math.round((worseCount / stores.length) * 100) : 0;
  const worseTone: 'up' | 'dn' | 'wn' | 'default' =
    stores.length === 0
      ? 'default'
      : worsePct > 50
      ? 'dn'
      : worsePct > 30
      ? 'wn'
      : 'up';

  const rowStatusColor = statusColor(row.status);

  return createPortal(
    <ModalBg role="presentation" onClick={onClose}>
      <ModalBox
        role="dialog"
        aria-modal="true"
        aria-labelledby="bc-modal-title"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
              <span className="u"> из {stores.length || '—'}</span>
            </ModalStatV>
            <ModalStatD tone={worseTone}>{worsePct}%</ModalStatD>
          </ModalStat>
        </ModalSummary>

        <ModalSection>
          <ModalSectionL>
            <span>Детализация</span>
            <span className="count">
              {loading ? 'загрузка…' : `${stores.length}`}
            </span>
          </ModalSectionL>

          {error ? (
            <div style={{ color: 'var(--dn)', fontSize: 12, padding: '12px 0' }}>
              Ошибка: {error}
            </div>
          ) : null}

          {!error ? (
            <StoreList>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <StoreRow key={`skel-${i}`} style={{ opacity: 0.5 }}>
                      <span className="rank">—</span>
                      <span className="name">Загрузка…</span>
                      <div className="mini-bullet" />
                      <span className="pct">—</span>
                      <span className="delta">—</span>
                    </StoreRow>
                  ))
                : sortedStores.map((s, i) => {
                    const d = s.plan != null ? s.rate - s.plan : null;
                    const st = computeStatus(s.rate, s.plan, direction);
                    const color = statusColor(st);
                    return (
                      <StoreRow key={`${s.name}-${i}`}>
                        <span className="rank">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="name" title={s.name}>
                          {s.name}
                        </span>
                        <div className="mini-bullet" aria-hidden="true">
                          <div
                            className="mini-bar"
                            style={{ width: `${pct(s.rate)}%`, background: color }}
                          />
                          {s.plan != null ? (
                            <div
                              className="mini-target"
                              style={{ left: `calc(${pct(s.plan)}% - 1px)` }}
                            />
                          ) : null}
                        </div>
                        <span className="pct" style={{ color }}>
                          {formatters.value(s.rate)}
                        </span>
                        <span
                          className={
                            'delta ' +
                            (st === 'good' ? 'up' : st === 'bad' ? 'dn' : 'wn')
                          }
                        >
                          {d != null ? formatters.deltaPP(d) : '—'}
                        </span>
                      </StoreRow>
                    );
                  })}
            </StoreList>
          ) : null}
        </ModalSection>
      </ModalBox>
    </ModalBg>,
    rootEl,
  );
};

export default DetailModal;
