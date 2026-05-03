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
/* eslint-env browser */
import cx from 'classnames';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addAlpha,
  css,
  JsonObject,
  styled,
  t,
  useTheme,
} from '@superset-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { EmptyState, Loading } from '@superset-ui/core/components';
import { BasicErrorAlert } from 'src/components';
import { DS2_VARS } from 'src/theme/ds2';
import DashboardHeader from 'src/dashboard/components/Header';
import { Icons } from '@superset-ui/core/components/Icons';
import IconButton from 'src/dashboard/components/IconButton';
import { Droppable } from 'src/dashboard/components/dnd/DragDroppable';

/**
 * Shape of the object produced by DragDroppable's drop() handler
 * (src/dashboard/components/dnd/handleDrop.js) and consumed by the
 * untyped `handleComponentDrop` thunk.
 */
type DashboardDropResult = {
  source: { id: string | null; type?: string; index: number };
  destination?: { id: string; type: string; index: number };
  dragging: { id: string | number; type: string; meta?: Record<string, any> };
  position?: string;
};
import DashboardComponent from 'src/dashboard/containers/DashboardComponent';
import WithPopoverMenu from 'src/dashboard/components/menu/WithPopoverMenu';
import getDirectPathToTabIndex from 'src/dashboard/util/getDirectPathToTabIndex';
import { URL_PARAMS } from 'src/constants';
import { getUrlParam } from 'src/utils/urlUtils';
import {
  DashboardLayout,
  FilterBarOrientation,
  RootState,
} from 'src/dashboard/types';
import {
  setDirectPathToChild,
  setActivePagePath,
  setEditMode,
} from 'src/dashboard/actions/dashboardState';
import {
  deleteTopLevelTabs,
  handleComponentDrop,
  clearDashboardHistory,
} from 'src/dashboard/actions/dashboardLayout';
import {
  DASHBOARD_GRID_ID,
  DASHBOARD_ROOT_DEPTH,
  DASHBOARD_ROOT_ID,
  DashboardStandaloneMode,
} from 'src/dashboard/util/constants';
import { PAGES_TYPE } from 'src/dashboard/util/componentTypes';
import FilterBar from 'src/dashboard/components/nativeFilters/FilterBar';
import MobileFilterBar from 'src/dashboard/components/nativeFilters/FilterBar/MobileFilterBar';
import { useUiConfig } from 'src/components/UiConfigContext';
import {
  BUILDER_SIDEPANEL_WIDTH,
  EMPTY_CONTAINER_Z_INDEX,
} from 'src/dashboard/constants';
import { getRootLevelTabsComponent, shouldFocusTabs } from './utils';
import DashboardContainer from './DashboardContainer';
import { useNativeFilters } from './state';
import DashboardWrapper from './DashboardWrapper';
import { ViewportPriorityProvider } from 'src/dashboard/hooks/useChartViewportPriority';
import { useFetchStrategy } from 'src/dashboard/utils/fetchStrategy';
import { setQueueConcurrency } from 'src/dashboard/utils/chartFetchQueue';
import { isCurrentUserBot } from 'src/utils/isBot';
import {
  FeatureFlag,
  isFeatureEnabled,
} from '@superset-ui/core';

/* FiltersPanel + StickyPanel удалены вместе с renderChild() —
   вертикальный FilterBar теперь живёт в Drawer'е через DashboardSideRail. */

// @z-index-above-dashboard-popovers (99) + 1 = 100
const MOBILE_HEADER_BREAKPOINT = 570;

const StyledHeader = styled.div<{ filterBarWidth: number }>`
  ${({ theme, filterBarWidth }) => css`
    grid-column: 2;
    grid-row: 1;
    position: sticky;
    top: 0;
    z-index: 99;
    max-width: calc(100vw - ${filterBarWidth}px);

    @media (max-width: ${MOBILE_HEADER_BREAKPOINT}px) {
      position: static;
      z-index: auto;
    }

    .empty-droptarget:before {
      position: absolute;
      content: '';
      display: none;
      width: calc(100% - ${theme.sizeUnit * 2}px);
      height: calc(100% - ${theme.sizeUnit * 2}px);
      left: ${theme.sizeUnit}px;
      top: ${theme.sizeUnit}px;
      border: 1px dashed transparent;
      border-radius: ${theme.borderRadius}px;
      opacity: 0.5;
    }
  `}
`;

const StyledContent = styled.div<{
  fullSizeChartId: number | null;
}>`
  grid-column: 2;
  grid-row: 2;
  // @z-index-above-dashboard-header (100) + 1 = 101
  ${({ fullSizeChartId }) => fullSizeChartId && `z-index: 101;`}
`;

const DashboardContentWrapper = styled.div`
  ${({ theme }) => css`
    &.dashboard {
      position: relative;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      height: 100%;

      /* drop shadow for top-level tabs only */
      & .dashboard-component-tabs {
        box-shadow: 0 ${theme.sizeUnit}px ${theme.sizeUnit}px 0
          ${addAlpha(theme.colorBorderSecondary, 0.1)};
        padding-left: ${theme.sizeUnit *
        2}px; /* note this is added to tab-level padding, to match header */
      }

      .dropdown-toggle.btn.btn-primary .caret {
        color: ${theme.colorText};
      }

      .background--transparent {
        background-color: transparent;
      }

      .background--white {
        background-color: ${theme.colorBgContainer};
      }
    }
    &.dashboard--editing {
      .grid-row:after,
      .dashboard-component-tabs > .hover-menu:hover + div:after {
        border: 1px dashed transparent;
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: 1;
        pointer-events: none;
      }

      .grid-row.grid-row--hovered:after,
      .dashboard-component-tabs > .grid-row--hovered:after {
        border: 2px dashed ${theme.colorPrimary};
      }

      .resizable-container {
        & .dashboard-component-chart-holder {
          .dashboard-chart {
            .chart-container {
              cursor: move;
              opacity: 0.2;
            }

            .slice_container {
              /* disable chart interactions in edit mode */
              pointer-events: none;
            }
          }

          &:hover .dashboard-chart .chart-container {
            opacity: 0.7;
          }
        }

        &:hover,
        &.resizable-container--resizing:hover {
          & > .dashboard-component-chart-holder:after {
            border: 1px dashed ${theme.colorPrimary};
          }
        }
      }

      .resizable-container--resizing:hover > .grid-row:after,
      .hover-menu:hover + .grid-row:after,
      .dashboard-component-tabs > .hover-menu:hover + div:after {
        border: 1px dashed ${theme.colorPrimary};
        z-index: 2;
      }

      .grid-row:after,
      .dashboard-component-tabs > .hover-menu + div:after {
        border: 1px dashed ${theme.colorBorder};
      }

      /* provide hit area in case row contents is edge to edge */
      .dashboard-component-tabs-content {
        > .dragdroppable-row {
          padding-top: ${theme.sizeUnit * 4}px;
        }
      }

      .dashboard-component-chart-holder {
        &:after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 1;
          pointer-events: none;
          border: 1px solid transparent;
        }

        &:hover:after {
          border: 1px dashed ${theme.colorPrimary};
          z-index: 2;
        }
      }

      .contract-trigger:before {
        display: none;
      }
    }

    & .dashboard-component-tabs-content {
      & > div:not(:last-child):not(.empty-droptarget) {
        margin-bottom: ${theme.sizeUnit * 4}px;
      }

      & > .empty-droptarget {
        z-index: ${EMPTY_CONTAINER_Z_INDEX};
        position: absolute;
        width: 100%;
      }

      & > .empty-droptarget:first-of-type:not(.empty-droptarget--full) {
        height: ${theme.sizeUnit * 4}px;
        top: 0;
      }

      & > .empty-droptarget:last-child {
        height: ${theme.sizeUnit * 4}px;
        bottom: ${-theme.sizeUnit * 4}px;
      }
    }
  `}
`;

const StyledDashboardContent = styled.div<{
  editMode: boolean;
  marginLeft: number;
}>`
  ${({ theme, editMode, marginLeft }) => css`
    background-color: ${theme.colorBgLayout};
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    height: auto;
    flex: 1;

    .grid-container .dashboard-component-tabs {
      box-shadow: none;
      padding-left: 0;
    }

    .grid-container {
      /* without this, the grid will not get smaller upon toggling the builder panel on */
      width: 0;
      flex: 1;
      position: relative;
      margin: ${theme.sizeUnit * 4}px;
      margin-left: ${marginLeft}px;

      /* В edit-mode раньше здесь была компенсация
         max-width calc(100% - BUILDER_SIDEPANEL_WIDTH) —
         резервировала 374px справа под sticky-sidebar
         BuilderComponentPane. Sidebar убран (его роль теперь у
         BuilderDrawer'а), компенсация не нужна — дашборд
         занимает всю ширину с симметричными margin 32px. */

      /* this is the ParentSize wrapper */
    & > div:first-of-type {
        height: 100% !important;
      }
    }

    .dashboard-builder-sidepane {
      width: ${BUILDER_SIDEPANEL_WIDTH}px;
      z-index: 1;
    }

    .dashboard-component-chart-holder {
      width: 100%;
      height: 100%;
      /* Standard charts (table, bar, big_number и т.п.) имеют белый
         внутренний фон — нужен colorBgContainer на обёртке + 32px
         padding для дыхания. */
      background-color: ${theme.colorBgContainer};
      position: relative;
      padding: ${theme.sizeUnit * 4}px;
      overflow-y: visible;

      /* DS v2.0 chrome-removal для ВСЕХ ext-* плагинов: их визуал
         (внутренний Card с background:var(--s) + padding 16/20 + DS 2.0
         border) должен заполнять ResizableContainer без wrapper-chrome.
         Универсальный селектор покрывает все 10 плагинов сразу
         (scorecard, paretoAnalysis, drilldownDonut, divergingBars,
         pivotHeatmap, leaderboard, metricTimeSeries, riskMatrix,
         rankedBars, bulletChart) и любые будущие. */
      &:has(div[data-test-viz-type^='ext-']) {
        padding: 0;
        background-color: transparent;
      }

      /* DS v2.0 — Полный wrapper-reset для ext-* плагинов (1:1 с
         KpiCard.tsx injected style, но globally — для всех плагинов
         сразу, без необходимости каждому инжектить свой <style>):
         1. SliceHeader (chart-slice > div:first-child) — height 0,
            кнопка ⋮ всё ещё доступна через position:absolute + overflow:visible
         2. filter-counts (badge с цифрой 1) скрыт
         3. chart-container/dashboard-chart/chart-slice — без bg, border, shadow
         4. ВСЁ должно edge-to-edge заполнять resizable-container */
      &:has(div[data-test-viz-type^='ext-']) {
        & .chart-container,
        & .dashboard-chart,
        & .chart-slice {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          overflow: visible !important;
        }

        & .filter-counts {
          display: none !important;
        }

        /* SliceHeader collapse: height: 0 keeps the dot-menu accessible */
        & div[data-test-viz-type^='ext-'].chart-slice > div:first-child {
          height: 0 !important;
          min-height: 0 !important;
          max-height: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          overflow: visible !important;
          pointer-events: none !important;
        }

        & div[data-test-viz-type^='ext-'].chart-slice {
          position: relative !important;
          overflow: visible !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Dot-menu (⋮) внутри Card top-right, как у KPI карточки.
           SliceHeader collapsed выше до height:0, но header-controls
           (контейнер ⋮) поднимаем absolutely в правый верхний угол
           Card. Hover на chart-slice показывает (opacity 0→1) — не
           отвлекает от данных, но доступна. */
        & div[data-test-viz-type^='ext-'].chart-slice
          > div:first-child
          .header-controls {
          position: absolute !important;
          top: 8px !important;
          right: 12px !important;
          z-index: 100 !important;
          height: auto !important;
          overflow: visible !important;
          visibility: visible !important;
          pointer-events: auto !important;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        & div[data-test-viz-type^='ext-'].chart-slice:hover
          > div:first-child
          .header-controls,
        & div[data-test-viz-type^='ext-'].chart-slice
          > div:first-child
          .header-controls:focus-within {
          opacity: 1;
        }

        & div[data-test-viz-type^='ext-'] .slice-container {
          padding: 0 !important;
          margin: 0 !important;
        }

        & div[data-test-viz-type^='ext-'] .superset-legacy-chart,
        & div[data-test-viz-type^='ext-'] .chart-container > div {
          width: 100% !important;
          height: 100% !important;
        }
      }

      // transitionable traits to show filter relevance
      transition:
        opacity ${theme.motionDurationMid} ease-in-out,
        border-color ${theme.motionDurationMid} ease-in-out,
        box-shadow ${theme.motionDurationMid} ease-in-out;

      &.fade-in {
        border-radius: ${theme.borderRadius}px;
        box-shadow:
          inset 0 0 0 2px ${theme.colorPrimary},
          0 0 0 3px ${addAlpha(theme.colorPrimary, 0.1)};
      }

      &.fade-out {
        border-radius: ${theme.borderRadius}px;
        box-shadow: none;
      }

      & .missing-chart-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow-y: auto;
        justify-content: center;

        .missing-chart-body {
          font-size: ${theme.fontSizeSM}px;
          position: relative;
          display: flex;
        }
      }
    }

    /*
     * View-mode only responsive layout.
     * All selectors scoped via data-view-mode attribute (not applied in edit mode).
     */

    /* Prevent horizontal overflow in responsive view mode */
    &[data-view-mode="true"] {
      overflow-x: hidden;
    }

    /*
     * Equal-height cards: complete flex chain from grid-row down to chart container.
     * Every level must be display:flex + flex:1 so cards stretch to equal height.
     */
    &[data-view-mode="true"] .grid-row {
      align-items: stretch;
    }

    &[data-view-mode="true"] .dragdroppable-column {
      display: flex !important;
      flex-direction: column !important;
    }

    /*
       View-mode: чарт уважает inline width от re-resizable
       (widthMultiple * columnWidth) — РАВНО как в edit-mode. Никакого
       width:100%/max-width:100% override — это раньше распирало чарт
       на всю колонку, и view-mode выглядел иначе чем edit. Сохраняем
       только вертикальный flex-chain для equal-height stretch.
    */
    &[data-view-mode="true"] .resizable-container {
      display: flex !important;
      flex-direction: column !important;
      /* Override inline height — let flex chain control height */
      height: unset !important;
      /* НЕ добавлять flex: 1 1 auto / align-self здесь — это ломает
         charts: re-resizable inline width/height конфликтует с flex
         distribution → chart canvas получает 0×0. Stretch row
         достигается через .dragdroppable-column { align-self: stretch }
         и .dashboard-component-chart-holder { flex: 1 } (ниже). */
    }

    /* Таргетный flex-grow для resizable-container'ов которые содержат
       НЕ-canvas компоненты (KPI cards, markdown, header, divider, ext-*
       плагины с CSS-flow контентом). Без этого resizable-container с
       height: unset (=auto) рендерится по content-fit — KPI карточка
       с меньшим контентом (например Конверсия) короче сиблингов в той
       же row. С :has() селектор не применяется к native ECharts
       (echarts_*, mixed_chart и т.д.) — их inline height нужен для
       canvas measurement, иначе chart canvas = 0×0. */
    &[data-view-mode="true"]
      .resizable-container:has(.dashboard-markdown),
    &[data-view-mode="true"]
      .resizable-container:has(.dashboard-component-header),
    &[data-view-mode="true"]
      .resizable-container:has(.dashboard-component-divider),
    &[data-view-mode="true"]
      .resizable-container:has(div[data-test-viz-type^="ext-"]) {
      flex: 1 1 auto !important;
      align-self: stretch !important;
    }

    /* Skeleton placeholders во время loading должны соответствовать
       размеру финального компонента. Skeleton overlay в ChartHolder
       рендерится с position:absolute;inset:0 — его size = size
       chart-holder'а. До того как chart передал data-test-viz-type,
       :has() селектор выше не активен → resizable-container = content-fit
       = ~50px → skeleton тоже ~50px (узкая полоска вместо карточки).
       Решение: до chart-load resizable-container должен иметь min-height
       равной выcоте предполагаемой по resize-config (через flex-grow
       внутри stretched dragdroppable-column). */
    &[data-view-mode="true"] .dragdroppable-column > .resizable-container {
      min-height: 100% !important;
    }

    /* Если плагин сам рендерит свой loading-skeleton (aria-busy="true"
       на ВНУТРЕННЕМ компоненте — KPI scorecard, divergingBars и т.д.),
       прячем оба overlay'а chart-holder'а: и generic ds2-shimmer, и
       shape-skeleton. Плагин-internal skeleton имеет ТОЧНО ту же
       DOM-структуру что loaded content → visual size 1:1.
       Селектор :has([aria-busy="true"]:not([data-shape-skeleton="true"]))
       срабатывает только когда aria-busy ставит сам плагин (data-shape-
       skeleton имеет атрибут только наш shape-overlay), не reagueт на
       свой собственный shape-overlay. Без этого generic overlay /
       shape-overlay перекрывал плагин-internal skeleton (z-index выше). */
    &[data-view-mode="true"]
      .dashboard-component-chart-holder:has([aria-busy="true"]:not([data-shape-skeleton="true"]))
      > [data-generic-shimmer="true"],
    &[data-view-mode="true"]
      .dashboard-component-chart-holder:has([aria-busy="true"]:not([data-shape-skeleton="true"]))
      > [data-shape-skeleton="true"] {
      display: none !important;
    }

    &[data-view-mode="true"] .dashboard-component-chart-holder {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    &[data-view-mode="true"] .dashboard-chart {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    &[data-view-mode="true"] .chart-slice {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    &[data-view-mode="true"] .slice_container {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    &[data-view-mode="true"] .chart-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      /* Chart.tsx Styles div задаёт min-height: chartHeight px из props
         (Emotion class). В view-mode мы хотим row-equal-height: chart
         должен растягиваться на row max, а не оставаться фикс. высоты. */
      min-height: 0 !important;
      height: 100% !important;
    }

    /* Chart.tsx .slice_container задаёт height: chartHeight px фикс
         (Emotion). В view-mode override на 100% — flex chain контролирует. */
    &[data-view-mode="true"] .slice_container {
      flex: 1;
      height: 100% !important;
      min-height: 0 !important;
    }

    /* DS2 row equalization для markdown — тот же flex-chain что для
       charts. Без этого markdown короткий, чарт длинный → разные
       высоты в одном row. */
    &[data-view-mode="true"] .dashboard-markdown {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* WithPopoverMenu wrapper — важный промежуточный слой между
       .dragdroppable и .dashboard-markdown/.dashboard-component-header
       и т.д. Без flex здесь chain рвётся: markdown wrapper висит auto-height. */
    &[data-view-mode="true"] .with-popover-menu {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      align-self: stretch !important;
      min-height: 0;
    }

    /* dragdroppable wrapper в row (orient=column): растяжение по высоте
       сиблинга. Без этого markdown/header не получают max(row) даже если
       внутренние wrapper'ы flex. */
    &[data-view-mode="true"] .grid-row > .dragdroppable {
      align-self: stretch !important;
      display: flex !important;
      flex-direction: column !important;
      min-height: 0;
    }

    /* Markdown contents: пробросить flex через ResizableContainer и
       внутренний chart-holder, чтобы сам контент SafeMarkdown тоже
       занимал всю высоту row (а не прижимался к верху карточки).
       descendant (без >) — устойчиво к любым промежуточным wrapper'ам
       в кастомных форках. */
    &[data-view-mode="true"] .dashboard-markdown .resizable-container {
      flex: 1 1 auto !important;
      align-self: stretch !important;
      min-height: 0;
    }

    &[data-view-mode="true"]
      .dashboard-markdown
      .dashboard-component-chart-holder {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      min-height: 0;
    }

    /* Header в row рядом с chart/markdown подтягивается до высоты
       сиблинга. Текст центрируется по вертикали через justify-content.
       !important на всём — на случай если в кастомном форке Header.jsx
       inline-стилей или Emotion-styled override'ит. */
    &[data-view-mode="true"] .dashboard-component-header {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-self: stretch !important;
      min-height: 100% !important;
      height: 100% !important;
    }

    /* Divider — wrapper тянется на полную высоту row, hr остаётся
       центром. Future-proof для будущих divider-стилей с фоном. */
    &[data-view-mode="true"] .dashboard-component-divider {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-self: stretch !important;
      min-height: 100% !important;
      height: 100% !important;
    }

    /* Универсальный fallback для будущих ext-* плагинов: любой
       .dashboard-component внутри .resizable-container получает
       flex:1 — высота тянется до dashboard-component-chart-holder,
       дальше плагин сам пробрасывает по своей DOM-цепочке.
       descendant (без >) — устойчиво к промежуточным wrapper'ам. */
    &[data-view-mode="true"]
      .dragdroppable-column
      .resizable-container
      .dashboard-component {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      min-height: 0;
    }

    /* DS v2.0: propagate flex through anonymous wrapper divs для всех
       ext-* плагинов (раньше был только ext-kpi-card). Это нужно чтобы
       внутренний Card плагина (с height: 100%) растягивался на полную
       высоту resizable-container'а. Универсальный селектор покрывает
       все 10 плагинов и любые будущие ext-*. */
    &[data-view-mode="true"]
      div[data-test-viz-type^='ext-']
      .slice_container
      > div {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    &[data-view-mode="true"]
      div[data-test-viz-type^='ext-']
      .slice_container
      > div
      > div {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    &[data-view-mode="true"]
      div[data-test-viz-type^='ext-']
      .slice_container
      > div
      > div
      > div {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /*
     * View-mode layout = edit-mode layout. Чарты уважают widthMultiple
     * grid (re-resizable inline width). Никаких @container query overrides,
     * которые меняют доли колонок — это раньше делало view-mode визуально
     * отличным от edit-mode, и юзер видел разные размеры графиков.
     *
     * Container queries оставлены ТОЛЬКО ради мобильного сценария
     * (<425px → single column). Margin не переопределяется — остаётся
     * sizeUnit*4 (16px) такой же как в edit, чтобы отступы со всех
     * сторон были симметричны и идентичны между edit/view.
     */
    &[data-view-mode="true"] .grid-container {
      container-type: inline-size;
      container-name: grid;
    }

    /* ── Mobile (<425px): single column, для читаемости на телефонах ── */
    @container grid (max-width: 424px) {
      .grid-row {
        flex-wrap: wrap !important;
        gap: clamp(4px, 1cqi, 8px) !important;
      }
      .dragdroppable-row {
        margin-bottom: clamp(4px, 1cqi, 8px) !important;
      }
      .dragdroppable-row:last-child {
        margin-bottom: 0 !important;
      }
      .dragdroppable-column {
        flex: 1 1 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        margin-right: 0 !important;
      }
    }

    /* Hide filter panel on very narrow viewports (mobile) */
    @media only screen and (max-width: 549px) {
      [data-test="dashboard-filters-panel"] {
        display: none !important;
      }
    }
  `}
`;

/* SaveOverlay — квадратная карточка по центру экрана с иконкой сверху
   и подписью снизу. Появляется на время saveDashboardRequest (PUT
   /api/v1/dashboard/:id). Заменяет дефолтный <Loading floating/> —
   юзер просил квадрат с иконкой и подписью, не plain spinner. */
const SaveOverlayBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: ${DS2_VARS.drawerBg};
  backdrop-filter: ${DS2_VARS.drawerFilter};
  -webkit-backdrop-filter: ${DS2_VARS.drawerFilter};
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: saveOverlayFadeIn 0.18s ${DS2_VARS.ease};

  @keyframes saveOverlayFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const SaveOverlayCard = styled.div`
  width: 200px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  background: ${DS2_VARS.s};
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 16px;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.18),
    0 4px 12px rgba(0, 0, 0, 0.06);

  .save-icon {
    position: relative;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${DS2_VARS.cSky};
  }

  /* Spinner: SVG-обёртка вокруг иконки. Статичный полный круг (track)
     + вращающаяся 1/4-дуга (stripe). Только stripe крутится, track
     стоит — раньше border на ::before крутился целиком, выглядело
     как «дрожащий контур». SVG + transform: rotate с will-change даёт
     плавную GPU-ускоренную анимацию. */
  .save-spinner {
    position: absolute;
    inset: -10px;
    pointer-events: none;
  }
  .save-spinner-track {
    fill: none;
    stroke: color-mix(in oklab, ${DS2_VARS.cSky} 18%, transparent);
    stroke-width: 4;
  }
  .save-spinner-stripe {
    fill: none;
    stroke: ${DS2_VARS.cSky};
    stroke-width: 4;
    stroke-linecap: round;
    transform-origin: 50% 50%;
    transform-box: fill-box;
    animation: saveRing 0.9s linear infinite;
    will-change: transform;
  }

  .save-icon > svg:not(.save-spinner) {
    width: 30px;
    height: 30px;
  }

  .save-caption {
    font-family: ${DS2_VARS.fontSans};
    font-size: var(--fs-interactive);
    font-weight: 600;
    color: ${DS2_VARS.ink};
    letter-spacing: 0.01em;
  }

  @keyframes saveRing {
    to {
      transform: rotate(360deg);
    }
  }
`;

const DashboardBuilder = () => {
  const dispatch = useDispatch();
  const uiConfig = useUiConfig();
  const theme = useTheme();

  const dashboardLayout = useSelector<RootState, DashboardLayout>(
    state => state.dashboardLayout.present,
  );
  const editMode = useSelector<RootState, boolean>(
    state => state.dashboardState.editMode,
  );
  const canEdit = useSelector<RootState, boolean>(
    ({ dashboardInfo }) => dashboardInfo.dash_edit_perm,
  );
  const dashboardIsSaving = useSelector<RootState, boolean>(
    ({ dashboardState }) => dashboardState.dashboardIsSaving,
  );
  const fullSizeChartId = useSelector<RootState, number | null>(
    state => state.dashboardState.fullSizeChartId,
  );
  const filterBarOrientation = useSelector<RootState, FilterBarOrientation>(
    ({ dashboardInfo }) => dashboardInfo.filterBarOrientation,
  );

  // Apply concurrency limit to global chart fetch queue. Edit mode + bot
  // user → bypass через Infinity (немедленная отрисовка для drag/drop /
  // screenshot). Feature flag off → bypass (legacy behavior).
  const fetchStrategy = useFetchStrategy();
  useEffect(() => {
    const flagEnabled = isFeatureEnabled(
      FeatureFlag.EnableDashboardFetchStrategy as any,
    );
    if (!flagEnabled || editMode || isCurrentUserBot()) {
      setQueueConcurrency(Infinity);
    } else {
      setQueueConcurrency(fetchStrategy.concurrency);
    }
  }, [editMode, fetchStrategy.concurrency]);

  const handleChangeTab = useCallback(
    ({ pathToTabIndex }: { pathToTabIndex: string[] }) => {
      dispatch(setDirectPathToChild(pathToTabIndex));
      window.scrollTo(0, 0);
    },
    [dispatch],
  );

  const handleDeleteTopLevelTabs = useCallback(() => {
    dispatch(deleteTopLevelTabs());

    const firstTab = getDirectPathToTabIndex(
      getRootLevelTabsComponent(dashboardLayout),
      0,
    );
    dispatch(setDirectPathToChild(firstTab));
  }, [dashboardLayout, dispatch]);

  const handleDrop = useCallback(
    (dropResult: DashboardDropResult) =>
      dispatch(handleComponentDrop(dropResult)),
    [dispatch],
  );

  const headerRef = useRef<HTMLDivElement>(null);
  const dashboardRoot = dashboardLayout[DASHBOARD_ROOT_ID];
  const rootChildId = dashboardRoot?.children[0];
  const topLevelTabs =
    rootChildId !== DASHBOARD_GRID_ID &&
    dashboardLayout[rootChildId]?.type !== PAGES_TYPE
      ? dashboardLayout[rootChildId]
      : undefined;
  const topLevelPages =
    rootChildId !== DASHBOARD_GRID_ID &&
    dashboardLayout[rootChildId]?.type === PAGES_TYPE
      ? dashboardLayout[rootChildId]
      : undefined;
  // Initialize activePagePath when dashboard with Pages loads
  const activePagePath = useSelector<RootState, string[]>(
    state => (state.dashboardState as any).activePagePath ?? [],
  );
  useEffect(() => {
    if (topLevelPages && activePagePath.length === 0) {
      const firstPagePath = getDirectPathToTabIndex(topLevelPages, 0);
      dispatch(setActivePagePath(firstPagePath));
    }
  }, [topLevelPages, activePagePath.length, dispatch]);

  const standaloneMode = getUrlParam(URL_PARAMS.standalone);
  const isReport = standaloneMode === DashboardStandaloneMode.Report;
  const hideDashboardHeader =
    uiConfig.hideTitle ||
    standaloneMode === DashboardStandaloneMode.HideNavAndTitle ||
    isReport;

  /* barTopOffset / setBarTopOffset / ResizeObserver — удалены вместе
     с вертикальным FilterBar, который теперь живёт в Drawer'е. */

  const {
    showDashboard,
    missingInitialFilters,
    toggleDashboardFiltersOpen,
    nativeFiltersEnabled,
  } = useNativeFilters();

  /* useElementOnScreen для filterBar sticky-recalc — удалён вместе с
     FilterBar.Vertical. */

  const showFilterBar = !editMode && nativeFiltersEnabled;

  // Responsive: mobile breakpoint for filter bar layout (matches CSS mobile ≤570px)
  const MOBILE_BREAKPOINT = 570;
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT,
  );
  useEffect(() => {
    const onResize = () =>
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* offset / filterBarHeight / filterBarOffset вычислялись для renderChild;
     теперь FilterBar в Drawer'е DashboardSideRail сам рассчитывает размеры. */

  /* В апстриме сюда ставили marginLeft:-32 как компенсацию под закрытый
     вертикальный FilterBar (ResizableSidebar был 32px wide в collapsed).
     В нашем форке FilterBar удалён полностью, поэтому любая такая
     компенсация тянет шапку влево за пределы viewport'а — убрано. */
  const draggableStyle = useMemo(() => ({ marginLeft: 0 }), []);

  // If a new tab was added, update the directPathToChild to reflect it
  const currentTopLevelTabs = useRef(topLevelTabs);
  useEffect(() => {
    const currentTabsLength = currentTopLevelTabs.current?.children?.length;
    const newTabsLength = topLevelTabs?.children?.length;

    if (
      currentTabsLength !== undefined &&
      newTabsLength !== undefined &&
      newTabsLength > currentTabsLength
    ) {
      const lastTab = getDirectPathToTabIndex(
        getRootLevelTabsComponent(dashboardLayout),
        newTabsLength - 1,
      );
      dispatch(setDirectPathToChild(lastTab));
    }

    currentTopLevelTabs.current = topLevelTabs;
  }, [topLevelTabs]);

  const renderDraggableContent = useCallback(
    ({ dropIndicatorProps }: { dropIndicatorProps: JsonObject }) => (
      <div>
        {!hideDashboardHeader && <DashboardHeader />}
        {showFilterBar &&
          !isMobile &&
          filterBarOrientation === FilterBarOrientation.Horizontal && (
            <FilterBar
              orientation={FilterBarOrientation.Horizontal}
              hidden={isReport}
            />
          )}
        {dropIndicatorProps && <div {...dropIndicatorProps} />}
        {!isReport && topLevelTabs && !uiConfig.hideNav && (
          <WithPopoverMenu
            shouldFocus={shouldFocusTabs}
            menuItems={[
              <IconButton
                key="collapse-tabs"
                icon={<Icons.FallOutlined iconSize="xl" />}
                label={t('Collapse tab content')}
                onClick={handleDeleteTopLevelTabs}
              />,
            ]}
            editMode={editMode}
          >
            {/* @ts-ignore */}
            <DashboardComponent
              id={topLevelTabs?.id}
              parentId={DASHBOARD_ROOT_ID}
              depth={DASHBOARD_ROOT_DEPTH + 1}
              index={0}
              renderTabContent={false}
              renderHoverMenu={false}
              onChangeTab={handleChangeTab}
            />
          </WithPopoverMenu>
        )}
      </div>
    ),
    [
      nativeFiltersEnabled,
      filterBarOrientation,
      editMode,
      handleChangeTab,
      handleDeleteTopLevelTabs,
      hideDashboardHeader,
      isReport,
      topLevelTabs,
      uiConfig.hideNav,
    ],
  );

  /* Симметричный margin-left со всех сторон. Старое значение sizeUnit*8
     (32px) в edit-mode резервировалось под закрытый BuilderComponentPane;
     sidebar убран — теперь edit и view используют одинаковые 16px. */
  const dashboardContentMarginLeft = theme.sizeUnit * 4;

  /* Desktop вертикальный FilterBar и ResizableSidebar удалены — фильтры
     и pages теперь живут в отдельных Shell.Drawer'ах, которые триггерятся
     узкой icon-колонкой <DashboardSideRail /> слева (монтируется в
     Shell.tsx). Это освобождает место под грид и унифицирует UX.

     MobileFilterBar ниже остаётся — на mobile drawer-pattern свой.

     renderChild() callback удалён вместе с ResizableSidebar — он
     зависел от FiltersPanel/StickyPanel/FilterBar.Vertical. */
  const headerFilterBarWidth = 0;

  return (
    <ViewportPriorityProvider enabled={fetchStrategy.lazy_offscreen}>
      <DashboardWrapper>
        <StyledHeader
          data-test="dashboard-header-wrapper"
          ref={headerRef}
          filterBarWidth={headerFilterBarWidth}
        >
        {/* @ts-ignore */}
        <Droppable
          data-test="top-level-tabs"
          className={cx(!topLevelTabs && !topLevelPages && editMode && 'empty-droptarget')}
          component={dashboardRoot}
          parentComponent={null}
          depth={DASHBOARD_ROOT_DEPTH}
          index={0}
          orientation="column"
          onDrop={handleDrop}
          editMode={editMode}
          // you cannot drop on/displace tabs if they already exist
          disableDragDrop={!!topLevelTabs || !!topLevelPages}
          style={draggableStyle}
        >
          {renderDraggableContent}
        </Droppable>
      </StyledHeader>
      <StyledContent fullSizeChartId={fullSizeChartId}>
        {!editMode &&
          !topLevelTabs &&
          !topLevelPages &&
          dashboardLayout[DASHBOARD_GRID_ID]?.children?.length === 0 && (
            <EmptyState
              title={t('There are no charts added to this dashboard')}
              size="large"
              description={
                canEdit &&
                t(
                  'Go to the edit mode to configure the dashboard and add charts',
                )
              }
              buttonText={canEdit && t('Edit the dashboard')}
              buttonAction={() => {
                dispatch(setEditMode(true));
                dispatch(clearDashboardHistory());
              }}
              image="dashboard.svg"
            />
          )}
        <DashboardContentWrapper
          data-test="dashboard-content-wrapper"
          className={cx('dashboard', editMode && 'dashboard--editing')}
        >
          <StyledDashboardContent
            className="dashboard-content"
            data-view-mode={!editMode ? 'true' : undefined}
            editMode={editMode}
            marginLeft={dashboardContentMarginLeft}
          >
            {showDashboard ? (
              missingInitialFilters.length > 0 ? (
                <div
                  css={css`
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                    & div {
                      width: 500px;
                    }
                  `}
                >
                  <BasicErrorAlert
                    title={t('Unable to load dashboard')}
                    body={t(
                      `The following filters have the 'Select first filter value by default'
                    option checked and could not be loaded, which is preventing the dashboard
                    from rendering: %s`,
                      missingInitialFilters.join(', '),
                    )}
                  />
                </div>
              ) : (
                <>
                  <DashboardContainer
                    topLevelTabs={topLevelTabs}
                    topLevelPages={topLevelPages}
                  />
                </>
              )
            ) : (
              <Loading />
            )}
            {/* Старый sticky-sidebar BuilderComponentPane убран — его
                содержимое (SliceAdder + layout-элементы) теперь живёт
                в Shell-drawer'е kind='builder' (BuilderDrawer.tsx),
                открывается кнопкой «Конструктор» в mini-rail'е. */}
          </StyledDashboardContent>
        </DashboardContentWrapper>
      </StyledContent>
      {dashboardIsSaving && (
        <SaveOverlayBackdrop role="status" aria-live="polite">
          <SaveOverlayCard>
            <span className="save-icon" aria-hidden>
              {/* SVG spinner — track (статичный круг) + stripe
                  (вращающаяся 1/4 дуга). circle.r=46, c=2π·46≈289;
                  dasharray "70 220" → 70px дуги видно, 220px пропуск.
                  CSS animation крутит этот единственный circle. */}
              <svg
                className="save-spinner"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <circle
                  className="save-spinner-track"
                  cx="50"
                  cy="50"
                  r="46"
                />
                <circle
                  className="save-spinner-stripe"
                  cx="50"
                  cy="50"
                  r="46"
                  pathLength="100"
                  strokeDasharray="22 100"
                />
              </svg>
              <Icons.SaveOutlined iconSize="xl" />
            </span>
            <span className="save-caption">{t('Сохранение дашборда…')}</span>
          </SaveOverlayCard>
        </SaveOverlayBackdrop>
      )}
      {showFilterBar && isMobile && (
        <MobileFilterBar>
          <FilterBar
            orientation={FilterBarOrientation.Vertical}
            verticalConfig={{
              filtersOpen: true,
              toggleFiltersBar: toggleDashboardFiltersOpen,
              width: 0,
              height: '100%',
              offset: 0,
              isMobile: true,
            }}
          />
        </MobileFilterBar>
      )}
      </DashboardWrapper>
    </ViewportPriorityProvider>
  );
};

export default memo(DashboardBuilder);
