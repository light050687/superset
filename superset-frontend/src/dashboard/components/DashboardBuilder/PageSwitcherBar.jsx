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
import { css, t } from '@superset-ui/core';
import {
  updateComponents,
  deleteComponent,
  copyPage,
} from 'src/dashboard/actions/dashboardLayout';
import {
  setDirectPathToChild,
  setActivePagePath,
} from 'src/dashboard/actions/dashboardState';
import { PAGE_TYPE } from 'src/dashboard/util/componentTypes';
import { NEW_PAGES_ID } from 'src/dashboard/util/constants';
import newComponentFactory from 'src/dashboard/util/newComponentFactory';
import getDirectPathToTabIndex from 'src/dashboard/util/getDirectPathToTabIndex';

export default function PageSwitcherBar({ pagesComponent, editMode }) {
  const dispatch = useDispatch();
  const dashboardLayout = useSelector(state => state.dashboardLayout.present);
  const activePagePath = useSelector(
    state => state.dashboardState.activePagePath ?? [],
  );
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingName, setEditingName] = useState('');

  if (!pagesComponent) return null;

  const pageIds = pagesComponent.children || [];
  const pagesId = pagesComponent.id;

  const activePageId =
    pageIds.find(pid => activePagePath?.includes(pid)) || pageIds[0];

  const handlePageClick = useCallback(
    pageId => {
      const idx = pageIds.indexOf(pageId);
      const path = getDirectPathToTabIndex(pagesComponent, idx);
      dispatch(setActivePagePath(path));
      dispatch(setDirectPathToChild(path));
    },
    [dispatch, pagesComponent, pageIds],
  );

  const handleAddPage = useCallback(() => {
    const newPage = newComponentFactory(PAGE_TYPE);
    newPage.parents = [pagesComponent.id];
    const nextChildren = [...pageIds, newPage.id];
    dispatch(
      updateComponents({
        [newPage.id]: newPage,
        [pagesId]: { ...pagesComponent, children: nextChildren },
      }),
    );
  }, [dispatch, pagesId, pagesComponent, pageIds]);

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
      role="tablist"
      css={css`
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-bottom: 1px solid #e8e8e8;
        background: #fff;
        flex-wrap: wrap;
        min-height: 44px;
      `}
    >
      {pageIds.map(pageId => {
        const page = dashboardLayout[pageId];
        const name =
          page?.meta?.text || page?.meta?.defaultText || t('Страница');
        const isActive = pageId === activePageId;
        const isEditing = editingPageId === pageId;

        return (
          <button
            key={pageId}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handlePageClick(pageId)}
            css={css`
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 6px 14px;
              border: 1px solid ${isActive ? '#1890ff' : '#d9d9d9'};
              border-radius: 6px;
              background: ${isActive ? '#1890ff' : '#fff'};
              color: ${isActive ? '#fff' : '#333'};
              cursor: pointer;
              font-size: var(--fs-interactive);
              font-weight: 500;
              white-space: nowrap;
              &:hover {
                background: ${isActive ? '#1890ff' : '#f5f5f5'};
              }
            `}
          >
            {isEditing ? (
              <input
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={handleKeyDown}
                autoFocus
                onClick={e => e.stopPropagation()}
                css={css`
                  border: none;
                  background: transparent;
                  color: inherit;
                  font: inherit;
                  outline: none;
                  padding: 0;
                  width: 80px;
                `}
              />
            ) : (
              <span
                onDoubleClick={() => editMode && handleStartRename(pageId)}
              >
                {name}
              </span>
            )}
            {editMode && !isEditing && (
              <>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={e => {
                    e.stopPropagation();
                    handleStartRename(pageId);
                  }}
                  css={css`
                    cursor: pointer;
                    opacity: 0.6;
                    font-size: var(--fs-micro);
                    &:hover {
                      opacity: 1;
                    }
                  `}
                >
                  ✏
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={e => {
                    e.stopPropagation();
                    handleCopyPage(pageId);
                  }}
                  css={css`
                    cursor: pointer;
                    opacity: 0.6;
                    font-size: var(--fs-micro);
                    &:hover {
                      opacity: 1;
                    }
                  `}
                >
                  📋
                </span>
                {pageIds.length > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={e => {
                      e.stopPropagation();
                      handleDeletePage(pageId);
                    }}
                    css={css`
                      cursor: pointer;
                      opacity: 0.6;
                      font-size: var(--fs-micro);
                      &:hover {
                        opacity: 1;
                      }
                    `}
                  >
                    ✕
                  </span>
                )}
              </>
            )}
          </button>
        );
      })}
      {editMode && (
        <button
          type="button"
          onClick={handleAddPage}
          css={css`
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            border: 1px dashed #d9d9d9;
            border-radius: 6px;
            background: transparent;
            color: #999;
            cursor: pointer;
            font-size: var(--fs-interactive);
            &:hover {
              border-color: #1890ff;
              color: #1890ff;
            }
          `}
        >
          + {t('Добавить страницу')}
        </button>
      )}
    </div>
  );
}
