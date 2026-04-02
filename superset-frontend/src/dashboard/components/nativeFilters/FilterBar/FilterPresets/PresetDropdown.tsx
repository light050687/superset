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
import { css, styled, t, useTheme } from '@superset-ui/core';
import { Input, Tooltip } from 'antd';
import Icons from 'src/components/Icons';
import { FilterPreset } from './types';
import {
  deletePreset,
  exportPreset,
  fetchPresets,
  hidePreset,
  removeDefaultPreset,
  setDefaultPreset,
} from './api';

const DropdownContainer = styled.div`
  ${({ theme }) => css`
    width: 320px;
    max-height: 480px;
    display: flex;
    flex-direction: column;
    background: ${theme.colorBgContainer};
    border-radius: ${theme.borderRadiusLG}px;
    box-shadow: ${theme.boxShadow};
  `}
`;

const SearchWrapper = styled.div`
  ${({ theme }) => css`
    padding: ${theme.sizeUnit * 3}px;
    border-bottom: 1px solid ${theme.colorBorderSecondary};
  `}
`;

const PresetList = styled.div`
  ${({ theme }) => css`
    flex: 1;
    overflow-y: auto;
    padding: ${theme.sizeUnit}px 0;
  `}
`;

const PresetItem = styled.div<{ isActive?: boolean }>`
  ${({ theme, isActive }) => css`
    display: flex;
    align-items: center;
    padding: ${theme.sizeUnit * 2}px ${theme.sizeUnit * 3}px;
    cursor: pointer;
    gap: ${theme.sizeUnit * 2}px;
    background: ${isActive ? theme.colorBgTextHover : 'transparent'};
    &:hover {
      background: ${theme.colorBgTextHover};
    }
  `}
`;

const PresetName = styled.span`
  ${({ theme }) => css`
    flex: 1;
    font-size: ${theme.fontSizeSM}px;
    color: ${theme.colorText};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `}
`;

const AdminBadge = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.fontSizeXS}px;
    color: ${theme.colorWarning};
    background: ${theme.colorWarningBg};
    padding: 1px ${theme.sizeUnit}px;
    border-radius: ${theme.borderRadiusSM}px;
  `}
`;

const FooterActions = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    border-top: 1px solid ${theme.colorBorderSecondary};
    padding: ${theme.sizeUnit * 2}px ${theme.sizeUnit * 3}px;
    gap: ${theme.sizeUnit}px;
  `}
`;

const FooterButton = styled.button`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.sizeUnit * 2}px;
    padding: ${theme.sizeUnit * 2}px;
    border: none;
    border-radius: ${theme.borderRadiusSM}px;
    background: transparent;
    color: ${theme.colorText};
    font-size: ${theme.fontSizeSM}px;
    cursor: pointer;
    width: 100%;
    text-align: left;
    &:hover {
      background: ${theme.colorBgTextHover};
    }
  `}
`;

const IconButton = styled.button`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: ${theme.sizeUnit}px;
    border-radius: ${theme.borderRadiusSM}px;
    color: ${theme.colorTextSecondary};
    &:hover {
      background: ${theme.colorBgTextHover};
      color: ${theme.colorText};
    }
  `}
`;

const EmptyState = styled.div`
  ${({ theme }) => css`
    padding: ${theme.sizeUnit * 6}px ${theme.sizeUnit * 3}px;
    text-align: center;
    color: ${theme.colorTextSecondary};
    font-size: ${theme.fontSizeSM}px;
  `}
`;

interface PresetDropdownProps {
  dashboardId: number;
  onApplyPreset: (preset: FilterPreset) => void;
  onClearAll: () => void;
  onCreateClick: () => void;
  onImportClick: () => void;
}

const PresetDropdown = ({
  dashboardId,
  onApplyPreset,
  onClearAll,
  onCreateClick,
  onImportClick,
}: PresetDropdownProps) => {
  const theme = useTheme();
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPresets = useCallback(
    async (query?: string) => {
      setLoading(true);
      const result = await fetchPresets(dashboardId, query);
      setPresets(result);
      setLoading(false);
    },
    [dashboardId],
  );

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      loadPresets(value || undefined);
    },
    [loadPresets],
  );

  const handleToggleDefault = useCallback(
    async (preset: FilterPreset) => {
      if (preset.isDefault) {
        await removeDefaultPreset(dashboardId);
      } else {
        await setDefaultPreset(dashboardId, preset.id);
      }
      loadPresets(searchQuery || undefined);
    },
    [dashboardId, loadPresets, searchQuery],
  );

  const handleDelete = useCallback(
    async (presetId: number) => {
      await deletePreset(dashboardId, presetId);
      loadPresets(searchQuery || undefined);
    },
    [dashboardId, loadPresets, searchQuery],
  );

  const handleExport = useCallback(
    async (presetId: number) => {
      const data = await exportPreset(dashboardId, presetId);
      if (data) {
        const jsonStr = JSON.stringify(data, null, 2);
        await navigator.clipboard.writeText(jsonStr);
      }
    },
    [dashboardId],
  );

  const handleHide = useCallback(
    async (presetId: number) => {
      await hidePreset(dashboardId, presetId);
      loadPresets(searchQuery || undefined);
    },
    [dashboardId, loadPresets, searchQuery],
  );

  return (
    <DropdownContainer role="listbox" aria-label={t('Пресеты фильтров')}>
      <SearchWrapper>
        <Input
          placeholder={t('Поиск пресетов...')}
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          allowClear
          size="small"
          aria-label={t('Поиск пресетов')}
        />
      </SearchWrapper>

      <PresetList>
        {presets.length === 0 && !loading && (
          <EmptyState>
            {searchQuery
              ? t('Пресеты не найдены')
              : t('Нет сохранённых пресетов')}
          </EmptyState>
        )}
        {presets.map(preset => (
          <PresetItem
            key={preset.id}
            role="option"
            onClick={() => onApplyPreset(preset)}
            aria-label={preset.name}
          >
            <Tooltip
              title={
                preset.isDefault
                  ? t('Убрать из основного')
                  : t('Назначить по умолчанию')
              }
            >
              <IconButton
                onClick={e => {
                  e.stopPropagation();
                  handleToggleDefault(preset);
                }}
                aria-label={t('Назначить по умолчанию')}
              >
                <Icons.FavoriteLarge
                  iconSize="m"
                  css={css`
                    color: ${preset.isDefault
                      ? theme.colorWarning
                      : theme.colorTextSecondary};
                  `}
                />
              </IconButton>
            </Tooltip>

            <PresetName>{preset.name}</PresetName>

            {preset.isAdminPreset && <AdminBadge>{t('Админ')}</AdminBadge>}

            <Tooltip title={t('Экспорт в буфер')}>
              <IconButton
                onClick={e => {
                  e.stopPropagation();
                  handleExport(preset.id);
                }}
                aria-label={t('Экспорт')}
              >
                <Icons.Share iconSize="m" />
              </IconButton>
            </Tooltip>

            {preset.isOwn && !preset.isAdminPreset && (
              <Tooltip title={t('Удалить')}>
                <IconButton
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(preset.id);
                  }}
                  aria-label={t('Удалить пресет')}
                >
                  <Icons.Trash iconSize="m" />
                </IconButton>
              </Tooltip>
            )}

            {preset.isAdminPreset && !preset.isOwn && (
              <Tooltip title={t('Скрыть')}>
                <IconButton
                  onClick={e => {
                    e.stopPropagation();
                    handleHide(preset.id);
                  }}
                  aria-label={t('Скрыть пресет')}
                >
                  <Icons.EyeSlash iconSize="m" />
                </IconButton>
              </Tooltip>
            )}
          </PresetItem>
        ))}
      </PresetList>

      <FooterActions>
        <FooterButton onClick={onClearAll} aria-label={t('Сбросить фильтры')}>
          <Icons.Undo iconSize="m" />
          {t('Сбросить фильтры')}
        </FooterButton>
        <FooterButton
          onClick={onCreateClick}
          aria-label={t('Создать пресет')}
        >
          <Icons.PlusLarge iconSize="m" />
          {t('Создать пресет')}
        </FooterButton>
        <FooterButton
          onClick={onImportClick}
          aria-label={t('Импорт пресета')}
        >
          <Icons.Download iconSize="m" />
          {t('Импорт пресета')}
        </FooterButton>
      </FooterActions>
    </DropdownContainer>
  );
};

export default PresetDropdown;
