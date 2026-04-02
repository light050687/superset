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
import { useCallback, useEffect, useState } from 'react';
import { css, DataMaskState, Filters, styled, t } from '@superset-ui/core';
import { Popover } from 'antd';
import { useSelector } from 'react-redux';
import { Icons } from '@superset-ui/core/components/Icons';
import { RootState } from 'src/dashboard/types';
import { FilterPreset } from './types';
import { fetchDefaultPreset } from './api';
import PresetDropdown from './PresetDropdown';
import CreatePresetModal from './CreatePresetModal';
import ImportPresetModal from './ImportPresetModal';

const StyledButton = styled.button`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${theme.sizeUnit}px;
    width: 100%;
    border: 1px dashed ${theme.colorBorderSecondary};
    border-radius: ${theme.borderRadiusSM}px;
    background: ${theme.colorBgContainer};
    cursor: pointer;
    padding: ${theme.sizeUnit * 2}px;
    color: ${theme.colorTextSecondary};
    font-size: ${theme.fontSizeSM}px;
    transition: all 0.2s;
    &:hover {
      background: ${theme.colorBgTextHover};
      color: ${theme.colorText};
      border-color: ${theme.colorPrimaryBorder};
    }
    &:focus-visible {
      outline: 2px solid ${theme.colorPrimaryBorder};
      outline-offset: 1px;
    }
  `}
`;

const ActivePresetLabel = styled.div`
  ${({ theme }) => css`
    width: 100%;
    text-align: center;
    font-size: ${theme.fontSizeXS}px;
    color: ${theme.colorTextTertiary};
    padding: ${theme.sizeUnit}px 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `}
`;

interface PresetButtonProps {
  dashboardId: number;
  dataMaskSelected: DataMaskState;
  filters: Filters;
  onApplyPreset: (
    filterData: DataMaskState,
    includedFilters: string[],
  ) => void;
  onClearAll: () => void;
}

const PresetButton = ({
  dashboardId,
  dataMaskSelected,
  filters,
  onApplyPreset,
  onClearAll,
}: PresetButtonProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editPreset, setEditPreset] = useState<FilterPreset | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activePresetName, setActivePresetName] = useState<string | null>(null);

  const user = useSelector((state: RootState) => state.user);
  const isAdmin = !!(user?.roles && 'Admin' in user.roles);

  // Load active (default) preset name on mount and after changes
  useEffect(() => {
    if (dashboardId) {
      fetchDefaultPreset(dashboardId).then(preset => {
        setActivePresetName(preset?.name ?? null);
      });
    }
  }, [dashboardId, refreshKey]);

  const handleApplyPreset = useCallback(
    (preset: FilterPreset) => {
      onApplyPreset(preset.filterData, preset.includedFilters);
      setActivePresetName(preset.name);
      setPopoverOpen(false);
    },
    [onApplyPreset],
  );

  const handleClearAll = useCallback(() => {
    onClearAll();
    setActivePresetName(null);
    setPopoverOpen(false);
  }, [onClearAll]);

  const handleCreateClick = useCallback(() => {
    setPopoverOpen(false);
    setEditPreset(null);
    setCreateModalOpen(true);
  }, []);

  const handleEditClick = useCallback((preset: FilterPreset) => {
    setPopoverOpen(false);
    setEditPreset(preset);
    setCreateModalOpen(true);
  }, []);

  const handleImportClick = useCallback(() => {
    setPopoverOpen(false);
    setImportModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setCreateModalOpen(false);
    setEditPreset(null);
    setRefreshKey(k => k + 1);
  }, []);

  const handleImportClose = useCallback(() => {
    setImportModalOpen(false);
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <>
      <Popover
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        trigger="click"
        placement="bottomRight"
        arrow={false}
        overlayInnerStyle={{ padding: 0 }}
        destroyTooltipOnHide
        content={
          <PresetDropdown
            key={refreshKey}
            dashboardId={dashboardId}
            onApplyPreset={handleApplyPreset}
            onClearAll={handleClearAll}
            onCreateClick={handleCreateClick}
            onImportClick={handleImportClick}
            onEditClick={handleEditClick}
          />
        }
      >
        <StyledButton
          aria-label={t('Пресеты фильтров')}
          aria-haspopup="listbox"
          aria-expanded={popoverOpen}
        >
          <Icons.SaveOutlined />
          {t('Пресеты')}
        </StyledButton>
      </Popover>

      {activePresetName && (
        <ActivePresetLabel title={activePresetName}>
          {activePresetName}
        </ActivePresetLabel>
      )}

      {createModalOpen && (
        <CreatePresetModal
          dashboardId={dashboardId}
          dataMaskSelected={dataMaskSelected}
          filters={filters}
          isAdmin={isAdmin}
          editPreset={editPreset}
          onClose={handleModalClose}
        />
      )}

      {importModalOpen && (
        <ImportPresetModal
          dashboardId={dashboardId}
          onClose={handleImportClose}
        />
      )}
    </>
  );
};

export default PresetButton;
