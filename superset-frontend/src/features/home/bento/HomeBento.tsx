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
import { useItemToFolderMap } from 'src/features/catalog';
import {
  deriveDefaultFolderName,
  useCatalogColumnLabels,
} from 'src/features/catalog/useCatalogColumnLabels';
import { DS2_SPACE, DS2_VARS } from 'src/theme/ds2';
import type { User, UserWithPermissionsAndRoles } from 'src/types/bootstrapTypes';
import { toggleFavorite } from './api';
import { BentoCard } from './BentoCard';
import {
  BentoGrid,
  EmptyBlock,
  ErrorBlock,
  SectionLabel,
  Skeleton,
} from './BentoLayout';
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

const Spacer = styled.div`
  flex: 1;
`;

const Pills = styled.div`
  display: flex;
  gap: ${DS2_SPACE.s1}px;
  flex-wrap: wrap;
  margin: ${DS2_SPACE.s3}px 0 ${DS2_SPACE.s2}px;
`;

const Pill = styled.button<{ $active: boolean; $disabled?: boolean }>`
  position: relative;
  font-family: ${DS2_VARS.fontMono};
  font-size: 11px;
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid
    ${({ $active }) => ($active ? DS2_VARS.cSky : DS2_VARS.g200)};
  background: ${({ $active }) =>
    $active ? 'rgba(59, 139, 217, 0.08)' : 'transparent'};
  color: ${({ $active, $disabled }) =>
    $disabled ? DS2_VARS.g500 : $active ? DS2_VARS.cSky : DS2_VARS.g500};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.72 : 1)};
  transition:
    border-color 0.12s ${DS2_VARS.ease},
    color 0.12s ${DS2_VARS.ease},
    background 0.12s ${DS2_VARS.ease};
  white-space: nowrap;

  &:hover {
    border-color: ${({ $active, $disabled }) =>
      $disabled ? DS2_VARS.g200 : $active ? DS2_VARS.cSky : DS2_VARS.g400};
    color: ${({ $active, $disabled }) =>
      $disabled
        ? DS2_VARS.g500
        : $active
          ? DS2_VARS.cSky
          : DS2_VARS.ink};
  }

  &:focus-visible {
    outline: 2px solid ${DS2_VARS.cSky};
    outline-offset: 2px;
  }
`;

/* «Скоро» бейдж на pill — единый стиль с CreateDrawer/ToolsDrawer:
   cAmber фон, тёмный текст, моно-шрифт, прилипает к правому-верхнему углу. */
const PillComingSoonBadge = styled.span`
  position: absolute;
  top: -7px;
  right: -8px;
  font-family: ${DS2_VARS.fontMono};
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #0a0a0a;
  background: ${DS2_VARS.cAmber};
  padding: 1px 5px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  pointer-events: none;
  white-space: nowrap;
`;

type PillKind = 'all' | BentoCardKind;

const PILL_LABELS: Record<PillKind, string> = {
  all: 'Все',
  dashboard: 'Дашборд',
  chart: 'Чарт',
  geo: 'Гео',
  table: 'Таблица',
  doc: 'Документ',
};

/* Pill'ы, которые пока не реализованы — показываются с бейджем «Скоро»
   и не переключают фильтр при клике. Синхронизировано с CreateDrawer и
   ToolsDrawer (ext-* плагины таблиц/документов пока в бэклоге). */
const DISABLED_PILLS = new Set<PillKind>(['table', 'doc']);

/** Размеры для favorites: первые две карточки — wide, остальные medium. */
function favoriteSize(index: number): BentoCardSize {
  if (index === 0) return 'wide';
  if (index === 1) return 'wide';
  return 'medium';
}

export interface HomeBentoProps {
  user?: User;
}

/** Админ видит всё. Не-админы на «Главной» видят только dashboards —
 *  чарты скрываются из фильтров и из Избранного/Недавних. Такое правило
 *  обсуждалось: аналитикам нужны чарты в каталоге, но конечным пользователям
 *  на главной они не нужны — чтобы не засорять визуальный скан. */
function isAdminUser(user?: User): boolean {
  if (!user) return false;
  const roles = (user as UserWithPermissionsAndRoles).roles;
  if (!roles) return false;
  return Object.keys(roles).some(
    r => r === 'Admin' || r.toLowerCase() === 'admin',
  );
}

export const HomeBento: FC<React.PropsWithChildren<HomeBentoProps>> = ({ user }) => {
  const { favorites, recents, loadingFavorites, loadingRecents, error, refresh } =
    useBentoData(user?.userId);
  const [activePill, setActivePill] = useState<PillKind>('all');
  const isAdmin = useMemo(() => isAdminUser(user), [user]);
  const { itemFolderMap } = useItemToFolderMap();
  const { labels } = useCatalogColumnLabels();

  /** Обогащает BentoItem полями department/departmentColor из каталога.
   *  Для дефолтной папки «Без департамента» name выводится из названия
   *  колонки департаментов (динамический лейбл). */
  const enrichWithFolder = useCallback(
    (item: BentoItem): BentoItem => {
      const info = itemFolderMap.get(`${item.objectType}:${item.id}`);
      if (!info) return item;
      const name = info.isDefault
        ? deriveDefaultFolderName(labels.dept)
        : info.folderName;
      return {
        ...item,
        department: name,
        departmentColor: info.folderColor ?? undefined,
      };
    },
    [itemFolderMap, labels.dept],
  );

  /** Применяет pill-фильтр + скрывает чарты для не-админов. */
  const filterByPill = useCallback(
    (items: BentoItem[]) => {
      const roleFiltered = isAdmin
        ? items
        : items.filter(i => i.kind !== 'chart' && i.kind !== 'geo');
      return activePill === 'all'
        ? roleFiltered
        : roleFiltered.filter(i => i.kind === activePill);
    },
    [activePill, isAdmin],
  );

  /** Кросс-референс: помечает item.starred=true, если он есть в favorites.
   *  Нужно чтобы recents корректно показывали звезду на уже избранных. */
  const favoriteKeys = useMemo(() => {
    const s = new Set<string>();
    favorites.forEach(f => s.add(`${f.objectType}:${f.id}`));
    return s;
  }, [favorites]);

  const favoritesFiltered = filterByPill(favorites);
  const recentsFiltered = useMemo(
    () =>
      filterByPill(recents).map(item =>
        favoriteKeys.has(`${item.objectType}:${item.id}`)
          ? { ...item, starred: true }
          : item,
      ),
    [recents, filterByPill, favoriteKeys],
  );

  const handleToggleStar = useCallback(
    async (item: BentoItem) => {
      if (item.objectType !== 'dashboard' && item.objectType !== 'chart') {
        return; // для dataset/ai-документа API избранного нет
      }
      try {
        await toggleFavorite(item.objectType, item.id, !!item.starred);
        await refresh();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Не удалось переключить избранное:', err);
      }
    },
    [refresh],
  );

  const renderSkeletons = (count: number) =>
    Array.from({ length: count }, (_, i) => <Skeleton key={`sk-${i}`} />);

  const renderBentoItems = (
    items: BentoItem[],
    sizeFn: (index: number) => BentoCardSize,
  ) =>
    items.map(enrichWithFolder).map((item, i) => (
      <BentoCard
        key={`${item.objectType}-${item.id}-${i}`}
        item={item}
        size={sizeFn(i)}
        showDepartment={!!item.department}
        onToggleStar={handleToggleStar}
      />
    ));

  /* Порядок pill'ов. 'geo' убран — у нас нет отдельного geo-виза в bento,
     гео-чарты шли тем же kind='geo' что и обычные chart'ы, создавая
     пустой фильтр. Таблица/Документ — «скоро». 'chart' показывается
     только админам: конечные пользователи не должны видеть отдельные
     чарты на «Главной» — только дашборды. */
  const pillOrder: PillKind[] = isAdmin
    ? ['all', 'dashboard', 'chart', 'table', 'doc']
    : ['all', 'dashboard', 'table', 'doc'];

  return (
    <Page>
      <MainHeader>
        <Title>{t('Главная')}</Title>
        <Spacer />
      </MainHeader>

      <Pills role="tablist" aria-label={t('Фильтр по типу')}>
        {pillOrder.map(k => {
          const isDisabled = DISABLED_PILLS.has(k);
          return (
            <Pill
              key={k}
              role="tab"
              aria-selected={activePill === k}
              aria-disabled={isDisabled}
              $active={!isDisabled && activePill === k}
              $disabled={isDisabled}
              type="button"
              onClick={() => {
                if (isDisabled) return;
                setActivePill(k);
              }}
              title={isDisabled ? t('Скоро будет доступно') : undefined}
            >
              {t(PILL_LABELS[k])}
              {isDisabled ? (
                <PillComingSoonBadge>{t('Скоро')}</PillComingSoonBadge>
              ) : null}
            </Pill>
          );
        })}
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
    </Page>
  );
};
