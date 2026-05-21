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
import {
  resizeComponent,
  resizeComponentWithShrinkingNeighbors,
} from 'src/dashboard/actions/dashboardLayout';
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
  GRID_COLUMN_COUNT,
  GRID_GUTTER_SIZE,
  GRID_MIN_COLUMN_COUNT,
  GRID_MIN_ROW_UNITS,
} from 'src/dashboard/util/constants';
import { VIZ_SHAPE_SKELETONS } from './skeletonRegistry';

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
  /* widthLeft/rightSiblingsCount — для push-shrink resize в col-mode.
     Передаются из Row.jsx; defaults безопасны (Chart вне Row, например
     внутри Column, ведёт себя как раньше). */
  widthLeft?: number;
  rightSiblingsCount?: number;
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
  widthLeft = 0,
  rightSiblingsCount = 0,
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
  const chartHolderRef = useRef<HTMLDivElement>(
    null,
  ) as React.MutableRefObject<HTMLDivElement | null>;
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
  const isLoadingChart = chartStatus === 'loading' || chartStatus === undefined;
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
     Инвариант для render.

     Для sub-mode используется col-anchored формула: правый край
     K-го sub-cell вычисляется относительно начала dashboard-колонки
     `col`, в которую этот sub-cell попадает. subCellW остаётся float
     (без Math.round), чтобы за 12 dashboard-колонок не накапливать
     sub-pixel drift — иначе snap карточки и cells overlay
     рассинхронизируются на ~3-4px (см. DashboardGuides.tsx).

     Для default columnGap == GRID_GUTTER_SIZE col-anchored math
     эквивалентен линейной (subCellW+colGap)*K - colGap, но при
     custom columnGap col-anchored остаётся точным (cells выровнены
     с реальными dashboard-колонками независимо от gap'ов). */
  const metaOuter = useMemo(() => {
    const meta = component.meta as any;
    if (meta.freePxWidth != null && meta.freePxHeight != null) {
      return { w: meta.freePxWidth, h: meta.freePxHeight };
    }
    if (meta.widthSub != null && meta.subdivisionsUsed) {
      const sub = meta.subdivisionsUsed;
      const colGap = gridGuides.columnGap;
      const { rowGap } = gridGuides;
      const subCellWFloat = Math.max(
        1,
        (columnWidth - (sub - 1) * colGap) / sub,
      );
      const K = meta.widthSub as number;
      const col = Math.ceil(K / sub) - 1;
      const s = (K - 1) % sub;
      const w =
        col * (columnWidth + GRID_GUTTER_SIZE) +
        s * (subCellWFloat + colGap) +
        subCellWFloat;
      const h =
        meta.heightSub != null
          ? (subCellWFloat + rowGap) * meta.heightSub - rowGap
          : component.meta.height * GRID_BASE_UNIT;
      return { w, h };
    }
    const w =
      (columnWidth + GRID_GUTTER_SIZE) * widthMultiple - GRID_GUTTER_SIZE;
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
      /* pixelStep — настраиваемый шаг snap из GridGuidesContext.
         Default = 1 (полная пиксельная свобода, прежнее поведение).
         widthMultiple/heightMultiple теперь в единицах step, чтобы
         итоговый px-размер (step * multiple) не зависел от step. */
      const step = Math.max(1, gridGuides.pixelStep);
      const minW = Math.ceil(80 / step);
      const minH = Math.ceil(60 / step);
      return {
        widthStep: step,
        gutterWidth: 0,
        widthMultiple: Math.max(minW, Math.round(metaOuter.w / step)),
        heightStep: step,
        heightMultipleResolved: Math.max(minH, Math.round(metaOuter.h / step)),
        minWidthMultiple: minW,
        maxWidthMultiple: 99999,
        minHeightMultiple: minH,
        effectiveMode: 'free' as const,
      };
    }
    if (effectiveMode === 'sub') {
      const sub = effectiveSub;
      const colGap = gridGuides.columnGap;
      const { rowGap } = gridGuides;
      /* widthStep для re-resizable — integer (re-resizable плохо
         работает с float grid/snap значениями: при float step delta
         округляется некорректно и chart resize становится unstable).
         metaOuter и snap-positions всё равно используют float
         формулу через col-anchored math (см. metaOuter и
         ResizableContainer.snapPositions). */
      const subCellWidth = Math.max(
        1,
        Math.round((columnWidth - (sub - 1) * colGap) / sub),
      );
      const subStepX = subCellWidth + colGap;
      const subStepY = subCellWidth + rowGap;
      const startSubW = Math.max(
        1,
        Math.round((metaOuter.w + colGap) / subStepX),
      );
      const startSubH = Math.max(
        1,
        Math.round((metaOuter.h + rowGap) / subStepY),
      );
      /* Push-shrink maxWidth для sub-mode: зеркально col-mode, но в
         sub-cells. widthLeft (в col-units) умножаем на sub чтобы перейти
         в sub-cells текущего effectiveSub. */
      const pushShrinkMaxSub =
        parentComponent.type === ROW_TYPE
          ? GRID_COLUMN_COUNT * sub -
            widthLeft * sub -
            rightSiblingsCount * GRID_MIN_COLUMN_COUNT
          : (availableColumnCount + widthMultiple) * sub;
      return {
        widthStep: subCellWidth,
        gutterWidth: colGap,
        widthMultiple: startSubW,
        heightStep: subCellWidth, // cellH = cellW (squares)
        heightGutter: rowGap,
        heightMultipleResolved: startSubH,
        minWidthMultiple: GRID_MIN_COLUMN_COUNT,
        maxWidthMultiple: Math.max(GRID_MIN_COLUMN_COUNT, pushShrinkMaxSub),
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
    const startColH = Math.max(1, Math.round(metaOuter.h / GRID_BASE_UNIT));
    /* Push-shrink maxWidth: чарт может расшириться вправо до края Row,
       сжимая соседей справа до GRID_MIN_COLUMN_COUNT каждый. Когда
       rightSiblingsCount=0 (один чарт в Row или последний справа), формула
       сводится к старому поведению (GRID_COLUMN_COUNT - widthLeft = available
       + widthMultiple). */
    const pushShrinkMax =
      parentComponent.type === ROW_TYPE
        ? GRID_COLUMN_COUNT -
          widthLeft -
          rightSiblingsCount * GRID_MIN_COLUMN_COUNT
        : availableColumnCount + widthMultiple;
    return {
      widthStep: columnWidth,
      gutterWidth: GRID_GUTTER_SIZE,
      widthMultiple: startColW,
      heightStep: GRID_BASE_UNIT,
      heightMultipleResolved: startColH,
      minWidthMultiple: GRID_MIN_COLUMN_COUNT,
      maxWidthMultiple: Math.max(GRID_MIN_COLUMN_COUNT, pushShrinkMax),
      effectiveMode: 'col' as const,
    };
  }, [
    effectiveMode,
    effectiveSub,
    metaOuter,
    gridGuides.columnGap,
    gridGuides.rowGap,
    gridGuides.pixelStep,
    columnWidth,
    widthMultiple,
    component.meta.height,
    availableColumnCount,
    parentComponent.type,
    widthLeft,
    rightSiblingsCount,
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

  const { chartWidth, chartHeight, outerH } = useMemo(() => {
    /* Для ext-* плагинов wrapper.padding=0 (DashboardBuilder.tsx
       reset для всех ext-* в `&:has(div[data-test-viz-type^='ext-'])`),
       поэтому Chart должен получить FULL outer без CHART_MARGIN —
       иначе визуал на 32px меньше синей рамки ResizableContainer и
       юзер видит зазор в edit-mode. Standard charts (table, bar,
       big_number и т.п.) рендерятся в wrapper с padding:32px →
       CHART_MARGIN компенсирует, поведение не меняется. */
    const isExt = typeof vizType === 'string' && vizType.startsWith('ext-');
    const chartMargin = isExt ? 0 : CHART_MARGIN;

    let width = 0;
    let height = 0;

    /* gridWidth/Height = inner-area size (outer container − chartMargin).
       Используем metaOuter (col-anchored) как единый источник истины
       для outer pixel size: правый край карточки совпадает pixel-в-pixel
       с правым краем cells overlay в DashboardGuides при non-integer
       columnWidth. Math.round обязателен — тот же что cells overlay
       (Math.round(rightFloat)) для pixel-perfect alignment. */
    const outerW = Math.round(metaOuter.w);
    const outerH = Math.round(metaOuter.h);
    const gridWidth = Math.floor(outerW - chartMargin);
    const gridHeight = Math.floor(outerH - chartMargin);
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
      measuredWidth + GRID_BASE_UNIT < gridWidth + chartMargin;

    if (isFullSize) {
      width = window.innerWidth - chartMargin;
      height = window.innerHeight - chartMargin;
    } else if (isResponsive) {
      // Responsive: CSS overrides changed container size, use measured values
      width = measuredWidth - chartMargin;
      // Use measured height if container was stretched by flex (align-items: stretch)
      height =
        measuredHeight > 0 && measuredHeight > gridHeight + chartMargin
          ? measuredHeight - chartMargin
          : gridHeight;
    } else {
      width = gridWidth;
      height = gridHeight;
    }

    return {
      chartWidth: width,
      chartHeight: height,
      /* outerH = metaOuter.h (col-anchored). Используется как minHeight
         на chart-holder в loading state — гарантирует место для
         plugin-internal skeleton до mount плагина. */
      outerH,
    };
  }, [
    resizeConfig,
    metaOuter,
    editMode,
    isFullSize,
    measuredWidth,
    measuredHeight,
    vizType,
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
              : (meta.freePxWidth ?? Math.round(metaOuter.w)),
            freePxHeight: Math.max(
              60,
              Math.round(
                (payload as any).height || meta.freePxHeight || metaOuter.h,
              ),
            ),
          }),
        );
      } else if (effectiveMode === 'sub') {
        /* sub-mode. Push-shrink через новый thunk когда parent — Row.
           thunk сам конвертирует widthSub ↔ col-units и сжимает соседей
           с учётом их режима (col-saved / sub-saved). */
        const nextWidthSub = adjW
          ? (payload as any).width
          : meta.widthSub || resizeConfig.widthMultiple;
        const nextHeightSub =
          (payload as any).height || meta.heightSub || component.meta.height;
        if (adjW && parentComponent.type === ROW_TYPE) {
          dispatch(
            resizeComponentWithShrinkingNeighbors({
              id: component.id,
              widthSub: nextWidthSub,
              heightSub: nextHeightSub,
              layoutMode: 'sub',
              subdivisionsUsed: effectiveSub,
              parentId,
            }),
          );
        } else {
          dispatch(
            resizeComponent({
              id: component.id,
              layoutMode: 'sub',
              widthSub: nextWidthSub,
              heightSub: nextHeightSub,
              subdivisionsUsed: effectiveSub,
            }),
          );
        }
      } else {
        /* col-mode (default). Push-shrink через новый thunk: соседи справа
           сжимаются до GRID_MIN_COLUMN_COUNT когда текущий чарт растёт за
           границу свободного места. Для chart-в-Column (parentId не Row)
           thunk сам деградирует к resizeComponent. */
        const nextWidth = adjW
          ? (payload as any).width
          : meta.width || resizeConfig.widthMultiple;
        const nextHeight =
          (payload as any).height ||
          meta.height ||
          resizeConfig.heightMultipleResolved;
        if (adjW && parentComponent.type === ROW_TYPE) {
          dispatch(
            resizeComponentWithShrinkingNeighbors({
              id: component.id,
              width: nextWidth,
              height: nextHeight,
              parentId,
            }),
          );
        } else {
          dispatch(
            resizeComponent({
              id: component.id,
              layoutMode: 'col',
              width: nextWidth,
              height: nextHeight,
            }),
          );
        }
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
      parentId,
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
        /* Math.round обязателен — DashboardGuides рендерит cells с
           правым краем = Math.round(rightFloat). Без round'а size в
           re-resizable = float, CSS subpixel renderer даёт расхождение
           0-1px между правым краем карточки и правым краем cell. */
        outerWidthOverride={Math.round(metaOuter.w)}
        outerHeightOverride={Math.round(metaOuter.h)}
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
              (
                dragSourceRef as React.MutableRefObject<HTMLDivElement | null>
              ).current = node;
            }
            chartHolderRef.current = node;
          }}
          data-test="dashboard-component-chart-holder"
          style={{
            ...focusHighlightStyles,
            position: 'relative',
            /* minHeight = outerH (computed из meta.height, НЕ хардкод —
               та же formula что re-resizable inline height). Гарантирует
               что chart-holder имеет место в loading state до mount
               плагина. После mount плагин рендерит свой SkeletonBlock
               (KPI scorecard через aria-busy) внутри chart-holder с
               правильным padding/margin → 1:1 match с loaded card.
               Generic ChartHolder overlay скрывается через CSS
               `:has(aria-busy)` (DashboardBuilder.tsx) когда плагин
               self-renders skeleton. */
            minHeight: outerH,
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
          {/* DS 2.0 skeleton overlay. Если viz_type зарегистрирован в
              VIZ_SHAPE_SKELETONS — рендерим shape-skeleton (упрощённая
              копия plugin-DOM с правильной геометрией) для устранения
              CLS на ~40px между chunk-loading state и plugin-mounted
              state. Иначе fallback на generic ds2-shimmer (zero
              regression для native viz_type'ов).
              После того как плагин mount'ится со своим внутренним
              skeleton (aria-busy без data-shape-skeleton), CSS-rule
              в DashboardBuilder.tsx скрывает оба overlay через display:none. */}
          {showSkeleton &&
            (() => {
              const ShapeSkeleton = vizType
                ? VIZ_SHAPE_SKELETONS[vizType]
                : undefined;
              if (ShapeSkeleton) {
                return (
                  <ShapeSkeleton width={chartWidth} height={chartHeight} />
                );
              }
              return (
                <div
                  aria-hidden="true"
                  data-generic-shimmer="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    borderRadius: 10,
                    background:
                      'linear-gradient(110deg, var(--g100) 8%, var(--g200) 18%, var(--g100) 33%)',
                    backgroundSize: '200% 100%',
                    animation: 'ds2-skeleton-shimmer 1.6s ease-in-out infinite',
                    pointerEvents: 'none',
                    transition: 'opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              );
            })()}
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
