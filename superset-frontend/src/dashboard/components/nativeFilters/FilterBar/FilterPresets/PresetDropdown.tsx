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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { css, styled, t, useTheme } from '@superset-ui/core';
import { Input, message } from 'antd';
import { Tooltip } from '@superset-ui/core/components';
import { Icons } from '@superset-ui/core/components/Icons';
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
    width: min(320px, calc(100vw - 32px));
    max-height: min(480px, calc(100vh - 120px));
    display: flex;
    flex-direction: column;
    background: ${theme.colorBgContainer};
    border-radius: ${theme.borderRadiusLG}px;
    box-shadow: ${theme.boxShadow};
  `}
`;

const SearchWrapper = styled.div`
  ${({ theme }) => css`
    padding: ${theme.sizeUnit * 2}px ${theme.sizeUnit * 3}px;
    border-bottom: 1px solid ${theme.colorBorderSecondary};
  `}
`;

const PresetList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const SectionLabel = styled.div`
  ${({ theme }) => css`
    font-size: ${theme.fontSizeXS}px;
    color: ${theme.colorTextTertiary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: ${theme.sizeUnit * 2}px ${theme.sizeUnit * 3}px ${theme.sizeUnit}px;
  `}
`;

const SectionDivider = styled.div`
  ${({ theme }) => css`
    height: 1px;
    background: ${theme.colorBorderSecondary};
    margin: ${theme.sizeUnit}px ${theme.sizeUnit * 3}px;
  `}
`;

const PresetItem = styled.div<{ isActive?: boolean }>`
  ${({ theme, isActive }) => css`
    display: flex;
    align-items: center;
    padding: ${theme.sizeUnit * 2}px ${theme.sizeUnit * 3}px;
    cursor: pointer;
    gap: ${theme.sizeUnit}px;
    background: ${isActive ? theme.colorPrimaryBg : 'transparent'};
    border-left: 3px solid ${isActive ? theme.colorPrimary : 'transparent'};
    &:hover {
      background: ${isActive ? theme.colorPrimaryBg : theme.colorBgTextHover};
    }
  `}
`;

const PresetName = styled.span<{ isActive?: boolean }>`
  ${({ theme, isActive }) => css`
    flex: 1;
    font-size: ${theme.fontSizeSM}px;
    color: ${isActive ? theme.colorPrimary : theme.colorText};
    font-weight: ${isActive ? theme.fontWeightStrong : 'normal'};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    padding: 2px;
    border-radius: ${theme.borderRadiusSM}px;
    color: ${theme.colorTextTertiary};
    font-size: 14px;
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
  activePresetId?: number | null;
  onApplyPreset: (preset: FilterPreset) => void;
  onClearAll: () => void;
  onCreateClick: () => void;
  onImportClick: () => void;
  onEditClick: (preset: FilterPreset) => void;
}

const PresetDropdown = ({
  dashboardId,
  activePresetId,
  onApplyPreset,
  onClearAll,
  onCreateClick,
  onImportClick,
  onEditClick,
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
        message.success(t('Скопировано в буфер'));
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

  const adminPresets = useMemo(
    () => presets.filter(p => p.isAdminPreset),
    [presets],
  );
  const personalPresets = useMemo(
    () => presets.filter(p => !p.isAdminPreset),
    [presets],
  );

  const renderPresetItem = (preset: FilterPreset) => {
    const isActive = preset.id === activePresetId;
    return (
      <PresetItem
        key={preset.id}
        role="option"
        isActive={isActive}
        onClick={() => onApplyPreset(preset)}
        aria-label={preset.name}
        aria-selected={isActive}
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
            aria-label={t('По умолчанию')}
          >
            <Icons.StarFilled
              css={css`
                color: ${preset.isDefault
                  ? theme.colorWarning
                  : theme.colorTextTertiary};
              `}
            />
          </IconButton>
        </Tooltip>

        <PresetName isActive={isActive}>{preset.name}</PresetName>

        {(preset.isOwn || preset.isAdminPreset) && (
          <Tooltip title={t('Редактировать')}>
            <IconButton
              onClick={e => {
                e.stopPropagation();
                onEditClick(preset);
              }}
              aria-label={t('Редактировать')}
            >
              <Icons.EditOutlined />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title={t('Экспорт в буфер')}>
          <IconButton
            onClick={e => {
              e.stopPropagation();
              handleExport(preset.id);
            }}
            aria-label={t('Экспорт')}
          >
            <Icons.ShareAltOutlined />
          </IconButton>
        </Tooltip>

        {preset.isOwn && (
          <Tooltip title={t('Удалить')}>
            <IconButton
              onClick={e => {
                e.stopPropagation();
                handleDelete(preset.id);
              }}
              aria-label={t('Удалить')}
            >
              <Icons.DeleteOutlined />
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
              aria-label={t('Скрыть')}
            >
              <Icons.EyeInvisibleOutlined />
            </IconButton>
          </Tooltip>
        )}
      </PresetItem>
    );
  };

  const hasAny = presets.length > 0;

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
        {!hasAny && !loading && (
          <EmptyState>
            {searchQuery
              ? t('Пресеты не найдены')
              : t('Нет сохранённых пресетов')}
          </EmptyState>
        )}

        {adminPresets.length > 0 && (
          <>
            <SectionLabel>{t('Корпоративные')}</SectionLabel>
            {adminPresets.map(renderPresetItem)}
          </>
        )}

        {adminPresets.length > 0 && personalPresets.length > 0 && (
          <SectionDivider />
        )}

        {personalPresets.length > 0 && (
          <>
            <SectionLabel>{t('Личные')}</SectionLabel>
            {personalPresets.map(renderPresetItem)}
          </>
        )}
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
          <Icons.PlusOutlined />
          {t('Создать пресет')}
        </FooterButton>
        <FooterButton
          onClick={onImportClick}
          aria-label={t('Импорт пресета')}
        >
          <Icons.DownloadOutlined />
          {t('Импорт пресета')}
        </FooterButton>
      </FooterActions>
    </DropdownContainer>
  );
};

export default PresetDropdown;
