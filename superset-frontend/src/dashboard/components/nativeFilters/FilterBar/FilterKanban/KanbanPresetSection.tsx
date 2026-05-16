/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * KanbanPresetSection — preset-колонка в kanban-grid'е. Содержит:
 *   • header actions: сбросить фильтры / создать / импорт;
 *   • body: PresetPanelInline (search + pinned favorite + сворачиваемые
 *     группы «Корпоративные» и «Личные»);
 *   • модалки CreatePresetModal и ImportPresetModal — открываются из
 *     header actions.
 *
 * Состояние модалок и refreshKey изолированы внутри секции — снаружи
 * (FilterKanban) передаются только данные/колбэки применения пресета.
 */
import { css, Filters, styled, t } from '@superset-ui/core';
import { useCallback, useState, type FC } from 'react';
import { useSelector } from 'react-redux';
import { Icons } from '@superset-ui/core/components/Icons';
import { Tooltip } from '@superset-ui/core/components';
import type { DataMaskState } from '@superset-ui/core';
import type { RootState } from 'src/dashboard/types';
import CreatePresetModal from '../FilterPresets/CreatePresetModal';
import ImportPresetModal from '../FilterPresets/ImportPresetModal';
import PresetPanelInline from '../FilterPresets/PresetPanelInline';
import type { FilterPreset } from '../FilterPresets/types';
import FilterKanbanColumn from './FilterKanbanColumn';

const ActionBtn = styled.button`
  ${({ theme }) => css`
    background: transparent;
    border: none;
    padding: ${theme.sizeUnit}px;
    color: ${theme.colorTextTertiary};
    cursor: pointer;
    border-radius: ${theme.borderRadiusXS}px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 120ms ease;
    &:hover {
      color: ${theme.colorPrimary};
      background: ${theme.colorPrimaryBg};
    }
    &:focus-visible {
      outline: 2px solid ${theme.colorPrimaryBorder};
      outline-offset: 1px;
    }
  `}
`;

export interface KanbanPresetSectionProps {
  dashboardId: number;
  dataMaskSelected: DataMaskState;
  filters: Filters;
  activePresetId: number | null;
  onApplyPreset: (
    filterData: DataMaskState,
    includedFilters: string[],
  ) => void;
  onClearAll: () => void;
  onPresetChange: (id: number | null, name: string | null) => void;
  onPresetsRefresh: () => void;
  /** Заголовок колонки (переопределённое имя или дефолт «Пресеты»). */
  title?: string;
  /** Callback переименования колонки «Пресеты». Null — rename запрещён. */
  onRename?: ((name: string) => void) | null;
}

const KanbanPresetSection: FC<KanbanPresetSectionProps> = ({
  dashboardId,
  dataMaskSelected,
  filters,
  activePresetId,
  onApplyPreset,
  onClearAll,
  onPresetChange,
  onPresetsRefresh,
  title,
  onRename,
}) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editPreset, setEditPreset] = useState<FilterPreset | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const user = useSelector((state: RootState) => state.user);
  const isAdmin = !!(user?.roles && 'Admin' in user.roles);

  const handleApply = useCallback(
    (preset: FilterPreset) => {
      onApplyPreset(preset.filterData, preset.includedFilters);
      onPresetChange(preset.id, preset.name);
    },
    [onApplyPreset, onPresetChange],
  );

  const handleCreate = useCallback(() => {
    setEditPreset(null);
    setCreateModalOpen(true);
  }, []);

  const handleImport = useCallback(() => {
    setImportModalOpen(true);
  }, []);

  const handleEdit = useCallback((preset: FilterPreset) => {
    setEditPreset(preset);
    setCreateModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setCreateModalOpen(false);
    setEditPreset(null);
    setRefreshKey(k => k + 1);
    onPresetsRefresh();
  }, [onPresetsRefresh]);

  const handleImportClose = useCallback(() => {
    setImportModalOpen(false);
    setRefreshKey(k => k + 1);
    onPresetsRefresh();
  }, [onPresetsRefresh]);

  const headerActions = (
    <>
      <Tooltip title={t('Сбросить фильтры')}>
        <ActionBtn
          type="button"
          onClick={onClearAll}
          aria-label={t('Сбросить фильтры')}
        >
          <Icons.Undo iconSize="s" />
        </ActionBtn>
      </Tooltip>
      <Tooltip title={t('Создать пресет')}>
        <ActionBtn
          type="button"
          onClick={handleCreate}
          aria-label={t('Создать пресет')}
        >
          <Icons.PlusOutlined iconSize="s" />
        </ActionBtn>
      </Tooltip>
      <Tooltip title={t('Импорт пресета')}>
        <ActionBtn
          type="button"
          onClick={handleImport}
          aria-label={t('Импорт пресета')}
        >
          <Icons.DownloadOutlined iconSize="s" />
        </ActionBtn>
      </Tooltip>
    </>
  );

  return (
    <>
      <FilterKanbanColumn
        categoryId="__presets__"
        title={title || t('Пресеты')}
        filterIds={[]}
        renderFilterNode={() => null}
        onMoveFilter={() => {}}
        onRename={onRename ?? null}
        onDelete={null}
        isPresetColumn
        headerActions={headerActions}
        customContent={
          <PresetPanelInline
            dashboardId={dashboardId}
            activePresetId={activePresetId}
            onApplyPreset={handleApply}
            onEditClick={handleEdit}
            refreshKey={refreshKey}
            onPresetsRefresh={onPresetsRefresh}
          />
        }
      />
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

export default KanbanPresetSection;
