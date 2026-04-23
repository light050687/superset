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
 * FilterKanban — grid-UI для фильтров дашборда: распределяет фильтры
 * по user-defined колонкам (категориям). Каждая колонка — drop-target
 * react-dnd, каждая карточка — drag-source. Колонки: add / rename /
 * delete. Нераспределённые фильтры — в bucket'е слева.
 *
 * Интеграция: монтируется вместо `<FilterControls>` в `Vertical.tsx`
 * когда verticalConfig.useKanban=true (пробрасывается из FiltersDrawer).
 * FilterControl рендерится прямо внутри карточки — функциональность
 * ввода не ломается, меняется только layout.
 */
import {
  DataMask,
  DataMaskStateWithId,
  Filter,
  isFilterDivider,
  styled,
  t,
} from '@superset-ui/core';
import { type FC, type ReactNode, useMemo } from 'react';
import { FilterBarOrientation } from 'src/dashboard/types';
import FilterControl from '../FilterControls/FilterControl';
import FilterDivider from '../FilterControls/FilterDivider';
import { useFilters } from '../state';
import { useFilterCategories } from './useFilterCategories';
import FilterKanbanColumn from './FilterKanbanColumn';

const GridWrap = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.sizeUnit * 3}px;
  padding: ${({ theme }) => theme.sizeUnit * 3}px;
  /* Авто-колонки: min 240px, заполнение оставшегося места. 4×2, 4×4,
     сколько влезет — столько рендерим (пользователь добавляет сколько
     нужно, grid распределит сам). */
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  align-items: start;
`;

const AddColBtn = styled.button`
  ${({ theme }) => `
    align-self: start;
    height: 100%;
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${theme.sizeUnit}px;
    background: transparent;
    border: 1px dashed ${theme.colorBorderSecondary};
    border-radius: ${theme.borderRadius}px;
    color: ${theme.colorTextSecondary};
    font-size: ${theme.fontSizeSM}px;
    cursor: pointer;
    transition: all 160ms ease;
    &:hover {
      border-color: ${theme.colorPrimaryBorder};
      color: ${theme.colorPrimary};
      background: ${theme.colorPrimaryBg};
    }
    &:focus-visible {
      outline: 2px solid ${theme.colorPrimaryBorder};
      outline-offset: 2px;
    }
  `}
`;

interface FilterKanbanProps {
  dashboardId: number;
  dataMaskSelected: DataMaskStateWithId;
  onFilterSelectionChange: (filter: Filter, dataMask: DataMask) => void;
  clearAllTriggers?: Record<string, boolean>;
  onClearAllComplete?: (filterId: string) => void;
  /** React-node с PresetButton'ом. Если передан — рендерится первой
   *  колонкой «Пресеты» в kanban-grid'е. */
  presetSlot?: ReactNode;
}

const FilterKanban: FC<FilterKanbanProps> = ({
  dashboardId,
  dataMaskSelected,
  onFilterSelectionChange,
  clearAllTriggers,
  onClearAllComplete,
  presetSlot,
}) => {
  const filters = useFilters();
  const allFilterIds = useMemo(() => Object.keys(filters), [filters]);

  const {
    categories,
    addCategory,
    renameCategory,
    deleteCategory,
    moveFilter,
    uncategorizedFilterIds,
  } = useFilterCategories(dashboardId);

  const uncategorized = useMemo(
    () => uncategorizedFilterIds(allFilterIds),
    [allFilterIds, uncategorizedFilterIds],
  );

  // Мапа id → React-node для рендера одного фильтра. Единая фабрика,
  // чтобы не дублировать логику в каждой колонке.
  const renderFilterNode = (filterId: string) => {
    const filter = filters[filterId];
    if (!filter) return null;
    if (isFilterDivider(filter)) {
      return (
        <FilterDivider
          title={filter.title}
          description={filter.description}
          orientation={FilterBarOrientation.Vertical}
          overflow={false}
        />
      );
    }
    return (
      <FilterControl
        dataMaskSelected={dataMaskSelected}
        filter={{ ...filter, dataMask: dataMaskSelected[filter.id] }}
        onFilterSelectionChange={onFilterSelectionChange}
        inView={false}
        orientation={FilterBarOrientation.Vertical}
        overflow={false}
        clearAllTrigger={clearAllTriggers?.[filter.id]}
        onClearAllComplete={() => onClearAllComplete?.(filter.id)}
      />
    );
  };

  /** Опции «Добавить фильтр» для конкретной категории — все фильтры,
   *  которых нет в ней сейчас. */
  const buildAvailableFor = (currentFilterIds: string[]) => {
    const present = new Set(currentFilterIds);
    return allFilterIds
      .filter(id => !present.has(id) && filters[id] && !isFilterDivider(filters[id]))
      .map(id => ({ id, name: (filters[id] as Filter).name || id }));
  };

  return (
    <GridWrap>
      {/* Пресет-колонка: PresetButton + ActivePresetLabel. Без rename/
          delete/add/DnD — это кастомный контент, не категория. */}
      {presetSlot && (
        <FilterKanbanColumn
          key="__presets__"
          categoryId="__presets__"
          title={t('Пресеты')}
          filterIds={[]}
          renderFilterNode={() => null}
          onMoveFilter={() => {}}
          onRename={null}
          onDelete={null}
          isPresetColumn
          customContent={presetSlot}
        />
      )}
      {/* Бакет с нераспределёнными — всегда после пресетов, без rename/delete. */}
      <FilterKanbanColumn
        key="__uncategorized__"
        categoryId={null}
        title={t('Нераспределённые')}
        filterIds={uncategorized}
        renderFilterNode={renderFilterNode}
        onMoveFilter={moveFilter}
        onRename={null}
        onDelete={null}
        isDefault
      />
      {categories.map(cat => {
        const validIds = cat.filterIds.filter(id => filters[id]);
        return (
          <FilterKanbanColumn
            key={cat.id}
            categoryId={cat.id}
            title={cat.name}
            filterIds={validIds}
            renderFilterNode={renderFilterNode}
            onMoveFilter={moveFilter}
            onRename={name => renameCategory(cat.id, name)}
            onDelete={() => deleteCategory(cat.id)}
            availableFilters={buildAvailableFor(validIds)}
          />
        );
      })}
      <AddColBtn
        type="button"
        onClick={() => addCategory(t('Новая категория'))}
        aria-label={t('Добавить колонку')}
      >
        <span>＋</span>
        <span>{t('Добавить колонку')}</span>
      </AddColBtn>
    </GridWrap>
  );
};

export default FilterKanban;
