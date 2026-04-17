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
import { type FC, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useCatalogFolders } from 'src/features/catalog';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import type { User } from 'src/types/bootstrapTypes';
import { BentoCard } from './BentoCard';
import {
  BentoGrid,
  EmptyBlock,
  ErrorBlock,
  SectionLabel,
  Skeleton,
} from './BentoLayout';
import { DepartmentTile } from './DepartmentTile';
import { useBentoData } from './useBentoData';
import type { BentoCardSize, BentoItem } from './types';

const Page = styled.div`
  padding: ${DS2_SPACE.s4}px ${DS2_SPACE.s6}px ${DS2_SPACE.s12}px;
  background: ${DS2_VARS.bg};
  min-height: 100%;
`;

const Header = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: ${DS2_SPACE.s3}px;
`;

const Title = styled.h1`
  font-family: ${DS2_VARS.fontSans};
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${DS2_VARS.ink};
  margin: 0;
`;

const Subtitle = styled.p`
  font-family: ${DS2_VARS.fontMono};
  font-size: 11px;
  color: ${DS2_VARS.g500};
  margin: 0;
  align-self: flex-end;
`;

const DeptGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: ${DS2_SPACE.s2}px;
`;

/** Размеры для favorites: первые две карточки — wide, остальные medium. */
function favoriteSize(index: number): BentoCardSize {
  if (index === 0) return 'wide';
  if (index === 1) return 'wide';
  return 'medium';
}

export interface HomeBentoProps {
  user?: User;
}

export const HomeBento: FC<HomeBentoProps> = ({ user }) => {
  const history = useHistory();
  const { favorites, recents, loadingFavorites, loadingRecents, error, refresh } =
    useBentoData(user?.userId);
  const {
    folders,
    loading: foldersLoading,
    error: foldersError,
  } = useCatalogFolders();

  const rootFolders = useMemo(
    () =>
      folders
        .filter(f => f.parent_id === null)
        .sort((a, b) => a.position - b.position || a.id - b.id),
    [folders],
  );

  const greeting = useMemo(() => {
    const firstName = user?.firstName ?? user?.username ?? '';
    if (!firstName) return t('Добро пожаловать');
    return t('Привет, %s', firstName);
  }, [user]);

  const handleSelectFolder = useCallback(
    (id: number) => {
      history.push(`/dashboard/list/?catalog_folder=${id}`);
    },
    [history],
  );

  const renderSkeletons = (count: number) =>
    Array.from({ length: count }, (_, i) => <Skeleton key={`sk-${i}`} />);

  const renderBentoItems = (
    items: BentoItem[],
    sizeFn: (index: number) => BentoCardSize,
  ) =>
    items.map((item, i) => (
      <BentoCard
        key={`${item.objectType}-${item.id}-${i}`}
        item={item}
        size={sizeFn(i)}
        showDepartment={!!item.department}
      />
    ));

  return (
    <Page>
      <Header>
        <Title>{greeting}</Title>
        <Subtitle>
          {t(
            'Избранное, недавние просмотры и департаменты',
          )}
        </Subtitle>
      </Header>

      {error ? (
        <BentoGrid>
          <ErrorBlock>
            {t('Не удалось загрузить данные:')} {error}
          </ErrorBlock>
        </BentoGrid>
      ) : null}

      <SectionLabel title={t('Избранное')} />
      <BentoGrid>
        {loadingFavorites
          ? renderSkeletons(3)
          : favorites.length === 0
            ? (
              <EmptyBlock>
                {t(
                  'В избранном пока пусто. Нажмите ★ на любой карточке — она появится здесь.',
                )}
              </EmptyBlock>
            )
            : renderBentoItems(favorites, favoriteSize)}
      </BentoGrid>

      <SectionLabel title={t('Недавние')} />
      <BentoGrid>
        {loadingRecents
          ? renderSkeletons(3)
          : recents.length === 0
            ? (
              <EmptyBlock>
                {t('Недавних просмотров нет.')}
              </EmptyBlock>
            )
            : renderBentoItems(recents, () => 'medium')}
      </BentoGrid>

      <SectionLabel title={t('Департаменты')} />
      {foldersError ? (
        <EmptyBlock>{foldersError}</EmptyBlock>
      ) : foldersLoading && rootFolders.length === 0 ? (
        <DeptGrid>
          {renderSkeletons(6).map((s, i) => (
            <div key={i} style={{ height: 74 }}>
              {s}
            </div>
          ))}
        </DeptGrid>
      ) : rootFolders.length === 0 ? (
        <EmptyBlock>
          {t(
            'Папок каталога пока нет. Создайте департаменты через «Каталог → Управление».',
          )}
        </EmptyBlock>
      ) : (
        <DeptGrid>
          {rootFolders.map(folder => (
            <DepartmentTile
              key={folder.id}
              folder={folder}
              onClick={f => handleSelectFolder(f.id)}
              onItemDropped={refresh}
            />
          ))}
        </DeptGrid>
      )}
    </Page>
  );
};
