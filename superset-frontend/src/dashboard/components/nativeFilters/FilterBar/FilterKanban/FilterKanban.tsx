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
import { type FC, useMemo } from 'react';
import { FilterBarOrientation } from 'src/dashboard/types';
import FilterControl from '../FilterControls/FilterControl';
import FilterDivider from '../FilterControls/FilterDivider';
import { useFilters } from '../state';
import { useFilterConfigModal } from '../FilterConfigurationLink/useFilterConfigModal';
import { useFilterCategories } from './useFilterCategories';
import { useFilterSearch } from './FilterSearchContext';
import FilterKanbanColumn from './FilterKanbanColumn';
import KanbanPresetSection, {
  type KanbanPresetSectionProps,
} from './KanbanPresetSection';

const GridWrap = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.sizeUnit * 3}px;
  /* Горизонтальный padding = 0: drawer-body уже имеет padding 4px 22px
     18px, этого хватает, чтобы левая кромка первой колонки совпала с
     левой кромкой drawer-заголовка «ФИЛЬТРЫ ДАШБОРДА», а правая кромка
     последней колонки — с правой кромкой крестика. Вертикальный
     padding сохраняем для воздуха между scrollbar и верхом/низом. */
  padding: ${({ theme }) => theme.sizeUnit * 3}px 0;
  /* Жёстко 4 колонки в ряд. Каждая занимает 1fr — равное деление
     доступной ширины (минимум 180px, иначе wrap). Пятый-плюс элемент
     (например «+ Добавить колонку») уходит на следующий ряд. */
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  align-items: start;
`;

const AddColBtn = styled.button`
  ${({ theme }) => `
    align-self: start;
    /* box-sizing: border-box — чтобы border 1px не давал AddColBtn
       лишних 2px над row height при height:100%. См. Column —
       та же защита от 1px overflow у DrawerBody. */
    box-sizing: border-box;
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
  /** Контекст inline-preset-колонки — если задан, рендерим preset-
   *  секцию первой колонкой (PresetPanelInline + header actions). */
  kanbanPresetCtx?: KanbanPresetSectionProps;
}

const FilterKanban: FC<FilterKanbanProps> = ({
  dashboardId,
  dataMaskSelected,
  onFilterSelectionChange,
  clearAllTriggers,
  onClearAllComplete,
  kanbanPresetCtx,
}) => {
  const filters = useFilters();
  const allFilterIds = useMemo(() => Object.keys(filters), [filters]);
  const { query } = useFilterSearch();
  const normalizedQuery = query.trim().toLowerCase();

  /* Модалка «Add and edit filters» — родная FiltersConfigModal. Юзер
     открывает её по клику ➕ в любой колонке kanban'а (unified add-
     flow). После Save новые фильтры автоматом попадают в «Нераспре-
     делённые» (как нераспределённые — юзер dragg'ает в нужную
     колонку либо использует ➕ выбрать категорию). */
  const { openFilterConfigModal, FilterConfigModalComponent } =
    useFilterConfigModal({ dashboardId });

  const {
    categories,
    uncategorizedName,
    presetsName,
    addCategory,
    renameCategory,
    renameSpecial,
    deleteCategory,
    moveFilter,
    uncategorizedFilterIds,
  } = useFilterCategories(dashboardId);

  const uncategorized = useMemo(
    () => uncategorizedFilterIds(allFilterIds),
    [allFilterIds, uncategorizedFilterIds],
  );

  /** Фильтрует массив filterId по глобальному query (по filter.name). */
  const applySearch = (ids: string[]): string[] => {
    if (!normalizedQuery) return ids;
    return ids.filter(id => {
      const f = filters[id];
      if (!f) return false;
      if (isFilterDivider(f)) return false;
      return ((f as Filter).name || '').toLowerCase().includes(normalizedQuery);
    });
  };

  const uncategorizedFiltered = useMemo(
    () => applySearch(uncategorized),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uncategorized, normalizedQuery, filters],
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

  return (
    <GridWrap>
      {/* Preset-колонка с inline-panel (search + Корпоративные/Личные
          collapsible + pinned favorite) и header actions (сбросить /
          создать / импорт). */}
      {kanbanPresetCtx && (
        <KanbanPresetSection
          key="__presets__"
          {...kanbanPresetCtx}
          title={presetsName || t('Пресеты')}
          onRename={name => renameSpecial('presets', name)}
        />
      )}
      {/* Бакет с нераспределёнными — после пресетов. Rename разрешён
          (хранится в useFilterCategories.uncategorizedName), delete нет. */}
      <FilterKanbanColumn
        key="__uncategorized__"
        categoryId={null}
        title={uncategorizedName || t('Нераспределённые')}
        filterIds={uncategorizedFiltered}
        renderFilterNode={renderFilterNode}
        onMoveFilter={moveFilter}
        onRename={name => renameSpecial('uncategorized', name)}
        onDelete={null}
        isDefault
        onAddFilter={openFilterConfigModal}
      />
      {categories.map(cat => {
        const validIds = cat.filterIds.filter(id => filters[id]);
        const filteredIds = applySearch(validIds);
        // Скрываем колонку, если поиск активен и нет совпадений.
        if (normalizedQuery && filteredIds.length === 0) return null;
        return (
          <FilterKanbanColumn
            key={cat.id}
            categoryId={cat.id}
            title={cat.name}
            filterIds={filteredIds}
            renderFilterNode={renderFilterNode}
            onMoveFilter={moveFilter}
            onRename={name => renameCategory(cat.id, name)}
            onDelete={() => deleteCategory(cat.id)}
            onAddFilter={openFilterConfigModal}
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
      {FilterConfigModalComponent}
    </GridWrap>
  );
};

export default FilterKanban;
