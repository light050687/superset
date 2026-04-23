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
 * PresetPanelInline — inline-версия пресет-списка для kanban-колонки
 * «Пресеты» в FiltersDrawer. В отличие от PresetDropdown:
 *   • без popover-контейнера (встраивается в body колонки);
 *   • группы «Корпоративные» и «Личные» collapsible;
 *   • активный preset (currently applied) продублирован в pinned-блоке
 *     прямо под строкой поиска, даже если поиск его отфильтровал;
 *   • нет footer action-кнопок — они вынесены в header колонки
 *     (sbросить / создать / импорт).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { css, styled, t, useTheme } from '@superset-ui/core';
import { message } from 'antd';
import { Tooltip } from '@superset-ui/core/components';
import { Icons } from '@superset-ui/core/components/Icons';
import { useFilterSearch } from '../FilterKanban/FilterSearchContext';
import type { FilterPreset } from './types';
import {
  deletePreset,
  exportPreset,
  fetchPresets,
  hidePreset,
  removeDefaultPreset,
  setDefaultPreset,
} from './api';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.sizeUnit}px;
  height: 100%;
  min-height: 0;
`;

const PinnedBlock = styled.div`
  ${({ theme }) => css`
    padding: ${theme.sizeUnit}px 0 ${theme.sizeUnit * 2}px;
    border-bottom: 1px solid ${theme.colorBorderSecondary};
  `}
`;

const PinnedLabel = styled.div`
  ${({ theme }) => css`
    font-size: ${theme.fontSizeXS}px;
    color: ${theme.colorTextTertiary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 0 ${theme.sizeUnit}px ${theme.sizeUnit}px;
  `}
`;

const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.colorBorderSecondary} transparent;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colorBorderSecondary};
    border-radius: 3px;
  }
`;

const Section = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  &:last-child {
    border-bottom: none;
  }
`;

const SectionHeader = styled.button`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.sizeUnit}px;
    width: 100%;
    padding: ${theme.sizeUnit * 2}px ${theme.sizeUnit}px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: ${theme.fontSizeXS}px;
    font-weight: ${theme.fontWeightStrong};
    color: ${theme.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: left;
    &:hover {
      color: ${theme.colorText};
    }
    &:focus-visible {
      outline: 2px solid ${theme.colorPrimaryBorder};
      outline-offset: -2px;
    }
  `}
`;

const ChevronIcon = styled(Icons.RightOutlined)<{ $open: boolean }>`
  transition: transform 160ms ease;
  transform: rotate(${({ $open }) => ($open ? '90deg' : '0deg')});
`;

const PresetItem = styled.div<{ $active?: boolean }>`
  ${({ theme, $active }) => css`
    display: flex;
    align-items: center;
    padding: ${theme.sizeUnit}px ${theme.sizeUnit * 2}px;
    cursor: pointer;
    gap: ${theme.sizeUnit}px;
    border-radius: ${theme.borderRadiusSM}px;
    background: ${$active ? theme.colorPrimaryBg : 'transparent'};
    border-left: 3px solid
      ${$active ? theme.colorPrimary : 'transparent'};
    &:hover {
      background: ${$active ? theme.colorPrimaryBg : theme.colorBgTextHover};
    }
  `}
`;

const PresetName = styled.span<{ $active?: boolean }>`
  ${({ theme, $active }) => css`
    flex: 1;
    font-size: ${theme.fontSizeSM}px;
    color: ${$active ? theme.colorPrimary : theme.colorText};
    font-weight: ${$active ? theme.fontWeightStrong : 'normal'};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    font-size: 12px;
    &:hover {
      background: ${theme.colorBgTextHover};
      color: ${theme.colorText};
    }
  `}
`;

const EmptyState = styled.div`
  ${({ theme }) => css`
    padding: ${theme.sizeUnit * 4}px ${theme.sizeUnit * 2}px;
    text-align: center;
    color: ${theme.colorTextSecondary};
    font-size: ${theme.fontSizeSM}px;
  `}
`;

export interface PresetPanelInlineProps {
  dashboardId: number;
  activePresetId: number | null;
  onApplyPreset: (preset: FilterPreset) => void;
  onEditClick: (preset: FilterPreset) => void;
  /** Ключ пересборки — изменяется извне после create/import/edit. */
  refreshKey?: number;
  /** Reserved для будущего: коллбек refresh после mutation в панели. */
  onPresetsRefresh?: () => void;
}

const PresetPanelInline = ({
  dashboardId,
  activePresetId,
  onApplyPreset,
  onEditClick,
  refreshKey = 0,
  onPresetsRefresh,
}: PresetPanelInlineProps) => {
  const theme = useTheme();
  const { query: searchQuery } = useFilterSearch();
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminOpen, setAdminOpen] = useState(true);
  const [personalOpen, setPersonalOpen] = useState(true);

  /** Грузим ВСЕ пресеты без query — фильтрация по имени применяется
   *  клиентом. Раньше query шёл в `fetchPresets` (backend `?q=...`) и
   *  для общих запросов («Period», «Регион») возвращал 0 пресетов —
   *  пресеты пропадали даже на точечном совпадении по имени. */
  const loadPresets = useCallback(async () => {
    setLoading(true);
    const result = await fetchPresets(dashboardId);
    setPresets(result);
    setLoading(false);
  }, [dashboardId]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets, refreshKey]);

  const refresh = useCallback(() => {
    loadPresets();
    onPresetsRefresh?.();
  }, [loadPresets, onPresetsRefresh]);

  /** Client-side фильтрация по названию пресета. */
  const filteredPresets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter(p => p.name.toLowerCase().includes(q));
  }, [presets, searchQuery]);

  const handleToggleDefault = useCallback(
    async (preset: FilterPreset) => {
      if (preset.isDefault) {
        await removeDefaultPreset(dashboardId);
      } else {
        await setDefaultPreset(dashboardId, preset.id);
      }
      refresh();
    },
    [dashboardId, refresh],
  );

  const handleDelete = useCallback(
    async (presetId: number) => {
      await deletePreset(dashboardId, presetId);
      refresh();
    },
    [dashboardId, refresh],
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
      refresh();
    },
    [dashboardId, refresh],
  );

  /** Избранный preset всегда виден сверху независимо от поиска —
   *  юзер ожидает, что default всегда под рукой. */
  const defaultPreset = useMemo(
    () => presets.find(p => p.isDefault) ?? null,
    [presets],
  );
  const adminPresets = useMemo(
    () => filteredPresets.filter(p => p.isAdminPreset),
    [filteredPresets],
  );
  const personalPresets = useMemo(
    () => filteredPresets.filter(p => !p.isAdminPreset),
    [filteredPresets],
  );

  const renderPresetItem = (preset: FilterPreset) => {
    const isActive = preset.id === activePresetId;
    return (
      <PresetItem
        key={preset.id}
        role="option"
        $active={isActive}
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

        <PresetName $active={isActive}>{preset.name}</PresetName>

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
  const hasFiltered = filteredPresets.length > 0;

  return (
    <Container role="listbox" aria-label={t('Пресеты фильтров')}>
      {/* Избранный preset продублирован сверху: виден всегда, даже если
          поиск отфильтровал. Применяется одним кликом. */}
      {defaultPreset && (
        <PinnedBlock>
          <PinnedLabel>{t('Основной')}</PinnedLabel>
          {renderPresetItem(defaultPreset)}
        </PinnedBlock>
      )}

      <ScrollArea>
        {!hasAny && !loading && (
          <EmptyState>{t('Нет сохранённых пресетов')}</EmptyState>
        )}
        {hasAny && !hasFiltered && !loading && searchQuery && (
          <EmptyState>{t('По запросу пресетов не найдено')}</EmptyState>
        )}

        {adminPresets.length > 0 && (
          <Section>
            <SectionHeader
              type="button"
              onClick={() => setAdminOpen(v => !v)}
              aria-expanded={adminOpen}
            >
              <ChevronIcon $open={adminOpen} />
              <span>
                {t('Корпоративные')} ({adminPresets.length})
              </span>
            </SectionHeader>
            {adminOpen && adminPresets.map(renderPresetItem)}
          </Section>
        )}

        {personalPresets.length > 0 && (
          <Section>
            <SectionHeader
              type="button"
              onClick={() => setPersonalOpen(v => !v)}
              aria-expanded={personalOpen}
            >
              <ChevronIcon $open={personalOpen} />
              <span>
                {t('Личные')} ({personalPresets.length})
              </span>
            </SectionHeader>
            {personalOpen && personalPresets.map(renderPresetItem)}
          </Section>
        )}
      </ScrollArea>
    </Container>
  );
};

export default PresetPanelInline;
