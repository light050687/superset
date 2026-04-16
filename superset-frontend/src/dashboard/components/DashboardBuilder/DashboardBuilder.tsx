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
  useElementOnScreen,
} from '@superset-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { EmptyState, Loading } from '@superset-ui/core/components';
import { ErrorBoundary, BasicErrorAlert } from 'src/components';
import BuilderComponentPane from 'src/dashboard/components/BuilderComponentPane';
import DashboardHeader from 'src/dashboard/components/Header';
import { Icons } from '@superset-ui/core/components/Icons';
import IconButton from 'src/dashboard/components/IconButton';
import { Droppable } from 'src/dashboard/components/dnd/DragDroppable';
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
import ResizableSidebar from 'src/components/ResizableSidebar';
import {
  BUILDER_SIDEPANEL_WIDTH,
  CLOSED_FILTER_BAR_WIDTH,
  FILTER_BAR_HEADER_HEIGHT,
  MAIN_HEADER_HEIGHT,
  OPEN_FILTER_BAR_MAX_WIDTH,
  OPEN_FILTER_BAR_WIDTH,
  EMPTY_CONTAINER_Z_INDEX,
} from 'src/dashboard/constants';
import { getRootLevelTabsComponent, shouldFocusTabs } from './utils';
import DashboardContainer from './DashboardContainer';
import { useNativeFilters } from './state';
import DashboardWrapper from './DashboardWrapper';

// @z-index-above-dashboard-charts + 1 = 11
const FiltersPanel = styled.div<{ width: number; hidden: boolean }>`
  background-color: ${({ theme }) => theme.colorBgContainer};
  grid-column: 1;
  grid-row: 1 / span 2;
  z-index: 11;
  width: ${({ width }) => width}px;
  ${({ hidden }) => hidden && `display: none;`}
`;

const StickyPanel = styled.div<{ width: number }>`
  position: sticky;
  top: -1px;
  width: ${({ width }) => width}px;
  flex: 0 0 ${({ width }) => width}px;
`;

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

      & > .empty-droptarget:first-child:not(.empty-droptarget--full) {
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

      ${editMode &&
      `
      max-width: calc(100% - ${
        BUILDER_SIDEPANEL_WIDTH + theme.sizeUnit * 16
      }px);
    `}

      /* this is the ParentSize wrapper */
    & > div:first-child {
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
      background-color: ${theme.colorBgContainer};
      position: relative;
      padding: ${theme.sizeUnit * 4}px;
      overflow-y: visible;

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

    &[data-view-mode="true"] .resizable-container {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      /* Override inline height — let flex chain control height */
      height: unset !important;
      min-height: 0 !important;
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
    }

    /* KPI card: propagate flex through anonymous wrapper divs */
    &[data-view-mode="true"]
      div[data-test-viz-type='ext-kpi-card']
      .slice_container
      > div {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    &[data-view-mode="true"]
      div[data-test-viz-type='ext-kpi-card']
      .slice_container
      > div
      > div {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    &[data-view-mode="true"]
      div[data-test-viz-type='ext-kpi-card']
      .slice_container
      > div
      > div
      > div {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /*
     * Responsive layout — view mode only.
     * Uses @container queries on .grid-container so layout reacts to
     * actual container width (not viewport), adapting when filter panel opens.
     * container-type is only set in view mode to protect edit mode.
     */

    /* ── View mode: enable container queries + fill containers ── */
    &[data-view-mode="true"] .grid-container {
      container-type: inline-size;
      container-name: grid;
      margin: clamp(4px, 1vw, 32px) !important;
    }
    &[data-view-mode="true"] .resizable-container {
      width: 100% !important;
      max-width: 100% !important;
    }

    /* ── Wide container ≥1440px: 1 row, uniform gap ── */
    @container grid (min-width: 1440px) {
      .grid-row {
        flex-wrap: nowrap !important;
        gap: clamp(8px, 1cqi, 24px) !important;
      }
      .grid-row > :not(:last-child):not(.hover-menu) {
        margin-right: 0 !important;
      }
      /* Vertical gap between row wrappers (override GridContent margin-bottom) */
      .dragdroppable-row {
        margin-bottom: clamp(8px, 1cqi, 24px) !important;
      }
      .dragdroppable-row:last-child {
        margin-bottom: 0 !important;
      }
      .dragdroppable-column {
        flex: 1 1 0% !important;
      }
    }

    /* ── Medium container 800–1439px: 3 columns per row ── */
    @container grid (min-width: 800px) and (max-width: 1439px) {
      .grid-row {
        flex-wrap: wrap !important;
        gap: clamp(8px, 1cqi, 24px) !important;
      }
      .grid-row > :not(:last-child):not(.hover-menu) {
        margin-right: 0 !important;
      }
      .dragdroppable-row {
        margin-bottom: clamp(8px, 1cqi, 24px) !important;
      }
      .dragdroppable-row:last-child {
        margin-bottom: 0 !important;
      }
      .dragdroppable-column {
        flex: 1 1 calc(33.333% - clamp(6px, 0.7cqi, 16px)) !important;
        min-width: calc(33.333% - clamp(6px, 0.7cqi, 16px)) !important;
      }
    }

    /* ── Small container 425–799px: 2 columns ── */
    @container grid (min-width: 425px) and (max-width: 799px) {
      .grid-row {
        flex-wrap: wrap !important;
        gap: clamp(4px, 1cqi, 16px) !important;
      }
      .grid-row > :not(:last-child):not(.hover-menu) {
        margin-right: 0 !important;
      }
      .dragdroppable-row {
        margin-bottom: clamp(4px, 1cqi, 16px) !important;
      }
      .dragdroppable-row:last-child {
        margin-bottom: 0 !important;
      }
      .dragdroppable-column {
        flex: 1 1 calc(50% - clamp(2px, 0.5cqi, 8px)) !important;
        min-width: calc(50% - clamp(2px, 0.5cqi, 8px)) !important;
      }
    }

    /* ── Narrow container <425px: 1 column ── */
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

const ELEMENT_ON_SCREEN_OPTIONS = {
  threshold: [1],
};

const DashboardBuilder = () => {
  const dispatch = useDispatch();
  const uiConfig = useUiConfig();
  const theme = useTheme();

  const dashboardId = useSelector<RootState, string>(
    ({ dashboardInfo }) => `${dashboardInfo.id}`,
  );
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
    dropResult => dispatch(handleComponentDrop(dropResult)),
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

  const [barTopOffset, setBarTopOffset] = useState(0);
  const [currentFilterBarWidth, setCurrentFilterBarWidth] = useState(
    CLOSED_FILTER_BAR_WIDTH,
  );

  useEffect(() => {
    setBarTopOffset(headerRef.current?.getBoundingClientRect()?.height || 0);

    let observer: ResizeObserver;
    if (global.hasOwnProperty('ResizeObserver') && headerRef.current) {
      observer = new ResizeObserver(entries => {
        setBarTopOffset(
          current => entries?.[0]?.contentRect?.height || current,
        );
      });

      observer.observe(headerRef.current);
    }

    return () => {
      observer?.disconnect();
    };
  }, []);

  const {
    showDashboard,
    missingInitialFilters,
    dashboardFiltersOpen,
    toggleDashboardFiltersOpen,
    nativeFiltersEnabled,
  } = useNativeFilters();

  const [containerRef, isSticky] = useElementOnScreen<HTMLDivElement>(
    ELEMENT_ON_SCREEN_OPTIONS,
  );

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

  const offset =
    FILTER_BAR_HEADER_HEIGHT +
    (isSticky || standaloneMode ? 0 : MAIN_HEADER_HEIGHT);

  const filterBarHeight = `calc(100vh - ${offset}px)`;
  const filterBarOffset = dashboardFiltersOpen ? 0 : barTopOffset + 20;

  const draggableStyle = useMemo(
    () => ({
      marginLeft:
        dashboardFiltersOpen ||
        editMode ||
        !nativeFiltersEnabled ||
        filterBarOrientation === FilterBarOrientation.Horizontal ||
        isMobile
          ? 0
          : -32,
    }),
    [
      dashboardFiltersOpen,
      editMode,
      filterBarOrientation,
      nativeFiltersEnabled,
      isMobile,
    ],
  );

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

  const dashboardContentMarginLeft = !editMode
    ? theme.sizeUnit * 4
    : theme.sizeUnit * 8;

  const renderChild = useCallback(
    adjustedWidth => {
      const filterBarWidth = dashboardFiltersOpen
        ? adjustedWidth
        : CLOSED_FILTER_BAR_WIDTH;
      if (filterBarWidth !== currentFilterBarWidth) {
        setCurrentFilterBarWidth(filterBarWidth);
      }
      return (
        <FiltersPanel
          width={filterBarWidth}
          hidden={isReport}
          data-test="dashboard-filters-panel"
        >
          <StickyPanel ref={containerRef} width={filterBarWidth}>
            <ErrorBoundary>
              <FilterBar
                orientation={FilterBarOrientation.Vertical}
                verticalConfig={{
                  filtersOpen: dashboardFiltersOpen,
                  toggleFiltersBar: toggleDashboardFiltersOpen,
                  width: filterBarWidth,
                  height: filterBarHeight,
                  offset: filterBarOffset,
                  topLevelPages,
                  editMode,
                }}
              />
            </ErrorBoundary>
          </StickyPanel>
        </FiltersPanel>
      );
    },
    [
      dashboardFiltersOpen,
      toggleDashboardFiltersOpen,
      filterBarHeight,
      filterBarOffset,
      isReport,
      topLevelPages,
      editMode,
    ],
  );

  const hasPages = (topLevelPages?.children?.length || 0) > 1;
  const isVerticalFilterBarVisible =
    (showFilterBar && filterBarOrientation === FilterBarOrientation.Vertical) ||
    hasPages ||
    editMode;
  const headerFilterBarWidth =
    isVerticalFilterBarVisible && !isMobile ? currentFilterBarWidth : 0;

  return (
    <DashboardWrapper>
      {isVerticalFilterBarVisible && !isMobile && (
        <ResizableSidebar
          id={`dashboard:${dashboardId}`}
          enable={dashboardFiltersOpen}
          minWidth={OPEN_FILTER_BAR_WIDTH}
          maxWidth={OPEN_FILTER_BAR_MAX_WIDTH}
          initialWidth={OPEN_FILTER_BAR_WIDTH}
        >
          {renderChild}
        </ResizableSidebar>
      )}
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
            {editMode && <BuilderComponentPane topOffset={barTopOffset} />}
          </StyledDashboardContent>
        </DashboardContentWrapper>
      </StyledContent>
      {dashboardIsSaving && (
        <Loading
          css={css`
            && {
              position: fixed;
            }
          `}
        />
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
  );
};

export default memo(DashboardBuilder);
