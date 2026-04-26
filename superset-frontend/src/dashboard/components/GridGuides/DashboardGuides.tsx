/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * DashboardGuides — рисует визуальные оверлеи поверх dashboard-grid:
 *  - Колонки: 12 вертикальных полос с настраиваемым columnGap.
 *  - Сетка ячеек: каждая колонка дополнительно разбита на квадраты,
 *    позиции точно совпадают с ChartHolder snap-grid.
 *
 * Cells позиционируются АБСОЛЮТНО (не CSS Grid distribute), потому что
 * иначе CSS-distributed cellW зависит от `containerW` (DOM-measurement),
 * а ChartHolder snap-grid использует `columnWidth` prop. Эти два
 * источника могут расходиться на subpixel из-за разных ResizeObserver'ов
 * и timing'а — что даёт визуальный drift между линиями чарта и cells.
 *
 * Абсолютное позиционирование с математически идентичной формулой
 * (= ChartHolder) гарантирует pixel-perfect alignment, потому что
 * cells и chart-snap считаются из одного `columnWidth` source.
 */
import { type FC, useEffect, useRef, useState } from 'react';
import { addAlpha, css, styled } from '@superset-ui/core';
import {
  GRID_COLUMN_COUNT,
  GRID_GUTTER_SIZE,
} from 'src/dashboard/util/constants';
import { useGridGuides } from './GridGuidesContext';

interface DashboardGuidesProps {
  /** true когда re-resizable активно ресайзит элемент. */
  isResizing: boolean;
  /** columnWidth от DashboardGrid. Используется для column overlay (12
   *  полос) И для sub-cell-grid (тот же source что и ChartHolder). */
  columnWidth: number;
}

const ColumnGuide = styled.div`
  ${({ theme }) => css`
    position: absolute;
    top: 0;
    min-height: 100%;
    background-color: ${addAlpha(theme.colorPrimary, 0.08)};
    pointer-events: none;
    box-shadow: inset 0 0 0 1px ${addAlpha(theme.colorPrimary, 0.45)};
  `};
`;

const CellGridOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
`;

const Cell = styled.div`
  ${({ theme }) => css`
    position: absolute;
    background-color: ${addAlpha(theme.colorPrimary, 0.04)};
    border: 1px dashed ${addAlpha(theme.colorPrimary, 0.25)};
    border-radius: 2px;
  `};
`;

const DEFAULT_CELL_HEIGHT_FALLBACK = 80;

export const DashboardGuides: FC<DashboardGuidesProps> = ({
  isResizing,
  columnWidth,
}) => {
  const {
    state: { showColumns, showGrid, columnGap, rowGap, subdivisions },
  } = useGridGuides();

  /* Container height нужен только для подсчёта rowsCount (сколько
     рядов уместить). Width НЕ используется — cellW считается из
     columnWidth prop (= идентично ChartHolder source). */
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (!showGrid) return undefined;
    const el = wrapperRef.current?.parentElement;
    if (!el) return undefined;
    const ro = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) setContainerHeight(e.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [showGrid]);

  const columnsActive = isResizing || showColumns;

  if (!columnsActive && !showGrid) return null;

  /* Total cells per row = 12 × subdivisions. */
  const sub = Math.max(1, subdivisions);
  const totalCols = GRID_COLUMN_COUNT * sub;

  /* cellW из columnWidth prop (тот же source что ChartHolder.subCellWidth)
     с Math.round чтобы получить integer pixels — ChartHolder использует
     ту же rounded формулу, чтобы snap позиции и cell позиции совпадали
     pixel-в-pixel без sub-pixel drift. */
  const cellW = columnWidth > 0
    ? Math.max(1, Math.round((columnWidth - (sub - 1) * columnGap) / sub))
    : DEFAULT_CELL_HEIGHT_FALLBACK;
  const cellH = cellW; // squares
  const subStepX = cellW + columnGap;
  const subStepY = cellH + rowGap;

  /* Сколько рядов рендерить: чтобы покрыть containerHeight + запас. */
  const rowsCount = Math.max(
    1,
    Math.ceil((containerHeight + rowGap) / subStepY) + 2,
  );

  /* Cell positions точно совпадают с ChartHolder snap:
       Cell at (col, row): left = col*subStepX, top = row*subStepY.
     Cell K-1 right edge = K*subStepX - colGap.
     Cell K-1 bottom edge = K*subStepY - rowGap.
     Это тот же math что ChartHolder.metaOuter использует. */
  const cells: { left: number; top: number; w: number; h: number }[] = [];
  for (let row = 0; row < rowsCount; row += 1) {
    for (let col = 0; col < totalCols; col += 1) {
      cells.push({
        left: col * subStepX,
        top: row * subStepY,
        w: cellW,
        h: cellH,
      });
    }
  }

  return (
    <div ref={wrapperRef} aria-hidden style={{ display: 'contents' }}>
      {showGrid && (
        <CellGridOverlay>
          {cells.map((c, i) => (
            <Cell
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              style={{
                left: c.left,
                top: c.top,
                width: c.w,
                height: c.h,
              }}
            />
          ))}
        </CellGridOverlay>
      )}
      {columnsActive &&
        Array.from({ length: GRID_COLUMN_COUNT }).map((_, i) => (
          <ColumnGuide
            // eslint-disable-next-line react/no-array-index-key
            key={`grid-column-${i}`}
            style={{
              left: i * GRID_GUTTER_SIZE + i * columnWidth,
              width: columnWidth,
            }}
          />
        ))}
    </div>
  );
};

export default DashboardGuides;
