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
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { ReactNode, useState, useCallback, useMemo } from 'react';
import { ResizeCallback, ResizeStartCallback, Resizable } from 're-resizable';
import cx from 'classnames';
import { css, styled } from '@superset-ui/core';

import {
  RightResizeHandle,
  BottomResizeHandle,
  BottomRightResizeHandle,
} from './ResizableHandle';
import resizableConfig from '../../util/resizableConfig';
import { GRID_BASE_UNIT, GRID_GUTTER_SIZE } from '../../util/constants';
import { useGridGuides } from '../GridGuides/GridGuidesContext';

const proxyToInfinity = Number.MAX_VALUE;

export interface ResizableContainerProps {
  id: string;
  children?: ReactNode;
  adjustableWidth?: boolean;
  adjustableHeight?: boolean;
  gutterWidth?: number;
  /** Vertical analog of gutterWidth — rowGap между cell-rows.
   *  Outer height = (heightStep + heightGutter)*heightMultiple - heightGutter.
   *  Без этого vertical snap'ил по K*subStepY (= top of next row),
   *  а должен по K*cellH + (K-1)*rowGap (= bottom of last cell). */
  heightGutter?: number;
  /** Опциональный «base columnWidth» для consumer'ов, работающих в
   *  col-mode (Column, Markdown, DynamicComponent). Когда задан И
   *  gridGuides.subdivisions > 1, ResizableContainer ОВЕРРАЙДИТ snap
   *  на sub-cell позиции, derived from columnWidth + subdivisions.
   *  Save (onResizeStop math) остаётся в col-units (passed widthStep+
   *  gutterWidth) — schema layout meta не меняется. ChartHolder этот
   *  prop НЕ передаёт, у него свой effectiveMode pipeline. */
  gridSnapColumnBase?: number;
  /** Точный outer width (px), переопределяющий линейную формулу
   *  `(widthStep + gutterWidth) * widthMultiple - gutterWidth`.
   *  Используется когда consumer (ChartHolder col-anchored metaOuter)
   *  знает точный размер с учётом sub-pixel: позволяет правому краю
   *  карточки совпасть pixel-в-pixel с правым краем cells overlay при
   *  non-integer columnWidth. Аналог для height. */
  outerWidthOverride?: number;
  outerHeightOverride?: number;
  widthStep?: number;
  heightStep?: number;
  widthMultiple: number;
  heightMultiple: number;
  minWidthMultiple?: number;
  maxWidthMultiple?: number;
  minHeightMultiple?: number;
  maxHeightMultiple?: number;
  staticHeight?: number;
  staticHeightMultiple?: number;
  staticWidth?: number;
  staticWidthMultiple?: number;
  onResizeStart?: ResizeStartCallback;
  onResize?: ResizeCallback;
  onResizeStop?: ResizeCallback;
  editMode: boolean;
}

const HANDLE_CLASSES = {
  right: 'resizable-container-handle--right',
  bottom: 'resizable-container-handle--bottom',
};
// @ts-ignore
const StyledResizable = styled(Resizable)`
  ${({ theme }) => css`
    &.resizable-container {
      background-color: transparent;
      position: relative;

      /* re-resizable sets an empty div to 100% width and height, which doesn't
      play well with many 100% height containers we need */

      & ~ div {
        width: auto !important;
        height: auto !important;
      }
    }

    &.resizable-container--resizing {
      /* after ensures border visibility on top of any children */

      &:after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-shadow: inset 0 0 0 2px ${theme.colorPrimary};
      }

      & > span .resize-handle {
        border-color: ${theme.colorPrimary};
      }
    }

    .resize-handle {
      opacity: 0;
      z-index: 10;

      &--bottom-right {
        position: absolute;
        border-right: 1px solid ${theme.colorSplit};
        border-bottom: 1px solid ${theme.colorSplit};
        right: ${theme.sizeUnit * 4}px;
        bottom: ${theme.sizeUnit * 4}px;
        width: ${theme.sizeUnit * 2}px;
        height: ${theme.sizeUnit * 2}px;
      }

      &--right {
        width: ${theme.sizeUnit / 2}px;
        height: ${theme.sizeUnit * 5}px;
        right: ${theme.sizeUnit}px;
        top: 50%;
        transform: translate(0, -50%);
        position: absolute;
        border-left: 1px solid ${theme.colorSplit};
        border-right: 1px solid ${theme.colorSplit};
      }

      &--bottom {
        height: ${theme.sizeUnit / 2}px;
        width: ${theme.sizeUnit * 5}px;
        bottom: ${theme.sizeUnit}px;
        left: 50%;
        transform: translate(-50%);
        position: absolute;
        border-top: 1px solid ${theme.colorSplit};
        border-bottom: 1px solid ${theme.colorSplit};
      }
    }
  `}

  &.resizable-container:hover .resize-handle,
  &.resizable-container--resizing .resize-handle {
    opacity: 1;
  }

  .dragdroppable-column & .resizable-container-handle--right {
    /* override the default because the inner column's handle's mouse target is very small */
    right: 0 !important;
  }

  & .resizable-container-handle--bottom {
    bottom: 0 !important;
  }
`;

export default function ResizableContainer({
  id,
  children,
  widthMultiple,
  heightMultiple,
  staticHeight,
  staticHeightMultiple,
  staticWidth,
  staticWidthMultiple,
  onResizeStop,
  onResize,
  onResizeStart,
  editMode,
  adjustableWidth = true,
  adjustableHeight = true,
  gutterWidth = GRID_GUTTER_SIZE,
  heightGutter = 0,
  widthStep = GRID_BASE_UNIT,
  heightStep = GRID_BASE_UNIT,
  gridSnapColumnBase,
  outerWidthOverride,
  outerHeightOverride,
  minWidthMultiple = 1,
  maxWidthMultiple = proxyToInfinity,
  minHeightMultiple = 1,
  maxHeightMultiple = proxyToInfinity,
}: ResizableContainerProps) {
  const [isResizing, setIsResizing] = useState<boolean>(false);

  /* GridGuides snap режимы. snapGrid + snapGridGap = точные cell-aligned
     позиции (см. формулу в snap memo ниже).
     - free-mode: grid=[1,1], gridGap=[0,0] — пиксельный snap
     - col-mode: grid=[colW, GRID_BASE_UNIT], gridGap=[GRID_GUTTER_SIZE, 0]
     - sub-mode: grid=[cellW, cellH], gridGap=[colGap, rowGap]
     onResizeStop math (widthMultiple+round(delta/(widthStep+gutterWidth)))
     остаётся ВСЁ ТЕМ ЖЕ: payload в нужных units (col/sub/free pixel). */
  const { state: gridGuides } = useGridGuides();
  /* TODO snap-to-neighbors: snap к рёбрам соседних чартов (выравнивание
     по краю существующего элемента вне основной grid-сетки). Требует
     отдельного слоя поверх re-resizable: на onResize считать DOM-
     позиции всех `.dashboard-component-chart-holder` в пределах
     родительского row, и если delta попадает в tolerance (например ±6px)
     к ребру соседа — pin'ить к нему. re-resizable controlled-mode не
     поддерживает custom snap targets, поэтому реализация = listen
     onResize → cancel default → mutate inline width/height вручную. */
  /* sub-mode: snap-array prop с явными позициями + snapGap для smooth
     drag.
     ChartHolder в sub-mode передаёт асимметричную формулу:
       horizontal OLD: outer = K*subStepX - colGap → snap.x[K] = K*subStepX - colGap
       vertical   NEW: outer = K*subStepY → snap.y[K] = K*subStepY
     `snapGap` (single number в re-resizable) контролирует когда snap
     срабатывает: free movement когда дальше snapGap от точки, snap к
     точке когда ближе. Это даёт плавный drag без jitter.

     col/free mode используют простой `grid` prop (snap не передаётся). */
  const snapPositions = useMemo<
    { x: number[]; y: number[] } | undefined
  >(() => {
    if (gridGuides.freeMode) return undefined;
    const sub = Math.max(1, gridGuides.subdivisions || 1);
    if (sub <= 1) return undefined;

    /* Два режима генерации snap-array:

       (A) gridSnapColumnBase задан (col-mode consumer: Column,
       Markdown, DynamicComponent). Производим sub-cell snap из
       columnWidth + sub.

       (B) gridSnapColumnBase не задан (ChartHolder с уже sub-настроенным
       widthStep/gutterWidth). Восстанавливаем columnWidth обратно из
       passed widthStep × sub + (sub-1) × gutterWidth, чтобы
       использовать одну col-anchored формулу для обеих веток.

       Snap-x вычисляется как правый край K-го sub-cell с привязкой к
       началу dashboard-колонки col = ceil(K/sub) - 1. subCellW float —
       без накопительного drift через 12 dashboard-колонок. Финальная
       round только на готовом px-значении (1 раз на K). */
    let baseColumnWidth: number;
    let baseColGap: number;
    let stepY: number;
    let gapY: number;
    if (gridSnapColumnBase != null && gridSnapColumnBase > 0) {
      baseColumnWidth = gridSnapColumnBase;
      baseColGap = gridGuides.columnGap;
      const subCellW = Math.max(
        1,
        (gridSnapColumnBase - (sub - 1) * baseColGap) / sub,
      );
      stepY = subCellW + gridGuides.rowGap;
      gapY = gridGuides.rowGap;
    } else {
      baseColumnWidth = widthStep * sub + (sub - 1) * gutterWidth;
      baseColGap = gutterWidth;
      stepY = heightStep + heightGutter;
      gapY = heightGutter;
    }

    const subCellWFloat = Math.max(
      1,
      (baseColumnWidth - (sub - 1) * baseColGap) / sub,
    );
    const colStepX = baseColumnWidth + GRID_GUTTER_SIZE;

    const xs: number[] = [];
    const ys: number[] = [];
    const maxCount = 200;
    for (let k = 1; k <= maxCount; k += 1) {
      const col = Math.ceil(k / sub) - 1;
      const s = (k - 1) % sub;
      const right =
        col * colStepX + s * (subCellWFloat + baseColGap) + subCellWFloat;
      xs.push(Math.round(right));
      ys.push(Math.round(k * stepY - gapY));
    }
    return { x: xs, y: ys };
  }, [
    gridGuides.freeMode,
    gridGuides.subdivisions,
    gridGuides.columnGap,
    gridGuides.rowGap,
    gridSnapColumnBase,
    widthStep,
    gutterWidth,
    heightStep,
    heightGutter,
  ]);

  /* snapGap = subStep/2: smooth drag, pull к snap-точке когда близко.
     Учитывает gridSnapColumnBase (col-mode consumer): step = subStep
     derived from columnWidth, не col-step. */
  const snapGap = useMemo<number>(() => {
    if (!snapPositions) return 0;
    const sub = Math.max(1, gridGuides.subdivisions || 1);
    let stepForGap: number;
    if (gridSnapColumnBase != null && gridSnapColumnBase > 0) {
      const colGap = gridGuides.columnGap;
      const subCellW = Math.max(
        1,
        Math.round((gridSnapColumnBase - (sub - 1) * colGap) / sub),
      );
      stepForGap = subCellW + colGap;
    } else {
      stepForGap = widthStep + gutterWidth;
    }
    return Math.max(8, Math.round(stepForGap / 2));
  }, [
    snapPositions,
    gridGuides.subdivisions,
    gridGuides.columnGap,
    gridSnapColumnBase,
    widthStep,
    gutterWidth,
  ]);

  /* snapGrid: используется ТОЛЬКО когда snapPositions undefined (col/free). */
  const snapGrid = useMemo<[number, number]>(() => {
    if (gridGuides.freeMode) return [1, 1];
    return [GRID_BASE_UNIT, GRID_BASE_UNIT];
  }, [gridGuides.freeMode]);

  const handleResize = useCallback<ResizeCallback>(
    (event, direction, elementRef, delta) => {
      if (onResize) onResize(event, direction, elementRef, delta);
    },
    [onResize],
  );

  const handleResizeStart = useCallback<ResizeStartCallback>(
    (e, dir, elementRef) => {
      if (onResizeStart) onResizeStart(e, dir, elementRef);
      setIsResizing(true);
    },
    [onResizeStart],
  );

  const handleResizeStop = useCallback<ResizeCallback>(
    (event, direction, elementRef, delta) => {
      if (onResizeStop) {
        const nextWidthMultiple =
          widthMultiple + Math.round(delta.width / (widthStep + gutterWidth));
        /* heightGutter (default 0 = legacy single-step). С heightGutter>0
           rounding по (heightStep+heightGutter) = subStepY. */
        const heightDivisor = heightStep + heightGutter;
        const nextHeightMultiple =
          heightMultiple + Math.round(delta.height / heightDivisor);

        onResizeStop(
          event,
          direction,
          elementRef,
          {
            width: adjustableWidth ? nextWidthMultiple : 0,
            height: adjustableHeight ? nextHeightMultiple : 0,
          },
          // @ts-ignore
          id,
        );
      }
      setIsResizing(false);
    },
    [
      onResizeStop,
      widthMultiple,
      heightMultiple,
      widthStep,
      heightStep,
      gutterWidth,
      adjustableWidth,
      adjustableHeight,
      id,
    ],
  );

  const size = useMemo(
    () => ({
      width: adjustableWidth
        ? (outerWidthOverride ??
          (widthStep + gutterWidth) * widthMultiple - gutterWidth)
        : (staticWidthMultiple && staticWidthMultiple * widthStep) ||
          staticWidth ||
          undefined,
      height: adjustableHeight
        ? (outerHeightOverride ??
          (heightStep + heightGutter) * heightMultiple - heightGutter)
        : (staticHeightMultiple && staticHeightMultiple * heightStep) ||
          staticHeight ||
          undefined,
    }),
    [
      adjustableWidth,
      outerWidthOverride,
      outerHeightOverride,
      widthStep,
      gutterWidth,
      widthMultiple,
      staticWidthMultiple,
      staticWidth,
      adjustableHeight,
      heightStep,
      heightGutter,
      heightMultiple,
      staticHeightMultiple,
      staticHeight,
    ],
  );

  const handleComponent = useMemo(
    () => ({
      right: <RightResizeHandle />,
      bottom: <BottomResizeHandle />,
      bottomRight: <BottomRightResizeHandle />,
    }),
    [],
  );

  const enableConfig = useMemo(() => {
    if (editMode && adjustableWidth && adjustableHeight) {
      return resizableConfig.widthAndHeight;
    }
    if (editMode && adjustableWidth) {
      return resizableConfig.widthOnly;
    }
    if (editMode && adjustableHeight) {
      return resizableConfig.heightOnly;
    }
    return resizableConfig.notAdjustable;
  }, [editMode, adjustableWidth, adjustableHeight]);

  return (
    <StyledResizable
      enable={enableConfig}
      {...(snapPositions
        ? { snap: snapPositions, snapGap, grid: undefined }
        : { grid: snapGrid })}
      minWidth={
        adjustableWidth
          ? minWidthMultiple * (widthStep + gutterWidth) - gutterWidth
          : undefined
      }
      minHeight={
        adjustableHeight
          ? minHeightMultiple * (heightStep + heightGutter) - heightGutter
          : undefined
      }
      maxWidth={
        adjustableWidth && size.width
          ? Math.max(
              size.width,
              Math.min(
                proxyToInfinity,
                maxWidthMultiple * (widthStep + gutterWidth) - gutterWidth,
              ),
            )
          : undefined
      }
      maxHeight={
        adjustableHeight && size.height
          ? Math.max(
              size.height,
              Math.min(
                proxyToInfinity,
                maxHeightMultiple * (heightStep + heightGutter) - heightGutter,
              ),
            )
          : undefined
      }
      size={size}
      onResizeStart={handleResizeStart}
      onResize={handleResize}
      onResizeStop={handleResizeStop}
      handleComponent={handleComponent}
      className={cx(
        'resizable-container',
        isResizing && 'resizable-container--resizing',
      )}
      handleClasses={HANDLE_CLASSES}
    >
      {children}
    </StyledResizable>
  );
}
