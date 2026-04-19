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
import type { BentoCardKind, BentoCardSize, BentoItem } from './types';

const Page = styled.div`
  padding: ${DS2_SPACE.s3}px ${DS2_SPACE.s6}px ${DS2_SPACE.s12}px;
  background: ${DS2_VARS.bg};
  /* min-height больше не нужен: скролл-контейнер теперь ShellMain. */
`;

const MainHeader = styled.header`
  display: flex;
  align-items: center;
  padding: ${DS2_SPACE.s2}px 0;
  gap: ${DS2_SPACE.s3}px;
  min-height: 48px;
  margin: 0 0 ${DS2_SPACE.s2}px;
`;

const Title = styled.span`
  font-family: ${DS2_VARS.fontSans};
  font-size: 15px;
  font-weight: 700;
  color: ${DS2_VARS.ink};
`;

const Subtitle = styled.span`
  font-family: ${DS2_VARS.fontMono};
  font-size: 11px;
  color: ${DS2_VARS.g500};
`;

const Spacer = styled.div`
  flex: 1;
`;

const Pills = styled.div`
  display: flex;
  gap: ${DS2_SPACE.s1}px;
  flex-wrap: wrap;
  margin: ${DS2_SPACE.s3}px 0 ${DS2_SPACE.s2}px;
`;

const Pill = styled.button<{ $active: boolean }>`
  font-family: ${DS2_VARS.fontMono};
  font-size: 11px;
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid
    ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g200)};
  background: ${({ $active }) =>
    $active ? 'rgba(59, 139, 217, 0.08)' : 'transparent'};
  color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g500)};
  cursor: pointer;
  transition:
    border-color 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease},
    background 0.12s ${DS2_VARS.ease};
  white-space: nowrap;

  &:hover {
    border-color: ${({ $active }) =>
      $active ? DS2_VARS.cSky : DS2_VARS.g400};
    color: ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.ink)};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

const DeptGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: ${DS2_SPACE.s2}px;
`;

type PillKind = 'all' | BentoCardKind;

const PILL_LABELS: Record<PillKind, string> = {
  all: 'Все',
  dashboard: 'Дашборд',
  chart: 'Диаграмма',
  geo: 'Гео',
  table: 'Таблица',
  doc: 'Документ',
};

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
  const [activePill, setActivePill] = useState<PillKind>('all');

  const rootFolders = useMemo(
    () =>
      folders
        .filter(f => f.parent_id === null)
        .sort((a, b) => a.position - b.position || a.id - b.id),
    [folders],
  );

  const handleSelectFolder = useCallback(
    (id: number) => {
      history.push(`/dashboard/list/?catalog_folder=${id}`);
    },
    [history],
  );

  const filterByPill = useCallback(
    (items: BentoItem[]) =>
      activePill === 'all' ? items : items.filter(i => i.kind === activePill),
    [activePill],
  );

  const favoritesFiltered = filterByPill(favorites);
  const recentsFiltered = filterByPill(recents);

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

  const pillOrder: PillKind[] = [
    'all',
    'dashboard',
    'chart',
    'geo',
    'table',
    'doc',
  ];

  return (
    <Page>
      <MainHeader>
        <Title>{t('Главная')}</Title>
        <Subtitle>{t('Избранное, недавние и департаменты')}</Subtitle>
        <Spacer />
      </MainHeader>

      <Pills role="tablist" aria-label={t('Фильтр по типу')}>
        {pillOrder.map(k => (
          <Pill
            key={k}
            role="tab"
            aria-selected={activePill === k}
            $active={activePill === k}
            type="button"
            onClick={() => setActivePill(k)}
          >
            {t(PILL_LABELS[k])}
          </Pill>
        ))}
      </Pills>

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
          : favoritesFiltered.length === 0
            ? (
              <EmptyBlock>
                {t(
                  'В избранном пока пусто. Нажмите ★ на любой карточке — она появится здесь.',
                )}
              </EmptyBlock>
            )
            : renderBentoItems(favoritesFiltered, favoriteSize)}
      </BentoGrid>

      <SectionLabel title={t('Недавние')} />
      <BentoGrid>
        {loadingRecents
          ? renderSkeletons(3)
          : recentsFiltered.length === 0
            ? (
              <EmptyBlock>
                {t('Недавних просмотров нет.')}
              </EmptyBlock>
            )
            : renderBentoItems(recentsFiltered, () => 'medium')}
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
