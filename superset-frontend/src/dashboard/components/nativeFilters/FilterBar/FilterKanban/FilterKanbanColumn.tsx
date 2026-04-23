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
 */
import { css, styled, t } from '@superset-ui/core';
import { Icons } from '@superset-ui/core/components/Icons';
import {
  type FC,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import { useDrop } from 'react-dnd';
import FilterKanbanCard, { FILTER_CARD_DND_TYPE } from './FilterKanbanCard';

const Column = styled.div<{ $isOver: boolean }>`
  ${({ theme, $isOver }) => css`
    display: flex;
    flex-direction: column;
    gap: ${theme.sizeUnit * 2}px;
    padding: ${theme.sizeUnit * 3}px;
    background: ${theme.colorBgContainer};
    border: 1px solid
      ${$isOver ? theme.colorPrimary : theme.colorBorderSecondary};
    border-radius: ${theme.borderRadius}px;
    /* Высота колонки = расстояние между drawer-header'ом и footer-slot
       с кнопками Применить/Сбросить. Вычисляется от drawer'а:
       max drawer = min(640px, 80vh). Минус 14 handle + 50 head +
       60 footer + 28+24 body-paddings ≈ 208px → content height.
       Колонка ограничена 432px (cap), ниже — пропорционально 80vh.
       При стандартных размерах 640 → 432 колонка, конец виден внутри
       drawer-body, footer с кнопками фиксирован ниже. */
    height: min(432px, calc(80vh - 208px));
    min-height: 160px;
    overflow: hidden;
    transition:
      border-color 160ms ease,
      background 160ms ease;
    ${$isOver &&
    `
      background: ${theme.colorPrimaryBg};
    `}
  `}
`;

const Body = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    gap: ${theme.sizeUnit * 2}px;
    flex: 1;
    min-height: 0;
    box-sizing: border-box;
    overflow-y: auto;
    /* overscroll-behavior: auto — когда колонка проскроллена до
       top/bottom и юзер продолжает крутить колесо, событие wheel
       естественно пробрасывается в родительский drawer body, и он
       подхватывает скролл. Default в браузерах, но явно — защита
       от будущих overrides. */
    overscroll-behavior: auto;
    /* DS 2.0 scrollbar, согласованный с ShellMain и DrawerBody. */
    scrollbar-width: thin;
    scrollbar-color: var(--g300) transparent;
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--g300);
      border-radius: 5px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: var(--g400);
      background-clip: padding-box;
    }
  `}
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.sizeUnit}px;
  margin-bottom: ${({ theme }) => theme.sizeUnit}px;
`;

const Title = styled.h4`
  ${({ theme }) => css`
    flex: 1;
    margin: 0;
    font-size: ${theme.fontSizeSM}px;
    font-weight: ${theme.fontWeightStrong};
    color: ${theme.colorText};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: text;
    border-radius: ${theme.borderRadiusXS}px;
    padding: ${theme.sizeUnit / 2}px ${theme.sizeUnit}px;
    &:hover {
      background: ${theme.colorBgTextHover};
    }
  `}
`;

const TitleInput = styled.input`
  ${({ theme }) => css`
    flex: 1;
    font-size: ${theme.fontSizeSM}px;
    font-weight: ${theme.fontWeightStrong};
    color: ${theme.colorText};
    background: ${theme.colorBgLayout};
    border: 1px solid ${theme.colorPrimaryBorder};
    border-radius: ${theme.borderRadiusXS}px;
    padding: ${theme.sizeUnit / 2}px ${theme.sizeUnit}px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    outline: none;
    min-width: 0;
  `}
`;

const IconBtn = styled.button`
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
      color: ${theme.colorError};
      background: ${theme.colorErrorBg};
    }
    &:focus-visible {
      outline: 2px solid ${theme.colorPrimaryBorder};
      outline-offset: 1px;
    }
  `}
`;

const EmptyHint = styled.div`
  ${({ theme }) => css`
    color: ${theme.colorTextTertiary};
    font-size: ${theme.fontSizeSM}px;
    text-align: center;
    padding: ${theme.sizeUnit * 3}px ${theme.sizeUnit * 2}px;
    border: 1px dashed ${theme.colorBorderSecondary};
    border-radius: ${theme.borderRadius}px;
  `}
`;

interface FilterKanbanColumnProps {
  /** ID категории. null для дефолтного bucket'а «нераспределённые». */
  categoryId: string | null;
  title: string;
  filterIds: string[];
  renderFilterNode: (filterId: string) => ReactNode;
  /** filterId → toCategoryId (null для bucket'а). */
  onMoveFilter: (filterId: string, toCategoryId: string | null) => void;
  /** null — rename запрещён (дефолтный bucket или пресеты). */
  onRename: ((name: string) => void) | null;
  /** null — delete запрещён (дефолтный bucket или пресеты). */
  onDelete: (() => void) | null;
  /** Дефолтная колонка «Нераспределённые» — без rename/delete/add. */
  isDefault?: boolean;
  /** Колонка «Пресеты» — кастомный контент, без rename/delete/add/DnD. */
  isPresetColumn?: boolean;
  /** Кастомный контент (для пресетов). Если задан — карточки не
   *  рендерятся, DnD-drop отключён. */
  customContent?: ReactNode;
  /** Callback ➕ «Добавить фильтр» — открывает `FiltersConfigModal`
   *  для создания/редактирования фильтров. Если undefined — кнопка скрыта
   *  (preset/default колонки). */
  onAddFilter?: () => void;
  /** Дополнительные action-кнопки в правой части head'а (перед delete).
   *  Для preset-колонки: сбросить фильтры, создать, импортировать. */
  headerActions?: ReactNode;
}

const FilterKanbanColumn: FC<FilterKanbanColumnProps> = ({
  categoryId,
  title,
  filterIds,
  renderFilterNode,
  onMoveFilter,
  onRename,
  onDelete,
  isDefault = false,
  isPresetColumn = false,
  customContent,
  onAddFilter,
  headerActions,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const startEdit = useCallback(() => {
    if (!onRename) return;
    setDraft(title);
    setEditing(true);
  }, [onRename, title]);

  const commitEdit = useCallback(() => {
    if (!onRename) {
      setEditing(false);
      return;
    }
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title) onRename(trimmed);
    setEditing(false);
  }, [draft, onRename, title]);

  const cancelEdit = useCallback(() => {
    setDraft(title);
    setEditing(false);
  }, [title]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    },
    [cancelEdit, commitEdit],
  );

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: FILTER_CARD_DND_TYPE,
    canDrop: () => !isPresetColumn,
    drop: (item: { filterId: string }) => {
      if (isPresetColumn) return;
      onMoveFilter(item.filterId, categoryId);
    },
    collect: monitor => ({
      isOver: !isPresetColumn && monitor.isOver({ shallow: true }),
    }),
  }), [categoryId, onMoveFilter, isPresetColumn]);

  const canAddFilter = !isPresetColumn && typeof onAddFilter === 'function';

  return (
    <Column ref={dropRef as any} $isOver={isOver}>
      <Head>
        {editing ? (
          <TitleInput
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={onKeyDown}
            aria-label={t('Переименовать колонку')}
          />
        ) : (
          <Title
            tabIndex={onRename ? 0 : -1}
            onClick={startEdit}
            onKeyDown={e => {
              if (onRename && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                startEdit();
              }
            }}
            title={onRename ? t('Кликните для переименования') : undefined}
          >
            {title || t('Без названия')}
          </Title>
        )}
        {headerActions}
        {canAddFilter && (
          <IconBtn
            type="button"
            onClick={onAddFilter}
            aria-label={t('Добавить или изменить фильтры')}
            title={t('Добавить или изменить фильтры')}
            css={css`
              &:hover {
                color: var(--ant-color-primary);
                background: var(--ant-color-primary-bg);
              }
            `}
          >
            <Icons.PlusOutlined iconSize="s" />
          </IconBtn>
        )}
        {onDelete && !isDefault && !isPresetColumn && (
          <IconBtn
            type="button"
            onClick={onDelete}
            aria-label={t('Удалить колонку')}
            title={t('Удалить колонку')}
          >
            <Icons.DeleteOutlined iconSize="s" />
          </IconBtn>
        )}
      </Head>
      <Body>
        {customContent ? (
          <>{customContent}</>
        ) : filterIds.length === 0 ? (
          <EmptyHint>
            {isDefault
              ? t('Всё распределено')
              : t('Пусто. Добавьте фильтр ➕ или перетащите карточку сюда')}
          </EmptyHint>
        ) : (
          filterIds.map(filterId => (
            <FilterKanbanCard key={filterId} filterId={filterId}>
              {renderFilterNode(filterId)}
            </FilterKanbanCard>
          ))
        )}
      </Body>
    </Column>
  );
};

export default FilterKanbanColumn;
