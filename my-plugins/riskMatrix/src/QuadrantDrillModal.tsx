import React, { useEffect, useMemo, useState } from 'react';
import { styled } from '@superset-ui/core';
import {
  StorePoint,
  QuadrantDef,
  QuadrantKey,
  FormatValueFn,
} from './types';
import { getQuadrant, Thresholds } from './utils/quadrants';
import { ModalBg, Modal as BaseModal, StoreRow, SearchWrap, SearchInput, EmptyBlock } from './styles';
import { useFocusTrap } from './utils/useFocusTrap';

/** ListModal — расширение Modal для drill-листа с пагинацией. Modal сам
    скроллит весь контент (overflow-y:auto), но в drill-листе нужен
    фиксированный header/summary + scrollable список + фиксированный
    pagination-footer. Поэтому здесь overflow:hidden + flex column. */
const Modal = styled(BaseModal)`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .m-head,
  .m-summary,
  .m-section > .m-section-l {
    flex-shrink: 0;
  }
  .m-section {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    margin-bottom: 0;
  }
`;

/* === Локальные styled-обёртки (миграция inline style → Emotion, P-011) === */

/** Контейнер для поиска поверх списка квадранта. */
const SearchContainer = styled.div`
  margin-bottom: 10px;
`;

/** Заголовочная строка таблицы объектов квадранта (#, имя, X, бар X, Y, бар Y). */
const StoreListHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 60px minmax(120px, 180px) 60px minmax(120px, 180px);
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  font-family: var(--m);
  /* DS v2.1 §02+§10: ≥10px UPPER, letter-spacing 0.05-0.08em, цвет --g600
     (--g500 запрещён для <14px текста). */
  font-size: var(--fs-nano);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--g600);
  border-bottom: 1px solid var(--g200);
  margin-bottom: 6px;
  flex-shrink: 0;
`;

/** Колонка-ячейка с центрированием. */
const HeaderCellCenter = styled.span`
  text-align: center;
`;

/** Колонка-ячейка с выравниванием вправо. */
const HeaderCellRight = styled.span`
  text-align: right;
`;

/** Подпись «факт vs план» — приглушённая, по центру. */
const HeaderCellMuted = styled.span`
  text-align: center;
  opacity: 0.7;
`;

/** Колонка-обёртка для строк объектов. flex:1 + overflow-y:auto — единственная
    scrollable область внутри Modal (m-section flex column); header, search,
    pagination остаются фиксированными выше/ниже. */
const StoreList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

/** Обёртка SearchWrap, занимающая всю ширину секции. */
const FullWidthSearchWrap = styled(SearchWrap)`
  width: 100%;
`;

/** Search-row — единая капсула, внутри которой «Точно» toggle и search input
    разделены тонкой вертикальной чертой (border-right у ExactMatchLabel).
    Внешний border/bg даёт сам SearchRow; дочерние SearchInput/wrap — без
    собственных border (overridden ниже). */
const SearchRow = styled.div`
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  margin-bottom: 10px;
  background: var(--s);
  border: 1px solid var(--g200);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.12s var(--ease);

  &:hover {
    border-color: var(--g300);
  }
  &:focus-within {
    border-color: var(--c-sky);
  }

  /* Дочерний SearchInput внутри SearchRow — без собственных border/bg/radius
     (родительская SearchRow capsule даёт визуальный контейнер). */
  input {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    height: 32px;
  }
`;

/** Toggle «Точно» (exact match) — inline-секция внутри SearchRow, разделена
    с search input тонкой вертикальной чертой справа. */
const ExactMatchLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-right: 1px solid var(--g200);
  font-family: var(--m);
  font-size: var(--fs-meta);
  color: var(--g500);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;

  input[type='checkbox'] {
    width: 14px;
    height: 14px;
    accent-color: var(--c-sky);
    cursor: pointer;
    margin: 0;
  }
`;

/** Кликабельный заголовок колонки — sort при click, ↑/↓ индикатор активной
    сортировки. На hover — цвет ink (более контрастный). */
const SortableHeader = styled.button`
  appearance: none;
  background: transparent;
  border: none;
  padding: 0;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  /* DS §10: <14px минимум --g600 (--g500 запрещён). */
  color: var(--g600);
  cursor: pointer;
  text-align: inherit;

  &:hover {
    color: var(--ink);
  }
  &.active {
    color: var(--c-sky);
  }
  &:focus-visible {
    outline: 2px solid var(--c-sky);
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

/** Pagination bar — нормальный flex-item внизу m-section (вне scrollable
    StoreList), всегда видна и до самого низа закрашена bg --s. */
const PaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  margin-top: 12px;
  padding: 10px 0 4px;
  background: var(--s);
  border-top: 1px solid var(--g200);
  font-family: var(--m);
  font-size: var(--fs-meta);
  color: var(--g500);
`;

const PageBtn = styled.button`
  appearance: none;
  background: var(--g100);
  border: 1px solid var(--g200);
  color: var(--ink);
  border-radius: 5px;
  padding: 4px 10px;
  cursor: pointer;
  font: inherit;
  transition: background 0.12s var(--ease), border-color 0.12s var(--ease);

  &:hover:not(:disabled) {
    background: var(--g200);
    border-color: var(--g300);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

interface Props {
  /** Quadrant-режим: показать stores конкретного quadrant'a.
      Null в selection-режиме (когда передан selectionIds). */
  quadrantKey: QuadrantKey | null;
  quadrants: Record<QuadrantKey, QuadrantDef>;
  thresholds: Thresholds;
  stores: StorePoint[];
  allStoresTotal: number;
  formatColorMap: Map<string, string>;
  formatX: FormatValueFn;
  formatY: FormatValueFn;
  formatLoss: FormatValueFn;
  formatCount: FormatValueFn;
  xShort: string;
  yShort: string;
  onClose: () => void;
  onOpenStore: (id: string) => void;
  /** Selection-режим: показать stores по списку ID (cross-filter selection).
      Когда задан, quadrantKey игнорируется, header показывает
      «Выбранные магазины» вместо quadrant title. */
  selectionIds?: string[];
  /** Override заголовка в selection-режиме (default: «Выбранные магазины»).
      Используется когда selectionIds = все stores (для «Все магазины»). */
  selectionTitle?: string;
  /** Override подзаголовка в selection-режиме. */
  selectionSubtitle?: string;
}

const PAGE_SIZE = 50;
type SortColumn = 'name' | 'x' | 'y';
type SortDirection = 'asc' | 'desc';

const QuadrantDrillModal: React.FC<Props> = ({
  quadrantKey,
  quadrants,
  thresholds,
  stores,
  allStoresTotal,
  formatColorMap,
  formatX,
  formatY,
  formatLoss,
  formatCount,
  xShort,
  yShort,
  onClose,
  onOpenStore,
  selectionIds,
  selectionTitle,
  selectionSubtitle,
}) => {
  const [q, setQ] = useState('');
  // Точный поиск (exact match): сравнение по === вместо includes. Toggle
  // через checkbox «Точно» рядом с search input.
  const [exactMatch, setExactMatch] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  // По умолчанию сортируем по имени по алфавиту.
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const isSelection = !!selectionIds;
  // qDef нужен только в quadrant-режиме (для color/label/description).
  // В selection-режиме используем neutral header (--c-sky accent).
  const qDef = !isSelection && quadrantKey ? quadrants[quadrantKey] : null;

  const inGroup = useMemo(() => {
    if (isSelection && selectionIds) {
      const setIds = new Set(selectionIds);
      return stores.filter((s) => setIds.has(s.id));
    }
    if (quadrantKey) {
      return stores.filter((s) => getQuadrant(s, thresholds) === quadrantKey);
    }
    return [];
  }, [stores, thresholds, quadrantKey, isSelection, selectionIds]);
  // Alias inQuadrant → inGroup для минимального touch'а ниже.
  const inQuadrant = inGroup;

  const totalLoss = useMemo(
    () => inQuadrant.reduce((sum, s) => sum + (s.sumLoss ?? 0), 0),
    [inQuadrant],
  );
  // Полный отсортированный/отфильтрованный список (без pagination cut).
  const sorted = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = inQuadrant;
    if (query) {
      list = inQuadrant.filter((s) => {
        const name = s.name.toLowerCase();
        if (exactMatch) return name === query;
        return name.includes(query);
      });
    }
    const sign = sortDirection === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'ru');
          break;
        case 'x':
          cmp = a.x - b.x;
          break;
        case 'y':
          cmp = a.y - b.y;
          break;
      }
      return cmp * sign;
    });
  }, [inQuadrant, q, exactMatch, sortColumn, sortDirection]);

  // Slice по pagination.
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages - 1);
  const filtered = useMemo(
    () => sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [sorted, safePage],
  );

  // Сброс на первую страницу при изменении поиска/сортировки/режима.
  useEffect(() => {
    setCurrentPage(0);
  }, [q, exactMatch, sortColumn, sortDirection]);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection(col === 'name' ? 'asc' : 'desc');
    }
  };
  const sortIcon = (col: SortColumn) => {
    if (sortColumn !== col) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const maxX = useMemo(
    () => (inQuadrant.length > 0 ? Math.max(...inQuadrant.map((s) => s.x)) * 1.1 : 1),
    [inQuadrant],
  );
  const maxY = useMemo(
    () =>
      inQuadrant.length > 0
        ? Math.max(...inQuadrant.map((s) => Math.max(0, s.y)), 0.1) * 1.1
        : 1,
    [inQuadrant],
  );

  const onBgClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const lossPct = allStoresTotal > 0 ? (inQuadrant.length / allStoresTotal) * 100 : 0;
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  return (
    <ModalBg data-open="true" onClick={onBgClick}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="sr-quad-title" ref={trapRef}>
        <div className="m-head">
          <div
            className="m-status"
            style={{ background: qDef ? qDef.color : 'var(--c-sky)' }}
          />
          <div className="m-titles">
            <div className="m-title" id="sr-quad-title">
              {qDef
                ? qDef.label.replace(/\s[⚠✓]$/, '')
                : selectionTitle ?? 'Выбранные магазины'}
            </div>
            <div className="m-sub">
              {qDef
                ? qDef.description
                : selectionSubtitle ?? 'Магазины, применённые как cross-filter'}
            </div>
          </div>
          <button type="button" className="m-close" onClick={onClose} aria-label="Закрыть">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>

        <div className="m-summary">
          <div className="m-stat">
            <div className="m-stat-l">Объектов</div>
            <div className="m-stat-v">{formatCount(inQuadrant.length)}</div>
            <div className="m-stat-d wn">
              {lossPct.toFixed(1)}% от всех
            </div>
          </div>
          {totalLoss > 0 && (
            <div className="m-stat">
              <div className="m-stat-l">Сумма потерь</div>
              <div
                className="m-stat-v"
                style={{ color: qDef ? qDef.color : 'var(--c-sky)' }}
              >
                {formatLoss(totalLoss)}
              </div>
            </div>
          )}
          <div className="m-stat">
            <div className="m-stat-l">Сред. {xShort}</div>
            <div className="m-stat-v">
              {formatX(
                inQuadrant.length > 0
                  ? inQuadrant.reduce((s, x) => s + x.x, 0) / inQuadrant.length
                  : 0,
              )}
            </div>
          </div>
          <div className="m-stat">
            <div className="m-stat-l">Сред. {yShort}</div>
            <div className="m-stat-v">
              {formatY(
                inQuadrant.length > 0
                  ? inQuadrant.reduce((s, x) => s + x.y, 0) / inQuadrant.length
                  : 0,
              )}
            </div>
          </div>
        </div>

        <div className="m-section">
          <div className="m-section-l">
            <span>{isSelection ? 'Выделенные объекты' : 'Объекты квадранта'}</span>
            <span className="count">
              {q.trim()
                ? `${sorted.length} из ${inQuadrant.length} найдено · показано ${filtered.length}`
                : `${inQuadrant.length} всего · показано ${filtered.length}`}
            </span>
          </div>
          <SearchRow>
            <ExactMatchLabel title="Сравнивать имя точно (==), а не как подстроку">
              <input
                type="checkbox"
                checked={exactMatch}
                onChange={(e) => setExactMatch(e.target.checked)}
              />
              Точно
            </ExactMatchLabel>
            <FullWidthSearchWrap className={q.length > 0 ? 'has-value' : ''}>
              <svg
                className="search-icon"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="6" cy="6" r="4" />
                <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" />
              </svg>
              <SearchInput
                type="text"
                placeholder={
                  exactMatch
                    ? 'Точный поиск по имени…'
                    : 'Поиск по имени…'
                }
                autoComplete="off"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Поиск по объектам"
              />
              <button
                type="button"
                className="search-clear"
                onClick={() => setQ('')}
                aria-label="Очистить"
              >
                <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="2" y1="2" x2="8" y2="8" />
                  <line x1="8" y1="2" x2="2" y2="8" />
                </svg>
              </button>
            </FullWidthSearchWrap>
          </SearchRow>

          {filtered.length === 0 ? (
            <EmptyBlock>
              Ничего не найдено{q.trim() ? ` по запросу «${q}»` : ''}
            </EmptyBlock>
          ) : (
            <StoreListHeader>
              <SortableHeader
                type="button"
                onClick={() => handleSort('name')}
                className={sortColumn === 'name' ? 'active' : ''}
                title="Сортировка по имени магазина"
              >
                Объект{sortIcon('name')}
              </SortableHeader>
              <SortableHeader
                type="button"
                onClick={() => handleSort('x')}
                className={sortColumn === 'x' ? 'active' : ''}
                title={`Сортировка по ${xShort}`}
              >
                <HeaderCellRight>{xShort}{sortIcon('x')}</HeaderCellRight>
              </SortableHeader>
              <HeaderCellMuted>факт vs план</HeaderCellMuted>
              <SortableHeader
                type="button"
                onClick={() => handleSort('y')}
                className={sortColumn === 'y' ? 'active' : ''}
                title={`Сортировка по ${yShort}`}
              >
                <HeaderCellRight>{yShort}{sortIcon('y')}</HeaderCellRight>
              </SortableHeader>
              <HeaderCellMuted>факт vs план</HeaderCellMuted>
            </StoreListHeader>
          )}
          <StoreList>
            {filtered.map((s, i) => {
              const color = formatColorMap.get(s.format) || 'var(--g500)';
              const dx = s.planX && s.planX !== 0 ? (s.x - s.planX) / s.planX : 0;
              const dy = s.planY && s.planY !== 0 ? (s.y - s.planY) / s.planY : 0;
              const dxCls = dx > 0.03 ? 'dn' : dx < -0.03 ? 'up' : 'wn';
              const dyCls = dy > 0.03 ? 'dn' : dy < -0.03 ? 'up' : 'wn';
              const xBarPct = (s.x / maxX) * 100;
              const xTargetPct = s.planX != null ? (s.planX / maxX) * 100 : 0;
              const yBarPct = (Math.max(0, s.y) / maxY) * 100;
              const yTargetPct = s.planY != null ? (s.planY / maxY) * 100 : 0;
              return (
                <StoreRow
                  key={s.id}
                  onClick={() => onOpenStore(s.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenStore(s.id);
                    }
                  }}
                >
                  <div className="name" title={s.name}>
                    {/* DS §07 «Цветная точка перед именем связывает таблицу
                        с графиком» — формат-цвет из formatColorMap, тот же
                        что у точки на scatter. */}
                    <span className="dot" style={{ background: color }} />
                    <span className="label">{s.name}</span>
                  </div>
                  <div
                    className={`cell-v ${dxCls}`}
                    title={
                      s.planX != null
                        ? `${xShort}: ${formatX(s.x)} (план ${formatX(s.planX)}, отклонение ${(dx * 100).toFixed(1)}%)`
                        : `${xShort}: ${formatX(s.x)}`
                    }
                  >
                    {formatX(s.x)}
                  </div>
                  <div
                    className="mini-bullet"
                    title={
                      s.planX != null
                        ? `${formatX(s.x)} vs план ${formatX(s.planX)}`
                        : `${formatX(s.x)} (план не задан)`
                    }
                  >
                    <div
                      className="mini-bar mini-bar--x"
                      style={{ width: `${xBarPct}%` }}
                    />
                    {s.planX != null && (
                      <div className="mini-target" style={{ left: `calc(${xTargetPct}% - 1px)` }} />
                    )}
                  </div>
                  <div
                    className={`cell-v ${dyCls}`}
                    title={
                      s.planY != null
                        ? `${yShort}: ${formatY(s.y)} (план ${formatY(s.planY)}, отклонение ${(dy * 100).toFixed(1)}%)`
                        : `${yShort}: ${formatY(s.y)}`
                    }
                  >
                    {formatY(s.y)}
                  </div>
                  <div
                    className="mini-bullet"
                    title={
                      s.planY != null
                        ? `${formatY(s.y)} vs план ${formatY(s.planY)}`
                        : `${formatY(s.y)} (план не задан)`
                    }
                  >
                    <div
                      className="mini-bar mini-bar--y"
                      style={{ width: `${yBarPct}%` }}
                    />
                    {s.planY != null && (
                      <div className="mini-target" style={{ left: `calc(${yTargetPct}% - 1px)` }} />
                    )}
                  </div>
                </StoreRow>
              );
            })}
          </StoreList>

          {totalPages > 1 && (
            <PaginationBar>
              <PageBtn
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                aria-label="Предыдущая страница"
              >
                ←
              </PageBtn>
              <span>
                Страница {safePage + 1} из {totalPages}
              </span>
              <PageBtn
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                aria-label="Следующая страница"
              >
                →
              </PageBtn>
            </PaginationBar>
          )}
        </div>
      </Modal>
    </ModalBg>
  );
};

export default QuadrantDrillModal;
