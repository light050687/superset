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
import { useCallback, useState } from 'react';
import { css, DataMaskState, Filter, styled, t } from '@superset-ui/core';
import { Popover } from 'antd';
import Icons from 'src/components/Icons';
import { FilterPreset } from './types';
import PresetDropdown from './PresetDropdown';
import CreatePresetModal from './CreatePresetModal';
import ImportPresetModal from './ImportPresetModal';

const StyledButton = styled.button`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid ${theme.colorBorderSecondary};
    border-radius: ${theme.borderRadiusSM}px;
    background: ${theme.colorBgContainer};
    cursor: pointer;
    padding: ${theme.sizeUnit}px ${theme.sizeUnit * 2}px;
    color: ${theme.colorTextSecondary};
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

interface PresetButtonProps {
  dashboardId: number;
  dataMaskSelected: DataMaskState;
  filters: Record<string, Filter>;
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

  const handleApplyPreset = useCallback(
    (preset: FilterPreset) => {
      onApplyPreset(preset.filterData, preset.includedFilters);
      setPopoverOpen(false);
    },
    [onApplyPreset],
  );

  const handleClearAll = useCallback(() => {
    onClearAll();
    setPopoverOpen(false);
  }, [onClearAll]);

  const handleCreateClick = useCallback(() => {
    setPopoverOpen(false);
    setCreateModalOpen(true);
  }, []);

  const handleImportClick = useCallback(() => {
    setPopoverOpen(false);
    setImportModalOpen(true);
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
        content={
          <PresetDropdown
            dashboardId={dashboardId}
            onApplyPreset={handleApplyPreset}
            onClearAll={handleClearAll}
            onCreateClick={handleCreateClick}
            onImportClick={handleImportClick}
          />
        }
      >
        <StyledButton
          aria-label={t('Пресеты фильтров')}
          aria-haspopup="listbox"
          aria-expanded={popoverOpen}
        >
          <Icons.BookmarkFilled iconSize="m" />
        </StyledButton>
      </Popover>

      {createModalOpen && (
        <CreatePresetModal
          dashboardId={dashboardId}
          dataMaskSelected={dataMaskSelected}
          filters={filters}
          onClose={() => setCreateModalOpen(false)}
        />
      )}

      {importModalOpen && (
        <ImportPresetModal
          dashboardId={dashboardId}
          onClose={() => setImportModalOpen(false)}
        />
      )}
    </>
  );
};

export default PresetButton;
