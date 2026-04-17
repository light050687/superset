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
 */
import { styled, t } from '@superset-ui/core';
import { type FC, useCallback, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import {
  assignCatalogItems,
  moveCatalogFolder,
} from './api';
import { CatalogTree } from './CatalogTree';
import { CatalogAdminModal } from './CatalogAdminModal';
import {
  buildCatalogTree,
  useCatalogFolders,
} from './useCatalogFolders';
import type { DragItemPayload } from './types';

interface CatalogDrawerProps {
  /** Можно ли пользователю управлять каталогом (кнопка «Управление» в футере). */
  canManage?: boolean;
  /** Колбэк при выборе папки — навигация в список дашбордов с фильтром. */
  onSelectFolder?: (folderId: number) => void;
}

const Body = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: ${DS2_VARS.fontSans};
`;

const QuickLinks = styled.div`
  padding: ${DS2_SPACE.s1}px 0 ${DS2_SPACE.s2}px;
  border-bottom: 1px solid ${DS2_VARS.g100};
  margin-bottom: ${DS2_SPACE.s2}px;
`;

const QuickLink = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  width: 100%;
  padding: ${DS2_SPACE.s1}px ${DS2_SPACE.s2}px;
  background: ${({ $active }) =>
    $active ? 'rgba(59, 139, 217, 0.08)' : 'transparent'};
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g600)};
  border: none;
  border-radius: 6px;
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${DS2_VARS.g100};
    color: ${DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: ${DS2_VARS.g500};
  }
`;

const SectionLabel = styled.div`
  font-family: ${DS2_VARS.fontMono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${DS2_VARS.g500};
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s2}px ${DS2_SPACE.s1}px;
`;

const TreeScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${DS2_VARS.g300};
    border-radius: 2px;
  }
`;

const AdminBtn = styled.button`
  display: flex;
  align-items: center;
  gap: ${DS2_SPACE.s2}px;
  width: 100%;
  padding: ${DS2_SPACE.s2}px ${DS2_SPACE.s2}px;
  background: transparent;
  border: 1px solid ${DS2_VARS.g200};
  border-radius: 6px;
  font-family: ${DS2_VARS.fontSans};
  font-size: 12px;
  color: ${DS2_VARS.g700};
  cursor: pointer;

  &:hover {
    border-color: ${DS2_VARS.cSky};
    color: ${DS2_VARS.cSky};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 1px;
  }

  svg {
    width: 13px;
    height: 13px;
  }
`;

const IconHome = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M2 6l6-4 6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1V6z" />
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M8 1l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.8 3.8 14l.8-4.7L1.2 6l4.7-.7z" />
  </svg>
);
const IconClock = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4v4l3 2" />
  </svg>
);
const IconGear = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" />
  </svg>
);

export const CatalogDrawer: FC<CatalogDrawerProps> = ({
  canManage = true,
  onSelectFolder,
}) => {
  const history = useHistory();
  const location = useLocation();
  const { folders, loading, error, refresh } = useCatalogFolders();
  const [adminOpen, setAdminOpen] = useState(false);

  const tree = useMemo(() => buildCatalogTree(folders), [folders]);

  const activeFolderId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('catalog_folder');
    return raw ? Number(raw) : null;
  }, [location.search]);

  const handleSelectFolder = useCallback(
    (folderId: number) => {
      if (onSelectFolder) {
        onSelectFolder(folderId);
        return;
      }
      history.push(`/dashboard/list/?catalog_folder=${folderId}`);
    },
    [history, onSelectFolder],
  );

  const handleFolderMove = useCallback(
    async (folderId: number, newParentId: number | null) => {
      try {
        await moveCatalogFolder(folderId, { parent_id: newParentId });
        await refresh();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Не удалось переместить папку:', err);
      }
    },
    [refresh],
  );

  const handleItemDrop = useCallback(
    async (folderId: number, payload: DragItemPayload) => {
      try {
        await assignCatalogItems(folderId, [
          {
            object_type: payload.objectType,
            object_id: payload.objectId,
          },
        ]);
        await refresh();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Не удалось добавить объект в папку:', err);
      }
    },
    [refresh],
  );

  const isOnHome = location.pathname.startsWith('/superset/welcome');

  return (
    <Body>
      <QuickLinks>
        <QuickLink
          type="button"
          $active={isOnHome}
          onClick={() => history.push('/superset/welcome/')}
        >
          <IconHome />
          {t('Главная')}
        </QuickLink>
        <QuickLink
          type="button"
          $active={false}
          onClick={() =>
            history.push('/dashboard/list/?filters=(favorite:(label:Yes,value:!t))')
          }
        >
          <IconStar />
          {t('Избранное')}
        </QuickLink>
        <QuickLink
          type="button"
          $active={false}
          onClick={() => history.push('/superset/welcome/#recent')}
        >
          <IconClock />
          {t('Недавние')}
        </QuickLink>
      </QuickLinks>

      <SectionLabel>{t('Департаменты')}</SectionLabel>
      <TreeScroll>
        <CatalogTree
          nodes={tree}
          loading={loading}
          error={error}
          activeFolderId={activeFolderId}
          onSelect={handleSelectFolder}
          onFolderMove={handleFolderMove}
          onItemDrop={handleItemDrop}
        />
      </TreeScroll>

      {canManage ? (
        <div style={{ padding: DS2_SPACE.s2 }}>
          <AdminBtn type="button" onClick={() => setAdminOpen(true)}>
            <IconGear />
            {t('Управление каталогом')}
          </AdminBtn>
        </div>
      ) : null}

      <CatalogAdminModal
        open={adminOpen}
        folders={folders}
        onClose={() => setAdminOpen(false)}
        onChanged={refresh}
      />
    </Body>
  );
};
