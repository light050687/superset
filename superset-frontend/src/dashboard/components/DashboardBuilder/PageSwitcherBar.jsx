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
import { useDispatch, useSelector } from 'react-redux';
import { css, t, styled, useTheme } from '@superset-ui/core';
import { Icons } from '@superset-ui/core/components/Icons';
import { Tooltip } from '@superset-ui/core/components';
import { setDirectPathToChild } from 'src/dashboard/actions/dashboardState';
import {
  updateComponents,
  createComponent,
  deleteComponent,
  copyPage,
} from 'src/dashboard/actions/dashboardLayout';
import { PAGE_TYPE } from 'src/dashboard/util/componentTypes';
import { NEW_PAGES_ID } from 'src/dashboard/util/constants';
import findParentId from 'src/dashboard/util/findParentId';
import getDirectPathToTabIndex from 'src/dashboard/util/getDirectPathToTabIndex';

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colorBgContainer};
  border-bottom: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  flex-wrap: wrap;
  min-height: 44px;
`;

const PageButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-radius: 6px;
  background: ${({ theme, active }) =>
    active ? theme.colorPrimary : theme.colorBgContainer};
  color: ${({ theme, active }) =>
    active ? '#fff' : theme.colorText};
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: ${({ theme }) => theme.typography?.families?.sansSerif || 'inherit'};
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    background: ${({ theme, active }) =>
      active ? theme.colorPrimary : theme.colorBgTextHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colorPrimary};
    outline-offset: 2px;
  }
`;

const ActionIcon = styled.span`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  opacity: 0.6;
  font-size: 12px;

  &:hover {
    opacity: 1;
  }
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px dashed ${({ theme }) => theme.colorBorderSecondary};
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.colorTextSecondary};
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colorPrimary};
    color: ${({ theme }) => theme.colorPrimary};
  }
`;

const PageNameInput = styled.input`
  border: none;
  background: transparent;
  color: inherit;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  outline: none;
  padding: 0;
  width: auto;
  min-width: 60px;
`;

export default function PageSwitcherBar({ pagesComponent, editMode }) {
  const dispatch = useDispatch();
  const dashboardLayout = useSelector(
    state => state.dashboardLayout.present,
  );
  const directPathToChild = useSelector(
    state => state.dashboardState.directPathToChild,
  );

  const [editingPageId, setEditingPageId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const pageIds = pagesComponent?.children || [];
  const pagesId = pagesComponent?.id;

  // Determine active page from directPathToChild
  const activePageId = pageIds.find(pageId =>
    directPathToChild?.includes(pageId),
  ) || pageIds[0];

  const handlePageClick = useCallback(
    (pageId) => {
      if (!pagesComponent) return;
      const pageIndex = pageIds.indexOf(pageId);
      const pathToPage = getDirectPathToTabIndex(pagesComponent, pageIndex);
      dispatch(setDirectPathToChild(pathToPage));
    },
    [dispatch, pagesComponent, pageIds],
  );

  const handleAddPage = useCallback(() => {
    if (!pagesId) return;
    dispatch(
      createComponent({
        destination: {
          id: pagesId,
          type: pagesComponent.type,
          index: pageIds.length,
        },
        dragging: {
          id: NEW_PAGES_ID,
          type: PAGE_TYPE,
        },
      }),
    );
  }, [dispatch, pagesId, pagesComponent, pageIds]);

  const handleDeletePage = useCallback(
    (pageId) => {
      if (pageIds.length <= 1) return;
      dispatch(deleteComponent(pageId, pagesId));
      // Switch to first remaining page
      const remaining = pageIds.filter(id => id !== pageId);
      if (remaining.length > 0) {
        const pathToPage = getDirectPathToTabIndex(
          { ...pagesComponent, children: remaining },
          0,
        );
        dispatch(setDirectPathToChild(pathToPage));
      }
    },
    [dispatch, pageIds, pagesId, pagesComponent],
  );

  const handleCopyPage = useCallback(
    (pageId) => {
      dispatch(copyPage(pageId, pagesId));
    },
    [dispatch, pagesId],
  );

  const handleStartRename = useCallback(
    (pageId) => {
      const page = dashboardLayout[pageId];
      setEditingPageId(pageId);
      setEditingName(page?.meta?.text || '');
    },
    [dashboardLayout],
  );

  const handleFinishRename = useCallback(() => {
    if (editingPageId) {
      const page = dashboardLayout[editingPageId];
      if (page && editingName !== page.meta?.text) {
        dispatch(
          updateComponents({
            [editingPageId]: {
              ...page,
              meta: { ...page.meta, text: editingName },
            },
          }),
        );
      }
    }
    setEditingPageId(null);
    setEditingName('');
  }, [dispatch, editingPageId, editingName, dashboardLayout]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleFinishRename();
      } else if (e.key === 'Escape') {
        setEditingPageId(null);
        setEditingName('');
      }
    },
    [handleFinishRename],
  );

  return (
    <Bar role="tablist" aria-label={t('Страницы дашборда')}>
      {pageIds.map((pageId) => {
        const page = dashboardLayout[pageId];
        const pageName = page?.meta?.text || page?.meta?.defaultText || t('Страница');
        const isActive = pageId === activePageId;
        const isEditing = editingPageId === pageId;

        return (
          <PageButton
            key={pageId}
            role="tab"
            aria-selected={isActive}
            active={isActive}
            onClick={() => handlePageClick(pageId)}
          >
            {isEditing ? (
              <PageNameInput
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={handleKeyDown}
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span onDoubleClick={() => editMode && handleStartRename(pageId)}>
                {pageName}
              </span>
            )}
            {editMode && !isEditing && (
              <>
                <Tooltip title={t('Переименовать')}>
                  <ActionIcon
                    onClick={e => {
                      e.stopPropagation();
                      handleStartRename(pageId);
                    }}
                  >
                    <Icons.EditOutlined iconSize="s" />
                  </ActionIcon>
                </Tooltip>
                <Tooltip title={t('Копировать страницу')}>
                  <ActionIcon
                    onClick={e => {
                      e.stopPropagation();
                      handleCopyPage(pageId);
                    }}
                  >
                    <Icons.CopyOutlined iconSize="s" />
                  </ActionIcon>
                </Tooltip>
                {pageIds.length > 1 && (
                  <Tooltip title={t('Удалить страницу')}>
                    <ActionIcon
                      onClick={e => {
                        e.stopPropagation();
                        handleDeletePage(pageId);
                      }}
                    >
                      <Icons.CloseOutlined iconSize="s" />
                    </ActionIcon>
                  </Tooltip>
                )}
              </>
            )}
          </PageButton>
        );
      })}
      {editMode && (
        <AddButton onClick={handleAddPage}>
          <Icons.PlusSmall iconSize="s" />
          {t('Добавить страницу')}
        </AddButton>
      )}
    </Bar>
  );
}
