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
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Menu, MenuItem } from '@superset-ui/core/components/Menu';
import { t } from '@superset-ui/core';
import { isEmpty } from 'lodash';
import { URL_PARAMS } from 'src/constants';
import { useDownloadMenuItems } from 'src/dashboard/components/menu/DownloadMenuItems';
import CssEditor from 'src/dashboard/components/CssEditor';
import injectCustomCss from 'src/dashboard/util/injectCustomCss';
import FilterScopeModal from 'src/dashboard/components/filterscope/FilterScopeModal';
import getDashboardUrl from 'src/dashboard/util/getDashboardUrl';
import { getActiveFilters } from 'src/dashboard/util/activeDashboardFilters';
import { getUrlParam } from 'src/utils/urlUtils';
import { MenuKeys } from 'src/dashboard/types';
import { HeaderDropdownProps } from 'src/dashboard/components/Header/types';
import { updateDashboardTheme } from 'src/dashboard/actions/dashboardInfo';

/**
 * Меню шестерёнки в дашборде. Часто-используемые действия (Save / Share /
 * Email report / Auto-refresh interval) перенесены на DashboardSideRail
 * как icon-кнопки с popover'ами. Здесь остаются только редкие/edit-mode
 * пункты: Edit properties, Theme & CSS, Embed, Set filter mapping, Download.
 */
export const useHeaderActionsMenu = ({
  customCss,
  dashboardInfo,
  editMode,
  isLoading,
  addDangerToast,
  forceRefreshAllCharts,
  showPropertiesModal,
  manageEmbedded,
  onChange,
  updateCss,
  dashboardTitle,
  dashboardId,
  userCanCurate,
  logEvent,
}: HeaderDropdownProps) => {
  const dispatch = useDispatch();
  const [css, setCss] = useState(customCss || '');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  useEffect(() => {
    if (customCss !== css) {
      setCss(customCss || '');
      injectCustomCss(customCss);
    }
  }, [css, customCss]);

  const handleThemeChange = useCallback(
    async (themeId: number | null) => {
      // Save the theme to the dashboard
      // The CrudThemeProvider will handle applying the theme to dashboard content only
      dispatch(updateDashboardTheme(themeId));
    },
    [dispatch],
  );

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      switch (key) {
        case MenuKeys.RefreshDashboard:
          forceRefreshAllCharts();
          break;
        case MenuKeys.EditProperties:
          showPropertiesModal();
          break;
        case MenuKeys.ToggleFullscreen: {
          const isCurrentlyStandalone =
            Number(getUrlParam(URL_PARAMS.standalone)) === 1;
          const url = getDashboardUrl({
            pathname: window.location.pathname,
            filters: getActiveFilters(),
            hash: window.location.hash,
            standalone: isCurrentlyStandalone ? null : 1,
          });
          window.location.replace(url);
          break;
        }
        case MenuKeys.ManageEmbedded:
          manageEmbedded();
          break;
        default:
          break;
      }
      setIsDropdownVisible(false);
    },
    [forceRefreshAllCharts, showPropertiesModal, manageEmbedded],
  );

  const changeCss = useCallback(
    (newCss: string) => {
      onChange();
      updateCss(newCss);
    },
    [onChange, updateCss],
  );

  const downloadMenuItem = useDownloadMenuItems({
    pdfMenuItemTitle: t('Export to PDF'),
    imageMenuItemTitle: t('Download as Image'),
    dashboardTitle,
    dashboardId,
    title: t('Download'),
    disabled: isLoading,
    logEvent,
  });

  // Helper function to create menu items for components with triggerNode
  const createModalMenuItem = (
    key: string,
    modalComponent: React.ReactElement,
  ): MenuItem => ({
    key,
    label: modalComponent,
  });

  const menu = useMemo(() => {
    const menuItems: MenuItem[] = [];

    // Edit properties
    if (editMode) {
      menuItems.push({
        key: MenuKeys.EditProperties,
        label: t('Edit properties'),
      });
    }

    // Edit CSS
    if (editMode) {
      menuItems.push(
        createModalMenuItem(
          MenuKeys.EditCss,
          <CssEditor
            triggerNode={<div>{t('Theme & CSS')}</div>}
            initialCss={css}
            onChange={changeCss}
            addDangerToast={addDangerToast}
            currentThemeId={dashboardInfo.theme?.id || null}
            onThemeChange={handleThemeChange}
          />,
        ),
      );
    }

    // Divider
    if (menuItems.length > 0) {
      menuItems.push({ type: 'divider' });
    }

    // Download submenu
    menuItems.push(downloadMenuItem);

    // Embed dashboard
    if (!editMode && userCanCurate) {
      menuItems.push({
        key: MenuKeys.ManageEmbedded,
        label: t('Embed dashboard'),
      });
    }

    // Set filter mapping
    if (editMode && !isEmpty(dashboardInfo?.metadata?.filter_scopes)) {
      menuItems.push(
        createModalMenuItem(
          MenuKeys.SetFilterMapping,
          <FilterScopeModal
            triggerNode={<div>{t('Set filter mapping')}</div>}
          />,
        ),
      );
    }

    return (
      <Menu
        selectable={false}
        data-test="header-actions-menu"
        onClick={handleMenuClick}
        items={menuItems}
      />
    );
  }, [
    addDangerToast,
    changeCss,
    css,
    dashboardInfo,
    downloadMenuItem,
    editMode,
    handleMenuClick,
    handleThemeChange,
    userCanCurate,
  ]);

  return [menu, isDropdownVisible, setIsDropdownVisible];
};
