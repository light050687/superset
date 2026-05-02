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
import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import type { ConnectDragSource } from 'react-dnd';

import { ResizeCallback, ResizeStartCallback } from 're-resizable';
import cx from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { css, useTheme } from '@superset-ui/core';
import { resizeComponent } from 'src/dashboard/actions/dashboardLayout';
import { useGridGuides } from 'src/dashboard/components/GridGuides/GridGuidesContext';
import { LayoutItem, RootState } from 'src/dashboard/types';
import AnchorLink from 'src/dashboard/components/AnchorLink';
import Chart from 'src/dashboard/components/gridComponents/Chart';
import DeleteComponentButton from 'src/dashboard/components/DeleteComponentButton';
import { Draggable } from 'src/dashboard/components/dnd/DragDroppable';
import HoverMenu from 'src/dashboard/components/menu/HoverMenu';
import ResizableContainer from 'src/dashboard/components/resizable/ResizableContainer';
import getChartAndLabelComponentIdFromPath from 'src/dashboard/util/getChartAndLabelComponentIdFromPath';
import useFilterFocusHighlightStyles from 'src/dashboard/util/useFilterFocusHighlightStyles';
import { useChartViewportPriority } from 'src/dashboard/hooks/useChartViewportPriority';
import { useFetchStrategy } from 'src/dashboard/utils/fetchStrategy';
import { COLUMN_TYPE, ROW_TYPE } from 'src/dashboard/util/componentTypes';
import {
  GRID_BASE_UNIT,
  GRID_GUTTER_SIZE,
  GRID_MIN_COLUMN_COUNT,
  GRID_MIN_ROW_UNITS,
} from 'src/dashboard/util/constants';

export const CHART_MARGIN = 32;

interface ChartHolderProps {
  id: string;
  parentId: string;
  dashboardId: number;
  component: LayoutItem;
  parentComponent: LayoutItem;
  getComponentById?: (id?: string) => LayoutItem | undefined;
  index: number;
  depth: number;
  editMode: boolean;
  directPathLastUpdated?: number;
  fullSizeChartId: number | null;
  isComponentVisible: boolean;

  // grid related
  availableColumnCount: number;
  columnWidth: number;
  onResizeStart: ResizeStartCallback;
  onResize: ResizeCallback;
  onResizeStop: ResizeCallback;

  // dnd
  deleteComponent: (id: string, parentId: string) => void;
  updateComponents: Function;
  handleComponentDrop: (...args: unknown[]) => unknown;
  setFullSizeChartId: (chartId: number | null) => void;
  isInView: boolean;
}

const ChartHolder = ({
  id,
  parentId,
  component,
  parentComponent,
  index,
  depth,
  availableColumnCount,
  columnWidth,
  onResizeStart,
  onResize,
  onResizeStop,
  editMode,
  isComponentVisible,
  dashboardId,
  fullSizeChartId,
  getComponentById = () => undefined,
  deleteComponent,
  updateComponents,
  handleComponentDrop,
  setFullSizeChartId,
  isInView,
}: ChartHolderProps) => {
  const theme = useTheme();
  const fullSizeStyle = css`
    && {
      position: fixed !important;
      z-index: 3000;
      left: 0;
      top: 0;
      padding: ${theme.sizeUnit * 2}px;
    }
  `;
  const { chartId } = component.meta;
  const isFullSize = fullSizeChartId === chartId;

  // Responsive: measure actual container size via ResizeObserver
  const chartHolderRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement | null>;
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useEffect(() => {
    if (editMode || !chartHolderRef.current) return undefined;
    const el = chartHolderRef.current;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setMeasuredWidth(Math.floor(entry.contentRect.width));
        setMeasuredHeight(Math.floor(entry.contentRect.height));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [editMode]);

  // Viewport priority: chart регистрируется в shared IntersectionObserver
  // (один на дашборд). Возвращает isInView (для Chart skip runQuery если
  // lazy_offscreen=true) и priority (для chartFetchQueue ordering).
  const { isInView: isInViewport, priority: viewportPriority } =
    useChartViewportPriority(chartId, chartHolderRef);

  // Fetch strategy + chartStatus для skeleton overlay управления.
  const fetchStrategy = useFetchStrategy();
  const chartStatus = useSelector<RootState, string | undefined>(
    state => (state.charts as any)?.[chartId]?.chartStatus,
  );
  const isLoadingChart =
    chartStatus === 'loading' || chartStatus === undefined;
  const showSkeleton = fetchStrategy.show_skeletons && isLoadingChart;

  /* DS v2.0: per-viz_type minHeightMultiple override.
     KPI карточки (ext-kpi-card): минимум ~256px (= 4 cubic для desktop)
     для любого режима ResizableContainer (col/sub/free).
     Math: outer = (heightStep + heightGutter) × N - heightGutter
     Решая для outer = desiredMinPx: N = (desiredMinPx + gutter) / (step + gutter).
     В col-mode (step=8, gutter=0): 256/8 = 32 → outer 256px ✓
     В sub-mode (step=27, gutter=16): 272/43 ≈ 7 → outer ~285px ✓
     В free-mode (step=1, gutter=0): 256/1 = 256 → outer 256px ✓ */
  const vizType = useSelector<RootState, string | undefined>(
    state => (state.charts as any)?.[chartId]?.formData?.viz_type,
  );

  const focusHighlightStyles = useFilterFocusHighlightStyles(chartId);
  const directPathToChild = useSelector(
    (state: RootState) => state.dashboardState.directPathToChild,
  );
  const directPathLastUpdated = useSelector(
    (state: RootState) => state.dashboardState.directPathLastUpdated ?? 0,
  );

  const [extraControls, setExtraControls] = useState<Record<string, unknown>>(
    {},
  );
  const [outlinedComponentId, setOutlinedComponentId] = useState<string>();
  const [outlinedColumnName, setOutlinedColumnName] = useState<string>();
  const [currentDirectPathLastUpdated, setCurrentDirectPathLastUpdated] =
    useState(0);

  const infoFromPath = useMemo(
    () => getChartAndLabelComponentIdFromPath(directPathToChild ?? []) as any,
    [directPathToChild],
  );

  // Calculate if the chart should be outlined
  useEffect(() => {
    const { label: columnName, chart: chartComponentId } = infoFromPath;

    if (
      directPathLastUpdated !== currentDirectPathLastUpdated &&
      component.id === chartComponentId
    ) {
      setCurrentDirectPathLastUpdated(directPathLastUpdated);
      setOutlinedComponentId(component.id);
      setOutlinedColumnName(columnName);
    }
  }, [
    component,
    currentDirectPathLastUpdated,
    directPathLastUpdated,
    infoFromPath,
  ]);

  // Remove the chart outline after a defined time
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (outlinedComponentId) {
      timerId = setTimeout(() => {
        setOutlinedComponentId(undefined);
        setOutlinedColumnName(undefined);
      }, 2000);
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [outlinedComponentId]);

  const widthMultiple = useMemo(() => {
    const columnParentWidth = getComponentById(
      parentComponent.parents?.find(parent => parent.startsWith(COLUMN_TYPE)),
    )?.meta?.width;

    let widthMultiple = component.meta.width || GRID_MIN_COLUMN_COUNT;
    if (parentComponent.type === COLUMN_TYPE) {
      widthMultiple = parentComponent.meta.width || GRID_MIN_COLUMN_COUNT;
    } else if (columnParentWidth && widthMultiple > columnParentWidth) {
      widthMultiple = columnParentWidth;
    }

    return widthMultiple;
  }, [
    component,
    getComponentById,
    parentComponent.meta.width,
    parentComponent.parents,
    parentComponent.type,
  ]);

  const dispatch = useDispatch();
  const { state: gridGuides } = useGridGuides();

  /* metaOuter — outer pixel size исходя из ТЕКУЩЕГО состояния meta.
     Инвариант для render. Для sub-mode формула:
       outer = subStep * widthSub  (= cellW + colGap, без -colGap в конце)
     Это даёт canvas-right = cell-right edge (с учётом padding 16),
     то есть chart визуально занимает целое количество cell+gap'ов и
     правый край canvas совпадает с правой стенкой cell. */
  const metaOuter = useMemo(() => {
    const meta = component.meta as any;
    if (meta.freePxWidth != null && meta.freePxHeight != null) {
      return { w: meta.freePxWidth, h: meta.freePxHeight };
    }
    if (meta.widthSub != null && meta.subdivisionsUsed) {
      const sub = meta.subdivisionsUsed;
      const colGap = gridGuides.columnGap;
      const rowGap = gridGuides.rowGap;
      const subCellW = Math.max(
        1,
        Math.round((columnWidth - (sub - 1) * colGap) / sub),
      );
      /* Симметричная OLD formula:
         w: outer = K*subStepX - colGap (outer right = cell K-1 right)
         h: outer = K*subStepY - rowGap (outer bottom = cell K-1 bottom) */
      const w = (subCellW + colGap) * meta.widthSub - colGap;
      const h =
        meta.heightSub != null
          ? (subCellW + rowGap) * meta.heightSub - rowGap
          : component.meta.height * GRID_BASE_UNIT;
      return { w, h };
    }
    const w = (columnWidth + GRID_GUTTER_SIZE) * widthMultiple - GRID_GUTTER_SIZE;
    const h = component.meta.height * GRID_BASE_UNIT;
    return { w, h };
  }, [
    component.meta,
    columnWidth,
    widthMultiple,
    gridGuides.columnGap,
    gridGuides.rowGap,
  ]);

  /* Effective mode. gridGuides ВСЕГДА wins над meta-preserve, чтобы
     юзер мог "unstick" чарт сменой режима в drawer'е (раньше chart с
     meta.freePxWidth залипал в free даже когда юзер выключал free
     mode → 1px snap не работал).
     1. gridGuides.freeMode → 'free' (override)
     2. gridGuides.subdivisions > 1 → 'sub' с gridGuides.subdivisions (override)
     3. meta.widthSub есть → 'sub' с meta.subdivisionsUsed (preserve when no gridGuides override)
     4. иначе → 'col' (legacy default)

     Note: meta.freePxWidth НЕ инферится в 'free' автоматически. Когда
     юзер выключил freeMode, free-saved chart переводится в col/sub
     при render (visual size сохраняется через metaOuter conversion). */
  const { effectiveMode, effectiveSub } = useMemo(() => {
    const meta = component.meta as any;
    if (gridGuides.freeMode) {
      return { effectiveMode: 'free' as const, effectiveSub: 1 };
    }
    if (gridGuides.subdivisions > 1) {
      return {
        effectiveMode: 'sub' as const,
        effectiveSub: gridGuides.subdivisions,
      };
    }
    if (meta.widthSub != null && meta.subdivisionsUsed) {
      return {
        effectiveMode: 'sub' as const,
        effectiveSub: meta.subdivisionsUsed,
      };
    }
    return { effectiveMode: 'col' as const, effectiveSub: 1 };
  }, [component.meta, gridGuides.freeMode, gridGuides.subdivisions]);

  /* resizeConfig — параметры для ResizableContainer. Используем
     effectiveMode + metaOuter: chart всегда стартует с saved outer
     pixel size, конвертированным в текущие units (col/sub/free).

     Это даёт согласованность render и resize: render использует
     resizeConfig (через chartWidth memo ниже), ResizableContainer
     рендерит outer container с тем же размером. */
  const resizeConfig = useMemo(() => {
    if (effectiveMode === 'free') {
      return {
        widthStep: 1,
        gutterWidth: 0,
        widthMultiple: Math.max(80, Math.round(metaOuter.w)),
        heightStep: 1,
        heightMultipleResolved: Math.max(60, Math.round(metaOuter.h)),
        minWidthMultiple: 80,
        maxWidthMultiple: 99999,
        minHeightMultiple: 60,
        effectiveMode: 'free' as const,
      };
    }
    if (effectiveMode === 'sub') {
      const sub = effectiveSub;
      const colGap = gridGuides.columnGap;
      const rowGap = gridGuides.rowGap;
      const subCellWidth = Math.max(
        1,
        Math.round((columnWidth - (sub - 1) * colGap) / sub),
      );
      /* Симметричная OLD formula обе оси (outer на cell K-1 right/bottom):
           horizontal: widthStep=cellW, gutterWidth=colGap
                     → outer = K*subStepX - colGap
           vertical:   heightStep=cellH, heightGutter=rowGap
                     → outer = K*subStepY - rowGap
         Snap через snap-array prop + snapGap в ResizableContainer для
         плавного drag. Cells в DashboardGuides на тех же позициях. */
      const subStepX = subCellWidth + colGap;
      const subStepY = subCellWidth + rowGap;
      const startSubW = Math.max(1, Math.round((metaOuter.w + colGap) / subStepX));
      const startSubH = Math.max(1, Math.round((metaOuter.h + rowGap) / subStepY));
      return {
        widthStep: subCellWidth,
        gutterWidth: colGap,
        widthMultiple: startSubW,
        heightStep: subCellWidth, // cellH = cellW (squares)
        heightGutter: rowGap,
        heightMultipleResolved: startSubH,
        minWidthMultiple: GRID_MIN_COLUMN_COUNT,
        maxWidthMultiple: (availableColumnCount + widthMultiple) * sub,
        minHeightMultiple: 1,
        effectiveMode: 'sub' as const,
      };
    }
    /* col mode (legacy default). startColW конвертируется из metaOuter,
       чтобы при transition free→col сохранить визуальный размер
       (rounded к ближайшей col). Если meta только col-saved
       (нет freePxWidth/widthSub), metaOuter совпадает с
       widthMultiple-расчётом → startColW == widthMultiple. */
    const colStep = columnWidth + GRID_GUTTER_SIZE;
    const startColW = Math.max(
      1,
      Math.round((metaOuter.w + GRID_GUTTER_SIZE) / colStep),
    );
    const startColH = Math.max(
      1,
      Math.round(metaOuter.h / GRID_BASE_UNIT),
    );
    return {
      widthStep: columnWidth,
      gutterWidth: GRID_GUTTER_SIZE,
      widthMultiple: startColW,
      heightStep: GRID_BASE_UNIT,
      heightMultipleResolved: startColH,
      minWidthMultiple: GRID_MIN_COLUMN_COUNT,
      maxWidthMultiple: availableColumnCount + widthMultiple,
      effectiveMode: 'col' as const,
    };
  }, [
    effectiveMode,
    effectiveSub,
    metaOuter,
    gridGuides.columnGap,
    gridGuides.rowGap,
    columnWidth,
    widthMultiple,
    component.meta.height,
    availableColumnCount,
  ]);

  /* Dynamic minHeightMultiple для viz_type='ext-kpi-card'. Зависит от
     текущего режима resizeConfig (col/sub/free) — формула пересчитывает
     N units чтобы получить outer ≈ 256px на любом режиме. */
  const vizMinHeightMultiple = useMemo(() => {
    if (vizType !== 'ext-kpi-card') return undefined;
    const desiredMinPx = 256;
    const gutter = resizeConfig.heightGutter ?? 0;
    const step = resizeConfig.heightStep;
    if (step <= 0) return undefined;
    return Math.max(1, Math.ceil((desiredMinPx + gutter) / (step + gutter)));
  }, [vizType, resizeConfig.heightStep, resizeConfig.heightGutter]);

  const { chartWidth, chartHeight } = useMemo(() => {
    let width = 0;
    let height = 0;

    /* gridWidth/Height = inner-area size (outer container − CHART_MARGIN).
       Используем resizeConfig как единый источник истины: outer =
       (widthStep + gutterWidth) * widthMultiple - gutterWidth.
       Это гарантирует совпадение outer container size (Resizable) и
       inner chart size (Chart prop) во всех режимах. */
    const outerW =
      (resizeConfig.widthStep + resizeConfig.gutterWidth) *
        resizeConfig.widthMultiple -
      resizeConfig.gutterWidth;
    const heightGutter = resizeConfig.heightGutter ?? 0;
    const outerH =
      (resizeConfig.heightStep + heightGutter) *
        resizeConfig.heightMultipleResolved -
      heightGutter;
    const gridWidth = Math.floor(outerW - CHART_MARGIN);
    const gridHeight = Math.floor(outerH - CHART_MARGIN);
    /*
       Responsive-mode: только когда измеренная ширина МЕНЬШЕ расчётной
       (viewport не помещает grid — нужно сжать чарт). Расширение через
       responsive отключено: row flex-grow раздвигал одиночный чарт на
       весь row в view-mode — юзер видел after save график растянулся
       на всю ширину хотя meta.width=4. Сжатие сохраняем (mobile, narrow
       sidebar). Расширение убираем — в view-mode чарт уважает
       widthMultiple так же как в edit-mode.
    */
    const isResponsive =
      !editMode &&
      measuredWidth > 0 &&
      measuredWidth + GRID_BASE_UNIT < gridWidth + CHART_MARGIN;

    if (isFullSize) {
      width = window.innerWidth - CHART_MARGIN;
      height = window.innerHeight - CHART_MARGIN;
    } else if (isResponsive) {
      // Responsive: CSS overrides changed container size, use measured values
      width = measuredWidth - CHART_MARGIN;
      // Use measured height if container was stretched by flex (align-items: stretch)
      height =
        measuredHeight > 0 && measuredHeight > gridHeight + CHART_MARGIN
          ? measuredHeight - CHART_MARGIN
          : gridHeight;
    } else {
      width = gridWidth;
      height = gridHeight;
    }

    return {
      chartWidth: width,
      chartHeight: height,
    };
  }, [
    resizeConfig,
    editMode,
    isFullSize,
    measuredWidth,
    measuredHeight,
  ]);

  /* Wrap onResizeStop. ResizableContainer вернёт {width, height} в
     widthStep/heightStep единицах — для каждого режима они разные.
     Free: width в px, height в px → meta.freePxWidth/Height.
     Sub: width в sub-cells (1..12*sub), height в base-units → meta.widthSub/heightSub.
     Col: width в columns (1..12), height в base-units → meta.width/height (legacy).

     При смене режима юзером (через drawer toggle) первый resize
     инициирует переход: ChartHolder отправляет полный пейлоад
     ВКЛЮЧАЯ layoutMode, action очищает старые поля. */
  const handleResizeStopWrapped = useCallback<ResizeCallback>(
    (event, direction, elementRef, payload) => {
      const adjW = parentComponent.type === ROW_TYPE;
      const meta = component.meta as any;
      /* effectiveMode/effectiveSub задают units payload.width/height.
         Сохраняем строго в тех же units чтобы render после save был
         идентичен последнему положению curo'а. */
      if (effectiveMode === 'free') {
        dispatch(
          resizeComponent({
            id: component.id,
            layoutMode: 'free',
            freePxWidth: adjW
              ? Math.max(80, Math.round((payload as any).width))
              : meta.freePxWidth ?? Math.round(metaOuter.w),
            freePxHeight: Math.max(
              60,
              Math.round(
                (payload as any).height ||
                  meta.freePxHeight ||
                  metaOuter.h,
              ),
            ),
          }),
        );
      } else if (effectiveMode === 'sub') {
        dispatch(
          resizeComponent({
            id: component.id,
            layoutMode: 'sub',
            widthSub: adjW
              ? (payload as any).width
              : meta.widthSub || resizeConfig.widthMultiple,
            heightSub:
              (payload as any).height || meta.heightSub || component.meta.height,
            subdivisionsUsed: effectiveSub,
          }),
        );
      } else {
        /* col-mode (default). */
        dispatch(
          resizeComponent({
            id: component.id,
            layoutMode: 'col',
            width: adjW
              ? (payload as any).width
              : meta.width || resizeConfig.widthMultiple,
            height:
              (payload as any).height ||
              meta.height ||
              resizeConfig.heightMultipleResolved,
          }),
        );
      }
    },
    [
      dispatch,
      effectiveMode,
      effectiveSub,
      resizeConfig,
      metaOuter,
      component.id,
      component.meta,
      parentComponent.type,
    ],
  );

  const handleDeleteComponent = useCallback(() => {
    deleteComponent(id, parentId);
  }, [deleteComponent, id, parentId]);

  const handleUpdateSliceName = useCallback(
    (nextName: string) => {
      updateComponents({
        [component.id]: {
          ...component,
          meta: {
            ...component.meta,
            sliceNameOverride: nextName,
          },
        },
      });
    },
    [component, updateComponents],
  );

  const handleToggleFullSize = useCallback(() => {
    setFullSizeChartId(isFullSize ? null : chartId);
  }, [chartId, isFullSize, setFullSizeChartId]);

  const handleExtraControl = useCallback((name: string, value: unknown) => {
    setExtraControls(current => ({
      ...current,
      [name]: value,
    }));
  }, []);

  const renderChild = useCallback(
    ({ dragSourceRef }: { dragSourceRef?: ConnectDragSource }) => (
      <ResizableContainer
        id={component.id}
        adjustableWidth={parentComponent.type === ROW_TYPE}
        adjustableHeight
        widthStep={resizeConfig.widthStep}
        gutterWidth={resizeConfig.gutterWidth}
        widthMultiple={resizeConfig.widthMultiple}
        heightStep={resizeConfig.heightStep}
        heightGutter={resizeConfig.heightGutter ?? 0}
        heightMultiple={resizeConfig.heightMultipleResolved}
        minWidthMultiple={resizeConfig.minWidthMultiple}
        minHeightMultiple={
          vizMinHeightMultiple ??
          resizeConfig.minHeightMultiple ??
          GRID_MIN_ROW_UNITS
        }
        maxWidthMultiple={resizeConfig.maxWidthMultiple}
        onResizeStart={onResizeStart}
        onResize={onResize}
        onResizeStop={handleResizeStopWrapped}
        editMode={editMode}
      >
        <div
          ref={(node: HTMLDivElement | null) => {
            if (typeof dragSourceRef === 'function') {
              dragSourceRef(node);
            } else if (dragSourceRef) {
              (dragSourceRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
            chartHolderRef.current = node;
          }}
          data-test="dashboard-component-chart-holder"
          style={{
            ...focusHighlightStyles,
            position: 'relative',
          }}
          css={isFullSize ? fullSizeStyle : undefined}
          className={cx(
            'dashboard-component',
            'dashboard-component-chart-holder',
            `dashboard-chart-id-${chartId}`,
            outlinedComponentId ? 'fade-in' : 'fade-out',
          )}
        >
          {!editMode && (
            <AnchorLink
              id={component.id}
              scrollIntoView={outlinedComponentId === component.id}
            />
          )}
          {!!outlinedComponentId && (
            <style>
              {`label[for=${outlinedColumnName}] + .Select .Select__control {
                    border-color: #00736a;
                    transition: border-color 1s ease-in-out;
                  }`}
            </style>
          )}
          {/* DS 2.0 skeleton overlay — shimmer pulse поверх chart'а пока
              он в loading state. fade-out когда chart settled через CSS
              transition. Chart остаётся mounted под ним. */}
          {showSkeleton && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                borderRadius: 10,
                background:
                  'linear-gradient(110deg, var(--g100) 8%, var(--g200) 18%, var(--g100) 33%)',
                backgroundSize: '200% 100%',
                animation:
                  'ds2-skeleton-shimmer 1.6s ease-in-out infinite',
                pointerEvents: 'none',
                transition: 'opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          )}
          <Chart
            componentId={component.id}
            id={component.meta.chartId}
            dashboardId={dashboardId}
            width={chartWidth}
            height={chartHeight}
            sliceName={
              component.meta.sliceNameOverride || component.meta.sliceName || ''
            }
            updateSliceName={handleUpdateSliceName}
            isComponentVisible={isComponentVisible}
            handleToggleFullSize={handleToggleFullSize}
            isFullSize={isFullSize}
            setControlValue={handleExtraControl}
            extraControls={extraControls}
            isInView={isInView && isInViewport}
            lazyOffscreen={fetchStrategy.lazy_offscreen}
            fetchPriority={viewportPriority}
            dashboardEditMode={editMode}
          />
          {editMode && (
            <HoverMenu position="top">
              <div data-test="dashboard-delete-component-button">
                <DeleteComponentButton onDelete={handleDeleteComponent} />
              </div>
            </HoverMenu>
          )}
        </div>
      </ResizableContainer>
    ),
    [
      component.id,
      component.meta.height,
      component.meta.chartId,
      component.meta.sliceNameOverride,
      component.meta.sliceName,
      parentComponent.type,
      resizeConfig,
      onResizeStart,
      onResize,
      handleResizeStopWrapped,
      editMode,
      focusHighlightStyles,
      isFullSize,
      fullSizeStyle,
      chartId,
      outlinedComponentId,
      outlinedColumnName,
      dashboardId,
      chartWidth,
      chartHeight,
      handleUpdateSliceName,
      isComponentVisible,
      handleToggleFullSize,
      handleExtraControl,
      extraControls,
      isInView,
      handleDeleteComponent,
    ],
  );

  return (
    <Draggable
      component={component}
      parentComponent={parentComponent}
      orientation={parentComponent.type === ROW_TYPE ? 'column' : 'row'}
      index={index}
      depth={depth}
      onDrop={handleComponentDrop}
      disableDragDrop={false}
      editMode={editMode}
    >
      {renderChild}
    </Draggable>
  );
};

export default memo(ChartHolder);
