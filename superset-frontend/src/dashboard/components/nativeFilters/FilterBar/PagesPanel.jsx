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
import { css, t, useTheme } from '@superset-ui/core';
import { Icons } from '@superset-ui/core/components/Icons';
import {
  updateComponents,
  deleteComponent,
  copyPage,
  createTopLevelPages,
} from 'src/dashboard/actions/dashboardLayout';
import { setDirectPathToChild } from 'src/dashboard/actions/dashboardState';
import { PAGE_TYPE, PAGES_TYPE } from 'src/dashboard/util/componentTypes';
import { DASHBOARD_ROOT_ID } from 'src/dashboard/util/constants';
import newComponentFactory from 'src/dashboard/util/newComponentFactory';
import getDirectPathToTabIndex from 'src/dashboard/util/getDirectPathToTabIndex';

const PAGE_NAME_MAX_LENGTH = 30;

export default function PagesPanel({ topLevelPages, editMode, onClose }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const dashboardLayout = useSelector(state => state.dashboardLayout.present);
  const directPathToChild = useSelector(
    state => state.dashboardState.directPathToChild,
  );
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const pageIds = topLevelPages?.children || [];
  const pagesId = topLevelPages?.id;

  const activePageId =
    pageIds.find(pid => directPathToChild?.includes(pid)) || pageIds[0];

  const handlePageClick = useCallback(
    pageId => {
      if (!topLevelPages) return;
      const idx = pageIds.indexOf(pageId);
      const path = getDirectPathToTabIndex(topLevelPages, idx);
      dispatch(setDirectPathToChild(path));
      if (onClose) onClose();
    },
    [dispatch, topLevelPages, pageIds, onClose],
  );

  const handleAddPage = useCallback(() => {
    if (!topLevelPages) {
      // First time: create PAGES structure
      dispatch(
        createTopLevelPages({
          source: {
            id: 'NEW_COMPONENTS_SOURCE_ID',
            type: 'NEW_COMPONENT_SOURCE',
            index: 0,
          },
          dragging: { id: 'NEW_PAGES_ID', type: PAGES_TYPE },
          destination: { id: DASHBOARD_ROOT_ID, type: 'ROOT', index: 0 },
        }),
      );
      return;
    }
    // Add new page to existing PAGES
    const newPage = newComponentFactory(PAGE_TYPE);
    newPage.parents = [pagesId];
    const nextChildren = [...pageIds, newPage.id];
    dispatch(
      updateComponents({
        [newPage.id]: newPage,
        [pagesId]: { ...topLevelPages, children: nextChildren },
      }),
    );
  }, [dispatch, topLevelPages, pagesId, pageIds]);

  const handleDeletePage = useCallback(
    pageId => {
      if (pageIds.length <= 1) return;
      dispatch(deleteComponent(pageId, pagesId));
    },
    [dispatch, pageIds, pagesId],
  );

  const handleCopyPage = useCallback(
    pageId => {
      dispatch(copyPage(pageId, pagesId));
    },
    [dispatch, pagesId],
  );

  const handleStartRename = useCallback(
    pageId => {
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
  }, [dispatch, editingPageId, editingName, dashboardLayout]);

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Enter') handleFinishRename();
      if (e.key === 'Escape') setEditingPageId(null);
    },
    [handleFinishRename],
  );

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        height: 100%;
      `}
    >
      {/* Header */}
      <div
        css={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: ${theme.sizeUnit * 4}px;
          border-bottom: 1px solid ${theme.colorSplit};
        `}
      >
        <span
          css={css`
            font-weight: 600;
            font-size: 14px;
          `}
        >
          {t('Страницы')}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Закрыть')}
          css={css`
            border: none;
            background: none;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            color: ${theme.colorTextTertiary};
            &:hover {
              color: ${theme.colorText};
            }
          `}
        >
          <Icons.CloseOutlined iconSize="m" />
        </button>
      </div>

      {/* Page list */}
      <div
        css={css`
          flex: 1;
          overflow: auto;
          padding: ${theme.sizeUnit * 2}px;
        `}
      >
        {pageIds.map(pageId => {
          const page = dashboardLayout[pageId];
          const name =
            page?.meta?.text || page?.meta?.defaultText || t('Страница');
          const isActive = pageId === activePageId;
          const isEditing = editingPageId === pageId;

          return (
            <div
              key={pageId}
              role="button"
              tabIndex={0}
              onClick={() => !isEditing && handlePageClick(pageId)}
              onKeyDown={e =>
                e.key === 'Enter' && !isEditing && handlePageClick(pageId)
              }
              css={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: ${theme.sizeUnit * 2}px ${theme.sizeUnit * 3}px;
                margin-bottom: ${theme.sizeUnit}px;
                border-radius: 6px;
                cursor: pointer;
                background: ${isActive ? theme.colorPrimaryBg : 'transparent'};
                border: 1px solid
                  ${isActive ? theme.colorPrimary : 'transparent'};
                &:hover {
                  background: ${isActive
                    ? theme.colorPrimaryBg
                    : theme.colorBgTextHover};
                }
              `}
            >
              {isEditing ? (
                <input
                  value={editingName}
                  onChange={e =>
                    setEditingName(e.target.value.slice(0, PAGE_NAME_MAX_LENGTH))
                  }
                  onBlur={handleFinishRename}
                  onKeyDown={handleKeyDown}
                  maxLength={PAGE_NAME_MAX_LENGTH}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  css={css`
                    border: 1px solid ${theme.colorPrimary};
                    border-radius: 4px;
                    padding: 2px 6px;
                    font-size: 13px;
                    flex: 1;
                    outline: none;
                    background: ${theme.colorBgContainer};
                    color: ${theme.colorText};
                  `}
                />
              ) : (
                <span
                  css={css`
                    font-size: 13px;
                    font-weight: ${isActive ? 600 : 400};
                    color: ${isActive
                      ? theme.colorPrimary
                      : theme.colorText};
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  `}
                  onDoubleClick={e => {
                    if (editMode) {
                      e.stopPropagation();
                      handleStartRename(pageId);
                    }
                  }}
                >
                  {name}
                </span>
              )}
              {editMode && !isEditing && (
                <div
                  css={css`
                    display: flex;
                    gap: 4px;
                    margin-left: 8px;
                    flex-shrink: 0;
                  `}
                >
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleStartRename(pageId);
                    }}
                    aria-label={t('Переименовать')}
                    css={css`
                      border: none;
                      background: none;
                      cursor: pointer;
                      padding: 2px;
                      opacity: 0.5;
                      &:hover {
                        opacity: 1;
                      }
                    `}
                  >
                    <Icons.EditOutlined iconSize="s" />
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleCopyPage(pageId);
                    }}
                    aria-label={t('Копировать страницу')}
                    css={css`
                      border: none;
                      background: none;
                      cursor: pointer;
                      padding: 2px;
                      opacity: 0.5;
                      &:hover {
                        opacity: 1;
                      }
                    `}
                  >
                    <Icons.CopyOutlined iconSize="s" />
                  </button>
                  {pageIds.length > 1 && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeletePage(pageId);
                      }}
                      aria-label={t('Удалить страницу')}
                      css={css`
                        border: none;
                        background: none;
                        cursor: pointer;
                        padding: 2px;
                        opacity: 0.5;
                        color: ${theme.colorError};
                        &:hover {
                          opacity: 1;
                        }
                      `}
                    >
                      <Icons.CloseOutlined iconSize="s" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add button (edit mode only) */}
      {editMode && (
        <div
          css={css`
            padding: ${theme.sizeUnit * 2}px ${theme.sizeUnit * 4}px
              ${theme.sizeUnit * 4}px;
          `}
        >
          <button
            type="button"
            onClick={handleAddPage}
            css={css`
              width: 100%;
              padding: ${theme.sizeUnit * 2}px;
              border: 1px dashed ${theme.colorBorderSecondary};
              border-radius: 6px;
              background: transparent;
              color: ${theme.colorTextSecondary};
              cursor: pointer;
              font-size: 13px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              &:hover {
                border-color: ${theme.colorPrimary};
                color: ${theme.colorPrimary};
              }
            `}
          >
            <Icons.PlusSmall iconSize="s" />
            {t('Добавить страницу')}
          </button>
        </div>
      )}
    </div>
  );
}
