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
 * FilterKanbanCard — обёртка вокруг FilterControl внутри Kanban-колонки.
 * Содержит:
 *  - собственный заголовок (с inline-rename по pencil-иконке),
 *  - action-toolbar в правой части (pencil / settings / delete / info),
 *  - drag-handle через react-dnd.
 *
 * FilterControl рендерится как children. Его внутренний title скрыт
 * через scoped CSS (selector `[data-test="filter-control-name"]`),
 * чтобы избежать дублирования заголовка. Этот hack локальный — не
 * меняем upstream FilterControl.tsx.
 */
import { css, styled, t } from '@superset-ui/core';
import { Input, Modal, Popover } from '@superset-ui/core/components';
import { Icons } from '@superset-ui/core/components/Icons';
import {
  Fragment,
  type FC,
  type KeyboardEvent,
  type ReactNode,
  useState,
} from 'react';
import { useDrag } from 'react-dnd';
import { DS2_VARS } from 'src/theme/ds2';

/** react-dnd type для фильтр-карточек внутри kanban. */
export const FILTER_CARD_DND_TYPE = 'filter-kanban-card';

const Card = styled.div<{ $dragging: boolean }>`
  ${({ theme, $dragging }) => css`
    /* Position relative — нужен якорь для absolute-action-toolbar'а. */
    position: relative;
    background: ${DS2_VARS.s};
    border: 1px solid ${theme.colorBorder};
    border-radius: ${theme.borderRadius}px;
    padding: ${theme.sizeUnit * 2}px;
    opacity: ${$dragging ? 0.4 : 1};
    cursor: grab;
    overflow-x: hidden;
    overflow-y: visible;
    & > * {
      min-width: 0;
      max-width: 100%;
    }
    transition:
      border-color 160ms ease,
      opacity 120ms ease;
    &:hover {
      border-color: ${theme.colorPrimaryBorder};
    }
    &:active {
      cursor: grabbing;
    }

    /* Прячем внутренний title FilterControl'а — у нас свой заголовок выше.
       Селектор data-test устойчив к рефактору CSS-классов upstream. */
    [data-test='filter-control-name'] {
      display: none;
    }
  `}
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.sizeUnit}px;
  margin-bottom: ${({ theme }) => theme.sizeUnit}px;
  /* min-width:0 нужен children для корректного flex-shrink заголовка. */
  & > * {
    min-width: 0;
  }
`;

const Title = styled.h4`
  ${({ theme }) => css`
    margin: 0;
    flex: 1;
    font-size: ${theme.fontSizeSM}px;
    font-weight: ${theme.fontWeightStrong};
    color: ${theme.colorText};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `}
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.sizeUnit / 2}px;
  flex-shrink: 0;
`;

const IconBtn = styled.button`
  ${({ theme }) => css`
    background: transparent;
    border: 0;
    padding: ${theme.sizeUnit / 2}px;
    border-radius: ${theme.borderRadius / 2}px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${theme.colorTextSecondary};
    cursor: pointer;
    transition:
      color 120ms ease,
      background 120ms ease;
    &:hover {
      color: ${theme.colorText};
      background: ${theme.colorBgTextHover};
    }
    &:focus-visible {
      outline: 2px solid ${theme.colorPrimaryBorder};
      outline-offset: 1px;
    }
  `}
`;

const RenameInput = styled(Input)`
  ${({ theme }) => css`
    flex: 1;
    font-size: ${theme.fontSizeSM}px;
    font-weight: ${theme.fontWeightStrong};
  `}
`;

const MetaList = styled.dl`
  ${({ theme }) => css`
    margin: 0;
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: ${theme.sizeUnit * 2}px;
    row-gap: ${theme.sizeUnit / 2}px;
    font-size: ${theme.fontSizeSM}px;
    dt {
      color: ${theme.colorTextSecondary};
      font-weight: ${theme.fontWeightNormal};
    }
    dd {
      margin: 0;
      color: ${theme.colorText};
    }
  `}
`;

export interface FilterCardMetadataItem {
  label: string;
  value: ReactNode;
}

interface FilterKanbanCardProps {
  filterId: string;
  filterName?: string;
  onRename?: (newName: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  metadata?: FilterCardMetadataItem[];
  children: ReactNode;
}

const FilterKanbanCard: FC<FilterKanbanCardProps> = ({
  filterId,
  filterName,
  onRename,
  onEdit,
  onDelete,
  metadata,
  children,
}) => {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: FILTER_CARD_DND_TYPE,
      item: { filterId },
      collect: monitor => ({ isDragging: monitor.isDragging() }),
    }),
    [filterId],
  );

  /* inline-rename: переход в режим редактирования по pencil-кнопке. */
  const [isRenaming, setIsRenaming] = useState(false);
  const [draft, setDraft] = useState(filterName ?? '');

  const startRename = () => {
    setDraft(filterName ?? '');
    setIsRenaming(true);
  };

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== filterName && onRename) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setDraft(filterName ?? '');
    setIsRenaming(false);
  };

  const onRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  /* Confirm-удаление через проектный <Modal> (не AntdModal.confirm).
     AntdModal.confirm рендерится в собственном portalContext без наших
     Modal-стилей и в прошлой версии onOk не запускал dispatch.
     Используем state-driven Modal — те же кнопки Cancel/Primary, но
     в проектном дизайне и с прямым доступом к нашему onDelete. */
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const onConfirmDelete = () => {
    setIsConfirmOpen(false);
    onDelete?.();
  };

  const metadataContent = metadata && metadata.length > 0 && (
    <MetaList>
      {metadata.map(item => (
        <Fragment key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </Fragment>
      ))}
    </MetaList>
  );

  return (
    <Card ref={dragRef as any} $dragging={isDragging}>
      {/* Header с тайтлом и actions. Тайтл рендерим всегда, чтобы
          юзер видел имя; внутренний FilterControl-title скрыт CSS'ом. */}
      {filterName !== undefined && (
        <Header>
          {isRenaming ? (
            <RenameInput
              autoFocus
              size="small"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={onRenameKeyDown}
              aria-label={t('Новое имя фильтра')}
            />
          ) : (
            <Title title={filterName}>{filterName}</Title>
          )}
          <Actions>
            {onRename && !isRenaming && (
              <IconBtn
                type="button"
                onClick={startRename}
                aria-label={t('Переименовать')}
                title={t('Переименовать')}
              >
                <Icons.EditOutlined iconSize="s" />
              </IconBtn>
            )}
            {onEdit && (
              <IconBtn
                type="button"
                onClick={onEdit}
                aria-label={t('Изменить')}
                title={t('Изменить')}
              >
                <Icons.SettingOutlined iconSize="s" />
              </IconBtn>
            )}
            {onDelete && (
              <IconBtn
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                aria-label={t('Удалить')}
                title={t('Удалить')}
              >
                <Icons.DeleteOutlined iconSize="s" />
              </IconBtn>
            )}
            {metadataContent && (
              <Popover
                content={metadataContent}
                title={t('О фильтре')}
                trigger="click"
                placement="bottomRight"
                getPopupContainer={() => document.body}
              >
                <IconBtn
                  type="button"
                  aria-label={t('Информация')}
                  title={t('Информация')}
                >
                  <Icons.InfoCircleOutlined iconSize="s" />
                </IconBtn>
              </Popover>
            )}
          </Actions>
        </Header>
      )}
      {children}
      {onDelete && (
        <Modal
          show={isConfirmOpen}
          onHide={() => setIsConfirmOpen(false)}
          title={t('Удалить фильтр?')}
          onHandledPrimaryAction={onConfirmDelete}
          primaryButtonName={t('Удалить')}
          primaryButtonStyle="danger"
          centered
          destroyOnHidden
          name="filter-delete-confirm"
        >
          <p>
            {filterName
              ? t('«%s» будет удалён с дашборда.', filterName)
              : t('Фильтр будет удалён с дашборда.')}
          </p>
        </Modal>
      )}
    </Card>
  );
};

export default FilterKanbanCard;
