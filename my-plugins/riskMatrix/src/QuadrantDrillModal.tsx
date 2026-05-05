import React, { useMemo, useState } from 'react';
import { styled } from '@superset-ui/core';
import {
  StorePoint,
  QuadrantDef,
  QuadrantKey,
  FormatValueFn,
} from './types';
import { getQuadrant, storeBadness, Thresholds } from './utils/quadrants';
import { ModalBg, Modal, StoreRow, SearchWrap, SearchInput, EmptyBlock } from './styles';
import { useFocusTrap } from './utils/useFocusTrap';

/* === Локальные styled-обёртки (миграция inline style → Emotion, P-011) === */

/** Контейнер для поиска поверх списка квадранта. */
const SearchContainer = styled.div`
  margin-bottom: 10px;
`;

/** Заголовочная строка таблицы объектов квадранта (#, имя, X, бар X, Y, бар Y). */
const StoreListHeader = styled.div`
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 60px minmax(120px, 180px) 60px minmax(120px, 180px);
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  font-family: var(--m);
  /* DS v2.0 P0: 8.5px → --fs-nano (10) UPPER */
  font-size: var(--fs-nano);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--g500);
  border-bottom: 1px solid var(--g200);
  margin-bottom: 6px;
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

/** Колонка-обёртка для строк объектов в квадранте. */
const StoreList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/** Обёртка SearchWrap, занимающая всю ширину секции. */
const FullWidthSearchWrap = styled(SearchWrap)`
  width: 100%;
`;

interface Props {
  quadrantKey: QuadrantKey;
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
}

const LIMIT = 50;

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
}) => {
  const [q, setQ] = useState('');
  const qDef = quadrants[quadrantKey];

  const inQuadrant = useMemo(
    () => stores.filter((s) => getQuadrant(s, thresholds) === quadrantKey),
    [stores, thresholds, quadrantKey],
  );

  const totalLoss = useMemo(
    () => inQuadrant.reduce((sum, s) => sum + (s.sumLoss ?? 0), 0),
    [inQuadrant],
  );
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = query
      ? inQuadrant.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            (s.city?.toLowerCase().includes(query) ?? false),
        )
      : inQuadrant;
    return [...list].sort((a, b) => storeBadness(b) - storeBadness(a)).slice(0, LIMIT);
  }, [inQuadrant, q]);

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
          <div className="m-status" style={{ background: qDef.color }} />
          <div className="m-titles">
            <div className="m-title" id="sr-quad-title">
              {qDef.label.replace(/\s[⚠✓]$/, '')}
            </div>
            <div className="m-sub">{qDef.description}</div>
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
              <div className="m-stat-v" style={{ color: qDef.color }}>
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
            <span>Объекты квадранта</span>
            <span className="count">
              {q.trim()
                ? `${filtered.length} из ${inQuadrant.length} найдено`
                : `${inQuadrant.length} всего · показано ${filtered.length}`}
            </span>
          </div>
          <SearchContainer>
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
                placeholder="Поиск по имени или городу…"
                autoComplete="off"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Поиск по объектам квадранта"
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
          </SearchContainer>

          {filtered.length === 0 ? (
            <EmptyBlock>
              Ничего не найдено{q.trim() ? ` по запросу «${q}»` : ''}
            </EmptyBlock>
          ) : (
            <StoreListHeader>
              <HeaderCellCenter>#</HeaderCellCenter>
              <span>Объект</span>
              <HeaderCellRight>{xShort}</HeaderCellRight>
              <HeaderCellMuted>факт vs план</HeaderCellMuted>
              <HeaderCellRight>{yShort}</HeaderCellRight>
              <HeaderCellMuted>факт vs план</HeaderCellMuted>
            </StoreListHeader>
          )}
          <StoreList>
            {filtered.map((s, i) => {
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
                  title={`${s.name} · ${xShort}: ${formatX(s.x)} · ${yShort}: ${formatY(s.y)}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenStore(s.id);
                    }
                  }}
                >
                  <div className="rank">{String(i + 1).padStart(2, '0')}</div>
                  <div className="name">
                    {s.name}
                    {s.city && <span className="city">{s.city}</span>}
                  </div>
                  <div className={`cell-v ${dxCls}`}>{formatX(s.x)}</div>
                  <div className="mini-bullet">
                    <div
                      className="mini-bar mini-bar--x"
                      style={{ width: `${xBarPct}%` }}
                    />
                    {s.planX != null && (
                      <div className="mini-target" style={{ left: `calc(${xTargetPct}% - 1px)` }} />
                    )}
                  </div>
                  <div className={`cell-v ${dyCls}`}>{formatY(s.y)}</div>
                  <div className="mini-bullet">
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
        </div>
      </Modal>
    </ModalBg>
  );
};

export default QuadrantDrillModal;
