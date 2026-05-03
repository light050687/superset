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
import { extendedDayjs } from '@superset-ui/core/utils/dates';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  styled,
  css,
  isFeatureEnabled,
  FeatureFlag,
  t,
  getExtensionsRegistry,
} from '@superset-ui/core';
import { Global } from '@emotion/react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  LOG_ACTIONS_PERIODIC_RENDER_DASHBOARD,
  LOG_ACTIONS_FORCE_REFRESH_DASHBOARD,
  LOG_ACTIONS_TOGGLE_EDIT_DASHBOARD,
} from 'src/logger/LogUtils';
import { Icons } from '@superset-ui/core/components/Icons';
import {
  Button,
  Tooltip,
  UnsavedChangesModal,
} from '@superset-ui/core/components';
import { findPermission } from 'src/utils/findPermission';
import { safeStringify } from 'src/utils/safeStringify';
import PublishedStatus from 'src/dashboard/components/PublishedStatus';
import UndoRedoKeyListeners from 'src/dashboard/components/UndoRedoKeyListeners';
import PropertiesModal from 'src/dashboard/components/PropertiesModal';
import {
  UNDO_LIMIT,
  SAVE_TYPE_OVERWRITE,
  DASHBOARD_POSITION_DATA_LIMIT,
  DASHBOARD_HEADER_ID,
} from 'src/dashboard/util/constants';
import { TagTypeEnum } from 'src/components/Tag/TagType';
import setPeriodicRunner, {
  stopPeriodicRender,
} from 'src/dashboard/util/setPeriodicRunner';
import { PageHeaderWithActions } from '@superset-ui/core/components/PageHeaderWithActions';
import { useUnsavedChangesPrompt } from 'src/hooks/useUnsavedChangesPrompt';
import DashboardEmbedModal from '../EmbeddedModal';
import OverwriteConfirm from '../OverwriteConfirm';
import {
  addDangerToast,
  addSuccessToast,
  addWarningToast,
} from '../../../components/MessageToasts/actions';
import {
  dashboardTitleChanged,
  redoLayoutAction,
  undoLayoutAction,
  updateDashboardTitle,
  clearDashboardHistory,
} from '../../actions/dashboardLayout';
import {
  fetchCharts,
  fetchFaveStar,
  maxUndoHistoryToast,
  onChange,
  onRefresh,
  saveDashboardRequest,
  saveFaveStar,
  savePublished,
  setEditMode,
  setMaxUndoHistoryExceeded,
  setRefreshFrequency,
  setUnsavedChanges,
  updateCss,
} from '../../actions/dashboardState';
import { logEvent } from '../../../logger/actions';
import { dashboardInfoChanged } from '../../actions/dashboardInfo';
import isDashboardLoading from '../../util/isDashboardLoading';
import { useChartIds } from '../../util/charts/useChartIds';
import { useDashboardMetadataBar } from './useDashboardMetadataBar';
import { useHeaderActionsMenu } from './useHeaderActionsDropdownMenu';

const extensionsRegistry = getExtensionsRegistry();

const headerContainerStyle = theme => css`
  border-bottom: 1px solid ${theme.colorBorder};

  /* DS v2.0 §02 «Заголовок страницы»: 28px / 34px / 800 (desktop), fluid
     до 22px на mobile ≤428. Используем --fs-title (clamp(20px, 1.2rem +
     0.4vi, 28px)) — точно соответствует таблице размеров из DS 2.0.
     Скоупируем через .dashboard-header-container, чтобы не задеть
     SliceHeader / ExploreChartHeader / AllEntities — там тот же
     DynamicEditableTitle, но другой контекст.
     Раньше использовался --fs-hero (28-56) или хардкод 48px → шапка
     визуально тяжёлая, длинные названия не помещались. */
  .header-with-actions .title-panel .dynamic-title-input {
    font-family: var(--f, 'Manrope', 'Inter', Helvetica, Arial, sans-serif);
    font-size: var(--fs-title);
    line-height: 1.21;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--ink, ${theme.colorText});
  }

  /* DS v2.0 fluid — Meta-bar: --fs-micro (11-13) моно --g600 */
  .header-with-actions .dashboard-metadata-bar-slot,
  .header-with-actions .dashboard-metadata-bar-slot .metadata-text,
  .header-with-actions .metadata-panel .metadata-text,
  .header-with-actions .title-panel .metadata-text {
    font-family: var(
      --m,
      'JetBrains Mono',
      'Fira Code',
      'Courier New',
      monospace
    ) !important;
    font-size: var(--fs-micro) !important;
    line-height: 1.4 !important;
    font-weight: 500 !important;
    color: var(--g600, ${theme.colorTextSecondary}) !important;
  }

  /* DS v2.0 — Meta-bar pushed to the right edge of dashboard content.
     ⚠️ DOM (verified в Chrome DevTools):
       .header-with-actions  (flex, justify-content: space-between, padding: 0 16px)
         .title-panel        (flex 0 1 auto, margin-right: 48px от actions)
           div.editable-title (title text — может обрезаться ellipsis)
           div[buttonsStyles] (FaveStar + наш slot)
         .right-button-panel (actions/profile, ~24px)
     Цели:
       1. .title-panel растянута на всё свободное место (flex:1)
       2. margin-right у title-panel убрана (0) — slot долетает до правого края
       3. Title не shrink'ается (flex-shrink:0 на первом ребёнке) — полное название видно
       4. intermediate buttonsStyles div растянут (flex:1, display:flex)
       5. margin-left: auto на slot — пушит вправо в расширенном div */
  .header-with-actions .title-panel {
    flex: 1 !important;
    margin-right: 0 !important;
    gap: ${theme.sizeUnit * 2}px;
    /* DS v2.0: все дети title-panel (title + FaveStar + meta-slot)
       выровнены по центру вертикали относительно title. */
    align-items: center !important;
  }
  /* Title (первый ребёнок) — не shrink'ается, показывает полное название */
  .header-with-actions .title-panel > *:first-child {
    flex: 0 0 auto !important;
    max-width: 50% !important;
  }
  /* Intermediate div (второй ребёнок) — растягивается */
  .header-with-actions .title-panel > *:last-child {
    flex: 1 !important;
    display: flex !important;
    align-items: center !important;
    min-width: 0 !important;
  }
  .header-with-actions .title-panel .dashboard-metadata-bar-slot {
    margin-left: auto !important;
  }
  /* Также убираем ellipsis у самого title input/span */
  .header-with-actions .title-panel .editable-title,
  .header-with-actions .title-panel .editable-title input,
  .header-with-actions .title-panel .editable-title span {
    overflow: visible !important;
    text-overflow: clip !important;
    max-width: none !important;
  }

  /* DynamicEditableTitle использует .input-sizer span для auto-resize
     ширины input. Без выровненного font'а sizer измеряет в default font
     (14px), а input рендерится в page-title — текст не помещается,
     срабатывает text-overflow: ellipsis у input ("Тест ..."). Решение —
     синхронизировать font sizer'а со стилем input. Значения должны быть
     1:1 с .dynamic-title-input выше. */
  .header-with-actions .title-panel .input-sizer,
  .header-with-actions .title-panel .dynamic-title-input {
    font-family: var(--f, ${theme.fontFamily}) !important;
    font-size: var(--fs-title) !important;
    line-height: 1.21 !important;
    font-weight: 800 !important;
    letter-spacing: -0.02em !important;
  }

`;

const editButtonStyle = theme => css`
  color: ${theme.colorPrimary};

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const actionButtonsStyle = theme => css`
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    flex: 1;
  }

  .action-schedule-report {
    margin-left: ${theme.sizeUnit * 2}px;
  }

  .undoRedo {
    display: flex;
    margin-right: ${theme.sizeUnit * 2}px;
  }
`;

const StyledUndoRedoButton = styled(Button)`
  // TODO: check if we need this
  padding: 0;
  &:hover {
    background: transparent;
  }
`;

const undoRedoStyle = theme => css`
  color: ${theme.colorIcon};
  &:hover {
    color: ${theme.colorIconHover};
  }
`;

const undoRedoEmphasized = theme => css`
  color: ${theme.colorIcon};
`;

const undoRedoDisabled = theme => css`
  color: ${theme.colorTextDisabled};
`;

const saveBtnStyle = theme => css`
  min-width: ${theme.sizeUnit * 17}px;
  height: ${theme.sizeUnit * 8}px;
  span > :first-of-type {
    margin-right: 0;
  }
`;

const discardBtnStyle = theme => css`
  min-width: ${theme.sizeUnit * 22}px;
  height: ${theme.sizeUnit * 8}px;
`;

const discardChanges = () => {
  const url = new URL(window.location.href);

  url.searchParams.delete('edit');
  window.location.assign(url);
};

const Header = () => {
  const dispatch = useDispatch();
  const [didNotifyMaxUndoHistoryToast, setDidNotifyMaxUndoHistoryToast] =
    useState(false);
  const [emphasizeUndo, setEmphasizeUndo] = useState(false);
  const [emphasizeRedo, setEmphasizeRedo] = useState(false);
  const [showingPropertiesModal, setShowingPropertiesModal] = useState(false);
  const [showingEmbedModal, setShowingEmbedModal] = useState(false);
  const dashboardInfo = useSelector(state => state.dashboardInfo);
  const layout = useSelector(state => state.dashboardLayout.present);
  const undoLength = useSelector(state => state.dashboardLayout.past.length);
  const redoLength = useSelector(state => state.dashboardLayout.future.length);
  const dataMask = useSelector(state => state.dataMask);
  const user = useSelector(state => state.user);
  const chartIds = useChartIds();

  const {
    expandedSlices,
    refreshFrequency,
    shouldPersistRefreshFrequency,
    customCss,
    colorNamespace,
    colorScheme,
    isStarred,
    isPublished,
    hasUnsavedChanges,
    maxUndoHistoryExceeded,
    editMode,
    lastModifiedTime,
  } = useSelector(
    state => ({
      expandedSlices: state.dashboardState.expandedSlices,
      refreshFrequency: state.dashboardState.refreshFrequency,
      shouldPersistRefreshFrequency:
        !!state.dashboardState.shouldPersistRefreshFrequency,
      customCss: state.dashboardState.css,
      colorNamespace: state.dashboardState.colorNamespace,
      colorScheme: state.dashboardState.colorScheme,
      isStarred: !!state.dashboardState.isStarred,
      isPublished: !!state.dashboardState.isPublished,
      hasUnsavedChanges: !!state.dashboardState.hasUnsavedChanges,
      maxUndoHistoryExceeded: !!state.dashboardState.maxUndoHistoryExceeded,
      editMode: !!state.dashboardState.editMode,
      lastModifiedTime: state.lastModifiedTime,
    }),
    shallowEqual,
  );
  const isLoading = useSelector(state => isDashboardLoading(state.charts));

  const refreshTimer = useRef(0);
  const ctrlYTimeout = useRef(0);
  const ctrlZTimeout = useRef(0);
  const previousThemeRef = useRef(dashboardInfo.theme);

  const dashboardTitle = layout[DASHBOARD_HEADER_ID]?.meta?.text;
  const { slug } = dashboardInfo;
  const actualLastModifiedTime = Math.max(
    lastModifiedTime,
    dashboardInfo.last_modified_time,
  );
  const boundActionCreators = useMemo(
    () =>
      bindActionCreators(
        {
          addSuccessToast,
          addDangerToast,
          addWarningToast,
          onUndo: undoLayoutAction,
          onRedo: redoLayoutAction,
          clearDashboardHistory,
          setEditMode,
          setUnsavedChanges,
          fetchFaveStar,
          saveFaveStar,
          savePublished,
          fetchCharts,
          updateDashboardTitle,
          updateCss,
          onChange,
          onSave: saveDashboardRequest,
          setMaxUndoHistoryExceeded,
          maxUndoHistoryToast,
          logEvent,
          setRefreshFrequency,
          onRefresh,
          dashboardInfoChanged,
          dashboardTitleChanged,
        },
        dispatch,
      ),
    [dispatch],
  );

  const startPeriodicRender = useCallback(
    interval => {
      let intervalMessage;

      if (interval) {
        const periodicRefreshOptions =
          dashboardInfo.common?.conf?.DASHBOARD_AUTO_REFRESH_INTERVALS;
        const predefinedValue = periodicRefreshOptions.find(
          option => Number(option[0]) === interval / 1000,
        );

        if (predefinedValue) {
          intervalMessage = t(predefinedValue[1]);
        } else {
          intervalMessage = extendedDayjs
            .duration(interval, 'millisecond')
            .humanize();
        }
      }

      const fetchCharts = (charts, force = false) =>
        boundActionCreators.fetchCharts(
          charts,
          force,
          interval * 0.2,
          dashboardInfo.id,
        );

      const periodicRender = () => {
        const { metadata } = dashboardInfo;
        const immune = metadata.timed_refresh_immune_slices || [];
        const affectedCharts = chartIds.filter(
          chartId => immune.indexOf(chartId) === -1,
        );

        boundActionCreators.logEvent(LOG_ACTIONS_PERIODIC_RENDER_DASHBOARD, {
          interval,
          chartCount: affectedCharts.length,
        });
        boundActionCreators.addWarningToast(
          t(
            `This dashboard is currently auto refreshing; the next auto refresh will be in %s.`,
            intervalMessage,
          ),
        );
        if (
          dashboardInfo.common?.conf?.DASHBOARD_AUTO_REFRESH_MODE === 'fetch'
        ) {
          // force-refresh while auto-refresh in dashboard
          return fetchCharts(affectedCharts);
        }
        return fetchCharts(affectedCharts, true);
      };

      refreshTimer.current = setPeriodicRunner({
        interval,
        periodicRender,
        refreshTimer: refreshTimer.current,
      });
    },
    [boundActionCreators, chartIds, dashboardInfo],
  );

  useEffect(() => {
    startPeriodicRender(refreshFrequency * 1000);
  }, [refreshFrequency, startPeriodicRender]);

  // Track theme changes as unsaved changes, and sync ref when navigating between dashboards
  useEffect(() => {
    if (editMode && dashboardInfo.theme !== previousThemeRef.current) {
      boundActionCreators.setUnsavedChanges(true);
    }
    previousThemeRef.current = dashboardInfo.theme;
  }, [dashboardInfo.theme, editMode, boundActionCreators]);

  useEffect(() => {
    if (UNDO_LIMIT - undoLength <= 0 && !didNotifyMaxUndoHistoryToast) {
      setDidNotifyMaxUndoHistoryToast(true);
      boundActionCreators.maxUndoHistoryToast();
    }
    if (undoLength > UNDO_LIMIT && !maxUndoHistoryExceeded) {
      boundActionCreators.setMaxUndoHistoryExceeded();
    }
  }, [
    boundActionCreators,
    didNotifyMaxUndoHistoryToast,
    maxUndoHistoryExceeded,
    undoLength,
  ]);

  useEffect(
    () => () => {
      stopPeriodicRender(refreshTimer.current);
      boundActionCreators.setRefreshFrequency(0);
      clearTimeout(ctrlYTimeout.current);
      clearTimeout(ctrlZTimeout.current);
    },
    [boundActionCreators],
  );

  const handleChangeText = useCallback(
    nextText => {
      if (nextText && dashboardTitle !== nextText) {
        boundActionCreators.updateDashboardTitle(nextText);
        boundActionCreators.onChange();
      }
    },
    [boundActionCreators, dashboardTitle],
  );

  const handleCtrlY = useCallback(() => {
    boundActionCreators.onRedo();
    setEmphasizeRedo(true);
    if (ctrlYTimeout.current) {
      clearTimeout(ctrlYTimeout.current);
    }
    ctrlYTimeout.current = setTimeout(() => {
      setEmphasizeRedo(false);
    }, 100);
  }, [boundActionCreators]);

  const handleCtrlZ = useCallback(() => {
    boundActionCreators.onUndo();
    setEmphasizeUndo(true);
    if (ctrlZTimeout.current) {
      clearTimeout(ctrlZTimeout.current);
    }
    ctrlZTimeout.current = setTimeout(() => {
      setEmphasizeUndo(false);
    }, 100);
  }, [boundActionCreators]);

  const forceRefresh = useCallback(() => {
    if (!isLoading) {
      boundActionCreators.logEvent(LOG_ACTIONS_FORCE_REFRESH_DASHBOARD, {
        force: true,
        interval: 0,
        chartCount: chartIds.length,
      });
      return boundActionCreators.onRefresh(chartIds, true, 0, dashboardInfo.id);
    }
    return false;
  }, [boundActionCreators, chartIds, dashboardInfo.id, isLoading]);

  const toggleEditMode = useCallback(() => {
    boundActionCreators.logEvent(LOG_ACTIONS_TOGGLE_EDIT_DASHBOARD, {
      edit_mode: !editMode,
    });
    boundActionCreators.setEditMode(!editMode);
  }, [boundActionCreators, editMode]);

  const overwriteDashboard = useCallback(() => {
    const currentColorNamespace =
      dashboardInfo?.metadata?.color_namespace || colorNamespace;
    const currentColorScheme =
      dashboardInfo?.metadata?.color_scheme || colorScheme;

    const data = {
      certified_by: dashboardInfo.certified_by,
      certification_details: dashboardInfo.certification_details,
      css: customCss,
      dashboard_title: dashboardTitle,
      last_modified_time: actualLastModifiedTime,
      owners: dashboardInfo.owners,
      roles: dashboardInfo.roles,
      slug,
      tags: (dashboardInfo.tags || []).filter(
        item => item.type === TagTypeEnum.Custom || !item.type,
      ),
      metadata: {
        ...dashboardInfo?.metadata,
        color_namespace: currentColorNamespace,
        color_scheme: currentColorScheme,
        positions: layout,
        refresh_frequency: shouldPersistRefreshFrequency
          ? refreshFrequency
          : dashboardInfo.metadata?.refresh_frequency,
      },
    };

    // make sure positions data less than DB storage limitation:
    const positionJSONLength = safeStringify(layout).length;
    const limit =
      dashboardInfo.common?.conf?.SUPERSET_DASHBOARD_POSITION_DATA_LIMIT ||
      DASHBOARD_POSITION_DATA_LIMIT;
    if (positionJSONLength >= limit) {
      boundActionCreators.addDangerToast(
        t(
          'Your dashboard is too large. Please reduce its size before saving it.',
        ),
      );
    } else {
      if (positionJSONLength >= limit * 0.9) {
        boundActionCreators.addWarningToast(
          t('Your dashboard is near the size limit.'),
        );
      }

      boundActionCreators.onSave(data, dashboardInfo.id, SAVE_TYPE_OVERWRITE);
    }
  }, [
    actualLastModifiedTime,
    boundActionCreators,
    colorNamespace,
    colorScheme,
    customCss,
    dashboardInfo.certification_details,
    dashboardInfo.certified_by,
    dashboardInfo.common?.conf?.SUPERSET_DASHBOARD_POSITION_DATA_LIMIT,
    dashboardInfo.id,
    dashboardInfo.metadata,
    dashboardInfo.owners,
    dashboardInfo.roles,
    dashboardInfo.tags,
    dashboardTitle,
    layout,
    refreshFrequency,
    shouldPersistRefreshFrequency,
    slug,
  ]);

  const {
    showModal: showUnsavedChangesModal,
    setShowModal: setShowUnsavedChangesModal,
    handleConfirmNavigation,
    handleSaveAndCloseModal,
  } = useUnsavedChangesPrompt({
    hasUnsavedChanges,
    onSave: overwriteDashboard,
  });

  const showPropertiesModal = useCallback(() => {
    setShowingPropertiesModal(true);
  }, []);

  const hidePropertiesModal = useCallback(() => {
    setShowingPropertiesModal(false);
  }, []);

  const showEmbedModal = useCallback(() => {
    setShowingEmbedModal(true);
  }, []);

  const hideEmbedModal = useCallback(() => {
    setShowingEmbedModal(false);
  }, []);

  const metadataBar = useDashboardMetadataBar(dashboardInfo);

  // Responsive: track mobile breakpoint for header layout
  const MOBILE_BREAKPOINT = 768;
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT,
  );
  useEffect(() => {
    const onResize = () =>
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const userCanEdit =
    dashboardInfo.dash_edit_perm && !dashboardInfo.is_managed_externally;
  const userCanSaveAs = dashboardInfo.dash_save_perm;
  const userCanCurate =
    isFeatureEnabled(FeatureFlag.EmbeddedSuperset) &&
    findPermission('can_set_embedded', 'Dashboard', user.roles);
  const isEmbedded = !dashboardInfo?.userId;

  const handleOnPropertiesChange = useCallback(
    updates => {
      boundActionCreators.dashboardInfoChanged({
        slug: updates.slug,
        metadata: JSON.parse(updates.jsonMetadata || '{}'),
        certified_by: updates.certifiedBy,
        certification_details: updates.certificationDetails,
        owners: updates.owners,
        roles: updates.roles,
        tags: updates.tags,
      });
      boundActionCreators.setUnsavedChanges(true);

      if (updates.title && dashboardTitle !== updates.title) {
        boundActionCreators.updateDashboardTitle(updates.title);
        boundActionCreators.onChange();
      }
    },
    [boundActionCreators, dashboardTitle],
  );

  const handleEnterEditMode = useCallback(() => {
    toggleEditMode();
    boundActionCreators.clearDashboardHistory?.();
    boundActionCreators.setUnsavedChanges(false);
  }, [toggleEditMode, boundActionCreators]);

  const NavExtension = extensionsRegistry.get('dashboard.nav.right');

  const editableTitleProps = useMemo(
    () => ({
      title: dashboardTitle,
      canEdit: userCanEdit && editMode,
      onSave: handleChangeText,
      placeholder: t('Add the name of the dashboard'),
      label: t('Dashboard title'),
      showTooltip: false,
    }),
    [dashboardTitle, editMode, handleChangeText, userCanEdit],
  );

  const certifiedBadgeProps = useMemo(
    () => ({
      certifiedBy: dashboardInfo.certified_by,
      details: dashboardInfo.certification_details,
    }),
    [dashboardInfo.certification_details, dashboardInfo.certified_by],
  );

  const faveStarProps = useMemo(
    () => ({
      itemId: dashboardInfo.id,
      fetchFaveStar: boundActionCreators.fetchFaveStar,
      saveFaveStar: boundActionCreators.saveFaveStar,
      isStarred,
      showTooltip: true,
    }),
    [
      boundActionCreators.fetchFaveStar,
      boundActionCreators.saveFaveStar,
      dashboardInfo.id,
      isStarred,
    ],
  );

  const titlePanelAdditionalItems = useMemo(
    () => [
      /* PublishedStatus-бейдж («Черновик» / «Опубликовано») убран из
         header'а — статус и переключатель публикации теперь живут в
         DevToolsPanel-tile «Опубликовать / Снять с публикации». */
      // On mobile, metadata is shown in separate metadata-panel (not here)
      !editMode && !isEmbedded && !isMobile && metadataBar ? (
        <div key="metadata-bar" className="dashboard-metadata-bar-slot">
          {metadataBar}
        </div>
      ) : null,
    ],
    [
      boundActionCreators.savePublished,
      dashboardInfo.id,
      editMode,
      isMobile,
      metadataBar,
      isEmbedded,
      isPublished,
      userCanEdit,
      userCanSaveAs,
    ],
  );

  // Metadata bar as separate element for responsive 3-row layout
  const metadataBarSeparate = useMemo(
    () => (!editMode && !isEmbedded ? metadataBar : null),
    [editMode, isEmbedded, metadataBar],
  );

  const rightPanelAdditionalItems = useMemo(
    () => (
      <div className="button-container">
        {userCanSaveAs && (
          <div className="button-container" data-test="dashboard-edit-actions">
            {editMode && (
              /* Undo/Redo/Discard/Save убраны из header'а — их функции
                 доступны через DevToolsPanel (mini-rail → иконка
                 «Инструменты разработчика»). Save-кнопка оставлена
                 ВИЗУАЛЬНО СКРЫТОЙ (display:none), но остаётся в DOM —
                 DevToolsPanel.handleSave триггерит её клик по
                 data-test="header-save-button", чтобы не дублировать
                 тяжёлую overwriteDashboard-логику. */
              <div css={[actionButtonsStyle, { display: 'none' }]}>
                <div className="undoRedo">
                  <Tooltip
                    id="dashboard-undo-tooltip"
                    title={t('Undo the action')}
                  >
                    <StyledUndoRedoButton
                      buttonStyle="link"
                      disabled={undoLength < 1}
                      onClick={
                        undoLength > 0 ? boundActionCreators.onUndo : undefined
                      }
                    >
                      <Icons.Undo
                        css={[
                          undoRedoStyle,
                          emphasizeUndo && undoRedoEmphasized,
                          undoLength < 1 && undoRedoDisabled,
                        ]}
                        data-test="undo-action"
                        iconSize="xl"
                      />
                    </StyledUndoRedoButton>
                  </Tooltip>
                  <Tooltip
                    id="dashboard-redo-tooltip"
                    title={t('Redo the action')}
                  >
                    <StyledUndoRedoButton
                      buttonStyle="link"
                      disabled={redoLength < 1}
                      onClick={
                        redoLength > 0 ? boundActionCreators.onRedo : undefined
                      }
                    >
                      <Icons.Redo
                        css={[
                          undoRedoStyle,
                          emphasizeRedo && undoRedoEmphasized,
                          redoLength < 1 && undoRedoDisabled,
                        ]}
                        data-test="redo-action"
                        iconSize="xl"
                      />
                    </StyledUndoRedoButton>
                  </Tooltip>
                </div>
                <Button
                  css={discardBtnStyle}
                  buttonSize="small"
                  onClick={discardChanges}
                  buttonStyle="secondary"
                  data-test="discard-changes-button"
                  aria-label={t('Discard')}
                >
                  {t('Discard')}
                </Button>
                <Button
                  css={saveBtnStyle}
                  buttonSize="small"
                  disabled={!hasUnsavedChanges}
                  buttonStyle="primary"
                  onClick={overwriteDashboard}
                  data-test="header-save-button"
                  aria-label={t('Save')}
                >
                  <Icons.SaveOutlined iconSize="m" />
                  {t('Save')}
                </Button>
              </div>
            )}
          </div>
        )}
        {editMode ? (
          <UndoRedoKeyListeners onUndo={handleCtrlZ} onRedo={handleCtrlY} />
        ) : (
          /* «Edit dashboard» кнопка перенесена на DashboardSideRail
             (mini-rail над главным dock'ом) как action-иконка — чтобы
             юзер управлял редактированием через единую нижнюю панель
             вместе с Обновить/Полноэкранный. Здесь оставлен только
             NavExtension (расширения от плагинов). */
          <div css={actionButtonsStyle}>
            {NavExtension && <NavExtension />}
          </div>
        )}
      </div>
    ),
    [
      NavExtension,
      boundActionCreators.onRedo,
      boundActionCreators.onUndo,
      boundActionCreators.clearDashboardHistory,
      editMode,
      emphasizeRedo,
      emphasizeUndo,
      handleCtrlY,
      handleCtrlZ,
      handleEnterEditMode,
      hasUnsavedChanges,
      overwriteDashboard,
      redoLength,
      toggleEditMode,
      undoLength,
      userCanEdit,
      userCanSaveAs,
    ],
  );

  const [menu, isDropdownVisible, setIsDropdownVisible] = useHeaderActionsMenu({
    addSuccessToast: boundActionCreators.addSuccessToast,
    addDangerToast: boundActionCreators.addDangerToast,
    dashboardInfo,
    dashboardId: dashboardInfo.id,
    dashboardTitle,
    customCss,
    onChange: boundActionCreators.onChange,
    forceRefreshAllCharts: forceRefresh,
    updateCss: boundActionCreators.updateCss,
    editMode,
    userCanCurate,
    isLoading,
    showPropertiesModal,
    manageEmbedded: showEmbedModal,
    logEvent: boundActionCreators.logEvent,
  });
  return (
    <div
      css={headerContainerStyle}
      data-test="dashboard-header-container"
      data-test-id={dashboardInfo.id}
      className="dashboard-header-container"
    >
      <PageHeaderWithActions
        editableTitleProps={editableTitleProps}
        certificatiedBadgeProps={certifiedBadgeProps}
        faveStarProps={faveStarProps}
        titlePanelAdditionalItems={titlePanelAdditionalItems}
        metadataBar={metadataBarSeparate}
        rightPanelAdditionalItems={rightPanelAdditionalItems}
        menuDropdownProps={{
          open: isDropdownVisible,
          onOpenChange: setIsDropdownVisible,
        }}
        additionalActionsMenu={menu}
        showFaveStar={user?.userId && dashboardInfo?.id}
        showTitlePanelItems
        showMenuDropdown={false}
      />
      {showingPropertiesModal && (
        <PropertiesModal
          dashboardId={dashboardInfo.id}
          dashboardInfo={dashboardInfo}
          dashboardTitle={dashboardTitle}
          show={showingPropertiesModal}
          onHide={hidePropertiesModal}
          colorScheme={colorScheme}
          onSubmit={handleOnPropertiesChange}
          onlyApply
        />
      )}

      {/* ReportModal + DeleteModal для report'ов перенесены в
          DashboardSideRail вместе с popover'ом «Управление рассылкой
          по почте». */}

      <OverwriteConfirm />

      {userCanCurate && (
        <DashboardEmbedModal
          show={showingEmbedModal}
          onHide={hideEmbedModal}
          dashboardId={dashboardInfo.id}
        />
      )}
      <Global
        styles={css`
          .ant-menu-vertical {
            border-right: none;
          }
        `}
      />

      <UnsavedChangesModal
        title={t('Save changes to your dashboard?')}
        body={t("If you don't save, changes will be lost.")}
        showModal={showUnsavedChangesModal}
        onHide={() => setShowUnsavedChangesModal(false)}
        onConfirmNavigation={handleConfirmNavigation}
        handleSave={handleSaveAndCloseModal}
      />
    </div>
  );
};

export default Header;
